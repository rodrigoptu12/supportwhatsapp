/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

const prismaMock = {
  message: {
    findMany: fn(),
    create: fn(),
    update: fn(),
    updateMany: fn(),
    count: fn(),
  },
  conversation: {
    update: fn(),
  },
};

jest.mock('@/shared/database/prisma.client', () => ({ prisma: prismaMock }));

import { MessagesService } from '@/modules/messages/messages.service';

const service = new MessagesService();

beforeEach(() => {
  jest.clearAllMocks();
});

const fakeMessage = {
  id: 'msg-1',
  conversationId: 'conv-1',
  senderType: 'attendant',
  senderUserId: 'user-1',
  content: 'Hello',
  messageType: 'text',
  mediaUrl: null,
  whatsappMessageId: null,
  isRead: false,
  sentAt: new Date(),
  senderUser: { id: 'user-1', fullName: 'Agent', avatarUrl: null },
};

describe('MessagesService', () => {
  describe('listByConversation', () => {
    it('returns paginated messages', async () => {
      prismaMock.message.findMany.mockResolvedValue([fakeMessage]);
      prismaMock.message.count.mockResolvedValue(1);

      const result = await service.listByConversation('conv-1', 1, 20);

      expect(result.data).toEqual([fakeMessage]);
      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
      expect(prismaMock.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { conversationId: 'conv-1' },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('calculates correct pagination for page 2', async () => {
      prismaMock.message.findMany.mockResolvedValue([]);
      prismaMock.message.count.mockResolvedValue(30);

      const result = await service.listByConversation('conv-1', 2, 10);

      expect(result.pagination.totalPages).toBe(3);
      expect(prismaMock.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  describe('create', () => {
    it('creates message and updates lastMessageAt', async () => {
      prismaMock.message.create.mockResolvedValue(fakeMessage);
      prismaMock.conversation.update.mockResolvedValue({});

      const result = await service.create({
        conversationId: 'conv-1',
        senderType: 'attendant',
        senderUserId: 'user-1',
        content: 'Hello',
      });

      expect(result).toEqual(fakeMessage);
      expect(prismaMock.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { lastMessageAt: expect.any(Date) },
      });
    });

    it('creates message with optional fields', async () => {
      prismaMock.message.create.mockResolvedValue(fakeMessage);
      prismaMock.conversation.update.mockResolvedValue({});

      await service.create({
        conversationId: 'conv-1',
        senderType: 'customer',
        content: 'image',
        messageType: 'image',
        mediaUrl: 'https://example.com/img.jpg',
        whatsappMessageId: 'wa-123',
      });

      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            messageType: 'image',
            mediaUrl: 'https://example.com/img.jpg',
            whatsappMessageId: 'wa-123',
          }),
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('updates message isRead to true', async () => {
      prismaMock.message.update.mockResolvedValue({ ...fakeMessage, isRead: true });

      const result = await service.markAsRead('msg-1');

      expect(prismaMock.message.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: { isRead: true },
      });
      expect(result.isRead).toBe(true);
    });
  });

  describe('markConversationAsRead', () => {
    it('updates all unread messages in conversation', async () => {
      prismaMock.message.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markConversationAsRead('conv-1');

      expect(prismaMock.message.updateMany).toHaveBeenCalledWith({
        where: { conversationId: 'conv-1', isRead: false },
        data: { isRead: true },
      });
      expect(result.count).toBe(5);
    });
  });
});
