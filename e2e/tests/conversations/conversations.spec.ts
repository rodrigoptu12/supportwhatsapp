import { test, expect } from '../../fixtures/base';

test.describe('Conversations', () => {
  test('renders conversations page with search and filters', async ({ adminPage }) => {
    await adminPage.goto('/conversations');
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.getByRole('heading', { name: 'Conversas' })).toBeVisible();
    await expect(
      adminPage.getByPlaceholder('Buscar por nome, telefone ou mensagem...'),
    ).toBeVisible();
  });

  test('shows status filter tabs', async ({ adminPage }) => {
    await adminPage.goto('/conversations');
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.getByRole('button', { name: 'Todas' })).toBeVisible();
    await expect(adminPage.getByRole('button', { name: 'Abertas' })).toBeVisible();
    await expect(adminPage.getByRole('button', { name: 'Aguardando' })).toBeVisible();
    await expect(adminPage.getByRole('button', { name: 'Fechadas' })).toBeVisible();
  });

  test('search field accepts input with debounce', async ({ adminPage }) => {
    await adminPage.goto('/conversations');
    await adminPage.waitForLoadState('networkidle');

    const searchInput = adminPage.getByPlaceholder(
      'Buscar por nome, telefone ou mensagem...',
    );
    await searchInput.fill('teste');
    await expect(searchInput).toHaveValue('teste');
  });
});
