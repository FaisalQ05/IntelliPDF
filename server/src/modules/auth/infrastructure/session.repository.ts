import { Prisma } from "../../../../generated/prisma/client";
import { DbClient } from "../../../common/database";

export class SessionRepository {
  constructor(private readonly db: DbClient) {}

  private getPrismaClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.db;
  }

  create(
    data: {
      userId: string;
      refreshTokenHash: string;
      expiresAt: Date;
      ipAddress?: string;
      id: string;
    },
    tx?: Prisma.TransactionClient
  ) {
    const client = this.getPrismaClient(tx);
    return client.session.create({ data });
  }

  findSessionByUserId(
    userId: string,
    sessionId: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = this.getPrismaClient(tx);
    return client.session.findFirst({ where: { userId, id: sessionId } });
  }

  refreshSession(
    sessionId: string,
    newRefreshTokenHash: string,
    expiresAt: Date,
    context?: Prisma.TransactionClient
  ) {
    const client = this.getPrismaClient(context);
    return client.session.update({
      where: {
        id: sessionId,
      },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        expiresAt,
      },
    });
  }

  deleteSession(
    userId: string,
    sessionId: string,
    context?: Prisma.TransactionClient
  ) {
    const db = this.getPrismaClient(context);

    return db.session.delete({
      where: {
        id: sessionId,
        userId,
      },
    });
  }
}
