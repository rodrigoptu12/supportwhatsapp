import { Conversation } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.client';
import { logger } from '../../shared/utils/logger';

interface BotResponse {
  message: string;
  nextMenuLevel?: string;
  needsHuman?: boolean;
}

export class BotService {
  async processMessage(conversation: Conversation, messageText: string): Promise<BotResponse | null> {
    const menuLevel = conversation.currentMenuLevel;

    logger.info(`Bot processing: menu=${menuLevel}, text="${messageText}"`);

    try {
      const response = await this.handleMenuLevel(menuLevel, messageText, conversation);

      if (response.nextMenuLevel) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { currentMenuLevel: response.nextMenuLevel },
        });
      }

      if (response.needsHuman) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { needsHumanAttention: true },
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
      case 'support':
        return this.supportMenu(messageText);
      case 'sales':
        return this.salesMenu(messageText);
      default:
        return this.mainMenu(messageText);
    }
  }

  private mainMenu(messageText: string): BotResponse {
    const option = messageText.trim();

    switch (option) {
      case '1':
        return {
          message: '*Suporte Tecnico*\n\n1. Problema com produto\n2. Duvida tecnica\n3. Falar com atendente\n\nDigite o numero da opcao:',
          nextMenuLevel: 'support',
        };
      case '2':
        return {
          message: '*Vendas*\n\n1. Conhecer produtos\n2. Precos e planos\n3. Falar com vendedor\n\nDigite o numero da opcao:',
          nextMenuLevel: 'sales',
        };
      case '3':
        return {
          message: 'Voce sera transferido para um atendente. Aguarde um momento...',
          needsHuman: true,
        };
      default:
        return {
          message: 'Ola! Bem-vindo ao nosso atendimento.\n\nEscolha uma opcao:\n\n1. Suporte Tecnico\n2. Vendas\n3. Falar com Atendente\n\nDigite o numero da opcao:',
        };
    }
  }

  private supportMenu(messageText: string): BotResponse {
    const option = messageText.trim();

    switch (option) {
      case '1':
        return {
          message: 'Por favor, descreva o problema com o produto que vou encaminhar para nossa equipe tecnica.',
          needsHuman: true,
        };
      case '2':
        return {
          message: 'Qual e a sua duvida tecnica? Um de nossos especialistas ira ajuda-lo.',
          needsHuman: true,
        };
      case '3':
        return {
          message: 'Transferindo para um atendente. Aguarde...',
          needsHuman: true,
        };
      case '0':
        return {
          message: 'Voltando ao menu principal...\n\n1. Suporte Tecnico\n2. Vendas\n3. Falar com Atendente\n\nDigite o numero da opcao:',
          nextMenuLevel: 'main',
        };
      default:
        return {
          message: 'Opcao invalida.\n\n1. Problema com produto\n2. Duvida tecnica\n3. Falar com atendente\n0. Voltar\n\nDigite o numero da opcao:',
        };
    }
  }

  private salesMenu(messageText: string): BotResponse {
    const option = messageText.trim();

    switch (option) {
      case '1':
        return {
          message: 'Nossos produtos incluem diversas solucoes. Um vendedor pode ajuda-lo a encontrar a melhor opcao!',
          needsHuman: true,
        };
      case '2':
        return {
          message: 'Vou conectar voce com nosso time comercial para informar precos e planos atualizados.',
          needsHuman: true,
        };
      case '3':
        return {
          message: 'Transferindo para um vendedor. Aguarde...',
          needsHuman: true,
        };
      case '0':
        return {
          message: 'Voltando ao menu principal...\n\n1. Suporte Tecnico\n2. Vendas\n3. Falar com Atendente\n\nDigite o numero da opcao:',
          nextMenuLevel: 'main',
        };
      default:
        return {
          message: 'Opcao invalida.\n\n1. Conhecer produtos\n2. Precos e planos\n3. Falar com vendedor\n0. Voltar\n\nDigite o numero da opcao:',
        };
    }
  }
}

export const botService = new BotService();
