import { prismaMock } from '../../helpers/prisma-mock';
import { DepartmentsService } from '@/modules/departments/departments.service';

const service = new DepartmentsService();

beforeEach(() => {
  jest.clearAllMocks();
});

const fakeDepartment = {
  id: 'dept-1',
  name: 'Sales',
  description: 'Sales team',
  isActive: true,
  order: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('DepartmentsService', () => {
  describe('list', () => {
    it('returns departments with _count', async () => {
      const withCount = { ...fakeDepartment, _count: { users: 3, conversations: 5 } };
      prismaMock.department.findMany.mockResolvedValue([withCount]);

      const result = await service.list();

      expect(result).toEqual([withCount]);
      expect(prismaMock.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { _count: { select: { users: true, conversations: true } } },
        }),
      );
    });
  });

  describe('listActive', () => {
    it('returns only active departments', async () => {
      prismaMock.department.findMany.mockResolvedValue([fakeDepartment]);

      const result = await service.listActive();

      expect(result).toEqual([fakeDepartment]);
      expect(prismaMock.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );
    });
  });

  describe('getById', () => {
    it('returns department when found', async () => {
      prismaMock.department.findUnique.mockResolvedValue(fakeDepartment);

      const result = await service.getById('dept-1');

      expect(result).toEqual(fakeDepartment);
    });

    it('throws NotFoundError when not found', async () => {
      prismaMock.department.findUnique.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow('Department not found');
    });
  });

  describe('create', () => {
    it('creates and returns department', async () => {
      prismaMock.department.create.mockResolvedValue(fakeDepartment);

      const result = await service.create({ name: 'Sales', description: 'Sales team' });

      expect(result).toEqual(fakeDepartment);
    });
  });

  describe('update', () => {
    it('updates and returns department', async () => {
      prismaMock.department.findUnique.mockResolvedValue(fakeDepartment);
      const updated = { ...fakeDepartment, name: 'Marketing' };
      prismaMock.department.update.mockResolvedValue(updated);

      const result = await service.update('dept-1', { name: 'Marketing' });

      expect(result.name).toBe('Marketing');
    });

    it('throws NotFoundError when department does not exist', async () => {
      prismaMock.department.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', { name: 'X' })).rejects.toThrow('Department not found');
    });
  });

  describe('delete', () => {
    it('deletes department', async () => {
      prismaMock.department.findUnique.mockResolvedValue(fakeDepartment);
      prismaMock.department.delete.mockResolvedValue(fakeDepartment);

      const result = await service.delete('dept-1');

      expect(result).toEqual(fakeDepartment);
    });

    it('throws NotFoundError when department does not exist', async () => {
      prismaMock.department.findUnique.mockResolvedValue(null);

      await expect(service.delete('missing')).rejects.toThrow('Department not found');
    });
  });

  describe('getAttendants', () => {
    it('returns users from department', async () => {
      const user = { id: 'u1', fullName: 'Agent', email: 'a@a.com', role: 'attendant', avatarUrl: null, isActive: true };
      prismaMock.userDepartment.findMany.mockResolvedValue([
        { departmentId: 'dept-1', userId: 'u1', user },
      ]);

      const result = await service.getAttendants('dept-1');

      expect(result).toEqual([user]);
    });
  });
});
