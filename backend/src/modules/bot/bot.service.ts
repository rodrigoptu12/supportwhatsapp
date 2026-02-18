import { Conversation } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.client';
import { logger } from '../../shared/utils/logger';
import { botConfigService } from '../bot-config/bot-config.service';

interface BotResponse {
  message: string;
  nextMenuLevel?: string;
  needsHuman?: boolean;
  departmentId?: string;
}

export class BotService {
  async processMessage(conversation: Conversation, messageText: string): Promise<BotResponse | null> {
    const menuLevel = conversation.currentMenuLevel;
    logger.info(`Bot processing: menu=${menuLevel}, text="${messageText}"`);

    const configs = await botConfigService.getAll();

    try {
      const response = await this.handleMenuLevel(menuLevel, messageText, conversation, configs);

      const updateData: Record<string, unknown> = {};

      if (response.nextMenuLevel) {
        updateData.currentMenuLevel = response.nextMenuLevel;
      }

      if (response.needsHuman) {
        updateData.needsHumanAttention = true;
        updateData.isBotActive = false;
      }

      if (response.departmentId) {
        updateData.departmentId = response.departmentId;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: updateData,
        });
      }

      return response;
    } catch (error) {
      logger.error('Bot processing error:', error);
      return {
        message: configs['error_message'] ?? 'Desculpe, ocorreu um erro. Vou transferir voce para um atendente.',
        needsHuman: true,
      };
    }
  }

  private async handleMenuLevel(
    menuLevel: string,
    messageText: string,
    _conversation: Conversation,
    configs: Record<string, string>,
  ): Promise<BotResponse> {
    switch (menuLevel) {
      case 'main':
        return this.mainMenu(messageText, configs);
      case 'department_selection':
        return this.departmentSelection(messageText, configs);
      default:
        return this.mainMenu(messageText, configs);
    }
  }

  private async mainMenu(messageText: string, configs: Record<string, string>): Promise<BotResponse> {
    const option = messageText.trim();

    if (option === '1') {
      return this.buildDepartmentMenu(configs);
    }

    const greeting = configs['greeting'] ?? 'Ola! Bem-vindo ao Grupo Multi Educacao.';
    const menuOptions = configs['main_menu_options'] ?? '1. Falar com um setor';
    const menuPrompt = configs['main_menu_prompt'] ?? 'Digite o numero da opcao:';

    return {
      message: `${greeting}\n\n${menuOptions}\n\n${menuPrompt}`,
    };
  }

  private async buildDepartmentMenu(configs: Record<string, string>): Promise<BotResponse> {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    if (departments.length === 0) {
      return {
        message: configs['no_departments'] ?? 'No momento nao ha setores disponiveis. Voce sera atendido em breve.',
        needsHuman: true,
      };
    }

    const header = configs['department_menu_header'] ?? 'Escolha o setor:';
    const prompt = configs['department_menu_prompt'] ?? 'Digite o numero:';

    const options = departments
      .map((dept, index) => `${index + 1}. ${dept.name}`)
      .join('\n');

    return {
      message: `${header}\n\n${options}\n\n${prompt}`,
      nextMenuLevel: 'department_selection',
    };
  }

  private async departmentSelection(messageText: string, configs: Record<string, string>): Promise<BotResponse> {
    const option = parseInt(messageText.trim(), 10);

    if (isNaN(option) || option < 1) {
      return this.buildDepartmentMenu(configs);
    }

    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    const index = option - 1;
    if (index >= departments.length) {
      return this.buildDepartmentMenu(configs);
    }

    const department = departments[index]!;
    const template = configs['department_transfer'] ?? 'Voce sera atendido pelo setor *{department}*. Aguarde um momento...';
    const message = template.replace('{department}', department.name);

    return {
      message,
      needsHuman: true,
      departmentId: department.id,
    };
  }
}

export const botService = new BotService();
