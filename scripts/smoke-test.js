// scripts/smoke-test.js
// Automated Smoke Test for HiVocab React Architecture & Production Build
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
console.log('🧪 RUNNING HIVOCAB ARCHITECTURAL SMOKE TESTS');
console.log('=======================================================\n');

// 1. Source Architecture Verification
console.log('1. Checking Core Source Files:');
const requiredSourceFiles = [
  'src/main.jsx',
  'src/App.jsx',
  'src/providers/AuthProvider.jsx',
  'src/router/RouteContext.jsx',
  'src/components/common/ProtectedRoute.jsx',
  'src/legacy/legacyBridge.js',
  'src/hooks/useDashboardStats.js',
  'src/hooks/useDictionary.js',
  'src/hooks/useVocabulary.js',
  'src/hooks/useTopics.js',
  'src/hooks/useTopicDetail.js',
  'src/hooks/useLessonDetail.js',
  'src/lib/supabaseClient.js',
  'src/services/db.js',
  'src/services/sound.js',
  'src/components/pages/PageTopics.jsx',
  'src/components/pages/PageTopicDetail.jsx',
  'src/components/pages/PageLessonDetail.jsx',
  'legacyApp.js',
  'dataLayer.js',
  'functions/api/tts.js',
  'functions/app.js',
  'functions/login.js',
  'public/_redirects',
  'vercel.json',
  'vite.config.js',
];

for (const relPath of requiredSourceFiles) {
  const fullPath = path.resolve(rootDir, relPath);
  assert(fs.existsSync(fullPath), `File exists: ${relPath}`);
}

// 2. Production Build Verification
console.log('\n2. Checking Production Build Artifacts (dist/):');
const distDir = path.resolve(rootDir, 'dist');
assert(fs.existsSync(distDir), 'Directory dist/ exists');

const distIndex = path.resolve(distDir, 'index.html');
assert(fs.existsSync(distIndex), 'File dist/index.html exists');

if (fs.existsSync(distIndex)) {
  const html = fs.readFileSync(distIndex, 'utf-8');
  assert(html.includes('legacyApp.js'), 'dist/index.html includes legacyApp.js');
  assert(html.includes('dataLayer.js'), 'dist/index.html includes dataLayer.js');
  assert(html.includes('soundEngine.js'), 'dist/index.html includes soundEngine.js');
  assert(!html.includes('<script defer src="app.js'), 'No collision: dist/index.html does not request legacy app.js directly');
}

assert(fs.existsSync(path.resolve(distDir, 'legacyApp.js')), 'dist/legacyApp.js is copied to dist');
assert(fs.existsSync(path.resolve(distDir, 'functions/api/tts.js')), 'dist/functions/api/tts.js is present');

// 3. Bundle Size Check
console.log('\n3. Checking Code Splitting & Chunk Sizes:');
const assetsDir = path.resolve(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter(f => f.endsWith('.js'));
  assert(jsFiles.length >= 10, `Code splitting active: found ${jsFiles.length} separate JS chunks`);

  let maxChunkSize = 0;
  let maxChunkName = '';
  for (const js of jsFiles) {
    const size = fs.statSync(path.resolve(assetsDir, js)).size;
    if (size > maxChunkSize) {
      maxChunkSize = size;
      maxChunkName = js;
    }
  }
  const maxKb = (maxChunkSize / 1024).toFixed(1);
  assert(maxChunkSize < 500 * 1024, `All chunks strictly under 500 kB (Largest: ${maxChunkName} at ${maxKb} kB)`);

  const mainFile = jsFiles.find(f => f.startsWith('main-'));
  if (mainFile) {
    const mainSize = fs.statSync(path.resolve(assetsDir, mainFile)).size;
    const mainKb = (mainSize / 1024).toFixed(1);
    assert(mainSize < 150 * 1024, `Main entry chunk strictly under 150 kB (${mainFile} at ${mainKb} kB)`);
  }
}

console.log('\n=======================================================');
console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
console.log('=======================================================');

if (passedTests === totalTests) {
  console.log('🎉 ALL ARCHITECTURAL SMOKE TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
} else {
  console.error(`💥 FAILED: ${totalTests - passedTests} tests failed.\n`);
  process.exit(1);
}
