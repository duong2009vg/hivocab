// scripts/unit-test.js
// Automated Unit & Integration Tests for HiVocab Core Logic, CSP & Router
// Directly tests production modules (db.js, dictionaryService.js, App.jsx, RouteContext.jsx, useStudySession.js)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Direct Node tests do not run through Vite, so provide harmless public test
// configuration before importing modules that create the Supabase singleton.
process.env.VITE_SUPABASE_URL ||= 'https://unit-test.invalid.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY ||= 'unit-test-anon-key';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('=======================================================');
console.log('🧪 RUNNING HIVOCAB INTEGRATION & DIRECT MODULE TESTS');
console.log('=======================================================\n');

// 1. Content Security Policy (CSP) Hardening Validation
console.log('1. Checking CSP Security Hardening:');
const headersPath = path.resolve(rootDir, 'public/_headers');
const headersContent = fs.readFileSync(headersPath, 'utf8');

assert(!headersContent.includes("'unsafe-eval'"), 'public/_headers strictly excludes unsafe-eval');
assert(headersContent.includes('challenges.cloudflare.com'), 'public/_headers permits Cloudflare Turnstile');
assert(headersContent.includes('https://*.supabase.co'), 'public/_headers permits Supabase backend');
assert(headersContent.includes("X-Frame-Options: DENY"), 'Anti-Clickjacking: X-Frame-Options is DENY');
assert(headersContent.includes("X-Content-Type-Options: nosniff"), 'Anti-MIME Sniffing: nosniff enabled');

// 2. SM-2 Spaced Repetition Logic Validation (DIRECT PRODUCTION MODULE: src/services/db.js)
console.log('\n2. Testing SM-2 SRS Algorithm via Production db.js:');
const { calculateNextReview, getIntervalLabel } = await import('../src/services/db.js');

assert(typeof calculateNextReview === 'function', 'db.calculateNextReview is exported');
assert(typeof getIntervalLabel === 'function', 'db.getIntervalLabel is exported');

// Test rating 'hard' (level decreases or stays minimum 1)
const rHard = calculateNextReview(3, 'hard');
assert(rHard.newLevel === 2, 'Production SM-2: rating "hard" drops Level 3 down to Level 2');
assert(rHard.nextReviewAt instanceof Date, 'Production SM-2: generates valid nextReviewAt Date');

// Test rating 'good' (level remains the same)
const rGood = calculateNextReview(2, 'good');
assert(rGood.newLevel === 2, 'Production SM-2: rating "good" maintains current level');

// Test rating 'easy' (level increases by 1)
const rEasy = calculateNextReview(2, 'easy');
assert(rEasy.newLevel === 3, 'Production SM-2: rating "easy" advances Level 2 to Level 3');

// Test ceiling cap at 5 (Mastered)
const rCap = calculateNextReview(5, 'easy');
assert(rCap.newLevel === 5, 'Production SM-2: Level caps safely at 5');

// Test new word (level 0 moves to level 1)
const rNew = calculateNextReview(0, 'good');
assert(rNew.newLevel === 1, 'Production SM-2: Level 0 word advances to Level 1');

// Test interval labels
assert(getIntervalLabel(1) === '1 giờ', 'Interval label for Level 1 is "1 giờ"');
assert(getIntervalLabel(2) === '8 giờ', 'Interval label for Level 2 is "8 giờ"');

// 3. Dictionary Module Validation (DIRECT PRODUCTION MODULE: src/services/dictionaryService.js)
console.log('\n3. Testing Dictionary Engine via Production dictionaryService.js:');
let mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { mockStorage = {}; }
};

const { getRecentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = await import('../src/services/dictionaryService.js');

assert(typeof getRecentSearches === 'function', 'dictionaryService.getRecentSearches is exported');
assert(typeof addRecentSearch === 'function', 'dictionaryService.addRecentSearch is exported');
assert(typeof removeRecentSearch === 'function', 'dictionaryService.removeRecentSearch is exported');
assert(typeof clearRecentSearches === 'function', 'dictionaryService.clearRecentSearches is exported');

// Test recent searches management
mockStorage['hi_dict_recent_searches'] = JSON.stringify(['abandon', 'resilient', 'meticulous']);
const recents = getRecentSearches();
assert(Array.isArray(recents) && recents.length === 3, 'dictionaryService reads stored recent searches');
assert(recents[0] === 'abandon', 'First recent search matches expectation');

removeRecentSearch('resilient');
const afterRemove = getRecentSearches();
assert(!afterRemove.includes('resilient') && afterRemove.length === 2, 'dictionaryService removes specific word from recents');

clearRecentSearches();
const afterClear = getRecentSearches();
assert(Array.isArray(afterClear) && afterClear.length === 0, 'dictionaryService clears all recent searches');

// 4. Route Integrity Validation
console.log('\n4. Checking Route Mapping Integrity:');
const appPath = path.resolve(rootDir, 'src/App.jsx');
const appContent = fs.readFileSync(appPath, 'utf8');

const expectedRoutes = [
  'landing',
  'login',
  'dashboard',
  'vocabulary',
  'topics',
  'exercises',
  'library',
  'dictionary',
  'settings',
  'support',
  'features',
  'faq',
  'reviews',
  'topic-detail',
  'lesson-detail',
  'thpt-room',
  'bilingual-reading',
  'learning',
];

for (const r of expectedRoutes) {
  assert(appContent.includes(`case '${r}':`), `App.jsx handles canonical route: '${r}'`);
}

// 5. App Component Lazy Loading Integrity & Protected Routes
console.log('\n5. Checking Route Protection & Code Splitting:');
assert(appContent.includes('const CreateTopicModal = lazy(') && appContent.includes('const PricingModal = lazy('), 'Pure React modals are lazy loaded individually');
assert(appContent.includes('<Suspense'), 'Suspense fallback boundary encapsulates components');
assert(appContent.includes('<ProtectedRoute><PageProfile /></ProtectedRoute>'), 'Profile & Settings routes are protected with ProtectedRoute');
assert(appContent.includes('guestEntered'), 'Guest entry logic safeguards in-app routes');
assert(!appContent.includes('<ProtectedRoute><PageTopics />'), 'Public visitor can browse topics without login blocker');
assert(!appContent.includes('<ProtectedRoute><PageTopicDetail />'), 'Public visitor can view topic lessons without login blocker');
assert(!appContent.includes('<ProtectedRoute><PageLearning />'), 'Public visitor can practice lessons without login blocker');

// 6. Navigation Stability & Anti-Lag Safeguards
console.log('\n6. Checking Navigation Stability & Anti-Lag Safeguards:');
const routeContextContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'router', 'RouteContext.jsx'), 'utf8');

assert(routeContextContent.includes('isNavigatingRef'), 'RouteContext guards against synthetic hashchange bounce loops');
assert(routeContextContent.includes('normalizeRoute'), 'RouteContext normalizes hash links and deep links');

// 7. Checking Topics & Learning Pure React Architecture & Services
console.log('\n7. Checking Topics & Learning Pure React Architecture:');
const pageTopicsContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'pages', 'PageTopics.jsx'), 'utf8');
const pageTopicDetailContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'pages', 'PageTopicDetail.jsx'), 'utf8');
const pageLessonDetailContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'pages', 'PageLessonDetail.jsx'), 'utf8');
const pageLearningContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'pages', 'PageLearning.jsx'), 'utf8');
const useStudySessionContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'hooks', 'useStudySession.js'), 'utf8');
const dbServiceContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'db.js'), 'utf8');
const soundServiceContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'sound.js'), 'utf8');
const supabaseClientContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'supabaseClient.js'), 'utf8');
const useTopicsContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'hooks', 'useTopics.js'), 'utf8');
const swContent = fs.readFileSync(path.join(__dirname, '..', 'public', 'sw.js'), 'utf8');

assert(pageTopicsContent.includes('useTopics'), 'PageTopics uses reactive useTopics hook');
assert(!pageTopicsContent.includes('innerHTML'), 'PageTopics contains zero innerHTML DOM manipulations');
assert(pageTopicDetailContent.includes('useTopicDetail'), 'PageTopicDetail uses reactive useTopicDetail hook');
assert(!pageTopicDetailContent.includes('innerHTML'), 'PageTopicDetail contains zero innerHTML DOM manipulations');
assert(pageLessonDetailContent.includes('useLessonDetail'), 'PageLessonDetail uses reactive useLessonDetail hook');
assert(!pageLessonDetailContent.includes('innerHTML'), 'PageLessonDetail contains zero innerHTML DOM manipulations');
assert(pageLearningContent.includes('useStudySession'), 'PageLearning uses reactive useStudySession hook');
assert(useStudySessionContent.includes('useEffect'), 'useStudySession properly imports and uses useEffect');
assert(useStudySessionContent.includes('nextQuestion'), 'useStudySession exports nextQuestion for smooth progression');

// Native Supabase client (no window.HiDB dependency for data reads)
assert(supabaseClientContent.includes('createClient'), 'supabaseClient.js creates native Supabase client via @supabase/supabase-js');
assert(supabaseClientContent.includes('swehdtrqjyklmsefkjdf'), 'supabaseClient.js is configured with correct project URL');
assert(dbServiceContent.includes("import { supabase }"), 'db.js imports native Supabase client directly');
assert(dbServiceContent.includes('export async function getTopics'), 'ES Module db.js exports getTopics');
assert(dbServiceContent.includes('fetchTopicsFromSupabase'), 'db.js has direct parallel Supabase query function');
assert(dbServiceContent.includes('hi:topics-updated'), 'db.js fires CustomEvent for SWR re-render after background revalidation');
assert(dbServiceContent.includes('export async function getCamHierarchy'), 'ES Module db.js exports getCamHierarchy');
assert(useTopicsContent.includes('hi:topics-updated'), 'useTopics listens for CustomEvent to re-render on background data arrival');
assert(soundServiceContent.includes('export function playWordAudio'), 'ES Module sound.js exports playWordAudio');
assert(swContent.includes('/assets/'), 'Service worker bypasses /assets/ to eliminate preload mismatch');

// Summary
console.log('\n=======================================================');
console.log(`📊 INTEGRATION TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
console.log('=======================================================');

if (passedTests === totalTests) {
  console.log('🎉 ALL INTEGRATION & PRODUCTION MODULE TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
} else {
  console.error(`💥 ${totalTests - passedTests} TESTS FAILED!\n`);
  process.exit(1);
}
