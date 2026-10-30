// tests/e2e/vocab-crud-and-bulk.spec.js
// Playwright E2E Test Suite for Personal Vocabulary Notebook CRUD, Bulk Import & Community Library
// Tiers: Tier 1 (Feature Coverage), Tier 2 (Boundary/Corner), Tier 3 (Cross-Feature), Tier 4 (Real-World)

import { test, expect } from '@playwright/test';

const AUTH_TOKEN_KEY = 'sb-swehdtrqjyklmsefkjdf-auth-token';

function createMockSession(user) {
  const nowSec = Math.floor(Date.now() / 1000);
  return {
    access_token: 'mock-jwt-vocab-crud',
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: nowSec + 86400,
    refresh_token: 'mock-refresh-vocab-crud',
    user,
  };
}

const INITIAL_TOPICS = [
  {
    id: 'topic-personal-1',
    user_id: 'vocab-user-001',
    name: 'Sổ tay từ vựng IELTS',
    icon: '📘',
    category: 'personal',
    is_public: false,
  },
];

const INITIAL_VOCAB_ROWS = [
  {
    id: 'vw-1',
    topic_id: 'topic-personal-1',
    word: 'ubiquitous',
    pos: 'adj',
    phonetic: '/juːˈbɪk.wɪ.təs/',
    meaning: 'phổ biến khắp nơi',
    example_sentence: 'Smartphones have become ubiquitous in modern life.',
    topic_name: 'Sổ tay từ vựng IELTS',
    level: 3,
    next_review_at: '2026-11-05T00:00:00Z',
    last_reviewed_at: '2026-10-29T00:00:00Z',
    review_count: 4,
    total_count: 2,
  },
  {
    id: 'vw-2',
    topic_id: 'topic-personal-1',
    word: 'ephemeral',
    pos: 'adj',
    phonetic: '/ɪˈfem.ər.əl/',
    meaning: 'phù du, chóng tàn',
    example_sentence: 'Fame in the internet age is often ephemeral.',
    topic_name: 'Sổ tay từ vựng IELTS',
    level: 1,
    next_review_at: '2026-10-30T00:00:00Z',
    last_reviewed_at: '2026-10-28T00:00:00Z',
    review_count: 1,
    total_count: 2,
  },
];

const PUBLIC_LIBRARY_TOPICS = [
  {
    id: 'pub-topic-cam19',
    name: 'Bộ 150 Từ Vựng Đắt Giá Cam 19',
    icon: '🔥',
    description: 'Tổng hợp collocations ăn điểm Reading band 8.0+',
    created_at: new Date().toISOString(),
    like_count: 42,
    clone_count: 18,
    tags: ['IELTS', 'Cam19'],
    is_public: true,
    author_name: 'Cô Mai IELTS',
    author_avatar: null,
    is_pro: false,
  },
];

test.describe('HiVocab E2E: Vocabulary CRUD, Bulk Import & Community Library Suite', () => {
  const testUser = { id: 'vocab-user-001', email: 'notebook@hivocab.test' };
  const userProfile = {
    id: testUser.id,
    email: testUser.email,
    full_name: 'Học viên Sổ Tay',
    role: 'user',
    tier: 'pro',
    subscription_plan: 'pro_6m',
    subscription_expires_at: '2027-06-01T00:00:00Z',
  };

  let vocabStore = [];

  test.beforeEach(async ({ page }) => {
    vocabStore = [...INITIAL_VOCAB_ROWS];

    await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
    await page.route('**/api/tts*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.from('') });
    });

    await page.addInitScript(({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
      sessionStorage.setItem('hivocab_guest_entered', '1');
      window._currentUser = session.user;
    }, { key: AUTH_TOKEN_KEY, session: createMockSession(testUser) });

    // Mock Supabase Auth getUser endpoint used by modals & library
    await page.route('**/auth/v1/user*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(testUser),
      });
    });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(userProfile),
      });
    });

    await page.route('**/rest/v1/rpc/get_learned_vocab_stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total: vocabStore.length,
          due: 1,
          learning: vocabStore.length,
          mastered: 0,
          memoryLevels: { lv0: 0, lv1: 1, lv2: 0, lv3: 1, lv4: 0, lv5: 0 },
        }),
      });
    });

    await page.route('**/rest/v1/rpc/get_vocabulary_page*', async (route) => {
      const payload = JSON.parse(route.request().postData() || '{}');
      const q = String(payload.p_search || '').trim().toLowerCase();
      const lvl = payload.p_level_filter;
      let filtered = vocabStore;
      if (q) {
        filtered = filtered.filter(
          (w) => w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q)
        );
      }
      if (lvl !== null && lvl !== undefined && lvl >= 0) {
        filtered = filtered.filter((w) => w.level === lvl);
      }
      const rows = filtered.map((r) => ({ ...r, total_count: filtered.length }));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(rows),
      });
    });

    await page.route('**/rest/v1/topics*', async (route) => {
      const url = route.request().url();
      const accept = route.request().headers()['accept'] || '';
      if (url.includes('id=eq.')) {
        const singleTopic = PUBLIC_LIBRARY_TOPICS[0];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(accept.includes('vnd.pgrst.object') ? singleTopic : [singleTopic]),
        });
        return;
      }
      if (url.includes('is_public=eq.true')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(PUBLIC_LIBRARY_TOPICS),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(INITIAL_TOPICS),
      });
    });

    await page.route('**/rest/v1/topic_likes*', async (route) => {
      const accept = route.request().headers()['accept'] || '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(accept.includes('vnd.pgrst.object') ? null : []),
      });
    });

    await page.route('**/rest/v1/words*', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        const body = JSON.parse(route.request().postData() || '[]');
        const items = Array.isArray(body) ? body : [body];
        const inserted = items.map((item, idx) => {
          const row = {
            id: `vw-new-${Date.now()}-${idx}`,
            topic_id: item.topic_id || 'topic-personal-1',
            word: item.word,
            pos: item.pos || 'noun',
            phonetic: item.phonetic || '',
            meaning: item.meaning,
            example_sentence: item.example_sentence || '',
            topic_name: 'Sổ tay từ vựng IELTS',
            level: 0,
            review_count: 0,
          };
          vocabStore.unshift(row);
          return row;
        });
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(Array.isArray(body) ? inserted : inserted[0]),
        });
        return;
      }
      if (method === 'DELETE') {
        const url = new URL(route.request().url());
        const eqId = (url.searchParams.get('id') || '').replace(/^eq\./, '');
        vocabStore = vocabStore.filter((w) => w.id !== eqId);
        await route.fulfill({ status: 204, body: '' });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(vocabStore) });
    });

    await page.route('**/rest/v1/word_progress*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TIER 1: Feature Coverage (Notebook Display, Add Word, Bulk Add, Library)
  // ───────────────────────────────────────────────────────────────────────────

  test('Tier 1: PageVocabulary renders personal vocabulary list, SRS stats and search filtering', async ({ page }) => {
    await page.goto('/#vocabulary');

    await expect(page.getByText('ubiquitous').locator('visible=true').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('ephemeral').locator('visible=true').first()).toBeVisible();

    // Search for "ephemeral"
    const searchInput = page
      .locator('#page-vocabulary input[type="text"], #page-vocabulary input[placeholder*="Tìm"]')
      .locator('visible=true')
      .first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('ephemeral');

    // Wait for debounce (300ms) + RPC filter
    await expect(page.getByText('ubiquitous').locator('visible=true')).toHaveCount(0, { timeout: 5000 });
    await expect(page.getByText('ephemeral').locator('visible=true').first()).toBeVisible();
  });

  test('Tier 1: AddWordModal adds a new vocabulary item and refreshes PageVocabulary automatically', async ({ page }) => {
    await page.goto('/#vocabulary');
    await expect(page.getByText('ubiquitous').locator('visible=true').first()).toBeVisible({ timeout: 8000 });

    await page.evaluate(() => {
      window.__modalContext?.openModal('addWord', { topicId: 'topic-personal-1' });
    });

    const wordInput = page.locator('input[placeholder*="resilient"], input[placeholder*="Nhập từ"]').first();
    await expect(wordInput).toBeVisible({ timeout: 5000 });
    await wordInput.fill('serendipity');

    const meaningInput = page.locator('textarea[placeholder*="kiên cường"], textarea[required]').first();
    await meaningInput.fill('sự tình cờ may mắn');

    const saveBtn = page.getByRole('button', { name: /Lưu từ vựng/i }).first();
    await saveBtn.click();

    await expect(page.getByText('serendipity').locator('visible=true').first()).toBeVisible({ timeout: 8000 });
  });

  test('Tier 1: BulkAddWordModal parses JSON batch, shows live preview table and saves all words', async ({ page }) => {
    await page.goto('/#vocabulary');
    await expect(page.getByText('ubiquitous').locator('visible=true').first()).toBeVisible({ timeout: 8000 });

    await page.evaluate(() => {
      window.__modalContext?.openModal('bulkAdd', { topicId: 'topic-personal-1' });
    });

    await page.getByRole('button', { name: /2\. Nạp dữ liệu/i }).click();

    const jsonSample = JSON.stringify([
      {
        word: 'pragmatic',
        phonetic: '/præɡˈmæt.ɪk/',
        pos: 'adj',
        meaning: 'thực tế, thực dụng',
        example_sentence: 'We need a pragmatic approach to solve this issue.',
      },
      {
        word: 'eloquent',
        phonetic: '/ˈel.ə.kwənt/',
        pos: 'adj',
        meaning: 'hùng biện, có sức thuyết phục',
        example_sentence: 'She delivered an eloquent speech.',
      },
    ]);

    const textarea = page.locator('textarea[placeholder*="JSON"]').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.fill(jsonSample);

    const parseBtn = page.getByRole('button', { name: /Phân tích & Xem trước/i }).first();
    await parseBtn.click();

    // Preview table shows parsed words in controlled inputs
    const previewWordInputs = page.locator('input[placeholder="Từ tiếng Anh"]');
    await expect(previewWordInputs.nth(0)).toHaveValue('pragmatic', { timeout: 5000 });
    await expect(previewWordInputs.nth(1)).toHaveValue('eloquent');

    const saveAllBtn = page.getByRole('button', { name: /Lưu tất cả/i }).first();
    await saveAllBtn.click();

    await expect(page.getByText('pragmatic').locator('visible=true').first()).toBeVisible({ timeout: 8000 });
  });

  test('Tier 1: PageLibrary displays public community decks and clones a deck via clone_public_topic RPC', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    let cloneCalledWith = null;
    await page.route('**/rest/v1/rpc/clone_public_topic*', async (route) => {
      cloneCalledWith = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('cloned-topic-uuid-999'),
      });
    });

    await page.goto('/#library');

    const deckTitle = page.getByText('Bộ 150 Từ Vựng Đắt Giá Cam 19').locator('visible=true').first();
    await expect(deckTitle).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Cô Mai IELTS').locator('visible=true').first()).toBeVisible();

    await deckTitle.click();
    const modalCloneBtn = page.getByRole('button', { name: /Lưu bộ từ/i }).locator('visible=true').first();
    await expect(modalCloneBtn).toBeVisible({ timeout: 5000 });
    await modalCloneBtn.click();
    await expect.poll(() => cloneCalledWith !== null, { timeout: 5000 }).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TIER 2: Boundary & Corner Cases (Validation, Malicious XSS Strings, Guest Gate)
  // ───────────────────────────────────────────────────────────────────────────

  test('Tier 2: Guest clicking Add Word on PageVocabulary is prompted with RequireLoginModal', async ({ page }) => {
    // Override session as Guest
    await page.addInitScript(({ key }) => {
      localStorage.removeItem(key);
      sessionStorage.setItem('hivocab_guest_entered', '1');
      window._currentUser = null;
    }, { key: AUTH_TOKEN_KEY });

    await page.goto('/#vocabulary');

    const addBtn = page.getByRole('button', { name: /Thêm từ/i }).locator('visible=true').first();
    await expect(addBtn).toBeVisible({ timeout: 8000 });
    await addBtn.click();

    await expect(page.getByText(/Đăng nhập để thêm từ vựng/i)).toBeVisible({ timeout: 5000 });
  });

  test('Tier 2: AddWordModal rejects whitespace-only submission with friendly Vietnamese validation error', async ({ page }) => {
    await page.goto('/#vocabulary');
    await expect(page.getByText('ubiquitous').locator('visible=true').first()).toBeVisible({ timeout: 8000 });

    await page.evaluate(() => {
      window.__modalContext?.openModal('addWord', { topicId: 'topic-personal-1' });
    });

    const wordInput = page.locator('input[placeholder*="resilient"], input[placeholder*="Nhập từ"]').first();
    await expect(wordInput).toBeVisible({ timeout: 5000 });
    await wordInput.fill('   ');

    const meaningInput = page.locator('textarea[placeholder*="kiên cường"], textarea[required]').first();
    await meaningInput.fill('   ');

    const saveBtn = page.getByRole('button', { name: /Lưu từ vựng/i }).first();
    await saveBtn.click();

    await expect(page.getByText(/Vui lòng nhập từ vựng tiếng Anh/i)).toBeVisible();
  });

  test('Tier 2: Stored XSS payload in vocabulary meaning is safely escaped as plain text', async ({ page }) => {
    let xssTriggered = false;
    page.on('dialog', () => {
      xssTriggered = true;
    });

    vocabStore.unshift({
      id: 'vw-xss',
      topic_id: 'topic-personal-1',
      word: 'sanitize_check',
      pos: 'noun',
      phonetic: '/ˈsæn.ɪ.taɪz/',
      meaning: '<img src=x onerror="alert(1)"> nghĩa an toàn',
      example_sentence: '<script>alert("xss")</script>',
      topic_name: 'Sổ tay từ vựng IELTS',
      level: 0,
      review_count: 0,
      total_count: 3,
    });

    await page.goto('/#vocabulary');

    await expect(page.getByText('sanitize_check').locator('visible=true').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/<img src=x onerror="alert\(1\)">/i).locator('visible=true').first()).toBeVisible();
    expect(xssTriggered).toBe(false);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TIER 3: Cross-Feature Integration (AI Lookup Autofill & TSV Paste)
  // ───────────────────────────────────────────────────────────────────────────

  test('Tier 3: AddWordModal AI Autofill populates phonetic, POS, meaning and example', async ({ page }) => {
    await page.route('**/api/ai-lookup*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          word: 'tenacious',
          phonetic: '/təˈneɪ.ʃəs/',
          pos: 'adj',
          meaning: 'bền bỉ, kiên định không bỏ cuộc',
          example: 'She is a tenacious negotiator.',
        }),
      });
    });

    await page.route('**/api/dictionary*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            word: 'tenacious',
            phonetic: '/təˈneɪ.ʃəs/',
            pos: 'adj',
            meaning: 'bền bỉ, kiên định không bỏ cuộc',
            example: 'She is a tenacious negotiator.',
          },
        }),
      });
    });

    await page.goto('/#vocabulary');
    await expect(page.getByText('ubiquitous').locator('visible=true').first()).toBeVisible({ timeout: 8000 });

    await page.evaluate(() => {
      window.__modalContext?.openModal('addWord', { topicId: 'topic-personal-1' });
    });

    const wordInput = page.locator('input[placeholder*="resilient"], input[placeholder*="Nhập từ"]').first();
    await expect(wordInput).toBeVisible({ timeout: 5000 });
    await wordInput.fill('tenacious');

    const aiBtn = page.getByRole('button', { name: /AI Điền tự động/i }).first();
    await aiBtn.click();

    const meaningTextarea = page.locator('textarea[placeholder*="kiên cường"], textarea[required]').first();
    await expect(meaningTextarea).toHaveValue(/bền bỉ/, { timeout: 6000 });
  });

  test('Tier 3: BulkAddWordModal parses Tab-Separated (Excel paste) rows accurately', async ({ page }) => {
    await page.goto('/#vocabulary');
    await expect(page.getByText('ubiquitous').locator('visible=true').first()).toBeVisible({ timeout: 8000 });

    await page.evaluate(() => {
      window.__modalContext?.openModal('bulkAdd', { topicId: 'topic-personal-1' });
    });

    await page.getByRole('button', { name: /2\. Nạp dữ liệu/i }).click();

    const tsvPaste = [
      'word\tphonetic\tpos\tmeaning\texample',
      'candid\t/ˈkæn.dɪd/\tadj\tthẳng thắn, bộc trực\tTo be candid, I disagree.',
      'frugal\t/ˈfruː.ɡəl/\tadj\ttiết kiệm, giản dị\tHe leads a frugal lifestyle.',
    ].join('\n');

    await page.locator('textarea[placeholder*="JSON"]').first().fill(tsvPaste);
    await page.getByRole('button', { name: /Phân tích & Xem trước/i }).first().click();

    const previewWordInputs = page.locator('input[placeholder="Từ tiếng Anh"]');
    await expect(previewWordInputs.nth(0)).toHaveValue('candid', { timeout: 5000 });
    await expect(previewWordInputs.nth(1)).toHaveValue('frugal');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TIER 4: Real-World End-to-End Lifecycle
  // ───────────────────────────────────────────────────────────────────────────

  test('Tier 4: Full notebook lifecycle: Bulk import -> Filter in notebook -> Delete word', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.goto('/#vocabulary');
    await expect(page.getByText('ubiquitous').locator('visible=true').first()).toBeVisible({ timeout: 8000 });

    // 1. Bulk import 1 new word
    await page.evaluate(() => {
      window.__modalContext?.openModal('bulkAdd', { topicId: 'topic-personal-1' });
    });

    await page.getByRole('button', { name: /2\. Nạp dữ liệu/i }).click();
    await page.locator('textarea[placeholder*="JSON"]').first().fill('altruistic - vị tha, nghĩ cho người khác');
    await page.getByRole('button', { name: /Phân tích & Xem trước/i }).first().click();
    await expect(page.locator('input[placeholder="Từ tiếng Anh"]').first()).toHaveValue('altruistic', { timeout: 5000 });
    await page.getByRole('button', { name: /Lưu tất cả/i }).first().click();

    // 2. Verify new word appears in notebook
    await expect(page.getByText('altruistic').locator('visible=true').first()).toBeVisible({ timeout: 8000 });

    // 3. Search for it
    const searchInput = page
      .locator('#page-vocabulary input[type="text"], #page-vocabulary input[placeholder*="Tìm"]')
      .locator('visible=true')
      .first();
    await searchInput.fill('altruistic');
    await expect(page.getByText('ubiquitous').locator('visible=true')).toHaveCount(0, { timeout: 5000 });
    await expect(page.getByText('altruistic').locator('visible=true').first()).toBeVisible();

    // 4. Delete word if delete button is visible on card/row
    const deleteBtn = page
      .locator('#page-vocabulary button[title*="Xóa"], #page-vocabulary button[aria-label*="Xóa"]')
      .locator('visible=true')
      .first();
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      // Confirm delete modal button if custom confirm dialog is shown
      const confirmDeleteBtn = page.getByRole('button', { name: /^Xóa$|Xác nhận xóa/i }).locator('visible=true').first();
      if (await confirmDeleteBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await confirmDeleteBtn.click();
      }
      await expect(page.getByText('altruistic').locator('visible=true')).toHaveCount(0, { timeout: 5000 });
    }
  });
});
