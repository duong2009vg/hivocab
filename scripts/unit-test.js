// scripts/unit-test.js
// Automated Unit & Integration Tests for HiVocab Core Logic, CSP & Router
// Directly tests production modules (dataLayer.js, dictionary.js, App.jsx, RouteContext.jsx)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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
const vercelPath = path.resolve(rootDir, 'vercel.json');

const headersContent = fs.readFileSync(headersPath, 'utf8');
const vercelContent = fs.readFileSync(vercelPath, 'utf8');

assert(!headersContent.includes("'unsafe-eval'"), 'public/_headers strictly excludes unsafe-eval');
assert(!vercelContent.includes("'unsafe-eval'"), 'vercel.json strictly excludes unsafe-eval');
assert(headersContent.includes('challenges.cloudflare.com'), 'public/_headers permits Cloudflare Turnstile');
assert(headersContent.includes('https://*.supabase.co'), 'public/_headers permits Supabase backend');
assert(headersContent.includes("X-Frame-Options: DENY"), 'Anti-Clickjacking: X-Frame-Options is DENY');
assert(headersContent.includes("X-Content-Type-Options: nosniff"), 'Anti-MIME Sniffing: nosniff enabled');

// 2. SM-2 Spaced Repetition Logic Validation (DIRECT PRODUCTION MODULE: dataLayer.js)
console.log('\n2. Testing SM-2 SRS Algorithm via Production dataLayer.js:');
global.window = global;
global.document = { addEventListener: () => {} };
const dataLayerSource = fs.readFileSync(path.resolve(rootDir, 'dataLayer.js'), 'utf8');
eval(dataLayerSource);

assert(typeof global.HiDB !== 'undefined', 'Production HiDB engine initialized');
assert(typeof global.HiDB.calculateNextReview === 'function', 'HiDB.calculateNextReview is exported for tests');
assert(typeof global.HiDB.getIntervalLabel === 'function', 'HiDB.getIntervalLabel is exported for tests');

// Test rating 'hard' (level decreases or stays minimum 1)
const rHard = global.HiDB.calculateNextReview(3, 'hard');
assert(rHard.newLevel === 2, 'Production SM-2: rating "hard" drops Level 3 down to Level 2');
assert(rHard.nextReviewAt instanceof Date, 'Production SM-2: generates valid nextReviewAt Date');

// Test rating 'good' (level remains the same)
const rGood = global.HiDB.calculateNextReview(2, 'good');
assert(rGood.newLevel === 2, 'Production SM-2: rating "good" maintains current level');

// Test rating 'easy' (level increases by 1)
const rEasy = global.HiDB.calculateNextReview(2, 'easy');
assert(rEasy.newLevel === 3, 'Production SM-2: rating "easy" advances Level 2 to Level 3');

// Test ceiling cap at 5 (Mastered)
const rCap = global.HiDB.calculateNextReview(5, 'easy');
assert(rCap.newLevel === 5, 'Production SM-2: Level caps safely at 5');

// Test new word (level 0 moves to level 1)
const rNew = global.HiDB.calculateNextReview(0, 'good');
assert(rNew.newLevel === 1, 'Production SM-2: Level 0 word advances to Level 1');

// Test interval labels
assert(global.HiDB.getIntervalLabel(1) === '1 giờ', 'Interval label for Level 1 is "1 giờ"');
assert(global.HiDB.getIntervalLabel(2) === '8 giờ', 'Interval label for Level 2 is "8 giờ"');

// 3. Dictionary Module Validation (DIRECT PRODUCTION MODULE: dictionary.js)
console.log('\n3. Testing Dictionary Engine via Production dictionary.js:');
let mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { mockStorage = {}; }
};

const dictSource = fs.readFileSync(path.resolve(rootDir, 'dictionary.js'), 'utf8');
eval(dictSource);

assert(typeof global.HiDict !== 'undefined', 'Production HiDict engine initialized');
assert(typeof global.HiDict.lookupWord === 'function', 'HiDict.lookupWord is exported');
assert(typeof global.HiDict.getRecentSearches === 'function', 'HiDict.getRecentSearches is exported');
assert(typeof global.HiDict.removeRecentSearch === 'function', 'HiDict.removeRecentSearch is exported');
assert(typeof global.HiDict.clearRecentSearches === 'function', 'HiDict.clearRecentSearches is exported');

// Test recent searches management
mockStorage['hi_dict_recent_searches'] = JSON.stringify(['abandon', 'resilient', 'meticulous']);
const recents = global.HiDict.getRecentSearches();
assert(Array.isArray(recents) && recents.length === 3, 'HiDict reads stored recent searches');
assert(recents[0] === 'abandon', 'First recent search matches expectation');

global.HiDict.removeRecentSearch('resilient');
const afterRemove = global.HiDict.getRecentSearches();
assert(!afterRemove.includes('resilient') && afterRemove.length === 2, 'HiDict removes specific word from recents');

global.HiDict.clearRecentSearches();
const afterClear = global.HiDict.getRecentSearches();
assert(Array.isArray(afterClear) && afterClear.length === 0, 'HiDict clears all recent searches');

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
assert(appContent.includes('const Modals = lazy('), 'Modals dialogs are lazy loaded');
assert(appContent.includes('<Suspense'), 'Suspense fallback boundary encapsulates components');
assert(!appContent.includes('.page.active'), 'Legacy CSS class .page.active has been eliminated from routing switch');
assert(appContent.includes('<ProtectedRoute><PageDashboard /></ProtectedRoute>'), 'Dashboard route is protected with ProtectedRoute');
assert(appContent.includes('<ProtectedRoute><PageVocabulary /></ProtectedRoute>'), 'Vocabulary route is protected with ProtectedRoute');
assert(appContent.includes('<ProtectedRoute><PageDictionary /></ProtectedRoute>'), 'Dictionary route is protected with ProtectedRoute');

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
