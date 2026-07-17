import { Response } from "express";
import { HttpStatus } from "../constants";

export const sendResponse = <T>(
  res: Response,
  {
    statusCode = HttpStatus.OK,
    success = true,
    message = "Success",
    data,
  }: {
    statusCode?: number;
    success?: boolean;
    message?: string;
    data?: T;
  }
) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const sendSuccess = <T>(res: Response, message: string, data?: T) => {
  return sendResponse(res, { statusCode: HttpStatus.OK, message, data });
};

export const sendCreated = <T>(res: Response, message: string, data?: T) => {
  return sendResponse(res, { statusCode: HttpStatus.CREATED, message, data });
};

export const sendNoContent = (res: Response) => {
  return res.status(HttpStatus.NO_CONTENT).send();
};
