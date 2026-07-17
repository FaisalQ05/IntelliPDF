import { useSearchParams } from "react-router-dom"
import { DocumentUpload } from "../components/DocumentUpload"
import { DocumentList } from "../components/DocumentList"
import { ChatPanel } from "../components/ChatPanel"

export default function PdfChatPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeChatId = searchParams.get("chatId")

  const handleBack = () => {
    setSearchParams({})
  }
  
  const handleChatCreated = (chatId: string) => {
    setSearchParams({ chatId })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">PDF Chat</h1>
        <p className="mt-1 text-sm font-medium text-zinc-500">
          Upload documents and interact with them using AI.
        </p>
      </div>

      {!activeChatId ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column: Upload */}
          <div>
            <DocumentUpload />
          </div>

          {/* Right Column: Document List */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">Your Documents</h2>
              <p className="text-sm font-medium text-zinc-500">Select a document to start a chat</p>
            </div>
            <DocumentList onChatCreated={handleChatCreated} />
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-4xl">
          <ChatPanel chatId={activeChatId} onBack={handleBack} />
        </div>
      )}
    </div>
  )
}
