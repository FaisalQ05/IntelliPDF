import { ZodObject, ZodType } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: ZodObject<any> | ZodType<any>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
