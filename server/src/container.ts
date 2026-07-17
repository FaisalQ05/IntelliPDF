import { OAuth2Client } from "google-auth-library";
import { prismaService } from "./common/database/prisma";
import { env } from "./config";
import { SocketService } from "./common/services/socket.service";

import {
  AuthController,
  SessionRepository,
  AuthService,
  JwtService,
  HashService,
  SessionService,
  AuthTokenService,
} from "./modules/auth";

import {
  LoginLogRepository,
  AuditService,
  AuditController,
} from "./modules/audit";

import {
  UserRepository,
  UserService,
  UserController,
} from "./modules/users";

import {
  DocumentRepository,
  ChatRepository,
  DocumentService,
  ChatService,
  ChatMessageService,
  FileStorageService,
  PdfChatController,
  RagService,
  QueueService,
  WorkerService,
} from "./modules/pdf-chat";

export function createContainer() {
  // repos
  const userRepository = new UserRepository(prismaService);
  const sessionRepository = new SessionRepository(prismaService);
  const loginLogRepository = new LoginLogRepository(prismaService);
  const documentRepository = new DocumentRepository(prismaService);
  const chatRepository = new ChatRepository(prismaService);

  // infra services
  const jwtService = new JwtService();
  const socketService = new SocketService(jwtService);
  const hashService = new HashService();
  const sessionService = new SessionService(sessionRepository);
  const auditService = new AuditService(loginLogRepository);
  const userService = new UserService(userRepository);
  const authTokenService = new AuthTokenService(sessionService, auditService, hashService, jwtService);
  const fileStorageService = new FileStorageService();
  const documentService = new DocumentService(documentRepository, fileStorageService);
  const ragService = new RagService();
  const queueService = new QueueService();
  const workerService = new WorkerService(ragService, documentService, socketService);
  const chatMessageService = new ChatMessageService(chatRepository);
  const chatService = new ChatService(chatRepository, documentService, ragService, chatMessageService);

  const googleClient = new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    "postmessage"
  );

  // services
  const authService = new AuthService(
    prismaService,
    userService,
    hashService,
    authTokenService,
    googleClient
  );

  // controllers
  const authController = new AuthController(authService);
  const auditController = new AuditController(auditService);
  const userController = new UserController(userService);
  const pdfChatController = new PdfChatController(documentService, chatService, queueService);

  return {
    authController,
    auditController,
    userController,
    pdfChatController,
    jwtService,
    socketService,
    queueService,
    workerService,
    fileStorageService,
  };
}

export type AppContainer = ReturnType<typeof createContainer>;
