import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { logger } from '../shared/utils/logger';
import { registerSocketHandlers } from './socket.handlers';

export class SocketServer {
  private io: SocketIOServer;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.FRONTEND_URL,
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupHandlers();
  }

  private setupMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token as string | undefined;

      if (!token) {
        return next(new Error('Token not provided'));
      }

      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        socket.data.userId = decoded.userId;
        next();
      } catch {
        next(new Error('Invalid token'));
      }
    });
  }

  private setupHandlers() {
    this.io.on('connection', async (socket) => {
      const userId = socket.data.userId as string;
      logger.info(`User ${userId} connected to WebSocket`);

      await redis.set(`socket:user:${userId}`, socket.id);
      await redis.sadd('online:attendants', userId);

      socket.join(`user:${userId}`);

      registerSocketHandlers(socket);
    });
  }

  emitNewMessage(conversationId: string, message: unknown) {
    this.io.to(`conversation:${conversationId}`).emit('new_message', message);
  }

  emitConversationUpdate(conversationId: string, data: unknown) {
    this.io.to(`conversation:${conversationId}`).emit('conversation_update', data);
  }

  async notifyUser(userId: string, event: string, data: unknown) {
    const socketId = await redis.get(`socket:user:${userId}`);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  async broadcastToAttendants(event: string, data: unknown) {
    const attendants = await redis.smembers('online:attendants');
    for (const userId of attendants) {
      await this.notifyUser(userId, event, data);
    }
  }
}

export let socketServer: SocketServer;

export function initSocketServer(httpServer: HTTPServer) {
  socketServer = new SocketServer(httpServer);
  return socketServer;
}
