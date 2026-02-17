import { Socket } from 'socket.io';
import { redis } from '../config/redis';
import { prisma } from '../shared/database/prisma.client';
import { logger } from '../shared/utils/logger';
import { SocketEvents } from './socket.events';

export function registerSocketHandlers(socket: Socket) {
  const userId = socket.data.userId as string;

  socket.on(SocketEvents.SUBSCRIBE_CONVERSATION, (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
    logger.debug(`User ${userId} subscribed to conversation ${conversationId}`);
  });

  socket.on(SocketEvents.UNSUBSCRIBE_CONVERSATION, (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
    logger.debug(`User ${userId} unsubscribed from conversation ${conversationId}`);
  });

  socket.on(SocketEvents.TYPING, (conversationId: string) => {
    socket.to(`conversation:${conversationId}`).emit(SocketEvents.USER_TYPING, {
      userId,
      conversationId,
    });
  });

  socket.on('disconnect', async () => {
    logger.info(`User ${userId} disconnected from WebSocket`);
    await redis.del(`socket:user:${userId}`);
    await redis.srem('online:attendants', userId);

    // Remove from department attendant sets
    const userDepartments = await prisma.userDepartment.findMany({
      where: { userId },
      select: { departmentId: true },
    });
    for (const ud of userDepartments) {
      await redis.srem(`department:${ud.departmentId}:attendants`, userId);
    }
  });
}
