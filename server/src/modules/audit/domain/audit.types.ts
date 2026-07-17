import { AuthProvider } from "../../../../generated/prisma/client";

export interface CreateLoginLogParams {
  userId: string;
  email?: string;
  provider: AuthProvider;
  ipAddress?: string;
  success: boolean;
}
