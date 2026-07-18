import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendCreated, sendNoContent } from "../../../common/helpers";
import { ForbiddenException, BadRequestException } from "../../../common/exceptions";
import { Messages } from "../../../common/constants";
import { DocumentService } from "../application/document.service";
import { ChatService } from "../application/chat.service";
import { QueueService } from "../application/queue.service";
import { CreateChatDto, SendMessageDto, pdfChatValidation } from "./pdf-chat.validation";

export class PdfChatController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly chatService: ChatService,
    private readonly queueService: QueueService
  ) {}

  // ─── Documents ──────────────────────────────────────────────────────────────

  uploadDocument = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException(Messages.UNAUTHORIZED);

    const file = req.file;
    if (!file) throw new BadRequestException("No PDF file provided");

    const document = await this.documentService.createDocument({
      userId,
      filename: file.originalname,
      fileSize: file.size,
      filePath: file.path,
    });

    // The transaction has already persisted an outbox event. Wake the
    // publisher now for low latency; periodic publishing covers failures.
    void this.queueService.publishPendingIndexingJobs();

    sendCreated(res, Messages.PDF_CHAT.DOCUMENT_UPLOADED, document);
  });

  getDocuments = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException(Messages.UNAUTHORIZED);

    const documents = await this.documentService.getDocumentsByUser(userId);
    sendSuccess(res, Messages.PDF_CHAT.DOCUMENTS_FETCHED, documents);
  });

  deleteDocument = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException(Messages.UNAUTHORIZED);

    const { id } = pdfChatValidation.paramId.parse(req.params);
    await this.documentService.deleteDocument(id, userId);
    sendNoContent(res);
  });

  // ─── Chats ───────────────────────────────────────────────────────────────────

  createChat = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.userId;
      if (!userId) throw new ForbiddenException(Messages.UNAUTHORIZED);

      const body = req.body as CreateChatDto;
      const chat = await this.chatService.createChat(userId, body.documentId);
      sendCreated(res, Messages.PDF_CHAT.CHAT_CREATED, chat);
    }
  );

  getChats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException(Messages.UNAUTHORIZED);

    const chats = await this.chatService.getChatsByUser(userId);
    sendSuccess(res, Messages.PDF_CHAT.CHATS_FETCHED, chats);
  });

  deleteChat = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException(Messages.UNAUTHORIZED);

    const { id } = pdfChatValidation.paramId.parse(req.params);
    await this.chatService.deleteChat(id, userId);
    sendNoContent(res);
  });

  // ─── Messages ────────────────────────────────────────────────────────────────

  getMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException(Messages.UNAUTHORIZED);

    const { id } = pdfChatValidation.paramId.parse(req.params);
    const messages = await this.chatService.getMessages(id, userId);
    sendSuccess(res, Messages.PDF_CHAT.MESSAGES_FETCHED, messages);
  });

  sendMessage = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.userId;
      if (!userId) throw new ForbiddenException(Messages.UNAUTHORIZED);

      const { id } = pdfChatValidation.paramId.parse(req.params);
      const body = req.body as SendMessageDto;

      // Set up Server-Sent Events headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      
      // Tell client it's starting
      res.flushHeaders();

      try {
        const stream = this.chatService.streamMessage(id, userId, body.content);
        
        for await (const event of stream) {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
      } catch (err: any) {
        // If error occurs during stream, we can send an error event
        res.write(`data: ${JSON.stringify({ type: "error", error: err.message || "Unknown error" })}\n\n`);
      } finally {
        res.end();
      }
    }
  );
}
