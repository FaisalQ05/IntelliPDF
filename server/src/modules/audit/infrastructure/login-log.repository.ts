import { AuthProvider, Prisma } from "../../../../generated/prisma/client";
import { DbClient } from "../../../common/database";

export class LoginLogRepository {
  constructor(private readonly db: DbClient) {}

  private getPrismaClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.db;
  }

  create(
    data: {
      userId: string;
      email?: string;
      provider: AuthProvider;
      ipAddress?: string;
      success: boolean;
    },
    tx?: Prisma.TransactionClient
  ) {
    const client = this.getPrismaClient(tx);
    return client.loginLog.create({ data });
  }

  getLogs(tx?: Prisma.TransactionClient) {
    const client = this.getPrismaClient(tx);
    return client.loginLog.findMany({
      orderBy: { loginAt: "desc" },
      take: 100,
    });
  }
}
