import { useNavigate } from "react-router-dom"
import { MessageSquare, Clock, ChevronRight, History, Loader2, Trash2 } from "lucide-react"
import { useGetChats, useDeleteChat } from "@/features/pdf-chat/hooks/useChats"
import { useToast } from "@/shared/hooks/useToast"
import type { Chat } from "@/features/pdf-chat/types/pdf-chat.types"

const ACCENT_COLORS = [
  "from-indigo-500 to-violet-500",
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
] as const

function formatDate(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffH = diffMs / (1000 * 60 * 60)
  if (diffH < 1) return "Just now"
  if (diffH < 24 && date.getDate() === now.getDate()) {
    return `${Math.floor(diffH)}h ago`
  }
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 1) return "Yesterday"
  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

function ChatRow({ chat, index, onOpen }: { chat: Chat; index: number; onOpen: (id: string) => void }) {
  const { mutate: deleteChat, isPending: isDeleting } = useDeleteChat()
  const { addToast } = useToast()
  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length]

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteChat(chat.id, {
      onSuccess: () => addToast({ type: "success", message: "Chat session deleted." }),
      onError: () => addToast({ type: "error", message: "Failed to delete chat." }),
    })
  }

  return (
    <div className="group relative">
      <button
        onClick={() => onOpen(chat.id)}
        className="ipdf-card-hover flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-zinc-50"
      >
        {/* Avatar */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accentColor} shadow-sm`}
        >
          <MessageSquare className="h-4 w-4 text-white" strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[13px] font-semibold text-zinc-900">
              {chat.document.filename}
            </p>
            <div className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-zinc-400">
              <Clock className="h-3 w-3" />
              {formatDate(chat.updatedAt)}
            </div>
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                chat.document.status === "COMPLETED"
                  ? "bg-emerald-50 text-emerald-600"
                  : chat.document.status === "FAILED"
                  ? "bg-red-50 text-red-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {chat.document.status === "COMPLETED" ? "Indexed" : chat.document.status}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-400" />
      </button>

      {/* Delete button (shown on hover) */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute right-14 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-40"
      >
        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

export function RecentChats() {
  const { data: chats, isLoading } = useGetChats()
  const navigate = useNavigate()

  const handleOpen = (chatId: string) => {
    navigate(`/dashboard/pdf-chat?chatId=${chatId}`)
  }

  return (
    <div className="ipdf-animate-slide-up ipdf-delay-400">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50/80 border border-violet-100/50">
            <History className="h-4.5 w-4.5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-900">Recent Chats</h2>
            <p className="text-[13px] font-medium text-zinc-500">
              {isLoading ? "Loading..." : `${chats?.length ?? 0} active session${chats?.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/dashboard/pdf-chat")}
          className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-indigo-600 transition hover:bg-indigo-50"
        >
          View all →
        </button>
      </div>

      {/* Chat list */}
      {isLoading ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-sm">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[72px] animate-pulse border-b border-zinc-100/80 bg-zinc-50/50 last:border-0" />
          ))}
        </div>
      ) : chats && chats.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-sm">
          {chats.slice(0, 4).map((chat, i) => (
            <div key={chat.id}>
              <ChatRow chat={chat} index={i} onOpen={handleOpen} />
              {i < Math.min(chats.length, 4) - 1 && (
                <div className="mx-5 border-t border-zinc-100/80" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/30 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-zinc-100">
            <MessageSquare className="h-6 w-6 text-zinc-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-600">No chats yet</p>
            <p className="mt-0.5 text-[13px] font-medium text-zinc-400">Start chatting with your documents</p>
          </div>
        </div>
      )}
    </div>
  )
}
