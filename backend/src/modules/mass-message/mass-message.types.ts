export interface MassMessageContact {
  phone: string;
  name?: string;
  [key: string]: string | undefined;
}

// Free-text send
export interface SendMassMessageDTO {
  contacts: MassMessageContact[];
  message: string;
}

// Template variable mapping: varIndex (1-based) → student field key
export type TemplateVarMapping = Record<number, string>;

// Template-based send
export interface SendMassTemplateDTO {
  contacts: MassMessageContact[];
  templateName: string;
  templateLanguage?: string;
  /** e.g. { 1: 'name', 2: 'turma', 3: 'rm' } */
  variableMapping: TemplateVarMapping;
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
