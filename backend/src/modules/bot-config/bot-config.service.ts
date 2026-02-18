import { prisma } from '../../shared/database/prisma.client';
import { BOT_CONFIG_DEFAULTS, BotConfigKey } from './bot-config.types';

export class BotConfigService {
  async list() {
    return prisma.botConfiguration.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async getByKey(key: string) {
    return prisma.botConfiguration.findUnique({
      where: { key },
    });
  }

  async upsert(key: string, value: string, description?: string) {
    return prisma.botConfiguration.upsert({
      where: { key },
      update: {
        value: { message: value },
        ...(description !== undefined && { description }),
      },
      create: {
        key,
        value: { message: value },
        description: description ?? null,
      },
    });
  }

  async getAll(): Promise<Record<string, string>> {
    const configs = await prisma.botConfiguration.findMany({
      where: { isActive: true },
    });

    const result: Record<string, string> = {};

    // Start with defaults
    for (const [key, def] of Object.entries(BOT_CONFIG_DEFAULTS)) {
      result[key] = def.value;
    }

    // Override with DB values
    for (const config of configs) {
      const val = config.value as { message?: string };
      if (val?.message) {
        result[config.key] = val.message;
      }
    }

    return result;
  }

  async seedDefaults() {
    for (const [key, def] of Object.entries(BOT_CONFIG_DEFAULTS)) {
      await prisma.botConfiguration.upsert({
        where: { key },
        update: {},
        create: {
          key,
          value: { message: def.value },
          description: def.description,
        },
      });
    }
  }

  getFlowStructure() {
    return {
      nodes: [
        { id: 'greeting', label: 'Boas-vindas', type: 'message', configKey: 'greeting' },
        { id: 'main_menu', label: 'Menu Principal', type: 'menu', configKeys: ['main_menu_options', 'main_menu_prompt'] },
        { id: 'department_menu', label: 'Menu Setores', type: 'menu', configKeys: ['department_menu_header', 'department_menu_prompt'] },
        { id: 'department_transfer', label: 'Transferencia', type: 'action', configKey: 'department_transfer' },
        { id: 'no_departments', label: 'Sem Setores', type: 'fallback', configKey: 'no_departments' },
        { id: 'error', label: 'Erro', type: 'fallback', configKey: 'error_message' },
      ],
      edges: [
        { from: 'greeting', to: 'main_menu' },
        { from: 'main_menu', to: 'department_menu', label: 'Opcao 1' },
        { from: 'department_menu', to: 'department_transfer', label: 'Setor valido' },
        { from: 'department_menu', to: 'no_departments', label: 'Nenhum setor' },
      ],
    };
  }
}

export const botConfigService = new BotConfigService();
