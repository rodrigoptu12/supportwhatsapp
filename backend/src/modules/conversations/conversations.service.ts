import { prisma } from '../../shared/database/prisma.client';
import { AppError, NotFoundError } from '../../shared/utils/errors';

export class ConversationsService {
  async list(filters: {
    status?: string;
    assignedUserId?: string;
    departmentId?: string;
    page: number;
    limit: number;
  }) {
    const where: Record<string, unknown> = {};

    if (filters.status) where.status = filters.status;
    if (filters.assignedUserId) where.assignedUserId = filters.assignedUserId;
    if (filters.departmentId) where.departmentId = filters.departmentId;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, phoneNumber: true },
          },
          assignedTo: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          department: {
            select: { id: true, name: true },
          },
          messages: {
            orderBy: { sentAt: 'desc' },
            take: 1,
            select: { content: true, sentAt: true, senderType: true },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.conversation.count({ where }),
    ]);

    return {
      data: conversations,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async getById(id: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedTo: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation');
    }

    return conversation;
  }

  async getOrCreate(customerId: string) {
    const existing = await prisma.conversation.findFirst({
      where: {
        customerId,
        status: { in: ['open', 'waiting'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) return existing;

    return prisma.conversation.create({
      data: {
        customerId,
        status: 'open',
        isBotActive: true,
      },
    });
  }

  async takeover(conversationId: string, userId: string) {
    const conversation = await this.getById(conversationId);

    if (!conversation.isBotActive && conversation.assignedUserId === userId) {
      throw new AppError('You already own this conversation', 400);
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        assignedUserId: userId,
        isBotActive: false,
        needsHumanAttention: false,
      },
    });

    await prisma.conversationTransfer.create({
      data: {
        conversationId,
        fromUserId: conversation.assignedUserId,
        toUserId: userId,
        reason: 'Manual takeover',
      },
    });

    return updated;
  }

  async transfer(conversationId: string, fromUserId: string, toUserId: string, reason?: string) {
    await this.getById(conversationId);

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { assignedUserId: toUserId },
    });

    await prisma.conversationTransfer.create({
      data: {
        conversationId,
        fromUserId,
        toUserId,
        reason,
      },
    });

    return updated;
  }

  async close(conversationId: string) {
    await this.getById(conversationId);

    return prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: 'closed',
        endedAt: new Date(),
        isBotActive: false,
      },
    });
  }

  async getStats() {
    const [open, waiting, closed, total] = await Promise.all([
      prisma.conversation.count({ where: { status: 'open' } }),
      prisma.conversation.count({ where: { status: 'waiting' } }),
      prisma.conversation.count({ where: { status: 'closed' } }),
      prisma.conversation.count(),
    ]);

    return { open, waiting, closed, total };
  }
}

export const conversationsService = new ConversationsService();
