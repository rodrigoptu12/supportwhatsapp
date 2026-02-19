/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

const departmentsServiceMock = {
  list: fn(),
  getById: fn(),
  create: fn(),
  update: fn(),
  delete: fn(),
  getAttendants: fn(),
};

jest.mock('@/modules/departments/departments.service', () => ({
  departmentsService: departmentsServiceMock,
}));

import { DepartmentsController } from '@/modules/departments/departments.controller';

const controller = new DepartmentsController();

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = fn();

beforeEach(() => jest.clearAllMocks());

describe('DepartmentsController', () => {
  describe('list', () => {
    it('returns departments', async () => {
      departmentsServiceMock.list.mockResolvedValue([{ id: 'd1' }]);
      const res = mockRes();

      await controller.list({} as any, res, mockNext);

      expect(res.json).toHaveBeenCalledWith([{ id: 'd1' }]);
    });

    it('calls next on error', async () => {
      departmentsServiceMock.list.mockRejectedValue(new Error('fail'));

      await controller.list({} as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getById', () => {
    it('returns department', async () => {
      departmentsServiceMock.getById.mockResolvedValue({ id: 'd1' });
      const res = mockRes();

      await controller.getById({ params: { id: 'd1' } } as any, res, mockNext);

      expect(res.json).toHaveBeenCalledWith({ id: 'd1' });
    });

    it('calls next on error', async () => {
      departmentsServiceMock.getById.mockRejectedValue(new Error('fail'));

      await controller.getById({ params: { id: 'x' } } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('create', () => {
    it('returns 201 with created department', async () => {
      departmentsServiceMock.create.mockResolvedValue({ id: 'd1', name: 'New' });
      const res = mockRes();

      await controller.create({ body: { name: 'New' } } as any, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 'd1', name: 'New' });
    });

    it('calls next on error', async () => {
      departmentsServiceMock.create.mockRejectedValue(new Error('fail'));

      await controller.create({ body: {} } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('update', () => {
    it('returns updated department', async () => {
      departmentsServiceMock.update.mockResolvedValue({ id: 'd1', name: 'Updated' });
      const res = mockRes();

      await controller.update({ params: { id: 'd1' }, body: { name: 'Updated' } } as any, res, mockNext);

      expect(res.json).toHaveBeenCalledWith({ id: 'd1', name: 'Updated' });
    });

    it('calls next on error', async () => {
      departmentsServiceMock.update.mockRejectedValue(new Error('fail'));

      await controller.update({ params: { id: 'x' }, body: {} } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('delete', () => {
    it('returns 204 on success', async () => {
      departmentsServiceMock.delete.mockResolvedValue({});
      const res = mockRes();

      await controller.delete({ params: { id: 'd1' } } as any, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('calls next on error', async () => {
      departmentsServiceMock.delete.mockRejectedValue(new Error('fail'));

      await controller.delete({ params: { id: 'x' } } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getAttendants', () => {
    it('returns attendants', async () => {
      departmentsServiceMock.getAttendants.mockResolvedValue([{ id: 'u1' }]);
      const res = mockRes();

      await controller.getAttendants({ params: { id: 'd1' } } as any, res, mockNext);

      expect(res.json).toHaveBeenCalledWith([{ id: 'u1' }]);
    });

    it('calls next on error', async () => {
      departmentsServiceMock.getAttendants.mockRejectedValue(new Error('fail'));

      await controller.getAttendants({ params: { id: 'x' } } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
