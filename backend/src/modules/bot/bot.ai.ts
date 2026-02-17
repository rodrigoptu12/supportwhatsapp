import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../shared/utils/logger';

export class BotAI {
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';

  async generateResponse(context: string, userMessage: string): Promise<string> {
    if (!env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not configured');
      return 'IA nao disponivel no momento.';
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Voce e um assistente de atendimento ao cliente. Responda de forma educada e objetiva em portugues. Contexto: ${context}`,
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('OpenAI API error:', error);
      return 'Desculpe, nao consegui processar sua solicitacao. Vou transferir para um atendente.';
    }
  }
}

export const botAI = new BotAI();
