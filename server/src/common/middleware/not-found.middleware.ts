import { Request, Response } from "express";
import { HttpStatus } from "../constants";

export const notFoundMiddleware = (req: Request, res: Response) => {
  res.status(HttpStatus.NOT_FOUND).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
};
