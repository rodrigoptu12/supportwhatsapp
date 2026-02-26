import { whatsappService } from '../whatsapp/whatsapp.service';
import {
  SendMassMessageDTO,
  SendMassTemplateDTO,
  MassMessageResult,
  TemplateVarMapping,
  MassMessageContact,
} from './mass-message.types';
import { logger } from '../../shared/utils/logger';
import { socketServer } from '../../websocket/socket.server';
import { SocketEvents } from '../../websocket/socket.events';
import { prisma } from '../../shared/database/prisma.client';

export class MassMessageService {
  /** Send free-text messages with optional {variable} interpolation */
  async send(data: SendMassMessageDTO, userId?: string): Promise<MassMessageResult[]> {
    const results: MassMessageResult[] = [];
    const total = data.contacts.length;

    for (let i = 0; i < total; i++) {
      const contact = data.contacts[i];
      const message = this.interpolateMessage(data.message, contact);
      try {
        await whatsappService.sendMessage(contact.phone, message);
        results.push({ phone: contact.phone, name: contact.name, success: true });
        logger.info(`Mass message sent to ${contact.phone} (${contact.name ?? 'unknown'})`);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push({ phone: contact.phone, name: contact.name, success: false, error: errMsg });
        logger.warn(`Mass message failed for ${contact.phone}: ${errMsg}`);
      }

      if (userId) {
        await socketServer.notifyUser(userId, SocketEvents.MASS_MESSAGE_PROGRESS, {
          sent: i + 1,
          total,
          successCount: results.filter((r) => r.success).length,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    if (userId) {
      await socketServer.notifyUser(userId, SocketEvents.MASS_MESSAGE_DONE, {
        total,
        successCount,
        failureCount,
      });

      await prisma.massMessageBatch.create({
        data: {
          userId,
          label: data.message.slice(0, 255),
          type: 'free',
          total,
          successCount,
          failureCount,
        },
      });
    }

    return results;
  }

  /** Send approved template messages with per-contact variable substitution */
  async sendTemplate(data: SendMassTemplateDTO, userId?: string): Promise<MassMessageResult[]> {
    const results: MassMessageResult[] = [];
    const total = data.contacts.length;

    for (let i = 0; i < total; i++) {
      const contact = data.contacts[i];
      const components = this.buildTemplateComponents(data.variableMapping, contact);
      try {
        await whatsappService.sendTemplate(
          contact.phone,
          data.templateName,
          components,
        );
        results.push({ phone: contact.phone, name: contact.name, success: true });
        logger.info(`Template "${data.templateName}" sent to ${contact.phone}`);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push({ phone: contact.phone, name: contact.name, success: false, error: errMsg });
        logger.warn(`Template send failed for ${contact.phone}: ${errMsg}`);
      }

      if (userId) {
        await socketServer.notifyUser(userId, SocketEvents.MASS_MESSAGE_PROGRESS, {
          sent: i + 1,
          total,
          successCount: results.filter((r) => r.success).length,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    if (userId) {
      await socketServer.notifyUser(userId, SocketEvents.MASS_MESSAGE_DONE, {
        total,
        successCount,
        failureCount,
      });

      await prisma.massMessageBatch.create({
        data: {
          userId,
          label: data.templateName.slice(0, 255),
          type: 'template',
          total,
          successCount,
          failureCount,
        },
      });
    }

    return results;
  }

  private interpolateMessage(template: string, contact: Record<string, string | undefined>): string {
    return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
      return contact[key] ?? `{${key}}`;
    });
  }

  /** Build WhatsApp template body component with ordered text parameters */
  private buildTemplateComponents(
    mapping: TemplateVarMapping,
    contact: MassMessageContact,
  ): unknown[] {
    const sortedIndices = Object.keys(mapping)
      .map(Number)
      .sort((a, b) => a - b);

    const parameters = sortedIndices.map((idx) => ({
      type: 'text',
      text: contact[mapping[idx]] ?? '',
    }));

    if (parameters.length === 0) return [];

    return [{ type: 'body', parameters }];
  }
}

export const massMessageService = new MassMessageService();
