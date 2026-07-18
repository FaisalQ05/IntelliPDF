import { describe, expect, it, vi } from "vitest";
import { AuthService } from "../src/modules/auth/application/auth.service";
import { ConflictException, UnauthorizedException } from "../src/common/exceptions";
import { tx, user } from "./helpers";

function createService() {
  const prisma = { executeTx: vi.fn(async (callback) => callback(tx)) };
  const users = { findByEmail: vi.fn(), createUser: vi.fn(), upsertGoogleUser: vi.fn(), findByUserId: vi.fn() };
  const hash = { hash: vi.fn().mockResolvedValue("password-hash"), compare: vi.fn().mockResolvedValue(true) };
  const tokens = { createForUser: vi.fn().mockResolvedValue({ accessToken: "access", refreshToken: "refresh" }), rotate: vi.fn(), revoke: vi.fn() };
  const google = { getToken: vi.fn(), verifyIdToken: vi.fn() };
  return { service: new AuthService(prisma as any, users as any, hash as any, tokens as any, google as any), prisma, users, hash, tokens, google };
}

describe("AuthService", () => {
  it("creates a local account and issues tokens in one transaction", async () => {
    const { service, users, tokens, hash } = createService();
    users.findByEmail.mockResolvedValue(null);
    users.createUser.mockResolvedValue(user);

    await expect(service.localSignup({ email: user.email, name: "Test User", password: "Valid@123" }, "127.0.0.1"))
      .resolves.toEqual({ accessToken: "access", refreshToken: "refresh" });

    expect(hash.hash).toHaveBeenCalledBefore(users.createUser as any);
    expect(users.createUser).toHaveBeenCalledWith(expect.objectContaining({ passwordHash: "password-hash" }), tx);
    expect(tokens.createForUser).toHaveBeenCalledWith(user, user.email, "127.0.0.1", tx);
  });

  it("does not create duplicate local accounts", async () => {
    const { service, users } = createService();
    users.findByEmail.mockResolvedValue(user);
    await expect(service.localSignup({ email: user.email, name: "Test User", password: "Valid@123" })).rejects.toBeInstanceOf(ConflictException);
  });

  it("verifies Google identity before atomically upserting the user", async () => {
    const { service, google, users, tokens } = createService();
    google.getToken.mockResolvedValue({ tokens: { id_token: "google-id-token" } });
    google.verifyIdToken.mockResolvedValue({ getPayload: () => ({ email: user.email, name: user.name, sub: "google-sub" }) });
    users.upsertGoogleUser.mockResolvedValue({ ...user, provider: "GOOGLE" });

    await service.googleLogin("authorization-code");

    expect(users.upsertGoogleUser).toHaveBeenCalledWith({ email: user.email, name: user.name, providerId: "google-sub" }, tx);
    expect(tokens.createForUser).toHaveBeenCalledWith(expect.objectContaining({ provider: "GOOGLE" }), user.email, undefined, tx);
  });

  it("rejects an invalid Google authorization code", async () => {
    const { service, google } = createService();
    google.getToken.mockRejectedValue(new Error("invalid"));
    await expect(service.googleLogin("bad-code")).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
