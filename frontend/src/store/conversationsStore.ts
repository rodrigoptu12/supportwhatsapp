import { create } from 'zustand';
import type { Conversation } from '../types';

interface ConversationsState {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  setConversations: (conversations: Conversation[]) => void;
  selectConversation: (conversation: Conversation | null) => void;
  updateConversation: (id: string, data: Partial<Conversation>) => void;
  addConversation: (conversation: Conversation) => void;
}

export const useConversationsStore = create<ConversationsState>((set) => ({
  conversations: [],
  selectedConversation: null,

  setConversations: (conversations) => set({ conversations }),

  selectConversation: (conversation) => set({ selectedConversation: conversation }),

  updateConversation: (id, data) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...data } : c,
      ),
      selectedConversation:
        state.selectedConversation?.id === id
          ? { ...state.selectedConversation, ...data }
          : state.selectedConversation,
    })),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),
}));
