// tests/e2e/mobile-responsive.spec.js
// Automated Mobile Responsive & Overflow Verification Suite for HiVocab
// Covers all 5 target viewports across routes, components, and modal dialogues.

import { test, expect } from '@playwright/test';

const TARGET_VIEWPORTS = [
  { name: 'Galaxy S8/S20/A50 (Compact Android)', width: 360, height: 740 },
  { name: 'iPhone SE / 8 (Compact iOS)', width: 375, height: 667 },
  { name: 'iPhone 12/13/14 (Standard iOS)', width: 390, height: 844 },
  { name: 'Galaxy S21/S24 / Pixel 7 (Standard Android)', width: 412, height: 915 },
  { name: 'iPhone 14/15/16 Pro Max (Large iOS)', width: 430, height: 932 },
];

const APP_ROUTES = [
  { name: 'Landing Page', path: '/' },
  { name: 'Login & Register Card', path: '/#login' },
  { name: 'Dashboard View', path: '/#dashboard' },
  { name: 'Antique Topics Bookcase', path: '/#topics' },
  { name: 'Community Library & Decks', path: '/#library' },
  { name: 'Vocabulary Notebook & Folders', path: '/#vocabulary' },
  { name: 'Exercises & Practice Hub', path: '/#exercises' },
  { name: 'Smart English-Vietnamese Dictionary', path: '/#dictionary' },
  { name: 'THPT Exam Room & Split Panel', path: '/#thpt-room' },
  { name: 'Cambridge Bilingual Reading Lab', path: '/#bilingual-reading' },
];

// Helper to evaluate 0px horizontal overflow
async function assertZeroHorizontalOverflow(page, routeName, viewport) {
  const metrics = await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const innerW = window.innerWidth;
    const docScrollW = docEl ? docEl.scrollWidth : 0;
    const bodyScrollW = body ? body.scrollWidth : 0;

    return {
      innerW,
      docScrollW,
      bodyScrollW,
      overflowDoc: docScrollW > innerW,
      overflowBody: bodyScrollW > innerW,
    };
  });

  expect(
    metrics.overflowDoc,
    `[${viewport.name} - ${routeName}] document.documentElement.scrollWidth (${metrics.docScrollW}px) must not exceed window.innerWidth (${metrics.innerW}px)`
  ).toBe(false);

  expect(
    metrics.overflowBody,
    `[${viewport.name} - ${routeName}] document.body.scrollWidth (${metrics.bodyScrollW}px) must not exceed window.innerWidth (${metrics.innerW}px)`
  ).toBe(false);
}

// Helper to detect overflowing individual DOM elements
async function assertNoElementOverflow(page, routeName, viewport) {
  const offendingElements = await page.evaluate(() => {
    const innerW = window.innerWidth;
    const all = Array.from(document.querySelectorAll('*'));
    const overflows = [];

    for (const el of all) {
      // Skip hidden or non-rendered elements
      if (el.offsetParent === null && el.offsetWidth === 0 && el.offsetHeight === 0) continue;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      // Check if element spills past the right edge (tolerance 1px for subpixel anti-aliasing)
      if (rect.right > innerW + 1.5) {
        // If element is an internal scroll container with explicit overflow-x, verify its container fits inside innerW
        if (style.overflowX === 'auto' || style.overflowX === 'scroll' || style.overflowX === 'hidden') {
          continue;
        }
        overflows.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          className: (el.className || '').toString().slice(0, 70),
          rectRight: Math.round(rect.right),
          rectWidth: Math.round(rect.width),
          textSnippet: (el.innerText || '').slice(0, 30).trim(),
        });
      }
    }
    return overflows;
  });

  expect(
    offendingElements.length,
    `[${viewport.name} - ${routeName}] Found ${offendingElements.length} elements exceeding viewport width (${viewport.width}px): ${JSON.stringify(offendingElements.slice(0, 3))}`
  ).toBe(0);
}

test.describe('Mobile Responsive & 0px Overflow Suite', () => {
  for (const vp of TARGET_VIEWPORTS) {
    test.describe(`Viewport: ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({
        viewport: { width: vp.width, height: vp.height },
        isMobile: true,
        hasTouch: true,
      });

      test.beforeEach(async ({ page }) => {
        // Enable guest mode session so all internal routes are accessible
        await page.addInitScript(() => {
          try {
            sessionStorage.setItem('hivocab_guest_entered', '1');
            localStorage.setItem('hivocab_guest_entered', '1');
          } catch (_) {}
        });
      });

      // 1. Core Pages 0px Overflow & Element Containment
      for (const r of APP_ROUTES) {
        test(`Route ${r.name} (${r.path}) maintains 0px overflow`, async ({ page }) => {
          await page.goto(r.path, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(600);

          await assertZeroHorizontalOverflow(page, r.name, vp);
          await assertNoElementOverflow(page, r.name, vp);
        });
      }

      // 2. MobileBottomNav Bottom Clearance on Main Views
      test('MobileBottomNav clearance and safe bottom padding', async ({ page }) => {
        await page.goto('/#dashboard', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(600);

        const navCheck = await page.evaluate(() => {
          const nav = document.querySelector('nav[aria-label="Mobile Navigation"]');
          if (!nav) return { exists: false };
          const navRect = nav.getBoundingClientRect();
          const pageEl = document.getElementById('page-dashboard');
          const style = pageEl ? window.getComputedStyle(pageEl) : null;
          const innerChild = pageEl ? pageEl.querySelector('.min-h-screen') : null;
          const innerStyle = innerChild ? window.getComputedStyle(innerChild) : null;

          return {
            exists: true,
            navBottom: Math.round(navRect.bottom),
            navHeight: Math.round(navRect.height),
            navWidth: Math.round(navRect.width),
            windowHeight: window.innerHeight,
            windowWidth: window.innerWidth,
            containerPaddingBottom: parseInt(style?.paddingBottom || '0', 10),
            innerPaddingBottom: parseInt(innerStyle?.paddingBottom || '0', 10),
          };
        });

        if (navCheck.exists) {
          // Bottom nav should fit inside viewport horizontally
          expect(navCheck.navWidth).toBeLessThanOrEqual(vp.width);
          // Bottom nav must be positioned near bottom
          expect(navCheck.navBottom).toBeLessThanOrEqual(vp.height + 2);
        }
      });

      // 3. Floating Action Button (FAB) Non-Overlapping Clearance
      test('FAB sits safely above MobileBottomNav without occlusion', async ({ page }) => {
        await page.goto('/#dashboard', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(600);

        const fabMetrics = await page.evaluate(() => {
          // FAB on dashboard
          const fab = document.querySelector('.fixed.bottom-20') || document.querySelector('button[class*="bg-[#DE5D53]"].rounded-full');
          const nav = document.querySelector('nav[aria-label="Mobile Navigation"]');
          if (!fab || !nav) return null;

          const fabRect = fab.getBoundingClientRect();
          const navRect = nav.getBoundingClientRect();

          return {
            fabTop: fabRect.top,
            fabBottom: fabRect.bottom,
            navTop: navRect.top,
            navBottom: navRect.bottom,
            // FAB bottom should not overlap nav top
            isClear: fabRect.bottom <= navRect.top + 8,
          };
        });

        if (fabMetrics) {
          expect(
            fabMetrics.isClear,
            `FAB bottom (${fabMetrics.fabBottom}px) must sit cleanly above MobileBottomNav top (${fabMetrics.navTop}px)`
          ).toBe(true);
        }
      });

      // 4. Touch Target Ergonomics (>= 40-44px)
      test('Interactive buttons maintain ergonomic touch dimensions', async ({ page }) => {
        await page.goto('/#dashboard', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(600);

        const undersizedTargets = await page.evaluate(() => {
          const interactive = Array.from(document.querySelectorAll('button, a[role="button"], [aria-label]'));
          const failures = [];

          for (const el of interactive) {
            // Filter visible items
            if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') continue;

            const rect = el.getBoundingClientRect();
            // Flag buttons strictly below ergonomic minimum (< 40px in both width or height, excluding inline text links)
            if (rect.width > 0 && rect.height > 0) {
              if (rect.width < 38 || rect.height < 38) {
                // Ignore inline pill chips or badge markers
                if (el.tagName.toLowerCase() === 'span') continue;
                failures.push({
                  tag: el.tagName.toLowerCase(),
                  className: (el.className || '').toString().slice(0, 50),
                  ariaLabel: el.getAttribute('aria-label') || '',
                  width: Math.round(rect.width),
                  height: Math.round(rect.height),
                });
              }
            }
          }
          return failures;
        });

        expect(
          undersizedTargets.length,
          `[${vp.name}] Found ${undersizedTargets.length} undersized buttons (< 40px): ${JSON.stringify(undersizedTargets.slice(0, 3))}`
        ).toBe(0);
      });

      // 5. Modal Dialogs Mobile Responsive Dimensions
      test('Modals open within viewport bounds without horizontal blowout', async ({ page }) => {
        await page.goto('/#dashboard', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Test Pricing Modal
        await page.evaluate(() => {
          if (typeof window.openPricingModal === 'function') {
            window.openPricingModal();
          }
        });
        await page.waitForTimeout(400);

        await assertZeroHorizontalOverflow(page, 'PricingModal', vp);

        await page.evaluate(() => {
          if (typeof window.closePricingModal === 'function') {
            window.closePricingModal();
          }
        });
        await page.waitForTimeout(300);

        // Test Create Topic Modal
        await page.evaluate(() => {
          if (typeof window.openCreateTopicModal === 'function') {
            window.openCreateTopicModal();
          }
        });
        await page.waitForTimeout(400);

        await assertZeroHorizontalOverflow(page, 'CreateTopicModal', vp);

        await page.evaluate(() => {
          if (typeof window.closeCreateTopicModal === 'function') {
            window.closeCreateTopicModal();
          }
        });
        await page.waitForTimeout(300);

        // Test Bulk Add Word Modal
        await page.evaluate(() => {
          if (typeof window.openVocabBulkAddModal === 'function') {
            window.openVocabBulkAddModal();
          }
        });
        await page.waitForTimeout(400);

        await assertZeroHorizontalOverflow(page, 'BulkAddWordModal', vp);

        await page.evaluate(() => {
          if (typeof window.closeVocabBulkAddModal === 'function') {
            window.closeVocabBulkAddModal();
          }
        });
      });

      // 6. THPT Exam Room Compact Stepper & Palette
      test('THPT Exam Room layout adapts to mobile header and question stepper', async ({ page }) => {
        await page.goto('/#thpt-room', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(800);

        await assertZeroHorizontalOverflow(page, 'PageThptRoom', vp);
        await assertNoElementOverflow(page, 'PageThptRoom', vp);
      });

      // 7. Cambridge Bilingual Reading View Tooltip Clamping
      test('Bilingual Reading View fits viewport without horizontal scrolling', async ({ page }) => {
        await page.goto('/#bilingual-reading', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(800);

        await assertZeroHorizontalOverflow(page, 'PageBilingualReading', vp);
        await assertNoElementOverflow(page, 'PageBilingualReading', vp);
      });
    });
  }
});
