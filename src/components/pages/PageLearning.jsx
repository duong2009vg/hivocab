// src/components/pages/PageLearning.jsx
// 100% Pure React implementation — no sessionEngine.js / sessionUI.js dependency.
// Loads words from window globals or directly from db.js via getWordsInLesson / getWordsInPassage / getWordsDueForReview.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStudySession } from '../../hooks/useStudySession.js';
import { useRoute } from '../../router/RouteContext.jsx';
import { getWordsInLesson, getWordsInPassage, getWordsDueForReview } from '../../services/db.js';
import ExerciseFlashcard  from '../learning/ExerciseFlashcard.jsx';
import ExerciseMCQ        from '../learning/ExerciseMCQ.jsx';
import ExerciseFill       from '../learning/ExerciseFill.jsx';
import ExerciseListen     from '../learning/ExerciseListen.jsx';
import ExerciseCompleted  from '../learning/ExerciseCompleted.jsx';

// Mode index → allowedType mapping
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
  const [isLoadingWords, setIsLoadingWords] = useState(true);
  const [noWordsToStudy, setNoWordsToStudy] = useState(false);
  const initialized = useRef(false);

  // ── Init: load words ────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function initSession() {
      setIsLoadingWords(true);
      setNoWordsToStudy(false);

      const modeIndex = typeof window !== 'undefined' ? (window._practiceMode ?? null) : null;
      const allowedType = modeIndex !== null ? (MODE_TYPE_MAP[modeIndex] || null) : null;

      let words = typeof window !== 'undefined'
        ? (window._currentLessonWords || window._currentSessionWords || [])
        : [];

      if (!words || words.length === 0) {
        const topicId = typeof window !== 'undefined' ? window._currentTopicId : null;
        const lessonIdx = typeof window !== 'undefined' ? (window._currentLessonIndex ?? 0) : 0;
        const passageId = typeof window !== 'undefined' ? window._currentPassageId : null;

        try {
          if (passageId) {
            words = await getWordsInPassage(passageId);
          } else if (topicId) {
            words = await getWordsInLesson(topicId, lessonIdx);
          } else {
            // General SRS review session
            words = await getWordsDueForReview(20);
          }
        } catch (err) {
          console.warn('[PageLearning] Failed to fetch fallback words:', err);
        }
      }

      if (words && words.length > 0) {
        startSession(words, allowedType);
        setIsLoadingWords(false);
      } else {
        setIsLoadingWords(false);
        setNoWordsToStudy(true);
      }
    }

    initSession();
  }, [startSession]);

  // ── Sound mute ─────────────────────────────────────────────────────────────
  const handleToggleSound = useCallback(() => {
    setSoundMuted((m) => {
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
    const hasLessonContext = typeof window !== 'undefined' && (window._currentTopicId || window._currentPassageId);
    navigateTo(hasLessonContext ? 'lesson-detail' : 'dashboard');
  }, [endSession, navigateTo]);

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoadingWords || (!session.isActive && !isComplete && !noWordsToStudy)) {
    return (
      <div id="page-learning" className="page active min-h-screen flex flex-col items-center justify-center bg-surface">
        <div className="flex flex-col items-center justify-center gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] animate-spin text-primary" style={{ animationDuration: '1.2s' }}>
            autorenew
          </span>
          <p className="text-sm font-medium">Đang tải bài tập...</p>
        </div>
      </div>
    );
  }

  // ── Empty state (No words found) ─────────────────────────────────────────────
  if (noWordsToStudy) {
    return (
      <div id="page-learning" className="page active min-h-screen flex flex-col items-center justify-center p-6 bg-surface text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500 border border-emerald-500/20">
          <span className="material-symbols-outlined text-[42px]">check_circle</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-on-surface mb-2">Chưa có từ vựng cần ôn tập!</h2>
        <p className="text-sm text-on-surface-variant max-w-md mb-8 leading-relaxed">
          Bạn đã hoàn thành xuất sắc các từ cần ôn hôm nay, hoặc chưa có từ nào trong danh sách. Hãy khám phá thêm các chủ đề mới để bắt đầu học nhé!
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigateTo('topics')}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">explore</span>
            <span>Khám phá chủ đề</span>
          </button>
          <button
            onClick={() => navigateTo('dashboard')}
            className="px-6 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-medium text-sm border border-outline-variant/30 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            <span>Về trang chủ</span>
          </button>
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
