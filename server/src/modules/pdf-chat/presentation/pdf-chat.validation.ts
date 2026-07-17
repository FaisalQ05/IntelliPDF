import { z } from "zod";

export const pdfChatValidation = {
  paramId: z.object({
    id: z.string().uuid("id must be a valid UUID"),
  }),
  createChat: z.object({
    documentId: z.string().uuid("documentId must be a valid UUID"),
  }),

  sendMessage: z.object({
    content: z
      .string()
      .min(1, "Message cannot be empty")
      .max(4000, "Message cannot exceed 4000 characters"),
  }),
};

export type ParamIdDto = z.infer<typeof pdfChatValidation.paramId>;
export type CreateChatDto = z.infer<typeof pdfChatValidation.createChat>;
export type SendMessageDto = z.infer<typeof pdfChatValidation.sendMessage>;
