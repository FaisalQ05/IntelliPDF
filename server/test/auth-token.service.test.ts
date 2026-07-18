import { describe, expect, it, vi } from "vitest";
import { AuthTokenService } from "../src/modules/auth/application/auth-token.service";
import { UnauthorizedException } from "../src/common/exceptions";
import { tx, user } from "./helpers";

function createService(overrides: Record<string, unknown> = {}) {
  const sessions = {
    createSession: vi.fn(),
    getSession: vi.fn(),
    refreshSession: vi.fn(),
    deleteSession: vi.fn(),
  };
  const audit = { createLoginLog: vi.fn() };
  const hash = { hash: vi.fn().mockResolvedValue("next-hash"), compare: vi.fn().mockResolvedValue(true) };
  const jwt = {
    signAccessToken: vi.fn().mockReturnValue("access"),
    signRefreshToken: vi.fn().mockReturnValue("refresh"),
    verifyRefreshToken: vi.fn().mockReturnValue({ userId: user.id, sessionId: "session-id", role: "USER" }),
  };
  Object.assign(sessions, overrides.sessions);
  Object.assign(hash, overrides.hash);
  Object.assign(jwt, overrides.jwt);
  return { service: new AuthTokenService(sessions as any, audit as any, hash as any, jwt as any), sessions, audit, hash, jwt };
}

describe("AuthTokenService", () => {
  it("creates a persisted session and audit record in the caller transaction", async () => {
    const { service, sessions, audit } = createService();

    const tokens = await service.createForUser(user, user.email, "127.0.0.1", tx);

    expect(tokens).toEqual({ accessToken: "access", refreshToken: "refresh" });
    expect(sessions.createSession).toHaveBeenCalledWith(expect.objectContaining({ userId: user.id, ipAddress: "127.0.0.1" }), tx);
    expect(audit.createLoginLog).toHaveBeenCalledWith(expect.objectContaining({ userId: user.id, success: true }), tx);
  });

  it("rotates a refresh token with a compare-and-swap update", async () => {
    const { service, sessions } = createService();
    sessions.getSession.mockResolvedValue({ id: "session-id", userId: user.id, refreshTokenHash: "old-hash" });
    sessions.refreshSession.mockResolvedValue({ count: 1 });

    await expect(service.rotate("old-token", tx)).resolves.toEqual({ accessToken: "access", refreshToken: "refresh" });
    expect(sessions.refreshSession).toHaveBeenCalledWith("session-id", "old-hash", "next-hash", expect.any(Date), tx);
  });

  it("rejects a stale concurrent refresh instead of issuing another session", async () => {
    const { service, sessions } = createService();
    sessions.getSession.mockResolvedValue({ id: "session-id", userId: user.id, refreshTokenHash: "old-hash" });
    sessions.refreshSession.mockResolvedValue({ count: 0 });

    await expect(service.rotate("old-token", tx)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
