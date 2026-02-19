/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

const whatsappWebhookMock = {
  verify: fn(),
  receive: fn(),
};

jest.mock('@/modules/whatsapp/whatsapp.webhook', () => ({
  whatsappWebhook: whatsappWebhookMock,
}));

import { WhatsAppController } from '@/modules/whatsapp/whatsapp.controller';

const controller = new WhatsAppController();

beforeEach(() => jest.clearAllMocks());

describe('WhatsAppController', () => {
  it('delegates verifyWebhook to webhook', () => {
    const req = {} as any;
    const res = {} as any;

    controller.verifyWebhook(req, res);

    expect(whatsappWebhookMock.verify).toHaveBeenCalledWith(req, res);
  });

  it('delegates receiveWebhook to webhook', async () => {
    whatsappWebhookMock.receive.mockResolvedValue(undefined);
    const req = {} as any;
    const res = {} as any;

    await controller.receiveWebhook(req, res);

    expect(whatsappWebhookMock.receive).toHaveBeenCalledWith(req, res);
  });
});
