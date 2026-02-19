import axios from 'axios';
import { whatsappConfig } from '../../config/whatsapp';
import { logger } from '../../shared/utils/logger';

export class WhatsAppService {
  private readonly apiUrl = whatsappConfig.apiUrl;
  private readonly phoneNumberId = whatsappConfig.phoneNumberId;
  private readonly accessToken = whatsappConfig.accessToken;

  async sendMessage(to: string, message: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      logger.info(`Message sent to ${to}`);
      return response.data;
    } catch (error) {
      logger.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  async sendTemplate(to: string, templateName: string, components: unknown[]) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_BR' },
            components,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      logger.error('Error sending template:', error);
      throw error;
    }
  }

  async getMediaUrl(mediaId: string): Promise<string> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v21.0/${mediaId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );
      return response.data.url as string;
    } catch (error) {
      logger.error('Error getting media URL:', error);
      throw error;
    }
  }

  async markAsRead(messageId: string) {
    try {
      await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      logger.error('Error marking message as read:', error);
    }
  }
}

export const whatsappService = new WhatsAppService();
