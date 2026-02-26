import { api } from './api';

export interface MassMessageContact {
  phone: string;
  name?: string;
  rm?: string;
  turma?: string;
  email?: string;
  status?: string;
  [key: string]: string | undefined;
}

export interface MassMessageResult {
  phone: string;
  name?: string;
  success: boolean;
  error?: string;
}

export interface SendMassMessageResponse {
  successCount: number;
  failureCount: number;
  total: number;
  results: MassMessageResult[];
}

export interface MassMessageHistoryEntry {
  id: string;
  userId: string;
  label: string;
  type: 'template' | 'free';
  total: number;
  successCount: number;
  failureCount: number;
  sentAt: string;
  user: { fullName: string };
}

/** variableMapping: { 1: 'name', 2: 'turma', 3: 'rm' } */
export type TemplateVarMapping = Record<number, string>;

export const massMessageService = {
  /** Free-text message with {variable} interpolation */
  send: async (
    contacts: MassMessageContact[],
    message: string,
  ): Promise<SendMassMessageResponse> => {
    const { data } = await api.post<SendMassMessageResponse>('/mass-message/send', {
      contacts,
      message,
    });
    return data;
  },

  /** Fetch send history from DB */
  getHistory: async (): Promise<MassMessageHistoryEntry[]> => {
    const { data } = await api.get<MassMessageHistoryEntry[]>('/mass-message/history');
    return data;
  },

  /** WhatsApp approved template with {{1}} {{2}} variable mapping */
  sendTemplate: async (
    contacts: MassMessageContact[],
    templateName: string,
    variableMapping: TemplateVarMapping,
    templateLanguage?: string,
  ): Promise<SendMassMessageResponse> => {
    const { data } = await api.post<SendMassMessageResponse>('/mass-message/send-template', {
      contacts,
      templateName,
      templateLanguage,
      variableMapping,
    });
    return data;
  },
};
