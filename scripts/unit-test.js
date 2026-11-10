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

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class MockWebSocket {};
}

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

// 8. Milestone 1 Core SRS Engine, Normalization, Streak & Persistence
console.log('\n8. Testing Milestone 1 SRS Engine, Normalization, Streak & Persistence:');
const { normalizeAnswer } = await import('../src/hooks/useStudySession.js');
const { logStudySession, reviewWord, getDashboardStats } = await import('../src/services/db.js');

// 8.1 Rich Answer String Normalization (11-step pipeline)
assert(typeof normalizeAnswer === 'function', 'useStudySession exports normalizeAnswer');
assert(normalizeAnswer("don't") === normalizeAnswer("don’t"), 'normalizeAnswer: iOS curly apostrophe matches straight apostrophe');
assert(normalizeAnswer("‘rock") === normalizeAnswer("'rock"), 'normalizeAnswer: Left single quote normalized');
assert(normalizeAnswer("well-known") === normalizeAnswer("well–known"), 'normalizeAnswer: En-dash normalized to hyphen');
assert(normalizeAnswer("state-of-the-art") === normalizeAnswer("state—of—the—art"), 'normalizeAnswer: Em-dash normalized to hyphen');
assert(normalizeAnswer("cafe") === normalizeAnswer("café"), 'normalizeAnswer: Unicode NFD accent café folded to cafe');
assert(normalizeAnswer("naive") === normalizeAnswer("naïve"), 'normalizeAnswer: Unicode NFD accent naïve folded to naive');
assert(normalizeAnswer("resume") === normalizeAnswer("résumé"), 'normalizeAnswer: Multiple accents résumé folded to resume');
assert(normalizeAnswer("encyclopaedia") === normalizeAnswer("encyclopædia"), 'normalizeAnswer: Latin ligature æ unfolded to ae');
assert(normalizeAnswer("  hello   world  ") === "hello world", 'normalizeAnswer: Multiple spaces and trim');
assert(normalizeAnswer("hello\u00A0world") === "hello world", 'normalizeAnswer: Non-breaking space normalized');
assert(normalizeAnswer("w\u200Bord") === "word", 'normalizeAnswer: Invisible zero-width space stripped');
assert(normalizeAnswer("\uFEFFapple") === "apple", 'normalizeAnswer: BOM stripped');
assert(normalizeAnswer(null) === "", 'normalizeAnswer: Null/undefined safely returns empty string');

// 8.2 Guest Resilience & Streak Logging in db.js
mockStorage = {};
const guestSessionResult = await logStudySession(5);
assert(guestSessionResult && guestSessionResult.guest === true, 'db.logStudySession completes gracefully for guest without error');
const todayStr = guestSessionResult?.date || (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
})();
const savedSessions = JSON.parse(mockStorage['hi_study_sessions'] || '{}');
assert(typeof savedSessions === 'object' && savedSessions[todayStr] !== undefined, 'db.logStudySession persists session date in hi_study_sessions');

const guestReviewResult = await reviewWord('word-test-1', 'easy');
assert(guestReviewResult && guestReviewResult.guest === true && guestReviewResult.newLevel === 1, 'db.reviewWord handles guest review without throwing "Chưa đăng nhập"');
const guestProgress = JSON.parse(mockStorage['hi_guest_word_progress'] || '{}');
assert(guestProgress['word-test-1'] && guestProgress['word-test-1'].level === 1, 'db.reviewWord persists guest word progress in localStorage');

const dashboardStats = await getDashboardStats();
assert(dashboardStats && typeof dashboardStats.streak === 'number' && dashboardStats.memoryLevels.lv1 === 1, 'db.getDashboardStats calculates streak and memoryLevels from localStorage for guest');

// 8.3 useStudySession Code Contracts
assert(useStudySessionContent.includes('sessionLoggedRef'), 'useStudySession includes sessionLoggedRef single-flight guard');
assert(useStudySessionContent.includes('queueIndex >= session.queue.length'), 'useStudySession checks queue exhaustion for isComplete');
assert(!useStudySessionContent.includes('session.completed.length >= session.allWords.length'), 'useStudySession eliminates premature completed.length check in isComplete');
assert(useStudySessionContent.includes('if (!pending)') && useStudySessionContent.includes('pendingResultRef.current = null;'), 'useStudySession guards nextQuestion against double-tap skips');

// 8.4 Session Persistence Contracts
const useLessonDetailContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'hooks', 'useLessonDetail.js'), 'utf8');
assert(useLessonDetailContent.includes('hivocab_study_session_config'), 'useLessonDetail serializes session config to sessionStorage');
assert(pageLearningContent.includes('hivocab_study_session_config'), 'PageLearning restores session config from sessionStorage');
assert(pageLearningContent.includes("sessionStorage.removeItem('hivocab_study_session_config')"), 'PageLearning cleans up session config on navigation exit');

// 9. Milestone 3 Lesson Study Flows Multi-Tier Automated E2E Suite & Component Contracts
console.log('\n9. Testing Lesson Study Flows Component Contracts & Multi-Tier E2E Suite (Milestone 3):');

// 9.1 React JSX Component Filesystem Contract Verification
const exerciseFlashcardPath = path.resolve(rootDir, 'src/components/learning/ExerciseFlashcard.jsx');
const exerciseFlashcardContent = fs.readFileSync(exerciseFlashcardPath, 'utf8');
assert(exerciseFlashcardContent.includes('min-h-[48px]') && (exerciseFlashcardContent.includes('min-w-[48px]') || exerciseFlashcardContent.includes('min-w-[44px]')), 'ExerciseFlashcard.jsx: Interactive buttons enforce >=44px/48px touch targets');
assert(exerciseFlashcardContent.includes('overflow-y-auto'), 'ExerciseFlashcard.jsx: Card faces implement overflow-y-auto for small screen height resilience');
assert(exerciseFlashcardContent.includes('if (e.repeat) return;'), 'ExerciseFlashcard.jsx: Keyboard shortcuts guard against e.repeat');

const audioServicePath = path.resolve(rootDir, 'src/services/audioService.js');
const audioServiceContent = fs.readFileSync(audioServicePath, 'utf8');
assert(audioServiceContent.includes('window._activeUtterance = utter'), 'audioService.js: Retains window._activeUtterance reference against WebKit garbage collection');

const exerciseResultModalPath = path.resolve(rootDir, 'src/components/learning/ExerciseResultModal.jsx');
const exerciseResultModalContent = fs.readFileSync(exerciseResultModalPath, 'utf8');
assert(exerciseResultModalContent.includes('850') && exerciseResultModalContent.includes('handlePlayAudio'), 'ExerciseResultModal.jsx: Sequences pronunciation 850ms after sound effect chime');
assert(exerciseResultModalContent.includes('bg-[#1DB954]') && exerciseResultModalContent.includes('bg-[#EF4444]'), 'ExerciseResultModal.jsx: Uses bg-[#1DB954] for correct and bg-[#EF4444] for incorrect');
assert(exerciseResultModalContent.includes('if (!isOpen || !isCorrect || isPaused)'), 'ExerciseResultModal.jsx: Decouples countdown timer on !isCorrect for wrong answer review');
assert(exerciseResultModalContent.includes('M5 13l4 4L19 7') && exerciseResultModalContent.includes('M6 18L18 6M6 6l12 12'), 'ExerciseResultModal.jsx: Renders Checkmark SVG on correct and Alert/X SVG on wrong');

const exerciseCompletedPath = path.resolve(rootDir, 'src/components/learning/ExerciseCompleted.jsx');
const exerciseCompletedContent = fs.readFileSync(exerciseCompletedPath, 'utf8');
assert(exerciseCompletedContent.includes('Math.round((firstAttemptCorrectCount / totalCompleted) * 100)'), 'ExerciseCompleted.jsx: Implements genuine accuracy percentage calculation');
assert(exerciseCompletedContent.includes('totalCompleted * 5 + Math.round((accuracyPct / 100) * 10)'), 'ExerciseCompleted.jsx: Implements genuine XP earned bonus formula');
assert(exerciseCompletedContent.includes('function ratingLabel(w)'), 'ExerciseCompleted.jsx: Implements word mastery breakdown rating labels');
assert(exerciseCompletedContent.includes('onReviewFailedWords'), 'ExerciseCompleted.jsx: Binds onReviewFailedWords ("Học lại từ sai")');
assert(exerciseCompletedContent.includes('onPracticeAgain') && exerciseCompletedContent.includes('onBackToLesson') && exerciseCompletedContent.includes('onGoHome'), 'ExerciseCompleted.jsx: Binds navigation callbacks (onPracticeAgain, onBackToLesson, onGoHome)');

// 9.2 Multi-Tier Automated E2E Suite Execution
console.log('\n9.2 Running Lesson Study Flows Multi-Tier E2E Test Suite:');
const { runLessonStudyFlowsTests } = await import('../tests/lesson-study-flows.test.js');
const flowResults = await runLessonStudyFlowsTests();
totalTests += flowResults.totalTests;
passedTests += flowResults.passedTests;

// 9.3 4-Type MCQ Generator & Logic Test Suite
console.log('\n9.3 Running 4-Type MCQ Generator & Logic Test Suite:');
const { runQuizTypesLogicTests } = await import('../tests/quiz-types-logic.test.js');
const quizResults = await runQuizTypesLogicTests();
totalTests += quizResults.totalTests;
passedTests += quizResults.passedTests;

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
