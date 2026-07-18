import { describe, expect, it, vi } from "vitest";
import { authValidation } from "../src/modules/auth/presentation/auth.validation";
import { pdfChatValidation } from "../src/modules/pdf-chat/presentation/pdf-chat.validation";
import { ChatRepository } from "../src/modules/pdf-chat/infrastructure/chat.repository";

describe("request validation", () => {
  it("enforces the local password policy", () => {
    expect(() => authValidation.localSignup.parse({ name: "A", email: "not-email", password: "weak" })).toThrow();
    expect(authValidation.localSignup.parse({ name: "Test User", email: "USER@EXAMPLE.COM", password: "Valid@123" }).email).toBe("user@example.com");
  });

  it("rejects invalid chat IDs and oversized messages", () => {
    expect(() => pdfChatValidation.paramId.parse({ id: "not-a-uuid" })).toThrow();
    expect(() => pdfChatValidation.sendMessage.parse({ content: "x".repeat(4001) })).toThrow();
  });
});

describe("ChatRepository", () => {
  it("uses deterministic history ordering for concurrent writes", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = new ChatRepository({ chatMessage: { findMany } } as any);
    await repository.findMessagesByChatId("chat-id");
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] }));
  });
});
