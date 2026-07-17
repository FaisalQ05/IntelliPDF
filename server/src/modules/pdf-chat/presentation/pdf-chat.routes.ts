import { Router, type Router as ExpressRouter } from "express";
import multer from "multer";
import path from "path";
import { auth, validate } from "../../../common/middleware";
import { JwtService } from "../../auth";
import { PdfChatController } from "./pdf-chat.controller";
import { pdfChatValidation } from "./pdf-chat.validation";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(process.cwd(), "uploads"));
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

export const createPdfChatRoutes = (
  controller: PdfChatController,
  jwtService: JwtService
): ExpressRouter => {
  const router = Router();

  // All pdf-chat routes require a valid JWT
  router.use(auth(jwtService));

  // ─── Document routes ─────────────────────────────────────────────────────────
  router.post("/documents", upload.single("file"), controller.uploadDocument);
  router.get("/documents", controller.getDocuments);
  router.delete("/documents/:id", controller.deleteDocument);

  // ─── Chat routes ─────────────────────────────────────────────────────────────
  router.post("/chats", validate(pdfChatValidation.createChat), controller.createChat);
  router.get("/chats", controller.getChats);
  router.delete("/chats/:id", controller.deleteChat);

  // ─── Message routes ───────────────────────────────────────────────────────────
  router.get("/chats/:id/messages", controller.getMessages);
  router.post(
    "/chats/:id/messages",
    validate(pdfChatValidation.sendMessage),
    controller.sendMessage
  );

  return router;
};
