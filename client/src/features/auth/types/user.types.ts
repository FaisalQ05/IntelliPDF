import type { LoginLog } from "./login-log.types"
import type { Session } from "./session.types"

export type Role = "ADMIN" | "MANAGER" | "USER"
export type AuthProvider = "LOCAL" | "GOOGLE" | "KEYCLOAK"

export type User = {
  id: string
  email: string
  name?: string | null
  role: Role
  provider: AuthProvider
  providerId?: string | null

  sessions?: Session[]
  loginLogs?: LoginLog[]

  createdAt: Date
  updatedAt: Date
}
