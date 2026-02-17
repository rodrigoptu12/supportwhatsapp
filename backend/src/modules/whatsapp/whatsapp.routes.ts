import { Router } from 'express';
import { whatsappController } from './whatsapp.controller';

const router = Router();

router.get('/', (req, res) => whatsappController.verifyWebhook(req, res));
router.post('/', (req, res) => whatsappController.receiveWebhook(req, res));

export { router as whatsappRoutes };
