import { useState, useRef, useEffect } from "react"
import { Upload, FileText, X, CheckCircle2, AlertCircle, CloudUpload, Loader2 } from "lucide-react"
import { useUploadDocument } from "@/features/pdf-chat/hooks/useDocuments"
import { useToast } from "@/shared/hooks/useToast"

interface UploadedFile {
  id: string
  name: string
  size: number
  status: "uploading" | "done" | "error"
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export function PDFUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutateAsync: uploadDocument } = useUploadDocument()
  const { addToast } = useToast()

  // Clear completed/errored files after a delay
  useEffect(() => {
    const doneFiled = files.filter((f) => f.status === "done" || f.status === "error")
    if (doneFiled.length === 0) return
    const timer = setTimeout(() => {
      setFiles((prev) => prev.filter((f) => f.status === "uploading"))
    }, 4000)
    return () => clearTimeout(timer)
  }, [files])

  const uploadFile = async (file: File) => {
    const id = crypto.randomUUID()
    setFiles((prev) => [{ id, name: file.name, size: file.size, status: "uploading" }, ...prev])
    try {
      await uploadDocument(file)
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "done" } : f)))
      addToast({ type: "success", title: "Upload complete", message: `"${file.name}" is being indexed.` })
    } catch {
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "error" } : f)))
      addToast({ type: "error", title: "Upload failed", message: `Could not upload "${file.name}". Please try again.` })
    }
  }

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const pdfs = Array.from(fileList).filter((f) => f.type === "application/pdf")
    if (pdfs.length < fileList.length) {
      addToast({ type: "warning", message: "Only PDF files are supported. Non-PDF files were skipped." })
    }
    pdfs.forEach(uploadFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id))

  const isUploading = files.some((f) => f.status === "uploading")

  return (
    <div className="ipdf-animate-slide-up ipdf-delay-100 space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50/80 border border-indigo-100/50">
          <CloudUpload className="h-4.5 w-4.5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-zinc-900">Upload PDF</h2>
          <p className="text-[13px] font-medium text-zinc-500">Drop your documents and start chatting instantly</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        id="pdf-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`
          relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed px-8 py-12
          transition-all duration-300 select-none
          ${isDragging
            ? "ipdf-drop-active border-indigo-400 bg-indigo-50/50 scale-[1.01]"
            : "border-zinc-200/80 bg-zinc-50/30 hover:border-indigo-300 hover:bg-indigo-50/20 hover:shadow-sm"
          }
          ${isUploading ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-100/40 to-violet-100/30" />
          <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-gradient-to-br from-violet-100/30 to-indigo-100/20" />
        </div>

        <div className="relative flex flex-col items-center gap-4 text-center">
          {/* Upload icon */}
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-md transition-all duration-300
            ${isDragging ? "ipdf-brand-gradient scale-110" : "bg-gradient-to-br from-indigo-500 to-violet-600"}`}
          >
            {isUploading
              ? <Loader2 className="h-7 w-7 text-white animate-spin" />
              : <Upload className={`h-7 w-7 text-white ${!isDragging ? "ipdf-upload-icon" : ""}`} strokeWidth={2} />
            }
          </div>

          <div>
            <p className="text-[15px] font-semibold text-zinc-900">
              {isUploading ? "Uploading..." : isDragging ? "Drop to upload" : "Drag & drop your PDF here"}
            </p>
            {!isUploading && (
              <p className="mt-1 text-[13px] text-zinc-500 font-medium">
                or{" "}
                <span className="font-semibold text-indigo-600 underline-offset-4 hover:underline">
                  browse files
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="rounded-full border border-zinc-200/60 bg-white px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
              PDF only
            </span>
            <span className="rounded-full border border-zinc-200/60 bg-white px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
              Up to 50 MB
            </span>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isUploading}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2.5">
          {files.map((file) => (
            <div
              key={file.id}
              className="ipdf-message-enter flex items-center gap-4 rounded-xl border border-zinc-200/60 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md"
            >
              {/* File icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50/80 border border-red-100/50">
                <FileText className="h-5 w-5 text-red-500" strokeWidth={1.8} />
              </div>

              {/* File info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[13px] font-semibold text-zinc-900">{file.name}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {file.status === "uploading" && (
                      <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                    )}
                    {file.status === "done" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                    {file.status === "error" && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    {file.status !== "uploading" && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-[12px] font-medium text-zinc-500">{formatBytes(file.size)}</p>
                  {file.status === "uploading" && (
                    <p className="text-[12px] font-semibold text-indigo-500">Uploading...</p>
                  )}
                  {file.status === "done" && (
                    <p className="text-[12px] font-semibold text-emerald-500">Indexed & ready</p>
                  )}
                  {file.status === "error" && (
                    <p className="text-[12px] font-semibold text-red-500">Upload failed</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
