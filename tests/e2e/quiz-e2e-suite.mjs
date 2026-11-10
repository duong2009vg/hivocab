// tests/e2e/quiz-e2e-suite.mjs
// Master 4-Tier E2E Test Suite Runner for HiVocab Multiple-Choice Quiz Overhaul (Milestone 3)
// Zero external test runner dependencies. Runs cleanly via: node tests/e2e/quiz-e2e-suite.mjs

import './env-setup.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { CDPHarness, findBrowserBinary } from './cdp-helper.mjs';
import { runTier1FeatureCoverage } from './tier1-feature-coverage.mjs';
import { runTier2BoundaryCases } from './tier2-boundary-cases.mjs';
import { runTier3CrossFeature } from './tier3-cross-feature.mjs';
import { runTier4ApplicationScenarios } from './tier4-application-scenarios.mjs';

const DIST_DIR = path.resolve('dist');
const HTTP_PORT = parseInt(process.env.TEST_PORT || '4198', 10);
const CDP_PORT = parseInt(process.env.CDP_PORT || '9488', 10);

export async function runFullQuizE2ESuite() {
  const suiteStartTime = Date.now();
  console.log('================================================================================');
  console.log('🏆 HIVOCAB 4-TIER MULTIPLE-CHOICE QUIZ E2E TEST SUITE (MILESTONE 3)');
  console.log('================================================================================');
  console.log(`Execution Mode : Node.js ESM Standalone + Headless Browser CDP`);
  console.log(`HTTP Port      : ${HTTP_PORT}`);
  console.log(`CDP Port       : ${CDP_PORT}`);
  console.log(`Dist Directory : ${DIST_DIR}`);
  console.log('--------------------------------------------------------------------------------\n');

  const browserPath = findBrowserBinary();
  let cdpHarness = null;

  if (browserPath && fs.existsSync(DIST_DIR)) {
    console.log(`🚀 Initializing CDP Browser Harness: ${browserPath}`);
    cdpHarness = new CDPHarness({ httpPort: HTTP_PORT, cdpPort: CDP_PORT, distDir: DIST_DIR });
    try {
      await cdpHarness.start();
      console.log('✅ CDP Headless Harness successfully initialized and connected.\n');
    } catch (err) {
      console.warn(`⚠️ Warning: CDP initialization encountered an error: ${err.message}.`);
      console.warn('Falling back to pure ESM execution mode.\n');
      cdpHarness = null;
    }
  } else {
    console.warn('⚠️ Note: Headless browser binary or dist/ directory not found. Running logic tiers.\n');
  }

  const tierStats = {
    tier1: { name: 'Tier 1: Feature Coverage (6 Features)', total: 0, passed: 0, failed: 0 },
    tier2: { name: 'Tier 2: Boundary & Corner Cases (6 Boundaries)', total: 0, passed: 0, failed: 0 },
    tier3: { name: 'Tier 3: Cross-Feature Combinations', total: 0, passed: 0, failed: 0 },
    tier4: { name: 'Tier 4: Real-World Application Scenarios', total: 0, passed: 0, failed: 0 },
  };

  const allResults = [];

  function recordTest(category, testName, condition, details = '') {
    const passed = Boolean(condition);
    let targetTier = 'tier1';
    if (category.includes('Tier 2')) targetTier = 'tier2';
    else if (category.includes('Tier 3')) targetTier = 'tier3';
    else if (category.includes('Tier 4')) targetTier = 'tier4';

    tierStats[targetTier].total++;
    if (passed) {
      tierStats[targetTier].passed++;
      console.log(`  ✅ PASS: [${category}] ${testName}`);
      if (details) console.log(`          ${details}`);
    } else {
      tierStats[targetTier].failed++;
      console.log(`  ❌ FAIL: [${category}] ${testName}`);
      if (details) console.log(`          ${details}`);
    }

    allResults.push({ category, testName, passed, details });
  }

  try {
    // ── Run Tier 1 ─────────────────────────────────────────────────────────────
    await runTier1FeatureCoverage({ cdpHarness, recordTest });

    // ── Run Tier 2 ─────────────────────────────────────────────────────────────
    await runTier2BoundaryCases({ cdpHarness, recordTest });

    // ── Run Tier 3 ─────────────────────────────────────────────────────────────
    await runTier3CrossFeature({ cdpHarness, recordTest });

    // ── Run Tier 4 ─────────────────────────────────────────────────────────────
    await runTier4ApplicationScenarios({ cdpHarness, recordTest });

  } catch (fatalErr) {
    console.error('\n💥 Fatal Exception during E2E Suite execution:', fatalErr);
    process.exitCode = 1;
  } finally {
    if (cdpHarness) {
      console.log('\n🧹 Tearing down CDP headless browser harness and ephemeral HTTP server...');
      await cdpHarness.stop();
      console.log('✅ CDP teardown complete.');
    }
  }

  const suiteElapsed = ((Date.now() - suiteStartTime) / 1000).toFixed(2);
  const grandTotal = allResults.length;
  const grandPassed = allResults.filter(r => r.passed).length;
  const grandFailed = allResults.filter(r => !r.passed).length;

  console.log('\n================================================================================');
  console.log('📊 HIVOCAB QUIZ E2E 4-TIER FINAL VERIFICATION SUMMARY');
  console.log('================================================================================');
  console.log(`Total Run Duration: ${suiteElapsed}s\n`);

  for (const [key, stats] of Object.entries(tierStats)) {
    const statusIcon = stats.failed === 0 && stats.total > 0 ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${statusIcon} [${stats.name}]: ${stats.passed}/${stats.total} passed`);
  }

  console.log('--------------------------------------------------------------------------------');
  console.log(`TOTAL CHECKS EXECUTED : ${grandTotal}`);
  console.log(`PASSED CHECKS         : ${grandPassed} ✅`);
  console.log(`FAILED CHECKS         : ${grandFailed} ❌`);
  console.log('================================================================================\n');

  if (grandFailed > 0) {
    console.error(`💥 E2E TEST SUITE FAILED: ${grandFailed} check(s) did not pass.`);
    process.exit(1);
  } else {
    console.log('🎉 100% OF ALL 4 TIERS PASSED! SYSTEM VERIFIED READY FOR MILESTONE 3.');
    process.exit(0);
  }
}

if (process.argv[1] && (process.argv[1].endsWith('quiz-e2e-suite.mjs') || process.argv[1].includes('quiz-e2e-suite'))) {
  runFullQuizE2ESuite();
}
