/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

const conversationsServiceMock = {
  list: fn(),
  getById: fn(),
  takeover: fn(),
  transfer: fn(),
  close: fn(),
  getStats: fn(),
};

const prismaMock = {
  userDepartment: { findMany: fn() },
};

jest.mock('@/modules/conversations/conversations.service', () => ({
  conversationsService: conversationsServiceMock,
}));
jest.mock('@/shared/database/prisma.client', () => ({ prisma: prismaMock }));

import { ConversationsController } from '@/modules/conversations/conversations.controller';

const controller = new ConversationsController();

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = fn();

beforeEach(() => jest.clearAllMocks());

describe('ConversationsController', () => {
  describe('list', () => {
    it('lists conversations for admin (no department filter)', async () => {
      conversationsServiceMock.list.mockResolvedValue({ data: [], pagination: {} });
      const req = {
        query: { status: 'open', page: '1', limit: '20' },
        user: { userId: 'u1', role: 'admin', email: 'a@a.com' },
      } as any;
      const res = mockRes();

      await controller.list(req, res, mockNext);

      expect(conversationsServiceMock.list).toHaveBeenCalledWith(
        expect.objectContaining({ userDepartmentIds: undefined }),
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('lists conversations for non-admin with department filter', async () => {
      prismaMock.userDepartment.findMany.mockResolvedValue([{ departmentId: 'd1' }]);
      conversationsServiceMock.list.mockResolvedValue({ data: [], pagination: {} });
      const req = {
        query: {},
        user: { userId: 'u1', role: 'attendant', email: 'a@a.com' },
      } as any;
      const res = mockRes();

      await controller.list(req, res, mockNext);

      expect(conversationsServiceMock.list).toHaveBeenCalledWith(
        expect.objectContaining({ userDepartmentIds: ['d1'], userId: 'u1' }),
      );
    });

    it('calls next on error', async () => {
      conversationsServiceMock.list.mockRejectedValue(new Error('fail'));
      const req = { query: {}, user: { userId: 'u1', role: 'admin', email: 'a@a.com' } } as any;

      await controller.list(req, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getById', () => {
    it('returns conversation', async () => {
      conversationsServiceMock.getById.mockResolvedValue({ id: 'c1' });
      const res = mockRes();

      await controller.getById({ params: { id: 'c1' } } as any, res, mockNext);

      expect(res.json).toHaveBeenCalledWith({ id: 'c1' });
    });

    it('calls next on error', async () => {
      conversationsServiceMock.getById.mockRejectedValue(new Error('fail'));

      await controller.getById({ params: { id: 'x' } } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('takeover', () => {
    it('returns result', async () => {
      conversationsServiceMock.takeover.mockResolvedValue({ id: 'c1' });
      const req = { params: { id: 'c1' }, user: { userId: 'u1' } } as any;
      const res = mockRes();

      await controller.takeover(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith({ id: 'c1' });
    });

    it('calls next on error', async () => {
      conversationsServiceMock.takeover.mockRejectedValue(new Error('fail'));

      await controller.takeover({ params: { id: 'x' }, user: { userId: 'u1' } } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('transfer', () => {
    it('returns result', async () => {
      conversationsServiceMock.transfer.mockResolvedValue({ id: 'c1' });
      const req = { params: { id: 'c1' }, user: { userId: 'u1' }, body: { toUserId: 'u2', reason: 'test' } } as any;
      const res = mockRes();

      await controller.transfer(req, res, mockNext);

      expect(conversationsServiceMock.transfer).toHaveBeenCalledWith('c1', 'u1', 'u2', 'test');
    });

    it('calls next on error', async () => {
      conversationsServiceMock.transfer.mockRejectedValue(new Error('fail'));

      await controller.transfer({ params: { id: 'x' }, user: { userId: 'u1' }, body: {} } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('close', () => {
    it('returns result', async () => {
      conversationsServiceMock.close.mockResolvedValue({ id: 'c1', status: 'closed' });
      const res = mockRes();

      await controller.close({ params: { id: 'c1' } } as any, res, mockNext);

      expect(res.json).toHaveBeenCalledWith({ id: 'c1', status: 'closed' });
    });

    it('calls next on error', async () => {
      conversationsServiceMock.close.mockRejectedValue(new Error('fail'));

      await controller.close({ params: { id: 'x' } } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('stats', () => {
    it('returns stats', async () => {
      conversationsServiceMock.getStats.mockResolvedValue({ open: 5, closed: 10 });
      const res = mockRes();

      await controller.stats({} as any, res, mockNext);

      expect(res.json).toHaveBeenCalledWith({ open: 5, closed: 10 });
    });

    it('calls next on error', async () => {
      conversationsServiceMock.getStats.mockRejectedValue(new Error('fail'));

      await controller.stats({} as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
