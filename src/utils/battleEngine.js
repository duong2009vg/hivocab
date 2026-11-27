// src/utils/battleEngine.js
// Client-side Battle Arena constants, rank tiers, Solo Arcade generator & scoring helpers.
// Aligned with workers/battle-arena/src/battleLogic.js so Solo & PvP follow identical rules.

export const BATTLE_START_HP = 180;
export const BATTLE_VS_INTRO_MS = 2500;
export const BATTLE_BOT_WAIT_MS = 8000;
export const BATTLE_FAST_NEXT_MS = 280;
export const BATTLE_MISS_NEXT_MS = 560;

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

export const BATTLE_MODES = [
  {
    id: 'speed_blitz',
    label: 'Tốc Độ Phản Xạ',
    badge: '1v1 Chuẩn',
    shortDesc: '15 câu trắc nghiệm đa kênh (EN–VI, Nghe, Điền câu)',
    detailDesc: '15 câu · 12 giây/câu · 1–2 phút',
    totalRounds: 15,
    roundTimeMs: 12000,
    revealMs: 1100,
    startHp: BATTLE_START_HP,
    accentBg: 'bg-[#E7EFE3]',
    accentBorder: 'border-[#5A7E56]',
    accentText: 'text-[#4B6B46]',
  },
  {
    id: 'audio_sniper',
    label: 'Nghe Tiếng Bắt Chữ',
    badge: 'Luyện Nghe',
    shortDesc: 'Nghe phát âm chuẩn + IPA, bấm chọn từ đúng nhanh nhất',
    detailDesc: '15 câu · 12 giây/câu · 1–2 phút',
    totalRounds: 15,
    roundTimeMs: 12000,
    revealMs: 1100,
    startHp: BATTLE_START_HP,
    accentBg: 'bg-[#E5F2F6]',
    accentBorder: 'border-[#2E7D9B]',
    accentText: 'text-[#1E627C]',
  },
  {
    id: 'word_duel',
    label: 'Giải Mã Sinh Tử',
    badge: 'Đoán chữ',
    shortDesc: 'Nhìn nghĩa Việt & số chữ cái, đua mở ô chữ như Wordle',
    detailDesc: '8 từ · 20 giây/từ · 1.5–2 phút',
    totalRounds: 8,
    roundTimeMs: 20000,
    revealMs: 1400,
    startHp: BATTLE_START_HP,
    accentBg: 'bg-[#FCECE7]',
    accentBorder: 'border-[#E66946]',
    accentText: 'text-[#C44D2D]',
  },
  {
    id: 'flash_match',
    label: 'Ghép Cặp Chớp Nhoáng',
    badge: '3 Đợt × 6 cặp',
    shortDesc: 'Nối 18 cặp từ Anh–Việt qua 3 đợt liên hoàn không sai sót',
    detailDesc: '18 cặp (3 đợt) · Tối đa 2 phút',
    totalRounds: 3,
    pairsPerWave: 6,
    roundTimeMs: 40000,
    revealMs: 1200,
    startHp: BATTLE_START_HP,
    accentBg: 'bg-[#FDF4DC]',
    accentBorder: 'border-[#D99B26]',
    accentText: 'text-[#9A6A0F]',
  },
];

// Additional Single-Player learning modes (kept separate from BATTLE_MODES to preserve 4 PvP Worker modes)
export const SINGLE_EXTRA_MODES = [
  {
    id: 'context_blade',
    label: 'Kiếm Khí Ngữ Cảnh',
    badge: 'Mới · Ngữ cảnh',
    shortDesc: 'Đọc câu ví dụ tiếng Anh thực tế, chém chuẩn từ còn thiếu vào chỗ trống',
    detailDesc: '12 câu ngữ cảnh · 14 giây/câu',
    totalRounds: 12,
    roundTimeMs: 14000,
    revealMs: 1200,
    startHp: BATTLE_START_HP,
    accentBg: 'bg-[#EDE9FE]',
    accentBorder: 'border-[#7C3AED]',
    accentText: 'text-[#5B21B6]',
  },
  {
    id: 'survival_endless',
    label: 'Huyết Chiến Sinh Tồn',
    badge: 'Mới · Sinh tồn',
    shortDesc: '25 chặng liên hoàn kiểu Survivor: trả lời đúng 3 câu liên tiếp hồi +6 HP!',
    detailDesc: '25 chặng · Hồi HP theo chuỗi combo',
    totalRounds: 25,
    roundTimeMs: 11000,
    revealMs: 950,
    startHp: BATTLE_START_HP,
    accentBg: 'bg-[#FFE4E6]',
    accentBorder: 'border-[#E11D48]',
    accentText: 'text-[#9F1239]',
  },
];

export const ALL_SINGLE_MODES = [...BATTLE_MODES, ...SINGLE_EXTRA_MODES];

export const BATTLE_EMOTES = [
  { id: 'fire', emoji: '🔥', label: 'Đỉnh quá!' },
  { id: 'bolt', emoji: '⚡', label: 'Nhanh vậy!' },
  { id: 'sweat', emoji: '😅', label: 'Suýt nữa!' },
  { id: 'clap', emoji: '👏', label: 'Hay lắm!' },
];

export const BATTLE_POWERUPS = [
  { id: 'fifty_fifty', icon: '✂️', label: '50/50', desc: 'Loại 2 đáp án sai / Mở 1 chữ' },
  { id: 'slow_audio', icon: '🐢', label: 'Nghe 0.75x', desc: 'Phát âm chậm rõ từng âm tiết' },
  { id: 'double_strike', icon: '⚡', label: 'x2 Đòn', desc: 'Nhân đôi sát thương & điểm câu này' },
];

export const SOLO_STARTER_WORDS = [
  { id: 's1', word: 'resilient', phonetic: '/rɪˈzɪl.jənt/', meaning: 'kiên cường, phục hồi nhanh', example_sentence: 'Local communities proved remarkably resilient after the storm.' },
  { id: 's2', word: 'ubiquitous', phonetic: '/juːˈbɪk.wɪ.təs/', meaning: 'có mặt ở khắp mọi nơi', example_sentence: 'Smartphones have become ubiquitous in modern classrooms.' },
  { id: 's3', word: 'mitigate', phonetic: '/ˈmɪt.ɪ.ɡeɪt/', meaning: 'làm dịu bớt, giảm nhẹ hậu quả', example_sentence: 'Planting urban trees helps mitigate the effects of extreme heat.' },
  { id: 's4', word: 'pragmatic', phonetic: '/præɡˈmæt.ɪk/', meaning: 'thực tế, thiết thực', example_sentence: 'We need a pragmatic approach to balance study time and rest.' },
  { id: 's5', word: 'alleviate', phonetic: '/əˈliː.vi.eɪt/', meaning: 'làm giảm bớt nỗi đau, áp lực', example_sentence: 'Clear study schedules can alleviate pre-exam anxiety.' },
  { id: 's6', word: 'meticulous', phonetic: '/məˈtɪk.jə.ləs/', meaning: 'tỉ mỉ, cẩn trọng từng chi tiết', example_sentence: 'She kept meticulous notes throughout the semester.' },
  { id: 's7', word: 'proliferate', phonetic: '/prəˈlɪf.ər.eɪt/', meaning: 'tăng nhanh về số lượng, sinh sôi', example_sentence: 'Online learning platforms have proliferated over the past five years.' },
  { id: 's8', word: 'corroborate', phonetic: '/kəˈrɒb.ə.reɪt/', meaning: 'củng cố bằng chứng, xác nhận', example_sentence: 'Recent data corroborates the scientist hypothesis.' },
  { id: 's9', word: 'ambiguous', phonetic: '/æmˈbɪɡ.ju.əs/', meaning: 'mơ hồ, có nhiều cách hiểu', example_sentence: 'The instructions were ambiguous so students asked for help.' },
  { id: 's10', word: 'embellish', phonetic: '/ɪmˈbel.ɪʃ/', meaning: 'tô điểm, trang trí thêm', example_sentence: 'He could not resist embellishing the story of his trip.' },
  { id: 's11', word: 'ephemeral', phonetic: '/ɪˈfem.ər.əl/', meaning: 'ngắn ngủi, chóng tàn', example_sentence: 'Social media trends are often ephemeral.' },
  { id: 's12', word: 'scrutinize', phonetic: '/ˈskruː.tɪ.naɪz/', meaning: 'xem xét kỹ lưỡng, soi xét', example_sentence: 'Reviewers will carefully scrutinize every submitted paper.' },
  { id: 's13', word: 'lucrative', phonetic: '/ˈluː.krə.tɪv/', meaning: 'sinh lời cao, béo bở', example_sentence: 'Software engineering remains a lucrative career path.' },
  { id: 's14', word: 'inevitable', phonetic: '/ɪnˈev.ɪ.tə.bəl/', meaning: 'không thể tránh khỏi, tất yếu', example_sentence: 'Technological change is an inevitable part of modern life.' },
  { id: 's15', word: 'collaborate', phonetic: '/kəˈlæb.ə.reɪt/', meaning: 'hợp tác, cộng tác', example_sentence: 'Teams must collaborate closely to finish the project on time.' },
  { id: 's16', word: 'comprehensive', phonetic: '/ˌkɒm.prɪˈhen.sɪv/', meaning: 'toàn diện, bao quát', example_sentence: 'This guide offers a comprehensive overview of IELTS writing.' },
  { id: 's17', word: 'sustainable', phonetic: '/səˈsteɪ.nə.bəl/', meaning: 'bền vững, duy trì lâu dài', example_sentence: 'Cities are investing in sustainable public transport.' },
  { id: 's18', word: 'deteriorate', phonetic: '/dɪˈtɪə.ri.ə.reɪt/', meaning: 'xấu đi, suy thoái', example_sentence: 'Air quality began to deteriorate during the dry season.' },
  { id: 's19', word: 'fluctuate', phonetic: '/ˈflʌk.tʃu.eɪt/', meaning: 'dao động, lên xuống thất thường', example_sentence: 'Fuel prices fluctuate constantly throughout the year.' },
  { id: 's20', word: 'incentive', phonetic: '/ɪnˈsen.tɪv/', meaning: 'động lực, sự khích lệ', example_sentence: 'Scholarships give students a strong incentive to excel.' },
  { id: 's21', word: 'phenomenon', phonetic: '/fəˈnɒm.ɪ.nən/', meaning: 'hiện tượng đặc biệt', example_sentence: 'Remote work became a global phenomenon after 2020.' },
  { id: 's22', word: 'persevere', phonetic: '/ˌpɜː.sɪˈvɪər/', meaning: 'kiên trì bền bỉ vượt khó', example_sentence: 'You will master English if you persevere every day.' },
  { id: 's23', word: 'allocate', phonetic: '/ˈæl.ə.keɪt/', meaning: 'phân bổ, chia đều nguồn lực', example_sentence: 'Teachers allocate twenty minutes for vocabulary practice.' },
  { id: 's24', word: 'implement', phonetic: '/ˈɪm.plɪ.ment/', meaning: 'triển khai, thực thi kế hoạch', example_sentence: 'The school will implement the new curriculum next autumn.' },
];

export function getModeMeta(modeId) {
  return ALL_SINGLE_MODES.find((m) => m.id === modeId) || BATTLE_MODES[0];
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

export function fisherYatesShuffle(items) {
  const arr = [...(items || [])];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function cleanBattleMeaning(raw) {
  return String(raw || '')
    .replace(/^(\([a-zA-Z\s.,/]+\)|\[[a-zA-Z\s.,/]+\])\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
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

export function calculateRoundScoreAndDamage({
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

export function generateSoloDeck(rawWords, mode = 'speed_blitz') {
  const meta = getModeMeta(mode);
  const deduped = [];
  const seen = new Set();
  for (const row of [...(rawWords || []), ...SOLO_STARTER_WORDS]) {
    const word = String(row?.word || '').trim().replace(/\s+/g, ' ');
    const meaning = cleanBattleMeaning(row?.meaning);
    if (!word || !meaning || word.length > 36) continue;
    const low = word.toLowerCase();
    if (seen.has(low)) continue;
    seen.add(low);
    deduped.push({
      id: row?.id || low,
      word,
      phonetic: String(row?.phonetic || '').trim(),
      meaning,
      example_sentence: String(row?.example_sentence || '').trim(),
    });
  }

  const pool = fisherYatesShuffle(deduped);

  if (mode === 'flash_match') {
    const waves = [];
    const pairsPerWave = meta.pairsPerWave || 6;
    for (let w = 0; w < meta.totalRounds; w++) {
      const uniqueWave = [];
      const seenWave = new Set();
      for (let i = 0; i < pool.length; i++) {
        const candidate = pool[(w * pairsPerWave + i) % pool.length];
        if (!seenWave.has(candidate.word.toLowerCase())) {
          seenWave.add(candidate.word.toLowerCase());
          uniqueWave.push(candidate);
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
        leftCards: fisherYatesShuffle(pairs.map((p) => ({ pairId: p.pairId, text: p.word, phonetic: p.phonetic }))),
        rightCards: fisherYatesShuffle(pairs.map((p) => ({ pairId: p.pairId, text: p.meaning }))),
        pairs,
        pairCount: pairs.length,
      });
    }
    return waves;
  }

  if (mode === 'word_duel') {
    const cleanDuel = pool.filter((item) => /^[A-Za-z][A-Za-z'-]{2,15}$/.test(item.word));
    const src = cleanDuel.length >= 4 ? cleanDuel : pool;
    const rounds = [];
    for (let i = 0; i < meta.totalRounds; i++) {
      const target = src[i % src.length];
      const upper = target.word.toUpperCase();
      rounds.push({
        roundIndex: i,
        kind: 'word_duel',
        word: target.word,
        phonetic: target.phonetic,
        meaning: target.meaning,
        example: target.example_sentence,
        letterCount: upper.replace(/[^A-Z]/g, '').length,
        wordLength: target.word.length,
        pattern: target.word
          .split('')
          .map((ch) => (/[A-Za-z]/.test(ch) ? '_' : ch))
          .join(''),
        correctAnswer: upper,
      });
    }
    return rounds;
  }

  // Prioritize sentences with blanks for context_blade, mixed channels for speed_blitz & survival_endless
  const orderedPool =
    mode === 'context_blade'
      ? [
          ...pool.filter((item) => Boolean(buildSentenceBlank(item.example_sentence, item.word))),
          ...pool.filter((item) => !buildSentenceBlank(item.example_sentence, item.word)),
        ]
      : pool;

  const rounds = [];
  for (let i = 0; i < meta.totalRounds; i++) {
    const target = orderedPool[i % orderedPool.length];
    let qType = 'en_to_vi';
    const cloze = buildSentenceBlank(target.example_sentence, target.word);

    if (mode === 'audio_sniper') {
      qType = 'audio_to_word';
    } else if (mode === 'context_blade') {
      qType = cloze ? 'sentence_cloze' : 'vi_to_en';
    } else {
      const step = i % 4;
      if (step === 1) qType = 'vi_to_en';
      else if (step === 2 && cloze) qType = 'sentence_cloze';
      else if (step === 3) qType = 'audio_to_word';
    }

    const field = qType === 'en_to_vi' ? 'meaning' : 'word';
    const correctAnswer = target[field];
    const distractors = [];
    const used = new Set([String(correctAnswer).toLowerCase()]);
    for (const candidate of fisherYatesShuffle(pool)) {
      const val = String(candidate[field] || '').trim();
      if (!val || used.has(val.toLowerCase())) continue;
      used.add(val.toLowerCase());
      distractors.push(val);
      if (distractors.length >= 3) break;
    }

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
      word: target.word,
      phonetic: target.phonetic,
      meaning: target.meaning,
      example: target.example_sentence,
      promptTitle,
      promptSubtitle,
      audioWord: qType === 'audio_to_word' || qType === 'en_to_vi' ? target.word : '',
      options: fisherYatesShuffle([correctAnswer, ...distractors]),
      correctAnswer,
    });
  }
  return rounds;
}
