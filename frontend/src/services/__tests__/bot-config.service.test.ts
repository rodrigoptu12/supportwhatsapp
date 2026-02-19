import { botConfigApi } from '../bot-config.service';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('botConfigApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list gets /bot/config', async () => {
    const mockConfigs = [{ id: '1', key: 'welcome', value: { message: 'Hi' } }];
    vi.mocked(api.get).mockResolvedValue({ data: mockConfigs });

    const result = await botConfigApi.list();

    expect(api.get).toHaveBeenCalledWith('/bot/config');
    expect(result).toEqual(mockConfigs);
  });

  it('update puts /bot/config/:key', async () => {
    const mockConfig = { id: '1', key: 'welcome', value: { message: 'Hello' } };
    vi.mocked(api.put).mockResolvedValue({ data: mockConfig });

    const result = await botConfigApi.update('welcome', 'Hello');

    expect(api.put).toHaveBeenCalledWith('/bot/config/welcome', { value: 'Hello' });
    expect(result).toEqual(mockConfig);
  });

  it('getFlows gets /bot/flows', async () => {
    const mockFlows = { nodes: [], edges: [] };
    vi.mocked(api.get).mockResolvedValue({ data: mockFlows });

    const result = await botConfigApi.getFlows();

    expect(api.get).toHaveBeenCalledWith('/bot/flows');
    expect(result).toEqual(mockFlows);
  });
});
