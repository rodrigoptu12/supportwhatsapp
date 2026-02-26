import { Router } from 'express';
import { authMiddleware, authorize } from '../auth/auth.middleware';
import { templatesController } from './templates.controller';

export const templatesRoutes = Router();

templatesRoutes.get(
  '/',
  authMiddleware,
  authorize('admin', 'supervisor'),
  (req, res, next) => templatesController.list(req as Parameters<typeof templatesController.list>[0], res).catch(next),
);

templatesRoutes.post(
  '/',
  authMiddleware,
  authorize('admin'),
  (req, res, next) => templatesController.create(req as Parameters<typeof templatesController.create>[0], res).catch(next),
);

templatesRoutes.delete(
  '/:name',
  authMiddleware,
  authorize('admin'),
  (req, res, next) => templatesController.remove(req as Parameters<typeof templatesController.remove>[0], res).catch(next),
);
