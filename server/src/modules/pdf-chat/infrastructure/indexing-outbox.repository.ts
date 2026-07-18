import { Prisma } from "../../../../generated/prisma/client";
import { DbClient } from "../../../common/database";

export interface IndexingRequestedEvent {
  documentId: string;
  filePath: string;
  userId: string;
}

const INDEXING_REQUESTED = "pdf.indexing.requested";

/** Persists the intent to index before any Redis call is attempted. */
export class IndexingOutboxRepository {
  constructor(private readonly db: DbClient) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.db;
  }

  createIndexingRequested(event: IndexingRequestedEvent, tx: Prisma.TransactionClient) {
    return this.getClient(tx).outboxEvent.create({
      data: {
        // One document has one indexing request; this is also the stable BullMQ job id.
        id: event.documentId,
        type: INDEXING_REQUESTED,
        payload: event as unknown as Prisma.InputJsonObject,
      },
    });
  }

  findDue(limit: number) {
    return this.db.outboxEvent.findMany({
      where: {
        type: INDEXING_REQUESTED,
        status: "PENDING",
        nextAttemptAt: { lte: new Date() },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  markDelivered(id: string) {
    return this.db.outboxEvent.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "DELIVERED", deliveredAt: new Date(), lastError: null },
    });
  }

  recordFailure(id: string, attempts: number, error: string) {
    const delayMs = Math.min(60_000, 1_000 * 2 ** Math.min(attempts, 6));
    return this.db.outboxEvent.updateMany({
      where: { id, status: "PENDING" },
      data: {
        attempts: { increment: 1 },
        lastError: error.slice(0, 1_000),
        nextAttemptAt: new Date(Date.now() + delayMs),
      },
    });
  }
}
