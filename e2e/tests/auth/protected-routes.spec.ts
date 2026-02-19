import { test, expect } from '@playwright/test';

test.describe('Protected Routes', () => {
  const protectedRoutes = [
    { path: '/', name: 'Dashboard' },
    { path: '/conversations', name: 'Conversations' },
    { path: '/metrics', name: 'Metrics' },
    { path: '/settings', name: 'Settings' },
  ];

  for (const route of protectedRoutes) {
    test(`${route.path} redirects to /login without auth`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL('/login');
    });
  }
});
