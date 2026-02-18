import { api } from './api';

export interface BotConfig {
  id: string;
  key: string;
  value: { message: string };
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BotFlows {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    configKey?: string;
    configKeys?: string[];
  }>;
  edges: Array<{
    from: string;
    to: string;
    label?: string;
  }>;
}

export const botConfigApi = {
  list: async (): Promise<BotConfig[]> => {
    const { data } = await api.get<BotConfig[]>('/bot/config');
    return data;
  },

  update: async (key: string, value: string): Promise<BotConfig> => {
    const { data } = await api.put<BotConfig>(`/bot/config/${key}`, { value });
    return data;
  },

  getFlows: async (): Promise<BotFlows> => {
    const { data } = await api.get<BotFlows>('/bot/flows');
    return data;
  },
};
