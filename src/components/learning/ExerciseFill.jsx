// src/components/learning/ExerciseFill.jsx
// 100% Pixel-Perfect match to Google Stitch design (both Desktop & Mobile)
// Fill-in-the-blank letter boxes — Pure React with Pop-up Result Notification.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ExerciseResultModal from './ExerciseResultModal.jsx';

function renderSentence(sentence, targetWord) {
  if (!sentence) return null;
  if (sentence.includes('___') || sentence.includes('---')) {
    const parts = sentence.split(/_{2,}|-{2,}/);
    return (
      <>
        {parts[0]}
        <span className="inline-block px-3 sm:px-4 py-0.5 sm:py-1 mx-1.5 sm:mx-2 bg-sky-50 text-[#3b6e8c] font-bold rounded-xl border-2 border-[#3b6e8c] crayon-blank-highlight shadow-xs align-baseline">
          {targetWord || '____'}
        </span>
        {parts[1] || ''}
      </>
    );
  }
  return sentence;
}

function getSlotDimensions(maxPartLen) {
  if (maxPartLen <= 4) {
    return {
      slot: 'w-11 sm:w-14 h-13 sm:h-16 text-xl sm:text-3xl rounded-2xl sm:rounded-[22px]',
      gap: 'gap-2 sm:gap-3',
      gapBetweenWords: 'gap-x-3 sm:gap-x-4 gap-y-2.5 sm:gap-y-3',
    };
  }
  if (maxPartLen <= 6) {
    return {
      slot: 'w-9 sm:w-12 h-11 sm:h-15 text-lg sm:text-2xl rounded-2xl sm:rounded-[20px]',
      gap: 'gap-1.5 sm:gap-2.5',
      gapBetweenWords: 'gap-x-2.5 sm:gap-x-3.5 gap-y-2 sm:gap-y-2.5',
    };
  }
  if (maxPartLen <= 8) {
    return {
      slot: 'w-8 sm:w-11 h-10 sm:h-14 text-base sm:text-xl rounded-xl sm:rounded-2xl',
      gap: 'gap-1 sm:gap-2',
      gapBetweenWords: 'gap-x-2 sm:gap-x-3 gap-y-2',
    };
  }
  if (maxPartLen <= 10) {
    return {
      slot: 'w-7 sm:w-10 h-9 sm:h-13 text-sm sm:text-lg rounded-xl sm:rounded-2xl',
      gap: 'gap-1 sm:gap-1.5',
      gapBetweenWords: 'gap-x-2 gap-y-1.5',
    };
  }
  if (maxPartLen <= 12) {
    return {
      slot: 'w-6 sm:w-9 h-8.5 sm:h-12 text-xs sm:text-base rounded-xl sm:rounded-2xl',
      gap: 'gap-0.5 sm:gap-1',
      gapBetweenWords: 'gap-x-1.5 gap-y-1.5',
    };
  }
  return {
    slot: 'w-5.5 sm:w-8 h-8 sm:h-11 text-xs sm:text-sm rounded-lg sm:rounded-xl',
    gap: 'gap-0.5 sm:gap-1',
    gapBetweenWords: 'gap-x-1 gap-y-1',
  };
}

export default function ExerciseFill({ item, onSubmit, onReport, sessionInfo }) {
  const d = item?.exerciseData || {};
  const answer = (d.answer || '').trim();
  const answerParts = d.answerParts?.length
    ? d.answerParts
    : answer.split(/\s+/).filter(Boolean);
  const totalLetters = d.letters || answerParts.join('').length;

  // Build flat array of { partIdx, letterIdx } for each input box
  const boxes = answerParts.flatMap((part, pi) =>
    [...part].map((_, li) => ({ partIdx: pi, letterIdx: li }))
  );

  const [values, setValues] = useState(() => boxes.map(() => ''));
  const [hintLevel, setHintLevel] = useState(0);
  const [submitted, setSubmitted] = useState(null); // { correct, correctAnswer }
  const [showResultModal, setShowResultModal] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const inputRefs = useRef([]);

  const currentNum = sessionInfo?.currentNum ?? 1;
  const totalNum = sessionInfo?.totalNum ?? 10;

  // Reset on new item
  useEffect(() => {
    setValues(boxes.map(() => ''));
    setHintLevel(0);
    setSubmitted(null);
    setShowResultModal(false);
    setFocusedIdx(0);
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 120);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const handleInput = useCallback(
    (e, flatIdx) => {
      if (submitted) return;
      const raw = e.target.value;
      if (!raw) {
        setValues((prev) => {
          const n = [...prev];
          n[flatIdx] = '';
          return n;
        });
        return;
      }
      // Paste handling
      if (raw.length > 1) {
        const chars = raw
          .toUpperCase()
          .replace(/[^A-Z0-9\-']/g, '')
          .split('');
        setValues((prev) => {
          const n = [...prev];
          chars.forEach((c, i) => {
            if (n[flatIdx + i] !== undefined) n[flatIdx + i] = c;
          });
          return n;
        });
        const nextIdx = Math.min(flatIdx + chars.length, boxes.length - 1);
        setTimeout(() => {
          inputRefs.current[nextIdx]?.focus();
          inputRefs.current[nextIdx]?.select();
        }, 10);
        return;
      }
      const char = raw.slice(-1).toUpperCase();
      setValues((prev) => {
        const n = [...prev];
        n[flatIdx] = char;
        return n;
      });
      if (e.target) e.target.scrollLeft = 0;
      if (flatIdx < boxes.length - 1) {
        setTimeout(() => {
          const next = inputRefs.current[flatIdx + 1];
          if (next) {
            next.focus();
            next.select();
            next.scrollLeft = 0;
          }
        }, 10);
      }
    },
    [submitted, boxes.length]
  );

  const handleKeyDown = useCallback(
    (e, flatIdx) => {
      if (showResultModal) return;
      if (e.key === 'Backspace') {
        if (!values[flatIdx] && flatIdx > 0) {
          e.preventDefault();
          setValues((prev) => {
            const n = [...prev];
            n[flatIdx - 1] = '';
            return n;
          });
          inputRefs.current[flatIdx - 1]?.focus();
        } else if (values[flatIdx]) {
          e.preventDefault();
          setValues((prev) => {
            const n = [...prev];
            n[flatIdx] = '';
            return n;
          });
        }
      } else if (e.key === 'ArrowLeft' && flatIdx > 0) {
        e.preventDefault();
        inputRefs.current[flatIdx - 1]?.focus();
        inputRefs.current[flatIdx - 1]?.select();
      } else if (e.key === 'ArrowRight' && flatIdx < boxes.length - 1) {
        e.preventDefault();
        inputRefs.current[flatIdx + 1]?.focus();
        inputRefs.current[flatIdx + 1]?.select();
      } else if ((e.key === ' ' || e.code === 'Space') && flatIdx < boxes.length - 1) {
        e.preventDefault();
        inputRefs.current[flatIdx + 1]?.focus();
        inputRefs.current[flatIdx + 1]?.select();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleCheck();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, boxes.length, showResultModal]
  );

  const handleRevealHint = useCallback(() => {
    if (submitted) return;
    const answerChars = (d.answer || '').replace(/\s+/g, '').split('');
    const maxHint = Math.max(1, answerChars.length - 1);
    if (hintLevel >= maxHint) return;

    setValues((prev) => {
      const n = [...prev];
      n[hintLevel] = (answerChars[hintLevel] || '').toUpperCase();
      return n;
    });

    const el = inputRefs.current[hintLevel];
    if (el) {
      el.classList.add('border-[#3b6e8c]', 'bg-sky-100', 'scale-110');
      setTimeout(() => el.classList.remove('scale-110'), 250);
    }
    setHintLevel((h) => h + 1);

    setTimeout(() => {
      const nextInp = inputRefs.current[Math.min(hintLevel + 1, boxes.length - 1)];
      nextInp?.focus();
      nextInp?.select();
    }, 60);
  }, [submitted, d.answer, hintLevel, boxes.length]);

  const handleCheck = useCallback(() => {
    if (submitted) return;
    const ans = d.answer || '';
    let letterIdx = 0;
    const typed = ans
      .split('')
      .map((char) => {
        if (char === ' ') return ' ';
        return values[letterIdx++] || '_';
      })
      .join('');

    const r = onSubmit(typed);
    setSubmitted(r);
    setShowResultModal(true);
  }, [submitted, d.answer, values, onSubmit]);

  const handleModalContinue = useCallback(() => {
    setShowResultModal(false);
    setValues(boxes.map(() => ''));
    setSubmitted(null);
    setHintLevel(0);
  }, [boxes]);

  const handleClearAll = useCallback(() => {
    if (submitted) return;
    setValues(boxes.map(() => ''));
    setFocusedIdx(0);
    setTimeout(() => {
      inputRefs.current[0]?.focus();
      inputRefs.current[0]?.select?.();
    }, 50);
  }, [submitted, boxes]);

  const playAudio = useCallback(() => {
    const word = d.answer || '';
    if (!word) return;
    if (window.HiAudio?.playWord) {
      window.HiAudio.playWord(word, 0.9);
    } else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    }
  }, [d.answer]);

  let partOffset = 0;
  const firstLetter = (d.answer || '').trim()[0]?.toUpperCase() || 'A';
  const userTyped = values.join('');

  // Calculate dynamic dimensions for mobile fit
  const maxPartLetters = Math.max(...answerParts.map((p) => p.length), 1);
  const dims = getSlotDimensions(maxPartLetters);

  // Formatted preview of user typing with spaces between words
  const userTypedPreview = answerParts
    .map((part, pi) => {
      const start = answerParts.slice(0, pi).reduce((acc, p) => acc + p.length, 0);
      return [...part].map((_, li) => values[start + li] || '_').join('');
    })
    .join(' ');

  return (
    <div className="w-full flex flex-col items-center justify-center select-none font-comfortaa my-auto px-2">
      {/* ── Main Big Crayon Card ── */}
      <div className="w-full max-w-xl bg-white rounded-[24px] sm:rounded-[30px] border-[3px] border-[#342e2b] p-3.5 sm:p-5 md:p-6 shadow-[4px_6px_0px_#2c2523] relative transition-all my-auto">
        {/* Top Tiger Encouragement & Report Header */}
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
            <span>Churbito gợi ý: Từ gồm {totalLetters} ký tự, bắt đầu '{firstLetter}' 🐾</span>
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

        {/* Sub-header with Audio Trigger */}
        <div className="flex items-center justify-center gap-2 mb-1.5 sm:mb-2">
          <span className="text-stone-700 font-semibold text-xs sm:text-sm md:text-base">
            Điền từ tiếng Anh có nghĩa:
          </span>
          <button
            type="button"
            onClick={playAudio}
            aria-label="Phát âm từ vựng"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-sky-100 hover:bg-sky-200 border-2 border-stone-800 text-sky-800 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
            title="Nghe phát âm từ cần điền"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-800" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Passage Sentence with Highlighted Blank Word */}
        <div className="text-center font-crayon leading-relaxed text-base sm:text-xl text-stone-800 max-w-xl mx-auto tracking-wide mb-2 sm:mb-3 px-1">
          {d.sentence ? (
            renderSentence(d.sentence, submitted ? d.answer : values.join('') || '_____')
          ) : (
            <p className="text-sm sm:text-lg font-bold text-stone-800">
              "{d.meaningHint || d.meaning || '...'}"
            </p>
          )}
        </div>

        {/* Hint Expand Pill Toggle */}
        <div className="flex justify-center mb-2 sm:mb-2.5">
          <button
            type="button"
            onClick={handleRevealHint}
            disabled={hintLevel >= Math.max(1, totalLetters - 1) || !!submitted}
            className="crayon-dashed px-3 sm:px-4 py-0.5 sm:py-1 rounded-full text-stone-700 hover:text-stone-900 font-semibold text-[11px] sm:text-xs flex items-center gap-1.5 transition hover:bg-stone-50 border-stone-400 cursor-pointer shadow-2xs disabled:opacity-40"
          >
            <span className="text-amber-600">💡</span>
            <span>Gợi ý ({hintLevel}/{totalLetters})</span>
            <svg className="w-3 h-3 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* ── Live Word Preview Bar (Always Fits & Crystal Clear on Mobile) ── */}
        <div className="w-full max-w-md mx-auto mb-3.5 px-1">
          <div className="bg-[#FAF5EB] border-2 border-[#2B2523] rounded-2xl sm:rounded-full py-2 px-3.5 sm:px-5 shadow-[2px_2.5px_0px_#2B2523] flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#6E5F52] shrink-0">
              <span className="text-base">✏️</span>
              <span className="hidden xs:inline">Từ đang gõ:</span>
            </div>
            <div className="flex-1 text-center font-mono font-black text-sm sm:text-lg text-[#2B4566] tracking-wider truncate px-1">
              {userTyped ? (
                <span className="text-stone-900 font-black tracking-widest bg-white px-3.5 py-0.5 rounded-full border border-stone-200 shadow-2xs inline-block">
                  {userTypedPreview}
                </span>
              ) : (
                <span className="text-stone-400 font-medium italic text-xs">Chạm ô bên dưới để gõ từng chữ cái...</span>
              )}
            </div>
            {userTyped && !submitted && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold shrink-0 transition active:scale-95 cursor-pointer shadow-2xs"
                title="Xóa hết để nhập lại"
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        {/* ── Letters Input Box Row (Responsive & Mobile-Fit with Word Wrapping) ── */}
        <div
          className="w-full max-w-full overflow-x-auto py-1.5 mb-3 sm:mb-4 no-scrollbar"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onClick={(e) => {
            if (e.target.tagName !== 'INPUT') {
              const firstEmpty = inputRefs.current.find((inp, i) => !values[i]);
              const target = firstEmpty || inputRefs.current[inputRefs.current.length - 1];
              target?.focus();
              target?.select?.();
            }
          }}
        >
          <div className={`flex flex-wrap items-center justify-center ${dims.gapBetweenWords} min-w-min mx-auto px-1`}>
            {answerParts.map((part, pi) => {
              const startOffset = partOffset;
              partOffset += part.length;

              return (
                <div key={pi} className={`inline-flex items-center ${dims.gap} flex-nowrap shrink-0`}>
                  {[...part].map((_, li) => {
                    const flatIdx = startOffset + li;
                    const isFilled = !!values[flatIdx];
                    const isActive = focusedIdx === flatIdx && !submitted;

                    let slotClass = `${dims.slot} flex items-center justify-center font-mono font-black transition-all duration-150 shrink-0 select-none `;

                    if (!submitted) {
                      if (isActive) {
                        slotClass +=
                          'border-[3px] border-[#2B4566] bg-[#F1F7FF] text-[#2B4566] shadow-[2.5px_3.5px_0px_#2B2523] ring-4 ring-sky-300/60 scale-105 z-10';
                      } else if (isFilled) {
                        slotClass +=
                          'border-2 border-[#2B2523] bg-white text-stone-900 shadow-[1.5px_2px_0px_#2B2523] hover:border-stone-800';
                      } else {
                        slotClass +=
                          'border-2 border-stone-300 border-dashed text-stone-400 bg-white/70 shadow-2xs hover:bg-stone-50';
                      }
                    } else {
                      if (submitted.correct) {
                        slotClass +=
                          'border-[2.5px] border-[#3D7A46] bg-[#EEF8EC] text-[#2B6135] shadow-[2px_2.5px_0px_#2B6135]';
                      } else {
                        slotClass +=
                          'border-[2.5px] border-[#D34E36] bg-[#FDF0ED] text-[#B83822] shadow-[2px_2.5px_0px_#B83822]';
                      }
                    }

                    return (
                      <div key={flatIdx} className={slotClass}>
                        <input
                          ref={(el) => (inputRefs.current[flatIdx] = el)}
                          type="text"
                          maxLength={2}
                          value={values[flatIdx]}
                          disabled={!!submitted}
                          data-fill-index={flatIdx}
                          className="w-full h-full text-center bg-transparent focus:outline-none uppercase caret-transparent p-0 font-bold"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="characters"
                          spellCheck={false}
                          onFocus={(e) => {
                            setFocusedIdx(flatIdx);
                            e.target.select?.();
                            e.target.scrollLeft = 0;
                            e.target.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                          }}
                          onBlur={(e) => {
                            e.target.scrollLeft = 0;
                          }}
                          onClick={(e) => {
                            setFocusedIdx(flatIdx);
                            e.target.select?.();
                            e.target.scrollLeft = 0;
                          }}
                          onChange={(e) => handleInput(e, flatIdx)}
                          onKeyDown={(e) => handleKeyDown(e, flatIdx)}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Keyboard Navigation Instructions - Desktop Only */}
        <div className="hidden sm:flex text-center font-quicksand text-xs text-stone-500 font-medium mb-3 items-center justify-center gap-1.5 flex-wrap">
          <span>Gõ ký tự</span>
          <span className="inline-block w-1 h-1 rounded-full bg-stone-300"></span>
          <span>
            <kbd className="px-1.5 py-0.2 bg-stone-100 border border-stone-400/70 rounded font-mono text-[11px] text-stone-700 font-semibold shadow-2xs">
              Backspace
            </kbd>{' '}
            để lùi
          </span>
          <span className="inline-block w-1 h-1 rounded-full bg-stone-300"></span>
          <span>
            <kbd className="px-1.5 py-0.2 bg-stone-100 border border-stone-400/70 rounded font-mono text-[11px] text-stone-700 font-semibold shadow-2xs">
              Enter
            </kbd>{' '}
            để kiểm tra
          </span>
        </div>

        {/* Primary Action Button: Kiểm tra đáp án */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleCheck}
            disabled={!!submitted}
            className="w-full max-w-sm py-2.5 sm:py-3 px-6 bg-[#3b6e8c] hover:bg-[#34617c] active:bg-[#2b5168] text-white font-crayon text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl border-2 border-stone-800 shadow-[2px_3px_0px_#2c2523] hover:translate-y-0.5 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Kiểm tra đáp án</span>
          </button>
        </div>
      </div>

      {/* ── Pop-up Result Notification Modal ── */}
      <ExerciseResultModal
        isOpen={showResultModal}
        isCorrect={!!submitted?.correct}
        word={d.answer}
        meaning={d.meaning || d.meaningHint}
        userAnswer={userTyped}
        onContinue={handleModalContinue}
      />
    </div>
  );
}
