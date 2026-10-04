// src/components/learning/ExerciseMCQ.jsx
// Cozy Crayon Handcrafted Multiple Choice - Centered & Fit Screen Perfectly
import React, { useState, useEffect, useCallback } from 'react';
import ExerciseResultModal from './ExerciseResultModal.jsx';

export default function ExerciseMCQ({ item, onSubmit, onReport, sessionInfo }) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [result, setResult] = useState(null); // { correct, correctIndex }
  const [showResultModal, setShowResultModal] = useState(false);
  const d = item?.exerciseData || {};

  const currentNum = sessionInfo?.currentNum ?? 1;
  const totalNum = sessionInfo?.totalNum ?? 10;

  // Reset when new item
  useEffect(() => {
    setSelectedIdx(null);
    setResult(null);
    setShowResultModal(false);
  }, [item]);

  // Keyboard: 1-4 select, Enter = check
  useEffect(() => {
    function handleKey(e) {
      if (showResultModal) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= (d.options?.length || 4)) {
        e.preventDefault();
        setSelectedIdx(num - 1);
      }
      if (e.key === 'Enter' && selectedIdx !== null && !result) {
        e.preventDefault();
        handleCheck();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIdx, result, d.options, showResultModal]);

  const handleSelect = useCallback(
    (idx) => {
      if (result) return;
      setSelectedIdx(idx);
    },
    [result]
  );

  const handleCheck = useCallback(() => {
    if (result || selectedIdx === null) return;
    const correctIndex = d.options?.findIndex((o) => o.isCorrect) ?? -1;
    const r = onSubmit(selectedIdx);
    setResult({ ...r, correctIndex });
    setShowResultModal(true);
  }, [result, selectedIdx, d.options, onSubmit]);

  const handleModalContinue = useCallback(() => {
    setShowResultModal(false);
    setSelectedIdx(null);
    setResult(null);
  }, []);

  const playAudio = useCallback(() => {
    const word = d.word || '';
    if (!word) return;
    if (window.HiAudio?.playWord) {
      window.HiAudio.playWord(word, 0.9);
    } else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    }
  }, [d.word]);

  const chosenOption = selectedIdx !== null ? d.options?.[selectedIdx]?.text : '';
  const correctOption = result?.correctIndex !== undefined && result.correctIndex >= 0
    ? d.options?.[result.correctIndex]?.text
    : '';

  return (
    <div className="w-full flex flex-col items-center justify-center select-none font-comfortaa my-auto px-2">
      {/* ── Main Question & Options Card (Compact, Centered & Fit Viewport) ── */}
      <div className="w-full max-w-lg bg-white border-[3px] border-[#292524] rounded-[24px] sm:rounded-[30px] shadow-[4px_6px_0px_#292524] px-4 sm:px-6 pt-4 sm:pt-5 pb-4 sm:pb-6 relative my-auto">
        {/* Top Little Tiger Badge Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-stone-100">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF5EB] border border-[#E76F51]/40 text-[#D36135] text-[11px] sm:text-xs font-bold">
            <span className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center">
              <img
                src="/mascot/mascot_cozy.png"
                alt="Bé hổ"
                className="w-full h-full object-contain mix-blend-multiply"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </span>
            <span>Bé Hổ nhắc: Chọn đáp án đúng nhé 🐾</span>
          </div>

          {onReport && (
            <button
              type="button"
              onClick={onReport}
              className="text-stone-400 hover:text-stone-700 text-xs transition cursor-pointer p-1"
              title="Báo cáo lỗi câu này"
            >
              ⚠️ Báo lỗi
            </button>
          )}
        </div>

        {/* Question Prompt Header */}
        <div className="text-center pt-0.5 pb-2">
          <p className="font-crayon text-base sm:text-lg text-stone-600 tracking-wide font-semibold">
            {d.question || (
              <>
                Chọn nghĩa <span className="text-[#D36135] underline decoration-wavy decoration-stone-400">đúng</span> của
              </>
            )}
          </p>

          {/* Vocabulary Word & Audio Speaker Button */}
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-stone-900 font-rounded">
              "{d.word}"
            </h1>
            <button
              type="button"
              onClick={playAudio}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E4EFF5] hover:bg-[#D4E6F1] active:scale-95 border-2 border-[#292524] text-[#253E56] flex items-center justify-center transition shadow-2xs cursor-pointer shrink-0"
              title="Nghe phát âm chuẩn IPA"
            >
              <svg className="w-4 h-4 text-[#253E56]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Pronunciation guide note */}
          {(d.phonetic || d.pos) && (
            <p className="text-stone-500 font-crayon text-xs sm:text-sm mt-0.5 tracking-wider">
              {d.phonetic ? `/${d.phonetic}/` : ''} {d.pos ? `• ${d.pos}` : ''}
            </p>
          )}
        </div>

        {/* ── Options Container (4 Answers - Compact & Clean) ── */}
        <div className="flex flex-col gap-2 sm:gap-2.5 my-2" role="radiogroup" aria-label="Đáp án trắc nghiệm">
          {(d.options || []).map((opt, idx) => {
            const isSelected = selectedIdx === idx;
            const isCorrect = idx === result?.correctIndex;
            const isWrong = isSelected && result && !result.correct;

            // Class styling based on state
            let cardClasses =
              'group relative flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 transition-all cursor-pointer ';

            if (!result) {
              if (isSelected) {
                cardClasses +=
                  'border-[#253E56] bg-[#EBF2F7] shadow-[1.5px_2px_0px_#253E56] -translate-y-0.5 border-[2.5px]';
              } else {
                cardClasses += 'border-[#292524] bg-white hover:bg-[#FAF7EE] hover:-translate-y-0.5 shadow-2xs';
              }
            } else {
              if (isCorrect) {
                cardClasses +=
                  'border-[#2E7D32] bg-[#E8F5E9] shadow-[1.5px_2px_0px_#2E7D32] text-[#1B5E20] font-bold border-[2.5px]';
              } else if (isWrong) {
                cardClasses +=
                  'border-[#D32F2F] bg-[#FFEBEE] shadow-[1.5px_2px_0px_#D32F2F] text-[#B71C1C] border-[2.5px]';
              } else {
                cardClasses += 'border-[#292524]/40 bg-stone-50 opacity-60';
              }
            }

            return (
              <label
                key={idx}
                onClick={() => handleSelect(idx)}
                className={cardClasses}
              >
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
                  {/* Number pill */}
                  <span
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border font-bold text-xs flex items-center justify-center shrink-0 ${
                      isSelected && !result
                        ? 'bg-[#253E56] text-white border-[#253E56]'
                        : isCorrect
                        ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                        : isWrong
                        ? 'bg-[#D32F2F] text-white border-[#D32F2F]'
                        : 'bg-stone-100 border-stone-300 text-stone-500 group-hover:border-stone-800'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  {/* Option text */}
                  <span
                    className={`text-xs sm:text-base font-quicksand truncate ${
                      isSelected || isCorrect ? 'font-bold text-stone-900' : 'font-semibold text-stone-800'
                    }`}
                  >
                    {opt.text}
                  </span>
                </div>

                {/* Custom Radio Indicator */}
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                    isSelected && !result
                      ? 'border-[#253E56] bg-white'
                      : isCorrect
                      ? 'border-[#2E7D32] bg-white text-[#2E7D32]'
                      : isWrong
                      ? 'border-[#D32F2F] bg-white text-[#D32F2F]'
                      : 'border-stone-400 group-hover:border-stone-700'
                  }`}
                >
                  {isSelected && !result && (
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#253E56]"></div>
                  )}
                  {isCorrect && (
                    <svg className="w-3 h-3 text-[#2E7D32]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {isWrong && (
                    <svg className="w-3 h-3 text-[#D32F2F]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <input
                    type="radio"
                    name="vocab_answer"
                    value={idx}
                    checked={isSelected}
                    onChange={() => handleSelect(idx)}
                    className="sr-only"
                    disabled={!!result}
                  />
                </div>
              </label>
            );
          })}
        </div>

        {/* ── Action Button: Submit & Check ── */}
        <div className="mt-3 pt-1">
          <button
            type="button"
            onClick={handleCheck}
            disabled={selectedIdx === null || !!result}
            className={`w-full py-2.5 sm:py-3 px-5 font-bold rounded-xl sm:rounded-2xl border-2 border-[#292524] shadow-[0px_3px_0px_#1A2C3D] flex items-center justify-center gap-2 text-sm sm:text-base transition-all duration-150 ${
              selectedIdx !== null && !result
                ? 'bg-[#253E56] hover:bg-[#1B2F42] active:translate-y-0.5 text-white cursor-pointer'
                : 'bg-stone-200 text-stone-400 border-stone-300 shadow-none cursor-not-allowed opacity-75'
            }`}
          >
            <span>Kiểm tra &amp; Tiếp tục</span>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Desktop Shortcut Helper ── */}
      <div className="w-full max-w-lg mt-2 flex items-center justify-between px-2 text-stone-500 font-crayon text-xs">
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="px-1.5 py-0.2 bg-white border border-stone-300 rounded text-[11px] font-sans text-stone-700 font-bold">
            1 - 4
          </span>
          <span>chọn nhanh</span>
          <span className="mx-1">•</span>
          <span className="px-1.5 py-0.2 bg-white border border-stone-300 rounded text-[11px] font-sans text-stone-700 font-bold">
            Enter ↵
          </span>
          <span>xác nhận</span>
        </div>

        <div className="flex items-center gap-1 text-stone-600 ml-auto">
          <span>💡</span>
          <span>
            {d.rootHint || `Từ gồm ${d.word?.length || 0} ký tự`}
          </span>
        </div>
      </div>

      {/* ── Pop-up Result Notification Modal ── */}
      <ExerciseResultModal
        isOpen={showResultModal}
        isCorrect={!!result?.correct}
        word={d.word}
        phonetic={d.phonetic}
        meaning={correctOption || d.meaning}
        userAnswer={chosenOption}
        onContinue={handleModalContinue}
      />
    </div>
  );
}
