import { Prisma, Role, AuthProvider } from "../../../../generated/prisma/client";
import { DbClient } from "../../../common/database";

export class UserRepository {
  constructor(private readonly db: DbClient) {}

  private getPrismaClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.db;
  }

  findByEmail(email: string, tx?: Prisma.TransactionClient) {
    const client = this.getPrismaClient(tx);
    return client.user.findUnique({ where: { email } });
  }

  findById(id: string, tx?: Prisma.TransactionClient) {
    const client = this.getPrismaClient(tx);
    return client.user.findUnique({ where: { id } });
  }

  create(
    data: {
      email: string;
      passwordHash?: string;
      name?: string;
      role: Role;
      provider: AuthProvider;
      providerId?: string;
    },
    tx?: Prisma.TransactionClient
  ) {
    const client = this.getPrismaClient(tx);
    return client.user.create({ data });
  }

  getUsers(tx?: Prisma.TransactionClient) {
    const client = this.getPrismaClient(tx);
    return client.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        provider: true,
        createdAt: true,
      }
    });
  }
}
