import { Router } from 'express';
import { messagesController } from './messages.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res, next) => messagesController.list(req, res, next));
router.post('/', (req, res, next) => messagesController.create(req, res, next));
router.patch('/:id/read', (req, res, next) => messagesController.markAsRead(req, res, next));

export { router as messagesRoutes };
