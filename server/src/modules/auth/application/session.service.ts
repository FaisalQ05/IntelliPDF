import { Prisma } from "../../../../generated/prisma/client";
import { SessionRepository } from "../infrastructure/session.repository";

interface createSessionParams {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
}

export class SessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async createSession(
    params: createSessionParams,
    context?: Prisma.TransactionClient
  ) {
    return this.sessionRepository.create(params, context);
  }

  async getSession(
    userId: string,
    sessionId: string,
    context?: Prisma.TransactionClient
  ) {
    return this.sessionRepository.findSessionByUserId(
      userId,
      sessionId,
      context
    );
  }

  async refreshSession(
    sessionId: string,
    newRefreshTokenHash: string,
    expiresAt: Date,
    context?: Prisma.TransactionClient
  ) {
    return this.sessionRepository.refreshSession(
      sessionId,
      newRefreshTokenHash,
      expiresAt,
      context
    );
  }

  async deleteSession(
    userId: string,
    sessionId: string,
    context?: Prisma.TransactionClient
  ) {
    return this.sessionRepository.deleteSession(userId, sessionId, context);
  }
}
