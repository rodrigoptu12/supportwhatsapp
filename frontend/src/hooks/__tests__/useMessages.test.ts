import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useMessages } from '../useMessages';
import { messagesApi } from '../../services/messages.service';
import type { Message, PaginatedResponse } from '../../types';

vi.mock('../../services/messages.service', () => ({
  messagesApi: {
    list: vi.fn(),
    send: vi.fn(),
  },
}));

const makeMessage = (id: string): Message => ({
  id,
  conversationId: 'conv-1',
  senderType: 'customer',
  content: 'Hello',
  messageType: 'text',
  isRead: false,
  sentAt: '2024-01-01T12:00:00Z',
  createdAt: '2024-01-01T12:00:00Z',
});

const makePaginatedResponse = (msgs: Message[]): PaginatedResponse<Message> => ({
  data: msgs,
  pagination: { page: 1, limit: 50, total: msgs.length, totalPages: 1 },
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches messages when conversationId is provided', async () => {
    const msgs = [makeMessage('m1'), makeMessage('m2')];
    vi.mocked(messagesApi.list).mockResolvedValue(makePaginatedResponse(msgs));

    const { result } = renderHook(() => useMessages('conv-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.messages).toHaveLength(2);
    expect(messagesApi.list).toHaveBeenCalledWith('conv-1');
  });

  it('does not fetch when conversationId is null', async () => {
    const { result } = renderHook(() => useMessages(null), {
      wrapper: createWrapper(),
    });

    // Should not be loading since query is disabled
    expect(result.current.messages).toEqual([]);
    expect(messagesApi.list).not.toHaveBeenCalled();
  });

  it('returns pagination data', async () => {
    const response = makePaginatedResponse([makeMessage('m1')]);
    response.pagination = { page: 2, limit: 50, total: 100, totalPages: 2 };
    vi.mocked(messagesApi.list).mockResolvedValue(response);

    const { result } = renderHook(() => useMessages('conv-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.pagination).toEqual({ page: 2, limit: 50, total: 100, totalPages: 2 });
    });
  });

  it('sendMessage calls messagesApi.send', async () => {
    vi.mocked(messagesApi.list).mockResolvedValue(makePaginatedResponse([]));
    vi.mocked(messagesApi.send).mockResolvedValue(makeMessage('m-new'));

    const { result } = renderHook(() => useMessages('conv-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.sendMessage('Hello!');
    });

    expect(messagesApi.send).toHaveBeenCalledWith('conv-1', 'Hello!', undefined);
  });

  it('returns error when query fails', async () => {
    vi.mocked(messagesApi.list).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMessages('conv-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
