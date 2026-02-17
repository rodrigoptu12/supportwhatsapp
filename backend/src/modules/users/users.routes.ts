import { Router } from 'express';
import { usersController } from './users.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res, next) => usersController.list(req, res, next));
router.get('/online', (req, res, next) => usersController.online(req, res, next));
router.get('/:id', (req, res, next) => usersController.getById(req, res, next));
router.patch('/:id', (req, res, next) => usersController.update(req, res, next));

export { router as usersRoutes };
