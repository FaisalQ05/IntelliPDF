import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterAll, describe, expect, it, vi } from "vitest";
import { mkdir, rm } from "fs/promises";
import path from "path";
import { AuthController } from "../src/modules/auth/presentation/auth.controller";
import { createAuthRoutes } from "../src/modules/auth/presentation/auth.routes";
import { PdfChatController } from "../src/modules/pdf-chat/presentation/pdf-chat.controller";
import { createPdfChatRoutes } from "../src/modules/pdf-chat/presentation/pdf-chat.routes";
import { errorMiddleware } from "../src/common/middleware/error.middleware";
import { document, streamOf, user } from "./helpers";

const uploadsDirectory = path.resolve(process.cwd(), "uploads");
afterAll(async () => { await rm(uploadsDirectory, { recursive: true, force: true }); });

const jwt = { verifyAccessToken: vi.fn(() => ({ userId: user.id, role: "USER" })) };

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  return app;
}

describe("authentication routes", () => {
  it("returns an access token and refresh cookie after local signup", async () => {
    const auth = {
      localSignup: vi.fn().mockResolvedValue({ accessToken: "access", refreshToken: "refresh" }),
      localLogin: vi.fn(), googleLogin: vi.fn(), refreshToken: vi.fn(), getMe: vi.fn(), logOut: vi.fn(),
    };
    const app = makeApp();
    app.use("/auth", createAuthRoutes(new AuthController(auth as any), jwt as any));
    app.use(errorMiddleware);

    const response = await request(app).post("/auth/local-signup").send({ name: "Test User", email: user.email, password: "Valid@123" });

    expect(response.status).toBe(201);
    expect(response.body.data.accessToken).toBe("access");
    expect(response.headers["set-cookie"][0]).toContain("refreshToken=refresh");
    expect(auth.localSignup).toHaveBeenCalledWith(expect.objectContaining({ email: user.email }), expect.anything());
  });

  it("rejects an invalid signup payload before calling the service", async () => {
    const auth = { localSignup: vi.fn(), localLogin: vi.fn(), googleLogin: vi.fn(), refreshToken: vi.fn(), getMe: vi.fn(), logOut: vi.fn() };
    const app = makeApp();
    app.use("/auth", createAuthRoutes(new AuthController(auth as any), jwt as any));
    app.use(errorMiddleware);

    const response = await request(app).post("/auth/local-signup").send({ name: "x", email: "bad", password: "weak" });

    expect(response.status).toBe(400);
    expect(auth.localSignup).not.toHaveBeenCalled();
  });
});

describe("PDF chat routes", () => {
  it("accepts an authenticated multipart PDF upload and wakes the outbox publisher", async () => {
    await mkdir(uploadsDirectory, { recursive: true });
    const documents = { createDocument: vi.fn().mockResolvedValue(document), getDocumentsByUser: vi.fn(), deleteDocument: vi.fn() };
    const chats = { createChat: vi.fn(), getChatsByUser: vi.fn(), deleteChat: vi.fn(), getMessages: vi.fn(), streamMessage: vi.fn() };
    const queue = { publishPendingIndexingJobs: vi.fn().mockResolvedValue(undefined) };
    const app = makeApp();
    app.use("/pdf-chat", createPdfChatRoutes(new PdfChatController(documents as any, chats as any, queue as any), jwt as any));
    app.use(errorMiddleware);

    const response = await request(app)
      .post("/pdf-chat/documents")
      .set("Authorization", "Bearer access")
      .attach("file", Buffer.from("%PDF-1.4 test"), { filename: "handbook.pdf", contentType: "application/pdf" });

    expect(response.status).toBe(201);
    expect(documents.createDocument).toHaveBeenCalledWith(expect.objectContaining({ userId: user.id, filename: "handbook.pdf" }));
    expect(queue.publishPendingIndexingJobs).toHaveBeenCalledOnce();
  });

  it("rejects an unauthenticated document request", async () => {
    const app = makeApp();
    app.use("/pdf-chat", createPdfChatRoutes(new PdfChatController({} as any, {} as any, {} as any), jwt as any));
    app.use(errorMiddleware);

    const response = await request(app).get("/pdf-chat/documents");
    expect(response.status).toBe(401);
  });

  it("streams message, citation, chunk, and completion events over SSE", async () => {
    const documents = { createDocument: vi.fn(), getDocumentsByUser: vi.fn(), deleteDocument: vi.fn() };
    const chats = {
      createChat: vi.fn(), getChatsByUser: vi.fn(), deleteChat: vi.fn(), getMessages: vi.fn(),
      streamMessage: vi.fn(() => streamOf([
        { type: "user_message", message: { id: "u" } },
        { type: "citations", citations: [{ pageContent: "source" }] },
        { type: "chunk", content: "Hello" },
        { type: "done", message: { id: "a" } },
      ])),
    };
    const app = makeApp();
    app.use("/pdf-chat", createPdfChatRoutes(new PdfChatController(documents as any, chats as any, { publishPendingIndexingJobs: vi.fn() } as any), jwt as any));
    app.use(errorMiddleware);

    const response = await request(app)
      .post(`/pdf-chat/chats/${"5d59a3ee-6351-4bc2-81e3-3beb6033888a"}/messages`)
      .set("Authorization", "Bearer access")
      .send({ content: "What does the document say?" });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/event-stream");
    expect(response.text).toContain('"type":"citations"');
    expect(response.text).toContain('"type":"chunk"');
    expect(chats.streamMessage).toHaveBeenCalledWith(expect.any(String), user.id, "What does the document say?");
  });
});
