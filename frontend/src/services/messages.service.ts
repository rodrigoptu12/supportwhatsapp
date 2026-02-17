import { api } from './api';
import type { Message, PaginatedResponse } from '../types';

export const messagesApi = {
  list: async (conversationId: string, page = 1, limit = 50): Promise<PaginatedResponse<Message>> => {
    const { data } = await api.get<PaginatedResponse<Message>>('/messages', {
      params: { conversation_id: conversationId, page, limit },
    });
    return data;
  },

  send: async (conversationId: string, content: string, messageType = 'text'): Promise<Message> => {
    const { data } = await api.post<Message>('/messages', {
      conversationId,
      content,
      messageType,
    });
    return data;
  },

  markAsRead: async (messageId: string): Promise<Message> => {
    const { data } = await api.patch<Message>(`/messages/${messageId}/read`);
    return data;
  },
};
