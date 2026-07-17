import { Router, type Router as ExpressRouter } from "express";
import { createAuthRoutes } from "../modules/auth";
import { createAuditRoutes } from "../modules/audit";
import { createUserRoutes } from "../modules/users";
import { createPdfChatRoutes } from "../modules/pdf-chat";
import { AppContainer } from "../container";

export const createRouter = (container: AppContainer): ExpressRouter => {
  const router = Router();
  const v1Router = Router();

  v1Router.use("/auth", createAuthRoutes(container.authController, container.jwtService));
  v1Router.use("/audit", createAuditRoutes(container.auditController, container.jwtService));
  v1Router.use("/users", createUserRoutes(container.userController, container.jwtService));
  v1Router.use("/pdf-chat", createPdfChatRoutes(container.pdfChatController, container.jwtService));

  router.use("/api/v1", v1Router);

  return router;
};
