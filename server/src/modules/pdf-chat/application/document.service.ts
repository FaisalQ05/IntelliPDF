import { DocumentRepository } from "../infrastructure/document.repository";
import { NotFoundException, ForbiddenException } from "../../../common/exceptions";
import { DocumentStatus } from "../../../../generated/prisma/client";
import { FileStorageService } from "../infrastructure/file-storage.service";

export class DocumentService {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly fileStorageService: FileStorageService
  ) {}

  async createDocument(params: {
    userId: string;
    filename: string;
    fileSize: number;
    filePath?: string;
  }) {
    return this.documentRepository.create({
      userId: params.userId,
      filename: params.filename,
      fileSize: params.fileSize,
      filePath: params.filePath,
    });
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

    if (doc.filePath) {
      await this.fileStorageService.deleteIfExists(doc.filePath);
    }

    return this.documentRepository.delete(id);
  }

  async updateProgress(id: string, status: DocumentStatus, progress: number) {
    return this.documentRepository.updateProgress(id, status, progress);
  }

  async updateError(id: string, error: string) {
    return this.documentRepository.updateError(id, error);
  }
}
