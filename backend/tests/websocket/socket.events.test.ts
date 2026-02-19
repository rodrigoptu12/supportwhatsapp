import { SocketEvents } from '@/websocket/socket.events';

describe('SocketEvents', () => {
  it('has all required event names', () => {
    expect(SocketEvents.SUBSCRIBE_CONVERSATION).toBe('subscribe:conversation');
    expect(SocketEvents.UNSUBSCRIBE_CONVERSATION).toBe('unsubscribe:conversation');
    expect(SocketEvents.TYPING).toBe('typing');
    expect(SocketEvents.NEW_MESSAGE).toBe('new_message');
    expect(SocketEvents.CONVERSATION_UPDATE).toBe('conversation_update');
    expect(SocketEvents.USER_TYPING).toBe('user_typing');
    expect(SocketEvents.NEW_CONVERSATION).toBe('new_conversation');
    expect(SocketEvents.ATTENDANT_ONLINE).toBe('attendant_online');
    expect(SocketEvents.ATTENDANT_OFFLINE).toBe('attendant_offline');
  });
});
