// src/components/bilingual/BilingualGapFillView.jsx
// Chế độ Đục Lỗ Song Ngữ Trong Ngữ Cảnh - Phong cách Cozy Crayon ấm áp

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
        <div className="bg-[#FFFDF9] border-[3.5px] border-[#382E2B] rounded-3xl p-8 md:p-10 text-center shadow-[6px_8px_0px_#382E2B] mt-6 relative overflow-hidden">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FFF3D6] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center text-4xl mb-4 animate-bounce">
            🎉
          </div>
          <h3 className="text-2xl md:text-3xl font-heading font-black text-[#382E2B] mb-2">
            Xuất sắc! Bạn đã hoàn thành!
          </h3>
          <p className="text-sm md:text-base text-[#766C5F] font-semibold mb-6 max-w-md mx-auto">
            Bạn đã trả lời chính xác toàn bộ <strong className="text-[#5a7d4d]">{total} / {total} câu</strong> đục lỗ trong ngữ cảnh bài đọc IELTS này. 🐾
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onSwitchTab('reading')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-sm border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>📖</span>
              <span>Đọc lại toàn bài</span>
            </button>
            <button
              type="button"
              onClick={onReset}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#382E2B] font-black text-sm border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🔄</span>
              <span>Làm lại bài tập</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="text-center py-20 text-[#766C5F] max-w-md mx-auto bg-[#FFFDF9] rounded-3xl border-2 border-[#382E2B] p-8 shadow-[3px_4px_0px_#382E2B]">
        <span className="text-4xl mb-3 block">✏️</span>
        <h3 className="font-heading font-black text-lg text-[#382E2B] mb-1">Chưa có bài tập đục lỗ</h3>
        <p className="text-xs font-semibold text-[#766C5F]">Bài đọc này hiện chưa có danh sách từ vựng trọng tâm để tạo bài tập.</p>
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
      <div className="bg-[#FFFDF9] rounded-3xl border-2 border-[#382E2B] shadow-[3px_4px_0px_#382E2B] p-5 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase bg-[#FFF3D6] text-[#B87C24] border border-[#E5A13C] mb-2">
              Luyện từ trong ngữ cảnh bài đọc
            </span>
            <h2 className="text-xl md:text-2xl font-heading font-black text-[#382E2B] leading-tight">
              Bài tập Đục Lỗ Song Ngữ ✏️
            </h2>
            <p className="text-xs font-semibold text-[#766C5F] mt-1">
              Điền từ còn thiếu vào câu văn IELTS gốc dựa vào gợi ý nghĩa tiếng Việt.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-semibold text-[#766C5F] block">Đã hoàn thành</span>
              <span className="text-lg font-black text-[#5a7d4d]">
                {correctCount} / {total} câu
              </span>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="w-10 h-10 rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#382E2B] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center transition-all cursor-pointer active:translate-y-0.5"
              title="Làm lại tất cả"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-[#EFE8D6] rounded-full h-3 border border-[#382E2B] p-0.5 overflow-hidden">
            <div
              className="bg-[#5a7d4d] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Dải nút chọn câu hỏi nhanh (Stepper) */}
        <div className="mt-4 pt-3 border-t-2 border-dashed border-[#EFE8D6] flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
          <span className="text-xs font-black text-[#766C5F] uppercase mr-1 shrink-0">
            Câu:
          </span>
          {gapItems.map((it, i) => {
            const isCurr = i === currentGapIndex;
            const itDone = it.isCorrect;
            const itRev = it.isRevealed;

            let btnClass = '';
            if (isCurr) {
              btnClass = 'bg-[#382E2B] text-white font-black border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B]';
            } else if (itDone) {
              btnClass = 'bg-[#E5EFE2] text-[#4F7D4B] font-black border-2 border-[#8FB383]';
            } else if (itRev) {
              btnClass = 'bg-[#FFF3D6] text-[#B87C24] font-black border-2 border-[#E5A13C]';
            } else {
              btnClass = 'bg-white text-[#382E2B] font-bold border-2 border-[#382E2B]/30 hover:border-[#382E2B]';
            }

            return (
              <button
                key={it.wordId || i}
                type="button"
                onClick={() => onGoTo(i)}
                className={`w-8 h-8 rounded-xl text-xs flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer ${btnClass}`}
                title={`Chuyển đến câu ${i + 1}`}
              >
                {itDone && !isCurr ? '✓' : i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Card câu hỏi hiện tại */}
      <div
        className={`bg-[#FFFDF9] rounded-3xl border-2 border-[#382E2B] p-6 sm:p-8 shadow-[4px_5px_0px_#382E2B] transition-all ${
          currentItem.isCorrect
            ? 'bg-[#F9FCF8]'
            : currentItem.isRevealed
            ? 'bg-[#FFFDF5]'
            : ''
        }`}
      >
        {/* Tiêu đề câu & STT */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-dashed border-[#EFE8D6]">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-9 h-9 rounded-2xl text-sm font-black flex items-center justify-center shrink-0 border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] ${
                currentItem.isCorrect ? 'bg-[#5a7d4d] text-white' : 'bg-[#FFF3D6] text-[#D36135]'
              }`}
            >
              {currentItem.isCorrect ? '✓' : currentGapIndex + 1}
            </span>
            <div>
              <span className="text-xs font-black text-[#766C5F] uppercase tracking-wider block">
                Câu hỏi {currentGapIndex + 1} / {total}
              </span>
              <span className="text-[11px] text-[#9C8F85] font-semibold">
                Luyện từ trong ngữ cảnh
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentItem.pos && (
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#FAF5EB] text-[#766C5F] border border-[#382E2B]/30">
                {currentItem.pos}
              </span>
            )}
            {currentItem.phonetic && (
              <span className="font-mono text-xs text-[#766C5F] font-semibold">{currentItem.phonetic}</span>
            )}
            <button
              type="button"
              onClick={() => speakWord(currentItem.targetWord)}
              className="w-8 h-8 rounded-xl bg-[#FFF8EE] border border-[#382E2B]/40 hover:border-[#382E2B] text-[#382E2B] flex items-center justify-center transition-all cursor-pointer active:scale-95 text-sm"
              title="Nghe phát âm"
            >
              🔊
            </button>
          </div>
        </div>

        {/* Form nhập câu trả lời */}
        <form onSubmit={handleSubmit}>
          {/* Câu văn tiếng Anh có ô trống */}
          <div className="text-[#382E2B] text-base sm:text-lg leading-loose my-6 font-medium">
            <span>{currentItem.sentenceBefore}</span>

            <span className="inline-block align-baseline mx-2">
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
                className={`px-4 py-1.5 rounded-2xl text-center font-black text-base sm:text-lg border-2 transition-all outline-none ${
                  currentItem.isCorrect
                    ? 'border-[#5a7d4d] bg-[#E5EFE2] text-[#4F7D4B] shadow-xs'
                    : currentItem.isRevealed
                    ? 'border-[#E5A13C] bg-[#FFF8EE] text-[#B87C24] shadow-xs'
                    : 'border-[#382E2B] bg-white text-[#382E2B] shadow-[2px_2px_0px_#382E2B] focus:border-[#D36135]'
                } ${isShaking ? 'border-[#C85A3F] animate-pulse' : ''}`}
                style={{
                  minWidth: `${Math.max(120, currentItem.blankWord.length * 16)}px`,
                  maxWidth: '280px',
                }}
                placeholder={hintDisplay || '...'}
              />
            </span>

            <span>{currentItem.sentenceAfter}</span>
          </div>

          {/* Gợi ý nghĩa tiếng Việt */}
          <div className="bg-[#FFF8EE] rounded-2xl p-4 mb-6 flex items-start gap-2.5 text-xs sm:text-sm border-2 border-dashed border-[#E5A13C]">
            <span className="text-lg shrink-0 select-none">💡</span>
            <div>
              <span className="text-[#766C5F] font-bold">Gợi ý nghĩa:</span>
              <span className="font-black text-[#382E2B] ml-1.5">{currentItem.meaning}</span>
              {hintDisplay && (
                <span className="block mt-1 text-xs text-[#D36135] font-mono font-black">
                  Ký tự gợi ý: {hintDisplay}
                </span>
              )}
            </div>
          </div>

          {/* Feedback khi làm đúng */}
          {currentItem.isCorrect && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#E5EFE2] border-2 border-[#8FB383] text-[#4F7D4B] flex items-center justify-between text-xs sm:text-sm font-black fade-in shadow-2xs">
              <span className="flex items-center gap-2">
                <span>🎉</span>
                <span>
                  Chính xác! Từ cần điền là: <strong className="underline">{currentItem.blankWord}</strong>
                </span>
              </span>
              <button
                type="button"
                onClick={() => onNext(currentGapIndex)}
                className="px-3.5 py-1.5 rounded-xl bg-[#5a7d4d] text-white hover:bg-[#4d6d41] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Câu tiếp ➔</span>
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t-2 border-dashed border-[#EFE8D6] flex-wrap">
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
                    className="px-3.5 py-2 rounded-2xl bg-[#FFF3D6] hover:bg-[#FFE5B4] text-[#B87C24] text-xs font-black flex items-center gap-1.5 transition-all border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 cursor-pointer"
                  >
                    <span>💡 Gợi ý ({currentItem.hintLevel}/{currentItem.blankWord.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onReveal(currentGapIndex)}
                    className="px-3.5 py-2 rounded-2xl bg-[#FAF5EB] hover:bg-[#F3E7D5] text-[#766C5F] text-xs font-black flex items-center gap-1.5 transition-all border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 cursor-pointer"
                  >
                    <span>👁️ Xem đáp án</span>
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
                className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1 transition-all ${
                  currentGapIndex === 0
                    ? 'opacity-40 cursor-not-allowed text-[#9C8F85] border-2 border-[#382E2B]/20'
                    : 'bg-white hover:bg-[#FAF5EB] text-[#382E2B] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 cursor-pointer'
                }`}
              >
                <span>← Câu trước</span>
              </button>

              {!currentItem.isCorrect ? (
                <button
                  type="submit"
                  className="px-6 py-2 rounded-2xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-xs sm:text-sm active:translate-y-0.5 transition-all border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Kiểm tra ➔</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNext(currentGapIndex)}
                  className="px-6 py-2 rounded-2xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-xs sm:text-sm active:translate-y-0.5 transition-all border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Tiếp tục ➔</span>
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
