import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { DepartmentsManagement } from '../DepartmentsManagement';
import { departmentsApi } from '../../../services/departments.service';

vi.mock('../../../services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../../services/departments.service', () => ({
  departmentsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockDepartments = [
  { id: 'd1', name: 'Vendas', description: 'Setor de vendas', isActive: true, order: 1, createdAt: '', updatedAt: '', _count: { users: 3, conversations: 10 } },
  { id: 'd2', name: 'Suporte', description: null, isActive: false, order: 2, createdAt: '', updatedAt: '', _count: { users: 0, conversations: 0 } },
];

describe('DepartmentsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(departmentsApi.list).mockReturnValue(new Promise(() => {}));
    render(<DepartmentsManagement />, { wrapper: createWrapper() });
    expect(screen.getByText('Carregando setores...')).toBeInTheDocument();
  });

  it('renders department list after loading', async () => {
    vi.mocked(departmentsApi.list).mockResolvedValue(mockDepartments as any);

    render(<DepartmentsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Vendas')).toBeInTheDocument();
    });

    expect(screen.getByText('Suporte')).toBeInTheDocument();
    expect(screen.getByText('Setor de vendas')).toBeInTheDocument();
    expect(screen.getByText('2 setor(es) cadastrado(s)')).toBeInTheDocument();
  });

  it('shows active/inactive status badges', async () => {
    vi.mocked(departmentsApi.list).mockResolvedValue(mockDepartments as any);

    render(<DepartmentsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Vendas')).toBeInTheDocument();
    });

    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('shows create form when Novo Setor is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(departmentsApi.list).mockResolvedValue([]);

    render(<DepartmentsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Novo Setor')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Novo Setor'));
    expect(screen.getByPlaceholderText('Nome do setor')).toBeInTheDocument();
  });

  it('renders empty state', async () => {
    vi.mocked(departmentsApi.list).mockResolvedValue([]);

    render(<DepartmentsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Nenhum setor cadastrado')).toBeInTheDocument();
    });
  });

  it('creates a new department', async () => {
    const user = userEvent.setup();
    vi.mocked(departmentsApi.list).mockResolvedValue([]);
    vi.mocked(departmentsApi.create).mockResolvedValue(mockDepartments[0] as any);

    render(<DepartmentsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Novo Setor')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Novo Setor'));

    await user.type(screen.getByPlaceholderText('Nome do setor'), 'Financeiro');
    await user.type(screen.getByPlaceholderText('Descricao (opcional)'), 'Setor financeiro');

    await user.click(screen.getByText('Salvar'));

    expect(departmentsApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Financeiro', description: 'Setor financeiro' }),
      expect.anything(),
    );
  });

  it('does not create department with empty name', async () => {
    const user = userEvent.setup();
    vi.mocked(departmentsApi.list).mockResolvedValue([]);

    render(<DepartmentsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Novo Setor')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Novo Setor'));
    // Don't type anything, just click save
    await user.click(screen.getByText('Salvar'));

    expect(departmentsApi.create).not.toHaveBeenCalled();
  });

  it('cancels create form', async () => {
    const user = userEvent.setup();
    vi.mocked(departmentsApi.list).mockResolvedValue([]);

    render(<DepartmentsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Novo Setor')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Novo Setor'));
    expect(screen.getByPlaceholderText('Nome do setor')).toBeInTheDocument();

    await user.click(screen.getByText('Cancelar'));
    expect(screen.queryByPlaceholderText('Nome do setor')).not.toBeInTheDocument();
  });

  it('enters edit mode on pencil click', async () => {
    const user = userEvent.setup();
    vi.mocked(departmentsApi.list).mockResolvedValue(mockDepartments as any);

    render(<DepartmentsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Vendas')).toBeInTheDocument();
    });

    // Click edit (pencil icon button) for first department
    const editButtons = screen.getAllByRole('button').filter(
      (b) => b.closest('td') && b.querySelector('svg'),
    );
    // First action button per row is edit
    await user.click(editButtons[0]);

    // Should show input with current name
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it('saves edit with updated values', async () => {
    const user = userEvent.setup();
    vi.mocked(departmentsApi.list).mockResolvedValue(mockDepartments as any);
    vi.mocked(departmentsApi.update).mockResolvedValue(mockDepartments[0] as any);

    render(<DepartmentsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Vendas')).toBeInTheDocument();
    });

    // Click edit for first department
    const editButtons = screen.getAllByRole('button').filter(
      (b) => b.closest('td') && b.querySelector('svg'),
    );
    await user.click(editButtons[0]);

    // Find name input and change it
    const inputs = screen.getAllByRole('textbox');
    await user.clear(inputs[0]);
    await user.type(inputs[0], 'Vendas Atualizado');

    // Click save (check button) - first button in edit row actions
    const actionButtons = screen.getAllByRole('button').filter((b) => b.closest('td'));
    await user.click(actionButtons[0]);

    expect(departmentsApi.update).toHaveBeenCalledWith(
      'd1',
      expect.objectContaining({ name: 'Vendas Atualizado' }),
    );
  });

  it('cancels edit mode', async () => {
    const user = userEvent.setup();
    vi.mocked(departmentsApi.list).mockResolvedValue(mockDepartments as any);

    render(<DepartmentsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Vendas')).toBeInTheDocument();
    });

    // Click edit for first department
    const editButtons = screen.getAllByRole('button').filter(
      (b) => b.closest('td') && b.querySelector('svg'),
    );
    await user.click(editButtons[0]);

    // Verify edit mode is active
    expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(1);

    // Click cancel (X button) - second button in edit row actions
    const actionButtons = screen.getAllByRole('button').filter((b) => b.closest('td'));
    await user.click(actionButtons[1]);

    // Edit inputs should be gone, name should show again as text
    await waitFor(() => {
      expect(screen.getByText('Vendas')).toBeInTheDocument();
    });
  });

  it('toggles department active status', async () => {
    const user = userEvent.setup();
    vi.mocked(departmentsApi.list).mockResolvedValue(mockDepartments as any);
    vi.mocked(departmentsApi.update).mockResolvedValue(mockDepartments[0] as any);

    render(<DepartmentsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Vendas')).toBeInTheDocument();
    });

    // Click the "Ativo" button to toggle
    await user.click(screen.getByText('Ativo'));

    expect(departmentsApi.update).toHaveBeenCalledWith('d1', { isActive: false });
  });

  it('deletes a department after confirm', async () => {
    const user = userEvent.setup();
    vi.mocked(departmentsApi.list).mockResolvedValue(mockDepartments as any);
    vi.mocked(departmentsApi.delete).mockResolvedValue(undefined);

    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<DepartmentsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Vendas')).toBeInTheDocument();
    });

    // Click delete button (has red trash icon) - second action button per row
    const actionButtons = screen.getAllByRole('button').filter(
      (b) => b.closest('td') && b.querySelector('.text-red-500'),
    );
    await user.click(actionButtons[0]);

    expect(departmentsApi.delete).toHaveBeenCalledWith('d1', expect.anything());
  });

  it('does not delete when confirm is cancelled', async () => {
    const user = userEvent.setup();
    vi.mocked(departmentsApi.list).mockResolvedValue(mockDepartments as any);

    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<DepartmentsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Vendas')).toBeInTheDocument();
    });

    const actionButtons = screen.getAllByRole('button').filter(
      (b) => b.closest('td') && b.querySelector('.text-red-500'),
    );
    await user.click(actionButtons[0]);

    expect(departmentsApi.delete).not.toHaveBeenCalled();
  });

  it('shows dash for null description', async () => {
    vi.mocked(departmentsApi.list).mockResolvedValue(mockDepartments as any);

    render(<DepartmentsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Vendas')).toBeInTheDocument();
    });

    // Suporte has description: null, should show '-'
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
