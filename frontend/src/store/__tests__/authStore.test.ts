import { useAuthStore } from '../authStore';
import { authApi } from '../../services/auth.service';
import { socketService } from '../../services/socket.service';

vi.mock('../../services/auth.service', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn().mockReturnValue(Promise.resolve()),
  },
}));

vi.mock('../../services/socket.service', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  describe('login', () => {
    it('calls authApi.login, sets state, connects socket', async () => {
      const mockData = {
        user: { id: '1', email: 'test@test.com', fullName: 'Test', role: 'admin' as const, isActive: true, createdAt: '2024-01-01' },
        accessToken: 'token-123',
        refreshToken: 'refresh-123',
      };
      vi.mocked(authApi.login).mockResolvedValue(mockData);

      await useAuthStore.getState().login('test@test.com', 'password');

      expect(authApi.login).toHaveBeenCalledWith('test@test.com', 'password');
      expect(socketService.connect).toHaveBeenCalledWith('token-123');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockData.user);
      expect(state.token).toBe('token-123');
      expect(state.refreshToken).toBe('refresh-123');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('sets isLoading false and throws on error', async () => {
      vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));

      await expect(useAuthStore.getState().login('bad@test.com', 'wrong')).rejects.toThrow('Invalid credentials');

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('with token calls authApi.logout and disconnects socket', () => {
      useAuthStore.setState({ token: 'token-123', isAuthenticated: true });

      useAuthStore.getState().logout();

      expect(authApi.logout).toHaveBeenCalled();
      expect(socketService.disconnect).toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('without token does not call authApi.logout', () => {
      useAuthStore.setState({ token: null });

      useAuthStore.getState().logout();

      expect(authApi.logout).not.toHaveBeenCalled();
      expect(socketService.disconnect).toHaveBeenCalled();
    });
  });

  describe('setUser', () => {
    it('updates user', () => {
      const user = { id: '1', email: 'test@test.com', fullName: 'Test', role: 'admin' as const, isActive: true, createdAt: '2024-01-01' };

      useAuthStore.getState().setUser(user);

      expect(useAuthStore.getState().user).toEqual(user);
    });
  });
});
