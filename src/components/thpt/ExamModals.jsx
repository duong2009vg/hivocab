// src/components/thpt/ExamModals.jsx
// 3 modals: Confirm Submit, Results, Custom Time — Chuẩn theme HiVocab Pure React

import React, { useState } from 'react';
import {
  Send,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Sparkles,
  History,
  X,
  Calendar,
  Eye,
} from 'lucide-react';

// ============================================
// Modal xác nhận nộp bài
// ============================================
export function ExamConfirmModal({ exam, answers = {}, onConfirm, onCancel }) {
  if (!exam) return null;
  const total = exam.total_questions || 40;
  const answered = Object.keys(answers).length;
  const unans = total - answered;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#FFFDF9] rounded-3xl border-2 border-[#382E2B] shadow-[5px_6px_0px_#382E2B] w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-4 font-sans select-none">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#5a7d4d]/10 text-[#5a7d4d] border-2 border-[#5a7d4d]/30 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-[#382E2B] text-base sm:text-lg">Xác nhận nộp bài?</h3>
            <p className="text-xs font-semibold text-[#766C5F]">Bạn không thể chỉnh sửa bài thi sau khi nộp</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF5EB] border border-[#EFE8D6] space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-[#6B5A4E]">Đã hoàn thành:</span>
            <span className="font-black text-[#5a7d4d]">{answered} / {total} câu</span>
          </div>
          {unans > 0 && (
            <div className="flex justify-between items-center">
              <span className="font-semibold text-rose-600">Chưa trả lời:</span>
              <span className="font-black text-rose-600">{unans} câu</span>
            </div>
          )}
        </div>

        {unans > 0 && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-2.5 rounded-xl font-medium leading-relaxed">
            ⚠️ Còn <strong>{unans} câu</strong> bạn chưa chọn đáp án. Bạn có chắc chắn muốn nộp bài ngay bây giờ?
          </p>
        )}

        <div className="flex gap-2.5 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm text-[#766C5F] hover:text-[#382E2B] hover:bg-[#FAF5EB] border border-[#EFE8D6] transition-all font-bold cursor-pointer"
          >
            Tiếp tục làm
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white text-xs sm:text-sm font-black transition-all border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 cursor-pointer"
          >
            Nộp bài ngay
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Modal kết quả
// ============================================
export function ExamResultsModal({ results, onReview, onRetake, onExit }) {
  if (!results) return null;

  const m = Math.floor(results.timeSpentSeconds / 60);
  const s = results.timeSpentSeconds % 60;
  const scoreColor =
    results.score >= 8
      ? 'text-[#5a7d4d]'
      : results.score >= 5
      ? 'text-[#D36135]'
      : 'text-rose-600';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#FFFDF9] rounded-3xl border-2 border-[#382E2B] shadow-[6px_8px_0px_#382E2B] w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-7 space-y-4 sm:space-y-5 font-sans select-none">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#5a7d4d]/10 border-2 border-[#5a7d4d]/30 text-[#5a7d4d] flex items-center justify-center mb-2 shadow-2xs">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="font-heading font-black text-[#382E2B] text-lg sm:text-xl">Kết quả bài thi THPT</h3>
          <p className="text-xs font-semibold text-[#766C5F] truncate max-w-xs mx-auto">{results.title}</p>
        </div>

        {/* Score */}
        <div className="text-center bg-[#FAF5EB] p-4 rounded-2xl border border-[#EFE8D6]">
          <div className={`text-5xl sm:text-6xl font-black tabular-nums tracking-tight font-heading ${scoreColor}`}>
            {results.score.toFixed(2)}
          </div>
          <div className="text-xs font-black uppercase tracking-wider text-[#766C5F] mt-1">/ 10.00 điểm</div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="text-2xl font-black text-emerald-800 tabular-nums">{results.correct}</div>
            <div className="text-xs text-emerald-700 font-bold mt-0.5 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Câu đúng</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center">
            <div className="text-2xl font-black text-rose-800 tabular-nums">{results.wrong}</div>
            <div className="text-xs text-rose-700 font-bold mt-0.5 flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Câu sai</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
            <div className="text-2xl font-black text-amber-800 tabular-nums">{results.unanswered}</div>
            <div className="text-xs text-amber-700 font-bold mt-0.5 flex items-center justify-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Chưa làm</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[#5a7d4d]/10 border border-[#5a7d4d]/20 text-center">
            <div className="text-2xl font-black text-[#486b3c] tabular-nums">{m}p {s}s</div>
            <div className="text-xs text-[#486b3c] font-bold mt-0.5 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Thời gian làm</span>
            </div>
          </div>
        </div>

        {/* Percentage bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-[#6B5A4E]">
            <span>Tỷ lệ chính xác</span>
            <span className="font-black text-[#2D2422]">{results.percentage}%</span>
          </div>
          <div className="h-3 bg-[#FAF5EB] rounded-full overflow-hidden p-0.5 border border-[#EFE8D6]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                results.score >= 8
                  ? 'bg-[#5a7d4d]'
                  : results.score >= 5
                  ? 'bg-[#D36135]'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${results.percentage}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={onExit}
            className="w-full sm:flex-1 min-h-[44px] py-2.5 px-4 rounded-xl border border-[#EFE8D6] text-[#766C5F] hover:text-[#382E2B] text-xs sm:text-sm font-bold hover:bg-[#FAF5EB] transition-colors cursor-pointer flex items-center justify-center"
          >
            Thoát
          </button>
          <button
            type="button"
            onClick={onRetake}
            className="w-full sm:flex-1 min-h-[44px] py-2.5 px-4 rounded-xl border border-[#5a7d4d]/30 text-[#486b3c] hover:bg-[#5a7d4d]/10 text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm lại</span>
          </button>
          <button
            type="button"
            onClick={onReview}
            className="w-full sm:flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white text-xs sm:text-sm font-black transition-all border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Xem đáp án</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Modal tùy chỉnh thời gian thi - Cozy Crayon
// ============================================
export function ExamCustomTimeModal({
  examId,
  examTitle,
  defaultMinutes = 50,
  onStart,
  onConfirm,
  onCancel,
  onClose,
}) {
  const [selectedMinutes, setSelectedMinutes] = useState(defaultMinutes);
  const [customInput, setCustomInput] = useState('');
  const timeOptions = [20, 30, 40, 50, 60, 90, 0]; // 0 = không giới hạn

  const handleClose = onCancel || onClose || (() => {});
  const handleStart = () => {
    const customParsed = Number.parseInt(String(customInput || '').trim(), 10);
    const finalMinutes =
      customInput.trim() !== '' && Number.isFinite(customParsed) && customParsed >= 1
        ? Math.min(180, customParsed)
        : selectedMinutes;

    if (typeof onStart === 'function') {
      onStart(examId, finalMinutes);
    } else if (typeof onConfirm === 'function') {
      onConfirm(finalMinutes);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="bg-[#FFFDF9] rounded-3xl border-[3px] border-[#382E2B] shadow-[6px_8px_0px_#382E2B] w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 sm:p-7 space-y-4 sm:space-y-5 font-sans select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF3D6] text-[#D36135] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center text-xl shrink-0">
            <Clock className="w-6 h-6 text-[#D36135]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-black text-[#382E2B] text-lg">Tùy chỉnh thời gian</h3>
            <p className="text-xs font-semibold text-[#786F66] truncate">{examTitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {timeOptions.map((mins) => {
            const isSelected = customInput.trim() === '' && selectedMinutes === mins;
            return (
              <button
                key={mins}
                type="button"
                onClick={() => {
                  setCustomInput('');
                  setSelectedMinutes(mins);
                }}
                className={`py-3 px-3.5 rounded-2xl border-2 text-xs sm:text-sm font-black transition-all cursor-pointer min-h-[44px] flex flex-col items-center justify-center ${
                  isSelected
                    ? 'border-[#382E2B] bg-[#5a7d4d] text-white shadow-[2px_3px_0px_#382E2B]'
                    : 'border-[#382E2B]/30 bg-white text-[#382E2B] hover:border-[#382E2B] hover:bg-[#FAF5EB]'
                }`}
              >
                <span>{mins === 0 ? 'Không giới hạn' : `${mins} phút`}</span>
                {mins === 50 && (
                  <span
                    className={`block text-[10px] font-bold mt-0.5 ${
                      isSelected ? 'text-amber-200' : 'text-[#D36135]'
                    }`}
                  >
                    (chuẩn Bộ GD)
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <label className="block space-y-1">
          <span className="text-[11px] font-extrabold text-[#6B5A4E]">
            Hoặc tự nhập số phút mong muốn (1 – 180 phút):
          </span>
          <input
            type="number"
            min={1}
            max={180}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Ví dụ: 35"
            className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-[#382E2B]/40 focus:border-[#382E2B] text-sm font-bold text-[#382E2B] focus:outline-none"
          />
        </label>

        <div className="flex gap-2.5 justify-end pt-2 border-t-2 border-dashed border-[#EFE8D6]">
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl text-xs sm:text-sm text-[#786F66] hover:text-[#382E2B] hover:bg-[#FAF5EB] border-2 border-transparent transition-colors font-bold cursor-pointer flex items-center justify-center"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#D36135] text-white text-xs sm:text-sm font-black hover:bg-[#c2542a] transition-all border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 cursor-pointer flex items-center justify-center"
          >
            Bắt đầu thi
          </button>
        </div>
      </div>
    </div>
  );
}

function formatHistoryDuration(sec) {
  const safe = Math.max(0, Number(sec || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  if (m === 0) return `${s} giây`;
  return `${m}p ${String(s).padStart(2, '0')}s`;
}

function formatHistoryDate(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

// ============================================
// Modal Lịch sử làm bài - Cozy Crayon
// ============================================
export function ExamHistoryModal({
  examTitle,
  attempts = [],
  loading = false,
  onClose,
  onReviewAttempt,
  onRetake,
}) {
  const bestScore = attempts.reduce((max, a) => (a.score > max ? a.score : max), -1);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFDF9] rounded-3xl border-[3px] border-[#382E2B] shadow-[6px_8px_0px_#382E2B] w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b-2 border-[#EFE8D6] flex items-start justify-between gap-3 bg-[#FAF5EB]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#EEF5EC] text-[#4f7d4b] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-black text-[#382E2B] text-base sm:text-lg leading-tight">
                Lịch sử làm bài
              </h3>
              <p className="text-xs font-bold text-[#786F66] truncate mt-0.5">{examTitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng lịch sử"
            className="w-9 h-9 rounded-xl bg-white hover:bg-[#FEF3C7] border-2 border-[#382E2B] flex items-center justify-center text-[#382E2B] shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Bar */}
        {attempts.length > 0 && (
          <div className="px-5 py-3 bg-white border-b border-[#EFE8D6] flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-xl bg-[#FAF5EB] border border-[#382E2B]/25 text-xs font-black text-[#382E2B]">
              {attempts.length} lần đã làm
            </span>
            {bestScore >= 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-[#EEF5EC] border border-[#5a7d4d]/40 text-xs font-black text-[#4f7d4b]">
                Điểm cao nhất: {bestScore.toFixed(2)}/10
              </span>
            )}
          </div>
        )}

        {/* Body List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-8 h-8 border-4 border-[#5a7d4d]/30 border-t-[#5a7d4d] rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-[#786F66]">Đang tải lịch sử làm bài...</p>
            </div>
          ) : attempts.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <History className="w-9 h-9 text-[#9C8F85] mx-auto" />
              <p className="text-sm font-black text-[#382E2B]">Chưa có lịch sử làm bài cho mục này</p>
              <p className="text-xs font-semibold text-[#786F66]">
                Khi bạn hoàn thành và nộp bài, điểm số và chi tiết từng lần làm sẽ được lưu tại đây.
              </p>
            </div>
          ) : (
            attempts.map((att, index) => {
              const attemptOrder = attempts.length - index;
              const isBest = att.score === bestScore && bestScore >= 0;
              const scoreBadgeColor =
                att.score >= 8
                  ? 'bg-[#EEF5EC] text-[#355A3B] border-[#5a7d4d]/40'
                  : att.score >= 5
                    ? 'bg-[#FFF6E6] text-[#9A5B13] border-[#e5a13c]/50'
                    : 'bg-[#FDECE8] text-[#B53D2A] border-[#D96B43]/40';

              return (
                <div
                  key={att.id || `${att.submittedAt}-${index}`}
                  className="rounded-2xl bg-white border-2 border-[#382E2B]/25 hover:border-[#382E2B]/60 p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-[#382E2B]">Lần {attemptOrder}</span>
                      {isBest && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] text-[10px] font-black">
                          Cao nhất
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#786F66]">
                        <Calendar className="w-3 h-3" />
                        <span>{formatHistoryDate(att.submittedAt)}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap text-xs font-bold text-[#6B5A4E]">
                      <span className={`px-2 py-0.5 rounded-lg border font-black tabular-nums ${scoreBadgeColor}`}>
                        {att.score.toFixed(2)} điểm
                      </span>
                      <span>
                        Đúng <strong className="text-[#382E2B]">{att.correct}/{att.total}</strong> ({att.percentage}%)
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatHistoryDuration(att.timeSpentSeconds)}</span>
                      </span>
                    </div>
                  </div>

                  {att.details && typeof onReviewAttempt === 'function' && (
                    <button
                      type="button"
                      onClick={() => onReviewAttempt(att)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF5EB] hover:bg-[#FEF3C7] text-[#382E2B] text-xs font-black border-2 border-[#382E2B] shadow-[1.5px_1.5px_0px_#382E2B] cursor-pointer shrink-0 active:translate-y-0.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem lại bài</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-[#EFE8D6] bg-[#FAF5EB] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white text-xs sm:text-sm font-bold text-[#6B5A4E] border-2 border-[#382E2B]/30 hover:border-[#382E2B] cursor-pointer"
          >
            Đóng
          </button>
          {typeof onRetake === 'function' && (
            <button
              type="button"
              onClick={onRetake}
              className="px-4 py-2 rounded-xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white text-xs sm:text-sm font-black border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm lại ngay</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default {
  ExamConfirmModal,
  ExamResultsModal,
  ExamCustomTimeModal,
  ExamHistoryModal,
};
