import { prismaMock } from '../../helpers/prisma-mock';
import { BotConfigService } from '@/modules/bot-config/bot-config.service';

const service = new BotConfigService();

beforeEach(() => {
  jest.clearAllMocks();
});

const fakeConfig = {
  id: 'cfg-1',
  key: 'greeting',
  value: { message: 'Hello!' },
  description: 'Greeting message',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('BotConfigService', () => {
  describe('list', () => {
    it('returns all configs ordered by key', async () => {
      prismaMock.botConfiguration.findMany.mockResolvedValue([fakeConfig]);

      const result = await service.list();

      expect(result).toEqual([fakeConfig]);
      expect(prismaMock.botConfiguration.findMany).toHaveBeenCalledWith({
        orderBy: { key: 'asc' },
      });
    });
  });

  describe('getByKey', () => {
    it('returns config by key', async () => {
      prismaMock.botConfiguration.findUnique.mockResolvedValue(fakeConfig);

      const result = await service.getByKey('greeting');

      expect(result).toEqual(fakeConfig);
    });
  });

  describe('upsert', () => {
    it('upserts config with description', async () => {
      prismaMock.botConfiguration.upsert.mockResolvedValue(fakeConfig);

      const result = await service.upsert('greeting', 'Hello!', 'Greeting message');

      expect(result).toEqual(fakeConfig);
      expect(prismaMock.botConfiguration.upsert).toHaveBeenCalledWith({
        where: { key: 'greeting' },
        update: { value: { message: 'Hello!' }, description: 'Greeting message' },
        create: { key: 'greeting', value: { message: 'Hello!' }, description: 'Greeting message' },
      });
    });

    it('upserts config without description', async () => {
      prismaMock.botConfiguration.upsert.mockResolvedValue(fakeConfig);

      await service.upsert('greeting', 'Hello!');

      expect(prismaMock.botConfiguration.upsert).toHaveBeenCalledWith({
        where: { key: 'greeting' },
        update: { value: { message: 'Hello!' } },
        create: { key: 'greeting', value: { message: 'Hello!' }, description: null },
      });
    });
  });

  describe('getAll', () => {
    it('returns defaults overridden by DB values', async () => {
      prismaMock.botConfiguration.findMany.mockResolvedValue([
        { key: 'greeting', value: { message: 'Custom greeting' }, isActive: true },
      ]);

      const result = await service.getAll();

      expect(result['greeting']).toBe('Custom greeting');
      // Should have all default keys
      expect(result).toHaveProperty('main_menu_options');
      expect(result).toHaveProperty('error_message');
    });

    it('returns defaults when no DB overrides', async () => {
      prismaMock.botConfiguration.findMany.mockResolvedValue([]);

      const result = await service.getAll();

      expect(result['greeting']).toContain('Ola');
    });

    it('skips DB entries with no message field', async () => {
      prismaMock.botConfiguration.findMany.mockResolvedValue([
        { key: 'greeting', value: {}, isActive: true },
      ]);

      const result = await service.getAll();

      // Should keep the default since DB value has no message
      expect(result['greeting']).toContain('Ola');
    });
  });

  describe('seedDefaults', () => {
    it('upserts all default config keys', async () => {
      prismaMock.botConfiguration.upsert.mockResolvedValue(fakeConfig);

      await service.seedDefaults();

      // There are 8 default keys
      expect(prismaMock.botConfiguration.upsert).toHaveBeenCalledTimes(8);
    });
  });

  describe('getFlowStructure', () => {
    it('returns nodes and edges', () => {
      const result = service.getFlowStructure();

      expect(result.nodes).toHaveLength(6);
      expect(result.edges).toHaveLength(4);
      expect(result.nodes[0]).toHaveProperty('id', 'greeting');
    });
  });
});
