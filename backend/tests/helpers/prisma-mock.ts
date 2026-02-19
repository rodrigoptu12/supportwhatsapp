/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

export const prismaMock = {
  conversation: {
    findUnique: fn(),
    findFirst: fn(),
    findMany: fn(),
    create: fn(),
    update: fn(),
    count: fn(),
  },
  conversationTransfer: {
    create: fn(),
  },
  user: {
    findUnique: fn(),
    findMany: fn(),
    create: fn(),
    update: fn(),
    count: fn(),
  },
  message: {
    findMany: fn(),
    create: fn(),
    update: fn(),
    updateMany: fn(),
    count: fn(),
  },
  customer: {
    findUnique: fn(),
    create: fn(),
  },
  department: {
    findMany: fn(),
    findUnique: fn(),
    create: fn(),
    update: fn(),
    delete: fn(),
  },
  userDepartment: {
    findMany: fn(),
    create: fn(),
    deleteMany: fn(),
  },
  botConfiguration: {
    findMany: fn(),
    findUnique: fn(),
    upsert: fn(),
  },
  $transaction: fn().mockImplementation(async (args: any) => {
    if (Array.isArray(args)) {
      return Promise.all(args);
    }
    return args(prismaMock);
  }),
};

jest.mock('@/shared/database/prisma.client', () => ({
  prisma: prismaMock,
}));

jest.mock('@/modules/whatsapp/whatsapp.service', () => ({
  whatsappService: {
    sendMessage: fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/modules/messages/messages.service', () => ({
  messagesService: {
    create: fn().mockResolvedValue(undefined),
  },
}));
