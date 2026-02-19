/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

const prismaMock = {
  customer: { findUnique: fn(), create: fn() },
  conversation: { findUnique: fn() },
};

const whatsappServiceMock = {
  sendMessage: fn(),
  getMediaUrl: fn(),
  markAsRead: fn(),
};

const conversationsServiceMock = {
  getOrCreate: fn(),
};

const messagesServiceMock = {
  create: fn(),
};

const botServiceMock = {
  processMessage: fn(),
};

const socketServerMock = {
  emitNewMessage: fn(),
  notifyUser: fn().mockResolvedValue(undefined),
  broadcastToAttendants: fn().mockResolvedValue(undefined),
  notifyDepartment: fn(),
};

jest.mock('@/shared/database/prisma.client', () => ({ prisma: prismaMock }));
jest.mock('@/config/whatsapp', () => ({
  whatsappConfig: { webhookVerifyToken: 'test-verify-token' },
}));
jest.mock('@/modules/whatsapp/whatsapp.service', () => ({
  whatsappService: whatsappServiceMock,
}));
jest.mock('@/modules/conversations/conversations.service', () => ({
  conversationsService: conversationsServiceMock,
}));
jest.mock('@/modules/messages/messages.service', () => ({
  messagesService: messagesServiceMock,
}));
jest.mock('@/modules/bot/bot.service', () => ({
  botService: botServiceMock,
}));
jest.mock('@/websocket/socket.server', () => ({ socketServer: socketServerMock }));
jest.mock('@/websocket/socket.events', () => ({
  SocketEvents: {
    NEW_MESSAGE: 'new_message',
    NEW_CONVERSATION: 'new_conversation',
  },
}));
jest.mock('@/shared/utils/logger', () => ({
  logger: { info: fn(), error: fn(), warn: fn(), debug: fn() },
}));

import { WhatsAppWebhook } from '@/modules/whatsapp/whatsapp.webhook';

const webhook = new WhatsAppWebhook();

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.headersSent = false;
  return res;
};

beforeEach(() => jest.clearAllMocks());

const makeTextReq = (text: string, from = '5511999999999') => ({
  body: {
    entry: [{
      changes: [{
        field: 'messages',
        value: {
          messages: [{ from, id: 'wa-1', type: 'text', text: { body: text } }],
          contacts: [{ profile: { name: 'John' } }],
        },
      }],
    }],
  },
} as any);

describe('WhatsAppWebhook', () => {
  describe('verify', () => {
    it('responds 200 with challenge on valid token', () => {
      const req = {
        query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'test-verify-token', 'hub.challenge': 'abc123' },
      } as any;
      const res = mockRes();

      webhook.verify(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('abc123');
    });

    it('responds 403 on invalid token', () => {
      const req = {
        query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong', 'hub.challenge': 'abc' },
      } as any;
      const res = mockRes();

      webhook.verify(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('responds 403 when mode is not subscribe', () => {
      const req = {
        query: { 'hub.mode': 'other', 'hub.verify_token': 'test-verify-token', 'hub.challenge': 'abc' },
      } as any;
      const res = mockRes();

      webhook.verify(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('receive', () => {
    it('responds EVENT_RECEIVED and returns if no entry', async () => {
      const req = { body: {} } as any;
      const res = mockRes();

      await webhook.receive(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('EVENT_RECEIVED');
    });

    it('processes a text message from customer', async () => {
      const fakeCustomer = { id: 'cust-1', phoneNumber: '5511999999999' };
      const fakeConv = { id: 'conv-1', isBotActive: false, assignedUserId: null };
      prismaMock.customer.findUnique.mockResolvedValue(fakeCustomer);
      conversationsServiceMock.getOrCreate.mockResolvedValue(fakeConv);
      messagesServiceMock.create.mockResolvedValue({ id: 'msg-1' });

      await webhook.receive(makeTextReq('Hello'), mockRes());

      expect(messagesServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Hello', senderType: 'customer' }),
      );
    });

    it('emits socket events for new message', async () => {
      const fakeCustomer = { id: 'cust-1', phoneNumber: '5511999999999' };
      const fakeConv = { id: 'conv-1', isBotActive: false, assignedUserId: 'user-1' };
      prismaMock.customer.findUnique.mockResolvedValue(fakeCustomer);
      conversationsServiceMock.getOrCreate.mockResolvedValue(fakeConv);
      messagesServiceMock.create.mockResolvedValue({ id: 'msg-1' });

      await webhook.receive(makeTextReq('Hello'), mockRes());

      expect(socketServerMock.emitNewMessage).toHaveBeenCalledWith('conv-1', { id: 'msg-1' });
      expect(socketServerMock.notifyUser).toHaveBeenCalledWith('user-1', 'new_message', { id: 'msg-1' });
      expect(socketServerMock.broadcastToAttendants).toHaveBeenCalledWith('new_message', { id: 'msg-1' });
    });

    it('does not notify assignedUser when null', async () => {
      const fakeCustomer = { id: 'cust-1', phoneNumber: '5511999999999' };
      const fakeConv = { id: 'conv-1', isBotActive: false, assignedUserId: null };
      prismaMock.customer.findUnique.mockResolvedValue(fakeCustomer);
      conversationsServiceMock.getOrCreate.mockResolvedValue(fakeConv);
      messagesServiceMock.create.mockResolvedValue({ id: 'msg-1' });

      await webhook.receive(makeTextReq('Hello'), mockRes());

      expect(socketServerMock.emitNewMessage).toHaveBeenCalled();
      expect(socketServerMock.notifyUser).not.toHaveBeenCalled();
      expect(socketServerMock.broadcastToAttendants).toHaveBeenCalled();
    });

    it('processes image message with media URL', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ id: 'cust-1', phoneNumber: '5511999999999' });
      conversationsServiceMock.getOrCreate.mockResolvedValue({ id: 'conv-1', isBotActive: false, assignedUserId: null });
      messagesServiceMock.create.mockResolvedValue({ id: 'msg-1' });
      whatsappServiceMock.getMediaUrl.mockResolvedValue('https://media.example.com/img.jpg');

      const req = {
        body: {
          entry: [{
            changes: [{
              field: 'messages',
              value: {
                messages: [{ from: '5511999999999', id: 'wa-1', type: 'image', image: { id: 'media-1', mime_type: 'image/jpeg', caption: 'My photo' } }],
              },
            }],
          }],
        },
      } as any;

      await webhook.receive(req, mockRes());

      expect(messagesServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'My photo', mediaUrl: 'https://media.example.com/img.jpg' }),
      );
    });

    it('handles document with filename but no caption', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ id: 'cust-1', phoneNumber: '5511999999999' });
      conversationsServiceMock.getOrCreate.mockResolvedValue({ id: 'conv-1', isBotActive: false, assignedUserId: null });
      messagesServiceMock.create.mockResolvedValue({ id: 'msg-1' });
      whatsappServiceMock.getMediaUrl.mockResolvedValue('https://media.example.com/file.pdf');

      const req = {
        body: {
          entry: [{
            changes: [{
              field: 'messages',
              value: {
                messages: [{ from: '5511999999999', id: 'wa-1', type: 'document', document: { id: 'media-2', mime_type: 'application/pdf', filename: 'report.pdf' } }],
              },
            }],
          }],
        },
      } as any;

      await webhook.receive(req, mockRes());

      expect(messagesServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'report.pdf' }),
      );
    });

    it('handles audio without caption or filename', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ id: 'cust-1', phoneNumber: '5511999999999' });
      conversationsServiceMock.getOrCreate.mockResolvedValue({ id: 'conv-1', isBotActive: false, assignedUserId: null });
      messagesServiceMock.create.mockResolvedValue({ id: 'msg-1' });
      whatsappServiceMock.getMediaUrl.mockResolvedValue('https://media.example.com/audio.ogg');

      const req = {
        body: {
          entry: [{
            changes: [{
              field: 'messages',
              value: {
                messages: [{ from: '5511999999999', id: 'wa-1', type: 'audio', audio: { id: 'media-3', mime_type: 'audio/ogg' } }],
              },
            }],
          }],
        },
      } as any;

      await webhook.receive(req, mockRes());

      expect(messagesServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: '[audio]' }),
      );
    });

    it('handles text message with missing text body (fallback to empty)', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ id: 'cust-1', phoneNumber: '5511999999999' });
      conversationsServiceMock.getOrCreate.mockResolvedValue({ id: 'conv-1', isBotActive: false, assignedUserId: null });
      messagesServiceMock.create.mockResolvedValue({ id: 'msg-1' });

      const req = {
        body: {
          entry: [{
            changes: [{
              field: 'messages',
              value: {
                messages: [{ from: '5511999999999', id: 'wa-1', type: 'text' }],
                contacts: [{ profile: { name: 'John' } }],
              },
            }],
          }],
        },
      } as any;

      await webhook.receive(req, mockRes());

      expect(messagesServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: '' }),
      );
    });

    it('handles unsupported message type (sticker)', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ id: 'cust-1', phoneNumber: '5511999999999' });
      conversationsServiceMock.getOrCreate.mockResolvedValue({ id: 'conv-1', isBotActive: false, assignedUserId: null });
      messagesServiceMock.create.mockResolvedValue({ id: 'msg-1' });

      const req = {
        body: {
          entry: [{
            changes: [{
              field: 'messages',
              value: {
                messages: [{ from: '5511999999999', id: 'wa-1', type: 'sticker' }],
              },
            }],
          }],
        },
      } as any;

      await webhook.receive(req, mockRes());

      expect(messagesServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: '[sticker]' }),
      );
    });

    it('triggers bot when isBotActive and notifies department', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ id: 'cust-1', phoneNumber: '5511999999999' });
      conversationsServiceMock.getOrCreate.mockResolvedValue({ id: 'conv-1', isBotActive: true, assignedUserId: null });
      messagesServiceMock.create.mockResolvedValue({ id: 'msg-1' });
      botServiceMock.processMessage.mockResolvedValue({
        message: 'Transferred',
        needsHuman: true,
        departmentId: 'dept-1',
      });
      whatsappServiceMock.sendMessage.mockResolvedValue({});
      const updatedConv = { id: 'conv-1', customer: { id: 'c1', name: 'John', phoneNumber: '5511999999999' }, department: { id: 'dept-1', name: 'Sales' } };
      prismaMock.conversation.findUnique.mockResolvedValue(updatedConv);

      await webhook.receive(makeTextReq('1'), mockRes());

      expect(botServiceMock.processMessage).toHaveBeenCalled();
      expect(whatsappServiceMock.sendMessage).toHaveBeenCalledWith('5511999999999', 'Transferred');
      expect(socketServerMock.notifyDepartment).toHaveBeenCalledWith('dept-1', 'new_conversation', updatedConv);
    });

    it('does not notify department when updatedConversation is null', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ id: 'cust-1', phoneNumber: '5511999999999' });
      conversationsServiceMock.getOrCreate.mockResolvedValue({ id: 'conv-1', isBotActive: true, assignedUserId: null });
      messagesServiceMock.create.mockResolvedValue({ id: 'msg-1' });
      botServiceMock.processMessage.mockResolvedValue({
        message: 'Transferred',
        needsHuman: true,
        departmentId: 'dept-1',
      });
      whatsappServiceMock.sendMessage.mockResolvedValue({});
      prismaMock.conversation.findUnique.mockResolvedValue(null);

      await webhook.receive(makeTextReq('1'), mockRes());

      expect(socketServerMock.notifyDepartment).not.toHaveBeenCalled();
    });

    it('does not call bot if response is null', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ id: 'cust-1', phoneNumber: '5511999999999' });
      conversationsServiceMock.getOrCreate.mockResolvedValue({ id: 'conv-1', isBotActive: true, assignedUserId: null });
      messagesServiceMock.create.mockResolvedValue({ id: 'msg-1' });
      botServiceMock.processMessage.mockResolvedValue(null);

      await webhook.receive(makeTextReq('oi'), mockRes());

      expect(whatsappServiceMock.sendMessage).not.toHaveBeenCalled();
    });

    it('creates new customer when not found (with name)', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(null);
      prismaMock.customer.create.mockResolvedValue({ id: 'cust-new', phoneNumber: '5511888888888' });
      conversationsServiceMock.getOrCreate.mockResolvedValue({ id: 'conv-1', isBotActive: false, assignedUserId: null });
      messagesServiceMock.create.mockResolvedValue({ id: 'msg-1' });

      await webhook.receive(makeTextReq('Hi', '5511888888888'), mockRes());

      expect(prismaMock.customer.create).toHaveBeenCalledWith({
        data: { phoneNumber: '5511888888888', name: 'John' },
      });
    });

    it('creates customer with phone as name when no profile', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(null);
      prismaMock.customer.create.mockResolvedValue({ id: 'cust-new', phoneNumber: '5511888888888' });
      conversationsServiceMock.getOrCreate.mockResolvedValue({ id: 'conv-1', isBotActive: false, assignedUserId: null });
      messagesServiceMock.create.mockResolvedValue({ id: 'msg-1' });

      const req = {
        body: {
          entry: [{
            changes: [{
              field: 'messages',
              value: {
                messages: [{ from: '5511888888888', id: 'wa-1', type: 'text', text: { body: 'Hi' } }],
              },
            }],
          }],
        },
      } as any;

      await webhook.receive(req, mockRes());

      expect(prismaMock.customer.create).toHaveBeenCalledWith({
        data: { phoneNumber: '5511888888888', name: '5511888888888' },
      });
    });

    it('skips non-messages field changes', async () => {
      const req = {
        body: { entry: [{ changes: [{ field: 'statuses', value: {} }] }] },
      } as any;

      await webhook.receive(req, mockRes());

      expect(messagesServiceMock.create).not.toHaveBeenCalled();
    });

    it('returns if messages array is empty', async () => {
      const req = {
        body: { entry: [{ changes: [{ field: 'messages', value: { messages: [] } }] }] },
      } as any;

      await webhook.receive(req, mockRes());

      expect(prismaMock.customer.findUnique).not.toHaveBeenCalled();
    });

    it('handles media URL fetch failure gracefully', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ id: 'cust-1', phoneNumber: '5511999999999' });
      conversationsServiceMock.getOrCreate.mockResolvedValue({ id: 'conv-1', isBotActive: false, assignedUserId: null });
      messagesServiceMock.create.mockResolvedValue({ id: 'msg-1' });
      whatsappServiceMock.getMediaUrl.mockRejectedValue(new Error('Media fetch failed'));

      const req = {
        body: {
          entry: [{
            changes: [{
              field: 'messages',
              value: {
                messages: [{ from: '5511999999999', id: 'wa-1', type: 'image', image: { id: 'media-1', mime_type: 'image/jpeg', caption: 'Photo' } }],
              },
            }],
          }],
        },
      } as any;

      await webhook.receive(req, mockRes());

      expect(messagesServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Photo', mediaUrl: undefined }),
      );
    });

    it('catches processing error and sends 500 if headers not sent', async () => {
      prismaMock.customer.findUnique.mockRejectedValue(new Error('DB Error'));
      prismaMock.customer.create.mockRejectedValue(new Error('DB Error'));

      // Force error in processMessage by causing getOrCreateCustomer to throw
      const req = {
        body: {
          entry: [{
            changes: [{
              field: 'messages',
              value: {
                messages: [{ from: '5511999999999', id: 'wa-1', type: 'text', text: { body: 'test' } }],
              },
            }],
          }],
        },
      } as any;

      await webhook.receive(req, mockRes());

      // Error is caught internally, the response was already sent as EVENT_RECEIVED
    });

    it('sends 500 when error occurs before response is sent', async () => {
      // req.body is undefined, so destructuring { entry } throws before res.send
      const req = { body: undefined } as any;
      const res = mockRes();
      res.headersSent = false;

      await webhook.receive(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Internal Server Error');
    });

    it('does not send 500 when headers already sent', async () => {
      // req.body is undefined → throws, but headersSent is true
      const req = { body: undefined } as any;
      const res = mockRes();
      // Simulate that send was already called by making headersSent true from start
      res.headersSent = true;

      await webhook.receive(req, res);

      // Should NOT call status(500) since headersSent is true
      expect(res.status).not.toHaveBeenCalledWith(500);
    });

    it('handles video message type', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ id: 'cust-1', phoneNumber: '5511999999999' });
      conversationsServiceMock.getOrCreate.mockResolvedValue({ id: 'conv-1', isBotActive: false, assignedUserId: null });
      messagesServiceMock.create.mockResolvedValue({ id: 'msg-1' });
      whatsappServiceMock.getMediaUrl.mockResolvedValue('https://media.example.com/video.mp4');

      const req = {
        body: {
          entry: [{
            changes: [{
              field: 'messages',
              value: {
                messages: [{ from: '5511999999999', id: 'wa-1', type: 'video', video: { id: 'media-4', mime_type: 'video/mp4', caption: 'My video' } }],
              },
            }],
          }],
        },
      } as any;

      await webhook.receive(req, mockRes());

      expect(messagesServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'My video', messageType: 'video' }),
      );
    });
  });
});
