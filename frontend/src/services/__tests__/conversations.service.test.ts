import { conversationsApi } from '../conversations.service';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('conversationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list gets /conversations with params', async () => {
    const mockData = { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const params = { status: 'open', page: 1, limit: 20 };
    const result = await conversationsApi.list(params);

    expect(api.get).toHaveBeenCalledWith('/conversations', { params });
    expect(result).toEqual(mockData);
  });

  it('getById gets /conversations/:id', async () => {
    const mockConv = { id: 'conv-1', status: 'open' };
    vi.mocked(api.get).mockResolvedValue({ data: mockConv });

    const result = await conversationsApi.getById('conv-1');

    expect(api.get).toHaveBeenCalledWith('/conversations/conv-1');
    expect(result).toEqual(mockConv);
  });

  it('takeover posts to /conversations/:id/takeover', async () => {
    const mockConv = { id: 'conv-1', assignedUserId: 'user-1' };
    vi.mocked(api.post).mockResolvedValue({ data: mockConv });

    const result = await conversationsApi.takeover('conv-1');

    expect(api.post).toHaveBeenCalledWith('/conversations/conv-1/takeover');
    expect(result).toEqual(mockConv);
  });

  it('transfer posts with toUserId and reason', async () => {
    const mockConv = { id: 'conv-1', assignedUserId: 'user-2' };
    vi.mocked(api.post).mockResolvedValue({ data: mockConv });

    const result = await conversationsApi.transfer('conv-1', 'user-2', 'escalation');

    expect(api.post).toHaveBeenCalledWith('/conversations/conv-1/transfer', {
      toUserId: 'user-2',
      reason: 'escalation',
    });
    expect(result).toEqual(mockConv);
  });

  it('close posts to /conversations/:id/close', async () => {
    const mockConv = { id: 'conv-1', status: 'closed' };
    vi.mocked(api.post).mockResolvedValue({ data: mockConv });

    const result = await conversationsApi.close('conv-1');

    expect(api.post).toHaveBeenCalledWith('/conversations/conv-1/close');
    expect(result).toEqual(mockConv);
  });

  it('stats gets /conversations/stats', async () => {
    const mockStats = { open: 5, waiting: 3, closed: 10, total: 18 };
    vi.mocked(api.get).mockResolvedValue({ data: mockStats });

    const result = await conversationsApi.stats();

    expect(api.get).toHaveBeenCalledWith('/conversations/stats');
    expect(result).toEqual(mockStats);
  });
});
