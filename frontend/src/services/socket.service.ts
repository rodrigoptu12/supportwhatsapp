import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const socketService = {
  connect: (token: string) => {
    // Don't create duplicates - if socket exists (connected or connecting), skip
    if (socket) return;

    socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected, id:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
    });
  },

  disconnect: () => {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
  },

  subscribeConversation: (conversationId: string) => {
    if (socket?.connected) {
      socket.emit('subscribe:conversation', conversationId);
    } else {
      // Wait for connection then subscribe
      socket?.once('connect', () => {
        socket?.emit('subscribe:conversation', conversationId);
      });
    }
  },

  unsubscribeConversation: (conversationId: string) => {
    socket?.emit('unsubscribe:conversation', conversationId);
  },

  sendTyping: (conversationId: string) => {
    socket?.emit('typing', conversationId);
  },

  on: (event: string, callback: (...args: unknown[]) => void) => {
    socket?.on(event, callback);
  },

  off: (event: string, callback?: (...args: unknown[]) => void) => {
    socket?.off(event, callback);
  },

  getSocket: () => socket,
};
