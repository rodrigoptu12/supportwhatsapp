/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';

const fn = () => jest.fn<(...args: any[]) => any>();

const prismaMock = {
  conversation: { update: fn() },
  department: { findMany: fn() },
};

const botConfigServiceMock = {
  getAll: fn(),
};

jest.mock('@/shared/database/prisma.client', () => ({ prisma: prismaMock }));
jest.mock('@/modules/bot-config/bot-config.service', () => ({
  botConfigService: botConfigServiceMock,
}));
jest.mock('@/shared/utils/logger', () => ({
  logger: { info: fn(), error: fn(), warn: fn(), debug: fn() },
}));

import { BotService } from '@/modules/bot/bot.service';

const service = new BotService();

beforeEach(() => {
  jest.clearAllMocks();
});

const fakeConversation = (overrides: any = {}) => ({
  id: 'conv-1',
  customerId: 'cust-1',
  status: 'open',
  isBotActive: true,
  currentMenuLevel: 'main',
  assignedUserId: null,
  departmentId: null,
  needsHumanAttention: false,
  createdAt: new Date(),
  lastMessageAt: new Date(),
  endedAt: null,
  ...overrides,
});

const defaultConfigs: Record<string, string> = {
  greeting: 'Ola! Bem-vindo.',
  main_menu_options: '1. Falar com um setor',
  main_menu_prompt: 'Digite o numero:',
  department_menu_header: 'Escolha o setor:',
  department_menu_prompt: 'Digite o numero:',
  department_transfer: 'Voce sera atendido pelo setor *{department}*.',
  no_departments: 'Sem setores disponiveis.',
  error_message: 'Erro, transferindo...',
};

describe('BotService', () => {
  describe('processMessage', () => {
    it('returns main menu greeting for first message', async () => {
      botConfigServiceMock.getAll.mockResolvedValue(defaultConfigs);
      prismaMock.conversation.update.mockResolvedValue({});

      const result = await service.processMessage(fakeConversation() as any, 'oi');

      expect(result!.message).toContain('Ola! Bem-vindo.');
      expect(result!.message).toContain('1. Falar com um setor');
    });

    it('builds department menu when user selects option 1', async () => {
      botConfigServiceMock.getAll.mockResolvedValue(defaultConfigs);
      prismaMock.department.findMany.mockResolvedValue([
        { id: 'dept-1', name: 'Vendas', isActive: true, order: 1 },
        { id: 'dept-2', name: 'Suporte', isActive: true, order: 2 },
      ]);
      prismaMock.conversation.update.mockResolvedValue({});

      const result = await service.processMessage(fakeConversation() as any, '1');

      expect(result!.message).toContain('Escolha o setor:');
      expect(result!.message).toContain('1. Vendas');
      expect(result!.message).toContain('2. Suporte');
      expect(result!.nextMenuLevel).toBe('department_selection');
    });

    it('handles valid department selection', async () => {
      botConfigServiceMock.getAll.mockResolvedValue(defaultConfigs);
      prismaMock.department.findMany.mockResolvedValue([
        { id: 'dept-1', name: 'Vendas', isActive: true, order: 1 },
      ]);
      prismaMock.conversation.update.mockResolvedValue({});

      const result = await service.processMessage(
        fakeConversation({ currentMenuLevel: 'department_selection' }) as any,
        '1',
      );

      expect(result!.message).toContain('Vendas');
      expect(result!.needsHuman).toBe(true);
      expect(result!.departmentId).toBe('dept-1');
    });

    it('rebuilds department menu on invalid selection (NaN)', async () => {
      botConfigServiceMock.getAll.mockResolvedValue(defaultConfigs);
      prismaMock.department.findMany.mockResolvedValue([
        { id: 'dept-1', name: 'Vendas', isActive: true, order: 1 },
      ]);
      prismaMock.conversation.update.mockResolvedValue({});

      const result = await service.processMessage(
        fakeConversation({ currentMenuLevel: 'department_selection' }) as any,
        'abc',
      );

      expect(result!.message).toContain('Escolha o setor:');
    });

    it('rebuilds department menu when selection out of range', async () => {
      botConfigServiceMock.getAll.mockResolvedValue(defaultConfigs);
      prismaMock.department.findMany.mockResolvedValue([
        { id: 'dept-1', name: 'Vendas', isActive: true, order: 1 },
      ]);
      prismaMock.conversation.update.mockResolvedValue({});

      const result = await service.processMessage(
        fakeConversation({ currentMenuLevel: 'department_selection' }) as any,
        '99',
      );

      expect(result!.message).toContain('Escolha o setor:');
    });

    it('returns no_departments message when no active departments', async () => {
      botConfigServiceMock.getAll.mockResolvedValue(defaultConfigs);
      prismaMock.department.findMany.mockResolvedValue([]);
      prismaMock.conversation.update.mockResolvedValue({});

      const result = await service.processMessage(fakeConversation() as any, '1');

      expect(result!.message).toContain('Sem setores');
      expect(result!.needsHuman).toBe(true);
    });

    it('falls back to main menu for unknown menuLevel', async () => {
      botConfigServiceMock.getAll.mockResolvedValue(defaultConfigs);
      prismaMock.conversation.update.mockResolvedValue({});

      const result = await service.processMessage(
        fakeConversation({ currentMenuLevel: 'unknown_level' }) as any,
        'oi',
      );

      expect(result!.message).toContain('Ola! Bem-vindo.');
    });

    it('returns error message on exception', async () => {
      botConfigServiceMock.getAll.mockResolvedValue(defaultConfigs);
      prismaMock.department.findMany.mockRejectedValue(new Error('DB error'));

      const result = await service.processMessage(fakeConversation() as any, '1');

      expect(result!.message).toContain('Erro');
      expect(result!.needsHuman).toBe(true);
    });

    it('uses fallback error_message when config key is missing', async () => {
      botConfigServiceMock.getAll.mockResolvedValue({});
      prismaMock.department.findMany.mockRejectedValue(new Error('DB error'));

      const result = await service.processMessage(fakeConversation() as any, '1');

      expect(result!.message).toBe('Desculpe, ocorreu um erro. Vou transferir voce para um atendente.');
      expect(result!.needsHuman).toBe(true);
    });

    it('uses fallback config values when configs are empty (greeting path)', async () => {
      botConfigServiceMock.getAll.mockResolvedValue({});

      const result = await service.processMessage(fakeConversation() as any, 'oi');

      expect(result!.message).toContain('Ola! Bem-vindo ao Grupo Multi Educacao.');
      expect(result!.message).toContain('1. Falar com um setor');
      expect(result!.message).toContain('Digite o numero da opcao:');
    });

    it('uses fallback config values for department menu', async () => {
      botConfigServiceMock.getAll.mockResolvedValue({});
      prismaMock.department.findMany.mockResolvedValue([
        { id: 'dept-1', name: 'Vendas', isActive: true, order: 1 },
      ]);
      prismaMock.conversation.update.mockResolvedValue({});

      const result = await service.processMessage(fakeConversation() as any, '1');

      expect(result!.message).toContain('Escolha o setor:');
      expect(result!.message).toContain('Digite o numero:');
    });

    it('uses fallback config for no_departments', async () => {
      botConfigServiceMock.getAll.mockResolvedValue({});
      prismaMock.department.findMany.mockResolvedValue([]);
      prismaMock.conversation.update.mockResolvedValue({});

      const result = await service.processMessage(fakeConversation() as any, '1');

      expect(result!.message).toBe('No momento nao ha setores disponiveis. Voce sera atendido em breve.');
    });

    it('uses fallback config for department_transfer', async () => {
      botConfigServiceMock.getAll.mockResolvedValue({});
      prismaMock.department.findMany.mockResolvedValue([
        { id: 'dept-1', name: 'Vendas', isActive: true, order: 1 },
      ]);
      prismaMock.conversation.update.mockResolvedValue({});

      const result = await service.processMessage(
        fakeConversation({ currentMenuLevel: 'department_selection' }) as any,
        '1',
      );

      expect(result!.message).toContain('Voce sera atendido pelo setor *Vendas*');
    });

    it('does not update conversation when no updateData fields', async () => {
      botConfigServiceMock.getAll.mockResolvedValue(defaultConfigs);

      const result = await service.processMessage(fakeConversation() as any, 'oi');

      // mainMenu without option 1 returns message only — no nextMenuLevel, no needsHuman, no departmentId
      expect(prismaMock.conversation.update).not.toHaveBeenCalled();
    });

    it('updates conversation with all fields when response has them', async () => {
      botConfigServiceMock.getAll.mockResolvedValue(defaultConfigs);
      prismaMock.department.findMany.mockResolvedValue([
        { id: 'dept-1', name: 'Vendas', isActive: true, order: 1 },
      ]);
      prismaMock.conversation.update.mockResolvedValue({});

      await service.processMessage(
        fakeConversation({ currentMenuLevel: 'department_selection' }) as any,
        '1',
      );

      expect(prismaMock.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: expect.objectContaining({
          needsHumanAttention: true,
          isBotActive: false,
          departmentId: 'dept-1',
        }),
      });
    });
  });
});
