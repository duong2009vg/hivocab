// src/components/bilingual/BilingualGapFillView.jsx
// Interactive Context Gap-Fill Exercise Mode in React

import React, { useState, useEffect, useRef } from 'react';
import { speakWord } from '../../utils/bilingualSoundUtils.js';

export function BilingualGapFillView({
  gapItems,
  currentGapIndex,
  onCheck,
  onHint,
  onReveal,
  onReset,
  onNext,
  onPrev,
  onGoTo,
  onSwitchTab,
}) {
  const [inputValue, setInputValue] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);

  const total = gapItems.length;
  const correctCount = gapItems.filter((it) => it.isCorrect).length;
  const progressPct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const allComplete = total > 0 && correctCount === total;

  const currentItem = gapItems[currentGapIndex] || null;

  // Sync input value when question changes or answer updates
  useEffect(() => {
    if (currentItem) {
      setInputValue(
        currentItem.userAnswer ||
          (currentItem.isCorrect || currentItem.isRevealed ? currentItem.blankWord : '')
      );
      // Focus input
      setTimeout(() => {
        if (inputRef.current && !currentItem.isCorrect) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [currentGapIndex, currentItem]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!currentItem || currentItem.isCorrect) {
      onNext(currentGapIndex);
      return;
    }

    const success = onCheck(currentGapIndex, inputValue);
    if (!success) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 700);
      if (inputRef.current) inputRef.current.select();
    }
  };

  // ──────────────────────────────────────────────
  // Completion screen
  // ──────────────────────────────────────────────
  if (allComplete) {
    return (
      <div className="max-w-2xl mx-auto w-full pb-20 fade-in select-none">
        <div className="bg-gradient-to-br from-green-500/20 via-surface to-primary/20 border-2 border-green-500/40 rounded-3xl p-8 md:p-10 text-center soft-shadow mt-6">
          <span className="text-6xl mb-4 block animate-bounce">🎉</span>
          <h3 className="text-2xl md:text-3xl font-bold text-on-surface mb-2">
            Xuất sắc! Bạn đã hoàn thành
          </h3>
          <p className="text-sm md:text-base text-on-surface-variant mb-6 max-w-md mx-auto">
            Bạn đã trả lời chính xác toàn bộ <strong>{total} / {total} câu</strong> đục lỗ trong ngữ
            cảnh bài đọc IELTS này.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onSwitchTab('reading')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:bg-surface-tint active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              <span>Đọc lại bài đọc</span>
            </button>
            <button
              type="button"
              onClick={onReset}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>Làm lại bài tập</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="text-center py-20 text-on-surface-variant max-w-md mx-auto">
        <span className="material-symbols-outlined text-[52px] opacity-30 mb-3 block">edit_note</span>
        <h3 className="font-bold text-lg text-on-surface mb-1">Chưa có bài tập đục lỗ</h3>
        <p className="text-sm">Bài đọc này hiện chưa có danh sách từ vựng trọng tâm để tạo bài tập.</p>
      </div>
    );
  }

  // Hint display calculation
  let hintDisplay = '';
  if (currentItem.hintLevel > 0) {
    const letters = currentItem.blankWord.slice(0, currentItem.hintLevel);
    const underscores = '_ '.repeat(Math.max(0, currentItem.blankWord.length - currentItem.hintLevel));
    hintDisplay = `${letters} ${underscores}`.trim();
  }

  return (
    <div className="max-w-3xl mx-auto w-full pb-20 select-none">
      {/* Header thống kê bài tập & Stepper */}
      <div className="bg-surface-container-lowest/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-outline-variant/20 rounded-2xl p-5 md:p-6 mb-6 soft-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-tertiary-container/30 text-tertiary mb-2">
              Luyện từ trong ngữ cảnh bài đọc
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-on-surface leading-tight">
              Bài tập Đục Lỗ Song Ngữ
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Điền từ còn thiếu vào câu văn IELTS gốc dựa vào gợi ý nghĩa tiếng Việt.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-on-surface-variant block">Đã hoàn thành</span>
              <span className="text-lg font-bold text-primary">
                {correctCount} / {total} câu
              </span>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="p-2 rounded-xl bg-surface-container hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              title="Làm lại tất cả"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Dải nút chọn câu hỏi nhanh (Stepper) */}
        <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[11px] font-bold text-outline uppercase tracking-wider mr-1 shrink-0">
            Câu:
          </span>
          {gapItems.map((it, i) => {
            const isCurr = i === currentGapIndex;
            const itDone = it.isCorrect;
            const itRev = it.isRevealed;

            let btnClass = '';
            if (isCurr) {
              btnClass =
                'bg-primary text-on-primary font-bold shadow-xs ring-2 ring-primary/40 ring-offset-1';
            } else if (itDone) {
              btnClass = 'bg-green-600 text-white font-bold';
            } else if (itRev) {
              btnClass = 'bg-yellow-500/20 text-yellow-800 font-semibold border border-yellow-500/40';
            } else {
              btnClass =
                'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-medium';
            }

            return (
              <button
                key={it.wordId || i}
                type="button"
                onClick={() => onGoTo(i)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer ${btnClass}`}
                title={`Chuyển đến câu ${i + 1}`}
              >
                {itDone && !isCurr ? (
                  <span className="material-symbols-outlined text-[15px]">check</span>
                ) : (
                  i + 1
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Card câu hỏi hiện tại */}
      <div
        className={`bg-surface-container-lowest/90 dark:bg-neutral-900/90 backdrop-blur-xl border rounded-2xl p-6 sm:p-8 soft-shadow transition-all fade-in ${
          currentItem.isCorrect
            ? 'border-green-500/40 bg-green-500/5'
            : currentItem.isRevealed
            ? 'border-yellow-500/40 bg-yellow-500/5'
            : 'border-outline-variant/20'
        }`}
      >
        {/* Tiêu đề câu & STT */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/15">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-8 h-8 rounded-xl text-sm font-bold flex items-center justify-center shrink-0 shadow-xs ${
                currentItem.isCorrect ? 'bg-green-600 text-white' : 'bg-primary/10 text-primary'
              }`}
            >
              {currentItem.isCorrect ? (
                <span className="material-symbols-outlined text-[18px]">check</span>
              ) : (
                currentGapIndex + 1
              )}
            </span>
            <div>
              <span className="text-xs font-bold text-outline uppercase tracking-wider block">
                Câu hỏi {currentGapIndex + 1} / {total}
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">
                Luyện từ trong ngữ cảnh
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentItem.pos && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                {currentItem.pos}
              </span>
            )}
            {currentItem.phonetic && (
              <span className="font-mono text-xs text-outline">{currentItem.phonetic}</span>
            )}
            <button
              type="button"
              onClick={() => speakWord(currentItem.targetWord)}
              className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95 cursor-pointer"
              title="Nghe phát âm"
            >
              <span className="material-symbols-outlined text-[20px]">volume_up</span>
            </button>
          </div>
        </div>

        {/* Form nhập câu trả lời */}
        <form onSubmit={handleSubmit}>
          {/* Câu văn tiếng Anh có ô trống */}
          <div className="text-on-surface text-lg sm:text-xl leading-relaxed my-6 font-normal">
            <span>{currentItem.sentenceBefore}</span>

            <span className="inline-block align-baseline mx-1.5">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                disabled={currentItem.isCorrect}
                onChange={(e) => setInputValue(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                className={`px-3.5 py-1.5 rounded-xl text-center font-bold text-base sm:text-xl border-2 transition-all outline-none ${
                  currentItem.isCorrect
                    ? 'border-green-600 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                    : currentItem.isRevealed
                    ? 'border-yellow-500 bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200'
                    : 'border-primary/40 bg-surface-container-low focus:border-primary focus:bg-surface text-on-surface focus:shadow-md'
                } ${isShaking ? 'border-error animate-pulse' : ''}`}
                style={{
                  minWidth: `${Math.max(110, currentItem.blankWord.length * 15)}px`,
                  maxWidth: '260px',
                }}
                placeholder={hintDisplay || '...'}
              />
            </span>

            <span>{currentItem.sentenceAfter}</span>
          </div>

          {/* Gợi ý nghĩa tiếng Việt */}
          <div className="bg-surface-container-low/70 rounded-xl p-4 mb-6 flex items-start gap-2.5 text-xs sm:text-sm border border-outline-variant/20">
            <span className="material-symbols-outlined text-[20px] text-tertiary shrink-0 mt-0.5">
              lightbulb
            </span>
            <div>
              <span className="text-outline font-semibold">Gợi ý nghĩa:</span>
              <span className="font-bold text-on-surface ml-1">{currentItem.meaning}</span>
              {hintDisplay && (
                <span className="block mt-1.5 text-xs text-primary font-mono font-bold">
                  Ký tự gợi ý: {hintDisplay}
                </span>
              )}
            </div>
          </div>

          {/* Feedback khi làm đúng */}
          {currentItem.isCorrect && (
            <div className="mb-5 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 flex items-center justify-between text-xs sm:text-sm font-bold fade-in">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>
                  Chính xác! Từ cần điền là: <strong>{currentItem.blankWord}</strong>
                </span>
              </span>
              <button
                type="button"
                onClick={() => onNext(currentGapIndex)}
                className="px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Câu tiếp</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-outline-variant/15 flex-wrap">
            {/* Trái: Gợi ý và Đáp án */}
            <div className="flex items-center gap-2">
              {!currentItem.isCorrect && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onHint(currentGapIndex);
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-primary/10 text-on-surface-variant hover:text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors border border-outline-variant/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">tips_and_updates</span>
                    <span>
                      Gợi ý ({currentItem.hintLevel}/{currentItem.blankWord.length})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onReveal(currentGapIndex)}
                    className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs font-semibold flex items-center gap-1.5 transition-colors border border-outline-variant/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span>Xem đáp án</span>
                  </button>
                </>
              )}
            </div>

            {/* Phải: Điều hướng trước/sau và Kiểm tra */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPrev(currentGapIndex)}
                disabled={currentGapIndex === 0}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                  currentGapIndex === 0
                    ? 'opacity-40 cursor-not-allowed text-outline'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant active:scale-95 cursor-pointer'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Câu trước</span>
              </button>

              {!currentItem.isCorrect ? (
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm hover:bg-surface-tint active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Kiểm tra</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNext(currentGapIndex)}
                  className="px-6 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm hover:bg-surface-tint active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Tiếp tục</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BilingualGapFillView;
