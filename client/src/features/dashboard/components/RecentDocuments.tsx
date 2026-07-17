import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FileText, MessageSquare, Trash2, Clock, CheckCircle2, Loader2, AlertCircle, FolderOpen } from "lucide-react"
import { useGetDocuments } from "@/features/pdf-chat/hooks/useDocuments"
import { useDocumentActions } from "@/features/pdf-chat/hooks/useDocumentActions"
import type { Document, DocumentStatus } from "@/features/pdf-chat/types/pdf-chat.types"
import { formatFileSize, formatRelativeDocumentDate, isDocumentProcessing } from "@/features/pdf-chat/utils/document.utils"

function ElapsedTime({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = new Date(since).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [since])

  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  return (
    <span className="tabular-nums">
      {m > 0 ? `${m}m ` : ""}{s}s
    </span>
  )
}

const STATUS_CONFIG: Record<DocumentStatus, {
  label: string
  icon: React.ElementType
  className: string
  iconClass: string
  barClass: string
}> = {
  QUEUED: {
    label: "Queued",
    icon: Clock,
    className: "bg-zinc-50 text-zinc-500 border-zinc-200/60",
    iconClass: "text-zinc-400",
    barClass: "bg-zinc-300",
  },
  PROCESSING: {
    label: "Processing",
    icon: Loader2,
    className: "bg-amber-50 text-amber-600 border-amber-100",
    iconClass: "text-amber-500 animate-spin",
    barClass: "bg-gradient-to-r from-amber-400 to-orange-400",
  },
  EMBEDDING: {
    label: "Embedding",
    icon: Loader2,
    className: "bg-blue-50 text-blue-600 border-blue-100",
    iconClass: "text-blue-500 animate-spin",
    barClass: "bg-gradient-to-r from-blue-400 to-indigo-500",
  },
  INDEXING: {
    label: "Indexing",
    icon: Loader2,
    className: "bg-indigo-50 text-indigo-600 border-indigo-100",
    iconClass: "text-indigo-500 animate-spin",
    barClass: "bg-gradient-to-r from-indigo-500 to-violet-500",
  },
  COMPLETED: {
    label: "Indexed",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-600 border-emerald-100",
    iconClass: "text-emerald-500",
    barClass: "bg-emerald-500",
  },
  FAILED: {
    label: "Error",
    icon: AlertCircle,
    className: "bg-red-50 text-red-600 border-red-100",
    iconClass: "text-red-500",
    barClass: "bg-red-400",
  },
}

function DocumentCard({ doc, onChatStart }: { doc: Document; onChatStart: (id: string) => void }) {
  const { deleteDocumentWithFeedback, isDeletingDocument } = useDocumentActions()
  const status = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.QUEUED
  const StatusIcon = status.icon
  const isActive = isDocumentProcessing(doc.status)

  const handleDelete = () => {
    deleteDocumentWithFeedback(doc.id, doc.filename)
  }

  return (
    <div className="ipdf-card-hover group relative overflow-hidden rounded-xl border border-zinc-200/60 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md">
      {/* Decorative gradient */}
      <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-indigo-100/40 to-violet-100/20 blur-xl" />

      <div className="relative flex flex-col gap-3">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-100/50 shadow-sm">
            <FileText className="h-5 w-5 text-red-500" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-zinc-900 leading-snug">
              {doc.filename}
            </p>
            <p className="mt-0.5 text-[12px] font-medium text-zinc-500">
              {formatFileSize(doc.fileSize)}
            </p>
          </div>
        </div>

        {/* Status + date row */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${status.className}`}
          >
            <StatusIcon className={`h-3 w-3 ${status.iconClass}`} />
            {status.label}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 shrink-0">
            {isActive ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <ElapsedTime since={doc.updatedAt} />
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                {formatRelativeDocumentDate(doc.createdAt)}
              </>
            )}
          </span>
        </div>

        {/* Live progress bar (active states) */}
        {isActive && (
          <div className="space-y-1 mt-1">
            <div className="flex items-center justify-between">
              {doc.message && (
                <p className="truncate text-[11px] font-medium text-zinc-500 flex-1">{doc.message}</p>
              )}
              <span className={`text-[11px] font-bold tabular-nums ml-auto ${
                doc.status === "EMBEDDING" ? "text-blue-600" :
                doc.status === "INDEXING" ? "text-indigo-600" : "text-amber-600"
              }`}>
                {doc.progress}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className={`h-full rounded-full ${status.barClass} transition-all duration-500 ease-out`}
                style={{ width: `${doc.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {doc.status === "FAILED" && doc.error && (
          <p className="text-[11px] text-red-500 truncate">{doc.error}</p>
        )}

        {/* Hover actions */}
        <div className="flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            onClick={() => onChatStart(doc.id)}
            disabled={doc.status !== "COMPLETED"}
            title={doc.status !== "COMPLETED" ? "Document must be fully indexed before chatting" : "Start chat"}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-50 py-2 text-[12px] font-medium text-indigo-600 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeletingDocument}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-400 transition hover:bg-red-100 hover:text-red-500 disabled:opacity-40"
          >
            {isDeletingDocument ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

const ANIMATION_DELAYS = ["ipdf-delay-100", "ipdf-delay-200", "ipdf-delay-300", "ipdf-delay-400"] as const

export function RecentDocuments() {
  const { data: documents, isLoading } = useGetDocuments()
  const { startChat } = useDocumentActions()
  const navigate = useNavigate()

  const handleChatStart = async (documentId: string) => {
    try {
      const chat = await startChat(documentId)
      navigate(`/dashboard/pdf-chat?chatId=${chat.id}`)
    } catch { /* feedback is owned by useDocumentActions */ }
  }

  return (
    <div className="ipdf-animate-slide-up ipdf-delay-300">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50/80 border border-red-100/50">
            <FolderOpen className="h-4.5 w-4.5 text-red-500" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-900">Recent Documents</h2>
            <p className="text-[13px] font-medium text-zinc-500">
              {isLoading ? "Loading..." : `${documents?.length ?? 0} document${documents?.length !== 1 ? "s" : ""}`}
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

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-[140px] animate-pulse rounded-xl bg-zinc-100/80" />
          ))}
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {documents.slice(0, 4).map((doc, i) => (
            <div
              key={doc.id}
              className={`ipdf-animate-slide-up ${ANIMATION_DELAYS[i % ANIMATION_DELAYS.length]}`}
            >
              <DocumentCard doc={doc} onChatStart={handleChatStart} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/30 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-zinc-100">
            <FileText className="h-6 w-6 text-zinc-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-600">No documents yet</p>
            <p className="mt-0.5 text-[13px] font-medium text-zinc-400">Upload your first PDF to get started</p>
          </div>
        </div>
      )}
    </div>
  )
}
