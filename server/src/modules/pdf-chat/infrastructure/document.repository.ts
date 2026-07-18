import { DocumentStatus, Prisma } from "../../../../generated/prisma/client";
import { DbClient } from "../../../common/database";
import { CreateDocumentParams } from "../domain/pdf-chat.types";

export class DocumentRepository {
  constructor(private readonly db: DbClient) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.db;
  }

  create(params: CreateDocumentParams, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.document.create({
      data: {
        userId: params.userId,
        filename: params.filename,
        fileSize: params.fileSize,
        filePath: params.filePath,
        status: "QUEUED",
      },
    });
  }

  findById(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.document.findUnique({ where: { id } });
  }

  findByUserId(userId: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  updateProgress(id: string, status: DocumentStatus, progress: number, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.document.updateMany({
      where: { id, status: { in: ["PROCESSING", "EMBEDDING", "INDEXING"] } },
      data: {
        status,
        progress,
      },
    });
  }

  updateError(id: string, error: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.document.updateMany({
      where: { id, status: { in: ["PROCESSING", "EMBEDDING", "INDEXING"] } },
      data: {
        status: "FAILED",
        error,
      },
    });
  }

  requeueForRetry(id: string, error: string) {
    return this.db.document.updateMany({
      where: { id, status: { in: ["PROCESSING", "EMBEDDING", "INDEXING"] } },
      data: { status: "QUEUED", progress: 0, error },
    });
  }

  delete(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.document.delete({ where: { id } });
  }

  claimForIndexing(id: string) {
    return this.db.document.updateMany({
      where: { id, status: "QUEUED" },
      data: { status: "PROCESSING", progress: 5, error: null },
    });
  }

  deleteIfInactive(id: string, userId: string) {
    return this.db.document.deleteMany({
      where: {
        id,
        userId,
        status: { notIn: ["PROCESSING", "EMBEDDING", "INDEXING"] },
      },
    });
  }
}
