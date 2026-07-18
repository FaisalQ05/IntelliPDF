import app, { container } from "./app";
import { prismaService } from "../common/database/prisma";
import { env, logger } from "../config";

const start = async () => {
  try {
    await container.fileStorageService.ensureUploadsDirectory();
    await prismaService.connect();
    container.queueService.startOutboxPublisher();

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    });

    container.socketService.initialize(server);

    const shutdown = async () => {
      logger.info("Shutting down gracefully...");

      server.close(async () => {
        container.socketService.close();
        await container.queueService.close();
        await container.workerService.close();
        await prismaService.disconnect();
        logger.info("Server closed.");
        process.exit(0);
      });

      // Force close if taking too long
      setTimeout(() => {
        logger.error("Forced shutdown after timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    logger.error(`Failed to start server:`, { error });
    process.exit(1);
  }
};

start();
