import { describe, expect, it, vi } from "vitest";
import { DocumentService } from "../src/modules/pdf-chat/application/document.service";
import { ConflictException } from "../src/common/exceptions";
import { document, tx, user } from "./helpers";

function createService() {
  const repository = {
    create: vi.fn(), findById: vi.fn(), findByUserId: vi.fn(), updateProgress: vi.fn(), updateError: vi.fn(),
    requeueForRetry: vi.fn(), claimForIndexing: vi.fn(), deleteIfInactive: vi.fn(),
  };
  const files = { deleteIfExists: vi.fn() };
  const prisma = { executeTx: vi.fn(async (callback) => callback(tx)) };
  const outbox = { createIndexingRequested: vi.fn() };
  const rag = { deleteDocumentVectors: vi.fn() };
  return { service: new DocumentService(repository as any, files as any, prisma as any, outbox as any, rag as any), repository, files, prisma, outbox, rag };
}

describe("DocumentService", () => {
  it("commits the document and durable indexing request in the same transaction", async () => {
    const { service, repository, outbox } = createService();
    repository.create.mockResolvedValue(document);

    await expect(service.createDocument({ userId: user.id, filename: document.filename, fileSize: 1024, filePath: document.filePath }))
      .resolves.toEqual(document);

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ userId: user.id }), tx);
    expect(outbox.createIndexingRequested).toHaveBeenCalledWith({ documentId: document.id, filePath: document.filePath, userId: user.id }, tx);
  });

  it("cleans up the uploaded file when the document transaction fails", async () => {
    const { service, repository, files } = createService();
    repository.create.mockRejectedValue(new Error("database unavailable"));

    await expect(service.createDocument({ userId: user.id, filename: document.filename, fileSize: 1024, filePath: document.filePath })).rejects.toThrow("database unavailable");
    expect(files.deleteIfExists).toHaveBeenCalledWith(document.filePath);
  });

  it("rejects deletion while indexing is active", async () => {
    const { service, repository } = createService();
    repository.findById.mockResolvedValue({ ...document, status: "EMBEDDING" });
    await expect(service.deleteDocument(document.id, user.id)).rejects.toBeInstanceOf(ConflictException);
  });

  it("removes vectors before an inactive document and file", async () => {
    const { service, repository, rag, files } = createService();
    repository.findById.mockResolvedValue({ ...document, status: "COMPLETED" });
    repository.deleteIfInactive.mockResolvedValue({ count: 1 });

    await service.deleteDocument(document.id, user.id);

    expect(rag.deleteDocumentVectors).toHaveBeenCalledWith(document.id);
    expect(repository.deleteIfInactive).toHaveBeenCalledWith(document.id, user.id);
    expect(files.deleteIfExists).toHaveBeenCalledWith(document.filePath);
  });

  it("exposes conditional state changes for workers", async () => {
    const { service, repository } = createService();
    repository.claimForIndexing.mockResolvedValue({ count: 1 });
    repository.updateProgress.mockResolvedValue({ count: 0 });
    repository.requeueForRetry.mockResolvedValue({ count: 1 });

    await expect(service.claimForIndexing(document.id)).resolves.toBe(true);
    await expect(service.updateProgress(document.id, "EMBEDDING", 50)).resolves.toBe(false);
    await expect(service.requeueForRetry(document.id, "provider timeout")).resolves.toBe(true);
  });
});
