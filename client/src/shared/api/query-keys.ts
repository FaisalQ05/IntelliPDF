export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    logs: () => [...queryKeys.dashboard.all, "logs"] as const,
    users: () => [...queryKeys.dashboard.all, "users"] as const,
  },
  pdfChat: {
    all: ["pdfChat"] as const,
    documents: () => [...queryKeys.pdfChat.all, "documents"] as const,
    chats: () => [...queryKeys.pdfChat.all, "chats"] as const,
    messages: (chatId: string) => [...queryKeys.pdfChat.chats(), chatId, "messages"] as const,
  },
} as const;
