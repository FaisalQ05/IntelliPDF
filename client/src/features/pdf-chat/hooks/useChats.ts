import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { get, post, del } from "@/shared/api/methods"
import { queryKeys } from "@/shared/api/query-keys"
import type { ApiResponse } from "@/shared/types/api/api.types"
import type { Chat, ChatMessage, Citation } from "../types/pdf-chat.types"
import { streamChatMessage } from "../services/chat-stream.service"

export const useGetChats = () => {
  return useQuery({
    queryKey: queryKeys.pdfChat.chats(),
    queryFn: async () => {
      const res = await get<ApiResponse<Chat[]>>("/pdf-chat/chats")
      if (!res.success) throw new Error(res.message)
      return res.data
    },
  })
}

export const useCreateChat = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (documentId: string) => {
      const res = await post<ApiResponse<Chat>>("/pdf-chat/chats", { documentId })
      if (!res.success) throw new Error(res.message)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pdfChat.chats() })
    },
  })
}

export const useDeleteChat = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await del<ApiResponse<void>>(`/pdf-chat/chats/${id}`)
      if (!res.success) throw new Error(res.message)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pdfChat.chats() })
    },
  })
}

export const useGetMessages = (chatId: string | null) => {
  return useQuery({
    queryKey: queryKeys.pdfChat.messages(chatId!),
    queryFn: async () => {
      const res = await get<ApiResponse<ChatMessage[]>>(`/pdf-chat/chats/${chatId}/messages`)
      if (!res.success) throw new Error(res.message)
      return res.data
    },
    enabled: !!chatId,
  })
}

export const useSendMessage = (chatId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (content: string) => {
      const tempId = `temp-${Date.now()}`
      let fullContent = ""
      let hasOptimisticMessage = false

      try {
        for await (const event of streamChatMessage(chatId, content)) {
          if (event.type === "user_message" && !hasOptimisticMessage) {
                  // We could update cache with user message, but it's easier to just append both
                  queryClient.setQueryData(
                    queryKeys.pdfChat.messages(chatId),
                    (old: ChatMessage[] | undefined) => {
                      if (!old) return []
                      return [
                        ...old, 
                        event.message,
                        {
                          id: tempId,
                          chatId,
                          role: "ASSISTANT",
                          content: "",
                          createdAt: new Date().toISOString()
                        }
                      ]
                    }
                  )
            hasOptimisticMessage = true
          } else if (event.type === "chunk") {
            fullContent += event.content
                  
                  queryClient.setQueryData(
                    queryKeys.pdfChat.messages(chatId),
                    (old: ChatMessage[] | undefined) => {
                      if (!old) return old
                      return old.map(msg => 
                        msg.id === tempId ? { ...msg, content: fullContent } : msg
                      )
                    }
                  )
          } else if (event.type === "citations") {
            const citations: Citation[] = event.citations ?? []
                  queryClient.setQueryData(
                    queryKeys.pdfChat.messages(chatId),
                    (old: ChatMessage[] | undefined) => {
                      if (!old) return old
                      return old.map(msg =>
                        msg.id === tempId ? { ...msg, citations } : msg
                      )
                    }
                  )
          } else if (event.type === "done") {
                  // Update with final DB ID
                  queryClient.setQueryData(
                    queryKeys.pdfChat.messages(chatId),
                    (old: ChatMessage[] | undefined) => {
                      if (!old) return old
                      return old.map(msg => 
                        msg.id === tempId ? event.message : msg
                      )
                    }
                  )
          } else if (event.type === "error") {
            throw new Error(event.error)
          }
        }
      } catch (err) {
        // Rollback optimistic UI on failure
        if (hasOptimisticMessage) {
          queryClient.setQueryData(
            queryKeys.pdfChat.messages(chatId),
            (old: ChatMessage[] | undefined) => {
              if (!old) return old
              return old.filter(msg => msg.id !== tempId)
            }
          )
        }
        throw err
      }

      return null
    },
    onSuccess: () => {
      // Invalidate to make sure we're fully in sync with backend
      queryClient.invalidateQueries({ queryKey: queryKeys.pdfChat.messages(chatId) })
    },
  })
}
