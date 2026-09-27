import { test, expect } from '@playwright/test';

test.describe('Admin authentication shell', () => {
  test('unauthenticated visitor sees the admin login gate', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#view-login')).toBeVisible();
    await expect(page.locator('#view-denied')).toBeHidden();
    await expect(page.locator('#view-admin')).toBeHidden();
    expect(pageErrors).toEqual([]);
  });
});
