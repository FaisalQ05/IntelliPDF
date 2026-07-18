import { MessageRole, Prisma } from "../../../../generated/prisma/client";
import { DbClient } from "../../../common/database";
import { CreateChatParams, CreateMessageParams } from "../domain/pdf-chat.types";

export class ChatRepository {
  constructor(private readonly db: DbClient) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.db;
  }

  createChat(params: CreateChatParams, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.chat.create({
      data: {
        userId: params.userId,
        documentId: params.documentId,
      },
      include: {
        document: { select: { filename: true, status: true } },
      },
    });
  }

  findChatById(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.chat.findUnique({
      where: { id },
      include: {
        document: { select: { filename: true, status: true } },
      },
    });
  }

  findChatsByUserId(userId: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.chat.findMany({
      where: { userId },
      include: {
        document: { select: { filename: true, status: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  deleteChat(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.chat.delete({ where: { id } });
  }

  createMessage(params: CreateMessageParams, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.chatMessage.create({
      data: {
        chatId: params.chatId,
        role: params.role,
        content: params.content,
        citations: params.citations ? params.citations : Prisma.JsonNull,
      },
    });
  }

  findMessagesByChatId(chatId: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.chatMessage.findMany({
      where: { chatId },
      // createdAt has millisecond precision; id gives concurrent inserts a
      // stable order when they share the same timestamp.
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
  }
}
