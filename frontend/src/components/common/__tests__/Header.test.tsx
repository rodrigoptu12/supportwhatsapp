import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../Header';
import { useAuthStore } from '../../../store/authStore';
import { useQuery } from '@tanstack/react-query';

vi.mock('../../../services/auth.service', () => ({
  authApi: { login: vi.fn(), logout: vi.fn().mockReturnValue(Promise.resolve()) },
}));

vi.mock('../../../services/socket.service', () => ({
  socketService: { connect: vi.fn(), disconnect: vi.fn() },
}));

vi.mock('../../../services/users.service', () => ({
  usersApi: { getOnline: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
    useQueryClient: vi.fn().mockReturnValue({}),
  };
});

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: '1',
        email: 'admin@test.com',
        fullName: 'Admin User',
        role: 'admin',
        isActive: true,
        createdAt: '2024-01-01',
      },
      token: 'token-123',
      isAuthenticated: true,
      isLoading: false,
    });
    vi.mocked(useQuery).mockReturnValue({ data: [], isLoading: false } as any);
  });

  it('renders logout button and user info', () => {
    render(<Header />);
    expect(screen.getByTitle('Sair')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  it('renders user name and role', () => {
    render(<Header />);
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('renders user initials', () => {
    render(<Header />);
    expect(screen.getByText('AU')).toBeInTheDocument();
  });

  it('renders online count', () => {
    render(<Header />);
    expect(screen.getByText(/0 online/)).toBeInTheDocument();
  });

  it('toggles dropdown on online count click', async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByText(/0 online/));
    expect(screen.getByText('Atendentes online')).toBeInTheDocument();
    expect(screen.getByText('Nenhum atendente online')).toBeInTheDocument();
  });

  it('shows online users in dropdown', async () => {
    const user = userEvent.setup();
    vi.mocked(useQuery).mockReturnValue({
      data: [
        { id: 'u1', fullName: 'Agent One', role: 'attendant', email: 'a@a.com', isActive: true, createdAt: '' },
        { id: 'u2', fullName: 'Agent Two', role: 'admin', email: 'b@b.com', isActive: true, createdAt: '' },
      ],
      isLoading: false,
    } as any);

    render(<Header />);
    await user.click(screen.getByText(/2 online/));

    expect(screen.getByText('Agent One')).toBeInTheDocument();
    expect(screen.getByText('Agent Two')).toBeInTheDocument();
    expect(screen.getByText('attendant')).toBeInTheDocument();
  });

  it('closes dropdown on outside click', async () => {
    const user = userEvent.setup();
    render(<Header />);

    // Open dropdown
    await user.click(screen.getByText(/0 online/));
    expect(screen.getByText('Atendentes online')).toBeInTheDocument();

    // Click outside (on the header title)
    await user.click(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Atendentes online')).not.toBeInTheDocument();
    });
  });

  it('renders logout button', () => {
    render(<Header />);
    expect(screen.getByTitle('Sair')).toBeInTheDocument();
  });

  it('renders User icon when user is null', () => {
    useAuthStore.setState({ user: null });
    render(<Header />);
    // Should not crash, no initials shown
    expect(screen.queryByText('AU')).not.toBeInTheDocument();
  });
});
