/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

const axiosMock = { post: fn() };

jest.mock('axios', () => ({ default: axiosMock, ...axiosMock }));
jest.mock('@/config/env', () => ({
  env: { OPENAI_API_KEY: 'test-key' },
}));
jest.mock('@/shared/utils/logger', () => ({
  logger: { info: fn(), error: fn(), warn: fn(), debug: fn() },
}));

import { BotAI } from '@/modules/bot/bot.ai';

const botAI = new BotAI();

beforeEach(() => jest.clearAllMocks());

describe('BotAI', () => {
  describe('generateResponse', () => {
    it('returns AI-generated response on success', async () => {
      axiosMock.post.mockResolvedValue({
        data: { choices: [{ message: { content: 'AI response' } }] },
      });

      const result = await botAI.generateResponse('Support context', 'How can I help?');

      expect(result).toBe('AI response');
      expect(axiosMock.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({ model: 'gpt-3.5-turbo' }),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
        }),
      );
    });

    it('returns fallback message on API error', async () => {
      axiosMock.post.mockRejectedValue(new Error('API error'));

      const result = await botAI.generateResponse('ctx', 'msg');

      expect(result).toContain('nao consegui processar');
    });
  });
});

describe('BotAI without API key', () => {
  it('returns unavailable message when no API key', async () => {
    // Re-mock with empty key
    jest.resetModules();
    jest.mock('axios', () => ({ default: axiosMock, ...axiosMock }));
    jest.mock('@/config/env', () => ({
      env: { OPENAI_API_KEY: '' },
    }));
    jest.mock('@/shared/utils/logger', () => ({
      logger: { info: fn(), error: fn(), warn: fn(), debug: fn() },
    }));

    const { BotAI: BotAINoKey } = await import('@/modules/bot/bot.ai');
    const ai = new BotAINoKey();

    const result = await ai.generateResponse('ctx', 'msg');

    expect(result).toContain('nao disponivel');
  });
});
