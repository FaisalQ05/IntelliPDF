import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../../../common/helpers";
import { AuditService } from "../application/audit.service";
import { Messages } from "../../../common/constants";

export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  getLoginLogs = asyncHandler(async (req: Request, res: Response) => {
    const loginLogs = await this.auditService.getLoginLogs();
    sendSuccess(res, Messages.AUDIT.FETCHED, loginLogs);
  });
}
