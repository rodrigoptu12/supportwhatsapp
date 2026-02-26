import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '../DashboardLayout';
import { useAuthStore } from '../../../store/authStore';

vi.mock('../../../services/auth.service', () => ({
  authApi: { login: vi.fn(), logout: vi.fn().mockReturnValue(Promise.resolve()) },
}));

vi.mock('../../../services/socket.service', () => ({
  socketService: { connect: vi.fn(), disconnect: vi.fn(), on: vi.fn(), off: vi.fn(), subscribeConversation: vi.fn(), unsubscribeConversation: vi.fn() },
}));

vi.mock('../../../services/users.service', () => ({
  usersApi: { getOnline: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
    useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() }),
  };
});

describe('DashboardLayout', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: '1', email: 'a@a.com', fullName: 'Admin', role: 'admin', isActive: true, createdAt: '2024-01-01' },
      token: 'token-123',
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('renders header, sidebar and outlet content', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Suporte')).toBeInTheDocument();
    expect(screen.getByText('Navegação')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });
});
