import { test, expect } from '../../fixtures/base';

test.describe('Bot Configuration', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/settings');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.getByText('Bot').click();
    await adminPage.waitForLoadState('networkidle');
  });

  test('shows bot configuration entries', async ({ adminPage }) => {
    await expect(adminPage.getByText('Boas-vindas', { exact: true })).toBeVisible();
    await expect(adminPage.getByText('Opcoes do Menu', { exact: true })).toBeVisible();
    await expect(adminPage.getByText('Transferencia', { exact: true })).toBeVisible();
    await expect(adminPage.getByText('Erro Generico', { exact: true })).toBeVisible();
  });

  test('edits a bot configuration value', async ({ adminPage }) => {
    // Click the edit button (pencil icon) on the first config row
    const firstRow = adminPage.locator('table tbody tr').first();
    await firstRow.locator('button').first().click();

    // Should show a textarea for editing
    const textarea = adminPage.locator('textarea');
    await expect(textarea).toBeVisible();

    // Modify and save
    await textarea.fill('Nova mensagem de boas-vindas');
    // Click save button (check icon)
    await firstRow.locator('button').first().click();

    await expect(adminPage.getByText('Nova mensagem de boas-vindas')).toBeVisible();
  });
});
