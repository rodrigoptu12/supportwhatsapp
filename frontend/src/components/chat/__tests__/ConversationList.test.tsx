import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationList } from '../ConversationList';
import { useConversations } from '../../../hooks/useConversations';
import { useConversationsStore } from '../../../store/conversationsStore';
import type { Conversation } from '../../../types';

vi.mock('../../../hooks/useConversations');

const makeConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: 'conv-1',
  customerId: 'cust-1',
  status: 'open',
  channel: 'whatsapp',
  currentMenuLevel: 'main',
  isBotActive: false,
  needsHumanAttention: false,
  metadata: {},
  startedAt: '2024-01-01',
  lastMessageAt: '2024-01-01T12:00:00Z',
  customer: { id: 'cust-1', name: 'Joao Silva', phoneNumber: '5511999887766' },
  ...overrides,
});

describe('ConversationList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConversationsStore.setState({ selectedConversation: null });
  });

  it('shows loading spinner when loading', () => {
    vi.mocked(useConversations).mockReturnValue({
      conversations: [],
      isLoading: true,
      error: null,
    } as any);

    const { container } = render(<ConversationList />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty message when no conversations', () => {
    vi.mocked(useConversations).mockReturnValue({
      conversations: [],
      isLoading: false,
      error: null,
    } as any);

    render(<ConversationList />);
    expect(screen.getByText('Nenhuma conversa')).toBeInTheDocument();
  });

  it('renders conversation list with customer name and status', () => {
    vi.mocked(useConversations).mockReturnValue({
      conversations: [
        makeConversation({ id: 'c1', customer: { id: 'cust-1', name: 'Maria', phoneNumber: '123' } }),
        makeConversation({ id: 'c2', status: 'waiting', customer: { id: 'cust-2', name: 'Pedro', phoneNumber: '456' } }),
      ],
      isLoading: false,
      error: null,
    } as any);

    render(<ConversationList />);
    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.getByText('Pedro')).toBeInTheDocument();
  });

  it('shows Bot badge when isBotActive', () => {
    vi.mocked(useConversations).mockReturnValue({
      conversations: [makeConversation({ isBotActive: true })],
      isLoading: false,
      error: null,
    } as any);

    render(<ConversationList />);
    expect(screen.getByText('Bot')).toBeInTheDocument();
  });

  it('shows Atencao badge when needsHumanAttention', () => {
    vi.mocked(useConversations).mockReturnValue({
      conversations: [makeConversation({ needsHumanAttention: true })],
      isLoading: false,
      error: null,
    } as any);

    render(<ConversationList />);
    expect(screen.getByText('Atenção')).toBeInTheDocument();
  });

  it('selects conversation on click', async () => {
    const user = userEvent.setup();
    const conv = makeConversation();
    vi.mocked(useConversations).mockReturnValue({
      conversations: [conv],
      isLoading: false,
      error: null,
    } as any);

    render(<ConversationList />);
    await user.click(screen.getByText('Joao Silva'));

    expect(useConversationsStore.getState().selectedConversation).toEqual(conv);
  });

  it('shows last message preview for text', () => {
    vi.mocked(useConversations).mockReturnValue({
      conversations: [
        makeConversation({
          messages: [{ content: 'Oi, preciso de ajuda', sentAt: '2024-01-01', senderType: 'customer', messageType: 'text' }],
        }),
      ],
      isLoading: false,
      error: null,
    } as any);

    render(<ConversationList />);
    expect(screen.getByText('Oi, preciso de ajuda')).toBeInTheDocument();
  });

  it('passes filters to useConversations', () => {
    vi.mocked(useConversations).mockReturnValue({
      conversations: [],
      isLoading: false,
      error: null,
    } as any);

    render(<ConversationList search="test" statusFilter="open" />);
    expect(useConversations).toHaveBeenCalledWith({ status: 'open', search: 'test' });
  });
});
