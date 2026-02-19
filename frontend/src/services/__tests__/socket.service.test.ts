import { io } from 'socket.io-client';
import { socketService } from '../socket.service';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  once: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  removeAllListeners: vi.fn(),
  connected: false,
  id: 'socket-123',
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

describe('socketService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the internal socket to null by disconnecting
    socketService.disconnect();
    mockSocket.connected = false;
  });

  describe('connect', () => {
    it('creates socket with token', () => {
      socketService.connect('test-token');

      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: { token: 'test-token' },
          transports: ['websocket', 'polling'],
        }),
      );
    });

    it('does not create duplicate socket', () => {
      socketService.connect('token-1');
      const callCount = vi.mocked(io).mock.calls.length;
      socketService.connect('token-2');

      expect(vi.mocked(io).mock.calls.length).toBe(callCount);
    });

    it('registers connect, disconnect, and connect_error handlers', () => {
      socketService.connect('test-token');

      const onCalls = mockSocket.on.mock.calls;
      const events = onCalls.map((c: [string, ...unknown[]]) => c[0]);
      expect(events).toContain('connect');
      expect(events).toContain('disconnect');
      expect(events).toContain('connect_error');
    });

    it('connect handler logs socket id', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      socketService.connect('test-token');

      const connectCall = mockSocket.on.mock.calls.find((c: [string, ...unknown[]]) => c[0] === 'connect');
      connectCall![1]();

      expect(consoleSpy).toHaveBeenCalledWith('WebSocket connected, id:', 'socket-123');
      consoleSpy.mockRestore();
    });

    it('disconnect handler logs reason', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      socketService.connect('test-token');

      const disconnectCall = mockSocket.on.mock.calls.find((c: [string, ...unknown[]]) => c[0] === 'disconnect');
      disconnectCall![1]('io server disconnect');

      expect(consoleSpy).toHaveBeenCalledWith('WebSocket disconnected:', 'io server disconnect');
      consoleSpy.mockRestore();
    });

    it('connect_error handler logs error message', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      socketService.connect('test-token');

      const errorCall = mockSocket.on.mock.calls.find((c: [string, ...unknown[]]) => c[0] === 'connect_error');
      errorCall![1]({ message: 'auth failed' });

      expect(consoleSpy).toHaveBeenCalledWith('WebSocket connection error:', 'auth failed');
      consoleSpy.mockRestore();
    });
  });

  describe('disconnect', () => {
    it('removes listeners and disconnects', () => {
      socketService.connect('test-token');
      socketService.disconnect();

      expect(mockSocket.removeAllListeners).toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('does nothing if no socket', () => {
      // Already disconnected in beforeEach
      socketService.disconnect();
      // Should not throw
    });
  });

  describe('subscribeConversation', () => {
    it('emits when connected', () => {
      socketService.connect('test-token');
      mockSocket.connected = true;

      socketService.subscribeConversation('conv-1');

      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe:conversation', 'conv-1');
    });

    it('uses once when not connected', () => {
      socketService.connect('test-token');
      mockSocket.connected = false;

      socketService.subscribeConversation('conv-1');

      expect(mockSocket.once).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    it('once callback emits subscribe after connect', () => {
      socketService.connect('test-token');
      mockSocket.connected = false;

      socketService.subscribeConversation('conv-1');

      const onceCall = mockSocket.once.mock.calls.find((c: [string, ...unknown[]]) => c[0] === 'connect');
      onceCall![1]();

      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe:conversation', 'conv-1');
    });
  });

  describe('unsubscribeConversation', () => {
    it('emits unsubscribe event', () => {
      socketService.connect('test-token');

      socketService.unsubscribeConversation('conv-1');

      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe:conversation', 'conv-1');
    });
  });

  describe('sendTyping', () => {
    it('emits typing event', () => {
      socketService.connect('test-token');

      socketService.sendTyping('conv-1');

      expect(mockSocket.emit).toHaveBeenCalledWith('typing', 'conv-1');
    });
  });

  describe('on', () => {
    it('registers event listener', () => {
      socketService.connect('test-token');
      const callback = vi.fn();

      socketService.on('message', callback);

      expect(mockSocket.on).toHaveBeenCalledWith('message', callback);
    });
  });

  describe('off', () => {
    it('removes event listener', () => {
      socketService.connect('test-token');
      const callback = vi.fn();

      socketService.off('message', callback);

      expect(mockSocket.off).toHaveBeenCalledWith('message', callback);
    });
  });

  describe('getSocket', () => {
    it('returns socket instance after connect', () => {
      socketService.connect('test-token');
      expect(socketService.getSocket()).toBe(mockSocket);
    });

    it('returns null before connect', () => {
      expect(socketService.getSocket()).toBeNull();
    });
  });
});
