import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useConversations } from '../useConversations';
import { conversationsApi } from '../../services/conversations.service';
import { useConversationsStore } from '../../store/conversationsStore';
import type { Conversation, PaginatedResponse } from '../../types';

vi.mock('../../services/conversations.service', () => ({
  conversationsApi: {
    list: vi.fn(),
    takeover: vi.fn(),
    close: vi.fn(),
    transfer: vi.fn(),
  },
}));

const makeConversation = (id: string): Conversation => ({
  id,
  customerId: 'cust-1',
  status: 'open',
  channel: 'whatsapp',
  currentMenuLevel: 'main',
  isBotActive: true,
  needsHumanAttention: false,
  metadata: {},
  startedAt: '2024-01-01',
  lastMessageAt: '2024-01-01',
  customer: { id: 'cust-1', name: 'Customer', phoneNumber: '5511999887766' },
});

const makePaginatedResponse = (convs: Conversation[]): PaginatedResponse<Conversation> => ({
  data: convs,
  pagination: { page: 1, limit: 20, total: convs.length, totalPages: 1 },
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConversationsStore.setState({
      conversations: [],
      selectedConversation: null,
    });
  });

  it('fetches conversations and updates store', async () => {
    const convs = [makeConversation('c1'), makeConversation('c2')];
    vi.mocked(conversationsApi.list).mockResolvedValue(makePaginatedResponse(convs));

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.conversations).toHaveLength(2);
    expect(conversationsApi.list).toHaveBeenCalledWith({ status: undefined, search: undefined });
    expect(useConversationsStore.getState().conversations).toHaveLength(2);
  });

  it('passes filters to API', async () => {
    vi.mocked(conversationsApi.list).mockResolvedValue(makePaginatedResponse([]));

    renderHook(() => useConversations({ status: 'open', search: 'test' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(conversationsApi.list).toHaveBeenCalledWith({ status: 'open', search: 'test' });
    });
  });

  it('returns empty array when no data', async () => {
    vi.mocked(conversationsApi.list).mockResolvedValue(makePaginatedResponse([]));

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.conversations).toEqual([]);
  });

  it('syncs selectedConversation with latest data', async () => {
    const conv = makeConversation('c1');
    useConversationsStore.setState({ selectedConversation: conv });

    const updatedConv = { ...conv, status: 'closed' as const };
    vi.mocked(conversationsApi.list).mockResolvedValue(makePaginatedResponse([updatedConv]));

    renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(useConversationsStore.getState().selectedConversation?.status).toBe('closed');
    });
  });

  it('takeover calls API and returns mutateAsync', async () => {
    vi.mocked(conversationsApi.list).mockResolvedValue(makePaginatedResponse([]));
    vi.mocked(conversationsApi.takeover).mockResolvedValue(makeConversation('c1'));

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.takeover('c1');
    });

    expect(conversationsApi.takeover).toHaveBeenCalledWith('c1', expect.anything());
  });

  it('closeConversation calls API and clears selection', async () => {
    const conv = makeConversation('c1');
    useConversationsStore.setState({ selectedConversation: conv });
    vi.mocked(conversationsApi.list).mockResolvedValue(makePaginatedResponse([conv]));
    vi.mocked(conversationsApi.close).mockResolvedValue({ ...conv, status: 'closed' });

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.closeConversation('c1');
    });

    expect(conversationsApi.close).toHaveBeenCalledWith('c1', expect.anything());
    expect(useConversationsStore.getState().selectedConversation).toBeNull();
  });

  it('transfer calls API with id, toUserId and reason', async () => {
    vi.mocked(conversationsApi.list).mockResolvedValue(makePaginatedResponse([]));
    vi.mocked(conversationsApi.transfer).mockResolvedValue(makeConversation('c1'));

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.transfer({ id: 'c1', toUserId: 'u2', reason: 'escalation' });
    });

    expect(conversationsApi.transfer).toHaveBeenCalledWith('c1', 'u2', 'escalation');
  });

  it('returns error when query fails', async () => {
    vi.mocked(conversationsApi.list).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
