import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/shared/providers/socket.context";
import { useToast } from "@/shared/hooks/useToast";
import { queryKeys } from "@/shared/api/query-keys";
import type { Document, DocumentStatus } from "../types/pdf-chat.types";

interface DocumentProgressPayload {
  documentId: string;
  status: DocumentStatus;
  progress: number;
  message?: string;
  error: string | null;
  timestamp: string;
}

export function useDocumentUpdates() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  useEffect(() => {
    if (!socket) return;

    const handleProgress = (payload: DocumentProgressPayload) => {
      // Optimistically update the React Query cache in-place for instant UI response
      queryClient.setQueryData<Document[]>(queryKeys.pdfChat.documents(), (oldDocs) => {
        if (!oldDocs) return oldDocs;

        let documentFound = false;
        const newDocs = oldDocs.map((doc) => {
          if (doc.id === payload.documentId) {
            documentFound = true;
            return {
              ...doc,
              status: payload.status,
              progress: payload.progress,
              message: payload.message,
              error: payload.error,
              updatedAt: payload.timestamp,
            };
          }
          return doc;
        });

        if (!documentFound) return oldDocs;

        // Show toast notifications on terminal states
        if (payload.status === "COMPLETED") {
          const doc = oldDocs.find((d) => d.id === payload.documentId);
          addToast({
            type: "success",
            title: "Indexing complete",
            message: `"${doc?.filename || "Document"}" is ready for chat.`,
          });
        } else if (payload.status === "FAILED") {
          const doc = oldDocs.find((d) => d.id === payload.documentId);
          addToast({
            type: "error",
            title: "Indexing failed",
            message: `"${doc?.filename || "Document"}": ${payload.error ?? "Unknown error"}`,
          });
        }

        return newDocs;
      });

      // On terminal states, also trigger a background refetch so the cache
      // stays in sync with the server (handles reconnect / refresh scenarios).
      if (payload.status === "COMPLETED" || payload.status === "FAILED") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.pdfChat.documents(),
          refetchType: "active",
        });
      }
    };

    socket.on("document_progress", handleProgress);

    return () => {
      socket.off("document_progress", handleProgress);
    };
  }, [socket, queryClient, addToast]);
}
