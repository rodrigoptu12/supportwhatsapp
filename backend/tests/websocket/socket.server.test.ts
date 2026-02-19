/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

const redisMock = {
  set: fn().mockResolvedValue('OK'),
  get: fn(),
  sadd: fn().mockResolvedValue(1),
  smembers: fn(),
};

const prismaMock = {
  userDepartment: { findMany: fn() },
  user: { findUnique: fn() },
};

const jwtMock = {
  verify: fn(),
};

jest.mock('jsonwebtoken', () => ({ default: jwtMock, ...jwtMock }));
jest.mock('@/config/env', () => ({
  env: { JWT_SECRET: 'test-secret-long-enough-32chars!', FRONTEND_URL: 'http://localhost:5173' },
}));
jest.mock('@/config/redis', () => ({ redis: redisMock }));
jest.mock('@/shared/database/prisma.client', () => ({ prisma: prismaMock }));
jest.mock('@/shared/utils/logger', () => ({
  logger: { info: fn(), error: fn(), warn: fn(), debug: fn() },
}));
jest.mock('@/websocket/socket.handlers', () => ({
  registerSocketHandlers: fn(),
}));

// Mock socket.io
const mockToEmit = fn();
const mockTo = fn().mockReturnValue({ emit: mockToEmit });
const mockOn = fn();
const mockUse = fn();
const mockJoin = fn();

jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    use: mockUse,
    on: mockOn,
    to: mockTo,
  })),
}));

import { SocketServer, initSocketServer } from '@/websocket/socket.server';
import http from 'http';

describe('SocketServer', () => {
  let server: SocketServer;

  beforeEach(() => {
    jest.clearAllMocks();
    const httpServer = http.createServer();
    server = new SocketServer(httpServer);
  });

  it('creates instance with socket.io setup', () => {
    expect(server).toBeDefined();
    // setupMiddleware and setupHandlers called in constructor
    expect(mockUse).toHaveBeenCalled();
    expect(mockOn).toHaveBeenCalledWith('connection', expect.any(Function));
  });

  it('emitNewMessage emits to conversation room', () => {
    server.emitNewMessage('conv-1', { id: 'msg-1' });

    expect(mockTo).toHaveBeenCalledWith('conversation:conv-1');
    expect(mockToEmit).toHaveBeenCalledWith('new_message', { id: 'msg-1' });
  });

  it('emitConversationUpdate emits to conversation room', () => {
    server.emitConversationUpdate('conv-1', { status: 'closed' });

    expect(mockTo).toHaveBeenCalledWith('conversation:conv-1');
    expect(mockToEmit).toHaveBeenCalledWith('conversation_update', { status: 'closed' });
  });

  it('notifyUser emits to user socket when online', async () => {
    redisMock.get.mockResolvedValue('socket-id-123');

    await server.notifyUser('user-1', 'event', { data: 'test' });

    expect(redisMock.get).toHaveBeenCalledWith('socket:user:user-1');
    expect(mockTo).toHaveBeenCalledWith('socket-id-123');
    expect(mockToEmit).toHaveBeenCalledWith('event', { data: 'test' });
  });

  it('notifyUser does nothing when user is offline', async () => {
    redisMock.get.mockResolvedValue(null);
    mockTo.mockClear();

    await server.notifyUser('user-1', 'event', { data: 'test' });

    expect(mockTo).not.toHaveBeenCalled();
  });

  it('broadcastToAttendants notifies all online attendants', async () => {
    redisMock.smembers.mockResolvedValue(['user-1', 'user-2']);
    redisMock.get.mockResolvedValue('socket-id');

    await server.broadcastToAttendants('event', { data: 'test' });

    expect(redisMock.smembers).toHaveBeenCalledWith('online:attendants');
    expect(redisMock.get).toHaveBeenCalledTimes(2);
  });

  it('notifyDepartment notifies only online attendants in department', async () => {
    redisMock.smembers
      .mockResolvedValueOnce(['user-1', 'user-2', 'user-3']) // online:attendants
      .mockResolvedValueOnce(['user-1', 'user-3', 'user-4']); // department attendants
    redisMock.get.mockResolvedValue('socket-id');

    await server.notifyDepartment('dept-1', 'event', { data: 'test' });

    // Only user-1 and user-3 are both online and in department
    expect(redisMock.get).toHaveBeenCalledTimes(2);
  });

  describe('middleware', () => {
    it('validates token in socket handshake', () => {
      const middlewareFn = mockUse.mock.calls[0][0];
      const mockSocket = {
        handshake: { auth: { token: 'valid-token' } },
        data: {} as any,
      };
      const next = fn();

      jwtMock.verify.mockReturnValue({ userId: 'user-1' });
      middlewareFn(mockSocket, next);

      expect(mockSocket.data.userId).toBe('user-1');
      expect(next).toHaveBeenCalledWith();
    });

    it('rejects when no token', () => {
      const middlewareFn = mockUse.mock.calls[0][0];
      const mockSocket = { handshake: { auth: {} }, data: {} };
      const next = fn();

      middlewareFn(mockSocket, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('rejects on invalid token', () => {
      const middlewareFn = mockUse.mock.calls[0][0];
      const mockSocket = { handshake: { auth: { token: 'bad' } }, data: {} };
      const next = fn();

      jwtMock.verify.mockImplementation(() => { throw new Error('invalid'); });
      middlewareFn(mockSocket, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('connection handler', () => {
    it('sets up user on connection', async () => {
      const connectionHandler = mockOn.mock.calls[0][1];
      const mockSocket = {
        data: { userId: 'user-1' },
        id: 'socket-id-1',
        join: fn(),
      };
      prismaMock.userDepartment.findMany.mockResolvedValue([{ departmentId: 'dept-1' }]);
      prismaMock.user.findUnique.mockResolvedValue({ fullName: 'Agent', role: 'attendant' });
      redisMock.smembers.mockResolvedValue([]);
      redisMock.get.mockResolvedValue(null);

      await connectionHandler(mockSocket);

      expect(redisMock.set).toHaveBeenCalledWith('socket:user:user-1', 'socket-id-1');
      expect(redisMock.sadd).toHaveBeenCalledWith('online:attendants', 'user-1');
      expect(mockSocket.join).toHaveBeenCalledWith('user:user-1');
    });

    it('handles connection when user not found in DB', async () => {
      const connectionHandler = mockOn.mock.calls[0][1];
      const mockSocket = {
        data: { userId: 'user-1' },
        id: 'socket-id-1',
        join: fn(),
      };
      prismaMock.userDepartment.findMany.mockResolvedValue([]);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await connectionHandler(mockSocket);

      expect(redisMock.set).toHaveBeenCalled();
    });
  });
});

describe('initSocketServer', () => {
  it('creates and returns SocketServer instance', () => {
    const httpServer = http.createServer();
    const result = initSocketServer(httpServer);

    expect(result).toBeInstanceOf(SocketServer);
  });
});
