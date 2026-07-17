import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "../../../generated/prisma/client";

import { AppException } from "../exceptions/app.exception";
import { handlePrismaError } from "../helpers/prisma-error.helper";
import { logger } from "../../config/logger.config";
import { HttpStatus, Messages } from "../constants";

export const errorMiddleware = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = req.requestId;

  if (error instanceof ZodError) {
    const formattedErrors = formatZodError(error);
    logger.warn("Validation failed", { requestId, errors: formattedErrors });
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: Messages.VALIDATION_FAILED,
      errors: formattedErrors,
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(error);
    logger.warn(`Prisma error: ${prismaError.message}`, {
      requestId,
      code: error.code,
    });

    return res.status(prismaError.statusCode).json({
      success: false,
      message: prismaError.message,
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  if (error instanceof AppException) {
    logger.warn(`AppException: ${error.message}`, {
      requestId,
      statusCode: error.statusCode,
      errors: error.errors,
    });
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  logger.error("Unhandled error", { requestId, error });

  return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: Messages.ERROR,
    timestamp: new Date().toISOString(),
    requestId,
  });
};

function formatZodError(error: ZodError) {
  return error.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}
