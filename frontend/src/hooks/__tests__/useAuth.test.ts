import { renderHook } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { useAuthStore } from '../../store/authStore';

vi.mock('../../services/auth.service', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../../services/socket.service', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));

const makeUser = (role: 'admin' | 'supervisor' | 'attendant') => ({
  id: '1',
  email: 'test@test.com',
  fullName: 'Test User',
  role,
  isActive: true,
  createdAt: '2024-01-01',
});

describe('useAuth', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('returns user, isAuthenticated, login, logout from store', () => {
    const user = makeUser('admin');
    useAuthStore.setState({ user, isAuthenticated: true });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });

  it('isAdmin is true when role=admin', () => {
    useAuthStore.setState({ user: makeUser('admin') });
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isSupervisor).toBe(false);
    expect(result.current.isAttendant).toBe(false);
  });

  it('isSupervisor is true when role=supervisor', () => {
    useAuthStore.setState({ user: makeUser('supervisor') });
    const { result } = renderHook(() => useAuth());
    expect(result.current.isSupervisor).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it('isAttendant is true when role=attendant', () => {
    useAuthStore.setState({ user: makeUser('attendant') });
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAttendant).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it('all flags are false when user is null', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isSupervisor).toBe(false);
    expect(result.current.isAttendant).toBe(false);
  });
});
