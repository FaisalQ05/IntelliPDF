import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env, logger } from "../../../config";
import { IndexingOutboxRepository, type IndexingRequestedEvent } from "../infrastructure/indexing-outbox.repository";

export interface IndexDocumentJobData {
  documentId: string;
  filePath: string;
  userId: string;
}

export class QueueService {
  private queue: Queue<IndexDocumentJobData>;
  private connection: IORedis;
  private publisher?: NodeJS.Timeout;
  private publishing = false;

  constructor(private readonly indexingOutboxRepository: IndexingOutboxRepository) {
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

  /**
   * Publishes committed outbox records. Delivery is at-least-once; the stable
   * BullMQ job id and the worker's QUEUED-only claim make repeat delivery safe.
   */
  async publishPendingIndexingJobs() {
    if (this.publishing) return;
    this.publishing = true;

    try {
      const events = await this.indexingOutboxRepository.findDue(100);
      for (const event of events) {
        const payload = event.payload as unknown as IndexingRequestedEvent;
        if (!this.isIndexingEvent(payload)) {
          await this.indexingOutboxRepository.recordFailure(event.id, event.attempts, "Invalid indexing outbox payload");
          continue;
        }

        try {
          await this.queue.add("index-document", payload, { jobId: event.id });
          await this.indexingOutboxRepository.markDelivered(event.id);
          logger.info(`Published indexing job for document ${payload.documentId}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown queue publishing error";
          await this.indexingOutboxRepository.recordFailure(event.id, event.attempts, message);
          logger.error(`Unable to publish indexing job for outbox event ${event.id}`, { error });
        }
      }
    } finally {
      this.publishing = false;
    }
  }

  startOutboxPublisher() {
    if (this.publisher) return;
    void this.publishPendingIndexingJobs();
    this.publisher = setInterval(() => void this.publishPendingIndexingJobs(), 1_000);
    this.publisher.unref();
  }

  async close() {
    if (this.publisher) clearInterval(this.publisher);
    await this.queue.close();
    this.connection.disconnect();
    logger.info("QueueService closed");
  }

  private isIndexingEvent(value: unknown): value is IndexDocumentJobData {
    return typeof value === "object" && value !== null
      && typeof (value as IndexDocumentJobData).documentId === "string"
      && typeof (value as IndexDocumentJobData).filePath === "string"
      && typeof (value as IndexDocumentJobData).userId === "string";
  }
}
