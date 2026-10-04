// src/components/learning/ExerciseMCQ.jsx
// 100% Pixel-Perfect match to Google Stitch design (both Desktop & Mobile)
// Multiple choice question exercise — Pure React with Pop-up Result Notification.

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
    <div className="w-full flex flex-col items-center select-none font-comfortaa">
      {/* ── Mascot Churbito Header floating right above the quiz box ── */}
      <div className="w-full max-w-xl flex justify-end items-end gap-2.5 mb-1 pr-3 mascot-float-soft">
        {/* Crayon Handcrafted Speech Cloud */}
        <div className="relative bg-white border-2 border-[#292524] px-4 py-1.5 rounded-2xl shadow-[3px_4px_0px_#292524] text-stone-800 font-crayon text-lg sm:text-xl flex items-center gap-1.5 transform -rotate-1">
          <span>cùng làm nhé!</span>
          <span className="text-stone-700">🐾</span>
          {/* Speech Bubble pointer arrow */}
          <div className="absolute -bottom-2 right-6 w-3.5 h-3.5 bg-white border-r-2 border-b-2 border-[#292524] transform rotate-45"></div>
        </div>

        {/* Churbito Tiger Mascot Miniature Sticker */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-[#FFF2DE] border-2 border-[#292524] rounded-2xl p-1 shadow-[3px_4px_0px_#292524] flex items-center justify-center rotate-3 overflow-hidden shrink-0">
          <img
            src="/mascot/mascot_cozy.png"
            alt="Bé hổ Churbito"
            className="w-full h-full object-contain mix-blend-multiply drop-shadow-xs"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* ── Main Question & Options Card ── */}
      <div className="w-full max-w-xl bg-white border-2 border-[#292524] rounded-[28px] sm:rounded-[36px] shadow-[4px_6px_0px_#292524] px-4 sm:px-8 pt-5 sm:pt-8 pb-6 sm:pb-8 relative">
        {/* Top Pin / Crayon Hole Decoration */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#E58356] border-2 border-[#292524] flex items-center justify-center shadow-xs">
          <div className="w-3 h-3 rounded-full bg-white border border-[#292524]"></div>
        </div>

        {/* Question Prompt Header */}
        <div className="text-center pt-1 pb-4">
          <p className="font-crayon text-xl sm:text-2xl text-stone-700 tracking-wide mb-1 font-semibold">
            {d.question || (
              <>
                Chọn nghĩa <span className="text-[#D36135] underline decoration-wavy decoration-stone-400">đúng</span> của
              </>
            )}
          </p>

          {/* Vocabulary Word & Audio Speaker Button (Reliable SVG) */}
          <div className="flex items-center justify-center gap-3 mt-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-stone-900 font-rounded">
              "{d.word}"
            </h1>
            <button
              type="button"
              onClick={playAudio}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#E4EFF5] hover:bg-[#D4E6F1] active:scale-95 border-2 border-[#292524] text-[#253E56] flex items-center justify-center transition shadow-sm cursor-pointer"
              title="Nghe phát âm chuẩn IPA"
            >
              <svg className="w-5 h-5 text-[#253E56]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Pronunciation guide note */}
          {(d.phonetic || d.pos) && (
            <p className="text-stone-500 font-crayon text-base sm:text-lg mt-1 tracking-wider">
              {d.phonetic ? `/${d.phonetic}/` : ''} {d.pos ? `• ${d.pos}` : ''}
            </p>
          )}
        </div>

        {/* ── Options Container (4 Answers) ── */}
        <div className="flex flex-col gap-3 sm:gap-3.5 my-3" role="radiogroup" aria-label="Đáp án trắc nghiệm">
          {(d.options || []).map((opt, idx) => {
            const isSelected = selectedIdx === idx;
            const isCorrect = idx === result?.correctIndex;
            const isWrong = isSelected && result && !result.correct;

            // Class styling based on state
            let cardClasses =
              'group relative flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer ';

            if (!result) {
              if (isSelected) {
                cardClasses +=
                  'border-[#253E56] bg-[#EBF2F7] shadow-[2px_3px_0px_#253E56] sm:shadow-[3px_4px_0px_#253E56] -translate-y-0.5 border-[2.5px]';
              } else {
                cardClasses += 'border-[#292524] bg-white hover:bg-[#FAF7EE] hover:-translate-y-0.5 shadow-xs';
              }
            } else {
              if (isCorrect) {
                cardClasses +=
                  'border-[#2E7D32] bg-[#E8F5E9] shadow-[2px_3px_0px_#2E7D32] sm:shadow-[3px_4px_0px_#2E7D32] text-[#1B5E20] font-bold border-[2.5px]';
              } else if (isWrong) {
                cardClasses +=
                  'border-[#D32F2F] bg-[#FFEBEE] shadow-[2px_3px_0px_#D32F2F] sm:shadow-[3px_4px_0px_#D32F2F] text-[#B71C1C] border-[2.5px]';
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
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {/* Number pill */}
                  <span
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg border font-bold text-xs flex items-center justify-center shrink-0 ${
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
                    className={`text-sm sm:text-lg md:text-xl font-quicksand ${
                      isSelected || isCorrect ? 'font-bold text-stone-900' : 'font-semibold text-stone-800'
                    }`}
                  >
                    {opt.text}
                  </span>
                </div>

                {/* Custom Radio Indicator */}
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
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
                    <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#253E56]"></div>
                  )}
                  {isCorrect && (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2E7D32]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {isWrong && (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D32F2F]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
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

        {/* ── Action Button: Submit & Check (Reliable SVG) ── */}
        <div className="mt-4 sm:mt-6 pt-1">
          <button
            type="button"
            onClick={handleCheck}
            disabled={selectedIdx === null || !!result}
            className={`w-full py-3 sm:py-4 px-6 font-bold rounded-2xl border-2 border-[#292524] shadow-[0px_4px_0px_#1A2C3D] flex items-center justify-center gap-3 text-base sm:text-xl transition-all duration-150 ${
              selectedIdx !== null && !result
                ? 'bg-[#253E56] hover:bg-[#1B2F42] active:translate-y-0.5 text-white cursor-pointer'
                : 'bg-stone-200 text-stone-400 border-stone-300 shadow-none cursor-not-allowed opacity-75'
            }`}
          >
            <span>Kiểm tra &amp; Tiếp tục</span>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Desktop Shortcut Helper & Crayon Note Bar ── */}
      <div className="w-full max-w-xl mt-2.5 sm:mt-3.5 flex flex-wrap items-center justify-between px-2 text-stone-500 font-crayon text-xs sm:text-base">
        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center justify-center px-2 py-0.5 bg-white border border-stone-300 rounded shadow-2xs text-xs font-sans text-stone-700 font-bold">
            1 - 4
          </span>
          <span>chọn nhanh</span>
          <span className="mx-1">•</span>
          <span className="inline-flex items-center justify-center px-2 py-0.5 bg-white border border-stone-300 rounded shadow-2xs text-xs font-sans text-stone-700 font-bold">
            Enter ↵
          </span>
          <span>xác nhận</span>
        </div>

        <div className="flex items-center gap-1.5 text-stone-600 mt-1 sm:mt-0">
          <span>💡</span>
          <span>
            {d.rootHint || (
              <>
                Từ gồm <strong>{d.word?.length || 0} ký tự</strong>
              </>
            )}
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
