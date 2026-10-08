// src/components/pages/PageLearning.jsx
// 100% Pure React implementation with Stitch Crayon Picture Book aesthetic
// Loads words from window globals or directly from db.js via getWordsInLesson / getWordsInPassage / getWordsDueForReview.

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

// Activity title mapping
const ACTIVITY_TITLE_MAP = {
  flashcard: 'BÀI TẬP: THẺ GHI NHỚ',
  mcq: 'BÀI TẬP: TRẮC NGHIỆM TỪ VỰNG',
  fill: 'BÀI TẬP: ĐIỀN VÀO CHỖ TRỐNG',
  listen: 'BÀI TẬP: LUYỆN NGHE & ĐIỀN TỪ',
};

export function PageLearning() {
  const { navigateTo } = useRoute();
  const {
    currentItem,
    isComplete,
    progress,
    session,
    flashcardMode,
    setFlashcardMode,
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

      let mode = typeof window !== 'undefined' ? window._flashcardMode : null;
      if (!mode) {
        try { mode = localStorage.getItem('hivocab_flashcard_mode'); } catch (_) {}
      }
      mode = (mode === 'vi_en' || mode === 'en_vi') ? mode : 'en_vi';

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
        startSession(words, allowedType, mode);
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
    } else {
      alert('Đã ghi nhận báo cáo từ vựng. Đội ngũ HiVocab sẽ kiểm tra sớm nhất! 🐾');
    }
  }, []);

  // ── Go home ─────────────────────────────────────────────────────────────────
  const goHome = useCallback(() => {
    endSession();
    navigateTo('dashboard');
  }, [endSession, navigateTo]);

  // ── Back (to lesson detail or dashboard) ───────────────────────────────────
  const handleClose = useCallback(() => {
    endSession();
    const hasLessonContext = typeof window !== 'undefined' && (window._currentTopicId || window._currentPassageId);
    navigateTo(hasLessonContext ? 'lesson-detail' : 'dashboard');
  }, [endSession, navigateTo]);

  // Total word counts
  const totalNum = useMemo(() => {
    const total = (session.queue?.length || 0) + (session.completed?.length || 0) + (currentItem ? 1 : 0);
    return Math.max(total, 1);
  }, [session.queue?.length, session.completed?.length, currentItem]);

  const currentNum = useMemo(() => {
    const completedCount = session.completed?.length || 0;
    return isComplete ? totalNum : Math.min(completedCount + 1, totalNum);
  }, [session.completed?.length, isComplete, totalNum]);

  const progressPct = isComplete
    ? 100
    : Math.max(5, Math.round(((session.completed?.length || 0) / totalNum) * 100));

  const currentTitle = ACTIVITY_TITLE_MAP[currentItem?.exerciseType] || 'BÀI TẬP TỪ VỰNG';

  const sessionInfo = useMemo(
    () => ({
      currentNum,
      totalNum,
      lessonName: session.lessonName || '',
    }),
    [currentNum, totalNum, session.lessonName]
  );

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoadingWords || (!session.isActive && !isComplete && !noWordsToStudy)) {
    return (
      <div id="page-learning" className="page active min-h-screen flex flex-col items-center justify-center crayon-paper-pattern font-comfortaa">
        <div className="flex flex-col items-center justify-center gap-4 text-stone-700">
          <div className="w-16 h-16 rounded-full border-4 border-t-[#D36135] border-stone-300 animate-spin"></div>
          <p className="text-base font-bold">Đang tải bài tập cùng Bé Hổ... 🐾</p>
        </div>
      </div>
    );
  }

  // ── Empty state (No words found) ─────────────────────────────────────────────
  if (noWordsToStudy) {
    return (
      <div id="page-learning" className="page active min-h-screen flex flex-col items-center justify-center p-6 crayon-paper-pattern font-comfortaa text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-emerald-700 border-2 border-[#2B2523] shadow-[3px_4px_0px_#2B2523]">
          <svg className="w-10 h-10 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2">Chưa có từ vựng cần ôn tập!</h2>
        <p className="text-sm sm:text-base text-stone-600 max-w-md mb-6 leading-relaxed font-quicksand font-semibold">
          Bạn đã hoàn thành xuất sắc các từ cần ôn hôm nay, hoặc chưa có từ nào trong danh sách. Hãy khám phá thêm các chủ đề mới để bắt đầu học nhé!
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigateTo('topics')}
            className="px-6 py-3 bg-[#D36135] text-white rounded-2xl font-bold text-sm flex items-center gap-2 border-2 border-[#2B2523] shadow-[2px_3px_0px_#2B2523] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <span>Khám phá chủ đề 🧭</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="px-6 py-3 bg-white text-stone-800 rounded-2xl font-bold text-sm border-2 border-[#2B2523] shadow-[2px_3px_0px_#2B2523] flex items-center gap-2 active:translate-y-0.5 transition-all cursor-pointer"
          >
            <span>Về trang chủ 🏠</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="page-learning" className="page active min-h-[100dvh] flex flex-col justify-between crayon-paper-pattern selection:bg-orange-200 selection:text-stone-900 font-comfortaa">
      {/* ── Top Navigation Bar with Progress, Exit, Audio & Flag (Full Reliable SVG Icons) ── */}
      <header className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-2.5 sm:pt-6 pb-1 sm:pb-2 z-30 shrink-0 pwa-safe-top" data-purpose="quiz-top-bar">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Close / Exit Exercise Button */}
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border-2 border-[#2B2523] shadow-[2px_2px_0px_#2B2523] flex items-center justify-center text-stone-800 hover:bg-stone-50 hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer shrink-0"
            title="Quay lại"
          >
            <svg className="w-5 h-5 text-stone-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Center Progress Track with Crayon Aesthetic */}
          <div className="flex-1 max-w-2xl px-1 sm:px-4 flex flex-col gap-0.5 sm:gap-1.5" data-purpose="learning-progress">
            <div className="flex items-center justify-between text-[11px] sm:text-sm font-bold text-stone-700">
              <span className="flex items-center gap-1.5 truncate max-w-[170px] sm:max-w-none">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#D36135] inline-block shrink-0"></span>
                <span className="truncate tracking-wide">{currentTitle}</span>
              </span>
              <span className="bg-amber-100/90 text-stone-800 px-2 sm:px-2.5 py-0.5 rounded-full border border-stone-300 font-bold shrink-0 ml-1 sm:ml-2 text-[10px] sm:text-xs">
                Từ {currentNum} / {totalNum}
              </span>
            </div>

            {/* Progress Bar Track */}
            <div className="w-full h-3 sm:h-4 bg-[#EBDDCB] rounded-full p-0.5 border-2 border-[#2B2523] shadow-inner relative overflow-hidden">
              <div
                className="h-full crayon-stripe-bg rounded-full relative transition-all duration-500 ease-out border-r border-stone-800"
                style={{ width: `${progressPct}%` }}
              >
                {/* Crayon glossy reflection spot */}
                <div className="absolute top-0.5 left-2 right-2 h-1 bg-white/40 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Action Utilities: Flashcard Mode Toggle, Sound & Report */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {currentItem?.exerciseType === 'flashcard' && (
              <button
                type="button"
                onClick={() => setFlashcardMode(flashcardMode === 'en_vi' ? 'vi_en' : 'en_vi')}
                className="h-10 sm:h-12 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl bg-white border-2 border-[#2B2523] shadow-[2px_2px_0px_#2B2523] flex items-center gap-1.5 hover:bg-amber-50/70 active:translate-y-0.5 transition cursor-pointer text-stone-800 text-xs sm:text-sm font-bold"
                title={`Đang học: ${flashcardMode === 'en_vi' ? 'Anh - Việt' : 'Việt - Anh'}. Nhấp để đổi chiều.`}
              >
                <span className="text-sm">{flashcardMode === 'en_vi' ? '🇬🇧➔🇻🇳' : '🇻🇳➔🇬🇧'}</span>
                <span className="hidden sm:inline font-extrabold text-[11px] uppercase tracking-wider text-stone-700">
                  {flashcardMode === 'en_vi' ? 'Anh - Việt' : 'Việt - Anh'}
                </span>
                <span className="text-xs text-[#D36135]">⇄</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleSound}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border-2 border-[#2B2523] shadow-[2px_2px_0px_#2B2523] flex items-center justify-center hover:bg-amber-50 active:translate-y-0.5 transition cursor-pointer"
              title={soundMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {soundMuted ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-stone-700" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={handleReport}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border-2 border-[#2B2523] shadow-[2px_2px_0px_#2B2523] flex items-center justify-center hover:bg-red-50 text-stone-700 hover:text-red-600 active:translate-y-0.5 transition cursor-pointer"
              title="Báo cáo lỗi từ này"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-stone-700" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Exercise Area ── */}
      <main
        id="learning-main"
        className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 py-1.5 sm:py-6 flex flex-col justify-center items-center relative overflow-x-hidden"
      >
        {isComplete ? (
          /* ── Completion screen ── */
          <ExerciseCompleted
            completedWords={session.completed}
            onGoHome={goHome}
          />
        ) : currentItem ? (
          /* ── Active exercise ── */
          <div id="exercise-container" className="w-full flex flex-col items-center my-auto">
            {currentItem.exerciseType === 'flashcard' && (
              <ExerciseFlashcard
                key={`${currentItem.word?.wordId || currentItem.word?.id}-${session.queueIndex}`}
                item={currentItem}
                onRate={rateFlashcard}
                onReport={handleReport}
                sessionInfo={sessionInfo}
              />
            )}
            {currentItem.exerciseType === 'mcq' && (
              <ExerciseMCQ
                key={`${currentItem.word?.wordId || currentItem.word?.id}-${session.queueIndex}`}
                item={currentItem}
                onSubmit={submitAnswer}
                onReport={handleReport}
                sessionInfo={sessionInfo}
              />
            )}
            {currentItem.exerciseType === 'fill' && (
              <ExerciseFill
                key={`${currentItem.word?.wordId || currentItem.word?.id}-${session.queueIndex}`}
                item={currentItem}
                onSubmit={submitAnswer}
                onReport={handleReport}
                sessionInfo={sessionInfo}
              />
            )}
            {currentItem.exerciseType === 'listen' && (
              <ExerciseListen
                key={`${currentItem.word?.wordId || currentItem.word?.id}-${session.queueIndex}`}
                item={currentItem}
                onSubmit={submitAnswer}
                speakWord={speakWord}
                onReport={handleReport}
                sessionInfo={sessionInfo}
              />
            )}
          </div>
        ) : (
          /* ── Fallback ── */
          <div className="flex flex-col items-center justify-center gap-4 text-center py-20">
            <p className="text-stone-600 font-bold">Không tìm thấy từ vựng nào để luyện tập.</p>
            <button
              type="button"
              onClick={handleClose}
              className="bg-[#2B4566] text-white px-6 py-2.5 rounded-2xl font-bold text-sm border-2 border-[#2B2523] shadow-sm"
            >
              Quay lại
            </button>
          </div>
        )}
      </main>

      {/* ── Subtitle / Footer notes ── */}
      <footer className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-1.5 sm:py-3 flex items-center justify-between text-stone-600 font-crayon text-xs sm:text-base shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-stone-500">Từ</span>
          <span className="font-bold text-stone-800 text-sm sm:text-xl">{currentNum}</span>
          <span className="text-stone-400">/</span>
          <span className="text-stone-600">{totalNum}</span>
          <span className="text-[10px] sm:text-xs font-sans bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full ml-1 sm:ml-2">
            Thuật toán SRS
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-stone-500 text-[10px] sm:text-sm font-sans font-semibold">
          <span className="hidden xs:inline">HiVocab! Crayon Study Room</span>
          <span className="xs:hidden">HiVocab!</span>
          <span>🐾</span>
        </div>
      </footer>
    </div>
  );
}

export default PageLearning;
