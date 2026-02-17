import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const socketService = {
  connect: (token: string) => {
    if (socket?.connected) return;

    socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
    });
  },

  disconnect: () => {
    socket?.disconnect();
    socket = null;
  },

  subscribeConversation: (conversationId: string) => {
    socket?.emit('subscribe:conversation', conversationId);
  },

  unsubscribeConversation: (conversationId: string) => {
    socket?.emit('unsubscribe:conversation', conversationId);
  },

  sendTyping: (conversationId: string) => {
    socket?.emit('typing', conversationId);
  },

  on: (event: string, callback: (data: unknown) => void) => {
    socket?.on(event, callback);
  },

  off: (event: string, callback?: (data: unknown) => void) => {
    socket?.off(event, callback);
  },

  getSocket: () => socket,
};
