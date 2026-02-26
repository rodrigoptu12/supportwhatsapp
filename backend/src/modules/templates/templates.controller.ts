import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import { templatesService } from './templates.service';
import { AppError } from '../../shared/utils/errors';
import { CreateTemplateDTO } from './templates.types';

export class TemplatesController {
  async list(_req: AuthRequest, res: Response): Promise<void> {
    const templates = await templatesService.list();
    res.json({ data: templates });
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    const { name, category, language, components } = req.body as Partial<CreateTemplateDTO>;

    if (!name || !category || !components || !Array.isArray(components)) {
      throw new AppError('name, category e components são obrigatórios', 400);
    }

    if (!/^[a-z0-9_]+$/.test(name)) {
      throw new AppError('O nome do template deve conter apenas letras minúsculas, números e _', 400);
    }

    try {
      const result = await templatesService.create({ name, category, language, components });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? 'Erro ao criar template' });
    }
  }

  async remove(req: AuthRequest, res: Response): Promise<void> {
    const { name } = req.params as { name: string };
    if (!name) throw new AppError('name é obrigatório', 400);
    await templatesService.delete(name);
    res.json({ success: true });
  }
}

export const templatesController = new TemplatesController();
