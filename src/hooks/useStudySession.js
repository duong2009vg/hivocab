// src/hooks/useStudySession.js
// Pure React port of sessionEngine.js + sessionUI.js logic.
// No window.HiSession dependency — fully self-contained.

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { reviewWord } from '../services/db.js';

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
    try {
      return new RegExp(`(^|[^a-zA-Z0-9_])(${phrase})(?=$|[^a-zA-Z0-9_])`, 'gi');
    } catch {
      return null;
    }
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

function generateExerciseData(word, type, allWords = [], flashcardMode = 'en_vi') {
  if (!word) {
    return {
      mode: 'en_vi',
      frontLabel: 'TỪ TIẾNG ANH',
      frontWord: '',
      meaning: '',
      backLabel: 'ĐÁP ÁN TIẾNG VIỆT',
      backWord: '',
      options: [],
      answer: '',
      word: '',
    };
  }

  const safeWord = String(word.word || '').trim();
  const safeMeaning = String(word.meaning || '').trim();
  const safePhonetic = String(word.phonetic || '').trim();
  const safePos = String(word.pos || '').trim();
  const safeExample = String(word.example_sentence || word.exampleSentence || '').trim();
  const safeImage = String(word.image_url || word.imageUrl || '').trim();

  switch (type) {
    case 'flashcard': {
      const isEnVi = (flashcardMode || 'en_vi') === 'en_vi';
      if (isEnVi) {
        return {
          mode: 'en_vi',
          frontLabel: 'TỪ TIẾNG ANH',
          frontWord: safeWord,
          pos: safePos,
          phonetic: safePhonetic,
          exampleSentence: safeExample,
          imageUrl: safeImage,
          backLabel: 'ĐÁP ÁN TIẾNG VIỆT',
          backWord: safeMeaning,
          meaning: safeMeaning,
          englishWord: safeWord,
        };
      }
      return {
        mode: 'vi_en',
        frontLabel: 'DỊCH SANG TIẾNG ANH',
        frontWord: safeMeaning,
        pos: safePos,
        phonetic: safePhonetic,
        exampleSentence: safeExample,
        imageUrl: safeImage,
        backLabel: 'ĐÁP ÁN TIẾNG ANH',
        backWord: safeWord,
        meaning: safeMeaning,
        englishWord: safeWord,
      };
    }

    case 'mcq': {
      const correctOption = { text: safeMeaning || 'Nghĩa chính xác', isCorrect: true };
      const currentWordId = word.id || word.wordId;
      const others = (allWords || [])
        .filter(w => (w.id || w.wordId) !== currentWordId && w.meaning)
        .map(w => String(w.meaning).trim())
        .filter(m => m && m !== safeMeaning);
      const fallbackPool = FALLBACK_DISTRACTORS.filter(d => !others.includes(d) && d !== safeMeaning);
      const padded = [...others];
      while (padded.length < 3) {
        padded.push(fallbackPool.shift() || 'Không xác định');
      }
      const distractors = shuffle(padded)
        .slice(0, 3)
        .map(text => ({ text, isCorrect: false }));
      return {
        question: 'Chọn nghĩa đúng của',
        word: safeWord,
        phonetic: safePhonetic,
        pos: safePos,
        options: shuffle([correctOption, ...distractors]),
      };
    }

    case 'fill': {
      let sentence = null;
      let answerText = safeWord;
      let blankPlaceholder = buildBlankPlaceholder(answerText);
      if (safeExample) {
        const blanked = blankAnswerInSentence(safeExample, safeWord);
        if (blanked) {
          sentence = blanked.sentence;
          answerText = blanked.answer;
          blankPlaceholder = blanked.placeholder;
        }
      }
      return {
        sentence,
        blankPlaceholder,
        meaningHint: `Điền từ tiếng Anh có nghĩa: "${safeMeaning}"`,
        answer: answerText,
        baseAnswer: safeWord,
        phonetic: safePhonetic,
        pos: safePos,
        letters: countAnswerLetters(answerText),
        answerParts: splitAnswerParts(answerText),
        hasSpaces: /\s/.test(answerText.trim()),
      };
    }

    case 'listen': {
      const answerText = safeWord;
      return {
        wordToSpeak: answerText,
        answer: answerText,
        meaning: safeMeaning,
        phonetic: safePhonetic,
        pos: safePos,
        letters: countAnswerLetters(answerText),
        answerParts: splitAnswerParts(answerText),
        hasSpaces: /\s/.test(answerText.trim()),
      };
    }

    default:
      return generateExerciseData(word, 'flashcard', allWords, flashcardMode);
  }
}

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
    flashcardMode: 'en_vi',
  };
}

function createQueueItem(word, forcedType = null, allWords = [], flashcardMode = 'en_vi') {
  const exerciseType = forcedType || randomFrom(EXERCISE_TYPES);
  return {
    word,
    exerciseType,
    exerciseData: generateExerciseData(word, exerciseType, allWords, flashcardMode),
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
    ((session.queueIndex >= session.queue.length && session.queue.length > 0) ||
      session.completed.length >= session.allWords.length);

  const progress = {
    completed: session.completed.length,
    total: session.allWords.length,
    percent: session.allWords.length > 0
      ? Math.round((session.completed.length / session.allWords.length) * 100)
      : 0,
  };

  useEffect(() => {
    if (isComplete && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hivocab:study-session-completed'));
    }
  }, [isComplete]);

  // ── startSession ────────────────────────────────────────────────────────────
  const startSession = useCallback((words, allowedType = null, flashcardMode = null) => {
    if (!words || words.length === 0) return;
    const validWords = words
      .filter(w => w && (w.word || w.meaning))
      .map(w => ({
        ...w,
        id: w.id || w.wordId,
        wordId: w.wordId || w.id,
        word: String(w.word || '').trim(),
        meaning: String(w.meaning || '').trim(),
        phonetic: String(w.phonetic || '').trim(),
        pos: String(w.pos || '').trim(),
      }));

    if (validWords.length === 0) return;

    let mode = flashcardMode;
    if (!mode && typeof window !== 'undefined') {
      mode = window._flashcardMode || null;
    }
    if (!mode) {
      try { mode = localStorage.getItem('hivocab_flashcard_mode'); } catch (_) {}
    }
    mode = (mode === 'vi_en' || mode === 'en_vi') ? mode : 'en_vi';

    const shuffled = shuffle(validWords);
    const queue = shuffled.map(w => createQueueItem(w, allowedType, validWords, mode));
    setSession({
      allWords: validWords,
      queue,
      queueIndex: 0,
      completed: [],
      isActive: true,
      allowedType,
      flashcardMode: mode,
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
      newItem.exerciseData = generateExerciseData(item.word, nextType, prev.allWords, prev.flashcardMode);
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

  // ── pendingResultRef — bridges submitAnswer → nextQuestion ──────────────────
  // submitAnswer is pure computation: evaluates the answer, fires SRS DB update & sound.
  // It does NOT mutate session state, so the exercise modal can stay open without re-render flicker.
  // When the user clicks "Tiếp tục" in the modal, nextQuestion() applies all state changes atomically.
  const pendingResultRef = useRef(null);

  // ── submitAnswer (MCQ / Fill / Listen) ─────────────────────────────────────
  const submitAnswer = useCallback((userAnswer) => {
    let result = { correct: false, correctAnswer: '', skipped: false, wordCompleted: false };

    if (!session.isActive || session.queueIndex >= session.queue.length) return result;
    const item = session.queue[session.queueIndex];
    if (!item) return result;

    const attempts = (item.attempts || 0) + 1;
    let correct = false;
    let correctAnswer = '';

    // ── MCQ ──────────────────────────────────────────────────────────────
    if (item.exerciseType === 'mcq') {
      const selectedOption = item.exerciseData?.options?.[userAnswer];
      correct = selectedOption?.isCorrect === true;
      correctAnswer = item.exerciseData?.options?.find(o => o.isCorrect)?.text || '';

    // ── Fill / Listen ─────────────────────────────────────────────────────
    } else {
      const norm = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
      correct = norm(userAnswer) === norm(item.exerciseData?.answer);
      correctAnswer = item.exerciseData?.answer || '';
    }

    const isNewWord = item.word?.level === 0 || item.word?.isNew === true;
    const wordId = item.word?.wordId || item.word?.id;

    // Play sound
    if (typeof window !== 'undefined') {
      if (correct) window.HiSound?.playCorrect?.();
      else window.HiSound?.playIncorrect?.();
    }

    // Determine result & fire SRS update
    if (isNewWord) {
      const effectiveRating = correct ? 'good' : 'hard';
      reviewWordInDB(wordId, effectiveRating);
      result = { correct, correctAnswer, skipped: false, wordCompleted: true, isNewWord: true, rating: effectiveRating };
    } else if (!correct) {
      const currentFailCount = (item.failCount || 0) + 1;
      if (currentFailCount >= 3) {
        reviewWordInDB(wordId, 'hard');
        result = { correct: false, correctAnswer, skipped: true, wordCompleted: true, failCount: currentFailCount, rating: 'hard' };
      } else {
        result = { correct: false, correctAnswer, skipped: false, wordCompleted: false, failCount: currentFailCount };
      }
    } else {
      const rating = attempts === 1 ? 'easy' : attempts === 2 ? 'good' : 'hard';
      reviewWordInDB(wordId, rating);
      result = { correct: true, correctAnswer, skipped: false, wordCompleted: true, rating };
    }

    // Save for nextQuestion to apply atomically
    pendingResultRef.current = { result, attempts };

    return result;
  }, [session.isActive, session.queue, session.queueIndex]);

  // ── nextQuestion ────────────────────────────────────────────────────────────
  /**
   * Called when user acknowledges the result (clicks "Tiếp tục" in modal).
   * Atomically applies the pending result AND advances queueIndex in ONE setSession call.
   * This guarantees the user ALWAYS advances to the next question regardless of correct/wrong.
   */
  const nextQuestion = useCallback(() => {
    setSession(prev => {
      if (!prev.isActive || prev.queueIndex >= prev.queue.length) return prev;

      const pending = pendingResultRef.current;

      // If called without a pending result, simply advance queueIndex
      if (!pending) {
        return {
          ...prev,
          queueIndex: prev.queueIndex + 1,
        };
      }

      // Clear pending
      pendingResultRef.current = null;

      const { result, attempts } = pending;
      const current = prev.queue[prev.queueIndex];
      if (!current) {
        return { ...prev, queueIndex: prev.queueIndex + 1 };
      }

      const updatedItem = { ...current, attempts };
      const isNewWord = current.word?.level === 0 || current.word?.isNew === true;
      const correct = result.correct;

      // ── Case 1: New Word (always completes) ──────────────────────────────
      if (isNewWord) {
        if (!correct) {
          updatedItem.failCount = (updatedItem.failCount || 0) + 1;
          const nextType = prev.allowedType || pickNextType(updatedItem.usedTypes);
          const requeuedItem = {
            ...updatedItem,
            exerciseType: nextType,
            exerciseData: generateExerciseData(updatedItem.word, nextType, prev.allWords, prev.flashcardMode),
            usedTypes: updatedItem.usedTypes.includes(nextType) ? updatedItem.usedTypes : [...updatedItem.usedTypes, nextType],
          };
          return {
            ...prev,
            queue: [...prev.queue.map((q, i) => i === prev.queueIndex ? updatedItem : q), requeuedItem],
            queueIndex: prev.queueIndex + 1,
            completed: [...prev.completed, { word: updatedItem.word, rating: 'hard', attempts, isNew: true }],
          };
        }
        return {
          ...prev,
          queue: prev.queue.map((q, i) => i === prev.queueIndex ? updatedItem : q),
          queueIndex: prev.queueIndex + 1,
          completed: [...prev.completed, { word: updatedItem.word, rating: 'good', attempts, isNew: true }],
        };
      }

      // ── Case 2: Wrong Answer ─────────────────────────────────────────────
      if (!correct) {
        updatedItem.failCount = (updatedItem.failCount || 0) + 1;
        if (updatedItem.failCount >= 3) {
          // Exceeded 3 attempts — skip word to complete session
          return {
            ...prev,
            queue: prev.queue.map((q, i) => i === prev.queueIndex ? updatedItem : q),
            queueIndex: prev.queueIndex + 1,
            completed: [...prev.completed, { word: updatedItem.word, rating: 'hard', attempts, skipped: true }],
          };
        }

        // Requeue to end of queue with another exercise type
        const nextType = prev.allowedType || pickNextType(updatedItem.usedTypes);
        const requeuedItem = {
          ...updatedItem,
          exerciseType: nextType,
          exerciseData: generateExerciseData(updatedItem.word, nextType, prev.allWords, prev.flashcardMode),
          usedTypes: updatedItem.usedTypes.includes(nextType) ? updatedItem.usedTypes : [...updatedItem.usedTypes, nextType],
        };

        return {
          ...prev,
          queue: [...prev.queue.map((q, i) => i === prev.queueIndex ? updatedItem : q), requeuedItem],
          queueIndex: prev.queueIndex + 1,
        };
      }

      // ── Case 3: Correct Answer ───────────────────────────────────────────
      const rating = attempts === 1 ? 'easy' : attempts === 2 ? 'good' : 'hard';
      return {
        ...prev,
        queue: prev.queue.map((q, i) => i === prev.queueIndex ? updatedItem : q),
        queueIndex: prev.queueIndex + 1,
        completed: [...prev.completed, { word: updatedItem.word, rating, attempts }],
      };
    });
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

  // ── setFlashcardMode ────────────────────────────────────────────────────────
  const setFlashcardMode = useCallback((newMode) => {
    const validMode = (newMode === 'vi_en' || newMode === 'en_vi') ? newMode : 'en_vi';
    if (typeof window !== 'undefined') {
      window._flashcardMode = validMode;
    }
    try { localStorage.setItem('hivocab_flashcard_mode', validMode); } catch (_) {}
    setSession(prev => {
      if (!prev.isActive) return prev;
      const updatedQueue = prev.queue.map(item => {
        if (item.exerciseType === 'flashcard') {
          return {
            ...item,
            exerciseData: generateExerciseData(item.word, 'flashcard', prev.allWords, validMode),
          };
        }
        return item;
      });
      return {
        ...prev,
        flashcardMode: validMode,
        queue: updatedQueue,
      };
    });
  }, []);

  // ── endSession ──────────────────────────────────────────────────────────────
  const endSession = useCallback(() => {
    setSession(prev => ({ ...prev, isActive: false }));
    if (typeof window !== 'undefined') {
      window.HiSound?.playComplete?.();
      window.dispatchEvent(new CustomEvent('hivocab:study-session-completed'));
    }
  }, []);

  return {
    // State
    session,
    flashcardMode: session.flashcardMode,
    currentItem,
    isComplete,
    progress,
    // Actions
    startSession,
    rateFlashcard,
    submitAnswer,
    nextQuestion,
    speakWord,
    endSession,
    setFlashcardMode,
    // Expose for components
    EXERCISE_TYPES,
  };
}

export default useStudySession;
