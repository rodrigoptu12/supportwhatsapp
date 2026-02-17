import { Conversation } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.client';
import { logger } from '../../shared/utils/logger';

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

    try {
      const response = await this.handleMenuLevel(menuLevel, messageText, conversation);

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
        message: 'Desculpe, ocorreu um erro. Vou transferir voce para um atendente.',
        needsHuman: true,
      };
    }
  }

  private async handleMenuLevel(
    menuLevel: string,
    messageText: string,
    _conversation: Conversation,
  ): Promise<BotResponse> {
    switch (menuLevel) {
      case 'main':
        return this.mainMenu(messageText);
      case 'department_selection':
        return this.departmentSelection(messageText);
      default:
        return this.mainMenu(messageText);
    }
  }

  private async mainMenu(messageText: string): Promise<BotResponse> {
    const option = messageText.trim();

    if (option === '1') {
      return this.buildDepartmentMenu();
    }

    return {
      message: 'Ola! Bem-vindo ao Grupo Multi Educacao.\n\n1. Falar com um setor\n\nDigite o numero da opcao:',
    };
  }

  private async buildDepartmentMenu(): Promise<BotResponse> {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    if (departments.length === 0) {
      return {
        message: 'No momento nao ha setores disponiveis. Voce sera atendido em breve.',
        needsHuman: true,
      };
    }

    const options = departments
      .map((dept, index) => `${index + 1}. ${dept.name}`)
      .join('\n');

    return {
      message: `Escolha o setor:\n\n${options}\n\nDigite o numero:`,
      nextMenuLevel: 'department_selection',
    };
  }

  private async departmentSelection(messageText: string): Promise<BotResponse> {
    const option = parseInt(messageText.trim(), 10);

    if (isNaN(option) || option < 1) {
      return this.buildDepartmentMenu();
    }

    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    const index = option - 1;
    if (index >= departments.length) {
      return this.buildDepartmentMenu();
    }

    const department = departments[index]!;

    return {
      message: `Voce sera atendido pelo setor *${department.name}*. Aguarde um momento...`,
      needsHuman: true,
      departmentId: department.id,
    };
  }
}

export const botService = new BotService();
