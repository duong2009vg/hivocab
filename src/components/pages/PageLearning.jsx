// src/components/pages/PageLearning.jsx
// 100% Pure React implementation with Stitch Crayon Picture Book aesthetic
// Loads words from window globals or directly from db.js via getWordsInLesson / getWordsInPassage / getWordsDueForReview.

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useStudySession } from '../../hooks/useStudySession.js';
import { useRoute } from '../../router/RouteContext.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import { getWordsInLesson, getWordsInPassage, getWordsDueForReview } from '../../services/db.js';
import { Compass, Home, Sparkles, AlertTriangle } from 'lucide-react';
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
  const { openModal } = useModal();
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
    nextQuestion,
    speakWord,
    endSession,
  } = useStudySession();

  const [soundMuted, setSoundMuted] = useState(false);
  const [isLoadingWords, setIsLoadingWords] = useState(true);
  const [noWordsToStudy, setNoWordsToStudy] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const initialized = useRef(false);

  // ── Init: load words ────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function initSession() {
      setIsLoadingWords(true);
      setNoWordsToStudy(false);

      // 1. Try reading saved session config from sessionStorage
      let savedConfig = null;
      if (typeof window !== 'undefined') {
        try {
          const raw = sessionStorage.getItem('hivocab_study_session_config');
          if (raw) {
            savedConfig = JSON.parse(raw);
          }
        } catch (e) {
          console.warn('[PageLearning] Failed to parse hivocab_study_session_config:', e);
        }
      }

      // 2. Resolve modeIndex (window global has precedence if set; fallback to savedConfig)
      let modeIndex = null;
      if (typeof window !== 'undefined' && window._practiceMode !== undefined && window._practiceMode !== null) {
        modeIndex = window._practiceMode;
      } else if (savedConfig && savedConfig.modeIndex !== undefined && savedConfig.modeIndex !== null) {
        modeIndex = savedConfig.modeIndex;
        if (typeof window !== 'undefined') {
          window._practiceMode = modeIndex;
        }
      }

      const allowedType = modeIndex !== null ? (MODE_TYPE_MAP[modeIndex] || null) : null;

      // 3. Resolve flashcardMode
      let mode = typeof window !== 'undefined' ? window._flashcardMode : null;
      if (!mode && savedConfig?.flashcardMode) {
        mode = savedConfig.flashcardMode;
      }
      if (!mode) {
        try { mode = localStorage.getItem('hivocab_flashcard_mode'); } catch (_) {}
      }
      mode = (mode === 'vi_en' || mode === 'en_vi') ? mode : 'en_vi';
      if (typeof window !== 'undefined') {
        window._flashcardMode = mode;
      }

      // 4. Resolve words
      let words = typeof window !== 'undefined'
        ? (window._currentLessonWords || window._currentSessionWords || [])
        : [];

      // Restore words from sessionStorage if window globals were erased by reload
      if ((!words || words.length === 0) && savedConfig?.words && savedConfig.words.length > 0) {
        words = savedConfig.words;
        if (typeof window !== 'undefined') {
          window._currentLessonWords = words;
        }
      }

      // 5. Fallback database fetch if words are still empty
      if (!words || words.length === 0) {
        let topicId = typeof window !== 'undefined' ? window._currentTopicId : null;
        let lessonIdx = typeof window !== 'undefined' ? (window._currentLessonIndex ?? 0) : 0;
        let passageId = typeof window !== 'undefined' ? window._currentPassageId : null;

        if (savedConfig) {
          if (!topicId && savedConfig.topicId) topicId = savedConfig.topicId;
          if (!passageId && savedConfig.passageId) passageId = savedConfig.passageId;
          if (savedConfig.lessonIndex !== undefined) lessonIdx = savedConfig.lessonIndex;
        }

        if (!topicId && !passageId && typeof window !== 'undefined') {
          try {
            const savedState = JSON.parse(sessionStorage.getItem('hi_current_lesson_state') || '{}');
            if (savedState.passageId) passageId = savedState.passageId;
            if (savedState.topicId) topicId = savedState.topicId;
            if (typeof savedState.lessonIndex === 'number') lessonIdx = savedState.lessonIndex;
          } catch (_) {}
        }

        try {
          if (passageId) {
            words = await getWordsInPassage(passageId);
          } else if (topicId) {
            words = await getWordsInLesson(topicId, lessonIdx);
          } else {
            // General SRS review session
            words = await getWordsDueForReview(50);
          }
        } catch (err) {
          console.warn('[PageLearning] Failed to fetch fallback words:', err);
        }
      }

      if (words && words.length > 0) {
        try {
          sessionStorage.setItem(
            'hivocab_study_session_config',
            JSON.stringify({
              modeIndex,
              allowedType,
              flashcardMode: mode,
              words,
              topicId: typeof window !== 'undefined' ? window._currentTopicId : (savedConfig?.topicId || null),
              passageId: typeof window !== 'undefined' ? window._currentPassageId : (savedConfig?.passageId || null),
              lessonIndex: typeof window !== 'undefined' ? (window._currentLessonIndex ?? 0) : (savedConfig?.lessonIndex ?? 0),
              timestamp: Date.now(),
            })
          );
        } catch (_) {}

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
    const wordObj = currentItem?.word;
    const wordText = wordObj?.word || '';
    openModal('bugReport', {
      initialType: 'bug',
      feature: 'Luyện tập từ vựng',
      title: wordText ? `Báo lỗi từ: "${wordText}"` : 'Báo lỗi câu hỏi từ vựng',
      contextData: {
        word: wordText,
        meaning: wordObj?.meaning || '',
        phonetic: wordObj?.phonetic || '',
        exerciseType: currentItem?.exerciseType || '',
        queueIndex: session?.queueIndex,
      },
    });
  }, [currentItem, session?.queueIndex, openModal]);

  // ── Go home ─────────────────────────────────────────────────────────────────
  const goHome = useCallback(() => {
    endSession();
    try {
      sessionStorage.removeItem('hivocab_study_session_config');
    } catch (_) {}
    navigateTo('dashboard');
  }, [endSession, navigateTo]);

  // ── Back (to lesson detail or dashboard) with exit confirmation guard ──────
  const handleClose = useCallback(() => {
    if (!isComplete && session.isActive) {
      setShowExitConfirm(true);
      return;
    }
    endSession();
    try {
      sessionStorage.removeItem('hivocab_study_session_config');
    } catch (_) {}
    const hasLessonContext = typeof window !== 'undefined' && (window._currentTopicId || window._currentPassageId);
    navigateTo(hasLessonContext ? 'lesson-detail' : 'dashboard');
  }, [isComplete, session.isActive, endSession, navigateTo]);

  const confirmExit = useCallback(() => {
    setShowExitConfirm(false);
    endSession();
    try {
      sessionStorage.removeItem('hivocab_study_session_config');
    } catch (_) {}
    const hasLessonContext = typeof window !== 'undefined' && (window._currentTopicId || window._currentPassageId);
    navigateTo(hasLessonContext ? 'lesson-detail' : 'dashboard');
  }, [endSession, navigateTo]);

  const cancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  const handlePracticeAgain = useCallback(() => {
    if (session.allWords && session.allWords.length > 0) {
      startSession(session.allWords, session.allowedType, flashcardMode);
    } else {
      goHome();
    }
  }, [session.allWords, session.allowedType, flashcardMode, startSession, goHome]);

  const handleReviewFailedWords = useCallback(
    (failedWords) => {
      if (failedWords && failedWords.length > 0) {
        startSession(failedWords, session.allowedType, flashcardMode);
      } else {
        handlePracticeAgain();
      }
    },
    [session.allowedType, flashcardMode, startSession, handlePracticeAgain]
  );

  const handleBackToLesson = useCallback(() => {
    endSession();
    try {
      sessionStorage.removeItem('hivocab_study_session_config');
    } catch (_) {}
    const hasLessonContext = typeof window !== 'undefined' && (window._currentTopicId || window._currentPassageId);
    navigateTo(hasLessonContext ? 'lesson-detail' : 'dashboard');
  }, [endSession, navigateTo]);

  // Total word counts & Progress
  const totalNum = useMemo(() => {
    return Math.max(session.allWords?.length || session.queue?.length || 1, 1);
  }, [session.allWords?.length, session.queue?.length]);

  const currentNum = useMemo(() => {
    if (isComplete) return totalNum;
    return Math.min((session.queueIndex || 0) + 1, totalNum);
  }, [session.queueIndex, isComplete, totalNum]);

  const progressPct = useMemo(() => {
    if (isComplete) return 100;
    const current = session.queueIndex || 0;
    const total = session.queue?.length || totalNum || 1;
    const pct = Math.round((current / total) * 100);
    return Math.max(5, Math.min(pct, 95));
  }, [session.queueIndex, session.queue?.length, totalNum, isComplete]);

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
          <p className="text-base font-bold">Đang tải bài tập cùng Bé Hổ...</p>
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
            <span className="inline-flex items-center gap-1.5"><Compass className="w-4 h-4 shrink-0" /> Khám phá chủ đề</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="px-6 py-3 bg-white text-stone-800 rounded-2xl font-bold text-sm border-2 border-[#2B2523] shadow-[2px_3px_0px_#2B2523] flex items-center gap-2 active:translate-y-0.5 transition-all cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5"><Home className="w-4 h-4 shrink-0" /> Về trang chủ</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="page-learning" className="page active min-h-[100dvh] flex flex-col justify-between crayon-paper-pattern selection:bg-orange-200 selection:text-stone-900 font-comfortaa">
      {/* ── Top Navigation Bar with Progress, Exit, Audio & Flag (Full Reliable SVG Icons) ── */}
      <header className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-2.5 sm:pt-6 pb-2 sm:pb-3 z-30 shrink-0 pwa-safe-top" data-purpose="quiz-top-bar">
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
          <div className="flex-1 min-w-0 max-w-2xl px-1 sm:px-4 flex flex-col gap-0.5 sm:gap-1.5" data-purpose="learning-progress">
            <div className="flex items-center justify-between text-[11px] sm:text-sm font-bold text-stone-700 gap-1">
              <span className="flex items-center gap-1.5 min-w-0 flex-1">
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
                <span className="text-xs font-bold">{flashcardMode === 'en_vi' ? 'EN → VI' : 'VI → EN'}</span>
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
              className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border-2 border-[#2B2523] shadow-[2px_2px_0px_#2B2523] items-center justify-center hover:bg-red-50 text-stone-700 hover:text-red-600 active:translate-y-0.5 transition cursor-pointer"
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
        className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-2 sm:pb-6 flex flex-col justify-center items-center relative overflow-x-hidden"
      >
        {isComplete ? (
          /* ── Completion screen ── */
          <ExerciseCompleted
            completedWords={session.completed}
            allWords={session.allWords}
            sessionStartTime={session.startTime}
            onGoHome={goHome}
            onReviewFailedWords={handleReviewFailedWords}
            onPracticeAgain={handlePracticeAgain}
            onBackToLesson={handleBackToLesson}
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
                onNext={nextQuestion}
                onReport={handleReport}
                sessionInfo={sessionInfo}
              />
            )}
            {currentItem.exerciseType === 'fill' && (
              <ExerciseFill
                key={`${currentItem.word?.wordId || currentItem.word?.id}-${session.queueIndex}`}
                item={currentItem}
                onSubmit={submitAnswer}
                onNext={nextQuestion}
                speakWord={speakWord}
                onReport={handleReport}
                sessionInfo={sessionInfo}
              />
            )}
            {currentItem.exerciseType === 'listen' && (
              <ExerciseListen
                key={`${currentItem.word?.wordId || currentItem.word?.id}-${session.queueIndex}`}
                item={currentItem}
                onSubmit={submitAnswer}
                onNext={nextQuestion}
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
          <Sparkles className="w-4 h-4 text-emerald-600 inline shrink-0" />
        </div>
      </footer>

      {/* ── Exit Confirmation Dialog ── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in font-comfortaa">
          <div className="w-full max-w-sm bg-white border-[3px] border-[#2B2523] rounded-[28px] p-5 sm:p-6 shadow-[6px_6px_0px_#2B2523] text-center relative animate-scale-in">
            <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-[#2B2523] shadow-[2px_2px_0px_#2B2523] mx-auto mb-3 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-7 h-7 text-[#D36135]" />
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 mb-1.5 font-rounded">
              Dừng bài học tại đây?
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mb-5 leading-relaxed font-quicksand font-semibold">
              Tiến độ của buổi học này sẽ chưa được lưu trọn vẹn. Bạn có chắc chắn muốn thoát về không?
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={cancelExit}
                className="flex-1 py-2.5 sm:py-3 px-4 bg-[#264653] hover:bg-[#1B353F] active:translate-y-0.5 text-white font-bold text-xs sm:text-sm rounded-xl border-2 border-[#2B2523] shadow-[2px_2px_0px_#2B2523] cursor-pointer transition-all"
              >
                Tiếp tục học
              </button>
              <button
                type="button"
                onClick={confirmExit}
                className="flex-1 py-2.5 sm:py-3 px-4 bg-[#FAF5EB] hover:bg-[#F2ECE0] active:translate-y-0.5 text-stone-700 hover:text-red-600 font-bold text-xs sm:text-sm rounded-xl border-2 border-[#2B2523] shadow-[2px_2px_0px_#2B2523] cursor-pointer transition-all"
              >
                Rời khỏi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PageLearning;
