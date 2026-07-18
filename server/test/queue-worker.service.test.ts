import { beforeEach, describe, expect, it, vi } from "vitest";

const add = vi.fn();
const workerInstances: any[] = [];
vi.mock("bullmq", () => ({
  Queue: class { add = add; close = vi.fn(); constructor(..._args: unknown[]) {} },
  Worker: class { on = vi.fn(); close = vi.fn(); constructor(_name: string, public processor: any) { workerInstances.push(this); } },
}));
vi.mock("ioredis", () => ({ default: class { disconnect = vi.fn(); constructor(..._args: unknown[]) {} } }));
vi.mock("../src/config", () => ({ env: { REDIS_URL: "redis://test" }, logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

import { QueueService } from "../src/modules/pdf-chat/application/queue.service";
import { WorkerService } from "../src/modules/pdf-chat/application/worker.service";
import { document, streamOf, user } from "./helpers";

describe("QueueService", () => {
  beforeEach(() => add.mockReset());

  it("marks a pending outbox event delivered after BullMQ accepts its stable job ID", async () => {
    const outbox = {
      findDue: vi.fn().mockResolvedValue([{ id: document.id, attempts: 0, payload: { documentId: document.id, filePath: document.filePath, userId: user.id } }]),
      markDelivered: vi.fn(), recordFailure: vi.fn(),
    };
    add.mockResolvedValue({ id: document.id });
    const queue = new QueueService(outbox as any);

    await queue.publishPendingIndexingJobs();

    expect(add).toHaveBeenCalledWith("index-document", expect.objectContaining({ documentId: document.id }), { jobId: document.id });
    expect(outbox.markDelivered).toHaveBeenCalledWith(document.id);
  });

  it("keeps a malformed event pending and records a retryable failure", async () => {
    const outbox = {
      findDue: vi.fn().mockResolvedValue([{ id: document.id, attempts: 2, payload: { documentId: document.id } }]),
      markDelivered: vi.fn(), recordFailure: vi.fn(),
    };
    const queue = new QueueService(outbox as any);

    await queue.publishPendingIndexingJobs();

    expect(outbox.recordFailure).toHaveBeenCalledWith(document.id, 2, "Invalid indexing outbox payload");
    expect(add).not.toHaveBeenCalled();
    expect(outbox.markDelivered).not.toHaveBeenCalled();
  });
});

describe("WorkerService", () => {
  beforeEach(() => workerInstances.splice(0));

  it("skips duplicate delivery when a document is no longer QUEUED", async () => {
    const documents = { claimForIndexing: vi.fn().mockResolvedValue(false), updateProgress: vi.fn(), updateError: vi.fn(), requeueForRetry: vi.fn() };
    const rag = { processDocument: vi.fn() };
    const socket = { emitDocumentProgress: vi.fn() };
    const worker = new WorkerService(rag as any, documents as any, socket as any);

    await (worker as any).processJob({ id: "job", data: { documentId: document.id, filePath: document.filePath, userId: user.id } });

    expect(rag.processDocument).not.toHaveBeenCalled();
    expect(socket.emitDocumentProgress).not.toHaveBeenCalled();
  });

  it("requeues a failed active job while BullMQ retry attempts remain", async () => {
    const documents = {
      claimForIndexing: vi.fn().mockResolvedValue(true), updateProgress: vi.fn().mockResolvedValue(true),
      updateError: vi.fn(), requeueForRetry: vi.fn().mockResolvedValue(true),
    };
    const rag = { processDocument: vi.fn().mockRejectedValue(new Error("Gemini timeout")) };
    const socket = { emitDocumentProgress: vi.fn() };
    const worker = new WorkerService(rag as any, documents as any, socket as any);
    const job = { id: "job", data: { documentId: document.id, filePath: document.filePath, userId: user.id }, attemptsMade: 0, opts: { attempts: 3 }, updateProgress: vi.fn() };

    await expect((worker as any).processJob(job)).rejects.toThrow("Gemini timeout");
    expect(documents.requeueForRetry).toHaveBeenCalledWith(document.id, "Gemini timeout");
    expect(socket.emitDocumentProgress).toHaveBeenCalledWith(user.id, expect.objectContaining({ status: "QUEUED" }));
  });
});
