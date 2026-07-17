import { useNavigate } from "react-router-dom"
import { Sparkles, FileText, MessageSquare, Zap, ChevronRight, ArrowRight } from "lucide-react"
import { useGetDocuments } from "@/features/pdf-chat/hooks/useDocuments"
import { useGetChats, useCreateChat } from "@/features/pdf-chat/hooks/useChats"
import { useToast } from "@/shared/hooks/useToast"

const SUGGESTIONS = [
  "Summarize this document for me",
  "What are the key findings?",
  "List all mentioned dates and events",
  "Explain the main conclusions",
]

export function ChatInterface() {
  const { data: documents } = useGetDocuments()
  const { data: chats } = useGetChats()
  const { mutateAsync: createChat, isPending: isCreating } = useCreateChat()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const readyDocuments = documents?.filter((d) => d.status === "COMPLETED") ?? []
  const hasReadyDocuments = readyDocuments.length > 0

  const handleStartChat = async (documentId: string) => {
    try {
      const chat = await createChat(documentId)
      navigate(`/dashboard/pdf-chat?chatId=${chat.id}`)
    } catch {
      addToast({ type: "error", message: "Failed to start chat. Please try again." })
    }
  }

  const handleContinueChat = (chatId: string) => {
    navigate(`/dashboard/pdf-chat?chatId=${chatId}`)
  }

  const recentChat = chats?.[0]

  return (
    <div className="ipdf-animate-slide-up ipdf-delay-200 flex flex-col">
      {/* Section header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50/80 border border-violet-100/50">
          <MessageSquare className="h-4.5 w-4.5 text-violet-600" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-zinc-900">AI Chat</h2>
          <p className="text-[13px] font-medium text-zinc-500">Ask anything about your uploaded PDFs</p>
        </div>
      </div>

      {/* Chat window */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-sm" style={{ height: 460 }}>

        {/* Content area */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-6 text-center">
          {/* Icon */}
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl ipdf-brand-gradient shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 shadow ring-2 ring-white">
              <FileText className="h-3.5 w-3.5 text-white" />
            </div>
          </div>

          <div>
            <h3 className="text-[15px] font-semibold text-zinc-900">
              Chat with your PDFs
            </h3>
            <p className="mt-1 text-[13px] font-medium text-zinc-500 max-w-[240px]">
              {hasReadyDocuments
                ? "Select a document below to start a conversation"
                : "Upload a document above and ask me anything about it"}
            </p>
          </div>

          {/* Continue most recent chat */}
          {recentChat && (
            <button
              onClick={() => handleContinueChat(recentChat.id)}
              className="flex w-full max-w-xs items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-left text-[13px] transition hover:border-indigo-200 hover:bg-indigo-100 group"
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-indigo-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-indigo-700">Continue last chat</p>
                <p className="truncate text-[12px] text-indigo-500">{recentChat.document.filename}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-indigo-400 transition group-hover:translate-x-0.5" />
            </button>
          )}

          {/* Start new chat from ready documents */}
          {hasReadyDocuments && (
            <div className="w-full space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Start new chat
              </p>
              {readyDocuments.slice(0, 3).map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleStartChat(doc.id)}
                  disabled={isCreating}
                  className="flex w-full items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-left text-[13px] font-medium text-zinc-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 group shadow-sm"
                >
                  <FileText className="h-3.5 w-3.5 text-zinc-400 group-hover:text-indigo-500 shrink-0 transition-colors" />
                  <span className="flex-1 truncate">{doc.filename}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
                </button>
              ))}
              {readyDocuments.length > 3 && (
                <button
                  onClick={() => navigate("/dashboard/pdf-chat")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-100 py-2 text-[12px] font-medium text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-700"
                >
                  +{readyDocuments.length - 3} more documents →
                </button>
              )}
            </div>
          )}

          {/* No documents: show suggestion pills as preview */}
          {!hasReadyDocuments && (
            <div className="w-full space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Try asking
              </p>
              {SUGGESTIONS.map((s) => (
                <div
                  key={s}
                  className="flex w-full items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-left text-[13px] font-medium text-zinc-400 opacity-60 cursor-default"
                >
                  <Zap className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
                  <span className="flex-1">{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer bar */}
        <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-3">
          <button
            onClick={() => navigate("/dashboard/pdf-chat")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-white py-2 text-[13px] font-medium text-indigo-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
          >
            <MessageSquare className="h-4 w-4" />
            Open full chat interface
          </button>
        </div>
      </div>
    </div>
  )
}
