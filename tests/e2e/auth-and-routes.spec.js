// tests/e2e/auth-and-routes.spec.js
// Playwright E2E Tests for HiVocab Core Routes, Auth, ProtectedRoute & Mobile
import { test, expect } from '@playwright/test';

test.describe('HiVocab E2E Navigation & Route Integrity', () => {

  test('1. Landing page (/) renders correctly with hero CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/HiVocab/);

    // Hero title and start learning CTA should be visible
    const heroTitle = page.locator('h1');
    await expect(heroTitle).toBeVisible();

    const startBtn = page.getByRole('button', { name: /Bắt đầu|Học ngay|Trải nghiệm/i }).first();
    await expect(startBtn).toBeVisible();
  });

  test('2. /login route renders form elements', async ({ page }) => {
    await page.goto('/login');

    // Email and password input fields should exist
    const emailInput = page.locator('#login-email, input[type="email"]');
    const passwordInput = page.locator('#login-password, input[type="password"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Login submit button should exist
    const submitBtn = page.locator('#btn-auth-submit, button[type="submit"]');
    await expect(submitBtn).toBeVisible();
  });

  test('3. Protected route (/app) redirects unauthenticated visitors to /login', async ({ page }) => {
    // Clear any existing session or cookies
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (_) {}
    });

    await page.goto('/app');

    // Should be redirected to /login by ProtectedRoute
    await expect(page).toHaveURL(/.*login/);
    const emailInput = page.locator('#login-email, input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('4. Login form rejects empty credentials', async ({ page }) => {
    await page.goto('/login');

    const submitBtn = page.locator('#btn-auth-submit, button[type="submit"]');
    await submitBtn.click();

    // The user should remain on login page (no navigation)
    await expect(page).toHaveURL(/.*login/);
  });

  test('5. Logout flow clears session and returns to landing/login', async ({ page }) => {
    // Mock an active user session in localStorage and window
    await page.addInitScript(() => {
      const mockUser = { id: 'mock-user-123', email: 'test@hivocab.site' };
      localStorage.setItem('sb-swehdtrqjyklmsefkjdf-auth-token', JSON.stringify({ user: mockUser }));
      window._currentUser = mockUser;
    });

    await page.goto('/app');

    // Trigger logout via legacyBridge / AuthProvider
    await page.evaluate(async () => {
      if (typeof window.handleLogout === 'function') {
        await window.handleLogout();
      } else if (typeof window.HiDB !== 'undefined' && typeof window.HiDB.signOut === 'function') {
        await window.HiDB.signOut();
      }
    });

    // Verify session tokens are cleared from storage
    const token = await page.evaluate(() => {
      return localStorage.getItem('sb-swehdtrqjyklmsefkjdf-auth-token');
    });
    expect(token).toBeNull();
  });

  test('6. Session expiration causes ProtectedRoute to intercept and redirect', async ({ page }) => {
    // Start on app
    await page.goto('/login');

    // Attempt direct navigation to protected vocabulary route with expired session
    await page.evaluate(() => {
      window._currentUser = null;
      localStorage.removeItem('sb-swehdtrqjyklmsefkjdf-auth-token');
    });

    await page.goto('/app#vocabulary');
    await expect(page).toHaveURL(/.*login/);
  });

  test('7. Mobile layout renders responsive navigation components', async ({ page, isMobile }) => {
    await page.goto('/');

    if (isMobile) {
      // On mobile viewports, the bottom navigation or mobile menu button should be present
      const mobileNav = page.locator('#mobile-bottom-nav, .mobile-page-top, [aria-label="Hồ sơ"], #mobile-profile-avatar');
      const count = await mobileNav.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

});
