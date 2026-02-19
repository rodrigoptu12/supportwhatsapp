/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../helpers/prisma-mock';

jest.mock('@/config/redis', () => ({
  redis: {
    smembers: jest.fn(),
  },
}));

import { UsersService } from '@/modules/users/users.service';
import { redis } from '@/config/redis';

const service = new UsersService();

beforeEach(() => {
  jest.clearAllMocks();
});

const fakeUser = {
  id: 'user-1',
  email: 'test@test.com',
  fullName: 'Test User',
  role: 'admin',
  avatarUrl: null,
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date(),
};

describe('UsersService', () => {
  describe('list', () => {
    it('returns paginated users', async () => {
      prismaMock.user.findMany.mockResolvedValue([fakeUser]);
      prismaMock.user.count.mockResolvedValue(1);

      const result = await service.list(1, 20);

      expect(result.data).toEqual([fakeUser]);
      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    });

    it('calculates correct skip and take', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(25);

      const result = await service.list(3, 10);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.pagination.totalPages).toBe(3);
    });
  });

  describe('getById', () => {
    it('returns user when found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser);

      const result = await service.getById('user-1');

      expect(result).toEqual(fakeUser);
    });

    it('throws NotFoundError when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow('User not found');
    });
  });

  describe('update', () => {
    it('updates and returns user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser);
      const updated = { ...fakeUser, fullName: 'Updated Name' };
      prismaMock.user.update.mockResolvedValue(updated);

      const result = await service.update('user-1', { fullName: 'Updated Name' });

      expect(result.fullName).toBe('Updated Name');
    });

    it('throws NotFoundError when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', { fullName: 'X' })).rejects.toThrow('User not found');
    });
  });

  describe('getOnlineUsers', () => {
    it('returns users by online IDs from Redis', async () => {
      (redis.smembers as jest.Mock).mockResolvedValue(['user-1', 'user-2']);
      prismaMock.user.findMany.mockResolvedValue([fakeUser]);

      const result = await service.getOnlineUsers();

      expect(result).toEqual([fakeUser]);
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['user-1', 'user-2'] } },
        }),
      );
    });

    it('returns empty array when no online IDs', async () => {
      (redis.smembers as jest.Mock).mockResolvedValue([]);

      const result = await service.getOnlineUsers();

      expect(result).toEqual([]);
      expect(prismaMock.user.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getDepartments', () => {
    it('returns departments for user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser);
      const dept = { id: 'dept-1', name: 'Sales' };
      prismaMock.userDepartment.findMany.mockResolvedValue([
        { userId: 'user-1', departmentId: 'dept-1', department: dept },
      ]);

      const result = await service.getDepartments('user-1');

      expect(result).toEqual([dept]);
    });

    it('throws NotFoundError when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.getDepartments('missing')).rejects.toThrow('User not found');
    });
  });

  describe('setDepartments', () => {
    it('replaces departments and returns updated list', async () => {
      // First getById call in setDepartments
      prismaMock.user.findUnique.mockResolvedValue(fakeUser);
      prismaMock.userDepartment.deleteMany.mockResolvedValue({ count: 1 });
      prismaMock.userDepartment.create.mockResolvedValue({});
      // getDepartments called at end
      const dept = { id: 'dept-2', name: 'Support' };
      prismaMock.userDepartment.findMany.mockResolvedValue([
        { userId: 'user-1', departmentId: 'dept-2', department: dept },
      ]);

      const result = await service.setDepartments('user-1', ['dept-2']);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result).toEqual([dept]);
    });
  });
});
