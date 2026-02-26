import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Conversations from '../Conversations';

vi.mock('../../components/chat/ConversationList', () => ({
  ConversationList: ({ search, statusFilter }: any) => (
    <div data-testid="conversation-list" data-search={search} data-status={statusFilter}>
      Conversation List
    </div>
  ),
}));

vi.mock('../../components/chat/ChatWindow', () => ({
  ChatWindow: () => <div data-testid="chat-window">Chat Window</div>,
}));

describe('Conversations page', () => {
  it('renders search input, status tabs, conversation list and chat window', () => {
    render(<Conversations />);

    expect(screen.getByText('Conversas')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar/)).toBeInTheDocument();
    expect(screen.getByText('Todas')).toBeInTheDocument();
    expect(screen.getByText('Abertas')).toBeInTheDocument();
    expect(screen.getByText('Aguardando')).toBeInTheDocument();
    expect(screen.getByText('Fechadas')).toBeInTheDocument();
    expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
    expect(screen.getByTestId('chat-window')).toBeInTheDocument();
  });

  it('switches status filter on tab click', async () => {
    const user = userEvent.setup();
    render(<Conversations />);

    await user.click(screen.getByText('Abertas'));

    expect(screen.getByTestId('conversation-list')).toHaveAttribute('data-status', 'open');
  });

  it('passes search input to conversation list after debounce', async () => {
    const user = userEvent.setup();

    render(<Conversations />);

    await user.type(screen.getByPlaceholderText(/Buscar/), 'Maria');

    // After debounce (400ms), the search should be passed
    await waitFor(() => {
      expect(screen.getByTestId('conversation-list')).toHaveAttribute('data-search', 'Maria');
    }, { timeout: 2000 });
  });
});
