import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import { massMessageService } from './mass-message.service';
import { AppError } from '../../shared/utils/errors';
import { MassMessageContact, TemplateVarMapping } from './mass-message.types';
import { prisma } from '../../shared/database/prisma.client';

export class MassMessageController {
  /** POST /send — free-text mass message */
  async send(req: AuthRequest, res: Response): Promise<void> {
    const { contacts, message } = req.body as {
      contacts?: MassMessageContact[];
      message?: string;
    };

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      throw new AppError('A lista de contatos é obrigatória', 400);
    }
    if (!message || message.trim().length === 0) {
      throw new AppError('A mensagem é obrigatória', 400);
    }
    if (contacts.length > 500) {
      throw new AppError('Máximo de 500 contatos por envio', 400);
    }

    const results = await massMessageService.send(
      { contacts, message: message.trim() },
      req.user?.userId,
    );
    res.json(this.buildResponse(results));
  }

  /** POST /send-template — template-based mass message */
  async sendTemplate(req: AuthRequest, res: Response): Promise<void> {
    const { contacts, templateName, templateLanguage, variableMapping, body } = req.body as {
      contacts?: MassMessageContact[];
      templateName?: string;
      templateLanguage?: string;
      variableMapping?: TemplateVarMapping;
      body?: string;
    };

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      throw new AppError('A lista de contatos é obrigatória', 400);
    }
    if (!templateName || templateName.trim().length === 0) {
      throw new AppError('O nome do template é obrigatório', 400);
    }
    if (!variableMapping || typeof variableMapping !== 'object') {
      throw new AppError('O mapeamento de variáveis é obrigatório', 400);
    }
    if (contacts.length > 500) {
      throw new AppError('Máximo de 500 contatos por envio', 400);
    }

    const results = await massMessageService.sendTemplate(
      {
        contacts,
        templateName: templateName.trim(),
        templateLanguage,
        variableMapping,
        body,
      },
      req.user?.userId,
    );
    res.json(this.buildResponse(results));
  }

  /** GET /history — list past mass message batches */
  async getHistory(_req: AuthRequest, res: Response): Promise<void> {
    const batches = await prisma.massMessageBatch.findMany({
      orderBy: { sentAt: 'desc' },
      take: 200,
      include: {
        user: { select: { fullName: true } },
      },
    });
    res.json(batches);
  }

  private buildResponse(results: ReturnType<typeof Array.prototype.filter>) {
    const successCount = results.filter((r: { success: boolean }) => r.success).length;
    const failureCount = results.filter((r: { success: boolean }) => !r.success).length;
    return { successCount, failureCount, total: results.length, results };
  }
}

export const massMessageController = new MassMessageController();
