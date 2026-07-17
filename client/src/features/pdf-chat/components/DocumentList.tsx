import { useState, useEffect } from "react"
import { FileText, Trash2, CheckCircle2, AlertCircle, Clock, MessageSquarePlus, Loader2 } from "lucide-react"
import { useGetDocuments } from "../hooks/useDocuments"
import { useDocumentActions } from "../hooks/useDocumentActions"
import type { Document } from "../types/pdf-chat.types"
import { formatFileSize, isDocumentProcessing } from "../utils/document.utils"

// Elapsed time counter that updates every second while a document is processing
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
    <span className="text-[11px] font-medium text-zinc-400 tabular-nums">
      {m > 0 ? `${m}m ` : ""}{s}s
    </span>
  )
}

function DocumentRow({ doc, onChatStart }: { doc: Document; onChatStart: (id: string) => void }) {
  const { deleteDocumentWithFeedback, isDeletingDocument } = useDocumentActions()
  const isActive = isDocumentProcessing(doc.status)

  const handleDelete = () => {
    deleteDocumentWithFeedback(doc.id, doc.filename)
  }

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-zinc-200/60 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50/80 border border-indigo-100/50">
        <FileText className="h-5 w-5 text-indigo-600" strokeWidth={1.8} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-[14px] font-semibold text-zinc-900">{doc.filename}</h4>

        <div className="mt-1 flex items-center gap-3 flex-wrap">
          <span className="text-[12px] font-medium text-zinc-500">{formatFileSize(doc.fileSize)}</span>

          {/* Status Badge */}
          <div className="flex items-center gap-1">
            {doc.status === "COMPLETED" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
            {doc.status === "QUEUED" && <Clock className="h-3.5 w-3.5 text-zinc-400" />}
            {(doc.status === "PROCESSING" || doc.status === "EMBEDDING" || doc.status === "INDEXING") && (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            )}
            {doc.status === "FAILED" && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
            <span className={`text-[11px] font-semibold uppercase tracking-wider
              ${doc.status === "COMPLETED" ? "text-emerald-600" : ""}
              ${doc.status === "QUEUED" ? "text-zinc-500" : ""}
              ${(doc.status === "PROCESSING" || doc.status === "EMBEDDING" || doc.status === "INDEXING") ? "text-indigo-600" : ""}
              ${doc.status === "FAILED" ? "text-red-600" : ""}
            `}>
              {doc.status}
            </span>
          </div>

          {/* Elapsed time for active jobs */}
          {isActive && <ElapsedTime since={doc.updatedAt} />}
        </div>

        {isActive && (
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between">
              {doc.message && (
                <p className="text-[11px] font-medium text-zinc-500 truncate">{doc.message}</p>
              )}
              <span className="text-[11px] font-bold text-indigo-600 ml-auto tabular-nums">
                {doc.progress}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
                style={{ width: `${doc.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {doc.status === "FAILED" && doc.error && (
          <p className="mt-1 text-[11px] text-red-500 truncate">{doc.error}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={() => onChatStart(doc.id)}
          disabled={doc.status !== "COMPLETED"}
          title={doc.status !== "COMPLETED" ? "Document must be fully indexed before chatting" : "Start chat"}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-[12px] font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Chat
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeletingDocument}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40"
        >
          {isDeletingDocument ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

export function DocumentList({ onChatCreated }: { onChatCreated: (chatId: string) => void }) {
  const { data: documents, isLoading } = useGetDocuments()
  const { startChat } = useDocumentActions()

  const handleStartChat = async (documentId: string) => {
    try {
      const chat = await startChat(documentId)
      onChatCreated(chat.id)
    } catch { /* feedback is owned by useDocumentActions */ }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-[72px] animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/30 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-zinc-100">
          <FileText className="h-6 w-6 text-zinc-300" />
        </div>
        <p className="text-[13px] font-semibold text-zinc-600">No documents uploaded yet.</p>
        <p className="mt-0.5 text-[12px] font-medium text-zinc-400">Upload a PDF to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {documents.map((doc: Document) => (
        <DocumentRow
          key={doc.id}
          doc={doc}
          onChatStart={handleStartChat}
        />
      ))}
    </div>
  )
}
