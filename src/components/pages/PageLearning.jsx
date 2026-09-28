// src/components/pages/PageLearning.jsx
// Phase 3: Full React implementation — no sessionEngine.js / sessionUI.js dependency.
// Words are loaded from window._currentLessonWords (set by useLessonDetail).
// Practice mode (modeIndex) is taken from window._practiceMode.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStudySession } from '../../hooks/useStudySession.js';
import { useRoute } from '../../router/RouteContext.jsx';
import ExerciseFlashcard  from '../learning/ExerciseFlashcard.jsx';
import ExerciseMCQ        from '../learning/ExerciseMCQ.jsx';
import ExerciseFill       from '../learning/ExerciseFill.jsx';
import ExerciseListen     from '../learning/ExerciseListen.jsx';
import ExerciseCompleted  from '../learning/ExerciseCompleted.jsx';

// Mode index → allowedType mapping (mirrors sessionEngine constants)
const MODE_TYPE_MAP = {
  0: 'flashcard',
  1: 'mcq',
  2: 'fill',
  3: 'listen',
};

export function PageLearning() {
  const { navigateTo } = useRoute();
  const {
    currentItem,
    isComplete,
    progress,
    session,
    startSession,
    rateFlashcard,
    submitAnswer,
    speakWord,
    endSession,
  } = useStudySession();

  const [soundMuted, setSoundMuted] = useState(false);
  const initialized = useRef(false);

  // ── Init: load words from window globals ───────────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const words = typeof window !== 'undefined'
      ? (window._currentLessonWords || window._currentSessionWords || [])
      : [];

    const modeIndex = typeof window !== 'undefined' ? (window._practiceMode ?? null) : null;
    const allowedType = modeIndex !== null ? (MODE_TYPE_MAP[modeIndex] || null) : null;

    if (words.length > 0) {
      startSession(words, allowedType);
    } else {
      // Fallback: try to get words from HiDB
      if (typeof window !== 'undefined' && window.HiDB) {
        const topicId    = window._currentTopicId;
        const lessonIdx  = window._currentLessonIndex ?? 0;
        const passageId  = window._currentPassageId;

        const fetchFn = passageId
          ? window.HiDB.getWordsInPassage?.(passageId)
          : window.HiDB.getWordsInLesson?.(topicId, lessonIdx);

        Promise.resolve(fetchFn).then(fetched => {
          if (fetched && fetched.length > 0) {
            startSession(fetched, allowedType);
          }
        }).catch(() => {});
      }
    }
  }, [startSession]);

  // ── Sound mute ─────────────────────────────────────────────────────────────
  const handleToggleSound = useCallback(() => {
    setSoundMuted(m => {
      const next = !m;
      if (typeof window !== 'undefined' && window.HiSound?.setMuted) {
        window.HiSound.setMuted(next);
      }
      return next;
    });
  }, []);

  // ── Report error ────────────────────────────────────────────────────────────
  const handleReport = useCallback(() => {
    if (typeof window !== 'undefined' && typeof window.reportCurrentLearningError === 'function') {
      window.reportCurrentLearningError();
    }
  }, []);

  // ── Go home ─────────────────────────────────────────────────────────────────
  const goHome = useCallback(() => {
    endSession();
    navigateTo('dashboard');
  }, [endSession, navigateTo]);

  // ── Back (to lesson detail) ──────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    endSession();
    navigateTo('lesson-detail');
  }, [endSession, navigateTo]);

  // ── Loading state ────────────────────────────────────────────────────────────
  if (!session.isActive && !isComplete) {
    return (
      <div id="page-learning" className="page active">
        <div className="flex flex-col items-center justify-center min-h-[100dvh] gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] animate-spin" style={{ animationDuration: '1.5s' }}>
            autorenew
          </span>
          <p className="text-sm">Đang tải bài tập...</p>
        </div>
      </div>
    );
  }

  const progressPct = isComplete ? 100 : progress.percent;

  return (
    <div id="page-learning" className="page active">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl px-4 md:px-gutter pb-3 md:py-md flex items-center justify-between shadow-sm mobile-sticky-top lg:pt-3">
        <button
          onClick={handleClose}
          className="text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-full cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] md:text-[24px]">close</span>
        </button>

        {/* Progress bar */}
        <div id="learning-progress-container" className="flex-1 max-w-md mx-4 md:mx-md flex items-center gap-md">
          <div className="w-full h-1.5 md:h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              id="learn-progress"
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSound}
            className="hi-sound-toggle-btn p-1.5 rounded-full hover:bg-surface-container text-primary transition-colors cursor-pointer"
            title="Tắt/Bật âm thanh học tập"
          >
            <span className="material-symbols-outlined text-[20px] md:text-[22px]">
              {soundMuted ? 'volume_off' : 'volume_up'}
            </span>
          </button>
          <button
            onClick={handleReport}
            className="p-1.5 rounded-full hover:bg-red-50 text-on-surface-variant hover:text-red-600 transition-colors cursor-pointer"
            title="Báo lỗi bài tập/từ vựng này"
          >
            <span className="material-symbols-outlined text-[20px] md:text-[22px]">flag</span>
          </button>
        </div>
      </header>

      {/* Main exercise area */}
      <main
        id="learning-main"
        className="pt-28 md:pt-[100px] pb-12 md:pb-xl px-4 sm:px-6 lg:px-12 max-w-3xl mx-auto flex flex-col gap-6 md:gap-10 items-center min-h-[100dvh]"
      >
        {isComplete ? (
          /* ── Completion screen ── */
          <ExerciseCompleted
            completedWords={session.completed}
            onGoHome={goHome}
          />
        ) : currentItem ? (
          /* ── Active exercise ── */
          <div id="exercise-container" className="w-full max-w-2xl mx-auto flex flex-col items-center">
            {currentItem.exerciseType === 'flashcard' && (
              <ExerciseFlashcard
                key={`${currentItem.word?.wordId || currentItem.word?.id}-${session.queueIndex}`}
                item={currentItem}
                onRate={rateFlashcard}
                onReport={handleReport}
              />
            )}
            {currentItem.exerciseType === 'mcq' && (
              <ExerciseMCQ
                key={`${currentItem.word?.wordId || currentItem.word?.id}-${session.queueIndex}`}
                item={currentItem}
                onSubmit={submitAnswer}
                onReport={handleReport}
              />
            )}
            {currentItem.exerciseType === 'fill' && (
              <ExerciseFill
                key={`${currentItem.word?.wordId || currentItem.word?.id}-${session.queueIndex}`}
                item={currentItem}
                onSubmit={submitAnswer}
                onReport={handleReport}
              />
            )}
            {currentItem.exerciseType === 'listen' && (
              <ExerciseListen
                key={`${currentItem.word?.wordId || currentItem.word?.id}-${session.queueIndex}`}
                item={currentItem}
                onSubmit={submitAnswer}
                speakWord={speakWord}
                onReport={handleReport}
              />
            )}
          </div>
        ) : (
          /* ── Fallback: no words ── */
          <div className="flex flex-col items-center justify-center gap-4 text-center py-20">
            <span className="material-symbols-outlined text-[48px] text-outline">sentiment_dissatisfied</span>
            <p className="text-on-surface-variant">Không tìm thấy từ vựng nào để luyện tập.</p>
            <button onClick={handleClose} className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold text-sm">
              Quay lại
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default PageLearning;
