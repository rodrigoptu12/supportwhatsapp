import { Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { AuthRequest } from '../../shared/types';

export class UsersController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '20' } = req.query as Record<string, string>;
      const result = await usersService.list(parseInt(page, 10), parseInt(limit, 10));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getById(req.params.id!);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await usersService.update(req.params.id!, req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async online(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const users = await usersService.getOnlineUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
