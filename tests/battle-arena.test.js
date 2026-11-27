// tests/battle-arena.test.js
// Unit tests for Battle Arena game rules, 1-2 minute pacing deck builders, scoring, ELO & security sanitization
import {
  MODE_CONFIG,
  START_HP,
  buildQuestionDeck,
  sanitizeRoundForClient,
  calculateHitOutcome,
  calculateEloDelta,
  getRankTier,
} from '../workers/battle-arena/src/battleLogic.js';
import {
  BATTLE_MODES,
  SOLO_STARTER_WORDS,
  generateSoloDeck,
  calculateRoundScoreAndDamage,
} from '../src/utils/battleEngine.js';

export async function runBattleArenaTests() {
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

  // 1. Pacing & Mode config (1-2 minute matches)
  assert(MODE_CONFIG.speed_blitz.totalRounds === 15 && MODE_CONFIG.speed_blitz.roundTimeMs === 12000, 'speed_blitz uses 15 rounds x 12s for 1-2 min pacing');
  assert(MODE_CONFIG.audio_sniper.totalRounds === 15 && MODE_CONFIG.audio_sniper.roundTimeMs === 12000, 'audio_sniper uses 15 rounds x 12s for 1-2 min pacing');
  assert(MODE_CONFIG.word_duel.totalRounds === 8 && MODE_CONFIG.word_duel.roundTimeMs === 20000, 'word_duel uses 8 rounds x 20s for 1-2 min pacing');
  assert(MODE_CONFIG.flash_match.totalRounds === 3 && MODE_CONFIG.flash_match.pairsPerWave === 6, 'flash_match uses 3 waves x 6 pairs = 18 words');
  assert(START_HP === 180, 'Starting HP is 180 so matches sustain 1-2 min battles');
  assert(BATTLE_MODES.length === 4, 'Client BATTLE_MODES defines all 4 game modes');

  // 2. Deck generation & answer hiding (anti-cheat)
  const blitzDeck = buildQuestionDeck(SOLO_STARTER_WORDS, 'speed_blitz');
  assert(blitzDeck.length === 15, 'buildQuestionDeck(speed_blitz) produces 15 questions');
  assert(blitzDeck.every((q) => Array.isArray(q.options) && q.options.length === 4 && q.options.includes(q.correctAnswer)), 'Every speed_blitz round has 4 options including correctAnswer');
  const safeBlitz = sanitizeRoundForClient(blitzDeck[0]);
  assert(!('correctAnswer' in safeBlitz), 'sanitizeRoundForClient strips correctAnswer before sending to PvP clients');

  const duelDeck = buildQuestionDeck(SOLO_STARTER_WORDS, 'word_duel');
  assert(duelDeck.length === 8, 'buildQuestionDeck(word_duel) produces 8 words');
  const safeDuel = sanitizeRoundForClient(duelDeck[0]);
  assert(!('word' in safeDuel) && !('correctAnswer' in safeDuel) && safeDuel.pattern.includes('_'), 'sanitizeRoundForClient hides target word in word_duel');

  const matchDeck = buildQuestionDeck(SOLO_STARTER_WORDS, 'flash_match');
  assert(matchDeck.length === 3 && matchDeck[0].pairs.length === 6, 'buildQuestionDeck(flash_match) produces 3 waves of 6 pairs');
  const safeMatch = sanitizeRoundForClient(matchDeck[0]);
  assert(!('correctAnswer' in safeMatch) && safeMatch.leftCards.length === 6 && safeMatch.rightCards.length === 6, 'sanitizeRoundForClient preserves flash_match cards cleanly');

  // 3. Scoring, escalating 1x..5x combo damage & ELO math
  const hit1x = calculateHitOutcome({ isCorrect: true, elapsedMs: 2000, timeLimitMs: 12000, streak: 0, doubleStrike: false, mode: 'speed_blitz' });
  const hit2x = calculateHitOutcome({ isCorrect: true, elapsedMs: 2000, timeLimitMs: 12000, streak: 1, doubleStrike: false, mode: 'speed_blitz' });
  const hit3x = calculateHitOutcome({ isCorrect: true, elapsedMs: 2000, timeLimitMs: 12000, streak: 2, doubleStrike: false, mode: 'speed_blitz' });
  const missOutcome = calculateHitOutcome({ isCorrect: false, elapsedMs: 3000, timeLimitMs: 12000, streak: 3, doubleStrike: false, mode: 'speed_blitz' });
  assert(
    hit1x.comboLabel === '1x' && hit2x.comboLabel === '2x' && hit3x.comboLabel === '3x',
    'Consecutive hits escalate combo chain labels 1x -> 2x -> 3x'
  );
  assert(
    hit1x.enemyDamage < hit2x.enemyDamage && hit2x.enemyDamage < hit3x.enemyDamage,
    'Escalating combo chain strictly increases damage (1x < 2x < 3x)'
  );
  assert(
    missOutcome.nextStreak === 0 && missOutcome.selfDamage >= 10 && missOutcome.enemyDamage === 0,
    'Wrong answer resets combo streak to 0, deals self HP penalty, and forfeits attack'
  );

  const doubleHit = calculateHitOutcome({ isCorrect: true, elapsedMs: 2500, timeLimitMs: 12000, streak: 0, doubleStrike: true, mode: 'speed_blitz' });
  const normalHit = calculateHitOutcome({ isCorrect: true, elapsedMs: 2500, timeLimitMs: 12000, streak: 0, doubleStrike: false, mode: 'speed_blitz' });
  assert(doubleHit.enemyDamage === normalHit.enemyDamage * 2 && doubleHit.points === normalHit.points * 2, 'Double Strike power-up doubles both damage and points');

  const clientOutcome = calculateRoundScoreAndDamage({ isCorrect: true, elapsedMs: 2500, timeLimitMs: 12000, streak: 2, doubleStrike: false, mode: 'speed_blitz' });
  const workerCombo3 = calculateHitOutcome({ isCorrect: true, elapsedMs: 2500, timeLimitMs: 12000, streak: 2, doubleStrike: false, mode: 'speed_blitz' });
  assert(
    clientOutcome.points === workerCombo3.points &&
      clientOutcome.enemyDamage === workerCombo3.enemyDamage &&
      clientOutcome.comboLabel === workerCombo3.comboLabel,
    'Client Solo scoring & combo chain matches Worker authoritative scoring'
  );

  const winDelta = calculateEloDelta(1000, 1000, 1);
  const lossDelta = calculateEloDelta(1000, 1000, 0);
  assert(winDelta === 12 && lossDelta === -12, 'Evenly matched ELO K=24 delta is +12 / -12');
  assert(getRankTier(1950).name === 'Chí Tôn' && getRankTier(1000).name === 'Tân Binh', 'Rank tiers resolve correctly');

  // 4. Solo Arcade generator
  const soloAudio = generateSoloDeck([], 'audio_sniper');
  assert(soloAudio.length === 15 && soloAudio.every((q) => Boolean(q.audioWord) && q.options.length === 4), 'Solo Arcade works offline/guest using starter deck');

  return { totalTests, passedTests };
}
