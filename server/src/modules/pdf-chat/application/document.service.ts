import { DocumentRepository } from "../infrastructure/document.repository";
import { NotFoundException, ForbiddenException, ConflictException } from "../../../common/exceptions";
import { DocumentStatus } from "../../../../generated/prisma/client";
import { FileStorageService } from "../infrastructure/file-storage.service";
import { PrismaService } from "../../../common/database";
import { IndexingOutboxRepository } from "../infrastructure/indexing-outbox.repository";
import { RagService } from "./rag.service";

export class DocumentService {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly fileStorageService: FileStorageService,
    private readonly prismaService: PrismaService,
    private readonly indexingOutboxRepository: IndexingOutboxRepository,
    private readonly ragService: RagService
  ) {}

  async createDocument(params: {
    userId: string;
    filename: string;
    fileSize: number;
    filePath?: string;
  }) {
    if (!params.filePath) {
      throw new NotFoundException("Uploaded PDF file not found");
    }

    // The document and its indexing intent commit together. A Redis outage can
    // delay indexing, but it cannot strand a committed document without work.
    try {
      return await this.prismaService.executeTx(async (tx) => {
        const document = await this.documentRepository.create({
          userId: params.userId,
          filename: params.filename,
          fileSize: params.fileSize,
          filePath: params.filePath,
        }, tx);
        await this.indexingOutboxRepository.createIndexingRequested({
          documentId: document.id,
          filePath: params.filePath!,
          userId: params.userId,
        }, tx);
        return document;
      });
    } catch (error) {
      // Multer writes first; roll back that local side effect when the database
      // transaction could not commit.
      await this.fileStorageService.deleteIfExists(params.filePath);
      throw error;
    }
  }

  async getDocumentsByUser(userId: string) {
    return this.documentRepository.findByUserId(userId);
  }

  async getDocumentById(id: string) {
    const doc = await this.documentRepository.findById(id);
    if (!doc) {
      throw new NotFoundException("Document not found");
    }
    return doc;
  }

  async deleteDocument(id: string, userId: string) {
    const doc = await this.documentRepository.findById(id);

    if (!doc) {
      throw new NotFoundException("Document not found");
    }

    if (doc.userId !== userId) {
      throw new ForbiddenException("You do not have permission to delete this document");
    }

    if (["PROCESSING", "EMBEDDING", "INDEXING"].includes(doc.status)) {
      throw new ConflictException("Document is currently being indexed and cannot be deleted");
    }

    // Qdrant is outside PostgreSQL, so remove vectors before the final guarded
    // delete. If the database state changes meanwhile, the caller can retry.
    await this.ragService.deleteDocumentVectors(id);
    const result = await this.documentRepository.deleteIfInactive(id, userId);
    if (result.count === 0) {
      throw new ConflictException("Document is currently being indexed and cannot be deleted");
    }

    if (doc.filePath) await this.fileStorageService.deleteIfExists(doc.filePath);
  }

  async updateProgress(id: string, status: DocumentStatus, progress: number) {
    const result = await this.documentRepository.updateProgress(id, status, progress);
    return result.count === 1;
  }

  async updateError(id: string, error: string) {
    const result = await this.documentRepository.updateError(id, error);
    return result.count === 1;
  }

  async requeueForRetry(id: string, error: string) {
    const result = await this.documentRepository.requeueForRetry(id, error);
    return result.count === 1;
  }

  async claimForIndexing(id: string) {
    const result = await this.documentRepository.claimForIndexing(id);
    return result.count === 1;
  }
}
