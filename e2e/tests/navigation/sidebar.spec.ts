import { test, expect } from '../../fixtures/base';

test.describe('Sidebar Navigation', () => {
  test('admin sees all navigation items', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(adminPage.getByRole('link', { name: 'Conversas' })).toBeVisible();
    await expect(adminPage.getByRole('link', { name: 'Metricas' })).toBeVisible();
    await expect(adminPage.getByRole('link', { name: 'Configuracoes' })).toBeVisible();
  });

  test('attendant does not see Metricas and Configuracoes', async ({ attendantPage }) => {
    await attendantPage.goto('/');
    await attendantPage.waitForLoadState('networkidle');

    await expect(attendantPage.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(attendantPage.getByRole('link', { name: 'Conversas' })).toBeVisible();
    await expect(attendantPage.getByRole('link', { name: 'Metricas' })).not.toBeVisible();
    await expect(attendantPage.getByRole('link', { name: 'Configuracoes' })).not.toBeVisible();
  });

  test('navigates between pages via sidebar links', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    await adminPage.getByRole('link', { name: 'Conversas' }).click();
    await expect(adminPage).toHaveURL('/conversations');

    await adminPage.getByRole('link', { name: 'Metricas' }).click();
    await expect(adminPage).toHaveURL('/metrics');

    await adminPage.getByRole('link', { name: 'Configuracoes' }).click();
    await expect(adminPage).toHaveURL('/settings');

    await adminPage.getByRole('link', { name: 'Dashboard' }).click();
    await expect(adminPage).toHaveURL('/');
  });
});
