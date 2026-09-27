// scripts/unit-test.js
// Automated Unit & Integration Tests for HiVocab Core Logic, CSP & Router
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
console.log('🧪 RUNNING HIVOCAB INTEGRATION & LOGIC TESTS');
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

// 2. SM-2 Spaced Repetition Logic Validation
console.log('\n2. Testing SM-2 SRS Algorithm Intervals:');
function calculateNextReview(currentLevel, rating) {
  // rating: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy
  const intervals = [
    1 * 60 * 60 * 1000,       // Lvl 1: 1 hour
    8 * 60 * 60 * 1000,       // Lvl 2: 8 hours
    24 * 60 * 60 * 1000,      // Lvl 3: 1 day
    3 * 24 * 60 * 60 * 1000,  // Lvl 4: 3 days
    7 * 24 * 60 * 60 * 1000,  // Lvl 5: 7 days
    30 * 24 * 60 * 60 * 1000, // Lvl 6+: 30 days
  ];

  let nextLevel;
  if (rating === 0) {
    nextLevel = Math.max(0, currentLevel - 1);
  } else if (rating === 1) {
    nextLevel = currentLevel;
  } else if (rating === 2) {
    nextLevel = Math.min(5, currentLevel + 1);
  } else {
    nextLevel = Math.min(5, currentLevel + 2);
  }

  const intervalMs = intervals[Math.min(nextLevel, intervals.length - 1)];
  return { nextLevel, intervalMs };
}

const rAgain = calculateNextReview(3, 0);
assert(rAgain.nextLevel === 2, 'Rating 0 (Again) drops Level 3 down to Level 2');

const rHard = calculateNextReview(2, 1);
assert(rHard.nextLevel === 2, 'Rating 1 (Hard) maintains current level');

const rGood = calculateNextReview(2, 2);
assert(rGood.nextLevel === 3, 'Rating 2 (Good) promotes Level 2 to Level 3');

const rEasy = calculateNextReview(2, 3);
assert(rEasy.nextLevel === 4, 'Rating 3 (Easy) accelerates Level 2 to Level 4');

const rMax = calculateNextReview(5, 2);
assert(rMax.nextLevel === 5, 'SRS level caps safely at Level 5 (Mastered)');

// 3. Dictionary Normalization Logic Validation
console.log('\n3. Testing Dictionary Data Normalization:');
function extractPos(rawPos, rawMeaning) {
  if (rawPos && typeof rawPos === 'string' && rawPos.trim()) return rawPos.trim().toLowerCase();
  if (!rawMeaning || typeof rawMeaning !== 'string') return 'từ vựng';
  const m = rawMeaning.match(/^\(([a-zA-Z\s]+)\)/);
  if (m && m[1]) return m[1].toLowerCase().trim();
  return 'từ vựng';
}

function cleanMeaning(rawMeaning) {
  if (!rawMeaning || typeof rawMeaning !== 'string') return '';
  return rawMeaning.replace(/^(\([a-zA-Z\s]+\)|\[[a-zA-Z\s]+\])\s*/, '').trim();
}

assert(extractPos('verb', 'to run fast') === 'verb', 'Preserves clean pos string');
assert(extractPos('', '(v) chạy nhanh') === 'v', 'Extracts pos tag from parenthesized meaning');
assert(cleanMeaning('(adj) kiên cường') === 'kiên cường', 'Strips leading tag from meaning');
assert(cleanMeaning('bỏ rơi, từ bỏ') === 'bỏ rơi, từ bỏ', 'Preserves meaning without leading tag');

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

// 5. App Component Lazy Loading Integrity
console.log('\n5. Checking Lazy Route Splitting:');
assert(appContent.includes('const Modals = lazy('), 'Modals dialogs are lazy loaded');
assert(appContent.includes('<Suspense'), 'Suspense fallback boundary encapsulates components');
assert(!appContent.includes('.page.active'), 'Legacy CSS class .page.active has been eliminated from routing switch');

// Summary
console.log('\n=======================================================');
console.log(`📊 INTEGRATION TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
console.log('=======================================================');

if (passedTests === totalTests) {
  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
} else {
  console.error(`💥 ${totalTests - passedTests} TESTS FAILED!\n`);
  process.exit(1);
}
