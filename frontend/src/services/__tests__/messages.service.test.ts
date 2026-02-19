import { messagesApi } from '../messages.service';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('messagesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list gets /messages with params', async () => {
    const mockData = { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const result = await messagesApi.list('conv-1', 1, 50);

    expect(api.get).toHaveBeenCalledWith('/messages', {
      params: { conversation_id: 'conv-1', page: 1, limit: 50 },
    });
    expect(result).toEqual(mockData);
  });

  it('send posts to /messages', async () => {
    const mockMsg = { id: 'msg-1', content: 'Hello', conversationId: 'conv-1' };
    vi.mocked(api.post).mockResolvedValue({ data: mockMsg });

    const result = await messagesApi.send('conv-1', 'Hello');

    expect(api.post).toHaveBeenCalledWith('/messages', {
      conversationId: 'conv-1',
      content: 'Hello',
      messageType: 'text',
    });
    expect(result).toEqual(mockMsg);
  });

  it('markAsRead patches /messages/:id/read', async () => {
    const mockMsg = { id: 'msg-1', isRead: true };
    vi.mocked(api.patch).mockResolvedValue({ data: mockMsg });

    const result = await messagesApi.markAsRead('msg-1');

    expect(api.patch).toHaveBeenCalledWith('/messages/msg-1/read');
    expect(result).toEqual(mockMsg);
  });
});
