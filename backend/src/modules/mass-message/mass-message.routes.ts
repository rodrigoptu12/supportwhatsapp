import { Router } from 'express';
import { authMiddleware, authorize } from '../auth/auth.middleware';
import { massMessageController } from './mass-message.controller';

export const massMessageRoutes = Router();

massMessageRoutes.get(
  '/history',
  authMiddleware,
  authorize('admin', 'supervisor'),
  (req, res, next) => massMessageController.getHistory(req, res).catch(next),
);

massMessageRoutes.post(
  '/send',
  authMiddleware,
  authorize('admin', 'supervisor'),
  (req, res, next) => massMessageController.send(req, res).catch(next),
);

massMessageRoutes.post(
  '/send-template',
  authMiddleware,
  authorize('admin', 'supervisor'),
  (req, res, next) => massMessageController.sendTemplate(req, res).catch(next),
);
