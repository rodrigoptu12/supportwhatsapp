import { renderHook, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useWebSocket } from '../useWebSocket';
import { socketService } from '../../services/socket.service';
import { useAuthStore } from '../../store/authStore';
import { useConversationsStore } from '../../store/conversationsStore';

vi.mock('../../services/socket.service', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscribeConversation: vi.fn(),
    unsubscribeConversation: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('../../services/auth.service', () => ({
  authApi: { login: vi.fn(), logout: vi.fn() },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    useConversationsStore.setState({
      conversations: [],
      selectedConversation: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('connects socket when authenticated with token', () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'test-token' });

    renderHook(() => useWebSocket(), { wrapper: createWrapper() });

    expect(socketService.connect).toHaveBeenCalledWith('test-token');
  });

  it('does not connect socket when not authenticated', () => {
    useAuthStore.setState({ isAuthenticated: false, token: null });

    renderHook(() => useWebSocket(), { wrapper: createWrapper() });

    expect(socketService.connect).not.toHaveBeenCalled();
  });

  it('subscribes to selected conversation', () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'test-token' });
    useConversationsStore.setState({
      selectedConversation: {
        id: 'conv-1',
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
      },
    });

    renderHook(() => useWebSocket(), { wrapper: createWrapper() });

    expect(socketService.subscribeConversation).toHaveBeenCalledWith('conv-1');
  });

  it('does not subscribe when no conversation selected', () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'test-token' });

    renderHook(() => useWebSocket(), { wrapper: createWrapper() });

    expect(socketService.subscribeConversation).not.toHaveBeenCalled();
  });

  it('registers event listeners when authenticated', () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'test-token' });

    renderHook(() => useWebSocket(), { wrapper: createWrapper() });

    expect(socketService.on).toHaveBeenCalledWith('new_message', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('conversation_update', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('new_conversation', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('attendant_online', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('attendant_offline', expect.any(Function));
  });

  it('does not register event listeners when not authenticated', () => {
    useAuthStore.setState({ isAuthenticated: false });

    renderHook(() => useWebSocket(), { wrapper: createWrapper() });

    expect(socketService.on).not.toHaveBeenCalled();
  });

  it('unregisters event listeners on cleanup', () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'test-token' });

    const { unmount } = renderHook(() => useWebSocket(), { wrapper: createWrapper() });

    unmount();

    expect(socketService.off).toHaveBeenCalledWith('new_message', expect.any(Function));
    expect(socketService.off).toHaveBeenCalledWith('conversation_update', expect.any(Function));
    expect(socketService.off).toHaveBeenCalledWith('new_conversation', expect.any(Function));
    expect(socketService.off).toHaveBeenCalledWith('attendant_online', expect.any(Function));
    expect(socketService.off).toHaveBeenCalledWith('attendant_offline', expect.any(Function));
  });

  it('handleNewMessage invalidates messages and conversations queries', () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'test-token' });
    useConversationsStore.setState({
      selectedConversation: {
        id: 'conv-1',
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
      },
    });

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    renderHook(() => useWebSocket(), { wrapper });

    // Get the handleNewMessage callback registered with socketService.on
    const newMessageCall = vi.mocked(socketService.on).mock.calls.find(
      (call) => call[0] === 'new_message',
    );
    expect(newMessageCall).toBeDefined();

    // Call the handler
    const handleNewMessage = newMessageCall![1];
    handleNewMessage();

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['messages', 'conv-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conversations'] });
  });

  it('handleConversationUpdate invalidates conversations query', () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'test-token' });

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    renderHook(() => useWebSocket(), { wrapper });

    const call = vi.mocked(socketService.on).mock.calls.find(
      (c) => c[0] === 'conversation_update',
    );
    call![1]();

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conversations'] });
  });

  it('handleNewConversation invalidates conversations query', () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'test-token' });

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    renderHook(() => useWebSocket(), { wrapper });

    const call = vi.mocked(socketService.on).mock.calls.find(
      (c) => c[0] === 'new_conversation',
    );
    call![1]();

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conversations'] });
  });

  it('handleOnlineStatusChange invalidates online-users query', () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'test-token' });

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    renderHook(() => useWebSocket(), { wrapper });

    const call = vi.mocked(socketService.on).mock.calls.find(
      (c) => c[0] === 'attendant_online',
    );
    call![1]();

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['online-users'] });
  });

  it('unsubscribes from conversation on cleanup', () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'test-token' });
    useConversationsStore.setState({
      selectedConversation: {
        id: 'conv-1',
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
      },
    });

    const { unmount } = renderHook(() => useWebSocket(), { wrapper: createWrapper() });

    unmount();

    expect(socketService.unsubscribeConversation).toHaveBeenCalledWith('conv-1');
  });
});
