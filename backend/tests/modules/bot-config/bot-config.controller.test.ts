/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

const botConfigServiceMock = {
  list: fn(),
  upsert: fn(),
  getFlowStructure: fn(),
};

jest.mock('@/modules/bot-config/bot-config.service', () => ({
  botConfigService: botConfigServiceMock,
}));

import { BotConfigController } from '@/modules/bot-config/bot-config.controller';

const controller = new BotConfigController();

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = fn();

beforeEach(() => jest.clearAllMocks());

describe('BotConfigController', () => {
  describe('list', () => {
    it('returns configs', async () => {
      botConfigServiceMock.list.mockResolvedValue([{ key: 'greeting' }]);
      const res = mockRes();

      await controller.list({} as any, res, mockNext);

      expect(res.json).toHaveBeenCalledWith([{ key: 'greeting' }]);
    });

    it('calls next on error', async () => {
      botConfigServiceMock.list.mockRejectedValue(new Error('fail'));

      await controller.list({} as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('update', () => {
    it('upserts config on valid input', async () => {
      botConfigServiceMock.upsert.mockResolvedValue({ key: 'greeting', value: { message: 'Hi' } });
      const req = {
        params: { key: 'greeting' },
        body: { value: 'Hi', description: 'Greeting' },
      } as any;
      const res = mockRes();

      await controller.update(req, res, mockNext);

      expect(botConfigServiceMock.upsert).toHaveBeenCalledWith('greeting', 'Hi', 'Greeting');
      expect(res.json).toHaveBeenCalled();
    });

    it('throws ValidationError on invalid input', async () => {
      const req = {
        params: { key: '' },
        body: { value: '' },
      } as any;

      await controller.update(req, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 }),
      );
    });

    it('calls next on service error', async () => {
      botConfigServiceMock.upsert.mockRejectedValue(new Error('fail'));
      const req = {
        params: { key: 'greeting' },
        body: { value: 'Hi' },
      } as any;

      await controller.update(req, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getFlows', () => {
    it('returns flow structure', async () => {
      botConfigServiceMock.getFlowStructure.mockReturnValue({ nodes: [], edges: [] });
      const res = mockRes();

      await controller.getFlows({} as any, res, mockNext);

      expect(res.json).toHaveBeenCalledWith({ nodes: [], edges: [] });
    });

    it('calls next on error', async () => {
      botConfigServiceMock.getFlowStructure.mockImplementation(() => {
        throw new Error('fail');
      });

      await controller.getFlows({} as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
