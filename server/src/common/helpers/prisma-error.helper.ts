import { Prisma } from "../../../generated/prisma/client";
import { HttpStatus } from "../constants";

export const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError
) => {
  switch (error.code) {
    case "P2002":
      return {
        statusCode: HttpStatus.CONFLICT,
        message: "Duplicate value",
      };

    case "P2025":
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: "Record not found",
      };

    default:
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Database error",
      };
  }
};
