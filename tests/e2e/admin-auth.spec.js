import { test, expect } from '@playwright/test';

test.describe('Admin authentication shell', () => {
  test('unauthenticated visitor sees the admin login gate', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /HiVocab Studio Admin/i })).toBeVisible();
    await expect(page.getByLabel(/Email Quản trị viên/i)).toBeVisible();
    await expect(page.getByLabel(/Mật khẩu/i)).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});
