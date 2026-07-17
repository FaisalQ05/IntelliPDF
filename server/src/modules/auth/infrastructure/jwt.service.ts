import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../../../config";
import { Messages } from "../../../common/constants";
import { UnauthorizedException } from "../../../common/exceptions";

type AccessTokenPayload = JwtPayload & {
  userId: string;
  role: string;
};

type RefreshTokenPayload = JwtPayload & {
  userId: string;
  sessionId: string;
  role: string;
};

export class JwtService {
  private readonly issuer = "auth-api";

  signAccessToken(payload: AccessTokenPayload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: "15m",
      issuer: this.issuer,
    });
  }

  signRefreshToken(payload: RefreshTokenPayload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
      issuer: this.issuer,
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: this.issuer,
      });
      return decoded as AccessTokenPayload;
    } catch {
      throw new UnauthorizedException(Messages.AUTH.TOKEN_EXPIRED);
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
        issuer: this.issuer,
      });
      return decoded as RefreshTokenPayload;
    } catch {
      throw new UnauthorizedException(Messages.AUTH.REFRESH_TOKEN_EXPIRED);
    }
  }
}
