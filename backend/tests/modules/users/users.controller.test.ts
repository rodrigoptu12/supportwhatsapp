/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

const usersServiceMock = {
  list: fn(),
  getById: fn(),
  update: fn(),
  getOnlineUsers: fn(),
  getDepartments: fn(),
  setDepartments: fn(),
};

jest.mock('@/modules/users/users.service', () => ({
  usersService: usersServiceMock,
}));

import { UsersController } from '@/modules/users/users.controller';

const controller = new UsersController();

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = fn();

beforeEach(() => jest.clearAllMocks());

describe('UsersController', () => {
  describe('list', () => {
    it('returns paginated users with defaults', async () => {
      usersServiceMock.list.mockResolvedValue({ data: [], pagination: {} });
      const req = { query: {} } as any;
      const res = mockRes();

      await controller.list(req, res, mockNext);

      expect(usersServiceMock.list).toHaveBeenCalledWith(1, 20);
      expect(res.json).toHaveBeenCalled();
    });

    it('parses page and limit from query', async () => {
      usersServiceMock.list.mockResolvedValue({ data: [], pagination: {} });
      const req = { query: { page: '2', limit: '10' } } as any;
      const res = mockRes();

      await controller.list(req, res, mockNext);

      expect(usersServiceMock.list).toHaveBeenCalledWith(2, 10);
    });

    it('calls next on error', async () => {
      usersServiceMock.list.mockRejectedValue(new Error('fail'));

      await controller.list({ query: {} } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getById', () => {
    it('returns user', async () => {
      usersServiceMock.getById.mockResolvedValue({ id: 'u1' });
      const req = { params: { id: 'u1' } } as any;
      const res = mockRes();

      await controller.getById(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith({ id: 'u1' });
    });

    it('calls next on error', async () => {
      usersServiceMock.getById.mockRejectedValue(new Error('fail'));

      await controller.getById({ params: { id: 'x' } } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('update', () => {
    it('returns updated user', async () => {
      usersServiceMock.update.mockResolvedValue({ id: 'u1', fullName: 'New' });
      const req = { params: { id: 'u1' }, body: { fullName: 'New' } } as any;
      const res = mockRes();

      await controller.update(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith({ id: 'u1', fullName: 'New' });
    });

    it('calls next on error', async () => {
      usersServiceMock.update.mockRejectedValue(new Error('fail'));

      await controller.update({ params: { id: 'x' }, body: {} } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('online', () => {
    it('returns online users', async () => {
      usersServiceMock.getOnlineUsers.mockResolvedValue([]);
      const res = mockRes();

      await controller.online({} as any, res, mockNext);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('calls next on error', async () => {
      usersServiceMock.getOnlineUsers.mockRejectedValue(new Error('fail'));

      await controller.online({} as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getDepartments', () => {
    it('returns departments', async () => {
      usersServiceMock.getDepartments.mockResolvedValue([{ id: 'd1' }]);
      const req = { params: { id: 'u1' } } as any;
      const res = mockRes();

      await controller.getDepartments(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith([{ id: 'd1' }]);
    });

    it('calls next on error', async () => {
      usersServiceMock.getDepartments.mockRejectedValue(new Error('fail'));

      await controller.getDepartments({ params: { id: 'x' } } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('setDepartments', () => {
    it('returns updated departments', async () => {
      usersServiceMock.setDepartments.mockResolvedValue([{ id: 'd2' }]);
      const req = { params: { id: 'u1' }, body: { departmentIds: ['d2'] } } as any;
      const res = mockRes();

      await controller.setDepartments(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith([{ id: 'd2' }]);
    });

    it('calls next on error', async () => {
      usersServiceMock.setDepartments.mockRejectedValue(new Error('fail'));

      await controller.setDepartments({ params: { id: 'x' }, body: {} } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
