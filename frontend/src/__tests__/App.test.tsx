import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { useAuthStore } from '../store/authStore';

vi.mock('../services/auth.service', () => ({
  authApi: { login: vi.fn(), logout: vi.fn().mockReturnValue(Promise.resolve()) },
}));

vi.mock('../services/socket.service', () => ({
  socketService: { connect: vi.fn(), disconnect: vi.fn(), on: vi.fn(), off: vi.fn(), subscribeConversation: vi.fn(), unsubscribeConversation: vi.fn() },
}));

vi.mock('../services/users.service', () => ({
  usersApi: { getOnline: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../services/conversations.service', () => ({
  conversationsApi: { list: vi.fn().mockResolvedValue({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }), stats: vi.fn().mockResolvedValue({ total: 0, open: 0, waiting: 0, closed: 0 }) },
}));

vi.mock('../services/departments.service', () => ({
  departmentsApi: { list: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../services/bot-config.service', () => ({
  botConfigApi: { list: vi.fn().mockResolvedValue([]), getFlows: vi.fn().mockResolvedValue([]) },
}));

const authenticatedUser = {
  user: {
    id: 'u1',
    email: 'admin@test.com',
    fullName: 'Admin User',
    role: 'admin' as const,
    isActive: true,
    createdAt: '2024-01-01',
  },
  token: 'test-token',
  refreshToken: 'refresh-token',
  isAuthenticated: true,
  isLoading: false,
};

describe('App', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('renders login page when not authenticated and navigating to /login', async () => {
    window.history.pushState({}, '', '/login');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('WhatsApp Support')).toBeInTheDocument();
    });
  });

  it('redirects to login when not authenticated and accessing /', async () => {
    window.history.pushState({}, '', '/');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('WhatsApp Support')).toBeInTheDocument();
    });
  });

  it('renders dashboard when authenticated and accessing /', async () => {
    useAuthStore.setState(authenticatedUser);
    window.history.pushState({}, '', '/');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('renders conversations page when authenticated', async () => {
    useAuthStore.setState(authenticatedUser);
    window.history.pushState({}, '', '/conversations');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('WhatsApp Support')).toBeInTheDocument();
    });
  });

  it('renders metrics page when authenticated', async () => {
    useAuthStore.setState(authenticatedUser);
    window.history.pushState({}, '', '/metrics');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('WhatsApp Support')).toBeInTheDocument();
    });
  });

  it('renders settings page when authenticated', async () => {
    useAuthStore.setState(authenticatedUser);
    window.history.pushState({}, '', '/settings');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('WhatsApp Support')).toBeInTheDocument();
    });
  });
});
