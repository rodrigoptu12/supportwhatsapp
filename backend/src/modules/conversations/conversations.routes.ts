import { Router } from 'express';
import { conversationsController } from './conversations.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res, next) => conversationsController.list(req, res, next));
router.get('/stats', (req, res, next) => conversationsController.stats(req, res, next));
router.get('/:id', (req, res, next) => conversationsController.getById(req, res, next));
router.post('/:id/takeover', (req, res, next) => conversationsController.takeover(req, res, next));
router.post('/:id/transfer', (req, res, next) => conversationsController.transfer(req, res, next));
router.post('/:id/close', (req, res, next) => conversationsController.close(req, res, next));

export { router as conversationsRoutes };
