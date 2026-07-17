import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../exceptions/unauthorized.exception";
import { JwtService } from "../../modules/auth";
import { Role } from "../../../generated/prisma/client";
import { Messages } from "../constants";

export const auth =
  (jwtService: JwtService) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException(Messages.UNAUTHORIZED);
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload = jwtService.verifyAccessToken(token);

      req.user = {
        userId: payload.userId,
        role: payload.role as Role,
      };

      next();
    } catch {
      throw new UnauthorizedException(Messages.AUTH.TOKEN_EXPIRED);
    }
  };
