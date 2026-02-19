import { test, expect } from '../../fixtures/base';
import { DEPARTMENTS } from '../../fixtures/test-data';

test.describe('Departments Management', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/settings');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.getByText('Setores').click();
    await adminPage.waitForLoadState('networkidle');
  });

  test('shows seed departments', async ({ adminPage }) => {
    for (const dept of DEPARTMENTS) {
      await expect(adminPage.getByText(dept)).toBeVisible();
    }
  });

  test('creates a new department', async ({ adminPage }) => {
    await adminPage.getByRole('button', { name: 'Novo Setor' }).click();
    await adminPage.getByPlaceholder('Nome do setor').fill('Setor E2E');
    await adminPage.getByPlaceholder('Descricao (opcional)').fill('Criado pelo teste E2E');
    await adminPage.getByRole('button', { name: 'Salvar' }).click();

    await expect(adminPage.getByText('Setor E2E')).toBeVisible();
  });

  test('toggles department active/inactive status', async ({ adminPage }) => {
    const firstStatusBadge = adminPage.getByText('Ativo').first();
    await firstStatusBadge.click();

    await expect(adminPage.getByText('Inativo').first()).toBeVisible();
  });

  test('deletes a department', async ({ adminPage }) => {
    // First create one to delete
    await adminPage.getByRole('button', { name: 'Novo Setor' }).click();
    await adminPage.getByPlaceholder('Nome do setor').fill('Setor Para Deletar');
    await adminPage.getByRole('button', { name: 'Salvar' }).click();
    await expect(adminPage.getByText('Setor Para Deletar')).toBeVisible();

    // Accept the confirmation dialog
    adminPage.on('dialog', (dialog) => dialog.accept());

    // Click delete on the last row (the one we just created)
    const rows = adminPage.locator('table tbody tr');
    const lastRow = rows.last();
    await lastRow.locator('button').last().click();

    await expect(adminPage.getByText('Setor Para Deletar')).not.toBeVisible();
  });
});
