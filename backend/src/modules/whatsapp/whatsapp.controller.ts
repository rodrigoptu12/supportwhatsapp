import { Request, Response } from 'express';
import { whatsappWebhook } from './whatsapp.webhook';

export class WhatsAppController {
  verifyWebhook(req: Request, res: Response) {
    whatsappWebhook.verify(req, res);
  }

  async receiveWebhook(req: Request, res: Response) {
    await whatsappWebhook.receive(req, res);
  }
}

export const whatsappController = new WhatsAppController();
