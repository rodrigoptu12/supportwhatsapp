import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '../services/socket.service';
import { useAuthStore } from '../store/authStore';
import { useConversationsStore } from '../store/conversationsStore';

export function useWebSocket() {
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const selectedConversation = useConversationsStore((s) => s.selectedConversation);

  // Connect socket when authenticated (don't disconnect on cleanup - only logout does that)
  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);
    }
  }, [isAuthenticated, token]);

  // Subscribe to the selected conversation room
  useEffect(() => {
    if (!selectedConversation) return;

    const conversationId = selectedConversation.id;
    socketService.subscribeConversation(conversationId);

    return () => {
      socketService.unsubscribeConversation(conversationId);
    };
  }, [selectedConversation?.id]);

  // Listen for real-time events
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewMessage = () => {
      // Refresh messages for the current conversation
      const currentId = useConversationsStore.getState().selectedConversation?.id;
      if (currentId) {
        void queryClient.invalidateQueries({ queryKey: ['messages', currentId] });
      }
      // Refresh conversation list (last message preview, order)
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleConversationUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleNewConversation = () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socketService.on('new_message', handleNewMessage);
    socketService.on('conversation_update', handleConversationUpdate);
    socketService.on('new_conversation', handleNewConversation);

    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.off('conversation_update', handleConversationUpdate);
      socketService.off('new_conversation', handleNewConversation);
    };
  }, [isAuthenticated, queryClient]);
}
