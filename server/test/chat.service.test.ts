import { describe, expect, it, vi } from "vitest";
import { ChatService } from "../src/modules/pdf-chat/application/chat.service";
import { ForbiddenException } from "../src/common/exceptions";
import { document, streamOf, user } from "./helpers";

function createService() {
  const chats = { createChat: vi.fn(), findChatsByUserId: vi.fn(), findChatById: vi.fn(), findMessagesByChatId: vi.fn(), deleteChat: vi.fn() };
  const documents = { getDocumentById: vi.fn() };
  const rag = { askQuestionStream: vi.fn() };
  const messages = { getHistory: vi.fn(), createUserMessage: vi.fn(), createAssistantMessage: vi.fn() };
  return { service: new ChatService(chats as any, documents as any, rag as any, messages as any), chats, documents, rag, messages };
}

describe("ChatService", () => {
  it("prevents creating a chat for another user's document", async () => {
    const { service, documents } = createService();
    documents.getDocumentById.mockResolvedValue({ ...document, userId: "another-user" });
    await expect(service.createChat(user.id, document.id)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("persists user and assistant messages around a streamed cited answer", async () => {
    const { service, chats, messages, rag } = createService();
    chats.findChatById.mockResolvedValue({ id: "chat-id", userId: user.id, documentId: document.id });
    messages.getHistory.mockResolvedValue([{ role: "USER", content: "Earlier question" }]);
    messages.createUserMessage.mockResolvedValue({ id: "user-message", content: "What does it say?" });
    messages.createAssistantMessage.mockResolvedValue({ id: "assistant-message", content: "It says hello." });
    const citations = [{ pageContent: "hello", metadata: { page: 1 }, score: 0.9 }];
    rag.askQuestionStream.mockResolvedValue({ stream: streamOf(["It says ", "hello."]), documents: citations });

    const events = [];
    for await (const event of service.streamMessage("chat-id", user.id, "What does it say?")) events.push(event);

    expect(events.map((event: any) => event.type)).toEqual(["user_message", "citations", "chunk", "chunk", "done"]);
    expect(messages.createAssistantMessage).toHaveBeenCalledWith("chat-id", "It says hello.", citations);
  });

  it("does not reveal another user's chat", async () => {
    const { service, chats } = createService();
    chats.findChatById.mockResolvedValue({ id: "chat-id", userId: "another-user", documentId: document.id });
    await expect(service.getChatById("chat-id", user.id)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
