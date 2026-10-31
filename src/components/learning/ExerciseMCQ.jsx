// src/components/learning/ExerciseMCQ.jsx
// Instant selection MCQ: Tap any option to immediately check & trigger modern Bottom Sheet result notification.
// No extra "Kiểm tra & Tiếp tục" button needed for MCQ.

import React, { useState, useEffect, useCallback } from 'react';
import ExerciseResultModal from './ExerciseResultModal.jsx';

export default function ExerciseMCQ({ item, onSubmit, onNext, onReport, sessionInfo }) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [result, setResult] = useState(null); // { correct, correctIndex }
  const [showResultModal, setShowResultModal] = useState(false);
  const d = item?.exerciseData || {};

  const currentNum = sessionInfo?.currentNum ?? 1;
  const totalNum = sessionInfo?.totalNum ?? 10;

  // Reset when new item appears
  useEffect(() => {
    setSelectedIdx(null);
    setResult(null);
    setShowResultModal(false);
  }, [item?.word?.id || item?.word?.wordId, currentNum]);

  // Instant Check on Option Click
  const handleSelect = useCallback(
    (idx) => {
      if (result !== null) return; // Prevent double taps
      setSelectedIdx(idx);
      const correctIndex = d.options?.findIndex((o) => o.isCorrect) ?? -1;
      const r = onSubmit(idx);
      setResult({ ...r, correctIndex });
      setShowResultModal(true);
    },
    [result, d.options, onSubmit]
  );

  // Keyboard shortcut: 1-4 immediately selects & checks that option
  useEffect(() => {
    function handleKey(e) {
      if (showResultModal || result !== null) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= (d.options?.length || 4)) {
        e.preventDefault();
        handleSelect(num - 1);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showResultModal, result, d.options, handleSelect]);

  const handleModalContinue = useCallback(() => {
    setShowResultModal(false);
    setSelectedIdx(null);
    setResult(null);
    onNext?.();
  }, [onNext]);

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
  const correctOption =
    result?.correctIndex !== undefined && result.correctIndex >= 0
      ? d.options?.[result.correctIndex]?.text
      : '';

  return (
    <div className="w-full flex flex-col items-center justify-center select-none font-comfortaa my-auto px-2">
      {/* ── Main Question & Options Card ── */}
      <div className="w-full max-w-lg bg-white border-[3px] border-[#292524] rounded-[24px] sm:rounded-[30px] shadow-[4px_6px_0px_#292524] px-4 sm:px-6 pt-4 sm:pt-5 pb-5 sm:pb-6 relative my-auto">
        {/* Top Little Tiger Badge Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-stone-100">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF5EB] border border-[#E76F51]/40 text-[#D36135] text-[11px] sm:text-xs font-bold">
            <span className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center">
              <img
                src="/mascot/mascot_cozy.png"
                alt="Bé hổ"
                className="w-full h-full object-contain mix-blend-multiply"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </span>
            <span>Bé Hổ nhắc: Nhấn chọn đáp án đúng nhé</span>
          </div>

          {onReport && (
            <button
              type="button"
              onClick={onReport}
              className="text-stone-400 hover:text-stone-700 text-xs transition cursor-pointer p-1"
              title="Báo cáo lỗi câu này"
            >
              <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Báo lỗi</span>
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

        {/* ── Options Container (Instant Tap) ── */}
        <div className="flex flex-col gap-2.5 sm:gap-3 my-2" role="radiogroup" aria-label="Đáp án trắc nghiệm">
          {(d.options || []).map((opt, idx) => {
            const isSelected = selectedIdx === idx;
            const isCorrect = idx === result?.correctIndex;
            const isWrong = isSelected && result && !result.correct;

            // Class styling based on state matching reference screenshots
            let cardClasses =
              'group relative flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl border-2 transition-all cursor-pointer select-none ';

            if (!result) {
              cardClasses +=
                'border-[#292524] bg-white hover:bg-[#FAF7EE] hover:-translate-y-0.5 shadow-2xs active:scale-[0.99]';
            } else {
              if (isCorrect) {
                // Green matching Screenshot 1
                cardClasses +=
                  'border-[#16A34A] bg-[#DCFCE7] text-[#15803D] font-bold shadow-[2px_3px_0px_#16A34A] border-[2.5px] scale-[1.01]';
              } else if (isWrong) {
                // Red matching Screenshot 2
                cardClasses +=
                  'border-[#EF4444] bg-[#FEE2E2] text-[#B91C1C] font-bold shadow-[2px_3px_0px_#EF4444] border-[2.5px]';
              } else {
                cardClasses += 'border-stone-200 bg-stone-50 opacity-50';
              }
            }

            return (
              <div
                key={idx}
                onClick={() => handleSelect(idx)}
                className={cardClasses}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                  {/* Number circular badge */}
                  <span
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 font-black text-xs flex items-center justify-center shrink-0 transition-colors ${
                      isCorrect
                        ? 'bg-[#16A34A] text-white border-[#16A34A]'
                        : isWrong
                        ? 'bg-[#EF4444] text-white border-[#EF4444]'
                        : 'bg-stone-100 border-stone-300 text-stone-600 group-hover:border-stone-700'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {/* Option text */}
                  <span
                    className={`text-sm sm:text-base font-quicksand truncate ${
                      isCorrect || isWrong ? 'font-bold' : 'font-semibold text-stone-800'
                    }`}
                  >
                    {opt.text}
                  </span>
                </div>

                {/* Status Indicator Icon */}
                <div className="shrink-0 flex items-center justify-center pl-1">
                  {isCorrect && (
                    <div className="w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center shadow-xs">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  {isWrong && (
                    <div className="w-6 h-6 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-xs">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tip text */}
        <div className="text-center pt-1 text-[11px] sm:text-xs text-stone-400 font-crayon font-medium">
          Chạm vào đáp án để kiểm tra ngay lập tức
        </div>
      </div>

      {/* ── Desktop Shortcut Helper ── */}
      <div className="w-full max-w-lg mt-2 flex items-center justify-between px-2 text-stone-500 font-crayon text-xs">
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="px-1.5 py-0.2 bg-white border border-stone-300 rounded text-[11px] font-sans text-stone-700 font-bold">
            1 - 4
          </span>
          <span>chọn &amp; kiểm tra tức thì</span>
        </div>

        <div className="flex items-center gap-1 text-stone-600 ml-auto">
          <Lightbulb className="w-4 h-4 inline shrink-0" />
          <span>
            {d.rootHint || `Từ gồm ${d.word?.length || 0} ký tự`}
          </span>
        </div>
      </div>

      {/* ── Modern Bottom Sheet Result Notification Modal ── */}
      <ExerciseResultModal
        isOpen={showResultModal}
        isCorrect={!!result?.correct}
        word={d.word}
        phonetic={d.phonetic}
        pos={item?.word?.pos || d.pos}
        meaning={correctOption || d.meaning}
        exampleSentence={item?.word?.example_sentence || item?.word?.exampleSentence || d.sentence}
        notes={item?.word?.notes || d.notes}
        userAnswer={chosenOption}
        onContinue={handleModalContinue}
        onReport={onReport}
      />
    </div>
  );
}
