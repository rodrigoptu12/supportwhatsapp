import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { UsersManagement } from '../UsersManagement';
import { usersApi } from '../../../services/users.service';
import { departmentsApi } from '../../../services/departments.service';

vi.mock('../../../services/api', () => ({
  api: { get: vi.fn(), patch: vi.fn(), put: vi.fn() },
}));

vi.mock('../../../services/users.service', () => ({
  usersApi: {
    list: vi.fn(),
    getDepartments: vi.fn(),
    setDepartments: vi.fn(),
  },
}));

vi.mock('../../../services/departments.service', () => ({
  departmentsApi: {
    list: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockUsers = {
  data: [
    { id: 'u1', email: 'admin@test.com', fullName: 'Admin User', role: 'admin', isActive: true, createdAt: '2024-01-01' },
    { id: 'u2', email: 'att@test.com', fullName: 'Atendente', role: 'attendant', isActive: false, createdAt: '2024-01-01' },
  ],
  pagination: { page: 1, limit: 100, total: 2, totalPages: 1 },
};

describe('UsersManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(departmentsApi.list).mockResolvedValue([]);
  });

  it('renders loading state', () => {
    vi.mocked(usersApi.list).mockReturnValue(new Promise(() => {}));
    render(<UsersManagement />, { wrapper: createWrapper() });
    expect(screen.getByText('Carregando usuarios...')).toBeInTheDocument();
  });

  it('renders user list after loading', async () => {
    vi.mocked(usersApi.list).mockResolvedValue(mockUsers as any);

    render(<UsersManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Atendente').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText(/2.*usuario/)).toBeInTheDocument();
  });

  it('shows role badges', async () => {
    vi.mocked(usersApi.list).mockResolvedValue(mockUsers as any);

    render(<UsersManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    // 'Atendente' both as role badge label and fullName
    expect(screen.getAllByText('Atendente').length).toBeGreaterThanOrEqual(1);
  });

  it('shows active/inactive status', async () => {
    vi.mocked(usersApi.list).mockResolvedValue(mockUsers as any);

    render(<UsersManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Ativo')).toBeInTheDocument();
    });

    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('opens department modal on Setores click', async () => {
    const user = userEvent.setup();
    vi.mocked(usersApi.list).mockResolvedValue(mockUsers as any);
    vi.mocked(usersApi.getDepartments).mockResolvedValue([]);
    vi.mocked(departmentsApi.list).mockResolvedValue([]);

    render(<UsersManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    // Click the first "Setores" button (not the table header)
    const setoresButtons = screen.getAllByRole('button', { name: /Setores/ });
    await user.click(setoresButtons[0]);

    // The modal should appear with a close button and save/cancel buttons
    await waitFor(() => {
      expect(screen.getByText('Salvar')).toBeInTheDocument();
    });
  });

  it('shows departments in modal and allows toggling', async () => {
    const user = userEvent.setup();
    vi.mocked(usersApi.list).mockResolvedValue(mockUsers as any);
    vi.mocked(usersApi.getDepartments).mockResolvedValue([]);
    vi.mocked(departmentsApi.list).mockResolvedValue([
      { id: 'd1', name: 'Vendas', description: 'Setor de vendas', isActive: true, order: 1, createdAt: '', updatedAt: '' },
      { id: 'd2', name: 'Suporte', isActive: true, order: 2, createdAt: '', updatedAt: '' },
    ] as any);

    render(<UsersManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    const setoresButtons = screen.getAllByRole('button', { name: /Setores/ });
    await user.click(setoresButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Vendas')).toBeInTheDocument();
      expect(screen.getByText('Suporte')).toBeInTheDocument();
    });

    // Toggle a department
    await user.click(screen.getByText('Vendas'));

    // Should now be selected (blue border)
    const vendasButton = screen.getByText('Vendas').closest('button');
    expect(vendasButton).toHaveClass('border-blue-500');
  });

  it('saves department assignments', async () => {
    const user = userEvent.setup();
    vi.mocked(usersApi.list).mockResolvedValue(mockUsers as any);
    vi.mocked(usersApi.getDepartments).mockResolvedValue([]);
    vi.mocked(usersApi.setDepartments).mockResolvedValue([]);
    vi.mocked(departmentsApi.list).mockResolvedValue([
      { id: 'd1', name: 'Vendas', isActive: true, order: 1, createdAt: '', updatedAt: '' },
    ] as any);

    render(<UsersManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    const setoresButtons = screen.getAllByRole('button', { name: /Setores/ });
    await user.click(setoresButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Vendas')).toBeInTheDocument();
    });

    // Toggle department
    await user.click(screen.getByText('Vendas'));

    // Save
    await user.click(screen.getByText('Salvar'));

    expect(usersApi.setDepartments).toHaveBeenCalledWith('u1', ['d1']);
  });

  it('closes modal on Cancelar click', async () => {
    const user = userEvent.setup();
    vi.mocked(usersApi.list).mockResolvedValue(mockUsers as any);
    vi.mocked(usersApi.getDepartments).mockResolvedValue([]);
    vi.mocked(departmentsApi.list).mockResolvedValue([]);

    render(<UsersManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    const setoresButtons = screen.getAllByRole('button', { name: /Setores/ });
    await user.click(setoresButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Cancelar'));

    await waitFor(() => {
      expect(screen.queryByText('Salvar')).not.toBeInTheDocument();
    });
  });
});
