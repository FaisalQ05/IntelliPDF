import { ChatRepository } from "../infrastructure/chat.repository";

export class ChatMessageService {
  constructor(private readonly chatRepository: ChatRepository) {}

  getHistory(chatId: string) {
    return this.chatRepository.findMessagesByChatId(chatId);
  }

  createUserMessage(chatId: string, content: string) {
    return this.chatRepository.createMessage({ chatId, role: "USER", content });
  }

  createAssistantMessage(chatId: string, content: string, citations?: unknown) {
    return this.chatRepository.createMessage({ chatId, role: "ASSISTANT", content, citations });
  }
}
