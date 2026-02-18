import { Response, NextFunction } from 'express';
import { botConfigService } from './bot-config.service';
import { AuthRequest } from '../../shared/types';
import { ValidationError } from '../../shared/utils/errors';
import { updateBotConfigSchema } from './bot-config.types';

export class BotConfigController {
  async list(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const configs = await botConfigService.list();
      res.json(configs);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = updateBotConfigSchema.safeParse({
        params: req.params,
        body: req.body,
      });

      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0]?.message ?? 'Dados invalidos');
      }

      const { key } = parsed.data.params;
      const { value, description } = parsed.data.body;

      const config = await botConfigService.upsert(key, value, description);
      res.json(config);
    } catch (error) {
      next(error);
    }
  }

  async getFlows(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const flows = botConfigService.getFlowStructure();
      res.json(flows);
    } catch (error) {
      next(error);
    }
  }
}

export const botConfigController = new BotConfigController();
