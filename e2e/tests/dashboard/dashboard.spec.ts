import { test, expect } from '../../fixtures/base';

test.describe('Dashboard', () => {
  test('admin sees dashboard with stats cards', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.getByText('Total de Conversas')).toBeVisible();
    await expect(adminPage.getByText('Conversas Abertas')).toBeVisible();
    await expect(adminPage.getByText('Aguardando')).toBeVisible();
    await expect(adminPage.getByText('Finalizadas')).toBeVisible();
  });

  test('attendant sees dashboard with stats cards', async ({ attendantPage }) => {
    await attendantPage.goto('/');
    await attendantPage.waitForLoadState('networkidle');

    await expect(attendantPage.getByText('Total de Conversas')).toBeVisible();
    await expect(attendantPage.getByText('Conversas Abertas')).toBeVisible();
    await expect(attendantPage.getByText('Aguardando')).toBeVisible();
    await expect(attendantPage.getByText('Finalizadas')).toBeVisible();
  });
});
