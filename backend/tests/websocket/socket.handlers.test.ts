/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

const redisMock = {
  del: fn(),
  srem: fn(),
};

const prismaMock = {
  userDepartment: { findMany: fn() },
};

jest.mock('@/config/redis', () => ({ redis: redisMock }));
jest.mock('@/shared/database/prisma.client', () => ({ prisma: prismaMock }));
jest.mock('@/shared/utils/logger', () => ({
  logger: { info: fn(), error: fn(), warn: fn(), debug: fn() },
}));

import { registerSocketHandlers } from '@/websocket/socket.handlers';

beforeEach(() => jest.clearAllMocks());

describe('registerSocketHandlers', () => {
  const createMockSocket = () => {
    const handlers: Record<string, (...args: any[]) => any> = {};
    const socket: any = {
      data: { userId: 'user-1' },
      on: jest.fn((event: string, handler: (...args: any[]) => any) => {
        handlers[event] = handler;
      }),
      join: fn(),
      leave: fn(),
      to: fn().mockReturnValue({ emit: fn() }),
      broadcast: { emit: fn() },
    };
    return { socket, handlers };
  };

  it('registers subscribe:conversation handler', () => {
    const { socket, handlers } = createMockSocket();

    registerSocketHandlers(socket);

    handlers['subscribe:conversation']('conv-1');
    expect(socket.join).toHaveBeenCalledWith('conversation:conv-1');
  });

  it('registers unsubscribe:conversation handler', () => {
    const { socket, handlers } = createMockSocket();

    registerSocketHandlers(socket);

    handlers['unsubscribe:conversation']('conv-1');
    expect(socket.leave).toHaveBeenCalledWith('conversation:conv-1');
  });

  it('registers typing handler', () => {
    const { socket, handlers } = createMockSocket();

    registerSocketHandlers(socket);

    handlers['typing']('conv-1');
    expect(socket.to).toHaveBeenCalledWith('conversation:conv-1');
  });

  it('registers disconnect handler that cleans up Redis', async () => {
    const { socket, handlers } = createMockSocket();
    prismaMock.userDepartment.findMany.mockResolvedValue([
      { departmentId: 'dept-1' },
      { departmentId: 'dept-2' },
    ]);

    registerSocketHandlers(socket);

    await handlers['disconnect']();

    expect(redisMock.del).toHaveBeenCalledWith('socket:user:user-1');
    expect(redisMock.srem).toHaveBeenCalledWith('online:attendants', 'user-1');
    expect(redisMock.srem).toHaveBeenCalledWith('department:dept-1:attendants', 'user-1');
    expect(redisMock.srem).toHaveBeenCalledWith('department:dept-2:attendants', 'user-1');
    expect(socket.broadcast.emit).toHaveBeenCalledWith('attendant_offline', { userId: 'user-1' });
  });
});
