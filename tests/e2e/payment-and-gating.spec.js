// tests/e2e/payment-and-gating.spec.js
// Playwright E2E Test Suite for HiVocab Commercialization: Payment Flow, PayOS QR & Content Gating
// Tiers: Tier 1 (Feature Coverage), Tier 2 (Boundary/Corner), Tier 3 (Cross-Feature), Tier 4 (Real-World)

import { test, expect } from '@playwright/test';

// Standard storage key for Supabase Auth
const AUTH_TOKEN_KEY = 'sb-swehdtrqjyklmsefkjdf-auth-token';

function createMockSession(user) {
  const nowSec = Math.floor(Date.now() / 1000);
  return {
    access_token: 'mock-jwt-access-token-xyz',
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: nowSec + 86400,
    refresh_token: 'mock-refresh-token-xyz',
    user,
  };
}

test.describe('HiVocab E2E: Payment & Content Gating Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Intercept Cloudflare Turnstile / analytics to keep tests isolated & fast
    await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
    await page.route('**/auth/v1/session*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session: null }),
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TIER 1: Feature Coverage (Core Happy Path)
  // ───────────────────────────────────────────────────────────────────────────

  test('Tier 1: PricingModal displays all 4 subscription plans with correct pricing and perks', async ({ page }) => {
    const freeUser = { id: 'free-user-001', email: 'freeuser@hivocab.test' };
    const freeProfile = {
      id: freeUser.id,
      email: freeUser.email,
      full_name: 'Học viên Miễn phí',
      role: 'user',
      tier: 'free',
      subscription_plan: null,
      subscription_expires_at: null,
    };

    await page.addInitScript(({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
      sessionStorage.setItem('hivocab_guest_entered', '1');
      window._currentUser = session.user;
    }, { key: AUTH_TOKEN_KEY, session: createMockSession(freeUser) });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(freeProfile),
      });
    });

    await page.goto('/#dashboard');

    // Trigger PricingModal
    await page.evaluate(() => {
      if (window.__modalContext?.openModal) {
        window.__modalContext.openModal('pricingModal', { defaultPlanId: 'pro_6m' });
      }
    });

    // Verify modal header
    const modalHeading = page.locator('h2').filter({ hasText: /Bứt Phá Điểm Số Cùng HiVocab PRO/i });
    await expect(modalHeading).toBeVisible({ timeout: 5000 });

    // Verify 4 plans and exact prices
    await expect(page.getByText('29.000đ', { exact: true })).toBeVisible();
    await expect(page.getByText('149.000đ', { exact: true })).toBeVisible();
    await expect(page.getByText('249.000đ', { exact: true })).toBeVisible();
    await expect(page.getByText('499.000đ', { exact: true })).toBeVisible();

    // Verify plan names
    await expect(page.getByText('Gói 1 Tháng', { exact: true })).toBeVisible();
    await expect(page.getByText('Gói 6 Tháng', { exact: true })).toBeVisible();
    await expect(page.getByText('Gói 1 Năm', { exact: true })).toBeVisible();
    await expect(page.getByText('Gói Trọn Đời', { exact: true })).toBeVisible();

    // Verify action checkout button exists
    const checkoutBtn = page.getByRole('button', { name: /Thanh toán ngay/i });
    await expect(checkoutBtn).toBeVisible();
  });

  test('Tier 1: Selecting plan triggers /api/payment/create-order and shows VietQR checkout preview', async ({ page }) => {
    const freeUser = { id: 'free-user-002', email: 'checkout@hivocab.test' };
    const freeProfile = {
      id: freeUser.id,
      email: freeUser.email,
      full_name: 'Học viên Test',
      role: 'user',
      tier: 'free',
      subscription_plan: null,
      subscription_expires_at: null,
    };

    await page.addInitScript(({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
      sessionStorage.setItem('hivocab_guest_entered', '1');
      window._currentUser = session.user;
    }, { key: AUTH_TOKEN_KEY, session: createMockSession(freeUser) });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(freeProfile),
      });
    });

    let createOrderCalled = false;
    let requestedPlanId = null;

    await page.route('**/api/payment/create-order', async (route) => {
      createOrderCalled = true;
      const postData = JSON.parse(route.request().postData() || '{}');
      requestedPlanId = postData.planId;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          orderCode: 98765432,
          amount: 149000,
          description: 'HV98765432',
          qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="orange" width="100" height="100"/></svg>',
        }),
      });
    });

    await page.route('**/api/payment/check-status*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, status: 'PENDING', paid: false }),
      });
    });

    await page.goto('/#dashboard');

    await page.evaluate(() => {
      window.__modalContext?.openModal('pricingModal', { defaultPlanId: 'pro_6m' });
    });

    const checkoutBtn = page.getByRole('button', { name: /Thanh toán ngay/i });
    await expect(checkoutBtn).toBeVisible({ timeout: 5000 });
    await checkoutBtn.click();

    // Verify create-order was called with pro_6m
    await expect(async () => {
      expect(createOrderCalled).toBe(true);
      expect(requestedPlanId).toBe('pro_6m');
    }).toPass({ timeout: 5000 });

    // Verify checkout view with orderCode and description
    await expect(page.getByText('98765432', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('HV98765432', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Hướng dẫn chuyển khoản:')).toBeVisible();
    await expect(page.locator('img[alt="VietQR PayOS"]')).toBeVisible();
  });

  test('Tier 1: Status polling detects PAID status and triggers celebration view without reload', async ({ page }) => {
    const freeUser = { id: 'free-user-003', email: 'poll@hivocab.test' };
    const initialProfile = {
      id: freeUser.id,
      email: freeUser.email,
      full_name: 'Học viên Polling',
      role: 'user',
      tier: 'free',
      subscription_plan: null,
      subscription_expires_at: null,
    };

    await page.addInitScript(({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
      sessionStorage.setItem('hivocab_guest_entered', '1');
      window._currentUser = session.user;
    }, { key: AUTH_TOKEN_KEY, session: createMockSession(freeUser) });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(initialProfile),
      });
    });

    await page.route('**/api/payment/create-order', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          orderCode: 11223344,
          amount: 149000,
          description: 'HV11223344',
          qrCode: 'data:image/svg+xml;utf8,<svg width="10" height="10"></svg>',
        }),
      });
    });

    // Check status immediately returns PAID on first check
    await page.route('**/api/payment/check-status*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          status: 'PAID',
          paid: true,
          orderCode: 11223344,
          planId: 'pro_6m',
        }),
      });
    });

    await page.goto('/#dashboard');

    await page.evaluate(() => {
      window.__modalContext?.openModal('pricingModal', { defaultPlanId: 'pro_6m' });
    });

    await page.getByRole('button', { name: /Thanh toán ngay/i }).click();

    // Verify polling triggers success view
    const successTitle = page.locator('h3').filter({ hasText: /Nâng Cấp PRO Thành Công! 🎉/i });
    await expect(successTitle).toBeVisible({ timeout: 8000 });

    const startStudyBtn = page.getByRole('button', { name: /Bắt đầu học ngay 🚀/i });
    await expect(startStudyBtn).toBeVisible();
    await startStudyBtn.click();

    // Verify modal closes
    await expect(successTitle).not.toBeVisible();
  });

  test('Tier 1: Pro user directly accesses gated THPT exam room without modal barrier', async ({ page }) => {
    const proUser = { id: 'pro-user-001', email: 'prouser@hivocab.test' };
    const proProfile = {
      id: proUser.id,
      email: proUser.email,
      full_name: 'Học viên Pro Thật',
      role: 'user',
      tier: 'pro',
      subscription_plan: 'pro_1y',
      subscription_expires_at: '2028-01-01T00:00:00Z',
    };

    await page.addInitScript(({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
      sessionStorage.setItem('hivocab_guest_entered', '1');
      window._currentUser = session.user;
    }, { key: AUTH_TOKEN_KEY, session: createMockSession(proUser) });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(proProfile),
      });
    });

    const mockExam = {
      id: 'thpt_2024_pro_test',
      title: 'Đề Thi Thử THPT Quốc Gia Chuyên Sư Phạm 2024 (PRO)',
      year: 2024,
      difficulty: 'hard',
      is_pro: true,
      total_questions: 10,
      duration_minutes: 50,
      questions: [
        { id: 1, question: 'Choose the correct word: The results were _____ unexpected.', options: ['quite', 'quiet', 'quit', 'quilt'], answer: 0 },
      ],
    };

    await page.addInitScript(({ exam }) => {
      sessionStorage.setItem('thpt_exams_summaries_v20261030', JSON.stringify([exam]));
      window._thptStartConfig = { examId: exam.id, minutes: 50, is_pro: true };
    }, { exam: mockExam });

    await page.route('**/rest/v1/thpt_exams*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockExam),
      });
    });

    await page.route('**/data/thpt_exams.json*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockExam]),
      });
    });

    await page.goto('/#thpt-room');

    // As a PRO user, no CrayonLockOverlay should appear, and exam room renders
    await expect(page.locator('text=NỘI DUNG ĐỘC QUYỀN PRO')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('#page-thpt-room')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Choose the correct word/i)).toBeVisible({ timeout: 8000 });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TIER 2: Boundary & Corner Cases (Error Paths & Edge Cases)
  // ───────────────────────────────────────────────────────────────────────────

  test('Tier 2: /api/payment/create-order failure displays error banner gracefully', async ({ page }) => {
    const freeUser = { id: 'free-user-err-1', email: 'err@hivocab.test' };
    const freeProfile = {
      id: freeUser.id,
      email: freeUser.email,
      full_name: 'User Error Test',
      role: 'user',
      tier: 'free',
      subscription_plan: null,
      subscription_expires_at: null,
    };

    await page.addInitScript(({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
      sessionStorage.setItem('hivocab_guest_entered', '1');
      window._currentUser = session.user;
    }, { key: AUTH_TOKEN_KEY, session: createMockSession(freeUser) });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(freeProfile),
      });
    });

    await page.route('**/api/payment/create-order', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          error: 'Cổng thanh toán PayOS đang bảo trì định kỳ. Vui lòng thử lại sau ít phút.',
        }),
      });
    });

    await page.goto('/#dashboard');

    await page.evaluate(() => {
      window.__modalContext?.openModal('pricingModal', { defaultPlanId: 'pro_6m' });
    });

    await page.getByRole('button', { name: /Thanh toán ngay/i }).click();

    // Verify error banner is displayed (use .first() to avoid strict mode with toast alert)
    const errorBanner = page.locator('text=Cổng thanh toán PayOS đang bảo trì định kỳ').first();
    await expect(errorBanner).toBeVisible({ timeout: 5000 });

    // Verify modal remains in selection view (did not break)
    await expect(page.getByRole('button', { name: /Thanh toán ngay/i })).toBeVisible();
  });

  test('Tier 2: Status polling resilient against temporary 503 network drops', async ({ page }) => {
    const freeUser = { id: 'free-user-retry', email: 'retry@hivocab.test' };
    const freeProfile = {
      id: freeUser.id,
      email: freeUser.email,
      role: 'user',
      tier: 'free',
    };

    await page.addInitScript(({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
      sessionStorage.setItem('hivocab_guest_entered', '1');
      window._currentUser = session.user;
    }, { key: AUTH_TOKEN_KEY, session: createMockSession(freeUser) });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(freeProfile),
      });
    });

    await page.route('**/api/payment/create-order', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          orderCode: 55667788,
          amount: 29000,
          description: 'HV55667788',
          qrCode: 'data:image/svg+xml;utf8,<svg width="10" height="10"></svg>',
        }),
      });
    });

    let checkCalls = 0;
    await page.route('**/api/payment/check-status*', async (route) => {
      checkCalls++;
      if (checkCalls === 1) {
        await route.fulfill({ status: 503, body: 'Service Temporarily Unavailable' });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, status: 'PAID', paid: true }),
        });
      }
    });

    await page.goto('/#dashboard');
    await page.waitForFunction(() => Boolean(window.__modalContext?.openModal), null, { timeout: 8000 });

    await page.evaluate(() => {
      window.__modalContext?.openModal('pricingModal', { defaultPlanId: 'pro_1m' });
    });

    await page.getByRole('button', { name: /Thanh toán ngay/i }).click();

    // Verify system successfully transitions to success view despite the 503 glitch
    await expect(page.locator('h3').filter({ hasText: /Nâng Cấp PRO Thành Công! 🎉/i })).toBeVisible({ timeout: 15000 });
  });

  test('Tier 2: Unauthenticated guest attempting checkout redirects or prompts login', async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.setItem('hivocab_guest_entered', '1');
    });

    await page.goto('/#dashboard');

    await page.evaluate(() => {
      window.__modalContext?.openModal('pricingModal', { defaultPlanId: 'pro_6m' });
    });

    const checkoutBtn = page.getByRole('button', { name: /Thanh toán ngay/i });
    await expect(checkoutBtn).toBeVisible({ timeout: 5000 });
    await checkoutBtn.click();

    // Should prompt error toast about login requirement
    const toastMessage = page.locator('text=Vui lòng đăng nhập tài khoản để nâng cấp gói PRO');
    await expect(toastMessage).toBeVisible({ timeout: 5000 });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TIER 3: Cross-Feature Integration (Content Gating Triggers & In-Place Unlock)
  // ───────────────────────────────────────────────────────────────────────────

  test('Tier 3: Free user clicking locked THPT Exam card opens PricingModal', async ({ page }) => {
    const freeUser = { id: 'free-user-exam', email: 'freeexam@hivocab.test' };
    const freeProfile = {
      id: freeUser.id,
      email: freeUser.email,
      role: 'user',
      tier: 'free',
    };

    await page.addInitScript(({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
      sessionStorage.setItem('hivocab_guest_entered', '1');
      window._currentUser = session.user;
    }, { key: AUTH_TOKEN_KEY, session: createMockSession(freeUser) });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(freeProfile),
      });
    });

    const mockProExam = {
      id: 'thpt_chuyen_sphn_pro',
      title: 'Đề Thi Thử Chuyên ĐH Sư Phạm Hà Nội 2024',
      year: 2024,
      difficulty: 'hard',
      is_pro: true,
      total_questions: 50,
      duration_minutes: 50,
    };

    await page.addInitScript(({ exam }) => {
      sessionStorage.setItem('thpt_exams_summaries_v20261030', JSON.stringify([exam]));
    }, { exam: mockProExam });

    await page.goto('/#exercises');

    const examCard = page
      .locator('#page-exercises')
      .getByText('Đề Thi Thử Chuyên ĐH Sư Phạm Hà Nội 2024')
      .locator('visible=true')
      .first();
    await expect(examCard).toBeVisible({ timeout: 8000 });

    // Verify lock badge is displayed on card
    await expect(page.locator('#page-exercises').getByText('Gói PRO').locator('visible=true').first()).toBeVisible();

    // Click locked card
    await examCard.click();

    // Verify PricingModal opened automatically
    await expect(page.locator('h2').filter({ hasText: /Bứt Phá Điểm Số Cùng HiVocab PRO/i })).toBeVisible();
  });

  test('Tier 3: In-place reactive unlock: payment success updates profile and unlocks content without window reload', async ({ page }) => {
    const testUser = { id: 'reactive-unlock-user', email: 'reactive@hivocab.test' };
    let isUserProStatus = false;

    await page.addInitScript(({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
      sessionStorage.setItem('hivocab_guest_entered', '1');
      window._currentUser = session.user;
    }, { key: AUTH_TOKEN_KEY, session: createMockSession(testUser) });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: testUser.id,
          email: testUser.email,
          role: 'user',
          tier: isUserProStatus ? 'pro' : 'free',
          subscription_plan: isUserProStatus ? 'pro_6m' : null,
          subscription_expires_at: isUserProStatus ? '2027-01-01T00:00:00Z' : null,
        }),
      });
    });

    await page.route('**/api/payment/create-order', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          orderCode: 99887766,
          amount: 149000,
          description: 'HV99887766',
          qrCode: 'data:image/svg+xml;utf8,<svg width="10" height="10"></svg>',
        }),
      });
    });

    await page.route('**/api/payment/check-status*', async (route) => {
      isUserProStatus = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          status: 'PAID',
          paid: true,
          orderCode: 99887766,
        }),
      });
    });

    await page.goto('/#dashboard');

    await page.evaluate(() => {
      window.__modalContext?.openModal('pricingModal', { defaultPlanId: 'pro_6m' });
    });

    await page.getByRole('button', { name: /Thanh toán ngay/i }).click();

    // Wait for success screen
    await expect(page.locator('h3').filter({ hasText: /Nâng Cấp PRO Thành Công! 🎉/i })).toBeVisible({ timeout: 8000 });

    // Close modal via start learning button
    await page.getByRole('button', { name: /Bắt đầu học ngay 🚀/i }).click();

    // Verify window global is updated reactively
    const isProGlobally = await page.evaluate(() => window._isUserPro);
    expect(isProGlobally).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TIER 4: Real-World Scenarios (End-to-End User Journeys)
  // ───────────────────────────────────────────────────────────────────────────

  test('Tier 4: Complete user journey: Plan selection -> Plan switching -> QR checkout -> Polling unlock', async ({ page }) => {
    const freeUser = { id: 'journey-user-01', email: 'journey@hivocab.test' };
    const freeProfile = {
      id: freeUser.id,
      email: freeUser.email,
      role: 'user',
      tier: 'free',
    };

    await page.addInitScript(({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
      sessionStorage.setItem('hivocab_guest_entered', '1');
      window._currentUser = session.user;
    }, { key: AUTH_TOKEN_KEY, session: createMockSession(freeUser) });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(freeProfile),
      });
    });

    let checkoutPayload = null;
    await page.route('**/api/payment/create-order', async (route) => {
      checkoutPayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          orderCode: 44556677,
          amount: 499000,
          description: 'HV44556677',
          qrCode: 'data:image/svg+xml;utf8,<svg width="10" height="10"></svg>',
        }),
      });
    });

    await page.route('**/api/payment/check-status*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, status: 'PAID', paid: true }),
      });
    });

    await page.goto('/#dashboard');

    await page.evaluate(() => {
      window.__modalContext?.openModal('pricingModal', { defaultPlanId: 'pro_6m' });
    });

    // User switches from default (6 Months) to 1 Month
    await page.getByText('Gói 1 Tháng', { exact: true }).click();
    await expect(page.locator('text=Dành cho người mới')).toBeVisible();

    // User switches to 1 Year
    await page.getByText('Gói 1 Năm', { exact: true }).click();
    await expect(page.locator('text=Tiết kiệm hơn 60%')).toBeVisible();

    // User finally decides on Lifetime (Trọn Đời)
    await page.getByText('Gói Trọn Đời', { exact: true }).click();
    await expect(page.locator('text=Không gia hạn thêm')).toBeVisible();

    // Click checkout
    await page.getByRole('button', { name: /Thanh toán ngay/i }).click();

    // Verify API was called with pro_lifetime
    await expect(async () => {
      expect(checkoutPayload?.planId).toBe('pro_lifetime');
    }).toPass({ timeout: 5000 });

    // Verify QR checkout view renders with correct order code
    await expect(page.getByText('44556677', { exact: true })).toBeVisible({ timeout: 5000 });

    // Polling completes and displays celebration
    await expect(page.locator('h3').filter({ hasText: /Nâng Cấp PRO Thành Công! 🎉/i })).toBeVisible({ timeout: 8000 });
  });

});
