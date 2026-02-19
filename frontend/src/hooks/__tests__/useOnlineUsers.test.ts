import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useOnlineUsers } from '../useOnlineUsers';
import { usersApi } from '../../services/users.service';

vi.mock('../../services/users.service', () => ({
  usersApi: {
    getOnline: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useOnlineUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns online users and count', async () => {
    const mockUsers = [
      { id: '1', fullName: 'User 1', role: 'attendant' as const },
      { id: '2', fullName: 'User 2', role: 'admin' as const },
    ];
    vi.mocked(usersApi.getOnline).mockResolvedValue(mockUsers);

    const { result } = renderHook(() => useOnlineUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.onlineUsers).toHaveLength(2);
    });

    expect(result.current.onlineCount).toBe(2);
    expect(usersApi.getOnline).toHaveBeenCalled();
  });

  it('returns empty array and zero count when no users online', async () => {
    vi.mocked(usersApi.getOnline).mockResolvedValue([]);

    const { result } = renderHook(() => useOnlineUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.onlineUsers).toEqual([]);
    });

    expect(result.current.onlineCount).toBe(0);
  });

  it('defaults to empty array before data loads', () => {
    vi.mocked(usersApi.getOnline).mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useOnlineUsers(), {
      wrapper: createWrapper(),
    });

    expect(result.current.onlineUsers).toEqual([]);
    expect(result.current.onlineCount).toBe(0);
  });
});
