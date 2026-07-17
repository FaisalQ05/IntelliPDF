import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { env, logger } from "../../../config";
import { RagService } from "./rag.service";
import { DocumentService } from "./document.service";
import { IndexDocumentJobData } from "./queue.service";
import { DocumentStatus } from "../../../../generated/prisma/client";
import { SocketService } from "../../../common/services/socket.service";

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
      // Emit initial QUEUED → PROCESSING transition
      await this.documentService.updateProgress(documentId, "PROCESSING", 5);
      emit("PROCESSING", 5, "Preparing document");

      // The onProgress callback is called by RagService at every pipeline stage.
      // It persists the new state to the DB and broadcasts via Socket.IO.
      const onProgress = async (
        status: DocumentStatus,
        progress: number,
        message?: string
      ) => {
        await this.documentService.updateProgress(documentId, status, progress);
        await job.updateProgress(progress);
        emit(status, progress, message);
      };

      await this.ragService.processDocument(filePath, documentId, onProgress);

      // Final COMPLETED state
      await this.documentService.updateProgress(documentId, "COMPLETED", 100);
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
      logger.error(`Error processing document ${documentId}:`, error);
      const errorMessage = error.message || "Unknown error occurred";
      await this.documentService.updateError(documentId, errorMessage);
      this.socketService.emitDocumentProgress(userId, {
        documentId,
        status: "FAILED",
        progress: 0,
        message: "Indexing failed",
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  async close() {
    await this.worker.close();
    this.connection.disconnect();
    logger.info("WorkerService closed");
  }
}
