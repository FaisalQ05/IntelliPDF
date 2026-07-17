import { API_URL, refreshAccessToken } from "@/shared/api/axios"
import { useAuthStore } from "@/features/auth/store/auth.store"
import type { ChatMessage, Citation } from "../types/pdf-chat.types"

export type ChatStreamEvent =
  | { type: "user_message"; message: ChatMessage }
  | { type: "citations"; citations: Citation[] }
  | { type: "chunk"; content: string }
  | { type: "done"; message: ChatMessage }
  | { type: "error"; error: string }

const requestStream = (chatId: string, content: string, token: string | null) =>
  fetch(`${API_URL}/pdf-chat/chats/${chatId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content }),
  })

/** Native-fetch SSE client kept outside React Query so transport can be tested independently. */
export async function* streamChatMessage(chatId: string, content: string): AsyncGenerator<ChatStreamEvent> {
  let response = await requestStream(chatId, content, useAuthStore.getState().token)

  if (response.status === 401) {
    try {
      response = await requestStream(chatId, content, await refreshAccessToken())
    } catch {
      useAuthStore.getState().logout()
      throw new Error("Session expired. Please log in again.")
    }
  }

  if (!response.ok) throw new Error("Failed to send message")
  if (!response.body) throw new Error("No response body")

  const reader = response.body.getReader()
  const decoder = new TextDecoder("utf-8")
  let buffer = ""

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })

    const events = buffer.split("\n\n")
    buffer = events.pop() ?? ""
    for (const rawEvent of events) {
      const payload = rawEvent
        .split("\n")
        .find((line) => line.startsWith("data: "))
        ?.slice("data: ".length)
      if (!payload) continue
      yield JSON.parse(payload) as ChatStreamEvent
    }

    if (done) break
  }

  if (buffer.trim()) {
    const payload = buffer.split("\n").find((line) => line.startsWith("data: "))?.slice("data: ".length)
    if (payload) yield JSON.parse(payload) as ChatStreamEvent
  }
}
