// src/utils/fsrs.js
// Core FSRS-6 (Free Spaced Repetition Scheduler v6) Engine for HiVocab
// Based on the DSR (Difficulty, Stability, Retrievability) 21-parameter memory model:
// Reference: https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm

/**
 * FSRS-6 Default Parameters (21 weights: w[0] .. w[20])
 * Trained on hundreds of millions of Anki review logs (open-spaced-repetition/srs-benchmark).
 */
export const FSRS6_DEFAULT_WEIGHTS = Object.freeze([
  0.212,   // w0: Initial Stability S0(1 - Again) in days (~5.1 hours)
  1.2931,  // w1: Initial Stability S0(2 - Hard) in days
  2.3065,  // w2: Initial Stability S0(3 - Good) in days
  8.2956,  // w3: Initial Stability S0(4 - Easy) in days
  6.4133,  // w4: Initial Difficulty D0(1) when first rating is Again
  0.8334,  // w5: Initial Difficulty exponential decay rate
  3.0194,  // w6: Difficulty linear damping delta multiplier
  0.001,   // w7: Difficulty mean reversion weight toward D0(4)
  1.8722,  // w8: Recall stability increase base exponent
  0.1666,  // w9: Recall stability saturation power (S^-w9)
  0.796,   // w10: Recall retrievability sensitivity (spacing effect)
  1.4835,  // w11: Post-lapse stability base multiplier
  0.0614,  // w12: Post-lapse difficulty power (D^-w12)
  0.2629,  // w13: Post-lapse stability power ((S+1)^w13 - 1)
  1.6483,  // w14: Post-lapse retrievability sensitivity
  0.6014,  // w15: Hard rating penalty multiplier (G = 2)
  1.8729,  // w16: Easy rating bonus multiplier (G = 4)
  0.5425,  // w17: Same-day review stability exponent
  0.0912,  // w18: Same-day review grade offset
  0.0658,  // w19: Same-day review stability damping power
  0.1542,  // w20: Forgetting curve trainable decay exponent
]);

export const FSRS_DEFAULT_RETENTION = 0.9;
export const FSRS_MIN_RETENTION = 0.7;
export const FSRS_MAX_RETENTION = 0.97;
export const FSRS_DEFAULT_MAX_INTERVAL_DAYS = 365;
export const FSRS_MIN_STABILITY_DAYS = 0.01; // ~14.4 minutes minimum stability floor

/**
 * Standard 4-button FSRS Rating enum
 */
export const FSRS_RATING = Object.freeze({
  AGAIN: 1, // Quên / Học lại
  HARD: 2,  // Khó
  GOOD: 3,  // Tốt
  EASY: 4,  // Dễ
});

/**
 * FSRS Card Lifecycle State
 */
export const FSRS_STATE = Object.freeze({
  NEW: 0,
  LEARNING: 1,
  REVIEW: 2,
  RELEARNING: 3,
});

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Clamp a numeric value within [min, max].
 */
export function clamp(val, min, max) {
  const n = Number(val);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * Normalize string or numeric rating into FSRS grade 1..4.
 * Supports 'again' (1), 'hard' (2), 'good'/'normal' (3), 'easy' (4).
 */
export function normalizeFSRSRating(rating) {
  if (typeof rating === 'number' && Number.isFinite(rating)) {
    return clamp(Math.round(rating), 1, 4);
  }
  const key = String(rating || '').trim().toLowerCase();
  switch (key) {
    case 'again':
    case 'lapse':
    case 'fail':
    case 'forgot':
    case '1':
      return FSRS_RATING.AGAIN;
    case 'hard':
    case '2':
      return FSRS_RATING.HARD;
    case 'good':
    case 'normal':
    case '3':
      return FSRS_RATING.GOOD;
    case 'easy':
    case '4':
      return FSRS_RATING.EASY;
    default:
      return FSRS_RATING.GOOD;
  }
}

/**
 * Convert numeric grade (1..4) back to canonical rating string.
 */
export function ratingToKey(grade) {
  const g = normalizeFSRSRating(grade);
  if (g === FSRS_RATING.AGAIN) return 'again';
  if (g === FSRS_RATING.HARD) return 'hard';
  if (g === FSRS_RATING.EASY) return 'easy';
  return 'good';
}

/**
 * Compute FSRS-6 forgetting curve factor from w[20]:
 * factor = 0.9^(-1 / w20) - 1, ensuring R(S, S) = 0.90.
 */
export function getForgettingCurveFactor(weights = FSRS6_DEFAULT_WEIGHTS) {
  const w20 = clamp(weights?.[20] ?? FSRS6_DEFAULT_WEIGHTS[20], 0.01, 2.0);
  return Math.pow(0.9, -1 / w20) - 1;
}

/**
 * FSRS-6 Forgetting Curve: Calculate Retrievability R(t, S) in (0, 1].
 * @param {number} stability - Memory stability S in days (interval where R = 90%)
 * @param {number} elapsedDays - Elapsed time t in days since last review
 * @param {number[]} [weights] - 21 FSRS-6 parameters
 * @returns {number} Probability of recall R in (0, 1]
 */
export function calculateRetrievability(stability, elapsedDays, weights = FSRS6_DEFAULT_WEIGHTS) {
  const s = Number(stability);
  const t = Math.max(0, Number(elapsedDays) || 0);
  if (!Number.isFinite(s) || s <= 0) return 0;
  if (t === 0) return 1;

  const w20 = clamp(weights?.[20] ?? FSRS6_DEFAULT_WEIGHTS[20], 0.01, 2.0);
  const factor = getForgettingCurveFactor(weights);
  const r = Math.pow(1 + (factor * t) / s, -w20);
  return clamp(r, 0.0001, 1);
}

/**
 * FSRS-6 Next Interval Formula:
 * I(r, S) = (S / factor) * (r^(-1 / w20) - 1)
 * When r = 0.90, I(0.90, S) = S.
 * @param {number} stability - Stability S in days
 * @param {number} [desiredRetention=0.9] - Target retention r in [0.70, 0.97]
 * @param {number[]} [weights] - 21 FSRS-6 parameters
 * @param {number} [maxIntervalDays=365] - Maximum cap to prevent non-identifiability runaway schedules
 * @returns {number} Raw interval in days (float)
 */
export function calculateNextIntervalDays(
  stability,
  desiredRetention = FSRS_DEFAULT_RETENTION,
  weights = FSRS6_DEFAULT_WEIGHTS,
  maxIntervalDays = FSRS_DEFAULT_MAX_INTERVAL_DAYS
) {
  const s = Math.max(FSRS_MIN_STABILITY_DAYS, Number(stability) || FSRS_MIN_STABILITY_DAYS);
  const r = clamp(desiredRetention, FSRS_MIN_RETENTION, FSRS_MAX_RETENTION);
  const w20 = clamp(weights?.[20] ?? FSRS6_DEFAULT_WEIGHTS[20], 0.01, 2.0);
  const factor = getForgettingCurveFactor(weights);
  const maxDays = Math.max(1, Number(maxIntervalDays) || FSRS_DEFAULT_MAX_INTERVAL_DAYS);

  const rawInterval = (s / factor) * (Math.pow(r, -1 / w20) - 1);
  return clamp(rawInterval, FSRS_MIN_STABILITY_DAYS, maxDays);
}

/**
 * Initial Stability S0(G) = w[G - 1]
 */
export function calculateInitialStability(grade, weights = FSRS6_DEFAULT_WEIGHTS) {
  const g = normalizeFSRSRating(grade);
  const s0 = Number(weights?.[g - 1] ?? FSRS6_DEFAULT_WEIGHTS[g - 1]);
  return Math.max(FSRS_MIN_STABILITY_DAYS, s0);
}

/**
 * Initial Difficulty D0(G) = clamp(w4 - e^(w5 * (G - 1)) + 1, 1, 10)
 */
export function calculateInitialDifficulty(grade, weights = FSRS6_DEFAULT_WEIGHTS) {
  const g = normalizeFSRSRating(grade);
  const w4 = Number(weights?.[4] ?? FSRS6_DEFAULT_WEIGHTS[4]);
  const w5 = Number(weights?.[5] ?? FSRS6_DEFAULT_WEIGHTS[5]);
  const d0 = w4 - Math.exp(w5 * (g - 1)) + 1;
  return clamp(d0, 1, 10);
}

/**
 * FSRS-6 Next Difficulty D'' with Linear Damping and Mean Reversion toward D0(4):
 * deltaD = -w6 * (G - 3)
 * D' = D + deltaD * ((10 - D) / 9)
 * D'' = clamp(w7 * D0(4) + (1 - w7) * D', 1, 10)
 */
export function calculateNextDifficulty(currentDifficulty, grade, weights = FSRS6_DEFAULT_WEIGHTS) {
  const d = clamp(currentDifficulty, 1, 10);
  const g = normalizeFSRSRating(grade);
  const w6 = Number(weights?.[6] ?? FSRS6_DEFAULT_WEIGHTS[6]);
  const w7 = Number(weights?.[7] ?? FSRS6_DEFAULT_WEIGHTS[7]);

  const deltaD = -w6 * (g - 3);
  const dPrime = d + (deltaD * (10 - d)) / 9;
  const d0Easy = calculateInitialDifficulty(FSRS_RATING.EASY, weights);
  const dDoublePrime = w7 * d0Easy + (1 - w7) * dPrime;
  return clamp(dDoublePrime, 1, 10);
}

/**
 * FSRS-6 Short-Term / Same-Day Stability Update (when elapsedDays < 1):
 * S'(S, G) = S * e^(w17 * (G - 3 + w18)) * S^(-w19)
 * For G >= 3 (Good/Easy), SInc is clamped to >= 1 so stability cannot decrease on a good same-day review.
 */
export function calculateSameDayStability(currentStability, grade, weights = FSRS6_DEFAULT_WEIGHTS) {
  const s = Math.max(FSRS_MIN_STABILITY_DAYS, Number(currentStability) || FSRS_MIN_STABILITY_DAYS);
  const g = normalizeFSRSRating(grade);
  const w17 = Number(weights?.[17] ?? FSRS6_DEFAULT_WEIGHTS[17]);
  const w18 = Number(weights?.[18] ?? FSRS6_DEFAULT_WEIGHTS[18]);
  const w19 = Number(weights?.[19] ?? FSRS6_DEFAULT_WEIGHTS[19]);

  let sInc = Math.exp(w17 * (g - 3 + w18)) * Math.pow(s, -w19);
  if (g >= FSRS_RATING.GOOD) {
    sInc = Math.max(1, sInc);
  }
  return clamp(s * sInc, FSRS_MIN_STABILITY_DAYS, 36500);
}

/**
 * FSRS-6 Long-Term Recall Stability Update (G in {2, 3, 4}):
 * S'_r(D, S, R, G) = S * (1 + e^w8 * (11 - D) * S^(-w9) * (e^(w10 * (1 - R)) - 1) * hardPenalty * easyBonus)
 */
export function calculateRecallStability(
  currentDifficulty,
  currentStability,
  retrievability,
  grade,
  weights = FSRS6_DEFAULT_WEIGHTS
) {
  const d = clamp(currentDifficulty, 1, 10);
  const s = Math.max(FSRS_MIN_STABILITY_DAYS, Number(currentStability) || FSRS_MIN_STABILITY_DAYS);
  const r = clamp(retrievability, 0.0001, 1);
  const g = normalizeFSRSRating(grade);

  const w8 = Number(weights?.[8] ?? FSRS6_DEFAULT_WEIGHTS[8]);
  const w9 = Number(weights?.[9] ?? FSRS6_DEFAULT_WEIGHTS[9]);
  const w10 = Number(weights?.[10] ?? FSRS6_DEFAULT_WEIGHTS[10]);
  const w15 = Number(weights?.[15] ?? FSRS6_DEFAULT_WEIGHTS[15]);
  const w16 = Number(weights?.[16] ?? FSRS6_DEFAULT_WEIGHTS[16]);

  const hardPenalty = g === FSRS_RATING.HARD ? w15 : 1;
  const easyBonus = g === FSRS_RATING.EASY ? w16 : 1;

  const sInc =
    1 +
    Math.exp(w8) *
      (11 - d) *
      Math.pow(s, -w9) *
      (Math.exp(w10 * (1 - r)) - 1) *
      hardPenalty *
      easyBonus;

  return clamp(s * Math.max(1, sInc), FSRS_MIN_STABILITY_DAYS, 36500);
}

/**
 * FSRS-6 Post-Lapse Stability Update (when G = 1 / Again):
 * S'_f(D, S, R) = min(S, w11 * D^(-w12) * ((S + 1)^w13 - 1) * e^(w14 * (1 - R)))
 */
export function calculateForgetStability(
  currentDifficulty,
  currentStability,
  retrievability,
  weights = FSRS6_DEFAULT_WEIGHTS
) {
  const d = clamp(currentDifficulty, 1, 10);
  const s = Math.max(FSRS_MIN_STABILITY_DAYS, Number(currentStability) || FSRS_MIN_STABILITY_DAYS);
  const r = clamp(retrievability, 0.0001, 1);

  const w11 = Number(weights?.[11] ?? FSRS6_DEFAULT_WEIGHTS[11]);
  const w12 = Number(weights?.[12] ?? FSRS6_DEFAULT_WEIGHTS[12]);
  const w13 = Number(weights?.[13] ?? FSRS6_DEFAULT_WEIGHTS[13]);
  const w14 = Number(weights?.[14] ?? FSRS6_DEFAULT_WEIGHTS[14]);

  const sFail =
    w11 *
    Math.pow(d, -w12) *
    (Math.pow(s + 1, w13) - 1) *
    Math.exp(w14 * (1 - r));

  return clamp(Math.min(s, sFail), FSRS_MIN_STABILITY_DAYS, s);
}

/**
 * Map FSRS Stability (days) and State to HiVocab's 6-tier UI Memory Level (0..5).
 * Preserves 100% compatibility with Crayon charts, filters, and mastery badges:
 * - Level 0: Unreviewed / New (S <= 0 or state === NEW)
 * - Level 1: Short-term / Just introduced (0 < S < 2.5 days, or RELEARNING state)
 * - Level 2: Familiarizing (2.5 <= S < 6.0 days)
 * - Level 3: Consolidating (6.0 <= S < 15.0 days)
 * - Level 4: Strong memory (15.0 <= S < 30.0 days) -> Mastered tier 1
 * - Level 5: Deep long-term memory (S >= 30.0 days) -> Mastered tier 2
 */
export function stabilityToMemoryLevel(stability, state = FSRS_STATE.REVIEW) {
  const s = Number(stability);
  if (!Number.isFinite(s) || s <= 0 || state === FSRS_STATE.NEW) {
    return 0;
  }
  if (state === FSRS_STATE.RELEARNING || s < 2.5) {
    return 1;
  }
  if (s < 6.0) {
    return 2;
  }
  if (s < 15.0) {
    return 3;
  }
  if (s < 30.0) {
    return 4;
  }
  return 5;
}

/**
 * Convert legacy SM-2 level (0..5) into initial FSRS-6 state (S, D, state)
 * for seamless migration of existing user records without data loss.
 */
export function migrateSM2ToFSRSState(level = 0, reviewCount = 0) {
  const lv = clamp(Math.round(Number(level) || 0), 0, 5);
  const reps = Math.max(0, Number(reviewCount) || 0);

  switch (lv) {
    case 0:
      return {
        stability: 0,
        difficulty: 0,
        state: FSRS_STATE.NEW,
        reps: 0,
        lapses: 0,
      };
    case 1:
      return {
        stability: 1.0,
        difficulty: 6.4,
        state: FSRS_STATE.LEARNING,
        reps: Math.max(1, reps),
        lapses: 0,
      };
    case 2:
      return {
        stability: 3.5,
        difficulty: 5.8,
        state: FSRS_STATE.REVIEW,
        reps: Math.max(2, reps),
        lapses: 0,
      };
    case 3:
      return {
        stability: 8.0,
        difficulty: 5.2,
        state: FSRS_STATE.REVIEW,
        reps: Math.max(3, reps),
        lapses: 0,
      };
    case 4:
      return {
        stability: 18.0,
        difficulty: 4.7,
        state: FSRS_STATE.REVIEW,
        reps: Math.max(4, reps),
        lapses: 0,
      };
    case 5:
    default:
      return {
        stability: 35.0,
        difficulty: 4.2,
        state: FSRS_STATE.REVIEW,
        reps: Math.max(5, reps),
        lapses: 0,
      };
  }
}

/**
 * Format an interval in milliseconds or days into a friendly Vietnamese label.
 */
export function formatFSRSIntervalLabel(intervalDays) {
  const days = Number(intervalDays);
  if (!Number.isFinite(days) || days <= 0) return 'N/A';

  const totalMinutes = Math.round(days * 24 * 60);
  if (totalMinutes < 60) {
    return `${Math.max(1, totalMinutes)} phút`;
  }
  const totalHours = Math.round(days * 24);
  if (totalHours < 24) {
    return `${totalHours} giờ`;
  }
  const roundedDays = Math.round(days);
  if (roundedDays < 30) {
    return `${roundedDays} ngày`;
  }
  if (roundedDays < 365) {
    const months = Math.round((roundedDays / 30) * 10) / 10;
    return `${months} tháng`;
  }
  const years = Math.round((roundedDays / 365) * 10) / 10;
  return `${years} năm`;
}

/**
 * Normalize an input (number level or card object) into a complete FSRS card state.
 */
export function normalizeFSRSCard(cardOrLevel) {
  if (typeof cardOrLevel === 'number' || typeof cardOrLevel === 'string' || !cardOrLevel) {
    const lv = Number(cardOrLevel) || 0;
    return {
      level: lv,
      ...migrateSM2ToFSRSState(lv, lv),
      lastReviewedAt: null,
    };
  }

  const level = Number(cardOrLevel.level) || 0;
  const reps = Number(cardOrLevel.reviewCount ?? cardOrLevel.review_count ?? cardOrLevel.reps) || 0;
  const lapses = Number(cardOrLevel.lapses) || 0;
  const hasFSRS =
    Number.isFinite(Number(cardOrLevel.stability)) &&
    Number(cardOrLevel.stability) > 0 &&
    Number.isFinite(Number(cardOrLevel.difficulty)) &&
    Number(cardOrLevel.difficulty) > 0;

  if (hasFSRS) {
    const stability = Number(cardOrLevel.stability);
    const difficulty = clamp(Number(cardOrLevel.difficulty), 1, 10);
    const state =
      cardOrLevel.state !== undefined && cardOrLevel.state !== null
        ? Number(cardOrLevel.state)
        : cardOrLevel.fsrs_state !== undefined && cardOrLevel.fsrs_state !== null
          ? Number(cardOrLevel.fsrs_state)
          : level > 0
            ? FSRS_STATE.REVIEW
            : FSRS_STATE.NEW;
    return {
      level: level || stabilityToMemoryLevel(stability, state),
      stability,
      difficulty,
      state,
      reps: Math.max(1, reps),
      lapses,
      lastReviewedAt: cardOrLevel.lastReviewedAt || cardOrLevel.last_reviewed_at || null,
    };
  }

  const migrated = migrateSM2ToFSRSState(level, reps);
  return {
    level,
    ...migrated,
    lapses,
    lastReviewedAt: cardOrLevel.lastReviewedAt || cardOrLevel.last_reviewed_at || null,
  };
}

/**
 * Execute one FSRS-6 review step on a card.
 *
 * @param {object|number} cardOrLevel - Card object or current integer level (0..5)
 * @param {string|number} rating - 'again' | 'hard' | 'good' | 'easy' or 1..4
 * @param {object} [options] - Configuration options
 * @param {Date|number|string} [options.now] - Current timestamp
 * @param {number} [options.desiredRetention=0.9] - Target retention rate in [0.70, 0.97]
 * @param {number[]} [options.weights] - 21 FSRS-6 weights
 * @param {number} [options.maxIntervalDays=365] - Maximum interval in days
 * @param {boolean} [options.enableFuzz=false] - Whether to apply +-2.5% interval fuzzing
 */
export function scheduleFSRSReview(cardOrLevel, rating, options = {}) {
  const nowDate = options.now ? new Date(options.now) : new Date();
  const nowMs = nowDate.getTime();
  const weights = options.weights || FSRS6_DEFAULT_WEIGHTS;
  const desiredRetention = clamp(
    options.desiredRetention ?? FSRS_DEFAULT_RETENTION,
    FSRS_MIN_RETENTION,
    FSRS_MAX_RETENTION
  );
  const maxIntervalDays = Math.max(
    1,
    Number(options.maxIntervalDays) || FSRS_DEFAULT_MAX_INTERVAL_DAYS
  );

  const card = normalizeFSRSCard(cardOrLevel);
  const grade = normalizeFSRSRating(rating);

  const isFirstReview =
    card.state === FSRS_STATE.NEW || !card.stability || card.stability <= 0 || card.level === 0;

  let elapsedDays = 0;
  if (!isFirstReview && card.lastReviewedAt) {
    const lastMs = new Date(card.lastReviewedAt).getTime();
    if (Number.isFinite(lastMs) && nowMs > lastMs) {
      elapsedDays = (nowMs - lastMs) / DAY_MS;
    }
  } else if (!isFirstReview) {
    // When called without a lastReviewedAt timestamp (e.g. pure unit test or migrated card),
    // assume the card was reviewed around its stability interval (R ~ 90%).
    elapsedDays = Math.max(1, card.stability);
  }

  let nextStability;
  let nextDifficulty;
  let nextState;
  let retrievability;
  let lapses = card.lapses || 0;
  const reps = (card.reps || 0) + 1;

  if (isFirstReview) {
    retrievability = 1.0;
    nextStability = calculateInitialStability(grade, weights);
    nextDifficulty = calculateInitialDifficulty(grade, weights);
    if (grade === FSRS_RATING.AGAIN) {
      nextState = FSRS_STATE.LEARNING;
      lapses += 1;
    } else if (grade === FSRS_RATING.HARD) {
      nextState = FSRS_STATE.LEARNING;
    } else {
      nextState = FSRS_STATE.REVIEW;
    }
  } else {
    retrievability = calculateRetrievability(card.stability, elapsedDays, weights);
    nextDifficulty = calculateNextDifficulty(card.difficulty, grade, weights);

    if (grade === FSRS_RATING.AGAIN) {
      nextStability = calculateForgetStability(
        card.difficulty,
        card.stability,
        retrievability,
        weights
      );
      nextState = FSRS_STATE.RELEARNING;
      lapses += 1;
    } else if (elapsedDays < 1) {
      nextStability = calculateSameDayStability(card.stability, grade, weights);
      nextState = FSRS_STATE.REVIEW;
    } else {
      nextStability = calculateRecallStability(
        card.difficulty,
        card.stability,
        retrievability,
        grade,
        weights
      );
      nextState = FSRS_STATE.REVIEW;
    }
  }

  // Compute scheduled interval in days
  let scheduledDays = calculateNextIntervalDays(
    nextStability,
    desiredRetention,
    weights,
    maxIntervalDays
  );

  // Short-term / Lapse scheduling safeguards:
  // If user pressed Again (G=1), schedule a short same-day relearning review (~15m to 6h based on S)
  if (grade === FSRS_RATING.AGAIN) {
    scheduledDays = clamp(nextStability, 15 / (24 * 60), 0.5); // 15 mins to 12 hours
  } else if (isFirstReview && grade === FSRS_RATING.HARD) {
    scheduledDays = clamp(scheduledDays, 0.25, 1.5); // 6 hours to 1.5 days
  } else {
    // Optional fuzzing (+-2.5%) for multi-day intervals to prevent due-date clumping
    if (options.enableFuzz && scheduledDays >= 4) {
      const fuzzFactor = 0.975 + Math.random() * 0.05;
      scheduledDays = clamp(scheduledDays * fuzzFactor, 1, maxIntervalDays);
    }
  }

  const intervalMs = Math.max(15 * 60 * 1000, Math.round(scheduledDays * DAY_MS));
  const nextReviewAt = new Date(nowMs + intervalMs);
  const newLevel = Math.max(1, stabilityToMemoryLevel(nextStability, nextState));

  return {
    newLevel,
    nextReviewAt,
    intervalMs,
    scheduledDays: Math.round(scheduledDays * 10000) / 10000,
    elapsedDays: Math.round(elapsedDays * 10000) / 10000,
    stability: Math.round(nextStability * 10000) / 10000,
    difficulty: Math.round(nextDifficulty * 10000) / 10000,
    retrievability: Math.round(retrievability * 10000) / 10000,
    state: nextState,
    reps,
    lapses,
    grade,
    rating: ratingToKey(grade),
    intervalLabel: formatFSRSIntervalLabel(scheduledDays),
  };
}

/**
 * Preview all 4 FSRS rating outcomes (Again, Hard, Good, Easy) for a card.
 */
export function previewFSRSIntervals(cardOrLevel, options = {}) {
  return {
    again: scheduleFSRSReview(cardOrLevel, FSRS_RATING.AGAIN, { ...options, enableFuzz: false }),
    hard: scheduleFSRSReview(cardOrLevel, FSRS_RATING.HARD, { ...options, enableFuzz: false }),
    good: scheduleFSRSReview(cardOrLevel, FSRS_RATING.GOOD, { ...options, enableFuzz: false }),
    easy: scheduleFSRSReview(cardOrLevel, FSRS_RATING.EASY, { ...options, enableFuzz: false }),
  };
}

/**
 * Compute real-time Retrievability R(t, S) for a word object retrieved from DB.
 */
export function getWordRetrievability(word, now = new Date()) {
  if (!word) return 0;
  const card = normalizeFSRSCard(word);
  if (card.state === FSRS_STATE.NEW || card.stability <= 0) return 0;

  if (!card.lastReviewedAt) {
    // Estimate elapsed time from nextReviewAt if lastReviewedAt is unavailable
    const nextAt = word.nextReviewAt || word.next_review_at;
    if (nextAt) {
      const nextMs = new Date(nextAt).getTime();
      const nowMs = new Date(now).getTime();
      if (Number.isFinite(nextMs)) {
        const remainingDays = (nextMs - nowMs) / DAY_MS;
        const elapsedDays = Math.max(0, card.stability - remainingDays);
        return calculateRetrievability(card.stability, elapsedDays);
      }
    }
    return 0.9;
  }

  const lastMs = new Date(card.lastReviewedAt).getTime();
  const nowMs = new Date(now).getTime();
  const elapsedDays = Number.isFinite(lastMs) ? Math.max(0, (nowMs - lastMs) / DAY_MS) : 0;
  return calculateRetrievability(card.stability, elapsedDays);
}

export default {
  FSRS6_DEFAULT_WEIGHTS,
  FSRS_DEFAULT_RETENTION,
  FSRS_RATING,
  FSRS_STATE,
  normalizeFSRSRating,
  ratingToKey,
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
  formatFSRSIntervalLabel,
  normalizeFSRSCard,
  scheduleFSRSReview,
  previewFSRSIntervals,
  getWordRetrievability,
};
