import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '../MessageInput';

describe('MessageInput', () => {
  it('renders input and send button', () => {
    render(<MessageInput onSend={vi.fn()} />);
    expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('accepts custom placeholder', () => {
    render(<MessageInput onSend={vi.fn()} placeholder="Type here..." />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('calls onSend with trimmed text on submit', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    await user.type(screen.getByPlaceholderText('Digite sua mensagem...'), '  Hello  ');
    await user.click(screen.getByRole('button'));

    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('clears input after send', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={vi.fn()} />);

    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    await user.type(input, 'Hello');
    await user.click(screen.getByRole('button'));

    expect(input).toHaveValue('');
  });

  it('does not send empty message', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    await user.type(screen.getByPlaceholderText('Digite sua mensagem...'), '   ');
    await user.click(screen.getByRole('button'));

    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables input and button when disabled prop is true', () => {
    render(<MessageInput onSend={vi.fn()} disabled />);
    expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('submits on Enter key', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    await user.type(screen.getByPlaceholderText('Digite sua mensagem...'), 'Hello{Enter}');

    expect(onSend).toHaveBeenCalledWith('Hello');
  });
});
