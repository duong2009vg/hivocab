// src/components/learning/ExerciseCompleted.jsx
// Upgraded Rich Session Completion Screen — Warm Crayon Handcrafted Aesthetic
// Features: Accuracy %, Time Elapsed, XP Earned, Word Mastery Breakdown,
// Action Buttons ("Học lại từ sai", "Luyện tập tiếp", "Quay lại bài học", "Về Trang chủ"),
// and Celebration Confetti Particles.

import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, RotateCcw, ArrowLeft, Home, Zap, Clock, Target, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

function ratingLabel(w) {
  if (w.skipped) return { text: 'Bỏ qua', cls: 'bg-stone-100 text-stone-700 border border-stone-300' };
  if (w.isNew)   return { text: 'Từ mới',  cls: 'bg-blue-100 text-blue-800 border border-blue-300' };
  if (w.rating === 'easy') return { text: 'Đã nhớ kỹ', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-300' };
  if (w.rating === 'good') return { text: 'Tốt', cls: 'bg-sky-100 text-sky-800 border border-sky-300' };
  return { text: 'Cần ôn thêm', cls: 'bg-amber-100 text-amber-800 border border-amber-300' };
}

// Lightweight Celebration Confetti Particles
function ConfettiOverlay() {
  const particles = useMemo(() => {
    const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444', '#F97316'];
    return Array.from({ length: 32 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      left: `${(i * 3.1 + 2) % 96}%`,
      delay: `${(i * 0.08).toFixed(2)}s`,
      duration: `${1.8 + (i % 5) * 0.3}s`,
      size: `${6 + (i % 6) * 2}px`,
      shape: i % 3 === 0 ? 'rounded-full' : i % 3 === 1 ? 'rounded-xs rotate-45' : 'rounded-sm rotate-12',
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {particles.map((p) => (
        <span
          key={p.id}
          className={`absolute top-0 inline-block animate-confetti-drop ${p.shape}`}
          style={{
            backgroundColor: p.color,
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}

export default function ExerciseCompleted({
  completedWords = [],
  allWords = [],
  sessionStartTime = null,
  onGoHome,
  onReviewFailedWords,
  onPracticeAgain,
  onBackToLesson,
}) {
  const [durationSeconds] = useState(() => {
    if (sessionStartTime) {
      return Math.max(1, Math.round((Date.now() - sessionStartTime) / 1000));
    }
    return Math.max(15, completedWords.length * 12);
  });

  useEffect(() => {
    // Play completion fanfare sound
    if (typeof window !== 'undefined') {
      window.HiSound?.playComplete?.();
    }
  }, []);

  const totalCompleted = completedWords.length;

  // Words that were marked hard or failed during session
  const failedWords = useMemo(() => {
    return completedWords
      .filter((w) => w.rating === 'hard' || (w.failCount && w.failCount > 0))
      .map((w) => w.word)
      .filter(Boolean);
  }, [completedWords]);

  // Accuracy calculation
  const firstAttemptCorrectCount = useMemo(() => {
    return completedWords.filter(
      (w) => w.rating === 'easy' || (w.rating === 'good' && (!w.attempts || w.attempts <= 1))
    ).length;
  }, [completedWords]);

  const accuracyPct = totalCompleted > 0 ? Math.round((firstAttemptCorrectCount / totalCompleted) * 100) : 100;

  // XP calculation (+5 XP per word mastered + bonus for high accuracy)
  const xpEarned = useMemo(() => {
    return totalCompleted * 5 + Math.round((accuracyPct / 100) * 10);
  }, [totalCompleted, accuracyPct]);

  // Mastery Breakdown counts
  const easyCount = useMemo(() => completedWords.filter((w) => w.rating === 'easy').length, [completedWords]);
  const goodCount = useMemo(() => completedWords.filter((w) => w.rating === 'good').length, [completedWords]);
  const hardCount = useMemo(() => completedWords.filter((w) => w.rating === 'hard').length, [completedWords]);
  const newCount = useMemo(() => completedWords.filter((w) => w.isNew).length, [completedWords]);

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 my-auto text-center px-3 sm:px-4 py-2 sm:py-6 font-comfortaa relative select-none">
      <ConfettiOverlay />

      {/* ── Main Completion Card ── */}
      <div className="w-full max-w-xl bg-white border-[3.5px] border-[#2B2523] rounded-[32px] sm:rounded-[38px] p-5 sm:p-7 shadow-[6px_8px_0px_#2B2523] flex flex-col items-center relative z-10">
        {/* Mascot & Celebration Ribbon */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-1.5 flex items-center justify-center">
          <img
            src="/mascot/mascot_cozy.png"
            alt="Bé Hổ Churbito chúc mừng"
            className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm select-none"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <Sparkles className="w-5 h-5 absolute -top-1 -right-1 text-amber-500 animate-bounce shrink-0" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2">
          <Trophy className="w-4 h-4 text-amber-600 inline shrink-0" />
          <span>Hoàn thành xuất sắc bài học</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mb-1 font-rounded">
          Giỏi quá bạn ơi!
        </h2>
        <p className="text-stone-600 text-xs sm:text-sm font-quicksand font-semibold mb-4 max-w-sm leading-relaxed">
          Bạn đã ôn tập và củng cố thành công{' '}
          <strong className="text-[#D36135] font-black text-sm sm:text-base">{totalCompleted} từ vựng</strong>{' '}
          vào trí nhớ dài hạn.
        </p>

        {/* ── Key Metrics Grid (Accuracy %, Time Elapsed, XP Earned) ── */}
        <div className="w-full grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          {/* Metric 1: Accuracy */}
          <div className="bg-[#F1F8F4] border-2 border-[#2B2523] rounded-2xl p-2.5 sm:p-3 flex flex-col items-center shadow-[2px_2px_0px_#2B2523]">
            <Target className="w-4 h-4 text-[#15803D] mb-1" />
            <span className="text-[10px] sm:text-[11px] font-bold text-stone-600 uppercase">Chính xác</span>
            <span className="text-lg sm:text-2xl font-black text-[#15803D] font-mono">{accuracyPct}%</span>
          </div>

          {/* Metric 2: Time Elapsed */}
          <div className="bg-[#F6F8FB] border-2 border-[#2B2523] rounded-2xl p-2.5 sm:p-3 flex flex-col items-center shadow-[2px_2px_0px_#2B2523]">
            <Clock className="w-4 h-4 text-[#2563EB] mb-1" />
            <span className="text-[10px] sm:text-[11px] font-bold text-stone-600 uppercase">Thời gian</span>
            <span className="text-lg sm:text-2xl font-black text-[#2563EB] font-mono">{formatDuration(durationSeconds)}</span>
          </div>

          {/* Metric 3: XP Earned */}
          <div className="bg-[#FFF9EE] border-2 border-[#2B2523] rounded-2xl p-2.5 sm:p-3 flex flex-col items-center shadow-[2px_2px_0px_#2B2523]">
            <Zap className="w-4 h-4 text-[#D97706] mb-1" />
            <span className="text-[10px] sm:text-[11px] font-bold text-stone-600 uppercase">Điểm thưởng</span>
            <span className="text-lg sm:text-2xl font-black text-[#D97706] font-mono">+{xpEarned} XP</span>
          </div>
        </div>

        {/* ── Mastery Breakdown Pills ── */}
        <div className="w-full flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap mb-4 text-xs font-bold">
          {easyCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{easyCount} Đã nhớ kỹ</span>
            </span>
          )}
          {goodCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-100 text-sky-800 rounded-full border border-sky-300">
              <span>{goodCount} Tốt</span>
            </span>
          )}
          {hardCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{hardCount} Cần ôn thêm</span>
            </span>
          )}
          {newCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-300">
              <span>{newCount} Từ mới</span>
            </span>
          )}
        </div>

        {/* ── Word summary list ── */}
        <div className="w-full bg-[#FAF5ED] border-2 border-[#2B2523] rounded-2xl p-3 sm:p-4 text-left mb-5 max-h-52 overflow-y-auto shadow-inner select-text">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-stone-300 text-[11px] font-bold uppercase text-stone-600">
            <span>Từ vựng ({totalCompleted})</span>
            <span>Kết quả SRS</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {completedWords.map((w, i) => {
              const { text, cls } = ratingLabel(w);
              const wordText = w.word?.word || w.word?.frontWord || w.word?.answer || '—';
              const phonetic = w.word?.phonetic ? `/${w.word.phonetic}/` : '';
              return (
                <div
                  key={i}
                  className="flex items-center justify-between py-1 px-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs"
                >
                  <div className="flex items-baseline gap-2 min-w-0 pr-2">
                    <span className="font-bold text-stone-900 text-sm">{wordText}</span>
                    {phonetic && <span className="text-[11px] font-mono text-stone-400 hidden xs:inline">{phonetic}</span>}
                  </div>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold shrink-0 ${cls}`}>{text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Conditional: Học lại từ sai */}
          {failedWords.length > 0 && onReviewFailedWords && (
            <button
              type="button"
              onClick={() => onReviewFailedWords(failedWords)}
              className="w-full min-h-[48px] py-3 px-5 bg-gradient-to-r from-[#D36135] to-[#E76F51] hover:brightness-105 active:translate-y-0.5 text-white font-bold text-sm sm:text-base rounded-2xl border-2 border-[#2B2523] shadow-[2px_3px_0px_#2B2523] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>Học lại các từ cần ôn ({failedWords.length})</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {/* Luyện tập tiếp */}
            {onPracticeAgain && (
              <button
                type="button"
                onClick={onPracticeAgain}
                className="w-full min-h-[46px] py-2.5 px-3 bg-[#E8F1F5] hover:bg-[#D5E5EC] active:translate-y-0.5 text-[#2B4566] font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl border-2 border-[#2B2523] shadow-[2px_2px_0px_#2B2523] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4 shrink-0 text-[#2B4566]" />
                <span>Luyện tập lại</span>
              </button>
            )}

            {/* Quay lại bài học */}
            {onBackToLesson && (
              <button
                type="button"
                onClick={onBackToLesson}
                className="w-full min-h-[46px] py-2.5 px-3 bg-[#FAF5EB] hover:bg-[#F2ECE0] active:translate-y-0.5 text-stone-800 font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl border-2 border-[#2B2523] shadow-[2px_2px_0px_#2B2523] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <ArrowLeft className="w-4 h-4 shrink-0 text-stone-700" />
                <span>Quay lại bài học</span>
              </button>
            )}
          </div>

          {/* Về Trang chủ (Full Width Secondary/Default) */}
          <button
            type="button"
            onClick={onGoHome}
            className="w-full min-h-[48px] py-3 px-5 bg-[#2B4566] hover:bg-[#1E334D] active:translate-y-0.5 text-white font-bold text-sm sm:text-base rounded-2xl border-2 border-[#2B2523] shadow-[2px_3px_0px_#15263D] flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>Về Trang chủ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
