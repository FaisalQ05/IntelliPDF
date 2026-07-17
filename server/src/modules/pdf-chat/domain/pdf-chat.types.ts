import { DocumentStatus, MessageRole } from "../../../../generated/prisma/client";

export interface DocumentDto {
  id: string;
  userId: string;
  filename: string;
  fileSize: number;
  pageCount: number | null;
  filePath: string | null;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatDto {
  id: string;
  userId: string;
  documentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessageDto {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export interface CreateDocumentParams {
  userId: string;
  filename: string;
  fileSize: number;
  filePath?: string;
}

export interface CreateChatParams {
  userId: string;
  documentId: string;
}

export interface CreateMessageParams {
  chatId: string;
  role: MessageRole;
  content: string;
  citations?: any;
}
