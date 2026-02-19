import { test, expect } from '../../fixtures/base';
import { TEST_USERS } from '../../fixtures/test-data';

test.describe('Users Management', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/settings');
    await adminPage.waitForLoadState('networkidle');
    // Users tab is the default active tab
  });

  test('lists users with their roles', async ({ adminPage }) => {
    await expect(adminPage.getByText(TEST_USERS.admin.fullName)).toBeVisible();
    await expect(adminPage.getByText(TEST_USERS.attendant.fullName)).toBeVisible();
    await expect(adminPage.getByText('Admin')).toBeVisible();
    await expect(adminPage.getByText('Atendente')).toBeVisible();
  });

  test('opens department assignment modal for a user', async ({ adminPage }) => {
    // Click "Setores" button for the attendant
    const attendantRow = adminPage.getByText(TEST_USERS.attendant.fullName).locator('..');
    await attendantRow.locator('..').getByRole('button', { name: 'Setores' }).click();

    await expect(
      adminPage.getByText(`Setores de ${TEST_USERS.attendant.fullName}`),
    ).toBeVisible();
  });

  test('saves department assignment', async ({ adminPage }) => {
    const attendantRow = adminPage.getByText(TEST_USERS.attendant.fullName).locator('..');
    await attendantRow.locator('..').getByRole('button', { name: 'Setores' }).click();

    await expect(
      adminPage.getByText(`Setores de ${TEST_USERS.attendant.fullName}`),
    ).toBeVisible();

    await adminPage.getByRole('button', { name: 'Salvar' }).click();

    // Modal should close after saving
    await expect(
      adminPage.getByText(`Setores de ${TEST_USERS.attendant.fullName}`),
    ).not.toBeVisible();
  });
});
