// src/hooks/useStudySession.js
// Pure React port of sessionEngine.js + sessionUI.js logic.
// No window.HiSession dependency — fully self-contained.

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { reviewWord, logStudySession } from '../services/db.js';
import {
  generateMCQQuestion,
  MCQ_SUBTYPES,
  MCQ_TYPES,
  generateInterleavedMCQTypes,
  rotateMCQType,
  evaluateMCQAnswer,
} from '../utils/quizGenerators.js';

// ─── Answer Normalization ─────────────────────────────────────────────────────

/**
 * 11-step comprehensive answer string normalization.
 * Handles iOS curly quotes, dashes, ligatures, Unicode diacritics (café -> cafe),
 * zero-width characters, non-breaking spaces, and whitespace collapsing.
 */
export function normalizeAnswer(str) {
  if (str === null || str === undefined) return '';
  let s = String(str);

  // 1. Remove zero-width characters & BOM
  s = s.replace(/[\u200B\u200C\u2060\uFEFF]|\u200D/g, '');

  // 2. Normalize smart single quotes / apostrophes to ASCII ' (U+0027)
  s = s.replace(/[\u2018\u2019\u201A\u201B\u02BC\u02BB`\u00B4]/g, "'");

  // 3. Normalize smart double quotes to ASCII " (U+0022)
  s = s.replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"');

  // 4. Normalize dashes/hyphens to ASCII - (U+002D)
  s = s.replace(/[\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-');

  // 5. Remove soft hyphens (U+00AD)
  s = s.replace(/\u00AD/g, '');

  // 6. Case folding
  s = s.toLowerCase();

  // 7. Diacritic / Accent folding (e.g. café -> cafe, naïve -> naive, façade -> facade)
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 8. Latin ligature unfolding
  s = s.replace(/æ/g, 'ae').replace(/œ/g, 'oe');

  // 9. Collapse all whitespace (including non-breaking spaces \u00A0, em-spaces, tabs) to single space
  s = s.replace(/[\s\u00A0\u2000-\u200A\u202F\u205F\u3000]+/g, ' ');

  // 10. Trim leading and trailing whitespace
  return s.trim();
}

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

// ─── Exercise Data Generation ─────────────────────────────────────────────────

function generateExerciseData(word, type, allWords = [], flashcardMode = 'en_vi', mcqSubtype = null) {
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
      return generateMCQQuestion(word, allWords, mcqSubtype);
    }

    case 'fill': {
      const answerText = safeWord;
      return {
        sentence: null,
        blankPlaceholder: buildBlankPlaceholder(answerText),
        meaning: safeMeaning,
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

    case 'hangman': {
      return {
        answer: safeWord,
        meaning: safeMeaning,
        phonetic: safePhonetic,
        pos: safePos,
      };
    }

    default:
      return generateExerciseData(word, 'flashcard', allWords, flashcardMode);
  }
}

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

function createQueueItem(word, allowedType = null, allWords = [], flashcardMode = 'en_vi', mcqSubtype = null) {
  const exerciseType = allowedType || randomFrom(EXERCISE_TYPES);
  const exerciseData = generateExerciseData(word, exerciseType, allWords, flashcardMode, mcqSubtype);
  const resolvedMcqType = exerciseType === 'mcq'
    ? (exerciseData?.type || exerciseData?.subtype || mcqSubtype || null)
    : null;

  return {
    word,
    exerciseType,
    mcqType: resolvedMcqType,
    usedMcqTypes: resolvedMcqType ? [resolvedMcqType] : [],
    exerciseData,
    attempts: 0,
    failCount: 0,
    usedTypes: [exerciseType],
  };
}

// ─── Main Hook ────────────────────────────────────────────────────────────────

export function useStudySession() {
  const [session, setSession] = useState(createInitialState);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const sessionLoggedRef = useRef(false);
  const pendingSavesRef = useRef(new Set());
  const savedWordsCountRef = useRef(0);
  const lastSyncErrorToastAtRef = useRef(0);

  const persistWordReview = useCallback((wordId, rating) => {
    if (!wordId) return Promise.resolve(null);

    const runWithRetry = async () => {
      try {
        const res = await reviewWord(wordId, rating);
        savedWordsCountRef.current += 1;
        return res;
      } catch (firstErr) {
        await new Promise((r) => setTimeout(r, 300));
        try {
          const retryRes = await reviewWord(wordId, rating);
          savedWordsCountRef.current += 1;
          return retryRes;
        } catch (retryErr) {
          console.error('[useStudySession] reviewWord failed after retry:', retryErr || firstErr);
          if (typeof window !== 'undefined' && typeof window.showHiToast === 'function') {
            const now = Date.now();
            if (now - lastSyncErrorToastAtRef.current > 5000) {
              lastSyncErrorToastAtRef.current = now;
              window.showHiToast('Không thể lưu tiến độ từ vựng lên hệ thống. Vui lòng thử lại.', 'error');
            }
          }
          return null;
        }
      }
    };

    const p = runWithRetry().finally(() => {
      pendingSavesRef.current.delete(p);
    });
    pendingSavesRef.current.add(p);
    return p;
  }, []);

  // Derived values
  const currentItem = session.isActive && session.queueIndex < session.queue.length
    ? session.queue[session.queueIndex]
    : null;

  const isComplete = Boolean(
    session.isActive &&
    session.allWords.length > 0 &&
    session.queue.length > 0 &&
    session.queueIndex >= session.queue.length
  );

  const progress = {
    completed: session.completed.length,
    total: session.allWords.length,
    percent: session.allWords.length > 0
      ? Math.round((session.completed.length / session.allWords.length) * 100)
      : 0,
  };

  useEffect(() => {
    if (!isComplete || sessionLoggedRef.current) return;
    sessionLoggedRef.current = true;
    let cancelled = false;
    const count = session.completed.length || session.allWords.length || 1;

    (async () => {
      if (pendingSavesRef.current.size > 0) {
        await Promise.allSettled(Array.from(pendingSavesRef.current));
      }
      if (cancelled) return;

      if (savedWordsCountRef.current === 0) {
        await logStudySession(count).catch((err) => {
          console.warn('[useStudySession] logStudySession error:', err);
        });
      }

      if (!cancelled && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('hivocab:study-session-completed', {
            detail: {
              completedCount: session.completed.length,
              totalCount: session.allWords.length,
              date: new Date().toISOString(),
            },
          })
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isComplete, session.completed.length, session.allWords.length]);

  // ── startSession ────────────────────────────────────────────────────────────
  const startSession = useCallback((words, allowedType = null, flashcardMode = null) => {
    sessionLoggedRef.current = false;
    pendingSavesRef.current.clear();
    savedWordsCountRef.current = 0;
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
    const mcqSchedule = allowedType === 'mcq'
      ? generateInterleavedMCQTypes(shuffled.length)
      : [];
    const queue = shuffled.map((w, idx) =>
      createQueueItem(w, allowedType, validWords, mode, mcqSchedule[idx] || null)
    );
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

  // ── rateFlashcard (FSRS-6 4-State: 'again' | 'hard' | 'good' | 'easy') ──────
  const rateFlashcard = useCallback((rating) => {
    const normalizedRating =
      rating === 'again' || rating === 'hard' || rating === 'good' || rating === 'easy'
        ? rating
        : 'good';

    const cur = sessionRef.current;
    if (!cur?.isActive || cur.queueIndex >= cur.queue.length) return;
    const curItem = cur.queue[cur.queueIndex];
    if (!curItem || curItem.exerciseType !== 'flashcard') return;

    const wordId = curItem.word?.wordId || curItem.word?.id;
    const isLapse = normalizedRating === 'again';
    const nextFailCount = (curItem.failCount || 0) + 1;
    const isNewWord = curItem.word?.level === 0 || curItem.word?.isNew === true;

    if (!isLapse) {
      const effectiveRating = (curItem.failCount || 0) > 0 ? 'hard' : normalizedRating;
      persistWordReview(wordId, effectiveRating);
      setSession((prev) => {
        if (!prev.isActive || prev.queueIndex >= prev.queue.length) return prev;
        const item = prev.queue[prev.queueIndex];
        if (!item || item.exerciseType !== 'flashcard') return prev;
        const newItem = { ...item, attempts: item.attempts + 1 };
        return {
          ...prev,
          queue: prev.queue.map((q, i) => (i === prev.queueIndex ? newItem : q)),
          queueIndex: prev.queueIndex + 1,
          completed: [
            ...prev.completed,
            {
              word: item.word,
              rating: effectiveRating,
              attempts: newItem.attempts,
              isNew: isNewWord,
            },
          ],
        };
      });
    } else if (nextFailCount >= 3) {
      persistWordReview(wordId, 'again');
      setSession((prev) => {
        if (!prev.isActive || prev.queueIndex >= prev.queue.length) return prev;
        const item = prev.queue[prev.queueIndex];
        if (!item || item.exerciseType !== 'flashcard') return prev;
        const newItem = { ...item, attempts: item.attempts + 1, failCount: (item.failCount || 0) + 1 };
        return {
          ...prev,
          queue: prev.queue.map((q, i) => (i === prev.queueIndex ? newItem : q)),
          queueIndex: prev.queueIndex + 1,
          completed: [
            ...prev.completed,
            {
              word: item.word,
              rating: 'again',
              attempts: newItem.attempts,
              skipped: true,
              isNew: isNewWord,
            },
          ],
        };
      });
    } else {
      setSession((prev) => {
        if (!prev.isActive || prev.queueIndex >= prev.queue.length) return prev;
        const item = prev.queue[prev.queueIndex];
        if (!item || item.exerciseType !== 'flashcard') return prev;
        const nextType = prev.allowedType || pickNextType(item.usedTypes);
        const newItem = {
          ...item,
          attempts: item.attempts + 1,
          failCount: (item.failCount || 0) + 1,
          exerciseType: nextType,
          exerciseData: generateExerciseData(item.word, nextType, prev.allWords, prev.flashcardMode),
          usedTypes: item.usedTypes.includes(nextType) ? item.usedTypes : [...item.usedTypes, nextType],
        };
        return {
          ...prev,
          queue: [...prev.queue.map((q, i) => (i === prev.queueIndex ? newItem : q)), newItem],
          queueIndex: prev.queueIndex + 1,
        };
      });
    }

    // Play sound
    if (typeof window !== 'undefined') {
      if (!isLapse) window.HiSound?.playCorrect?.();
      else window.HiSound?.playIncorrect?.();
    }
  }, [persistWordReview]);

  // ── pendingResultRef — bridges submitAnswer → nextQuestion ──────────────────
  // submitAnswer is pure computation: evaluates the answer, fires SRS DB update & sound.
  // It does NOT mutate session state, so the exercise modal can stay open without re-render flicker.
  // When the user clicks "Tiếp tục" in the modal, nextQuestion() applies all state changes atomically.
  const pendingResultRef = useRef(null);

  // ── submitAnswer (MCQ / Fill / Listen / Hangman) ───────────────────────────
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
      const evalResult = evaluateMCQAnswer(item.exerciseData, userAnswer);
      correct = evalResult.correct;
      correctAnswer = evalResult.correctAnswer;

    // ── Fill / Listen / Hangman ───────────────────────────────────────────
    } else {
      correct = normalizeAnswer(userAnswer) === normalizeAnswer(item.exerciseData?.answer);
      correctAnswer = item.exerciseData?.answer || '';
    }

    const isNewWord = item.word?.level === 0 || item.word?.isNew === true;
    const wordId = item.word?.wordId || item.word?.id;
    const isActiveProduction = item.exerciseType === 'fill' || item.exerciseType === 'listen';

    // Play sound
    if (typeof window !== 'undefined') {
      if (correct) window.HiSound?.playCorrect?.();
      else window.HiSound?.playIncorrect?.();
    }

    // Determine FSRS-6 rating & fire SRS update:
    // - 1st try active recall (fill/listen) -> 'easy' (G=4) for review words, 'good' (G=3) for new words
    // - 1st try recognition (mcq/hangman) -> 'good' (G=3)
    // - 2nd try correct -> 'hard' (G=2)
    // - Failed >= 3 times (skipped) -> 'again' (G=1)
    if (isNewWord) {
      const currentFailCount = (item.failCount || 0) + 1;
      const isWordCompleted = correct || currentFailCount >= 3;
      const isSkipped = !correct && currentFailCount >= 3;
      const effectiveRating = !correct
        ? 'again'
        : attempts === 1
          ? 'good'
          : 'hard';

      if (isWordCompleted) {
        persistWordReview(wordId, effectiveRating);
      }

      result = {
        correct,
        correctAnswer,
        skipped: isSkipped,
        wordCompleted: isWordCompleted,
        isNewWord: true,
        failCount: currentFailCount,
        ...(isWordCompleted ? { rating: effectiveRating } : {}),
      };
    } else if (!correct) {
      const currentFailCount = (item.failCount || 0) + 1;
      if (currentFailCount >= 3) {
        persistWordReview(wordId, 'again');
        result = { correct: false, correctAnswer, skipped: true, wordCompleted: true, failCount: currentFailCount, rating: 'again' };
      } else {
        result = { correct: false, correctAnswer, skipped: false, wordCompleted: false, failCount: currentFailCount };
      }
    } else {
      const rating =
        attempts === 1
          ? (isActiveProduction ? 'easy' : 'good')
          : 'hard';
      persistWordReview(wordId, rating);
      result = { correct: true, correctAnswer, skipped: false, wordCompleted: true, rating };
    }

    // Save for nextQuestion to apply atomically
    pendingResultRef.current = { result, attempts };

    return result;
  }, [session.isActive, session.queue, session.queueIndex, persistWordReview]);

  // ── nextQuestion ────────────────────────────────────────────────────────────
  /**
   * Called when user acknowledges the result (clicks "Tiếp tục" in modal).
   * Atomically applies the pending result AND advances queueIndex in ONE setSession call.
   * Guarded against double-tap or timer race condition when pending is null.
   */
  const nextQuestion = useCallback(() => {
    // Fast-path guard: NO-OP if no pending result exists (prevents double-tap skip)
    const pending = pendingResultRef.current;
    if (!pending) {
      return;
    }

    // Consume pending result synchronously
    pendingResultRef.current = null;

    setSession(prev => {
      if (!prev.isActive || prev.queueIndex >= prev.queue.length) return prev;

      const { result, attempts } = pending;
      const current = prev.queue[prev.queueIndex];
      if (!current) {
        return prev;
      }

      const updatedItem = { ...current, attempts };
      const isNewWord = current.word?.level === 0 || current.word?.isNew === true;
      const correct = result.correct;
      const isActiveProduction = current.exerciseType === 'fill' || current.exerciseType === 'listen';

      // ── Case 1: New Word ─────────────────────────────────────────────────
      if (isNewWord) {
        if (!correct) {
          updatedItem.failCount = (updatedItem.failCount || 0) + 1;
          if (updatedItem.failCount >= 3) {
            // Exceeded 3 attempts — skip word to complete session
            return {
              ...prev,
              queue: prev.queue.map((q, i) => i === prev.queueIndex ? updatedItem : q),
              queueIndex: prev.queueIndex + 1,
              completed: [...prev.completed, { word: updatedItem.word, rating: 'again', attempts, skipped: true, isNew: true }],
            };
          }

          // Requeue to end of queue — DO NOT push to completed!
          const nextType = prev.allowedType || pickNextType(updatedItem.usedTypes);
          let nextMcqSubtype = null;
          let usedMcqTypes = updatedItem.usedMcqTypes || [];
          if (nextType === 'mcq') {
            const currentSubtype = updatedItem.mcqType || updatedItem.exerciseData?.type || updatedItem.exerciseData?.subtype;
            nextMcqSubtype = rotateMCQType(currentSubtype, usedMcqTypes);
            usedMcqTypes = [...usedMcqTypes, nextMcqSubtype];
          }
          const requeuedItem = {
            ...updatedItem,
            exerciseType: nextType,
            mcqType: nextMcqSubtype,
            usedMcqTypes,
            exerciseData: generateExerciseData(updatedItem.word, nextType, prev.allWords, prev.flashcardMode, nextMcqSubtype),
            usedTypes: updatedItem.usedTypes.includes(nextType) ? updatedItem.usedTypes : [...updatedItem.usedTypes, nextType],
          };
          return {
            ...prev,
            queue: [...prev.queue.map((q, i) => i === prev.queueIndex ? updatedItem : q), requeuedItem],
            queueIndex: prev.queueIndex + 1,
          };
        }
        const newWordRating = result.rating || (attempts === 1 ? 'good' : 'hard');
        return {
          ...prev,
          queue: prev.queue.map((q, i) => i === prev.queueIndex ? updatedItem : q),
          queueIndex: prev.queueIndex + 1,
          completed: [...prev.completed, { word: updatedItem.word, rating: newWordRating, attempts, isNew: true }],
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
            completed: [...prev.completed, { word: updatedItem.word, rating: 'again', attempts, skipped: true }],
          };
        }

        // Requeue to end of queue with another exercise type
        const nextType = prev.allowedType || pickNextType(updatedItem.usedTypes);
        let nextMcqSubtype = null;
        let usedMcqTypes = updatedItem.usedMcqTypes || [];
        if (nextType === 'mcq') {
          const currentSubtype = updatedItem.mcqType || updatedItem.exerciseData?.type || updatedItem.exerciseData?.subtype;
          nextMcqSubtype = rotateMCQType(currentSubtype, usedMcqTypes);
          usedMcqTypes = [...usedMcqTypes, nextMcqSubtype];
        }
        const requeuedItem = {
          ...updatedItem,
          exerciseType: nextType,
          mcqType: nextMcqSubtype,
          usedMcqTypes,
          exerciseData: generateExerciseData(updatedItem.word, nextType, prev.allWords, prev.flashcardMode, nextMcqSubtype),
          usedTypes: updatedItem.usedTypes.includes(nextType) ? updatedItem.usedTypes : [...updatedItem.usedTypes, nextType],
        };

        return {
          ...prev,
          queue: [...prev.queue.map((q, i) => i === prev.queueIndex ? updatedItem : q), requeuedItem],
          queueIndex: prev.queueIndex + 1,
        };
      }

      // ── Case 3: Correct Answer ───────────────────────────────────────────
      const rating =
        result.rating ||
        (attempts === 1 ? (isActiveProduction ? 'easy' : 'good') : 'hard');
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
    normalizeAnswer,
    // Expose for components & MCQ expansion
    EXERCISE_TYPES,
    MCQ_SUBTYPES,
    generateInterleavedMCQTypes,
  };
}

export {
  MCQ_SUBTYPES,
  MCQ_TYPES,
  generateInterleavedMCQTypes,
  rotateMCQType,
};

export default useStudySession;
