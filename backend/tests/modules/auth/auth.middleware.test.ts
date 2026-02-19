/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

const jwtMock = {
  verify: fn(),
  JsonWebTokenError: class JsonWebTokenError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'JsonWebTokenError';
    }
  },
  TokenExpiredError: class TokenExpiredError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'TokenExpiredError';
    }
  },
};

jest.mock('jsonwebtoken', () => ({ default: jwtMock, ...jwtMock }));
jest.mock('@/config/env', () => ({
  env: { JWT_SECRET: 'test-secret-that-is-long-enough-32' },
}));

import { authMiddleware, authorize } from '@/modules/auth/auth.middleware';
import { AppError } from '@/shared/utils/errors';

const mockReq = (overrides: any = {}) => ({
  headers: {},
  ...overrides,
});

const mockRes = () => ({} as any);

const mockNext = fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authMiddleware', () => {
  it('throws when no authorization header', () => {
    const req = mockReq();

    authMiddleware(req as any, mockRes(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('throws when header does not start with Bearer', () => {
    const req = mockReq({ headers: { authorization: 'Basic xyz' } });

    authMiddleware(req as any, mockRes(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('calls next with decoded user on valid token', () => {
    const decoded = { userId: 'u1', email: 'a@a.com', role: 'admin' };
    jwtMock.verify.mockReturnValue(decoded);
    const req = mockReq({ headers: { authorization: 'Bearer valid-token' } });

    authMiddleware(req as any, mockRes(), mockNext);

    expect((req as any).user).toEqual(decoded);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('calls next with error on JsonWebTokenError', () => {
    jwtMock.verify.mockImplementation(() => {
      throw new jwtMock.JsonWebTokenError('invalid');
    });
    const req = mockReq({ headers: { authorization: 'Bearer bad' } });

    authMiddleware(req as any, mockRes(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid token' }));
  });

  it('calls next with error on TokenExpiredError', () => {
    jwtMock.verify.mockImplementation(() => {
      throw new jwtMock.TokenExpiredError('expired');
    });
    const req = mockReq({ headers: { authorization: 'Bearer expired' } });

    authMiddleware(req as any, mockRes(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Token expired' }));
  });
});

describe('authorize', () => {
  it('calls next with error when no user on request', () => {
    const middleware = authorize('admin');
    const req = mockReq();

    middleware(req as any, mockRes(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Not authenticated' }));
  });

  it('calls next with error when role not allowed', () => {
    const middleware = authorize('admin');
    const req = mockReq({ user: { userId: 'u1', email: 'a@a.com', role: 'attendant' } });

    middleware(req as any, mockRes(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Insufficient permissions' }));
  });

  it('calls next when role is allowed', () => {
    const middleware = authorize('admin', 'attendant');
    const req = mockReq({ user: { userId: 'u1', email: 'a@a.com', role: 'admin' } });

    middleware(req as any, mockRes(), mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });
});
