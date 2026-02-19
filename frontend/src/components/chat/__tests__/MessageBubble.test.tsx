import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';
import type { Message } from '../../../types';

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  conversationId: 'conv-1',
  senderType: 'customer',
  content: 'Hello world',
  messageType: 'text',
  isRead: false,
  sentAt: '2024-06-15T14:30:00Z',
  createdAt: '2024-06-15T14:30:00Z',
  ...overrides,
});

describe('MessageBubble', () => {
  it('renders customer text message', () => {
    render(<MessageBubble message={makeMessage()} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders system message centered', () => {
    render(<MessageBubble message={makeMessage({ senderType: 'system', content: 'Conversa transferida' })} />);
    expect(screen.getByText('Conversa transferida')).toBeInTheDocument();
  });

  it('renders bot message with Bot label', () => {
    render(<MessageBubble message={makeMessage({ senderType: 'bot', content: 'Ola!' })} />);
    expect(screen.getByText('Bot')).toBeInTheDocument();
    expect(screen.getByText('Ola!')).toBeInTheDocument();
  });

  it('renders attendant message with sender name', () => {
    render(
      <MessageBubble
        message={makeMessage({
          senderType: 'attendant',
          content: 'Como posso ajudar?',
          senderUser: { id: 'u1', fullName: 'Maria Silva' },
        })}
      />,
    );
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
  });

  it('renders attendant message with fallback when no senderUser', () => {
    render(
      <MessageBubble message={makeMessage({ senderType: 'attendant', content: 'Oi' })} />,
    );
    expect(screen.getByText('Atendente')).toBeInTheDocument();
  });

  it('renders image message with img tag', () => {
    render(
      <MessageBubble
        message={makeMessage({
          messageType: 'image',
          mediaUrl: 'https://example.com/photo.jpg',
          content: 'Uma foto',
        })}
      />,
    );
    const img = screen.getByAltText('Uma foto');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    expect(screen.getByText('Uma foto')).toBeInTheDocument();
  });

  it('renders image message without caption when content is [image]', () => {
    render(
      <MessageBubble
        message={makeMessage({
          messageType: 'image',
          mediaUrl: 'https://example.com/photo.jpg',
          content: '[image]',
        })}
      />,
    );
    expect(screen.getByAltText('[image]')).toBeInTheDocument();
  });

  it('renders audio message with audio element', () => {
    const { container } = render(
      <MessageBubble
        message={makeMessage({
          messageType: 'audio',
          mediaUrl: 'https://example.com/audio.ogg',
          content: '[audio]',
        })}
      />,
    );
    const audio = container.querySelector('audio');
    expect(audio).toBeInTheDocument();
    expect(audio).toHaveAttribute('src', 'https://example.com/audio.ogg');
  });

  it('renders video message with video element', () => {
    const { container } = render(
      <MessageBubble
        message={makeMessage({
          messageType: 'video',
          mediaUrl: 'https://example.com/video.mp4',
          content: '[video]',
        })}
      />,
    );
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
  });

  it('renders document message with download link', () => {
    render(
      <MessageBubble
        message={makeMessage({
          messageType: 'document',
          mediaUrl: 'https://example.com/file.pdf',
          content: 'Relatorio.pdf',
        })}
      />,
    );
    const link = screen.getByText('Relatorio.pdf');
    expect(link.closest('a')).toHaveAttribute('href', 'https://example.com/file.pdf');
  });

  it('renders text content when no mediaUrl even with non-text type', () => {
    render(
      <MessageBubble
        message={makeMessage({
          messageType: 'image',
          mediaUrl: undefined,
          content: 'Fallback text',
        })}
      />,
    );
    expect(screen.getByText('Fallback text')).toBeInTheDocument();
  });

  it('displays formatted time', () => {
    render(<MessageBubble message={makeMessage()} />);
    // Time should be rendered somewhere
    const timeText = screen.getByText(/\d{2}:\d{2}/);
    expect(timeText).toBeInTheDocument();
  });
});
