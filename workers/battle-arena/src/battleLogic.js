// Shared game rules, deck generators, damage/score formulas, and ELO math
// Used by both BattleRoomDO (authoritative server) and Solo Arcade mode.

export const START_HP = 180;
export const VS_INTRO_MS = 2500;
export const AUTO_CLEANUP_MS = 5 * 60 * 1000;
export const BOT_FALLBACK_WAIT_MS = 8000;
export const FAST_CLASH_REVEAL_MS = 320;
export const MISS_REVEAL_MS = 550;
export const COUNTER_WINDOW_MS = 4500;

export function getComboChainMeta(streak = 0, mode = 'speed_blitz') {
  const s = Math.max(1, Number(streak) || 1);
  const tier = Math.min(5, s);
  const isWordDuel = mode === 'word_duel';
  const dmgTable = isWordDuel ? [1.0, 1.4, 1.8, 2.2, 2.6] : [1.0, 1.5, 2.0, 2.5, 3.0];
  const ptsTable = [1.0, 1.25, 1.5, 1.75, 2.0];
  return {
    tier,
    label: tier >= 5 ? '5x' : `${tier}x`,
    damageMultiplier: dmgTable[tier - 1],
    pointsMultiplier: ptsTable[tier - 1],
  };
}

export const ALLOWED_EMOTES = new Set(['fire', 'bolt', 'sweat', 'clap']);
export const ALLOWED_POWERUPS = new Set(['fifty_fifty', 'slow_audio', 'double_strike']);

export const MODE_CONFIG = Object.freeze({
  speed_blitz: {
    id: 'speed_blitz',
    label: 'Tốc Độ Phản Xạ',
    shortDesc: '15 câu trắc nghiệm đa dạng · 12s/câu',
    totalRounds: 15,
    roundTimeMs: 12000,
    revealMs: 1100,
    startHp: START_HP,
    durationHint: '1–2 phút',
  },
  audio_sniper: {
    id: 'audio_sniper',
    label: 'Nghe Tiếng Bắt Chữ',
    shortDesc: '15 câu nghe phát âm & IPA · 12s/câu',
    totalRounds: 15,
    roundTimeMs: 12000,
    revealMs: 1100,
    startHp: START_HP,
    durationHint: '1–2 phút',
  },
  word_duel: {
    id: 'word_duel',
    label: 'Giải Mã Sinh Tử',
    shortDesc: '8 từ đoán chữ siêu tốc · 20s/từ',
    totalRounds: 8,
    roundTimeMs: 20000,
    revealMs: 1400,
    startHp: START_HP,
    durationHint: '1.5–2 phút',
  },
  flash_match: {
    id: 'flash_match',
    label: 'Ghép Cặp Chớp Nhoáng',
    shortDesc: '3 đợt × 6 cặp (18 từ) · 40s/đợt',
    totalRounds: 3,
    pairsPerWave: 6,
    roundTimeMs: 40000,
    revealMs: 1200,
    startHp: START_HP,
    durationHint: '1–2 phút',
  },
});

export function getModeConfig(mode) {
  return MODE_CONFIG[mode] || MODE_CONFIG.speed_blitz;
}

export function fisherYatesShuffle(items) {
  const arr = [...(items || [])];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function cleanBattleMeaning(raw) {
  const text = String(raw || '')
    .replace(/^(\([a-zA-Z\s.,/]+\)|\[[a-zA-Z\s.,/]+\])\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 120);
}

export function isSingleWordTarget(word) {
  return /^[A-Za-z][A-Za-z'-]{2,15}$/.test(String(word || '').trim());
}

export function buildSentenceBlank(sentence, targetWord) {
  const cleanSentence = String(sentence || '').trim();
  const cleanWord = String(targetWord || '').trim();
  if (!cleanSentence || !cleanWord) return '';
  const escaped = cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}(?:s|es|ed|ing|d)?\\b`, 'gi');
  if (!regex.test(cleanSentence)) return '';
  const mask = cleanWord
    .split(/\s+/)
    .map((p) => '_'.repeat(Math.max(3, p.length)))
    .join(' ');
  return cleanSentence.replace(new RegExp(`\\b${escaped}(?:s|es|ed|ing|d)?\\b`, 'gi'), mask);
}

export function normalizeWordPool(rawWords) {
  const seen = new Set();
  const clean = [];
  for (const row of rawWords || []) {
    const word = String(row?.word || '').trim().replace(/\s+/g, ' ');
    const meaning = cleanBattleMeaning(row?.meaning);
    if (!word || !meaning || word.length > 36) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    clean.push({
      id: row?.id || key,
      word,
      phonetic: String(row?.phonetic || '').trim(),
      meaning,
      example_sentence: String(row?.example_sentence || '').trim(),
    });
  }
  return clean;
}

function pickDistractors(targetWordObj, pool, field, count = 3) {
  const targetVal = String(targetWordObj[field] || '').toLowerCase();
  const candidates = fisherYatesShuffle(
    pool.filter((item) => {
      const val = String(item[field] || '').trim();
      return val && val.toLowerCase() !== targetVal;
    })
  );
  const picked = [];
  const used = new Set([targetVal]);
  for (const item of candidates) {
    const val = String(item[field]).trim();
    const low = val.toLowerCase();
    if (used.has(low)) continue;
    used.add(low);
    picked.push(val);
    if (picked.length >= count) break;
  }
  return picked;
}

export function buildQuestionDeck(rawPool, mode = 'speed_blitz') {
  const cfg = getModeConfig(mode);
  const pool = fisherYatesShuffle(normalizeWordPool(rawPool));
  if (pool.length < 4) {
    throw new Error('Không đủ từ vựng (cần ít nhất 4 từ) để tạo trận đấu.');
  }

  if (mode === 'flash_match') {
    const waves = [];
    const pairsPerWave = cfg.pairsPerWave || 6;
    for (let w = 0; w < cfg.totalRounds; w++) {
      const waveWords = [];
      for (let i = 0; i < pairsPerWave; i++) {
        waveWords.push(pool[(w * pairsPerWave + i) % pool.length]);
      }
      // Deduplicate within a single wave if pool is small
      const uniqueWave = [];
      const seenWave = new Set();
      for (const item of [...waveWords, ...pool]) {
        const key = item.word.toLowerCase();
        if (!seenWave.has(key)) {
          seenWave.add(key);
          uniqueWave.push(item);
        }
        if (uniqueWave.length >= pairsPerWave) break;
      }
      const pairs = uniqueWave.map((item, idx) => ({
        pairId: `w${w}_p${idx}`,
        wordId: item.id,
        word: item.word,
        phonetic: item.phonetic,
        meaning: item.meaning,
        example: item.example_sentence,
      }));
      waves.push({
        roundIndex: w,
        kind: 'flash_match',
        leftCards: fisherYatesShuffle(
          pairs.map((p) => ({ pairId: p.pairId, text: p.word, phonetic: p.phonetic }))
        ),
        rightCards: fisherYatesShuffle(
          pairs.map((p) => ({ pairId: p.pairId, text: p.meaning }))
        ),
        pairs,
        correctAnswer: JSON.stringify(pairs.map((p) => p.pairId)),
      });
    }
    return waves;
  }

  if (mode === 'word_duel') {
    const duelCandidates = pool.filter((item) => isSingleWordTarget(item.word));
    const source = duelCandidates.length >= 4 ? duelCandidates : pool;
    const rounds = [];
    for (let i = 0; i < cfg.totalRounds; i++) {
      const target = source[i % source.length];
      const upper = target.word.toUpperCase();
      rounds.push({
        roundIndex: i,
        kind: 'word_duel',
        wordId: target.id,
        word: target.word,
        phonetic: target.phonetic,
        meaning: target.meaning,
        example: target.example_sentence,
        letterCount: upper.replace(/[^A-Z]/g, '').length,
        wordLength: target.word.length,
        correctAnswer: upper,
      });
    }
    return rounds;
  }

  // speed_blitz & audio_sniper: 15 rounds
  const rounds = [];
  for (let i = 0; i < cfg.totalRounds; i++) {
    const target = pool[i % pool.length];
    let qType = 'en_to_vi';

    if (mode === 'audio_sniper') {
      qType = 'audio_to_word';
    } else {
      const clozeText = buildSentenceBlank(target.example_sentence, target.word);
      const pattern = i % 4;
      if (pattern === 1) qType = 'vi_to_en';
      else if (pattern === 2 && clozeText) qType = 'sentence_cloze';
      else if (pattern === 3) qType = 'audio_to_word';
      else qType = 'en_to_vi';
    }

    const answerField = qType === 'en_to_vi' ? 'meaning' : 'word';
    const correctAnswer = target[answerField];
    const distractors = pickDistractors(target, pool, answerField, 3);
    const options = fisherYatesShuffle([correctAnswer, ...distractors]);

    let promptTitle = target.word;
    let promptSubtitle = target.phonetic || '';
    if (qType === 'vi_to_en') {
      promptTitle = target.meaning;
      promptSubtitle = 'Chọn từ tiếng Anh tương ứng';
    } else if (qType === 'sentence_cloze') {
      promptTitle = buildSentenceBlank(target.example_sentence, target.word);
      promptSubtitle = `Nghĩa gợi ý: ${target.meaning}`;
    } else if (qType === 'audio_to_word') {
      promptTitle = 'Nghe phát âm và chọn từ đúng';
      promptSubtitle = target.phonetic || 'Bấm nút loa để nghe lại';
    }

    rounds.push({
      roundIndex: i,
      kind: qType,
      wordId: target.id,
      word: target.word,
      phonetic: target.phonetic,
      meaning: target.meaning,
      example: target.example_sentence,
      promptTitle,
      promptSubtitle,
      audioWord: target.word,
      options,
      correctAnswer,
    });
  }
  return rounds;
}

export function sanitizeRoundForClient(round) {
  if (!round) return null;
  if (round.kind === 'flash_match') {
    return {
      roundIndex: round.roundIndex,
      kind: round.kind,
      leftCards: round.leftCards,
      rightCards: round.rightCards,
      pairCount: round.pairs.length,
    };
  }
  if (round.kind === 'word_duel') {
    return {
      roundIndex: round.roundIndex,
      kind: round.kind,
      meaning: round.meaning,
      phonetic: round.phonetic,
      letterCount: round.letterCount,
      wordLength: round.wordLength,
      pattern: round.word
        .split('')
        .map((ch) => (/[A-Za-z]/.test(ch) ? '_' : ch))
        .join(''),
    };
  }
  return {
    roundIndex: round.roundIndex,
    kind: round.kind,
    promptTitle: round.promptTitle,
    promptSubtitle: round.promptSubtitle,
    audioWord: round.kind === 'audio_to_word' || round.kind === 'en_to_vi' ? round.word : '',
    options: round.options,
  };
}

export function calculateHitOutcome({
  isCorrect,
  elapsedMs = 5000,
  timeLimitMs = 12000,
  streak = 0,
  doubleStrike = false,
  mode = 'speed_blitz',
}) {
  if (!isCorrect) {
    const selfDamage = mode === 'word_duel' ? 12 : 10;
    return {
      points: 0,
      enemyDamage: 0,
      selfDamage,
      nextStreak: 0,
      speedBonus: 0,
      comboTier: 0,
      comboLabel: '1x',
      damageMultiplier: 1,
    };
  }

  const nextStreak = streak + 1;
  const safeLimit = Math.max(1000, Number(timeLimitMs) || 12000);
  const clampedElapsed = Math.max(0, Math.min(safeLimit, Number(elapsedMs) || safeLimit));
  const speedRatio = 1 - clampedElapsed / safeLimit;
  const mult = doubleStrike ? 2 : 1;
  const chain = getComboChainMeta(nextStreak, mode);

  if (mode === 'word_duel') {
    const baseDmg = 16 + Math.round(speedRatio * 4);
    const enemyDamage = Math.round(baseDmg * chain.damageMultiplier) * mult;
    const points = Math.round((150 + speedRatio * 90) * chain.pointsMultiplier) * mult;
    return {
      points,
      enemyDamage,
      selfDamage: 0,
      nextStreak,
      speedBonus: Math.round(speedRatio * 90),
      comboTier: chain.tier,
      comboLabel: chain.label,
      damageMultiplier: chain.damageMultiplier,
    };
  }

  // Fighting-game escalating combo damage: 1x (12-15) -> 2x (18-23) -> 3x (24-30) -> 4x (30-38) -> 5x (36-45)
  const baseDmg = 12 + (speedRatio >= 0.72 ? 3 : speedRatio >= 0.42 ? 1 : 0);
  const enemyDamage = Math.round(baseDmg * chain.damageMultiplier) * mult;
  const speedBonus = Math.round(speedRatio * 60);
  const points = Math.round((100 + speedBonus) * chain.pointsMultiplier) * mult;

  return {
    points,
    enemyDamage,
    selfDamage: 0,
    nextStreak,
    speedBonus,
    comboTier: chain.tier,
    comboLabel: chain.label,
    damageMultiplier: chain.damageMultiplier,
  };
}

export function calculateEloDelta(playerElo = 1000, opponentElo = 1000, actualScore = 0.5, kFactor = 24) {
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  return Math.round(kFactor * (actualScore - expected));
}

export function getRankTier(elo = 1000) {
  const score = Number(elo) || 1000;
  if (score >= 1900) return { name: 'Chí Tôn', emoji: '👑', color: '#D97706', bg: '#FEF3C7' };
  if (score >= 1650) return { name: 'Kim Cương', emoji: '💎', color: '#0284C7', bg: '#E0F2FE' };
  if (score >= 1400) return { name: 'Vàng', emoji: '🥇', color: '#CA8A04', bg: '#FEF9C3' };
  if (score >= 1200) return { name: 'Bạc', emoji: '🥈', color: '#475569', bg: '#F1F5F9' };
  if (score >= 1050) return { name: 'Đồng', emoji: '🥉', color: '#B45309', bg: '#FFEDD5' };
  return { name: 'Tân Binh', emoji: '🌱', color: '#5A7E56', bg: '#E7EFE3' };
}
