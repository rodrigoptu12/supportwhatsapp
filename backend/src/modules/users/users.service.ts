import { prisma } from '../../shared/database/prisma.client';
import { NotFoundError } from '../../shared/utils/errors';
import { redis } from '../../config/redis';

export class UsersService {
  async list(page: number, limit: number) {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { fullName: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  async update(id: string, data: { fullName?: string; avatarUrl?: string }) {
    await this.getById(id);

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        isActive: true,
      },
    });
  }

  async getOnlineUsers() {
    const onlineIds = await redis.smembers('online:attendants');

    if (onlineIds.length === 0) return [];

    return prisma.user.findMany({
      where: { id: { in: onlineIds } },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        role: true,
      },
    });
  }

  async getDepartments(userId: string) {
    await this.getById(userId);

    const userDepartments = await prisma.userDepartment.findMany({
      where: { userId },
      include: {
        department: true,
      },
    });

    return userDepartments.map((ud) => ud.department);
  }

  async setDepartments(userId: string, departmentIds: string[]) {
    await this.getById(userId);

    // Remove existing associations and create new ones
    await prisma.$transaction([
      prisma.userDepartment.deleteMany({ where: { userId } }),
      ...departmentIds.map((departmentId) =>
        prisma.userDepartment.create({
          data: { userId, departmentId },
        }),
      ),
    ]);

    return this.getDepartments(userId);
  }
}

export const usersService = new UsersService();
