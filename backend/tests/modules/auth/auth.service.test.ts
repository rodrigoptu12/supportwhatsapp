/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

const prismaMock = {
  user: {
    findUnique: fn(),
    create: fn(),
    update: fn(),
  },
};

const bcryptMock = {
  compare: fn(),
  hash: fn(),
};

const jwtMock = {
  sign: fn(),
  verify: fn(),
};

jest.mock('@/shared/database/prisma.client', () => ({ prisma: prismaMock }));
jest.mock('bcrypt', () => bcryptMock);
jest.mock('jsonwebtoken', () => ({ default: jwtMock, ...jwtMock }));
jest.mock('@/config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-that-is-long-enough-32',
    JWT_REFRESH_SECRET: 'test-refresh-secret-long-enough-32',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    BCRYPT_ROUNDS: 10,
  },
}));

import { AuthService } from '@/modules/auth/auth.service';

const service = new AuthService();

beforeEach(() => {
  jest.clearAllMocks();
});

const fakeUser = {
  id: 'user-1',
  email: 'test@test.com',
  fullName: 'Test User',
  role: 'admin',
  passwordHash: 'hashed-password',
  avatarUrl: null,
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date(),
};

describe('AuthService', () => {
  describe('login', () => {
    it('returns user and tokens on valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser);
      bcryptMock.compare.mockResolvedValue(true);
      jwtMock.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      prismaMock.user.update.mockResolvedValue(fakeUser);

      const result = await service.login({ email: 'test@test.com', password: 'password123' });

      expect(result.user.email).toBe('test@test.com');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('throws when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'x@x.com', password: 'p' })).rejects.toThrow('Invalid credentials');
    });

    it('throws when user is inactive', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...fakeUser, isActive: false });

      await expect(service.login({ email: 'test@test.com', password: 'p' })).rejects.toThrow('Invalid credentials');
    });

    it('throws when password is wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser);
      bcryptMock.compare.mockResolvedValue(false);

      await expect(service.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('creates user and returns info', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue('hashed');
      prismaMock.user.create.mockResolvedValue(fakeUser);

      const result = await service.register({
        email: 'new@test.com',
        password: 'password123',
        fullName: 'New User',
        role: 'attendant',
      });

      expect(result.email).toBe('test@test.com');
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ passwordHash: 'hashed' }),
      });
    });

    it('throws when email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser);

      await expect(
        service.register({ email: 'test@test.com', password: 'p', fullName: 'X', role: 'attendant' }),
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('refreshToken', () => {
    it('returns new access token with valid refresh token', async () => {
      jwtMock.verify.mockReturnValue({ userId: 'user-1', email: 'test@test.com', role: 'admin' });
      prismaMock.user.findUnique.mockResolvedValue(fakeUser);
      jwtMock.sign.mockReturnValue('new-access-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
    });

    it('throws when token is invalid', async () => {
      jwtMock.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refreshToken('bad-token')).rejects.toThrow('Invalid or expired token');
    });

    it('throws when user is inactive', async () => {
      jwtMock.verify.mockReturnValue({ userId: 'user-1', email: 'test@test.com', role: 'admin' });
      prismaMock.user.findUnique.mockResolvedValue({ ...fakeUser, isActive: false });

      await expect(service.refreshToken('valid-token')).rejects.toThrow('Invalid or expired token');
    });

    it('throws when user not found', async () => {
      jwtMock.verify.mockReturnValue({ userId: 'missing', email: 'x@x.com', role: 'admin' });
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('valid-token')).rejects.toThrow('Invalid or expired token');
    });
  });

  describe('getMe', () => {
    it('returns user when found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser);

      const result = await service.getMe('user-1');

      expect(result).toEqual(fakeUser);
    });

    it('throws when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe('missing')).rejects.toThrow('User not found');
    });
  });
});
