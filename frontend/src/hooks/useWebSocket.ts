import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '../services/socket.service';
import { useAuthStore } from '../store/authStore';
import { useConversationsStore } from '../store/conversationsStore';

export function useWebSocket() {
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const { selectedConversation } = useConversationsStore();

  // Connect socket when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);
    }
    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, token]);

  // Subscribe to the selected conversation room and listen for new messages
  useEffect(() => {
    if (!selectedConversation) return;

    const conversationId = selectedConversation.id;
    socketService.subscribeConversation(conversationId);

    const handleNewMessage = () => {
      void queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleConversationUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socketService.on('new_message', handleNewMessage);
    socketService.on('conversation_update', handleConversationUpdate);

    return () => {
      socketService.unsubscribeConversation(conversationId);
      socketService.off('new_message', handleNewMessage);
      socketService.off('conversation_update', handleConversationUpdate);
    };
  }, [selectedConversation?.id, queryClient]);

  // Listen for new conversations (department notifications)
  useEffect(() => {
    const handleNewConversation = () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socketService.on('new_conversation', handleNewConversation);

    return () => {
      socketService.off('new_conversation', handleNewConversation);
    };
  }, [queryClient]);
}
