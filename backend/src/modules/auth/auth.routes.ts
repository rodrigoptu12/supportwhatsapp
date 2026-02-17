import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from './auth.middleware';
import { validate } from '../../shared/utils/validation';
import { loginSchema, registerSchema, refreshTokenSchema } from './auth.types';

const router = Router();

router.post('/login', validate(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/register', validate(registerSchema), (req, res, next) => authController.register(req, res, next));
router.post('/refresh-token', validate(refreshTokenSchema), (req, res, next) => authController.refreshToken(req, res, next));
router.get('/me', authMiddleware, (req, res, next) => authController.me(req, res, next));
router.post('/logout', authMiddleware, (req, res) => authController.logout(req, res));

export { router as authRoutes };
