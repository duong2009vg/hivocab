// tests/fsrs-algorithm.test.js
// Dedicated mathematical and behavioral verification suite for HiVocab's FSRS-6 DSR Engine
import {
  FSRS6_DEFAULT_WEIGHTS,
  FSRS_RATING,
  FSRS_STATE,
  calculateRetrievability,
  calculateNextIntervalDays,
  calculateInitialStability,
  calculateInitialDifficulty,
  calculateNextDifficulty,
  calculateSameDayStability,
  calculateRecallStability,
  calculateForgetStability,
  stabilityToMemoryLevel,
  migrateSM2ToFSRSState,
  scheduleFSRSReview,
  previewFSRSIntervals,
  getWordRetrievability,
} from '../src/utils/fsrs.js';

export async function runFSRSAlgorithmTests() {
  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ PASS: ${message}`);
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  console.log('\n=======================================================');
  console.log('🧠 TESTING FSRS-6 (21-PARAMETER DSR) CORE ALGORITHM');
  console.log('=======================================================');

  // 1. Parameter & Curve Identities
  assert(FSRS6_DEFAULT_WEIGHTS.length === 21, 'FSRS-6 has exact 21 default parameters (w0..w20)');
  const rAtStability = calculateRetrievability(10, 10);
  assert(Math.abs(rAtStability - 0.9) < 1e-6, `Forgetting curve identity: R(S, S) === 0.90 (actual: ${rAtStability})`);

  const rAtZero = calculateRetrievability(10, 0);
  assert(rAtZero === 1, 'Forgetting curve boundary: R(S, 0) === 1.0');

  const intervalAt90 = calculateNextIntervalDays(12.5, 0.9);
  assert(Math.abs(intervalAt90 - 12.5) < 1e-4, `Interval identity: I(0.90, S) === S (actual: ${intervalAt90})`);

  // Desired retention knob: higher retention -> shorter interval; lower retention -> longer interval
  const i80 = calculateNextIntervalDays(10, 0.8);
  const i90 = calculateNextIntervalDays(10, 0.9);
  const i95 = calculateNextIntervalDays(10, 0.95);
  assert(i95 < i90 && i90 < i80, `Desired retention knob: I(0.95)=${i95.toFixed(2)} < I(0.90)=${i90.toFixed(2)} < I(0.80)=${i80.toFixed(2)}`);

  // 2. Initial State S0(G) & D0(G)
  const sAgain = calculateInitialStability(FSRS_RATING.AGAIN);
  const sHard = calculateInitialStability(FSRS_RATING.HARD);
  const sGood = calculateInitialStability(FSRS_RATING.GOOD);
  const sEasy = calculateInitialStability(FSRS_RATING.EASY);
  assert(sAgain < sHard && sHard < sGood && sGood < sEasy, 'Initial stability strictly increases with rating (Again < Hard < Good < Easy)');

  const dAgain = calculateInitialDifficulty(FSRS_RATING.AGAIN);
  const dEasy = calculateInitialDifficulty(FSRS_RATING.EASY);
  assert(dAgain > dEasy && dAgain <= 10 && dEasy >= 1, `Initial difficulty bounds & order: D0(Again)=${dAgain.toFixed(2)} > D0(Easy)=${dEasy.toFixed(2)}`);

  // 3. Anti-"Ease Hell" Mean Reversion for Difficulty
  let dVal = 9.8;
  for (let i = 0; i < 6; i++) {
    dVal = calculateNextDifficulty(dVal, FSRS_RATING.GOOD);
  }
  assert(dVal < 9.8 && dVal >= 1, `Mean reversion: Repeated Good gently relaxes high difficulty (${dVal.toFixed(3)} < 9.8)`);

  // 4. Stability Growth (Recall) vs Post-Lapse Penalty (Again)
  const sRecallGood = calculateRecallStability(5.0, 10.0, 0.9, FSRS_RATING.GOOD);
  const sRecallEasy = calculateRecallStability(5.0, 10.0, 0.9, FSRS_RATING.EASY);
  const sRecallHard = calculateRecallStability(5.0, 10.0, 0.9, FSRS_RATING.HARD);
  assert(sRecallHard >= 10.0 && sRecallHard < sRecallGood && sRecallGood < sRecallEasy, 'Successful recall grows stability in order: S <= Hard < Good < Easy');

  const sLapse = calculateForgetStability(5.0, 20.0, 0.85);
  assert(sLapse < 20.0 && sLapse > 0.01, `Post-lapse stability drops below prior S (${sLapse.toFixed(2)} < 20.0) without collapsing to 0`);

  // 5. Spacing Effect on Overdue Reviews (Lower R -> Larger S_Inc)
  const sOnTime = calculateRecallStability(5.0, 10.0, 0.9, FSRS_RATING.GOOD);
  const sOverdue = calculateRecallStability(5.0, 10.0, 0.65, FSRS_RATING.GOOD);
  assert(sOverdue > sOnTime, `Spacing effect: Overdue successful recall (R=0.65 -> S'=${sOverdue.toFixed(2)}) yields higher S than on-time (R=0.90 -> S'=${sOnTime.toFixed(2)})`);

  // 6. Same-day Review Scaling
  const sSameDayGood = calculateSameDayStability(2.0, FSRS_RATING.GOOD);
  assert(sSameDayGood >= 2.0, `Same-day Good keeps stability >= prior S (${sSameDayGood.toFixed(2)} >= 2.0)`);

  // 7. End-to-End Scheduling & Migration
  const now = new Date('2026-11-18T12:00:00Z');
  const firstGood = scheduleFSRSReview(0, 'good', { now });
  assert(firstGood.state === FSRS_STATE.REVIEW && firstGood.newLevel === 1 && firstGood.stability > 2.0, 'New card rated Good schedules into Review with S0(3) > 2 days');

  const firstAgain = scheduleFSRSReview(0, 'again', { now });
  assert(firstAgain.state === FSRS_STATE.LEARNING && firstAgain.lapses === 1 && firstAgain.newLevel === 1, 'New card rated Again enters Learning with lapse=1');

  const lapseFromMastered = scheduleFSRSReview(5, 'again', { now });
  assert(lapseFromMastered.state === FSRS_STATE.RELEARNING && lapseFromMastered.newLevel === 1, 'Mastered card rated Again enters Relearning and drops to Lvl 1');

  const migrated = migrateSM2ToFSRSState(4, 5);
  assert(migrated.stability === 18.0 && stabilityToMemoryLevel(migrated.stability, migrated.state) === 4, 'Legacy SM-2 Level 4 migrates cleanly to Stability 18d (Lvl 4)');

  const preview = previewFSRSIntervals({ level: 2, stability: 4.0, difficulty: 5.5, state: FSRS_STATE.REVIEW, lastReviewedAt: new Date('2026-11-14T12:00:00Z') }, { now });
  assert(
    preview.again.scheduledDays < preview.hard.scheduledDays &&
    preview.hard.scheduledDays < preview.good.scheduledDays &&
    preview.good.scheduledDays < preview.easy.scheduledDays,
    '4-button preview intervals strictly ordered: Again < Hard < Good < Easy'
  );

  const urgentWord = { level: 2, stability: 3.0, difficulty: 5.5, fsrsState: FSRS_STATE.REVIEW, lastReviewedAt: new Date('2026-11-01T12:00:00Z') };
  const freshWord = { level: 2, stability: 3.0, difficulty: 5.5, fsrsState: FSRS_STATE.REVIEW, lastReviewedAt: new Date('2026-11-17T12:00:00Z') };
  assert(getWordRetrievability(urgentWord, now) < getWordRetrievability(freshWord, now), 'getWordRetrievability ranks overdue word lower R than recently reviewed word');

  return { totalTests, passedTests };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const { totalTests, passedTests } = await runFSRSAlgorithmTests();
  console.log(`\nFSRS-6 Algorithm Tests: ${passedTests}/${totalTests} PASSED`);
  process.exit(passedTests === totalTests ? 0 : 1);
}
