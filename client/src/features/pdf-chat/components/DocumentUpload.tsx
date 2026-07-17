import { useState, useRef } from "react"
import { Upload, CloudUpload, Loader2 } from "lucide-react"
import { useUploadDocument } from "../hooks/useDocuments"
import { useToast } from "@/shared/hooks/useToast"

export function DocumentUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutateAsync: uploadDocument, isPending } = useUploadDocument()
  const { addToast } = useToast()

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return

    const file = fileList[0]
    if (file.type !== "application/pdf") {
      addToast({ type: "error", title: "Invalid file type", message: "Only PDF files are supported." })
      return
    }

    try {
      await uploadDocument(file)
      addToast({ type: "success", title: "Upload complete", message: `"${file.name}" is being indexed.` })
    } catch {
      addToast({ type: "error", title: "Upload failed", message: "Could not upload the file. Please try again." })
    }
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

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <CloudUpload className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">Upload PDF</h2>
          <p className="text-[13px] text-slate-500">Drop your document to start chatting</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        id="pdf-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isPending && inputRef.current?.click()}
        className={`
          relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed px-8 py-12
          transition-all duration-300 select-none
          ${
            isDragging
              ? "border-indigo-400 bg-gradient-to-br from-indigo-50/80 to-violet-50/60 scale-[1.01]"
              : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
          }
          ${isPending ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <div className="relative flex flex-col items-center gap-4 text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-md transition-all duration-300
            ${isDragging ? "ipdf-brand-gradient scale-110" : "bg-gradient-to-br from-indigo-500 to-violet-600"}
          `}
          >
            {isPending ? (
              <Loader2 className="h-7 w-7 text-white animate-spin" />
            ) : (
              <Upload className="h-7 w-7 text-white" strokeWidth={2} />
            )}
          </div>

          <div>
            <p className="text-[15px] font-semibold text-slate-800">
              {isPending ? "Uploading..." : isDragging ? "Drop to upload" : "Drag & drop your PDF here"}
            </p>
            {!isPending && (
              <p className="mt-1 text-[13px] text-slate-500">
                or{" "}
                <span className="font-semibold text-indigo-600 underline-offset-2 hover:underline">
                  browse files
                </span>
              </p>
            )}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isPending}
        />
      </div>
    </div>
  )
}
