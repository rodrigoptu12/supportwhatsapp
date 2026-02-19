import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Conversation, Message } from '../../../types';

const mockTakeover = vi.fn().mockResolvedValue({});
const mockCloseConversation = vi.fn().mockResolvedValue({});
const mockTransfer = vi.fn().mockResolvedValue({});
const mockSendMessage = vi.fn().mockResolvedValue({});
const mockSelectConversation = vi.fn();

let mockMessages: Message[] = [];
let mockIsLoading = false;

const fakeConversation: Conversation = {
  id: 'conv-1',
  customerId: 'cust-1',
  assignedUserId: 'user-1',
  status: 'open',
  channel: 'whatsapp',
  currentMenuLevel: 'root',
  isBotActive: false,
  needsHumanAttention: false,
  metadata: {},
  startedAt: '2024-01-01T00:00:00Z',
  lastMessageAt: '2024-01-01T01:00:00Z',
  customer: { id: 'cust-1', name: 'John Doe', phoneNumber: '5511999999999' },
  assignedTo: { id: 'user-1', fullName: 'Agent One' },
};

vi.mock('../../../hooks/useMessages', () => ({
  useMessages: () => ({
    messages: mockMessages,
    isLoading: mockIsLoading,
    sendMessage: mockSendMessage,
  }),
}));

vi.mock('../../../hooks/useConversations', () => ({
  useConversations: () => ({
    takeover: mockTakeover,
    closeConversation: mockCloseConversation,
    transfer: mockTransfer,
  }),
}));

let storeConversation: Conversation | null = fakeConversation;

vi.mock('../../../store/conversationsStore', () => ({
  useConversationsStore: () => ({
    selectedConversation: storeConversation,
    selectConversation: mockSelectConversation,
  }),
}));

vi.mock('../../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1', fullName: 'Agent One', email: 'a@a.com', role: 'attendant' },
  }),
}));

// Mock TransferDialog to simplify ChatWindow tests
vi.mock('../TransferDialog', () => ({
  TransferDialog: ({ open, onTransfer, onClose }: { open: boolean; onTransfer: (toUserId: string, reason?: string) => void; onClose: () => void }) =>
    open ? (
      <div data-testid="transfer-dialog">
        <button onClick={() => onTransfer('u2', 'reason')}>Confirm Transfer</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  MessageSquare: () => <svg data-testid="message-square-icon" />,
  Send: () => <svg data-testid="send-icon" />,
}));

// Mock sub-components - MessageBubble renders content, MessageInput allows interaction
vi.mock('../MessageBubble', () => ({
  MessageBubble: ({ message }: { message: Message }) => <div data-testid="message-bubble">{message.content}</div>,
}));

vi.mock('../MessageInput', () => ({
  MessageInput: ({ disabled, onSend, placeholder }: { disabled: boolean; onSend: (t: string) => void; placeholder: string }) => (
    <div>
      <input
        data-testid="message-input"
        disabled={disabled}
        placeholder={placeholder}
        onChange={() => {}}
        onKeyDown={(e) => { if (e.key === 'Enter') onSend('test message'); }}
      />
    </div>
  ),
}));

vi.mock('../../common/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner" />,
}));

describe('ChatWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeConversation = fakeConversation;
    mockMessages = [];
    mockIsLoading = false;
  });

  async function renderChatWindow() {
    const { ChatWindow } = await import('../ChatWindow');
    return render(<ChatWindow />);
  }

  it('shows empty state when no conversation is selected', async () => {
    storeConversation = null;
    await renderChatWindow();

    expect(screen.getByText('Selecione uma conversa')).toBeInTheDocument();
    expect(screen.getByTestId('message-square-icon')).toBeInTheDocument();
  });

  it('shows customer name and phone in header', async () => {
    await renderChatWindow();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows "Bot ativo" when isBotActive is true', async () => {
    storeConversation = { ...fakeConversation, isBotActive: true };
    await renderChatWindow();

    expect(screen.getByText(/Bot ativo/)).toBeInTheDocument();
  });

  it('shows "Atendimento humano" when isBotActive is false', async () => {
    storeConversation = { ...fakeConversation, isBotActive: false };
    await renderChatWindow();

    expect(screen.getByText(/Atendimento humano/)).toBeInTheDocument();
  });

  it('shows "Transferir" and "Finalizar" buttons when isBotActive is false', async () => {
    storeConversation = { ...fakeConversation, isBotActive: false };
    await renderChatWindow();

    expect(screen.getByRole('button', { name: 'Transferir' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalizar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Assumir Atendimento' })).not.toBeInTheDocument();
  });

  it('shows "Assumir Atendimento" when isBotActive is true', async () => {
    storeConversation = { ...fakeConversation, isBotActive: true };
    await renderChatWindow();

    expect(screen.getByRole('button', { name: 'Assumir Atendimento' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Transferir' })).not.toBeInTheDocument();
  });

  it('calls takeover when "Assumir Atendimento" is clicked', async () => {
    const user = userEvent.setup();
    storeConversation = { ...fakeConversation, isBotActive: true };
    await renderChatWindow();

    await user.click(screen.getByRole('button', { name: 'Assumir Atendimento' }));

    expect(mockTakeover).toHaveBeenCalledWith('conv-1');
  });

  it('calls closeConversation when "Finalizar" is clicked', async () => {
    const user = userEvent.setup();
    storeConversation = { ...fakeConversation, isBotActive: false };
    await renderChatWindow();

    await user.click(screen.getByRole('button', { name: 'Finalizar' }));

    expect(mockCloseConversation).toHaveBeenCalledWith('conv-1');
  });

  it('sends message via MessageInput', async () => {
    const user = userEvent.setup();
    storeConversation = { ...fakeConversation, isBotActive: false };
    await renderChatWindow();

    const input = screen.getByTestId('message-input');
    await user.type(input, '{Enter}');

    expect(mockSendMessage).toHaveBeenCalledWith('test message');
  });

  it('disables input when bot is active', async () => {
    storeConversation = { ...fakeConversation, isBotActive: true };
    await renderChatWindow();

    const input = screen.getByTestId('message-input');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('placeholder', 'Assuma o atendimento para enviar mensagens');
  });

  it('shows loading spinner when messages are loading', async () => {
    mockIsLoading = true;
    await renderChatWindow();

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders message bubbles', async () => {
    mockMessages = [
      { id: 'm1', conversationId: 'conv-1', senderType: 'customer', content: 'Hello', messageType: 'text', isRead: false, sentAt: '2024-01-01', createdAt: '2024-01-01' },
      { id: 'm2', conversationId: 'conv-1', senderType: 'attendant', content: 'Hi there', messageType: 'text', isRead: false, sentAt: '2024-01-01', createdAt: '2024-01-01' },
    ];
    await renderChatWindow();

    const bubbles = screen.getAllByTestId('message-bubble');
    expect(bubbles).toHaveLength(2);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('opens transfer dialog and completes transfer', async () => {
    const user = userEvent.setup();
    storeConversation = { ...fakeConversation, isBotActive: false };
    await renderChatWindow();

    // Open dialog
    await user.click(screen.getByRole('button', { name: 'Transferir' }));
    expect(screen.getByTestId('transfer-dialog')).toBeInTheDocument();

    // Confirm transfer
    await user.click(screen.getByText('Confirm Transfer'));

    expect(mockTransfer).toHaveBeenCalledWith({ id: 'conv-1', toUserId: 'u2', reason: 'reason' });
  });
});
