import { Request, Response } from 'express';
import { whatsappConfig } from '../../config/whatsapp';
import { whatsappService } from './whatsapp.service';
import { conversationsService } from '../conversations/conversations.service';
import { messagesService } from '../messages/messages.service';
import { botService } from '../bot/bot.service';
import { socketServer } from '../../websocket/socket.server';
import { SocketEvents } from '../../websocket/socket.events';
import { logger } from '../../shared/utils/logger';
import { prisma } from '../../shared/database/prisma.client';

export class WhatsAppWebhook {
  verify(req: Request, res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === whatsappConfig.webhookVerifyToken) {
      logger.info('Webhook verified successfully');
      res.status(200).send(challenge);
      return;
    }

    res.status(403).send('Forbidden');
  }

  async receive(req: Request, res: Response) {
    try {
      const { entry } = req.body;

      // Respond immediately
      res.status(200).send('EVENT_RECEIVED');

      if (!entry) return;

      for (const item of entry) {
        const changes = item.changes;
        for (const change of changes) {
          if (change.field === 'messages') {
            await this.processMessage(change.value);
          }
        }
      }
    } catch (error) {
      logger.error('Webhook error:', error);
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error');
      }
    }
  }

  private async processMessage(data: { messages?: Array<{ from: string; text?: { body: string }; id: string }>; contacts?: Array<{ profile?: { name: string } }> }) {
    const messages = data.messages;
    if (!messages || messages.length === 0) return;

    const message = messages[0]!;
    const phoneNumber = message.from;
    const messageText = message.text?.body ?? '';
    const messageId = message.id;

    logger.info(`Message received from ${phoneNumber}: ${messageText}`);

    try {
      const customer = await this.getOrCreateCustomer(
        phoneNumber,
        data.contacts?.[0]?.profile?.name,
      );

      const conversation = await conversationsService.getOrCreate(customer.id);

      const savedMessage = await messagesService.create({
        conversationId: conversation.id,
        senderType: 'customer',
        content: messageText,
        whatsappMessageId: messageId,
      });

      logger.info(`Message saved: ${savedMessage.id}`);

      // Notify frontend in real-time about the new customer message
      if (socketServer) {
        // Emit to conversation room (for subscribers)
        socketServer.emitNewMessage(conversation.id, savedMessage);

        // Also notify the assigned attendant directly (most reliable)
        if (conversation.assignedUserId) {
          await socketServer.notifyUser(
            conversation.assignedUserId,
            SocketEvents.NEW_MESSAGE,
            savedMessage,
          );
        }

        // Also broadcast to all online attendants so conversation list updates
        await socketServer.broadcastToAttendants(SocketEvents.NEW_MESSAGE, savedMessage);
      }

      if (conversation.isBotActive) {
        const botResponse = await botService.processMessage(conversation, messageText);

        if (botResponse) {
          await whatsappService.sendMessage(phoneNumber, botResponse.message);

          await messagesService.create({
            conversationId: conversation.id,
            senderType: 'bot',
            content: botResponse.message,
          });

          // If bot routed to a department, notify that department's attendants
          if (botResponse.departmentId && botResponse.needsHuman) {
            const updatedConversation = await prisma.conversation.findUnique({
              where: { id: conversation.id },
              include: {
                customer: { select: { id: true, name: true, phoneNumber: true } },
                department: { select: { id: true, name: true } },
              },
            });

            if (updatedConversation && socketServer) {
              socketServer.notifyDepartment(
                botResponse.departmentId,
                SocketEvents.NEW_CONVERSATION,
                updatedConversation,
              );
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error processing message:', error);
    }
  }

  private async getOrCreateCustomer(phoneNumber: string, name?: string) {
    let customer = await prisma.customer.findUnique({
      where: { phoneNumber },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          phoneNumber,
          name: name ?? phoneNumber,
        },
      });
    }

    return customer;
  }
}

export const whatsappWebhook = new WhatsAppWebhook();
