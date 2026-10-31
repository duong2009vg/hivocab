// src/components/learning/ExerciseResultModal.jsx
// Modern Bottom Sheet Result Notification matching 100% the reference design
// Green for correct, Red for wrong, with audio button, phonetic, meaning, example, notes & auto-countdown timer.

import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function ExerciseResultModal({
  isOpen,
  isCorrect,
  word = '',
  phonetic = '',
  pos = '',
  meaning = '',
  exampleSentence = '',
  notes = '',
  userAnswer = '',
  onContinue,
  onReport,
}) {
  const [countdown, setCountdown] = useState(4);
  const [isPaused, setIsPaused] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const timerRef = useRef(null);

  // Play word pronunciation audio
  const handlePlayAudio = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      const targetWord = word || '';
      if (!targetWord) return;
      if (typeof window !== 'undefined' && window.HiAudio?.playWord) {
        window.HiAudio.playWord(targetWord, 0.9);
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          if (window.speechSynthesis.paused) window.speechSynthesis.resume();
          if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
          setTimeout(() => {
            const u = new SpeechSynthesisUtterance(targetWord);
            u.lang = 'en-US';
            u.rate = 0.9;
            window.speechSynthesis.speak(u);
          }, 30);
        } catch (_) {}
      }
    },
    [word]
  );

  // Reset countdown and state when opened
  useEffect(() => {
    if (isOpen) {
      setCountdown(4);
      setIsPaused(false);
      setIsCollapsed(false);
      // Auto-play pronunciation once when result appears
      const audioTimer = setTimeout(() => {
        handlePlayAudio();
      }, 200);
      return () => clearTimeout(audioTimer);
    }
  }, [isOpen, word, handlePlayAudio]);

  // Countdown timer logic
  useEffect(() => {
    if (!isOpen || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onContinue?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPaused, onContinue]);

  // Keyboard shortcut: Space / Enter advances to next question immediately
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        onContinue?.();
      }
      // P = pause / resume countdown
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onContinue]);

  if (!isOpen) return null;

  const cleanPos = pos ? String(pos).replace(/[()]/g, '').trim() : '';

  return (
    <>
      {/* Light backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1.5px] transition-opacity duration-300 animate-fade-in"
        onClick={() => setIsCollapsed((c) => !c)}
      />

      {/* ── Bottom Sheet Notification Panel ── */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 w-full max-w-2xl mx-auto rounded-t-[32px] sm:rounded-t-[38px] shadow-[0_-8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out font-comfortaa ${
          isCorrect
            ? 'bg-[#1DB954] text-white border-t-2 border-emerald-400'
            : 'bg-[#EF4444] text-white border-t-2 border-red-400'
        } ${isCollapsed ? 'translate-y-[calc(100%-80px)]' : 'translate-y-0'}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Collapse / Expand Toggle Button Floating at Top Right */}
        <button
          type="button"
          onClick={() => setIsCollapsed((c) => !c)}
          className={`absolute -top-4 sm:-top-5 right-5 sm:right-7 w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[3px] border-white shadow-md flex items-center justify-center cursor-pointer transition-transform duration-200 active:scale-95 text-white ${
            isCorrect ? 'bg-[#15803D] hover:bg-[#166534]' : 'bg-[#DC2626] hover:bg-[#991B1B]'
          }`}
          title={isCollapsed ? 'Mở rộng chi tiết' : 'Thu nhỏ xem lại câu hỏi'}
        >
          <svg
            className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${
              isCollapsed ? 'rotate-180' : 'rotate-0'
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            viewBox="0 0 24 24"
          >
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="px-5 sm:px-8 pt-5 sm:pt-6 pb-6 sm:pb-8 flex flex-col gap-2.5 sm:gap-3 select-text">
          {/* Row 1: Audio Speaker + Word + POS */}
          <div className="flex items-start gap-3">
            {/* White Rounded Square Speaker Button */}
            <button
              type="button"
              onClick={handlePlayAudio}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white text-[#EA580C] hover:bg-orange-50 active:scale-95 shadow-md flex items-center justify-center shrink-0 transition-transform cursor-pointer"
              title="Phát âm từ này"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-[#EA580C]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                viewBox="0 0 24 24"
              >
                <path
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Word name and Part of Speech */}
            <div className="flex flex-col min-w-0 pr-8">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-white/80 font-bold text-sm sm:text-base">Từ:</span>
                <span className="text-white font-black text-xl sm:text-2xl tracking-tight font-rounded">
                  {word}
                </span>
                {cleanPos && (
                  <span className="text-white/85 text-xs sm:text-sm font-medium">
                    ({cleanPos})
                  </span>
                )}
              </div>

              {/* Phonetic transcription */}
              {phonetic && (
                <div className="text-white/90 text-xs sm:text-sm font-mono tracking-wider -mt-0.5">
                  /{phonetic}/
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Vietnamese Meaning */}
          {meaning && (
            <div className="text-white text-sm sm:text-base leading-relaxed pl-1 sm:pl-2">
              <strong className="font-extrabold text-white">Nghĩa: </strong>
              <span className="font-semibold text-white/95">{meaning}</span>
            </div>
          )}

          {/* Row 2.5: User wrong answer display */}
          {!isCorrect && userAnswer && (
            <div className="text-white/90 text-xs sm:text-sm pl-1 sm:pl-2 font-quicksand font-medium">
              <span>Bạn đã chọn / điền: </span>
              <span className="line-through bg-black/20 px-2 py-0.5 rounded-md font-bold text-white">
                "{userAnswer}"
              </span>
            </div>
          )}

          {/* Row 3: Example Sentence (with speaker icon and highlighted word) */}
          {exampleSentence && (
            <div className="text-white/95 text-xs sm:text-sm leading-relaxed pl-1 sm:pl-2 flex items-start gap-1.5">
              <button
                type="button"
                onClick={handlePlayAudio}
                className="hover:scale-110 active:scale-95 transition-transform shrink-0 mt-0.5 cursor-pointer text-white"
                title="Nghe câu ví dụ"
              >
                <Volume2 className="w-4 h-4 text-white" />
              </button>
              <div className="min-w-0">
                <strong className="font-bold text-white">Ví dụ: </strong>
                <span className="italic font-serif">"{exampleSentence}"</span>
              </div>
            </div>
          )}

          {/* Row 4: Notes / Synonyms */}
          {notes && (
            <div className="text-white/90 text-xs sm:text-sm pl-1 sm:pl-2 flex items-center gap-1.5 font-sans font-medium">
              <BookOpen className="w-3.5 h-3.5 text-[#3d352e] shrink-0" />
              <span className="truncate">
                <strong className="font-bold">Ghi chú:</strong> {notes}
              </span>
            </div>
          )}

          {/* Row 5: Action Controls (Pause, Report/Dismiss, Big White Continue Button) */}
          <div className="flex items-center gap-2.5 sm:gap-3 pt-2 sm:pt-3 mt-1">
            {/* Pause / Resume Auto Countdown */}
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-2 border-white/60 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition cursor-pointer shrink-0 ${
                isPaused ? 'bg-white/30 ring-2 ring-white' : 'bg-white/10'
              }`}
              title={isPaused ? 'Tiếp tục tự động đếm ngược' : 'Tạm dừng đếm ngược'}
            >
              {isPaused ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              )}
            </button>

            {/* Close / Report Action Button */}
            <button
              type="button"
              onClick={onReport || (() => setIsCollapsed((c) => !c))}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-2 border-white/60 bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition cursor-pointer shrink-0"
              title={onReport ? 'Báo lỗi câu hỏi này' : 'Đóng xem lại'}
            >
              {isCorrect ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* Big White Continue Button with Live Countdown */}
            <button
              type="button"
              onClick={onContinue}
              className={`flex-1 py-3 sm:py-3.5 px-6 rounded-2xl bg-white shadow-lg active:translate-y-0.5 active:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-black text-base sm:text-lg ${
                isCorrect
                  ? 'text-[#16A34A] hover:bg-emerald-50'
                  : 'text-[#EF4444] hover:bg-red-50'
              }`}
            >
              <span>{isPaused ? 'Tiếp tục' : `Tiếp tục (${countdown}s)`}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
