// src/hooks/useStudySession.js
// Pure React port of sessionEngine.js + sessionUI.js logic.
// No window.HiSession dependency — fully self-contained.

import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const EXERCISE_TYPES = ['flashcard', 'mcq', 'fill', 'listen'];

const FALLBACK_DISTRACTORS = [
  'Sự kiên nhẫn',    'Trí tuệ nhân tạo', 'Cảm xúc sâu sắc',
  'Sức mạnh nội tâm','Niềm tin tuyệt đối','Hy vọng le lói',
  'Sự thật phũ phàng','Lòng dũng cảm',   'Sự thay đổi lớn',
  'Tự do tuyệt đối', 'Bình yên nội tâm', 'Hạnh phúc giản đơn',
  'Nỗi cô đơn',      'Sự ngạc nhiên',    'Trí tưởng tượng',
];

// ─── Pure Utility Functions ────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickNextType(usedTypes) {
  const available = EXERCISE_TYPES.filter(t => !usedTypes.includes(t));
  return available.length > 0 ? randomFrom(available) : randomFrom(EXERCISE_TYPES);
}

function splitAnswerParts(answer) {
  return String(answer || '').trim().split(/\s+/).filter(Boolean);
}

function countAnswerLetters(answer) {
  return splitAnswerParts(answer).join('').length;
}

function buildBlankPlaceholder(answer) {
  return splitAnswerParts(answer)
    .map(part => '_'.repeat(part.length))
    .join(' ');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

function buildAnswerPhraseRegex(answer) {
  const parts = splitAnswerParts(answer);
  if (!parts.length) return null;
  const phrase = parts
    .map(p => `(?:${getAnswerPartForms(p).map(escapeRegex).join('|')})`)
    .join('\\s+');
  try {
    return new RegExp(`(^|[^\\p{L}\\p{N}_])(${phrase})(?=$|[^\\p{L}\\p{N}_])`, 'giu');
  } catch {
    return null;
  }
}

function blankAnswerInSentence(sentence, answer) {
  const phraseRegex = buildAnswerPhraseRegex(answer);
  if (!phraseRegex) return null;
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

// ─── Exercise Data Generation ─────────────────────────────────────────────────

function generateExerciseData(word, type, allWords) {
  switch (type) {
    case 'flashcard':
      return {
        frontLabel: 'Dịch sang tiếng Anh',
        frontWord: word.meaning,
        backLabel: 'Đáp án',
        backWord: word.word,
        pos: word.pos || '',
        phonetic: word.phonetic || '',
        exampleSentence: word.example_sentence || word.exampleSentence || '',
        imageUrl: word.image_url || word.imageUrl || '',
      };

    case 'mcq': {
      const correctOption = { text: word.meaning, isCorrect: true };
      const others = allWords
        .filter(w => w.wordId !== word.wordId)
        .map(w => w.meaning);
      const fallbackPool = FALLBACK_DISTRACTORS.filter(d => !others.includes(d));
      const padded = [...others];
      while (padded.length < 3) padded.push(fallbackPool.shift() || 'Không xác định');
      const distractors = shuffle(padded)
        .slice(0, 3)
        .map(text => ({ text, isCorrect: false }));
      return {
        question: 'Chọn nghĩa đúng của',
        word: word.word,
        options: shuffle([correctOption, ...distractors]),
      };
    }

    case 'fill': {
      let sentence = null;
      let answerText = word.word;
      let blankPlaceholder = buildBlankPlaceholder(answerText);
      const exSentence = word.example_sentence || word.exampleSentence || '';
      if (exSentence) {
        const blanked = blankAnswerInSentence(exSentence, word.word);
        if (blanked) {
          sentence = blanked.sentence;
          answerText = blanked.answer;
          blankPlaceholder = blanked.placeholder;
        }
      }
      return {
        sentence,
        blankPlaceholder,
        meaningHint: `Điền từ tiếng Anh có nghĩa: "${word.meaning}"`,
        answer: answerText,
        baseAnswer: word.word,
        letters: countAnswerLetters(answerText),
        answerParts: splitAnswerParts(answerText),
        hasSpaces: /\s/.test(answerText.trim()),
      };
    }

    case 'listen': {
      const answerText = word.word || '';
      return {
        wordToSpeak: answerText,
        answer: answerText,
        meaning: word.meaning || '',
        phonetic: word.phonetic || '',
        letters: countAnswerLetters(answerText),
        answerParts: splitAnswerParts(answerText),
        hasSpaces: /\s/.test(answerText.trim()),
      };
    }

    default:
      throw new Error(`Unknown exercise type: ${type}`);
  }
}

import { reviewWord } from '../services/db.js';

// ─── SRS: reviewWord via Supabase directly ────────────────────────────────────

async function reviewWordInDB(wordId, rating) {
  if (!wordId) return;
  try {
    await reviewWord(wordId, rating);
  } catch (err) {
    console.warn('[useStudySession] reviewWordInDB error:', err);
  }
}

// ─── Session State Factory ────────────────────────────────────────────────────

function createInitialState() {
  return {
    allWords: [],
    queue: [],
    queueIndex: 0,
    completed: [],
    isActive: false,
    allowedType: null,
  };
}

function createQueueItem(word, forcedType = null, allWords = []) {
  const exerciseType = forcedType || randomFrom(EXERCISE_TYPES);
  return {
    word,
    exerciseType,
    exerciseData: generateExerciseData(word, exerciseType, allWords),
    usedTypes: [exerciseType],
    attempts: 0,
    failCount: 0,
  };
}

// ─── Main Hook ────────────────────────────────────────────────────────────────

export function useStudySession() {
  const [session, setSession] = useState(createInitialState);

  // Derived values
  const currentItem = session.isActive && session.queueIndex < session.queue.length
    ? session.queue[session.queueIndex]
    : null;

  const isComplete = session.isActive &&
    session.allWords.length > 0 &&
    session.completed.length >= session.allWords.length;

  const progress = {
    completed: session.completed.length,
    total: session.allWords.length,
    percent: session.allWords.length > 0
      ? Math.round((session.completed.length / session.allWords.length) * 100)
      : 0,
  };

  // ── startSession ────────────────────────────────────────────────────────────
  const startSession = useCallback((words, allowedType = null) => {
    if (!words || words.length === 0) return;
    const shuffled = shuffle(words);
    const queue = shuffled.map(w => createQueueItem(w, allowedType, words));
    setSession({
      allWords: words,
      queue,
      queueIndex: 0,
      completed: [],
      isActive: true,
      allowedType,
    });
  }, []);

  // ── rateFlashcard ───────────────────────────────────────────────────────────
  const rateFlashcard = useCallback((rating) => {
    setSession(prev => {
      if (!prev.isActive || prev.queueIndex >= prev.queue.length) return prev;
      const item = prev.queue[prev.queueIndex];
      if (item.exerciseType !== 'flashcard') return prev;

      const newItem = { ...item, attempts: item.attempts + 1 };
      const correct = rating !== 'hard';

      // New words always complete regardless of rating
      const isNewWord = item.word.level === 0 || item.word.isNew === true;

      if (isNewWord || correct) {
        const effectiveRating = isNewWord ? 'good' : rating;
        reviewWordInDB(item.word.wordId || item.word.id, effectiveRating);
        return {
          ...prev,
          queue: prev.queue.map((q, i) => i === prev.queueIndex ? newItem : q),
          queueIndex: prev.queueIndex + 1,
          completed: [...prev.completed, {
            word: item.word,
            rating: effectiveRating,
            attempts: newItem.attempts,
            isNew: isNewWord,
          }],
        };
      }

      // Hard rating on normal word → change exercise type, push to end of queue
      newItem.failCount = (newItem.failCount || 0) + 1;
      const nextType = prev.allowedType || pickNextType(newItem.usedTypes);
      newItem.exerciseType = nextType;
      newItem.exerciseData = generateExerciseData(item.word, nextType, prev.allWords);
      if (!newItem.usedTypes.includes(nextType)) newItem.usedTypes = [...newItem.usedTypes, nextType];

      reviewWordInDB(item.word.wordId || item.word.id, 'hard');
      return {
        ...prev,
        queue: [
          ...prev.queue.map((q, i) => i === prev.queueIndex ? newItem : q),
          newItem,
        ],
        queueIndex: prev.queueIndex + 1,
      };
    });

    // Play sound
    if (typeof window !== 'undefined') {
      if (rating !== 'hard') window.HiSound?.playCorrect?.();
      else window.HiSound?.playIncorrect?.();
    }
  }, []);

  // ── submitAnswer (MCQ / Fill / Listen) ─────────────────────────────────────
  /**
   * Returns { correct, correctAnswer, skipped, wordCompleted, failCount }
   * so exercise components can show feedback before the state updates.
   */
  const submitAnswer = useCallback((userAnswer) => {
    let result = { correct: false, correctAnswer: '', skipped: false, wordCompleted: false };

    setSession(prev => {
      if (!prev.isActive || prev.queueIndex >= prev.queue.length) return prev;
      const item = prev.queue[prev.queueIndex];
      const newItem = { ...item, attempts: item.attempts + 1 };

      let correct = false;
      let correctAnswer = '';

      // ── MCQ ──────────────────────────────────────────────────────────────
      if (item.exerciseType === 'mcq') {
        const selectedOption = item.exerciseData.options[userAnswer];
        correct = selectedOption?.isCorrect === true;
        correctAnswer = item.exerciseData.options.find(o => o.isCorrect)?.text || '';

      // ── Fill / Listen ─────────────────────────────────────────────────────
      } else {
        const norm = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
        correct = norm(userAnswer) === norm(item.exerciseData.answer);
        correctAnswer = item.exerciseData.answer;
      }

      const isNewWord = item.word.level === 0 || item.word.isNew === true;

      // ── New word: always advance ──────────────────────────────────────────
      if (isNewWord) {
        reviewWordInDB(item.word.wordId || item.word.id, correct ? 'good' : 'hard');
        result = { correct, correctAnswer, skipped: false, wordCompleted: true, isNewWord: true };

        if (!correct) {
          // Push back with new exercise type for learning reinforcement
          newItem.failCount = (newItem.failCount || 0) + 1;
          const nextType = prev.allowedType || pickNextType(newItem.usedTypes);
          newItem.exerciseType = nextType;
          newItem.exerciseData = generateExerciseData(item.word, nextType, prev.allWords);
          if (!newItem.usedTypes.includes(nextType)) newItem.usedTypes = [...newItem.usedTypes, nextType];
          return {
            ...prev,
            queue: [...prev.queue.map((q, i) => i === prev.queueIndex ? newItem : q), { ...newItem }],
            queueIndex: prev.queueIndex + 1,
            completed: [...prev.completed, { word: item.word, rating: 'hard', attempts: newItem.attempts, isNew: true }],
          };
        }

        return {
          ...prev,
          queue: prev.queue.map((q, i) => i === prev.queueIndex ? newItem : q),
          queueIndex: prev.queueIndex + 1,
          completed: [...prev.completed, { word: item.word, rating: 'good', attempts: newItem.attempts, isNew: true }],
        };
      }

      // ── Wrong ≥ 3 times: skip ─────────────────────────────────────────────
      if (!correct) {
        newItem.failCount = (newItem.failCount || 0) + 1;
        if (newItem.failCount >= 3) {
          reviewWordInDB(item.word.wordId || item.word.id, 'hard');
          result = { correct: false, correctAnswer, skipped: true, wordCompleted: true, failCount: newItem.failCount };
          return {
            ...prev,
            queue: prev.queue.map((q, i) => i === prev.queueIndex ? newItem : q),
            queueIndex: prev.queueIndex + 1,
            completed: [...prev.completed, { word: item.word, rating: 'hard', attempts: newItem.attempts, skipped: true }],
          };
        }

        // Change exercise type, push to end
        const nextType = prev.allowedType || pickNextType(newItem.usedTypes);
        newItem.exerciseType = nextType;
        newItem.exerciseData = generateExerciseData(item.word, nextType, prev.allWords);
        if (!newItem.usedTypes.includes(nextType)) newItem.usedTypes = [...newItem.usedTypes, nextType];

        result = { correct: false, correctAnswer, skipped: false, wordCompleted: false, failCount: newItem.failCount };
        return {
          ...prev,
          queue: [...prev.queue.map((q, i) => i === prev.queueIndex ? newItem : q), { ...newItem }],
          queueIndex: prev.queueIndex + 1,
        };
      }

      // ── Correct ───────────────────────────────────────────────────────────
      const rating = newItem.attempts === 1 ? 'easy' : newItem.attempts === 2 ? 'good' : 'hard';
      reviewWordInDB(item.word.wordId || item.word.id, rating);
      result = { correct: true, correctAnswer, skipped: false, wordCompleted: true, rating };
      return {
        ...prev,
        queue: prev.queue.map((q, i) => i === prev.queueIndex ? newItem : q),
        queueIndex: prev.queueIndex + 1,
        completed: [...prev.completed, { word: item.word, rating, attempts: newItem.attempts }],
      };
    });

    // Play sound
    if (typeof window !== 'undefined') {
      if (result.correct) window.HiSound?.playCorrect?.();
      else window.HiSound?.playIncorrect?.();
    }

    return result;
  }, []);

  // ── TTS ─────────────────────────────────────────────────────────────────────
  const speakWord = useCallback((word, rate = 0.9) => {
    if (!word) return;
    if (typeof window !== 'undefined' && window.HiAudio?.playWord) {
      window.HiAudio.playWord(word, rate);
      return;
    }
    try {
      if (window.speechSynthesis?.paused) window.speechSynthesis.resume();
      if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
      setTimeout(() => {
        const utt = new SpeechSynthesisUtterance(word);
        utt.lang = 'en-US';
        utt.rate = rate;
        utt.pitch = 1;
        const voices = window.speechSynthesis.getVoices();
        const pref = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.localService));
        if (pref) utt.voice = pref;
        window.speechSynthesis.speak(utt);
      }, 30);
    } catch {}
  }, []);

  // ── endSession ──────────────────────────────────────────────────────────────
  const endSession = useCallback(() => {
    setSession(prev => ({ ...prev, isActive: false }));
    if (typeof window !== 'undefined') window.HiSound?.playComplete?.();
  }, []);

  return {
    // State
    session,
    currentItem,
    isComplete,
    progress,
    // Actions
    startSession,
    rateFlashcard,
    submitAnswer,
    speakWord,
    endSession,
    // Expose for components
    EXERCISE_TYPES,
  };
}

export default useStudySession;
