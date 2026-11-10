// src/utils/quizGenerators.js
// 4-Type MCQ Generator and Interleaver for HiVocab
// Supports:
//   1. meaning_to_word: Vietnamese meaning -> 4 English words
//   2. audio_to_word: Word audio -> 4 English words (word masked as "???")
//   3. word_to_audio: English word -> 4 audio pronunciation options
//   4. sentence_cloze: Sentence blank cloze -> 4 English words

export const MCQ_SUBTYPES = [
  'meaning_to_word', // Type 1: Vietnamese meaning -> English word
  'audio_to_word',   // Type 2: Audio of word -> English word/meaning
  'word_to_audio',   // Type 3: English word -> Correct pronunciation audio
  'sentence_cloze',  // Type 4: Sentence blank cloze -> English word
];

export const MCQ_TYPES = MCQ_SUBTYPES;

export const FALLBACK_ENGLISH_DISTRACTORS = [
  'accomplish', 'approximate', 'collaborate', 'comprehensive',
  'demonstrate', 'determine',   'evaluate',      'fundamental',
  'illustrate',  'indicate',    'maintain',      'objective',
  'perspective', 'reinforce',   'resolve',       'significant',
  'subsequent',  'transform',   'undergo',       'undertake',
  'advocate',    'perceive',    'compensate',    'enhance',
  'diminish',    'implement',   'establish',     'sustain',
  'attribute',   'integrate',
];

export const FALLBACK_VIETNAMESE_DISTRACTORS = [
  'Sự kiên nhẫn',    'Trí tuệ nhân tạo', 'Cảm xúc sâu sắc',
  'Sức mạnh nội tâm','Niềm tin tuyệt đối','Hy vọng le lói',
  'Sự thật phũ phàng','Lòng dũng cảm',   'Sự thay đổi lớn',
  'Tự do tuyệt đối', 'Bình yên nội tâm', 'Hạnh phúc giản đơn',
  'Nỗi cô đơn',      'Sự ngạc nhiên',    'Trí tưởng tượng',
];

export const FALLBACK_DISTRACTORS = FALLBACK_VIETNAMESE_DISTRACTORS;

/**
 * Fisher-Yates array shuffle (unbiased O(n))
 */
export function fisherYatesShuffle(arr) {
  const a = [...(arr || [])];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const shuffle = fisherYatesShuffle;

function randomFrom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function splitAnswerParts(answer) {
  return String(answer || '').trim().split(/\s+/).filter(Boolean);
}

function buildBlankPlaceholder(answer) {
  return splitAnswerParts(answer)
    .map(part => '_'.repeat(part.length))
    .join(' ');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate common English inflection forms for regular words and irregular suffixes.
 */
function getAnswerPartForms(part) {
  const word = String(part || '').trim();
  if (!word) return [];
  const forms = new Set([word]);
  if (!/^[A-Za-z]+$/.test(word)) return Array.from(forms);
  const lower = word.toLowerCase();
  forms.add(lower);
  forms.add(`${lower}s`);
  forms.add(`${lower}es`);
  forms.add(`${lower}ed`);
  forms.add(`${lower}ing`);
  if (lower.endsWith('e')) {
    forms.add(`${lower}d`);
    forms.add(`${lower.slice(0, -1)}ing`);
  }
  if (/[^aeiou]y$/.test(lower)) {
    forms.add(`${lower.slice(0, -1)}ies`);
    forms.add(`${lower.slice(0, -1)}ied`);
  }
  if (/[aeiou][^aeiouwxy]$/.test(lower)) {
    forms.add(`${lower}${lower.slice(-1)}ed`);
    forms.add(`${lower}${lower.slice(-1)}ing`);
  }
  return Array.from(forms).sort((a, b) => b.length - a.length);
}

/**
 * Replace answer word/phrase inside sentence with blank placeholder while preserving surrounding punctuation.
 */
export function blankAnswerInSentence(sentence, answer) {
  if (!sentence || !answer) return null;
  const parts = splitAnswerParts(answer);
  if (!parts.length) return null;

  const phrase = parts
    .map(p => `(?:${getAnswerPartForms(p).map(escapeRegex).join('|')})`)
    .join('\\s+');

  let phraseRegex;
  try {
    phraseRegex = new RegExp(`(^|[^\\p{L}\\p{N}_])(${phrase})(?=$|[^\\p{L}\\p{N}_])`, 'giu');
  } catch {
    phraseRegex = new RegExp(`(^|[^a-zA-Z0-9_])(${phrase})(?=$|[^a-zA-Z0-9_])`, 'gi');
  }

  let matchedAnswer = null;
  const source = String(sentence || '');
  const blankedSentence = source.replace(phraseRegex, (match, prefix, matched) => {
    matchedAnswer = matched;
    return `${prefix}${buildBlankPlaceholder(matched)}`;
  });

  if (!matchedAnswer) return null;
  return {
    sentence: blankedSentence,
    answer: matchedAnswer,
    placeholder: buildBlankPlaceholder(matchedAnswer),
  };
}

export const blankSentence = blankAnswerInSentence;

/**
 * Pick count distinct English distractors for a target word from allWords and fallbacks.
 */
export function pickEnglishDistractors(targetWord, allWords = [], count = 3) {
  const targetText = String(targetWord?.word || (typeof targetWord === 'string' ? targetWord : '') || '').trim().toLowerCase();
  const targetId = targetWord?.id || targetWord?.wordId;

  const candidates = (allWords || [])
    .filter(w => {
      if (!w) return false;
      const wId = w.id || w.wordId;
      if (targetId && wId && wId === targetId) return false;
      const rawWord = typeof w === 'string' ? w : (typeof w.word === 'string' ? w.word : null);
      if (!rawWord) return false;
      const trimmed = rawWord.trim();
      if (!trimmed) return false;
      const lower = trimmed.toLowerCase();
      if (lower === 'undefined' || lower === 'null') return false;
      if (lower === targetText) return false;
      return true;
    })
    .map(w => (typeof w === 'string' ? w.trim() : String(w.word).trim()))
    .filter(Boolean);

  const seenEnglish = new Set();
  const uniqueCandidates = [];
  for (const c of candidates) {
    const lower = c.toLowerCase();
    if (!seenEnglish.has(lower)) {
      seenEnglish.add(lower);
      uniqueCandidates.push(c);
    }
  }
  const fallbackPool = FALLBACK_ENGLISH_DISTRACTORS.filter(
    d => d.toLowerCase() !== targetText && !seenEnglish.has(d.toLowerCase())
  );

  const selected = [...uniqueCandidates];
  while (selected.length < count && fallbackPool.length > 0) {
    selected.push(fallbackPool.shift());
  }

  return fisherYatesShuffle(selected).slice(0, count);
}

/**
 * Pick count distinct Vietnamese distractors for a target meaning from allWords and fallbacks.
 */
export function pickVietnameseDistractors(targetMeaning, allWords = [], count = 3) {
  const targetText = String(targetMeaning || '').trim().toLowerCase();

  const candidates = (allWords || [])
    .filter(w => {
      if (!w) return false;
      const rawMeaning = typeof w === 'string' ? w : (typeof w.meaning === 'string' ? w.meaning : null);
      if (!rawMeaning) return false;
      const trimmed = rawMeaning.trim();
      if (!trimmed) return false;
      const lower = trimmed.toLowerCase();
      if (lower === 'undefined' || lower === 'null') return false;
      if (lower === targetText) return false;
      return true;
    })
    .map(w => (typeof w === 'string' ? w.trim() : String(w.meaning).trim()))
    .filter(Boolean);

  const seenVietnamese = new Set();
  const uniqueCandidates = [];
  for (const c of candidates) {
    const lower = c.toLowerCase();
    if (!seenVietnamese.has(lower)) {
      seenVietnamese.add(lower);
      uniqueCandidates.push(c);
    }
  }
  const fallbackPool = FALLBACK_VIETNAMESE_DISTRACTORS.filter(
    d => d.toLowerCase() !== targetText && !seenVietnamese.has(d.toLowerCase())
  );

  const selected = [...uniqueCandidates];
  while (selected.length < count && fallbackPool.length > 0) {
    selected.push(fallbackPool.shift());
  }

  return fisherYatesShuffle(selected).slice(0, count);
}

/**
 * Generate an interleaved sequence of MCQ subtypes ensuring balanced representation and non-consecutive adjacent repeats.
 */
export function generateInterleavedMCQTypes(count) {
  if (count <= 0) return [];
  const result = [];
  const cycleCount = Math.ceil(count / MCQ_SUBTYPES.length);

  for (let c = 0; c < cycleCount; c++) {
    const cycle = fisherYatesShuffle(MCQ_SUBTYPES);
    // Boundary check: avoid duplicate between end of last cycle and start of new cycle
    if (result.length > 0 && cycle[0] === result[result.length - 1] && cycle.length > 1) {
      // Swap cycle[0] with cycle[1]
      [cycle[0], cycle[1]] = [cycle[1], cycle[0]];
    }
    result.push(...cycle);
  }

  return result.slice(0, count);
}

/**
 * Rotate to another MCQ subtype avoiding previously used subtypes for this word.
 */
export function rotateMCQType(currentType, usedTypes = []) {
  const safeUsedTypes = Array.isArray(usedTypes) ? usedTypes : [];
  const available = MCQ_SUBTYPES.filter(t => t !== currentType && !safeUsedTypes.includes(t));
  if (available.length > 0) return randomFrom(available);
  const otherTypes = MCQ_SUBTYPES.filter(t => t !== currentType);
  return otherTypes.length > 0 ? randomFrom(otherTypes) : MCQ_SUBTYPES[0];
}

export const pickNextMCQSubtype = rotateMCQType;

/**
 * Type 1: Meaning to English Word
 */
export function generateMeaningToWordQuestion(targetWord, allWords = []) {
  if (!targetWord) return null;
  const rawWord = String(targetWord.word || '').trim();
  const rawMeaning = String(targetWord.meaning || '').trim();
  const rawDef = String(targetWord.definition || '').trim();

  const safeWord = rawWord || rawDef || '[Từ trống]';
  const safeMeaning = rawMeaning || rawDef || '(Chưa có nghĩa tiếng Việt)';
  const safePhonetic = String(targetWord.phonetic || '').trim();
  const safePos = String(targetWord.pos || '').trim();

  const distractors = pickEnglishDistractors(targetWord, allWords, 3);
  const options = fisherYatesShuffle([
    { id: 'opt_correct', text: safeWord, isCorrect: true },
    ...distractors.map((text, idx) => ({ id: `opt_dist_${idx}`, text, isCorrect: false })),
  ]);

  return {
    id: `mcq_m2w_${targetWord.id || safeWord}`,
    type: 'meaning_to_word',
    subtype: 'meaning_to_word',
    wordId: targetWord.id || targetWord.wordId,
    targetWord,
    word: safeWord,
    phonetic: safePhonetic,
    pos: safePos,
    question: 'Chọn từ tiếng Anh phù hợp với nghĩa',
    prompt: {
      text: safeMeaning,
      hint: safePos ? `(${safePos})` : '',
    },
    options,
    correctOptionId: options.find(o => o.isCorrect)?.id,
  };
}

/**
 * Type 2: Audio to English Word (word masked as "???")
 */
export function generateAudioToWordQuestion(targetWord, allWords = []) {
  if (!targetWord) return null;
  const rawWord = String(targetWord.word || '').trim();
  const rawDef = String(targetWord.definition || '').trim();

  const safeWord = rawWord || rawDef || '[Từ trống]';
  const safePhonetic = String(targetWord.phonetic || '').trim();
  const safePos = String(targetWord.pos || '').trim();

  const distractors = pickEnglishDistractors(targetWord, allWords, 3);
  const options = fisherYatesShuffle([
    { id: 'opt_correct', text: safeWord, isCorrect: true },
    ...distractors.map((text, idx) => ({ id: `opt_dist_${idx}`, text, isCorrect: false })),
  ]);

  return {
    id: `mcq_a2w_${targetWord.id || safeWord}`,
    type: 'audio_to_word',
    subtype: 'audio_to_word',
    wordId: targetWord.id || targetWord.wordId,
    targetWord,
    word: '???', // Masked to prevent visual hint
    phonetic: safePhonetic,
    pos: safePos,
    question: 'Nghe phát âm và chọn đáp án chính xác',
    prompt: {
      text: 'Nghe phát âm và chọn từ đúng',
      audioWord: safeWord,
      showAudioButton: true,
      maskedWord: '???',
    },
    options,
    correctOptionId: options.find(o => o.isCorrect)?.id,
  };
}

/**
 * Type 3: English Word to Audio Pronunciation
 */
export function generateWordToAudioQuestion(targetWord, allWords = []) {
  if (!targetWord) return null;
  const rawWord = String(targetWord.word || '').trim();
  const rawMeaning = String(targetWord.meaning || '').trim();
  const rawDef = String(targetWord.definition || '').trim();

  const safeWord = rawWord || rawDef || '[Từ trống]';
  const safeMeaning = rawMeaning || rawDef || '(Chưa có nghĩa tiếng Việt)';
  const safePhonetic = String(targetWord.phonetic || '').trim();
  const safePos = String(targetWord.pos || '').trim();

  const distractors = pickEnglishDistractors(targetWord, allWords, 3);
  const rawOptions = fisherYatesShuffle([
    { id: 'opt_correct', text: 'Phát âm A', audioWord: safeWord, isCorrect: true },
    ...distractors.map((distWord, idx) => ({
      id: `opt_dist_${idx}`,
      text: `Phát âm ${String.fromCharCode(66 + idx)}`,
      audioWord: distWord,
      isCorrect: false,
    })),
  ]);

  const options = rawOptions.map((opt, idx) => {
    const label = String.fromCharCode(65 + idx);
    return {
      ...opt,
      label,
      text: `Phát âm ${label}`,
    };
  });

  return {
    id: `mcq_w2a_${targetWord.id || safeWord}`,
    type: 'word_to_audio',
    subtype: 'word_to_audio',
    wordId: targetWord.id || targetWord.wordId,
    targetWord,
    word: safeWord,
    phonetic: safePhonetic,
    pos: safePos,
    question: 'Nghe các lựa chọn và tìm phát âm đúng của từ:',
    prompt: {
      text: safeWord,
      phonetic: safePhonetic,
      pos: safePos,
      meaning: safeMeaning,
    },
    options,
    correctOptionId: options.find(o => o.isCorrect)?.id,
  };
}

/**
 * Type 4: Sentence Cloze Blank to English Word
 */
export function generateSentenceClozeQuestion(targetWord, allWords = []) {
  if (!targetWord) return null;
  const rawWord = String(targetWord.word || '').trim();
  const rawMeaning = String(targetWord.meaning || '').trim();
  const rawDef = String(targetWord.definition || '').trim();

  const safeWord = rawWord || rawDef || '[Từ trống]';
  const safeMeaning = rawMeaning || rawDef || '(Chưa có nghĩa tiếng Việt)';
  const safePhonetic = String(targetWord.phonetic || '').trim();
  const safePos = String(targetWord.pos || '').trim();
  const safeExample = String(targetWord.example_sentence || targetWord.exampleSentence || '').trim();

  let clozeResult = null;
  if (safeExample) {
    clozeResult = blankAnswerInSentence(safeExample, safeWord);
  }

  // Graceful fallback to Type 1 if sentence missing or blanking fails
  if (!clozeResult) {
    return generateMeaningToWordQuestion(targetWord, allWords);
  }

  const distractors = pickEnglishDistractors(targetWord, allWords, 3);
  const options = fisherYatesShuffle([
    { id: 'opt_correct', text: safeWord, isCorrect: true },
    ...distractors.map((text, idx) => ({ id: `opt_dist_${idx}`, text, isCorrect: false })),
  ]);

  return {
    id: `mcq_cloze_${targetWord.id || safeWord}`,
    type: 'sentence_cloze',
    subtype: 'sentence_cloze',
    wordId: targetWord.id || targetWord.wordId,
    targetWord,
    word: safeWord,
    phonetic: safePhonetic,
    pos: safePos,
    sentence: clozeResult.sentence,
    blankPlaceholder: clozeResult.placeholder,
    question: 'Chọn từ thích hợp để điền vào chỗ trống:',
    prompt: {
      text: clozeResult.sentence,
      meaningHint: safeMeaning,
    },
    options,
    correctOptionId: options.find(o => o.isCorrect)?.id,
  };
}

/**
 * Master MCQ Question Dispatcher
 */
export function generateMCQQuestion(targetWord, allWords = [], preferredType = null) {
  if (!targetWord) return null;

  let type = preferredType || randomFrom(MCQ_SUBTYPES);

  switch (type) {
    case 'meaning_to_word':
      return generateMeaningToWordQuestion(targetWord, allWords);
    case 'audio_to_word':
      return generateAudioToWordQuestion(targetWord, allWords);
    case 'word_to_audio':
      return generateWordToAudioQuestion(targetWord, allWords);
    case 'sentence_cloze':
      return generateSentenceClozeQuestion(targetWord, allWords);
    default:
      return generateMeaningToWordQuestion(targetWord, allWords);
  }
}

/**
 * Evaluate MCQ Answer with dual support for numerical index, option ID, or option text.
 */
export function evaluateMCQAnswer(question, selectedIndexOrId) {
  if (!question || !Array.isArray(question.options)) {
    return { correct: false, isCorrect: false, error: 'Invalid question object' };
  }

  const correctOption = question.options.find(o => o.isCorrect) || null;
  const correctAnswer = correctOption?.text || correctOption?.audioWord || '';

  if (selectedIndexOrId === null || selectedIndexOrId === undefined) {
    return {
      correct: false,
      isCorrect: false,
      selectedOption: null,
      correctOption,
      correctAnswer,
    };
  }

  if (typeof selectedIndexOrId === 'string') {
    const trimmed = selectedIndexOrId.trim();
    if (!trimmed) {
      return {
        correct: false,
        isCorrect: false,
        selectedOption: null,
        correctOption,
        correctAnswer,
      };
    }
  } else if (typeof selectedIndexOrId !== 'number') {
    return {
      correct: false,
      isCorrect: false,
      selectedOption: null,
      correctOption,
      correctAnswer,
    };
  }

  let selectedOption = null;

  if (typeof selectedIndexOrId === 'number') {
    if (Number.isInteger(selectedIndexOrId) && selectedIndexOrId >= 0 && selectedIndexOrId < question.options.length) {
      selectedOption = question.options[selectedIndexOrId] || null;
    }
  } else if (typeof selectedIndexOrId === 'string') {
    const trimmed = selectedIndexOrId.trim();

    if (/^\d+$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      if (num >= 0 && num < question.options.length) {
        selectedOption = question.options[num] || null;
      }
    }

    if (!selectedOption) {
      selectedOption = question.options.find(
        o => o.id === selectedIndexOrId ||
             o.id === trimmed ||
             o.text === selectedIndexOrId ||
             (o.text && o.text.toLowerCase().trim() === trimmed.toLowerCase())
      ) || null;
    }
  }

  const isCorrect = selectedOption?.isCorrect === true;

  return {
    correct: isCorrect,
    isCorrect,
    selectedOption,
    correctOption,
    correctAnswer,
  };
}
