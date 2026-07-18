import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { env, logger } from "../../../config";
import { RagService } from "./rag.service";
import { DocumentService } from "./document.service";
import { IndexDocumentJobData } from "./queue.service";
import { DocumentStatus } from "../../../../generated/prisma/client";
import { SocketService } from "../../../common/services/socket.service";

class IndexingCancelledError extends Error {}

export class WorkerService {
  private worker: Worker<IndexDocumentJobData>;
  private connection: IORedis;

  constructor(
    private readonly ragService: RagService,
    private readonly documentService: DocumentService,
    private readonly socketService: SocketService
  ) {
    this.connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });

    this.worker = new Worker("pdf-indexing-queue", this.processJob.bind(this), {
      connection: this.connection,
      concurrency: 5,
    });

    this.worker.on("completed", (job) => {
      logger.info(
        `Job ${job.id} completed for document ${job.data.documentId}`
      );
    });

    this.worker.on("failed", (job, err) => {
      logger.error(
        `Job ${job?.id} failed for document ${job?.data?.documentId}: ${err.message}`
      );
    });

    logger.info("BullMQ Worker 'pdf-indexing-queue' initialized");
  }

  private async processJob(job: Job<IndexDocumentJobData>) {
    const { documentId, filePath, userId } = job.data;
    logger.info(`Processing document ${documentId}`);

    if (!userId) {
      logger.warn(
        `Job ${job.id} is missing userId — cannot emit socket events`
      );
      throw new Error("Job data is missing required field: userId");
    }

    const emit = (
      status: DocumentStatus,
      progress: number,
      message?: string
    ) => {
      this.socketService.emitDocumentProgress(userId, {
        documentId,
        status,
        progress,
        message,
        error: null,
        timestamp: new Date().toISOString(),
      });
    };

    try {
      // Only the first delivery may move QUEUED work into processing. BullMQ
      // retries and outbox re-delivery therefore cannot index a document twice.
      const claimed = await this.documentService.claimForIndexing(documentId);
      if (!claimed) {
        logger.info(`Skipping already processed or deleted document ${documentId}`);
        return;
      }
      emit("PROCESSING", 5, "Preparing document");

      // The onProgress callback is called by RagService at every pipeline stage.
      // It persists the new state to the DB and broadcasts via Socket.IO.
      const onProgress = async (
        status: DocumentStatus,
        progress: number,
        message?: string
      ) => {
        const updated = await this.documentService.updateProgress(documentId, status, progress);
        if (!updated) throw new IndexingCancelledError();
        await job.updateProgress(progress);
        emit(status, progress, message);
      };

      await this.ragService.processDocument(filePath, documentId, onProgress);

      // Final COMPLETED state
      const completed = await this.documentService.updateProgress(documentId, "COMPLETED", 100);
      if (!completed) throw new IndexingCancelledError();
      this.socketService.emitDocumentProgress(userId, {
        documentId,
        status: "COMPLETED",
        progress: 100,
        message: "Indexing complete — ready to chat!",
        error: null,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Document ${documentId} processed successfully`);
    } catch (error: any) {
      if (error instanceof IndexingCancelledError) {
        logger.info(`Indexing cancelled because document ${documentId} no longer has an active indexing state`);
        return;
      }
      logger.error(`Error processing document ${documentId}:`, error);
      const errorMessage = error.message || "Unknown error occurred";
      const maxAttempts = job.opts.attempts ?? 1;
      if (job.attemptsMade + 1 < maxAttempts) {
        const requeued = await this.documentService.requeueForRetry(documentId, errorMessage);
        if (requeued) {
          this.socketService.emitDocumentProgress(userId, {
            documentId,
            status: "QUEUED",
            progress: 0,
            message: "Indexing failed; retry scheduled",
            error: errorMessage,
            timestamp: new Date().toISOString(),
          });
        }
        throw error;
      }
      const failed = await this.documentService.updateError(documentId, errorMessage);
      if (failed) {
        this.socketService.emitDocumentProgress(userId, {
          documentId,
          status: "FAILED",
          progress: 0,
          message: "Indexing failed",
          error: errorMessage,
          timestamp: new Date().toISOString(),
        });
      }
      throw error;
    }
  }

  async close() {
    await this.worker.close();
    this.connection.disconnect();
    logger.info("WorkerService closed");
  }
}
