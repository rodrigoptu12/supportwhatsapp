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
import { conversationsService } from '../conversations/conversations.service';
import { messagesService } from '../messages/messages.service';

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

        // Record message in conversation history
        try {
          const customer = await prisma.customer.upsert({
            where: { phoneNumber: contact.phone },
            create: { phoneNumber: contact.phone, name: contact.name ?? contact.phone },
            update: {},
          });
          const conversation = await conversationsService.getOrCreate(customer.id);
          await messagesService.create({
            conversationId: conversation.id,
            senderType: 'attendant',
            senderUserId: userId,
            content: message,
            metadata: { source: 'mass_message' },
          });
        } catch (historyErr) {
          logger.warn(`Failed to record mass message history for ${contact.phone}: ${historyErr instanceof Error ? historyErr.message : historyErr}`);
        }
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

        // Record message in conversation history
        try {
          const customer = await prisma.customer.upsert({
            where: { phoneNumber: contact.phone },
            create: { phoneNumber: contact.phone, name: contact.name ?? contact.phone },
            update: {},
          });
          const conversation = await conversationsService.getOrCreate(customer.id);
          const content = data.body
            ? this.interpolateTemplateBody(data.body, data.variableMapping, contact)
            : `[Template: ${data.templateName}]`;
          await messagesService.create({
            conversationId: conversation.id,
            senderType: 'attendant',
            senderUserId: userId,
            content,
            metadata: { source: 'mass_message' },
          });
        } catch (historyErr) {
          logger.warn(`Failed to record template history for ${contact.phone}: ${historyErr instanceof Error ? historyErr.message : historyErr}`);
        }
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

  /** Replace {{1}}, {{2}} etc. in a template body with contact field values */
  private interpolateTemplateBody(
    body: string,
    mapping: TemplateVarMapping,
    contact: MassMessageContact,
  ): string {
    return body.replace(/\{\{(\d+)\}\}/g, (_match, idx: string) => {
      const field = mapping[Number(idx)];
      return field ? (contact[field] ?? '') : `{{${idx}}}`;
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
