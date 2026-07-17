// src/features/auth/login/types/login.dto.ts

import type { Role } from "@/features/auth/types/user.types"

export interface LoginDTO {
  email: string
  password: string
}
export interface LoginResponseDTO {
  accessToken: string
}

export interface GetMeResponseDTO {
  id: string
  role: Role
  provider: string
  name: string
  email: string
}

export interface GoogleLoginDTO {
  code: string
}
export interface GoogleLoginResponseDTO {
  accessToken: string
}

export interface SignupDTO {
  name: string
  email: string
  password: string
}

export interface SignupResponseDTO {
  accessToken: string
}
