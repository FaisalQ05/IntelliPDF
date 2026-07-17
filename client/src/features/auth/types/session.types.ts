import type { User } from "./user.types"

export type Session = {
  id: string
  userId: string
  user?: User

  refreshTokenHash: string

  ipAddress?: string | null

  isActive: boolean
  revoked: boolean

  createdAt: Date
  expiresAt: Date
}
