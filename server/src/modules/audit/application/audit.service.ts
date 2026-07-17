import { Prisma } from "../../../../generated/prisma/client";
import { LoginLogRepository } from "../infrastructure/login-log.repository";
import { CreateLoginLogParams } from "../domain/audit.types";

export class AuditService {
  constructor(private readonly loginLogRepository: LoginLogRepository) {}

  async createLoginLog(
    params: CreateLoginLogParams,
    context?: Prisma.TransactionClient
  ) {
    return this.loginLogRepository.create(params, context);
  }

  async getLoginLogs() {
    return this.loginLogRepository.getLogs();
  }
}
