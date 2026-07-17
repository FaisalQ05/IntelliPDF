import { ChatRepository } from "../infrastructure/chat.repository";
import { DocumentService } from "./document.service";
import { NotFoundException, ForbiddenException } from "../../../common/exceptions";

import { RagService } from "./rag.service";
import { ChatMessageService } from "./chat-message.service";

export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly documentService: DocumentService,
    private readonly ragService: RagService,
    private readonly chatMessageService: ChatMessageService
  ) {}

  async createChat(userId: string, documentId: string) {
    // Verify document exists and belongs to user
    const doc = await this.documentService.getDocumentById(documentId);

    if (doc.userId !== userId) {
      throw new ForbiddenException("You do not have access to this document");
    }

    return this.chatRepository.createChat({ userId, documentId });
  }

  async getChatsByUser(userId: string) {
    return this.chatRepository.findChatsByUserId(userId);
  }

  async getChatById(id: string, userId: string) {
    const chat = await this.chatRepository.findChatById(id);

    if (!chat) {
      throw new NotFoundException("Chat not found");
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException("You do not have access to this chat");
    }

    return chat;
  }

  async getMessages(chatId: string, userId: string) {
    // Verify chat ownership
    await this.getChatById(chatId, userId);
    return this.chatRepository.findMessagesByChatId(chatId);
  }

  async *streamMessage(chatId: string, userId: string, content: string) {
    // Verify chat ownership
    const chat = await this.getChatById(chatId, userId);

    // Fetch chat history BEFORE persisting the new user message
    const history = await this.chatMessageService.getHistory(chatId);

    // Persist user message
    const userMessage = await this.chatMessageService.createUserMessage(chatId, content);
    
    // Yield the created user message as a special event so frontend can update its cache if needed
    yield { type: "user_message", message: userMessage };

    // Map to role/content
    const formattedHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Get the stream
    const { stream: aiStream, documents: citations } = await this.ragService.askQuestionStream(
      chat.documentId,
      content,
      formattedHistory
    );

    // Yield citations immediately so the UI can show sources while generating text
    yield { type: "citations", citations };

    let fullContent = "";

    try {
      for await (const chunk of aiStream) {
        fullContent += chunk;
        yield { type: "chunk", content: chunk };
      }
    } finally {
      // Persist AI reply when stream finishes or aborts
      if (fullContent.length > 0) {
        const aiMessage = await this.chatMessageService.createAssistantMessage(chatId, fullContent, citations);
        // We can yield the final saved message ID if we want, but usually stream close is enough
        yield { type: "done", message: aiMessage };
      }
    }
  }

  async deleteChat(chatId: string, userId: string) {
    const chat = await this.chatRepository.findChatById(chatId);

    if (!chat) {
      throw new NotFoundException("Chat not found");
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException("You do not have access to this chat");
    }

    return this.chatRepository.deleteChat(chatId);
  }
}
