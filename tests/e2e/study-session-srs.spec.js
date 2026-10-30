// tests/e2e/study-session-srs.spec.js
// Playwright E2E Test Suite for HiVocab Core Study Session: Flashcard SM-2, 4 Exercise Types & Queue Recycling
// Tiers: Tier 1 (Feature Coverage), Tier 2 (Boundary/Corner), Tier 3 (Cross-Feature), Tier 4 (Real-World)

import { test, expect } from '@playwright/test';

const AUTH_TOKEN_KEY = 'sb-swehdtrqjyklmsefkjdf-auth-token';

function createMockSession(user) {
  const nowSec = Math.floor(Date.now() / 1000);
  return {
    access_token: 'mock-jwt-access-token-srs',
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: nowSec + 86400,
    refresh_token: 'mock-refresh-token-srs',
    user,
  };
}

const MOCK_WORDS = [
  {
    id: 'w-001',
    word: 'resilient',
    phonetic: 'rɪˈzɪl.jənt',
    pos: 'adj',
    meaning: 'kiên cường, có khả năng phục hồi nhanh',
    example_sentence: 'She remained remarkably resilient throughout all the challenges.',
    level: 1,
  },
  {
    id: 'w-002',
    word: 'meticulous',
    phonetic: 'məˈtɪk.jə.ləs',
    pos: 'adj',
    meaning: 'tỉ mỉ, cẩn thận từng chi tiết',
    example_sentence: 'He was meticulous about keeping his records clean.',
    level: 2,
  },
  {
    id: 'w-003',
    word: 'lucid',
    phonetic: 'ˈluː.sɪd',
    pos: 'adj',
    meaning: 'rõ ràng, minh bạch, dễ hiểu',
    example_sentence: 'The professor gave a lucid explanation of the concept.',
    level: 0,
  },
];

const MEANING_BY_WORD = Object.fromEntries(MOCK_WORDS.map((w) => [w.word, w.meaning]));

test.describe('HiVocab E2E: Study Session & SM-2 Spaced Repetition Suite', () => {
  const testUser = { id: 'srs-user-001', email: 'srs@hivocab.test' };
  const userProfile = {
    id: testUser.id,
    email: testUser.email,
    full_name: 'Học viên SRS',
    role: 'user',
    tier: 'pro',
    subscription_plan: 'pro_1y',
    subscription_expires_at: '2028-01-01T00:00:00Z',
  };

  test.beforeEach(async ({ page }) => {
    await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
    await page.route('**/api/tts*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.from('') });
    });

    await page.addInitScript(({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
      sessionStorage.setItem('hivocab_guest_entered', '1');
      window._currentUser = session.user;
    }, { key: AUTH_TOKEN_KEY, session: createMockSession(testUser) });

    await page.route('**/auth/v1/user*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockSession(testUser).user),
      });
    });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(userProfile),
      });
    });

    await page.route('**/rest/v1/rpc/review_word*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          newLevel: 3,
          nextReviewAt: new Date(Date.now() + 86400000).toISOString(),
          reviewCount: 2,
          intervalLabel: '24 giờ',
        }),
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TIER 1: Feature Coverage (Core Flow for All 4 Exercise Types)
  // ───────────────────────────────────────────────────────────────────────────

  test('Tier 1: Flashcard review flow - front to back flip and rating "Đã nhớ kỹ"', async ({ page }) => {
    const word = MOCK_WORDS[0];

    await page.addInitScript(({ words }) => {
      window._currentSessionWords = words;
      window._practiceMode = 0; // 0 = flashcard
      window._flashcardMode = 'en_vi';
    }, { words: [word] });

    await page.goto('/#learning');

    await expect(page.locator('h2').filter({ hasText: 'resilient' }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=/rɪˈzɪl.jənt/').first()).toBeVisible();

    const revealBtn = page.getByRole('button', { name: /Nhấn xem đáp án/i });
    await expect(revealBtn).toBeVisible();
    await revealBtn.click();

    await expect(page.getByText('kiên cường, có khả năng phục hồi nhanh').first()).toBeVisible({ timeout: 5000 });

    const easyBtn = page.getByRole('button', { name: /Đã nhớ kỹ/i });
    const hardBtn = page.getByRole('button', { name: /Cần ôn lại/i });
    await expect(easyBtn).toBeVisible();
    await expect(hardBtn).toBeVisible();

    await easyBtn.click();

    await expect(page.getByText('Hoàn thành xuất sắc bài học')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Giỏi quá bạn ơi! 🌿')).toBeVisible();
  });

  test('Tier 1: Flashcard review rating "Cần ôn lại" records hard rating and recycles review word until mastered', async ({ page }) => {
    const capturedRatings = [];
    await page.route('**/rest/v1/rpc/review_word*', async (route) => {
      const payload = JSON.parse(route.request().postData() || '{}');
      capturedRatings.push(payload.p_rating || payload.rating);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          newLevel: 1,
          reviewCount: 1,
          nextReviewAt: new Date(Date.now() + 3600000).toISOString(),
          intervalLabel: '1 giờ',
        }),
      });
    });

    await page.addInitScript(({ words }) => {
      window._currentSessionWords = words;
      window._practiceMode = 0;
    }, { words: [MOCK_WORDS[1]] }); // level 2 -> Hard recycles to end of queue

    await page.goto('/#learning');

    await expect(page.locator('h2').filter({ hasText: 'meticulous' }).first()).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: /Nhấn xem đáp án/i }).click();

    const hardBtn = page.getByRole('button', { name: /Cần ôn lại/i });
    await expect(hardBtn).toBeVisible();
    await hardBtn.click();

    // Word is recycled for reinforcement (session does NOT complete yet, card flips back to front)
    await expect(page.getByText('Hoàn thành xuất sắc bài học')).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Nhấn xem đáp án/i })).toBeVisible({ timeout: 5000 });
    await expect.poll(() => capturedRatings.includes('hard'), { timeout: 5000 }).toBe(true);

    // Complete recycled card
    await page.getByRole('button', { name: /Nhấn xem đáp án/i }).click();
    await page.getByRole('button', { name: /Đã nhớ kỹ/i }).click();

    await expect(page.getByText('Giỏi quá bạn ơi! 🌿')).toBeVisible({ timeout: 8000 });
  });

  test('Tier 1: MCQ exercise - selecting correct option shows green result sheet and moves forward', async ({ page }) => {
    await page.addInitScript(({ words }) => {
      window._currentSessionWords = words;
      window._practiceMode = 1; // 1 = mcq
    }, { words: MOCK_WORDS });

    await page.goto('/#learning');

    await expect(page.locator('p').filter({ hasText: /Chọn nghĩa/i }).first()).toBeVisible({ timeout: 8000 });

    // Read whichever word was shuffled first (rendered inside quotes in h1)
    const promptWordRaw = await page.locator('h1').first().textContent();
    const cleanWord = String(promptWordRaw || '').replace(/["'\s]/g, '').toLowerCase();
    const targetMeaning = MEANING_BY_WORD[cleanWord];
    expect(targetMeaning).toBeTruthy();

    const correctOptionBtn = page.locator('[role="radiogroup"] [role="button"]').filter({ hasText: targetMeaning }).first();
    await expect(correctOptionBtn).toBeVisible();
    await correctOptionBtn.click();

    // ExerciseResultModal dialog opens with meaning & Continue button
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText(targetMeaning)).toBeVisible();

    const continueBtn = dialog.getByRole('button', { name: /Tiếp tục/i });
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    await expect(dialog).not.toBeVisible();
  });

  test('Tier 1: Fill-in-the-blank exercise - fills letters and validates answer', async ({ page }) => {
    const singleWord = [{
      id: 'w-fill',
      word: 'cat',
      phonetic: 'kæt',
      meaning: 'con mèo',
      example_sentence: 'The cat is sleeping on the mat.',
      level: 1,
    }];

    await page.addInitScript(({ words }) => {
      window._currentSessionWords = words;
      window._practiceMode = 2; // 2 = fill
    }, { words: singleWord });

    await page.goto('/#learning');

    await expect(page.getByText('Điền từ tiếng Anh có nghĩa:', { exact: true })).toBeVisible({ timeout: 8000 });

    const input0 = page.locator('input[data-fill-index="0"]');
    const input1 = page.locator('input[data-fill-index="1"]');
    const input2 = page.locator('input[data-fill-index="2"]');

    await expect(input0).toBeVisible();
    await input0.fill('C');
    await input1.fill('A');
    await input2.fill('T');

    const checkBtn = page.getByRole('button', { name: /Kiểm tra đáp án/i });
    await expect(checkBtn).toBeVisible();
    await checkBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText('con mèo')).toBeVisible();

    await dialog.getByRole('button', { name: /Tiếp tục/i }).click();
    await expect(page.getByText('Hoàn thành xuất sắc bài học')).toBeVisible({ timeout: 8000 });
  });

  test('Tier 1: Listen exercise - displays audio controls, speed buttons and validates typed letters', async ({ page }) => {
    const singleWord = [{
      id: 'w-listen',
      word: 'dog',
      phonetic: 'dɒɡ',
      meaning: 'con chó',
      example_sentence: 'The dog is barking.',
      level: 1,
    }];

    await page.addInitScript(({ words }) => {
      window._currentSessionWords = words;
      window._practiceMode = 3; // 3 = listen
    }, { words: singleWord });

    await page.goto('/#learning');

    await expect(page.getByText(/Lắng nghe kỹ & điền từng chữ cái nhé/i)).toBeVisible({ timeout: 8000 });

    // Speed buttons 1.0x and 0.6x exist
    await expect(page.getByRole('button', { name: '1.0x' })).toBeVisible();
    await expect(page.getByRole('button', { name: /0\.6x/ })).toBeVisible();

    await page.locator('input[data-listen-index="0"]').fill('D');
    await page.locator('input[data-listen-index="1"]').fill('O');
    await page.locator('input[data-listen-index="2"]').fill('G');

    const checkBtn = page.getByRole('button', { name: /Kiểm tra đáp án/i });
    await expect(checkBtn).toBeVisible();
    await checkBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText('con chó')).toBeVisible();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TIER 2: Boundary & Corner Cases (Queue Recycling & Edge Conditions)
  // ───────────────────────────────────────────────────────────────────────────

  test('Tier 2: Incorrect MCQ answer shows wrong-answer feedback and recycles word to end of queue', async ({ page }) => {
    await page.addInitScript(({ words }) => {
      window._currentSessionWords = words;
      window._practiceMode = 1; // MCQ
    }, { words: [MOCK_WORDS[0], MOCK_WORDS[1]] });

    await page.goto('/#learning');

    await expect(page.locator('p').filter({ hasText: /Chọn nghĩa/i }).first()).toBeVisible({ timeout: 8000 });

    const promptWordRaw = await page.locator('h1').first().textContent();
    const cleanWord = String(promptWordRaw || '').replace(/["'\s]/g, '').toLowerCase();
    const rightMeaning = MEANING_BY_WORD[cleanWord];

    // Pick a wrong option deliberately
    const wrongOptionBtn = page.locator('[role="radiogroup"] [role="button"]').filter({ hasNotText: rightMeaning }).first();
    await expect(wrongOptionBtn).toBeVisible();
    await wrongOptionBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText(/Bạn đã chọn \/ điền:/i)).toBeVisible();

    await dialog.getByRole('button', { name: /Tiếp tục/i }).click();

    // Answer the 2nd word rightly -> session STILL does not complete because failed word #1 was recycled to queue tail!
    await expect(page.locator('p').filter({ hasText: /Chọn nghĩa/i }).first()).toBeVisible({ timeout: 5000 });
    const q2WordRaw = await page.locator('h1').first().textContent();
    const q2Word = String(q2WordRaw || '').replace(/["'\s]/g, '').toLowerCase();
    const q2Meaning = MEANING_BY_WORD[q2Word];
    await page.locator('[role="radiogroup"] [role="button"]').filter({ hasText: q2Meaning }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: /Tiếp tục/i }).click();

    // Recycled word #1 is still in queue!
    await expect(page.getByText('Hoàn thành xuất sắc bài học')).not.toBeVisible();
    await expect(page.locator('h1').filter({ hasText: new RegExp(cleanWord, 'i') })).toBeVisible({ timeout: 5000 });
  });

  test('Tier 2: Flashcard keyboard shortcuts - Space flips card, 2 rates Easy', async ({ page }) => {
    await page.addInitScript(({ words }) => {
      window._currentSessionWords = words;
      window._practiceMode = 0;
    }, { words: [MOCK_WORDS[0]] });

    await page.goto('/#learning');

    await expect(page.locator('h2').filter({ hasText: 'resilient' }).first()).toBeVisible({ timeout: 10000 });
    await page.locator('body').click({ position: { x: 10, y: 10 } });

    await page.keyboard.press('Space');
    await expect(page.locator('[aria-label*="Mặt sau"]')).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('2');
    await expect(page.getByText('Hoàn thành xuất sắc bài học')).toBeVisible({ timeout: 8000 });
  });

  test('Tier 2: Single-word topic generates fallback distractors without crashing MCQ', async ({ page }) => {
    const singleWord = [{
      id: 'w-lone',
      word: 'solitary',
      phonetic: 'ˈsɒl.ɪ.tri',
      meaning: 'cô độc, một mình',
      example_sentence: 'He leads a solitary life.',
      level: 0,
    }];

    await page.addInitScript(({ words }) => {
      window._currentSessionWords = words;
      window._practiceMode = 1; // MCQ
    }, { words: singleWord });

    await page.goto('/#learning');

    await expect(page.locator('p').filter({ hasText: /Chọn nghĩa/i }).first()).toBeVisible({ timeout: 8000 });
    const options = page.locator('[role="radiogroup"] [role="button"]');
    await expect(options).toHaveCount(4);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TIER 3: Cross-Feature Integration (SRS Level Sync & Progress Indicator)
  // ───────────────────────────────────────────────────────────────────────────

  test('Tier 3: Progress counter advances as items are completed', async ({ page }) => {
    await page.addInitScript(({ words }) => {
      window._currentSessionWords = words;
      window._practiceMode = 0;
    }, { words: [MOCK_WORDS[0], MOCK_WORDS[1]] });

    await page.goto('/#learning');

    await expect(page.getByText('1/2')).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: /Nhấn xem đáp án/i }).click();
    await page.getByRole('button', { name: /Đã nhớ kỹ/i }).click();

    await expect(page.getByText('2/2')).toBeVisible({ timeout: 8000 });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TIER 4: Real-World Scenarios (Full Study Session to Completion & Navigation)
  // ───────────────────────────────────────────────────────────────────────────

  test('Tier 4: Full study session with 3 shuffled words finishes at ExerciseCompleted and returns home', async ({ page }) => {
    await page.addInitScript(({ words }) => {
      window._currentSessionWords = words;
      window._practiceMode = 0; // Flashcard mode
    }, { words: MOCK_WORDS });

    await page.goto('/#learning');

    // Complete all 3 cards dynamically regardless of shuffle order
    for (let step = 1; step <= 3; step++) {
      await expect(page.getByText(`${step}/3`)).toBeVisible({ timeout: 8000 });
      await page.getByRole('button', { name: /Nhấn xem đáp án/i }).click();
      await page.getByRole('button', { name: /Đã nhớ kỹ/i }).click();
    }

    await expect(page.getByText('Hoàn thành xuất sắc bài học')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('3 từ vựng')).toBeVisible();

    const homeBtn = page.getByRole('button', { name: /Về Trang chủ/i });
    await expect(homeBtn).toBeVisible();
    await homeBtn.click();

    await expect(page).toHaveURL(/\/app|#dashboard/);
  });
});
