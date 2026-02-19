import { prismaMock } from '../../helpers/prisma-mock';
import { ConversationsService } from '@/modules/conversations/conversations.service';
import { AppError } from '@/shared/utils/errors';
import { whatsappService } from '@/modules/whatsapp/whatsapp.service';
import { messagesService } from '@/modules/messages/messages.service';

jest.mock('@/websocket/socket.server', () => ({
  socketServer: {
    emitNewMessage: jest.fn(),
    notifyUser: jest.fn().mockResolvedValue(undefined),
    emitConversationUpdate: jest.fn(),
  },
}));

const service = new ConversationsService();

beforeEach(() => {
  jest.clearAllMocks();
});

const fakeConversation = {
  id: 'conv-1',
  customerId: 'cust-1',
  assignedUserId: 'user-1',
  isBotActive: false,
  status: 'open',
  departmentId: null,
  needsHumanAttention: false,
  createdAt: new Date(),
  lastMessageAt: new Date(),
  endedAt: null,
  customer: { id: 'cust-1', name: 'John', phoneNumber: '5511999999999' },
  assignedTo: { id: 'user-1', fullName: 'Agent 1', email: 'a@a.com', avatarUrl: null },
};

describe('ConversationsService', () => {
  describe('list', () => {
    it('returns paginated conversations with simple filters', async () => {
      const convs = [fakeConversation];
      prismaMock.conversation.findMany.mockResolvedValue(convs);
      prismaMock.conversation.count.mockResolvedValue(1);

      const result = await service.list({ status: 'open', page: 1, limit: 20 });

      expect(result.data).toEqual(convs);
      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    });

    it('applies userDepartmentIds filter with OR clause', async () => {
      prismaMock.conversation.findMany.mockResolvedValue([]);
      prismaMock.conversation.count.mockResolvedValue(0);

      await service.list({
        userDepartmentIds: ['dept-1'],
        userId: 'user-1',
        page: 1,
        limit: 20,
      });

      const callArg = prismaMock.conversation.findMany.mock.calls[0]![0] as { where: Record<string, unknown> };
      expect(callArg.where).toHaveProperty('AND');
    });

    it('applies search filter', async () => {
      prismaMock.conversation.findMany.mockResolvedValue([]);
      prismaMock.conversation.count.mockResolvedValue(0);

      await service.list({ search: 'John', page: 1, limit: 20 });

      const callArg = prismaMock.conversation.findMany.mock.calls[0]![0] as { where: Record<string, unknown> };
      expect(callArg.where).toHaveProperty('OR');
    });

    it('applies assignedUserId and departmentId filters', async () => {
      prismaMock.conversation.findMany.mockResolvedValue([]);
      prismaMock.conversation.count.mockResolvedValue(0);

      await service.list({
        assignedUserId: 'user-1',
        departmentId: 'dept-1',
        page: 2,
        limit: 10,
      });

      expect(prismaMock.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('getById', () => {
    it('returns conversation when found', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue(fakeConversation);

      const result = await service.getById('conv-1');

      expect(result).toEqual(fakeConversation);
      expect(prismaMock.conversation.findUnique).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        include: expect.any(Object),
      });
    });

    it('throws NotFoundError when not found', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow('Conversation not found');
    });
  });

  describe('getOrCreate', () => {
    it('returns existing open/waiting conversation', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(fakeConversation);

      const result = await service.getOrCreate('cust-1');

      expect(result).toEqual(fakeConversation);
      expect(prismaMock.conversation.create).not.toHaveBeenCalled();
    });

    it('creates new conversation when none exists', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(null);
      const newConv = { ...fakeConversation, id: 'conv-new', isBotActive: true };
      prismaMock.conversation.create.mockResolvedValue(newConv);

      const result = await service.getOrCreate('cust-1');

      expect(result).toEqual(newConv);
      expect(prismaMock.conversation.create).toHaveBeenCalledWith({
        data: {
          customerId: 'cust-1',
          status: 'open',
          isBotActive: true,
        },
      });
    });
  });

  describe('transfer', () => {
    it('transfers conversation and creates transfer record', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue(fakeConversation);
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ fullName: 'Agent 1' })
        .mockResolvedValueOnce({ fullName: 'Agent 2' });
      const updated = { ...fakeConversation, assignedUserId: 'user-2' };
      prismaMock.conversation.update.mockResolvedValue(updated);
      prismaMock.conversationTransfer.create.mockResolvedValue({});

      const result = await service.transfer('conv-1', 'user-1', 'user-2', 'needs specialist');

      expect(result.assignedUserId).toBe('user-2');
      expect(prismaMock.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { assignedUserId: 'user-2' },
      });
      expect(prismaMock.conversationTransfer.create).toHaveBeenCalledWith({
        data: {
          conversationId: 'conv-1',
          fromUserId: 'user-1',
          toUserId: 'user-2',
          reason: 'needs specialist',
        },
      });
      expect(messagesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'conv-1',
          senderType: 'system',
          content: expect.stringContaining('needs specialist'),
        }),
      );
    });

    it('throws NotFoundError for non-existent conversation', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue(null);

      await expect(service.transfer('missing', 'u1', 'u2')).rejects.toThrow('Conversation not found');
    });

    it('works with reason undefined', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue(fakeConversation);
      prismaMock.conversation.update.mockResolvedValue(fakeConversation);
      prismaMock.conversationTransfer.create.mockResolvedValue({});

      await service.transfer('conv-1', 'user-1', 'user-2');

      expect(prismaMock.conversationTransfer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ reason: undefined }),
      });
      expect(messagesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          senderType: 'system',
          content: expect.not.stringContaining('Motivo'),
        }),
      );
    });
  });

  describe('takeover', () => {
    it('assigns conversation to attendant and disables bot', async () => {
      const botConv = { ...fakeConversation, isBotActive: true, assignedUserId: null };
      prismaMock.conversation.findUnique.mockResolvedValue(botConv);
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', fullName: 'Agent 1' });
      const updated = { ...botConv, assignedUserId: 'user-1', isBotActive: false };
      prismaMock.conversation.update.mockResolvedValue(updated);
      prismaMock.conversationTransfer.create.mockResolvedValue({});

      const result = await service.takeover('conv-1', 'user-1');

      expect(result.isBotActive).toBe(false);
      expect(result.assignedUserId).toBe('user-1');
      expect(prismaMock.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: {
          assignedUserId: 'user-1',
          isBotActive: false,
          needsHumanAttention: false,
        },
      });
    });

    it('throws error if user already owns the conversation', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue(fakeConversation);

      await expect(service.takeover('conv-1', 'user-1')).rejects.toThrow(AppError);
      await expect(service.takeover('conv-1', 'user-1')).rejects.toThrow(
        'You already own this conversation',
      );
    });

    it('continues even if WhatsApp notification fails', async () => {
      const botConv = { ...fakeConversation, isBotActive: true, assignedUserId: null };
      prismaMock.conversation.findUnique.mockResolvedValue(botConv);
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', fullName: 'Agent 1' });
      const updated = { ...botConv, assignedUserId: 'user-1', isBotActive: false };
      prismaMock.conversation.update.mockResolvedValue(updated);
      prismaMock.conversationTransfer.create.mockResolvedValue({});
      (whatsappService.sendMessage as jest.Mock).mockRejectedValueOnce(new Error('WhatsApp down'));

      const result = await service.takeover('conv-1', 'user-1');

      expect(result.assignedUserId).toBe('user-1');
    });

    it('sends notification with attendant name when available', async () => {
      const botConv = { ...fakeConversation, isBotActive: true, assignedUserId: null };
      prismaMock.conversation.findUnique.mockResolvedValue(botConv);
      prismaMock.user.findUnique.mockResolvedValue(null);
      const updated = { ...botConv, assignedUserId: 'user-1', isBotActive: false };
      prismaMock.conversation.update.mockResolvedValue(updated);
      prismaMock.conversationTransfer.create.mockResolvedValue({});

      await service.takeover('conv-1', 'user-1');

      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        '5511999999999',
        expect.stringContaining('um atendente'),
      );
    });
  });

  describe('close', () => {
    it('closes conversation with status closed and endedAt', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue(fakeConversation);
      const closed = { ...fakeConversation, status: 'closed', endedAt: new Date() };
      prismaMock.conversation.update.mockResolvedValue(closed);

      const result = await service.close('conv-1');

      expect(result.status).toBe('closed');
      expect(result.endedAt).toBeDefined();
      expect(prismaMock.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: expect.objectContaining({
          status: 'closed',
          isBotActive: false,
        }),
      });
    });

    it('continues even if WhatsApp notification fails on close', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue(fakeConversation);
      const closed = { ...fakeConversation, status: 'closed', endedAt: new Date() };
      prismaMock.conversation.update.mockResolvedValue(closed);
      (whatsappService.sendMessage as jest.Mock).mockRejectedValueOnce(new Error('WhatsApp down'));

      const result = await service.close('conv-1');

      expect(result.status).toBe('closed');
    });
  });

  describe('getStats', () => {
    it('returns correct counts', async () => {
      prismaMock.conversation.count
        .mockResolvedValueOnce(5)  // open
        .mockResolvedValueOnce(3)  // waiting
        .mockResolvedValueOnce(10) // closed
        .mockResolvedValueOnce(18); // total

      const stats = await service.getStats();

      expect(stats).toEqual({ open: 5, waiting: 3, closed: 10, total: 18 });
    });
  });
});
