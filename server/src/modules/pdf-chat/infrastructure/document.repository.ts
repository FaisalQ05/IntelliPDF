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
    return client.document.update({
      where: { id },
      data: {
        status,
        progress,
      },
    });
  }

  updateError(id: string, error: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.document.update({
      where: { id },
      data: {
        status: "FAILED",
        error,
      },
    });
  }

  delete(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    return client.document.delete({ where: { id } });
  }
}
