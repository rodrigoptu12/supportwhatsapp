import { api } from './api';
import type { Conversation, ConversationStats, PaginatedResponse } from '../types';

export const conversationsApi = {
  list: async (params?: { status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Conversation>> => {
    const { data } = await api.get<PaginatedResponse<Conversation>>('/conversations', { params });
    return data;
  },

  getById: async (id: string): Promise<Conversation> => {
    const { data } = await api.get<Conversation>(`/conversations/${id}`);
    return data;
  },

  takeover: async (id: string): Promise<Conversation> => {
    const { data } = await api.post<Conversation>(`/conversations/${id}/takeover`);
    return data;
  },

  transfer: async (id: string, toUserId: string, reason?: string): Promise<Conversation> => {
    const { data } = await api.post<Conversation>(`/conversations/${id}/transfer`, { toUserId, reason });
    return data;
  },

  close: async (id: string): Promise<Conversation> => {
    const { data } = await api.post<Conversation>(`/conversations/${id}/close`);
    return data;
  },

  stats: async (): Promise<ConversationStats> => {
    const { data } = await api.get<ConversationStats>('/conversations/stats');
    return data;
  },
};
