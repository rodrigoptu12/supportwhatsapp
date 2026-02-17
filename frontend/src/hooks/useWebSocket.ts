import { useEffect, useCallback } from 'react';
import { socketService } from '../services/socket.service';
import { useAuthStore } from '../store/authStore';

export function useWebSocket() {
  const { token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, token]);

  const subscribe = useCallback((event: string, callback: (data: unknown) => void) => {
    socketService.on(event, callback);
    return () => {
      socketService.off(event, callback);
    };
  }, []);

  const emit = useCallback((event: string, data: unknown) => {
    socketService.getSocket()?.emit(event, data);
  }, []);

  return { subscribe, emit };
}
