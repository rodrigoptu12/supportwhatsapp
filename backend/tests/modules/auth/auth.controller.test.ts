/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

const authServiceMock = {
  login: fn(),
  register: fn(),
  refreshToken: fn(),
  getMe: fn(),
};

jest.mock('@/modules/auth/auth.service', () => ({
  authService: authServiceMock,
}));

import { AuthController } from '@/modules/auth/auth.controller';

const controller = new AuthController();

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = fn();

beforeEach(() => jest.clearAllMocks());

describe('AuthController', () => {
  describe('login', () => {
    it('returns result on success', async () => {
      const result = { user: {}, accessToken: 'at', refreshToken: 'rt' };
      authServiceMock.login.mockResolvedValue(result);
      const req = { body: { email: 'a@a.com', password: 'p' } } as any;
      const res = mockRes();

      await controller.login(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(result);
    });

    it('calls next on error', async () => {
      authServiceMock.login.mockRejectedValue(new Error('fail'));
      const req = { body: {} } as any;

      await controller.login(req, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('register', () => {
    it('returns 201 on success', async () => {
      const result = { id: 'u1', email: 'a@a.com' };
      authServiceMock.register.mockResolvedValue(result);
      const req = { body: { email: 'a@a.com', password: 'p', fullName: 'X' } } as any;
      const res = mockRes();

      await controller.register(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(result);
    });

    it('calls next on error', async () => {
      authServiceMock.register.mockRejectedValue(new Error('fail'));

      await controller.register({ body: {} } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('refreshToken', () => {
    it('returns new access token', async () => {
      authServiceMock.refreshToken.mockResolvedValue({ accessToken: 'new-at' });
      const req = { body: { refreshToken: 'rt' } } as any;
      const res = mockRes();

      await controller.refreshToken(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith({ accessToken: 'new-at' });
    });

    it('calls next on error', async () => {
      authServiceMock.refreshToken.mockRejectedValue(new Error('fail'));

      await controller.refreshToken({ body: {} } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('me', () => {
    it('returns current user', async () => {
      const user = { id: 'u1', email: 'a@a.com' };
      authServiceMock.getMe.mockResolvedValue(user);
      const req = { user: { userId: 'u1' } } as any;
      const res = mockRes();

      await controller.me(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(user);
    });

    it('calls next on error', async () => {
      authServiceMock.getMe.mockRejectedValue(new Error('fail'));

      await controller.me({ user: { userId: 'u1' } } as any, mockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('logout', () => {
    it('returns success message', async () => {
      const res = mockRes();

      await controller.logout({} as any, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });
});
