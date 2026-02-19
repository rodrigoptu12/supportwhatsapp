import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../../fixtures/test-data';
import { test as authTest } from '../../fixtures/base';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders login form with email, password and submit button', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByText('WhatsApp Support')).toBeVisible();
  });

  test('login as admin redirects to dashboard', async ({ page }) => {
    await page.getByLabel('Email').fill(TEST_USERS.admin.email);
    await page.getByLabel('Senha').fill(TEST_USERS.admin.password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('login as attendant redirects to dashboard', async ({ page }) => {
    await page.getByLabel('Email').fill(TEST_USERS.attendant.email);
    await page.getByLabel('Senha').fill(TEST_USERS.attendant.password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('invalid credentials shows error message', async ({ page }) => {
    await page.getByLabel('Email').fill('wrong@email.com');
    await page.getByLabel('Senha').fill('wrongpassword');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByText('Email ou senha invalidos')).toBeVisible();
  });
});

authTest.describe('Logout', () => {
  authTest('logout redirects to login page', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    await adminPage.locator('button[title="Sair"]').click();

    await expect(adminPage).toHaveURL('/login');
  });
});
