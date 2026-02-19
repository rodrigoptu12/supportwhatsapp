import { prisma } from '../../shared/database/prisma.client';
import { whatsappService } from '../whatsapp/whatsapp.service';
import { messagesService } from '../messages/messages.service';
import { logger } from '../../shared/utils/logger';
import { AppError, NotFoundError } from '../../shared/utils/errors';
import { socketServer } from '../../websocket/socket.server';
import { SocketEvents } from '../../websocket/socket.events';

export class ConversationsService {
  async list(filters: {
    status?: string;
    assignedUserId?: string;
    departmentId?: string;
    search?: string;
    userDepartmentIds?: string[];
    userId?: string;
    page: number;
    limit: number;
  }) {
    // Build the where clause with proper Prisma typing
    const conditions: unknown[] = [];

    if (filters.status) conditions.push({ status: filters.status });
    if (filters.assignedUserId) conditions.push({ assignedUserId: filters.assignedUserId });
    if (filters.departmentId) conditions.push({ departmentId: filters.departmentId });

    if (filters.search) {
      conditions.push({
        OR: [
          { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
          { customer: { phoneNumber: { contains: filters.search } } },
          { messages: { some: { content: { contains: filters.search, mode: 'insensitive' } } } },
        ],
      });
    }

    // For non-admin users: show conversations from their departments
    // (only after customer selected a department) OR assigned to them
    let where: Record<string, unknown>;

    if (filters.userDepartmentIds) {
      where = {
        AND: [
          ...conditions,
          {
            OR: [
              { departmentId: { in: filters.userDepartmentIds }, needsHumanAttention: true },
              { assignedUserId: filters.userId },
            ],
          },
        ],
      };
    } else {
      where = Object.assign({}, ...conditions);
    }

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
            select: { content: true, sentAt: true, senderType: true, messageType: true },
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

    const attendant = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });

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

    // Notify customer via WhatsApp who is attending them
    try {
      const attendantName = attendant?.fullName ?? 'um atendente';
      const msg = `Voce esta sendo atendido por *${attendantName}*. Como posso ajudar?`;

      await whatsappService.sendMessage(conversation.customer.phoneNumber, msg);
      await messagesService.create({
        conversationId,
        senderType: 'system',
        content: msg,
      });
    } catch (error) {
      logger.error('Error sending takeover message to WhatsApp:', error);
    }

    return updated;
  }

  async transfer(conversationId: string, fromUserId: string, toUserId: string, reason?: string) {
    await this.getById(conversationId);

    const [fromUser, toUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: fromUserId }, select: { fullName: true } }),
      prisma.user.findUnique({ where: { id: toUserId }, select: { fullName: true } }),
    ]);

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

    // Create a system message with transfer details (stored in DB only, not sent to WhatsApp)
    const fromName = fromUser?.fullName ?? 'Atendente';
    const toName = toUser?.fullName ?? 'Atendente';
    const msgContent = reason
      ? `Conversa transferida de ${fromName} para ${toName}. Motivo: ${reason}`
      : `Conversa transferida de ${fromName} para ${toName}.`;

    const systemMessage = await messagesService.create({
      conversationId,
      senderType: 'system',
      content: msgContent,
    });

    // Emit new_message to the conversation room so the system message appears in real-time
    socketServer.emitNewMessage(conversationId, systemMessage);

    // Notify both attendants so their conversation lists update in real-time
    const eventData = { conversationId, assignedUserId: toUserId };
    await Promise.all([
      socketServer.notifyUser(fromUserId, SocketEvents.CONVERSATION_UPDATE, eventData),
      socketServer.notifyUser(toUserId, SocketEvents.CONVERSATION_UPDATE, eventData),
    ]);

    return updated;
  }

  async close(conversationId: string) {
    const conversation = await this.getById(conversationId);

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: 'closed',
        endedAt: new Date(),
        isBotActive: false,
      },
    });

    // Notify customer via WhatsApp that the conversation was closed
    try {
      const msg = 'Seu atendimento foi *finalizado*. Caso precise de ajuda novamente, envie uma mensagem a qualquer momento. Obrigado!';

      await whatsappService.sendMessage(conversation.customer.phoneNumber, msg);
      await messagesService.create({
        conversationId,
        senderType: 'system',
        content: msg,
      });
    } catch (error) {
      logger.error('Error sending close message to WhatsApp:', error);
    }

    return updated;
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
