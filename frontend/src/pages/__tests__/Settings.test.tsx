import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from '../Settings';

// Mock all admin components
vi.mock('../../components/admin/UsersManagement', () => ({
  UsersManagement: () => <div data-testid="users-management">Users Management</div>,
}));

vi.mock('../../components/admin/DepartmentsManagement', () => ({
  DepartmentsManagement: () => <div data-testid="departments-management">Departments Management</div>,
}));

vi.mock('../../components/admin/BotConfigManagement', () => ({
  BotConfigManagement: () => <div data-testid="bot-management">Bot Management</div>,
}));

describe('Settings page', () => {
  it('renders title and tabs', () => {
    render(<Settings />);
    expect(screen.getByText('Configuracoes')).toBeInTheDocument();
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Setores')).toBeInTheDocument();
    expect(screen.getByText('Bot')).toBeInTheDocument();
  });

  it('shows UsersManagement by default', () => {
    render(<Settings />);
    expect(screen.getByTestId('users-management')).toBeInTheDocument();
  });

  it('switches to DepartmentsManagement tab', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await user.click(screen.getByText('Setores'));

    expect(screen.getByTestId('departments-management')).toBeInTheDocument();
    expect(screen.queryByTestId('users-management')).not.toBeInTheDocument();
  });

  it('switches to BotConfigManagement tab', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await user.click(screen.getByText('Bot'));

    expect(screen.getByTestId('bot-management')).toBeInTheDocument();
  });
});
