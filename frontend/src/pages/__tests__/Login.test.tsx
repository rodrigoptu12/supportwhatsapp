import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';
import { useAuthStore } from '../../store/authStore';

vi.mock('../../services/auth.service', () => ({
  authApi: { login: vi.fn(), logout: vi.fn() },
}));

vi.mock('../../services/socket.service', () => ({
  socketService: { connect: vi.fn(), disconnect: vi.fn() },
}));

describe('Login page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('renders LoginForm when not authenticated', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('redirects when authenticated', () => {
    useAuthStore.setState({ isAuthenticated: true });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });
});
