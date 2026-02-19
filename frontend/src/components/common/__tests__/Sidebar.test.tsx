import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { useAuthStore } from '../../../store/authStore';

vi.mock('../../../services/auth.service', () => ({
  authApi: { login: vi.fn(), logout: vi.fn() },
}));

vi.mock('../../../services/socket.service', () => ({
  socketService: { connect: vi.fn(), disconnect: vi.fn() },
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Dashboard and Conversas for all roles', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'a@a.com', fullName: 'User', role: 'attendant', isActive: true, createdAt: '2024-01-01' },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Conversas')).toBeInTheDocument();
    expect(screen.queryByText('Metricas')).not.toBeInTheDocument();
    expect(screen.queryByText('Configuracoes')).not.toBeInTheDocument();
  });

  it('shows Metricas for supervisor', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'a@a.com', fullName: 'Supervisor', role: 'supervisor', isActive: true, createdAt: '2024-01-01' },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Metricas')).toBeInTheDocument();
    expect(screen.queryByText('Configuracoes')).not.toBeInTheDocument();
  });

  it('shows all items for admin', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'a@a.com', fullName: 'Admin', role: 'admin', isActive: true, createdAt: '2024-01-01' },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Conversas')).toBeInTheDocument();
    expect(screen.getByText('Metricas')).toBeInTheDocument();
    expect(screen.getByText('Configuracoes')).toBeInTheDocument();
  });

  it('renders Atendimento title', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'a@a.com', fullName: 'User', role: 'attendant', isActive: true, createdAt: '2024-01-01' },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Atendimento')).toBeInTheDocument();
  });
});
