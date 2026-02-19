import { defaultFlows, BotFlow } from '@/modules/bot/bot.flows';

describe('Bot Flows', () => {
  it('exports default flows array', () => {
    expect(Array.isArray(defaultFlows)).toBe(true);
    expect(defaultFlows.length).toBeGreaterThan(0);
  });

  it('has main menu flow', () => {
    const main = defaultFlows.find((f: BotFlow) => f.id === 'main');
    expect(main).toBeDefined();
    expect(main!.menuLevel).toBe('main');
    expect(main!.options.length).toBeGreaterThan(0);
  });

  it('has support flow', () => {
    const support = defaultFlows.find((f: BotFlow) => f.id === 'support');
    expect(support).toBeDefined();
    expect(support!.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'transfer' }),
      ]),
    );
  });

  it('has sales flow', () => {
    const sales = defaultFlows.find((f: BotFlow) => f.id === 'sales');
    expect(sales).toBeDefined();
  });

  it('each flow has valid structure', () => {
    for (const flow of defaultFlows) {
      expect(flow).toHaveProperty('id');
      expect(flow).toHaveProperty('name');
      expect(flow).toHaveProperty('menuLevel');
      expect(flow).toHaveProperty('options');
      for (const option of flow.options) {
        expect(option).toHaveProperty('key');
        expect(option).toHaveProperty('label');
        expect(['navigate', 'transfer', 'message']).toContain(option.action);
      }
    }
  });
});
