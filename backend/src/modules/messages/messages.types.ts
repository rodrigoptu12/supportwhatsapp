import { z } from 'zod';

export const listMessagesSchema = z.object({
  query: z.object({
    conversation_id: z.string().uuid(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(50),
  }),
});

export const createMessageSchema = z.object({
  body: z.object({
    conversationId: z.string().uuid(),
    content: z.string().min(1),
    messageType: z.enum(['text', 'image', 'audio', 'document', 'video']).default('text'),
    mediaUrl: z.string().url().optional(),
  }),
});

export interface CreateMessageDTO {
  conversationId: string;
  senderType: string;
  senderUserId?: string;
  content: string;
  messageType?: string;
  mediaUrl?: string;
  whatsappMessageId?: string;
}
