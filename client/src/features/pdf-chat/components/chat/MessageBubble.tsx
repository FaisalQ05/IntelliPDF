import { Bot, User } from "lucide-react"
import type { ChatMessage, Citation } from "../../types/pdf-chat.types"
import { CitationsAccordion } from "./CitationsAccordion"

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "USER"
  const timestamp = new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const citations: Citation[] = Array.isArray(message.citations) ? message.citations : []
  return <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ring-2 ring-white ${isUser ? "bg-gradient-to-br from-zinc-700 to-zinc-900" : "ipdf-brand-gradient"}`}>
      {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
    </div>
    <div className={`flex max-w-[78%] flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div className={`w-full rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed shadow-sm ${isUser ? "rounded-tr-sm ipdf-brand-gradient text-white" : "rounded-tl-sm border border-zinc-100/80 bg-white text-zinc-800"}`}>
        {!isUser && !message.content ? <div className="flex h-[20px] items-center gap-1.5"><span className="ipdf-typing-dot" /><span className="ipdf-typing-dot" /><span className="ipdf-typing-dot" /></div> : <p className="whitespace-pre-wrap">{message.content}</p>}
        {message.content && <p className={`mt-1.5 text-[11px] ${isUser ? "text-indigo-200" : "font-medium text-zinc-400"}`}>{timestamp}</p>}
      </div>
      {!isUser && <CitationsAccordion citations={citations} />}
    </div>
  </div>
}
