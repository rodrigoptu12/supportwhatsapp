import { useConversationsStore } from '../conversationsStore';
import type { Conversation } from '../../types';

const makeConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: 'conv-1',
  customerId: 'cust-1',
  status: 'open',
  channel: 'whatsapp',
  currentMenuLevel: 'main',
  isBotActive: true,
  needsHumanAttention: false,
  metadata: {},
  startedAt: '2024-01-01',
  lastMessageAt: '2024-01-01',
  customer: { id: 'cust-1', name: 'Customer', phoneNumber: '5511999887766' },
  ...overrides,
});

describe('useConversationsStore', () => {
  beforeEach(() => {
    useConversationsStore.setState({
      conversations: [],
      selectedConversation: null,
    });
  });

  it('setConversations replaces array', () => {
    const convs = [makeConversation({ id: 'c1' }), makeConversation({ id: 'c2' })];
    useConversationsStore.getState().setConversations(convs);
    expect(useConversationsStore.getState().conversations).toEqual(convs);
  });

  it('selectConversation sets selected', () => {
    const conv = makeConversation();
    useConversationsStore.getState().selectConversation(conv);
    expect(useConversationsStore.getState().selectedConversation).toEqual(conv);
  });

  it('updateConversation updates in list and selected if same id', () => {
    const conv = makeConversation({ id: 'c1' });
    useConversationsStore.setState({
      conversations: [conv],
      selectedConversation: conv,
    });

    useConversationsStore.getState().updateConversation('c1', { status: 'closed' });

    expect(useConversationsStore.getState().conversations[0].status).toBe('closed');
    expect(useConversationsStore.getState().selectedConversation?.status).toBe('closed');
  });

  it('updateConversation does not update selected if different id', () => {
    const conv1 = makeConversation({ id: 'c1' });
    const conv2 = makeConversation({ id: 'c2' });
    useConversationsStore.setState({
      conversations: [conv1, conv2],
      selectedConversation: conv1,
    });

    useConversationsStore.getState().updateConversation('c2', { status: 'closed' });

    expect(useConversationsStore.getState().selectedConversation?.status).toBe('open');
    expect(useConversationsStore.getState().conversations[1].status).toBe('closed');
  });

  it('addConversation adds at the beginning', () => {
    const existing = makeConversation({ id: 'c1' });
    useConversationsStore.setState({ conversations: [existing] });

    const newConv = makeConversation({ id: 'c2' });
    useConversationsStore.getState().addConversation(newConv);

    const convs = useConversationsStore.getState().conversations;
    expect(convs).toHaveLength(2);
    expect(convs[0].id).toBe('c2');
  });
});
