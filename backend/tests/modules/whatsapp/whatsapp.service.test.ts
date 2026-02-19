/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

const axiosMock = {
  post: fn(),
  get: fn(),
};

jest.mock('axios', () => ({ default: axiosMock, ...axiosMock }));
jest.mock('@/config/whatsapp', () => ({
  whatsappConfig: {
    apiUrl: 'https://graph.facebook.com/v21.0',
    phoneNumberId: '123456',
    accessToken: 'test-token',
  },
}));
jest.mock('@/shared/utils/logger', () => ({
  logger: { info: fn(), error: fn(), warn: fn(), debug: fn() },
}));

import { WhatsAppService } from '@/modules/whatsapp/whatsapp.service';

const service = new WhatsAppService();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('WhatsAppService', () => {
  describe('sendMessage', () => {
    it('sends text message and returns response data', async () => {
      axiosMock.post.mockResolvedValue({ data: { messages: [{ id: 'wa-1' }] } });

      const result = await service.sendMessage('5511999999999', 'Hello');

      expect(result).toEqual({ messages: [{ id: 'wa-1' }] });
      expect(axiosMock.post).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/123456/messages',
        expect.objectContaining({
          messaging_product: 'whatsapp',
          to: '5511999999999',
          type: 'text',
          text: { body: 'Hello' },
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('throws on error', async () => {
      axiosMock.post.mockRejectedValue(new Error('Network error'));

      await expect(service.sendMessage('5511999999999', 'Hello')).rejects.toThrow('Network error');
    });
  });

  describe('sendTemplate', () => {
    it('sends template message and returns response data', async () => {
      axiosMock.post.mockResolvedValue({ data: { messages: [{ id: 'wa-2' }] } });

      const result = await service.sendTemplate('5511999999999', 'hello_world', []);

      expect(result).toEqual({ messages: [{ id: 'wa-2' }] });
      expect(axiosMock.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: 'template',
          template: expect.objectContaining({ name: 'hello_world' }),
        }),
        expect.any(Object),
      );
    });

    it('throws on error', async () => {
      axiosMock.post.mockRejectedValue(new Error('Template error'));

      await expect(service.sendTemplate('5511999999999', 'tpl', [])).rejects.toThrow('Template error');
    });
  });

  describe('getMediaUrl', () => {
    it('returns media URL', async () => {
      axiosMock.get.mockResolvedValue({ data: { url: 'https://media.example.com/file.jpg' } });

      const result = await service.getMediaUrl('media-123');

      expect(result).toBe('https://media.example.com/file.jpg');
    });

    it('throws on error', async () => {
      axiosMock.get.mockRejectedValue(new Error('Media error'));

      await expect(service.getMediaUrl('bad-id')).rejects.toThrow('Media error');
    });
  });

  describe('markAsRead', () => {
    it('calls WhatsApp API to mark message as read', async () => {
      axiosMock.post.mockResolvedValue({});

      await service.markAsRead('wa-msg-1');

      expect(axiosMock.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: 'wa-msg-1',
        }),
        expect.any(Object),
      );
    });

    it('silently catches errors', async () => {
      axiosMock.post.mockRejectedValue(new Error('API error'));

      // Should not throw
      await expect(service.markAsRead('wa-msg-1')).resolves.toBeUndefined();
    });
  });
});
