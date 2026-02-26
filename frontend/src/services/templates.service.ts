import { api } from './api';

export type TemplateStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED'
  | 'PAUSED'
  | 'DISABLED'
  | 'IN_APPEAL'
  | 'DELETED';

export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  text?: string;
  buttons?: unknown[];
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  status: TemplateStatus;
  category: TemplateCategory;
  language: string;
  components: TemplateComponent[];
  created_time?: string;
  last_updated_time?: string;
  rejected_reason?: string;
  quality_score?: { score: string; date: number; reasons?: string[] };
}

export interface CreateTemplateDTO {
  name: string;
  category: TemplateCategory;
  language?: string;
  headerText?: string;
  bodyText: string;
  footerText?: string;
}

export const templatesService = {
  list: async (): Promise<WhatsAppTemplate[]> => {
    const { data } = await api.get<{ data: WhatsAppTemplate[] }>('/templates');
    return data.data;
  },

  create: async (payload: CreateTemplateDTO): Promise<{ id: string; status: string }> => {
    const components: TemplateComponent[] = [];

    if (payload.headerText?.trim()) {
      components.push({ type: 'HEADER', format: 'TEXT', text: payload.headerText.trim() });
    }
    components.push({ type: 'BODY', text: payload.bodyText });
    if (payload.footerText?.trim()) {
      components.push({ type: 'FOOTER', text: payload.footerText.trim() });
    }

    const { data } = await api.post<{ id: string; status: string }>('/templates', {
      name: payload.name,
      category: payload.category,
      language: payload.language ?? 'pt_BR',
      components,
    });
    return data;
  },

  delete: async (name: string): Promise<void> => {
    await api.delete(`/templates/${encodeURIComponent(name)}`);
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getTemplateBody(template: WhatsAppTemplate): string {
  return template.components.find((c) => c.type === 'BODY')?.text ?? '';
}

export function getTemplateHeader(template: WhatsAppTemplate): string | undefined {
  const h = template.components.find((c) => c.type === 'HEADER');
  return h?.format === 'TEXT' ? h.text : undefined;
}

export function getTemplateFooter(template: WhatsAppTemplate): string | undefined {
  return template.components.find((c) => c.type === 'FOOTER')?.text;
}

/** Extract {{n}} variable indices from a template body, sorted */
export function extractVariableIndices(text: string): number[] {
  const matches = [...text.matchAll(/\{\{(\d+)\}\}/g)];
  const indices = matches.map((m) => Number(m[1]));
  return [...new Set(indices)].sort((a, b) => a - b);
}
