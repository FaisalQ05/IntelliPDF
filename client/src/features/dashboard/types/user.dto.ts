import type { User } from "@/features/auth/types/user.types"

export interface GetUsersResponseDTO {
  data: User[]
}
