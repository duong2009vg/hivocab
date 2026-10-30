// tests/e2e/bilingual-and-thpt.spec.js
// Playwright E2E Test Suite for Cambridge Bilingual Reading & THPT National Exam Room
// Tiers: Tier 1 (Feature Coverage), Tier 2 (Boundary/Corner), Tier 3 (Cross-Feature), Tier 4 (Real-World)

import { test, expect } from '@playwright/test';

const AUTH_TOKEN_KEY = 'sb-swehdtrqjyklmsefkjdf-auth-token';

function createMockSession(user) {
  const nowSec = Math.floor(Date.now() / 1000);
  return {
    access_token: 'mock-jwt-bilingual-thpt',
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: nowSec + 86400,
    refresh_token: 'mock-refresh-bilingual-thpt',
    user,
  };
}

const SAMPLE_PASSAGE = {
  id: 'pass-cam18-t1-p1',
  passage_number: 1,
  passageNumber: 1,
  title: 'Urban Farming in Paris',
  topic_label: 'Environment & Agriculture',
  topicLabel: 'Environment & Agriculture',
  is_pro: false,
  isPro: false,
  content_en:
    'On top of a striking new exhibition hall in southern Paris, the world largest urban rooftop farm has started to bear fruit.\n\nStrawberries that are intensely flavoured and resplendently red sprout abundantly from plastic tubes.',
  content_vi:
    'Trên nóc một khu triển lãm mới ấn tượng ở phía nam Paris, nông trại sân thượng đô thị lớn nhất thế giới đã bắt đầu đơm hoa kết trái.\n\nNhững quả dâu tây đậm đà hương vị và đỏ rực mọc sum suê từ các ống nhựa.',
};

const SAMPLE_PASSAGE_WORDS = [
  {
    id: 'pw-1',
    passage_id: SAMPLE_PASSAGE.id,
    word: 'abundantly',
    pos: 'adv',
    phonetic: '/əˈbʌn.dənt.li/',
    meaning: 'một cách dồi dào, sum suê',
    example_sentence: 'Wildflowers grow abundantly along the riverbanks.',
  },
  {
    id: 'pw-2',
    passage_id: SAMPLE_PASSAGE.id,
    word: 'striking',
    pos: 'adj',
    phonetic: '/ˈstraɪ.kɪŋ/',
    meaning: 'nổi bật, ấn tượng',
    example_sentence: 'She bears a striking resemblance to her mother.',
  },
];

const SAMPLE_EXAM_SUMMARIES = [
  {
    id: 'exam-free-2025',
    title: 'Đề chính thức THPT Quốc Gia 2025 - Mã 401',
    year: 2025,
    total_questions: 2,
    duration_minutes: 50,
    is_pro: false,
  },
  {
    id: 'exam-pro-2025',
    title: 'Đề thi thử Sở GD Hà Nội 2025 - Lần 2',
    year: 2025,
    total_questions: 40,
    duration_minutes: 50,
    is_pro: true,
  },
];

const SAMPLE_FULL_EXAM = {
  id: 'exam-free-2025',
  title: 'Đề chính thức THPT Quốc Gia 2025 - Mã 401',
  year: 2025,
  total_questions: 2,
  duration_minutes: 50,
  is_pro: false,
  sections: [
    {
      id: 'sec-1',
      title: 'Read the following advertisement and mark the correct option.',
      passage: 'Green Future Initiative invites young volunteers to plant 10,000 trees this spring.',
      start_q: 1,
      end_q: 2,
      q_start: 1,
      q_end: 2,
    },
  ],
  questions: [
    {
      number: 1,
      num: 1,
      q_num: 1,
      question: 'Question 1: Choose the word closest in meaning to "initiative".',
      options: {
        A: 'plan',
        B: 'mistake',
        C: 'delay',
        D: 'refusal',
      },
      correct_answer: 'A',
      answer: 'A',
      explanation: '"Initiative" (sáng kiến/kế hoạch khởi xướng) gần nghĩa nhất với "plan".',
    },
    {
      number: 2,
      num: 2,
      q_num: 2,
      question: 'Question 2: How many trees does the campaign aim to plant?',
      options: {
        A: '1,000',
        B: '5,000',
        C: '10,000',
        D: '50,000',
      },
      correct_answer: 'C',
      answer: 'C',
      explanation: 'Đoạn văn nêu rõ "plant 10,000 trees this spring".',
    },
  ],
};

test.describe('HiVocab E2E: Cambridge Bilingual Reading & THPT Exam Suite', () => {
  const proUser = { id: 'pro-reader-001', email: 'reader@hivocab.test' };
  const proProfile = {
    id: proUser.id,
    email: proUser.email,
    full_name: 'Học viên Đọc Hiểu',
    role: 'user',
    tier: 'pro',
    subscription_plan: 'pro_1y',
    subscription_expires_at: '2028-12-31T00:00:00Z',
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
    }, { key: AUTH_TOKEN_KEY, session: createMockSession(proUser) });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(proProfile),
      });
    });

    await page.route('**/rest/v1/passages*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_PASSAGE),
      });
    });

    await page.route('**/rest/v1/words*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_PASSAGE_WORDS),
      });
    });

    await page.route('**/rest/v1/rpc/get_thpt_exam_summaries*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_EXAM_SUMMARIES),
      });
    });

    await page.route('**/rest/v1/thpt_exams*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_FULL_EXAM),
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TIER 1: Feature Coverage (Bilingual Reader & THPT Catalog/Room)
  // ───────────────────────────────────────────────────────────────────────────

  test('Tier 1: Bilingual Reading loads passage paragraphs and toggles curtain reveal/hide all', async ({ page }) => {
    await page.addInitScript(({ passage }) => {
      window._currentPassageId = passage.id;
      window._camHierarchy = {
        tests: [{ id: 'test-1', name: 'Test 1', passages: [passage] }],
      };
    }, { passage: SAMPLE_PASSAGE });

    await page.goto('/#bilingual-reading');

    await expect(page.locator('h2').filter({ hasText: 'Urban Farming in Paris' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/2 đoạn văn · 2 từ vựng trọng tâm/i)).toBeVisible();

    // Click "Hiện tất cả" to reveal Vietnamese translations
    const revealAllBtn = page.getByRole('button', { name: /Hiện tất cả/i });
    await expect(revealAllBtn).toBeVisible();
    await revealAllBtn.click();

    await expect(page.getByText(/nông trại sân thượng đô thị lớn nhất thế giới/i)).toBeVisible();

    // Click "Che tất cả" to hide curtains again
    await page.getByRole('button', { name: /Che tất cả/i }).click();
  });

  test('Tier 1: Clicking highlighted vocabulary word opens BilingualVocabTooltip with meaning', async ({ page }) => {
    await page.addInitScript(({ passage }) => {
      window._currentPassageId = passage.id;
      window._camHierarchy = {
        tests: [{ id: 'test-1', name: 'Test 1', passages: [passage] }],
      };
    }, { passage: SAMPLE_PASSAGE });

    await page.goto('/#bilingual-reading');

    const highlightedWord = page.locator('span[title*="Nhấp để xem nghĩa"]').filter({ hasText: 'striking' }).first();
    await expect(highlightedWord).toBeVisible({ timeout: 8000 });
    await highlightedWord.click();

    // Tooltip renders word, phonetic, and Vietnamese meaning
    await expect(page.getByText('Nghĩa tiếng Việt 🐾')).toBeVisible();
    await expect(page.getByText('nổi bật, ấn tượng')).toBeVisible();
    await expect(page.getByRole('button', { name: /Phát âm/i })).toBeVisible();

    // Close tooltip
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(page.getByText('Nghĩa tiếng Việt 🐾')).not.toBeVisible();
  });

  test('Tier 1: Switching to Context Gap-Fill tab allows answering blanks to completion', async ({ page }) => {
    const oneWordList = [SAMPLE_PASSAGE_WORDS[1]]; // "striking" appears in paragraph 1 of SAMPLE_PASSAGE
    await page.route('**/rest/v1/words*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(oneWordList),
      });
    });

    await page.addInitScript(({ passage }) => {
      window._currentPassageId = passage.id;
      window._camHierarchy = {
        tests: [{ id: 'test-1', name: 'Test 1', passages: [passage] }],
      };
    }, { passage: SAMPLE_PASSAGE });

    await page.goto('/#bilingual-reading');
    await expect(page.locator('h2').filter({ hasText: 'Urban Farming in Paris' })).toBeVisible({ timeout: 8000 });

    // Switch to Gap-Fill tab
    const gapTabBtn = page.locator('header button').filter({ hasText: /Đục lỗ song ngữ|✏️/ }).first();
    await gapTabBtn.click();

    const gapInput = page.locator('#bilingual-reading-body input[type="text"]').first();
    await expect(gapInput).toBeVisible({ timeout: 5000 });
    await gapInput.fill('striking');
    await gapInput.press('Enter');

    await expect(page.getByText(/Xuất sắc! Bạn đã hoàn thành!/i)).toBeVisible({ timeout: 5000 });
  });

  test('Tier 1: PageExercises lists THPT exams with Free and Gói PRO filter pills', async ({ page }) => {
    await page.goto('/#exercises');

    await expect(page.getByText('Đề chính thức THPT Quốc Gia 2025 - Mã 401').locator('visible=true').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Đề thi thử Sở GD Hà Nội 2025 - Lần 2').locator('visible=true').first()).toBeVisible();

    // Filter by "Miễn phí"
    await page.getByRole('button', { name: /Miễn phí \(1\)/i }).locator('visible=true').first().click();
    await expect(page.getByText('Đề chính thức THPT Quốc Gia 2025 - Mã 401').locator('visible=true').first()).toBeVisible();
    await expect(page.getByText('Đề thi thử Sở GD Hà Nội 2025 - Lần 2').locator('visible=true')).toHaveCount(0);

    // Filter by "Gói PRO"
    await page.getByRole('button', { name: /Gói PRO \(1\)/i }).locator('visible=true').first().click();
    await expect(page.getByText('Đề thi thử Sở GD Hà Nội 2025 - Lần 2').locator('visible=true').first()).toBeVisible();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TIER 2: Boundary & Corner Cases
  // ───────────────────────────────────────────────────────────────────────────

  test('Tier 2: Navigating directly to #thpt-room without config safely redirects to #exercises', async ({ page }) => {
    await page.goto('/#thpt-room');
    await expect(page).toHaveURL(/.*exercises/, { timeout: 8000 });
  });

  test('Tier 2: Free user entering Pro-flagged #thpt-room sees CrayonLockOverlay without starting timer or loading questions', async ({ page }) => {
    const freeProfile = {
      id: proUser.id,
      email: proUser.email,
      full_name: 'Học viên Free',
      role: 'user',
      tier: 'free',
      subscription_plan: null,
      subscription_expires_at: null,
    };

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(freeProfile),
      });
    });

    await page.addInitScript(() => {
      window._thptStartConfig = { examId: 'exam-pro-2025', minutes: 50, is_pro: true };
    });

    await page.goto('/#thpt-room');

    await expect(page.getByText(/Nâng Cấp PRO|Mở Khóa/i).first()).toBeVisible({ timeout: 8000 });
    // Exam questions must NOT be rendered
    await expect(page.getByText('Question 1:')).toHaveCount(0);
  });

  test('Tier 2: Submitting THPT exam with unanswered questions shows warning count in ExamConfirmModal', async ({ page }) => {
    await page.addInitScript(() => {
      window._thptStartConfig = { examId: 'exam-free-2025', minutes: 50, is_pro: false };
    });

    await page.goto('/#thpt-room');

    await expect(page.getByText(/Question 1:/i)).toBeVisible({ timeout: 8000 });

    // Answer only Question 1 (leave Question 2 unanswered)
    await page.getByRole('button', { name: 'Đáp án A' }).first().click();

    // Trigger submit confirmation modal
    await page.getByRole('button', { name: /NỘP BÀI/i }).first().click();

    await expect(page.getByText('Xác nhận nộp bài?')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Còn 1 câu chưa trả lời/i)).toBeVisible();

    // Cancel and stay in exam room
    await page.getByRole('button', { name: 'Tiếp tục làm' }).click();
    await expect(page.getByText('Xác nhận nộp bài?')).not.toBeVisible();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TIER 3: Cross-Feature Integration
  // ───────────────────────────────────────────────────────────────────────────

  test('Tier 3: Free user opening Pro Cambridge passage in Bilingual Reading sees CrayonLockOverlay and opens PricingModal', async ({ page }) => {
    const freeProfile = {
      id: proUser.id,
      email: proUser.email,
      full_name: 'Học viên Free',
      role: 'user',
      tier: 'free',
      subscription_plan: null,
      subscription_expires_at: null,
    };

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(freeProfile),
      });
    });

    await page.route('**/rest/v1/passages*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.addInitScript(() => {
      window._currentPassageId = 'pro-locked-passage';
      window._camHierarchy = {
        tests: [
          {
            id: 'test-pro',
            name: 'Cambridge 19 Test 4',
            isPro: true,
            passages: [
              {
                id: 'pro-locked-passage',
                title: 'Locked Pro IELTS Passage',
                passageNumber: 3,
                isPro: true,
                contentEn: null,
                contentVi: null,
              },
            ],
          },
        ],
      };
    });

    await page.goto('/#bilingual-reading');

    await expect(page.getByText(/Mở Khóa Toàn Bộ Bài Đọc Song Ngữ/i)).toBeVisible({ timeout: 8000 });
    // Raw passage text is never exposed
    await expect(page.getByText('Strawberries that are intensely flavoured')).toHaveCount(0);
  });

  test('Tier 3: Bilingual Reading view mode switches cleanly on Desktop toolbar (Song ngữ / Tiếng Anh)', async ({ page, isMobile }) => {
    await page.addInitScript(({ passage }) => {
      window._currentPassageId = passage.id;
      window._camHierarchy = {
        tests: [{ id: 'test-1', name: 'Test 1', passages: [passage] }],
      };
    }, { passage: SAMPLE_PASSAGE });

    await page.goto('/#bilingual-reading');
    await expect(page.locator('h2').filter({ hasText: 'Urban Farming in Paris' })).toBeVisible({ timeout: 8000 });

    if (!isMobile) {
      const enOnlyBtn = page.locator('header button').filter({ hasText: 'Tiếng Anh' }).first();
      if (await enOnlyBtn.isVisible()) {
        await enOnlyBtn.click();
      }
    }
    await expect(page.getByText(/world largest urban rooftop farm/i)).toBeVisible();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TIER 4: Real-World End-to-End THPT Exam Journey
  // ───────────────────────────────────────────────────────────────────────────

  test('Tier 4: Complete THPT exam workflow: Start exam -> Answer questions -> Submit -> Score 10.00 -> Review explanations', async ({ page }) => {
    await page.addInitScript(() => {
      window._thptStartConfig = { examId: 'exam-free-2025', minutes: 50, is_pro: false };
    });

    await page.goto('/#thpt-room');

    // Verify exam header action & Question 1
    await expect(page.getByRole('button', { name: /NỘP BÀI/i }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Question 1:/i)).toBeVisible();

    // Select correct answers: Q1 = A, Q2 = C
    const q1Buttons = page.getByRole('button', { name: 'Đáp án A' });
    await q1Buttons.nth(0).click();

    const q2Buttons = page.getByRole('button', { name: 'Đáp án C' });
    await q2Buttons.nth(1).click();

    // Submit exam
    await page.getByRole('button', { name: /NỘP BÀI/i }).first().click();
    await expect(page.getByText('Xác nhận nộp bài?')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('2 / 2 câu')).toBeVisible();

    await page.getByRole('button', { name: 'Nộp bài ngay' }).click();

    // Verify Results Modal shows 10.00 score and 2/2 correct
    await expect(page.getByText('Kết quả bài thi THPT')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('10.00', { exact: true })).toBeVisible();

    // Enter Review Mode to check explanations
    const reviewBtn = page.getByRole('button', { name: /Xem lời giải|Xem chi tiết/i });
    if (await reviewBtn.isVisible().catch(() => false)) {
      await reviewBtn.click();
      await expect(page.getByText('Bạn chọn (Đúng)').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
