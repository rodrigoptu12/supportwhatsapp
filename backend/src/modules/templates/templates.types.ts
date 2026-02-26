export type TemplateStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED'
  | 'PAUSED'
  | 'DISABLED'
  | 'IN_APPEAL'
  | 'DELETED';

export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

export type ComponentType = 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
export type HeaderFormat = 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';

export interface TemplateComponent {
  type: ComponentType;
  format?: HeaderFormat;
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
  quality_score?: {
    score: string;
    date: number;
    reasons?: string[];
  };
}

export interface CreateTemplateDTO {
  name: string;
  category: TemplateCategory;
  language?: string;
  components: TemplateComponent[];
}
