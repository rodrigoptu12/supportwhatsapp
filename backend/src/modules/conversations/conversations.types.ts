import { z } from 'zod';

export const listConversationsSchema = z.object({
  query: z.object({
    status: z.enum(['open', 'closed', 'waiting']).optional(),
    assignedUserId: z.string().uuid().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

export const conversationIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const transferSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    toUserId: z.string().uuid(),
    reason: z.string().optional(),
  }),
});
