import { Response, NextFunction } from 'express';
import { messagesService } from './messages.service';
import { AuthRequest } from '../../shared/types';

export class MessagesController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { conversation_id, page = '1', limit = '50' } = req.query as Record<string, string>;
      const result = await messagesService.listByConversation(
        conversation_id!,
        parseInt(page, 10),
        parseInt(limit, 10),
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const message = await messagesService.create({
        conversationId: req.body.conversationId,
        senderType: 'attendant',
        senderUserId: req.user!.userId,
        content: req.body.content,
        messageType: req.body.messageType,
        mediaUrl: req.body.mediaUrl,
      });
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await messagesService.markAsRead(req.params.id!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const messagesController = new MessagesController();
