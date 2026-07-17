import { useCreateChat } from "./useChats"
import { useDeleteDocument } from "./useDocuments"
import { useToast } from "@/shared/hooks/useToast"

/** Shared document mutations and notifications for dashboard and full PDF-chat views. */
export function useDocumentActions() {
  const { mutateAsync: createChat, isPending: isCreatingChat } = useCreateChat()
  const { mutate: deleteDocument, isPending: isDeletingDocument } = useDeleteDocument()
  const { addToast } = useToast()

  const startChat = async (documentId: string) => {
    try {
      return await createChat(documentId)
    } catch {
      addToast({ type: "error", message: "Failed to start chat. Please try again." })
      throw new Error("Failed to start chat")
    }
  }

  const deleteDocumentWithFeedback = (id: string, filename: string) => {
    deleteDocument(id, {
      onSuccess: () => addToast({ type: "success", message: `"${filename}" deleted.` }),
      onError: () => addToast({ type: "error", message: `Failed to delete "${filename}".` }),
    })
  }

  return { startChat, deleteDocumentWithFeedback, isCreatingChat, isDeletingDocument }
}
