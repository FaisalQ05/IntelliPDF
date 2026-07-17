import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, MessageSquare } from "lucide-react"
import { useGetChats, useGetMessages, useSendMessage } from "../hooks/useChats"
import { ChatComposer } from "./chat/ChatComposer"
import { MessageBubble } from "./chat/MessageBubble"

export function ChatPanel({ chatId, onBack }: { chatId: string; onBack: () => void }) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const { data: chats } = useGetChats()
  const { data: messages, isLoading } = useGetMessages(chatId)
  const { mutateAsync: sendMessage, isPending } = useSendMessage(chatId)
  const chat = chats?.find((item) => item.id === chatId)

  const scrollToBottom = useCallback(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [])
  useEffect(() => { scrollToBottom() }, [messages, isPending, scrollToBottom])

  const handleSend = async () => {
    if (!input.trim() || isPending) return
    const content = input
    setInput("")
    try { await sendMessage(content) } catch (error) { console.error("Failed to send message", error); setInput(content) }
  }

  return <div className="flex h-[700px] flex-col overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-md">
    <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50/50 px-4 py-3">
      <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-800"><ArrowLeft className="h-4 w-4" /></button>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-100/50 bg-violet-50/80"><MessageSquare className="h-4.5 w-4.5 text-violet-600" /></div>
      <div><h3 className="text-[14px] font-semibold text-zinc-900">{chat?.document?.filename || "Document Chat"}</h3><p className="text-[11px] font-medium text-zinc-400">{chat ? `Created ${new Date(chat.createdAt).toLocaleDateString()}` : "Sources are cited beneath each AI response"}</p></div>
    </div>
    <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto bg-zinc-50/30 p-5">
      {isLoading ? <div className="flex h-full items-center justify-center text-sm font-medium text-zinc-500">Loading messages...</div>
        : messages?.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-center text-zinc-500"><MessageSquare className="mb-2 h-8 w-8 text-zinc-300" /><p className="text-[14px] font-semibold text-zinc-700">No messages yet</p><p className="mt-0.5 text-[13px] font-medium">Send a message to start the conversation.</p></div>
        : messages?.map((message) => <MessageBubble key={message.id} message={message} />)}
    </div>
    <ChatComposer value={input} pending={isPending} onChange={setInput} onSend={handleSend} />
  </div>
}
