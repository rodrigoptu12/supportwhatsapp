import { Response, NextFunction } from 'express';
import { conversationsService } from './conversations.service';
import { AuthRequest } from '../../shared/types';

export class ConversationsController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, assignedUserId, departmentId, page = '1', limit = '20' } = req.query as Record<string, string>;
      const result = await conversationsService.list({
        status,
        assignedUserId,
        departmentId,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const conversation = await conversationsService.getById(req.params.id!);
      res.json(conversation);
    } catch (error) {
      next(error);
    }
  }

  async takeover(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await conversationsService.takeover(req.params.id!, req.user!.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async transfer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { toUserId, reason } = req.body;
      const result = await conversationsService.transfer(
        req.params.id!,
        req.user!.userId,
        toUserId,
        reason,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async close(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await conversationsService.close(req.params.id!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async stats(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await conversationsService.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

export const conversationsController = new ConversationsController();
