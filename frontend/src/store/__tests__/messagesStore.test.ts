import { useMessagesStore } from '../messagesStore';
import type { Message } from '../../types';

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  conversationId: 'conv-1',
  senderType: 'customer',
  content: 'Hello',
  messageType: 'text',
  isRead: false,
  sentAt: '2024-01-01T12:00:00Z',
  createdAt: '2024-01-01T12:00:00Z',
  ...overrides,
});

describe('useMessagesStore', () => {
  beforeEach(() => {
    useMessagesStore.setState({ messages: [] });
  });

  it('setMessages replaces array', () => {
    const msgs = [makeMessage({ id: 'm1' }), makeMessage({ id: 'm2' })];
    useMessagesStore.getState().setMessages(msgs);
    expect(useMessagesStore.getState().messages).toEqual(msgs);
  });

  it('addMessage adds at the end', () => {
    useMessagesStore.setState({ messages: [makeMessage({ id: 'm1' })] });

    useMessagesStore.getState().addMessage(makeMessage({ id: 'm2' }));

    const msgs = useMessagesStore.getState().messages;
    expect(msgs).toHaveLength(2);
    expect(msgs[1].id).toBe('m2');
  });

  it('clearMessages empties array', () => {
    useMessagesStore.setState({ messages: [makeMessage()] });

    useMessagesStore.getState().clearMessages();

    expect(useMessagesStore.getState().messages).toEqual([]);
  });
});
