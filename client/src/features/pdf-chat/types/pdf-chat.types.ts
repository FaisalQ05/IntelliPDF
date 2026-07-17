export type DocumentStatus = "QUEUED" | "PROCESSING" | "EMBEDDING" | "INDEXING" | "COMPLETED" | "FAILED";
export type MessageRole = "USER" | "ASSISTANT";

export interface Document {
  id: string;
  userId: string;
  filename: string;
  fileSize: number;
  pageCount: number | null;
  filePath: string | null;
  status: DocumentStatus;
  progress: number;
  message?: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: string;
  userId: string;
  documentId: string;
  document: {
    filename: string;
    status: DocumentStatus;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  pageContent: string;
  metadata: {
    documentId?: string;
    page?: number;
    loc?: { pageNumber?: number; lines?: { from?: number; to?: number } };
    source?: string;
    [key: string]: unknown;
  };
  score?: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  citations?: Citation[];
  createdAt: string;
}

export interface SendMessageResult {
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
}
