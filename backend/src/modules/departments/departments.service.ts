import { prisma } from '../../shared/database/prisma.client';
import { NotFoundError } from '../../shared/utils/errors';
import { CreateDepartmentDTO, UpdateDepartmentDTO } from './departments.types';

export class DepartmentsService {
  async list() {
    return prisma.department.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { users: true, conversations: true } },
      },
    });
  }

  async listActive() {
    return prisma.department.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async getById(id: string) {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, role: true, avatarUrl: true },
            },
          },
        },
        _count: { select: { conversations: true } },
      },
    });

    if (!department) {
      throw new NotFoundError('Department');
    }

    return department;
  }

  async create(data: CreateDepartmentDTO) {
    return prisma.department.create({ data });
  }

  async update(id: string, data: UpdateDepartmentDTO) {
    await this.getById(id);
    return prisma.department.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.getById(id);
    return prisma.department.delete({ where: { id } });
  }

  async getAttendants(departmentId: string) {
    const userDepartments = await prisma.userDepartment.findMany({
      where: { departmentId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true, avatarUrl: true, isActive: true },
        },
      },
    });

    return userDepartments.map((ud) => ud.user);
  }
}

export const departmentsService = new DepartmentsService();
