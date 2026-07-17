import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env, logger } from "../../../config";

export interface IndexDocumentJobData {
  documentId: string;
  filePath: string;
  userId: string;
}

export class QueueService {
  private queue: Queue<IndexDocumentJobData>;
  private connection: IORedis;

  constructor() {
    this.connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
    
    this.queue = new Queue("pdf-indexing-queue", {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for inspection
      },
    });

    logger.info("BullMQ Queue 'pdf-indexing-queue' initialized");
  }

  async enqueueDocumentIndexing(data: IndexDocumentJobData) {
    await this.queue.add("index-document", data);
    logger.info(`Enqueued document indexing job for document ${data.documentId}`);
  }

  async close() {
    await this.queue.close();
    this.connection.disconnect();
    logger.info("QueueService closed");
  }
}
