import { randomUUID } from "crypto";
import { Prisma } from "../../../../generated/prisma/client";
import { NotFoundException, UnauthorizedException } from "../../../common/exceptions";
import { AuditService } from "../../audit";
import { HashService } from "../infrastructure/password.service";
import { JwtService } from "../infrastructure/jwt.service";
import { SessionService } from "./session.service";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

type SessionUser = { id: string; role: string; provider: string };

/** Issues, rotates, and revokes the credentials associated with a persisted session. */
export class AuthTokenService {
  constructor(
    private readonly sessionService: SessionService,
    private readonly auditService: AuditService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService
  ) {}

  async createForUser(user: SessionUser, email: string, ip: string | undefined, tx: Prisma.TransactionClient) {
    const sessionId = randomUUID();
    const accessToken = this.jwtService.signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = this.jwtService.signRefreshToken({ userId: user.id, sessionId, role: user.role });
    await this.sessionService.createSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: await this.hashService.hash(refreshToken),
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      ipAddress: ip,
    }, tx);
    await this.auditService.createLoginLog({
      userId: user.id, email, provider: user.provider as any, ipAddress: ip, success: true,
    }, tx);
    return { accessToken, refreshToken };
  }

  async rotate(refreshToken: string, tx: Prisma.TransactionClient) {
    const payload = this.jwtService.verifyRefreshToken(refreshToken);
    const session = await this.sessionService.getSession(payload.userId, payload.sessionId, tx);
    if (!session) throw new NotFoundException("Session not found");
    if (!(await this.hashService.compare(refreshToken, session.refreshTokenHash))) {
      throw new UnauthorizedException("Session not valid");
    }

    const accessToken = this.jwtService.signAccessToken({ userId: session.userId, role: payload.role });
    const nextRefreshToken = this.jwtService.signRefreshToken({
      userId: payload.userId, sessionId: session.id, role: payload.role,
    });
    await this.sessionService.refreshSession(
      session.id,
      await this.hashService.hash(nextRefreshToken),
      new Date(Date.now() + SESSION_DURATION_MS),
      tx
    );
    return { accessToken, refreshToken: nextRefreshToken };
  }

  async revoke(refreshToken: string, tx: Prisma.TransactionClient) {
    const payload = this.jwtService.verifyRefreshToken(refreshToken);
    await this.sessionService.deleteSession(payload.userId, payload.sessionId, tx);
  }
}
