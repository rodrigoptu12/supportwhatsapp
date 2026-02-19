import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import Dashboard from '../Dashboard';
import { conversationsApi } from '../../services/conversations.service';

vi.mock('../../services/api', () => ({
  api: { get: vi.fn() },
}));

vi.mock('../../services/conversations.service', () => ({
  conversationsApi: {
    stats: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('Dashboard page', () => {
  it('renders stats cards after loading', async () => {
    vi.mocked(conversationsApi.stats).mockResolvedValue({
      total: 42,
      open: 10,
      waiting: 5,
      closed: 27,
    });

    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('27')).toBeInTheDocument();
    expect(screen.getByText('Total de Conversas')).toBeInTheDocument();
    expect(screen.getByText('Conversas Abertas')).toBeInTheDocument();
    expect(screen.getByText('Aguardando')).toBeInTheDocument();
    expect(screen.getByText('Finalizadas')).toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    vi.mocked(conversationsApi.stats).mockReturnValue(new Promise(() => {}));

    const { container } = render(<Dashboard />, { wrapper: createWrapper() });
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
