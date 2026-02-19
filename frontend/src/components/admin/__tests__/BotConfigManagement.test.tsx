import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { BotConfigManagement } from '../BotConfigManagement';
import { botConfigApi } from '../../../services/bot-config.service';

vi.mock('../../../services/api', () => ({
  api: { get: vi.fn(), put: vi.fn() },
}));

vi.mock('../../../services/bot-config.service', () => ({
  botConfigApi: {
    list: vi.fn(),
    update: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockConfigs = [
  { id: '1', key: 'greeting', value: { message: 'Ola! Bem-vindo' }, description: null, isActive: true, createdAt: '', updatedAt: '' },
  { id: '2', key: 'error_message', value: { message: 'Erro generico' }, description: 'Erro padrao', isActive: true, createdAt: '', updatedAt: '' },
];

describe('BotConfigManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(botConfigApi.list).mockReturnValue(new Promise(() => {}));
    render(<BotConfigManagement />, { wrapper: createWrapper() });
    expect(screen.getByText('Carregando configuracoes...')).toBeInTheDocument();
  });

  it('renders config list after loading', async () => {
    vi.mocked(botConfigApi.list).mockResolvedValue(mockConfigs as any);

    render(<BotConfigManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Boas-vindas')).toBeInTheDocument();
    });

    expect(screen.getByText('Erro Generico')).toBeInTheDocument();
    expect(screen.getByText('Ola! Bem-vindo')).toBeInTheDocument();
    expect(screen.getByText('2 configuracao(oes) do bot')).toBeInTheDocument();
  });

  it('shows description when available', async () => {
    vi.mocked(botConfigApi.list).mockResolvedValue(mockConfigs as any);

    render(<BotConfigManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Erro padrao')).toBeInTheDocument();
    });
  });

  it('toggles preview section', async () => {
    const user = userEvent.setup();
    vi.mocked(botConfigApi.list).mockResolvedValue(mockConfigs as any);

    render(<BotConfigManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Preview'));
    expect(screen.getByText('Preview do Fluxo do Bot')).toBeInTheDocument();

    await user.click(screen.getByText('Ocultar Preview'));
    expect(screen.queryByText('Preview do Fluxo do Bot')).not.toBeInTheDocument();
  });

  it('renders empty state', async () => {
    vi.mocked(botConfigApi.list).mockResolvedValue([]);

    render(<BotConfigManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Nenhuma configuracao encontrada/)).toBeInTheDocument();
    });
  });

  it('opens edit mode on pencil click and shows textarea', async () => {
    const user = userEvent.setup();
    vi.mocked(botConfigApi.list).mockResolvedValue(mockConfigs as any);

    render(<BotConfigManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Boas-vindas')).toBeInTheDocument();
    });

    // Click the first edit (pencil) button
    const editButtons = screen.getAllByRole('button').filter((b) => b.querySelector('svg'));
    // Find the pencil button in the actions column (not the Preview button)
    const pencilButtons = screen.getAllByRole('button').filter(
      (b) => !b.textContent?.includes('Preview') && !b.textContent?.includes('Ocultar') && b.closest('td'),
    );
    await user.click(pencilButtons[0]);

    // Should show textarea with current value
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('Ola! Bem-vindo');
  });

  it('saves edited config', async () => {
    const user = userEvent.setup();
    vi.mocked(botConfigApi.list).mockResolvedValue(mockConfigs as any);
    vi.mocked(botConfigApi.update).mockResolvedValue(mockConfigs[0] as any);

    render(<BotConfigManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Boas-vindas')).toBeInTheDocument();
    });

    // Click edit
    const pencilButtons = screen.getAllByRole('button').filter(
      (b) => !b.textContent?.includes('Preview') && !b.textContent?.includes('Ocultar') && b.closest('td'),
    );
    await user.click(pencilButtons[0]);

    // Clear and type new value
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'Nova mensagem');

    // Click save (check button)
    const actionButtons = screen.getAllByRole('button').filter((b) => b.closest('td'));
    await user.click(actionButtons[0]); // First action button is save

    expect(botConfigApi.update).toHaveBeenCalledWith('greeting', 'Nova mensagem');
  });

  it('cancels edit mode', async () => {
    const user = userEvent.setup();
    vi.mocked(botConfigApi.list).mockResolvedValue(mockConfigs as any);

    render(<BotConfigManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Boas-vindas')).toBeInTheDocument();
    });

    // Click edit
    const pencilButtons = screen.getAllByRole('button').filter(
      (b) => !b.textContent?.includes('Preview') && !b.textContent?.includes('Ocultar') && b.closest('td'),
    );
    await user.click(pencilButtons[0]);

    expect(screen.getByRole('textbox')).toBeInTheDocument();

    // Click cancel (X button - second action button)
    const actionButtons = screen.getAllByRole('button').filter((b) => b.closest('td'));
    await user.click(actionButtons[1]);

    // Textarea should be gone
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
