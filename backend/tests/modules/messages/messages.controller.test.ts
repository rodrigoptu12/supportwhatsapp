/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

const messagesServiceMock = {
  listByConversation: fn(),
  create: fn(),
  markAsRead: fn(),
};

const whatsappServiceMock = {
  sendMessage: fn(),
};

const prismaMock = {
  conversation: { findUnique: fn() },
  user: { findUnique: fn() },
};

const socketServerMock = {
  emitNewMessage: fn(),
};

jest.mock('@/modules/messages/messages.service', () => ({
  messagesService: messagesServiceMock,
}));
jest.mock('@/modules/whatsapp/whatsapp.service', () => ({
  whatsappService: whatsappServiceMock,
}));
jest.mock('@/shared/database/prisma.client', () => ({ prisma: prismaMock }));
jest.mock('@/websocket/socket.server', () => ({ socketServer: socketServerMock }));
jest.mock('@/shared/utils/logger', () => ({
  logger: { info: fn(), error: fn(), warn: fn(), debug: fn() },
}));

import { MessagesController } from '@/modules/messages/messages.controller';

const controller = new MessagesController();

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = fn();

beforeEach(() => jest.clearAllMocks());

describe('MessagesController', () => {
  describe('list', () => {
    it('returns paginated messages with defaults', async () => {
      messagesServiceMock.listByConversation.mockResolvedValue({ data: [] });
      const req = { query: { conversation_id: 'c1' } } as any;
      const res = mockRes();

      await controller.list(req, res, mockNext);

      expect(messagesServiceMock.listByConversation).toHaveBeenCalledWith('c1', 1, 50);
      expect(res.json).toHaveBeenCalled();
    });

    it('parses page and limit', async () => {
      messagesServiceMock.listByConversation.mockResolvedValue({ data: [] });
      const req = { query: { conversation_id: 'c1', page: '2', limit: '10' } } as any;
      const res = mockRes();

      await controller.list(req, res, mockNext);

      expect(messagesServiceMock.listByConversation).toHaveBeenCalledWith('c1', 2, 10);
    });

    it('calls next on error', async () => {
      messagesServiceMock.listByConversation.mockRejectedValue(new Error('fail'));

      await controller.list({ query: {} } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('create', () => {
    it('creates message, sends to WhatsApp, emits socket, returns 201', async () => {
      const msg = { id: 'm1', content: 'Hi' };
      messagesServiceMock.create.mockResolvedValue(msg);
      prismaMock.conversation.findUnique.mockResolvedValue({
        customer: { phoneNumber: '5511999999999' },
      });
      prismaMock.user.findUnique.mockResolvedValue({ fullName: 'Agent' });
      whatsappServiceMock.sendMessage.mockResolvedValue({});
      const req = {
        body: { conversationId: 'c1', content: 'Hi' },
        user: { userId: 'u1' },
      } as any;
      const res = mockRes();

      await controller.create(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(msg);
      expect(whatsappServiceMock.sendMessage).toHaveBeenCalledWith(
        '5511999999999',
        expect.stringContaining('Agent'),
      );
      expect(socketServerMock.emitNewMessage).toHaveBeenCalledWith('c1', msg);
    });

    it('creates message even if WhatsApp fails', async () => {
      messagesServiceMock.create.mockResolvedValue({ id: 'm1' });
      prismaMock.conversation.findUnique.mockResolvedValue({
        customer: { phoneNumber: '5511999999999' },
      });
      prismaMock.user.findUnique.mockResolvedValue({ fullName: 'Agent' });
      whatsappServiceMock.sendMessage.mockRejectedValue(new Error('WA down'));
      const req = {
        body: { conversationId: 'c1', content: 'Hi' },
        user: { userId: 'u1' },
      } as any;
      const res = mockRes();

      await controller.create(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('handles missing conversation or phone number', async () => {
      messagesServiceMock.create.mockResolvedValue({ id: 'm1' });
      prismaMock.conversation.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(null);
      const req = {
        body: { conversationId: 'c1', content: 'Hi' },
        user: { userId: 'u1' },
      } as any;
      const res = mockRes();

      await controller.create(req, res, mockNext);

      expect(whatsappServiceMock.sendMessage).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('uses fallback attendant name when user not found', async () => {
      messagesServiceMock.create.mockResolvedValue({ id: 'm1' });
      prismaMock.conversation.findUnique.mockResolvedValue({
        customer: { phoneNumber: '5511999999999' },
      });
      prismaMock.user.findUnique.mockResolvedValue(null);
      whatsappServiceMock.sendMessage.mockResolvedValue({});
      const req = {
        body: { conversationId: 'c1', content: 'Hi' },
        user: { userId: 'u1' },
      } as any;
      const res = mockRes();

      await controller.create(req, res, mockNext);

      expect(whatsappServiceMock.sendMessage).toHaveBeenCalledWith(
        '5511999999999',
        expect.stringContaining('Atendente'),
      );
    });

    it('calls next on service error', async () => {
      messagesServiceMock.create.mockRejectedValue(new Error('fail'));
      const req = { body: {}, user: { userId: 'u1' } } as any;

      await controller.create(req, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('markAsRead', () => {
    it('returns result', async () => {
      messagesServiceMock.markAsRead.mockResolvedValue({ id: 'm1', isRead: true });
      const res = mockRes();

      await controller.markAsRead({ params: { id: 'm1' } } as any, res, mockNext);

      expect(res.json).toHaveBeenCalledWith({ id: 'm1', isRead: true });
    });

    it('calls next on error', async () => {
      messagesServiceMock.markAsRead.mockRejectedValue(new Error('fail'));

      await controller.markAsRead({ params: { id: 'x' } } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
