import axios from 'axios';
import { whatsappConfig } from '../../config/whatsapp';
import { logger } from '../../shared/utils/logger';
import { CreateTemplateDTO, WhatsAppTemplate } from './templates.types';

export class TemplatesService {
  private readonly apiUrl = whatsappConfig.apiUrl;
  private readonly wabaId = whatsappConfig.businessAccountId;
  private readonly accessToken = whatsappConfig.accessToken;

  async list(): Promise<WhatsAppTemplate[]> {
    if (!this.wabaId) {
      logger.warn('WHATSAPP_BUSINESS_ACCOUNT_ID not configured — templates unavailable');
      return [];
    }
    try {
      const response = await axios.get<{ data: WhatsAppTemplate[] }>(
        `${this.apiUrl}/${this.wabaId}/message_templates`,
        {
          params: {
            access_token: this.accessToken,
            fields:
              'id,name,status,category,language,components,created_time,last_updated_time,rejected_reason,quality_score',
            limit: 200,
          },
        },
      );
      return response.data.data ?? [];
    } catch (error: any) {
      const metaMsg = error?.response?.data?.error?.message ?? '';
      if (error?.response?.status === 400 && metaMsg) {
        logger.warn(`Templates API error (check WHATSAPP_BUSINESS_ACCOUNT_ID "${this.wabaId}"): ${metaMsg}`);
        return [];
      }
      logger.error('Error listing templates:', error);
      throw error;
    }
  }

  async create(data: CreateTemplateDTO): Promise<{ id: string; status: string }> {
    try {
      const response = await axios.post<{ id: string; status: string }>(
        `${this.apiUrl}/${this.wabaId}/message_templates`,
        {
          name: data.name,
          category: data.category,
          language: data.language ?? 'pt_BR',
          components: data.components,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      logger.info(`Template created: ${data.name}`);
      return response.data;
    } catch (error: any) {
      const metaError = error?.response?.data?.error ?? {};
      logger.error(`Error creating template — Meta response: ${JSON.stringify(metaError)}`);
      const userMsg = metaError.error_user_msg || metaError.message || 'Erro ao criar template na Meta';
      throw new Error(userMsg);
    }
  }

  async delete(name: string): Promise<void> {
    try {
      await axios.delete(`${this.apiUrl}/${this.wabaId}/message_templates`, {
        params: { name, access_token: this.accessToken },
      });
      logger.info(`Template deleted: ${name}`);
    } catch (error) {
      logger.error('Error deleting template:', error);
      throw error;
    }
  }
}

export const templatesService = new TemplatesService();
