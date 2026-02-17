import { prisma } from '../../shared/database/prisma.client';
import { CreateMessageDTO } from './messages.types';

export class MessagesService {
  async listByConversation(conversationId: string, page: number, limit: number) {
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        include: {
          senderUser: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
        orderBy: { sentAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      data: messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: CreateMessageDTO) {
    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderType: data.senderType,
        senderUserId: data.senderUserId,
        content: data.content,
        messageType: data.messageType ?? 'text',
        mediaUrl: data.mediaUrl,
        whatsappMessageId: data.whatsappMessageId,
      },
      include: {
        senderUser: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    // Update conversation's last message timestamp
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async markAsRead(messageId: string) {
    return prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }

  async markConversationAsRead(conversationId: string) {
    return prisma.message.updateMany({
      where: { conversationId, isRead: false },
      data: { isRead: true },
    });
  }
}

export const messagesService = new MessagesService();
