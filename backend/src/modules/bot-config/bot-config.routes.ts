import { Router } from 'express';
import { botConfigController } from './bot-config.controller';
import { authMiddleware, authorize } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Admin-only routes
router.get('/config', authorize('admin'), (req, res, next) => botConfigController.list(req, res, next));
router.put('/config/:key', authorize('admin'), (req, res, next) => botConfigController.update(req, res, next));
router.get('/flows', authorize('admin'), (req, res, next) => botConfigController.getFlows(req, res, next));

export { router as botConfigRoutes };
