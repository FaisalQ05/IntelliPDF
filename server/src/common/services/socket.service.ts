import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { JwtService } from "../../modules/auth";
import { logger } from "../../config";

export interface DocumentProgressPayload {
  documentId: string;
  status: string;
  progress: number;
  message?: string;
  error: string | null;
  timestamp: string;
}

export class SocketService {
  private io?: SocketIOServer;

  constructor(private readonly jwtService: JwtService) {}

  public initialize(server: HttpServer) {
    if (this.io) {
      logger.warn("SocketService is already initialized");
      return;
    }

    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*", // Or map to env.ORIGIN for better security
        methods: ["GET", "POST"],
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    if (!this.io) return;
    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }

      try {
        const payload = this.jwtService.verifyAccessToken(token);
        // Attach user info to socket
        socket.data.userId = payload.userId;
        next();
      } catch (err) {
        next(new Error("Authentication error: Invalid or expired token"));
      }
    });
  }

  private setupEventHandlers() {
    if (!this.io) return;
    this.io.on("connection", (socket) => {
      const userId = socket.data.userId;
      
      // Join a private room specifically for this user
      socket.join(`user_${userId}`);
      logger.info(`Socket connected and joined room user_${userId} [Socket ID: ${socket.id}]`);

      socket.on("disconnect", () => {
        logger.info(`Socket disconnected [Socket ID: ${socket.id}]`);
      });
    });
  }

  /**
   * Broadcasts indexing progress to a specific user.
   */
  public emitDocumentProgress(userId: string, payload: DocumentProgressPayload) {
    if (!this.io) {
      logger.warn("Cannot emit event: SocketService not initialized");
      return;
    }
    this.io.to(`user_${userId}`).emit("document_progress", payload);
  }

  public close() {
    if (this.io) {
      this.io.close();
    }
  }
}
