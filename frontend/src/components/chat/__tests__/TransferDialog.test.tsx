import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TransferDialog } from '../TransferDialog';

vi.mock('../../../services/users.service', () => ({
  usersApi: {
    getOnline: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: (opts: { enabled?: boolean }) => ({
      data: opts.enabled !== false
        ? [
            { id: 'user-1', fullName: 'Current User', avatarUrl: null, role: 'attendant' },
            { id: 'user-2', fullName: 'Agent Two', avatarUrl: null, role: 'attendant' },
            { id: 'user-3', fullName: 'Agent Three', avatarUrl: null, role: 'admin' },
          ]
        : [],
      isLoading: false,
    }),
  };
});

describe('TransferDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onTransfer: vi.fn(),
    currentUserId: 'user-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when open=false', () => {
    const { container } = render(
      <TransferDialog {...defaultProps} open={false} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows online agents excluding current user', () => {
    render(<TransferDialog {...defaultProps} />);

    expect(screen.getByText('Agent Two')).toBeInTheDocument();
    expect(screen.getByText('Agent Three')).toBeInTheDocument();
    expect(screen.queryByText('Current User')).not.toBeInTheDocument();
  });

  it('has transfer button disabled when no agent is selected', () => {
    render(<TransferDialog {...defaultProps} />);

    const transferBtn = screen.getByRole('button', { name: 'Transferir' });
    expect(transferBtn).toBeDisabled();
  });

  it('calls onTransfer with userId and reason when confirmed', async () => {
    const user = userEvent.setup();
    render(<TransferDialog {...defaultProps} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'user-2');

    const reasonInput = screen.getByPlaceholderText(/suporte técnico/i);
    await user.type(reasonInput, 'needs help');

    const transferBtn = screen.getByRole('button', { name: 'Transferir' });
    await user.click(transferBtn);

    expect(defaultProps.onTransfer).toHaveBeenCalledWith('user-2', 'needs help');
  });

  it('calls onTransfer with undefined reason when reason is empty', async () => {
    const user = userEvent.setup();
    render(<TransferDialog {...defaultProps} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'user-3');

    const transferBtn = screen.getByRole('button', { name: 'Transferir' });
    await user.click(transferBtn);

    expect(defaultProps.onTransfer).toHaveBeenCalledWith('user-3', undefined);
  });

  it('calls onClose when Cancelar is clicked', async () => {
    const user = userEvent.setup();
    render(<TransferDialog {...defaultProps} />);

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancelBtn);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
