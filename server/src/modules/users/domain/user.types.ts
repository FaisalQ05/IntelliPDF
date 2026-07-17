import { Role, AuthProvider } from "../../../../generated/prisma/client";

export interface CreateUserParams {
  email: string;
  passwordHash?: string;
  name?: string;
  role: Role;
  provider: AuthProvider;
  providerId?: string;
}
