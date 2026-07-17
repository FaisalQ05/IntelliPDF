import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { get, del } from "@/shared/api/methods"
import { api } from "@/shared/api/axios" // using axios instance for multipart upload
import { queryKeys } from "@/shared/api/query-keys"
import type { ApiResponse } from "@/shared/types/api/api.types"
import type { Document } from "../types/pdf-chat.types"

export const useGetDocuments = () => {
  return useQuery({
    queryKey: queryKeys.pdfChat.documents(),
    queryFn: async () => {
      const res = await get<ApiResponse<Document[]>>("/pdf-chat/documents")
      if (!res.success) throw new Error(res.message)
      return res.data
    },
  })
}

export const useUploadDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      const res = await api.post<ApiResponse<Document>>("/pdf-chat/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      if (!res.data.success) throw new Error(res.data.message)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pdfChat.documents() })
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await del<ApiResponse<void>>(`/pdf-chat/documents/${id}`)
      if (!res.success) throw new Error(res.message)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pdfChat.documents() })
    },
  })
}
