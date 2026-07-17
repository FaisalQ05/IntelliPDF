export interface JwtPayload {
  userId: string;
  role: string;
  sessionId: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  tokens: Tokens;
}
