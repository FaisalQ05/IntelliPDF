import type { DocumentStatus } from "../types/pdf-chat.types"

export const ACTIVE_DOCUMENT_STATUSES = new Set<DocumentStatus>([
  "QUEUED", "PROCESSING", "EMBEDDING", "INDEXING",
])

export const isDocumentProcessing = (status: DocumentStatus) => ACTIVE_DOCUMENT_STATUSES.has(status)

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatRelativeDocumentDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const hours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  if (hours < 24 && date.getDate() === now.getDate()) {
    return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }
  if (Math.floor(hours / 24) === 1) return "Yesterday"
  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}
