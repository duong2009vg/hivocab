// src/components/thpt/ExamCard.jsx
// Card hiển thị một đề thi THPT - Phong cách Cozy Crayon ấm áp (Sáp màu & Giấy thủ công)
// Hỗ trợ nhận diện cờ is_pro, hiển thị huy hiệu ổ khóa sáp màu và mở PricingModal khi chưa là PRO

import React from 'react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import { Lock, Crown, FileQuestion, Clock, Check } from 'lucide-react';

const LEVEL_COLORS = {
  easy:   { bg: 'bg-[#eaf4e8]', text: 'text-[#4f7d4b]', border: 'border-[#6e9b6a]', label: 'Cơ bản' },
  medium: { bg: 'bg-[#fff6e6]', text: 'text-[#b87c24]', border: 'border-[#e5a13c]', label: 'Trung bình' },
  hard:   { bg: 'bg-[#ffece4]', text: 'text-[#cf4f23]', border: 'border-[#ea7349]', label: 'Nâng cao' },
};

export function ExamCard({ exam, is_pro, bestScore, onStart, onCustomTime }) {
  const { isPro } = useAuth();
  const { openModal } = useModal();

  const isExamPro = is_pro !== undefined ? Boolean(is_pro) : Boolean(exam?.is_pro);
  const isLocked = isExamPro && !isPro;

  const level = LEVEL_COLORS[exam?.difficulty] || LEVEL_COLORS.medium;
  const hasScore = bestScore && typeof bestScore.score === 'number';
  const scoreColor = hasScore
    ? (bestScore.score >= 8 ? 'text-[#4f7d4b]' : bestScore.score >= 5 ? 'text-[#b87c24]' : 'text-[#cf4f23]')
    : '';

  const handleOpenPricing = () => {
    openModal('pricingModal', { defaultPlanId: 'pro_6m' });
  };

  const handleCardClick = (e) => {
    if (isLocked) {
      e.stopPropagation();
      handleOpenPricing();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-[#FFFDF9] rounded-3xl border-2 border-[#382E2B] shadow-[3px_4px_0px_#382E2B] hover:shadow-[5px_6px_0px_#382E2B] hover:-translate-y-0.5 transition-all p-5 sm:p-6 flex flex-col justify-between group relative overflow-hidden select-none ${
        isLocked ? 'cursor-pointer ring-1 ring-amber-500/20' : ''
      }`}
    >
      {/* Top Header Tags */}
      <div>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {exam.year && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#EFE8D6] text-[#4A3E39] border border-[#382E2B]/40 whitespace-nowrap">
                Năm {exam.year}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full border whitespace-nowrap ${level.bg} ${level.text} ${level.border}`}>
              {level.label}
            </span>

            {/* PRO Badge / Lock Badge */}
            {isExamPro && !isPro && (
              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-[#382E2B] bg-[#FFE8C2] text-[#8C5311] shadow-[1.5px_1.5px_0px_#382E2B] rotate-[2deg] whitespace-nowrap">
                <Lock className="w-3 h-3 text-[#8C5311] shrink-0" />
                <span>Gói PRO</span>
              </span>
            )}

            {isExamPro && isPro && (
              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-[#382E2B] bg-[#FFF5E6] text-[#B87C24] shadow-[1.5px_1.5px_0px_#382E2B] whitespace-nowrap">
                <Crown className="w-3 h-3 text-[#B87C24] shrink-0" />
                <span>PRO</span>
              </span>
            )}
          </div>

          {hasScore && (
            <div className={`shrink-0 text-right ${scoreColor} bg-[#FAF3E7] px-2.5 py-1 rounded-xl border border-[#382E2B]/30 shadow-2xs`}>
              <div className="text-base font-black tabular-nums leading-none">{bestScore.score.toFixed(2)}</div>
              <div className="text-[9px] font-black uppercase tracking-wider opacity-80 mt-0.5">Điểm cao nhất</div>
            </div>
          )}
        </div>

        {/* Exam Title */}
        <h3 className="font-heading font-black text-base sm:text-lg text-[#382E2B] group-hover:text-[#D36135] transition-colors leading-snug line-clamp-2 mt-1">
          {exam.title}
        </h3>

        {/* Specs row */}
        <div className="flex items-center gap-2.5 flex-wrap mt-3.5 pt-3 border-t-2 border-dashed border-[#EFE8D6] text-xs font-bold text-[#6B5A4E]">
          <span className="inline-flex items-center gap-1">
            <FileQuestion className="w-3.5 h-3.5 text-[#6B5A4E] shrink-0" />
            <span>{exam.total_questions || 40} câu</span>
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#6B5A4E] shrink-0" />
            <span>{exam.duration_minutes || exam.time_limit || 50} phút</span>
          </span>
          {hasScore && (
            <>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-[#4f7d4b]">
                <Check className="w-3.5 h-3.5 text-[#4f7d4b] shrink-0" />
                <span>{bestScore.correct}/{exam.total_questions || 40} đúng</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2.5 pt-4 mt-2">
        {isLocked ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPricing();
              }}
              className="flex-1 py-2.5 px-4 rounded-2xl bg-[#D96C4D] hover:bg-[#C85A3F] text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 cursor-pointer"
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>Mở Khóa PRO</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPricing();
              }}
              className="w-10 h-10 rounded-2xl bg-[#FFF8EE] hover:bg-[#F3E7D5] text-[#382E2B] border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 transition-all flex items-center justify-center cursor-pointer shrink-0 opacity-80"
              title="Đề thi yêu cầu gói PRO"
            >
              <Lock className="w-4 h-4 text-[#382E2B] shrink-0" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStart(exam.id, exam.duration_minutes || exam.time_limit || 50);
              }}
              className="flex-1 py-2.5 px-4 rounded-2xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Vào thi ngay</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCustomTime(exam.id, exam.title);
              }}
              className="w-10 h-10 rounded-2xl bg-[#FFF8EE] hover:bg-[#F3E7D5] text-[#382E2B] border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 transition-all flex items-center justify-center cursor-pointer shrink-0"
              title="Chọn thời gian làm bài tùy chỉnh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ExamCard;
