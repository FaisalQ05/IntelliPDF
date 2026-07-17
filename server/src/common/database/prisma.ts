import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../../generated/prisma/client";
import { Pool } from "pg";
import { env, logger } from "../../config";

export type DbClient = PrismaService | Prisma.TransactionClient;

export class PrismaService extends PrismaClient {
  private readonly pool: Pool;

  constructor() {
    const pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: env.NODE_ENV === "production" ? 20 : 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 2_000,
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });

    this.pool = pool;
  }

  async connect() {
    logger.info("Connecting to database...");
    await this.$connect();
    logger.info("Connected to database");
  }

  async disconnect() {
    logger.info("Disconnecting from database...");
    await this.$disconnect();
    await this.pool.end();
    logger.info("Disconnected from database");
  }

  async executeTx<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      return callback(tx);
    });
  }
}

// Singleton ... same globalThis pattern to prevent hot-reload issues
const globalForPrisma = globalThis as unknown as {
  prismaService: PrismaService | undefined;
};

export const prismaService =
  globalForPrisma.prismaService ?? new PrismaService();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prismaService = prismaService;
}
