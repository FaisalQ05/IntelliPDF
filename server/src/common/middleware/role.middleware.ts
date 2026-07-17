import { NextFunction, Request, Response } from "express";
import { Role } from "../../../generated/prisma/client";
import { ForbiddenException } from "../exceptions/forbidden.exception";
import { Messages } from "../constants";

export const roles =
  (...allowedRoles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ForbiddenException(Messages.UNAUTHORIZED);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException(Messages.FORBIDDEN);
    }

    next();
  };
