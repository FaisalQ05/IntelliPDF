import { Router, type Router as ExpressRouter } from "express";
import { auth, roles } from "../../../common/middleware";
import { AuditController } from "./audit.controller";
import { Role } from "../../../../generated/prisma/client";
import { JwtService } from "../../auth";

export const createAuditRoutes = (
  controller: AuditController,
  jwtService: JwtService
): ExpressRouter => {
  const router = Router();

  router.get(
    "/login-logs",
    auth(jwtService),
    roles(Role.ADMIN),
    controller.getLoginLogs
  );

  return router;
};
