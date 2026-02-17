import { Router } from 'express';
import { departmentsController } from './departments.controller';
import { authMiddleware, authorize } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware);

// All authenticated users can list and view departments
router.get('/', (req, res, next) => departmentsController.list(req, res, next));
router.get('/:id', (req, res, next) => departmentsController.getById(req, res, next));
router.get('/:id/attendants', (req, res, next) => departmentsController.getAttendants(req, res, next));

// Only admins can create/update/delete
router.post('/', authorize('admin'), (req, res, next) => departmentsController.create(req, res, next));
router.patch('/:id', authorize('admin'), (req, res, next) => departmentsController.update(req, res, next));
router.delete('/:id', authorize('admin'), (req, res, next) => departmentsController.delete(req, res, next));

export { router as departmentsRoutes };
