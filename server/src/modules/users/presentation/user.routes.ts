import { Router, type Router as ExpressRouter } from "express";
import { auth, roles } from "../../../common/middleware";
import { UserController } from "./user.controller";
import { Role } from "../../../../generated/prisma/client";
import { JwtService } from "../../auth";

export const createUserRoutes = (
  controller: UserController,
  jwtService: JwtService
): ExpressRouter => {
  const router = Router();

  router.get(
    "/",
    auth(jwtService),
    roles(Role.ADMIN, Role.MANAGER),
    controller.getUsers
  );

  return router;
};
