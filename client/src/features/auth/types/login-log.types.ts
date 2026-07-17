import type { AuthProvider, User } from "./user.types"

export type LoginLog = {
  id: string
  userId?: string | null
  user?: User | null

  email?: string | null
  provider: AuthProvider

  success: boolean
  ipAddress?: string | null

  loginAt: Date
}
