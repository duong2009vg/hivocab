// src/components/learning/ExerciseListen.jsx
// 100% Pixel-Perfect match to Google Stitch design (both Desktop & Mobile)
// Listen & type exercise — Pure React with Pop-up Result Notification and Full SVG Icons.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ExerciseResultModal from './ExerciseResultModal.jsx';

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
  // 13+ letters (fits 14 letters in 300px without overflowing)
  return {
    slot: 'w-5.5 sm:w-8 h-8 sm:h-11 text-xs sm:text-sm rounded-lg sm:rounded-xl',
    gap: 'gap-0.5 sm:gap-1',
    gapBetweenWords: 'gap-x-1 gap-y-1',
  };
}

export default function ExerciseListen({ item, onSubmit, speakWord, onReport, sessionInfo }) {
  const d = item?.exerciseData || {};
  const answer = (d.answer || '').trim();
  const answerParts = d.answerParts?.length
    ? d.answerParts
    : answer.split(/\s+/).filter(Boolean);
  const totalLetters = d.letters || answerParts.join('').length;

  const boxes = answerParts.flatMap((part, pi) =>
    [...part].map((_, li) => ({ partIdx: pi, letterIdx: li }))
  );

  const [values, setValues] = useState(() => boxes.map(() => ''));
  const [hintLevel, setHintLevel] = useState(0);
  const [submitted, setSubmitted] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1.0);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const inputRefs = useRef([]);

  const currentNum = sessionInfo?.currentNum ?? 1;
  const totalNum = sessionInfo?.totalNum ?? 10;

  // Auto-play audio on new item
  useEffect(() => {
    setValues(boxes.map(() => ''));
    setHintLevel(0);
    setSubmitted(null);
    setShowResultModal(false);
    setShowMeaning(false);
    setFocusedIdx(0);
    const t = setTimeout(() => handlePlay(1.0), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  function handlePlay(rate = 1.0) {
    setCurrentSpeed(rate);
    setIsPlayingAudio(true);
    const word = d.wordToSpeak || d.answer || '';
    if (speakWord) {
      speakWord(word, rate);
    } else if (window.HiAudio?.playWord) {
      window.HiAudio.playWord(word, rate);
    } else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-US';
      u.rate = rate;
      window.speechSynthesis.speak(u);
    }
    setTimeout(() => setIsPlayingAudio(false), 900);

    // Focus current or first empty input after audio
    setTimeout(() => {
      const firstEmpty = inputRefs.current.find((inp, i) => !values[i]);
      const target = firstEmpty || inputRefs.current[0];
      target?.focus();
      target?.select();
    }, 400);
  }

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
      } else if ((e.key === ' ' || e.code === 'Space') && e.target.tagName === 'INPUT') {
        e.preventDefault();
        inputRefs.current[Math.min(flatIdx + 1, boxes.length - 1)]?.focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleCheck();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, boxes.length, showResultModal]
  );

  // Space on non-input = replay sound
  useEffect(() => {
    function onKey(e) {
      if (showResultModal) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handlePlay(currentSpeed);
      }
      if (e.key === 'Enter' && !submitted) {
        handleCheck();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, currentSpeed, values, showResultModal]);

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
      el.classList.add('border-[#3884DD]', 'bg-[#F1F7FF]', 'scale-110');
      setTimeout(() => el.classList.remove('scale-110'), 200);
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

  let partOffset = 0;
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
    <div className="w-full flex flex-col items-center select-none font-comfortaa">
      {/* ── Main Exercise Card ── */}
      <div className="w-full max-w-2xl bg-white border-[3px] border-[#2B2523] rounded-[28px] sm:rounded-[36px] shadow-[4px_6px_0px_#2B2523] px-3.5 sm:px-8 md:px-12 py-5 sm:py-8 flex flex-col items-center relative overflow-hidden">
        {/* Top Badge: Practice Mode Tag */}
        <div className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full border-2 border-blue-400 bg-blue-50/80 text-blue-700 font-bold text-xs sm:text-sm tracking-wider uppercase mb-1.5 sm:mb-2 shadow-2xs">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>LUYỆN PHẢN XẠ NGHE</span>
        </div>

        {/* Question Prompt & Subtitle */}
        <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-stone-800 text-center tracking-tight mb-0.5">
          Nghe và điền từng chữ cái
        </h1>
        <p className="text-stone-500 font-medium text-xs sm:text-sm text-center mb-3 sm:mb-5 font-quicksand">
          Lắng nghe phát âm chuẩn và gõ từng ký tự vào ô chữ
        </p>

        {/* Center Audio Play Button with Crayon Notes */}
        <div className="relative my-1 sm:my-2 flex items-center justify-center">
          <span
            className="absolute -top-2 -right-6 text-xl font-crayon text-sky-400 select-none animate-bounce"
            style={{ animationDuration: '2.2s' }}
          >
            ♪
          </span>
          <span
            className="absolute bottom-1 -left-6 text-lg font-crayon text-emerald-400 select-none animate-bounce"
            style={{ animationDuration: '1.8s', animationDelay: '0.4s' }}
          >
            ♫
          </span>

          {/* Big Round Speaker Button */}
          <button
            type="button"
            onClick={() => handlePlay(currentSpeed)}
            className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-sky-400 via-[#3A82EE] to-blue-600 border-[3px] sm:border-[3.5px] border-[#2B2523] shadow-[3px_5px_0px_#2B2523] flex items-center justify-center text-white hover:scale-105 active:scale-95 active:shadow-[1px_2px_0px_#2B2523] transition-all cursor-pointer group ${
              isPlayingAudio ? 'scale-105 ring-6 sm:ring-8 ring-sky-100' : ''
            }`}
            title="Bấm hoặc nhấn Space để nghe"
          >
            <svg
              className="w-10 h-10 sm:w-14 sm:h-14 text-white drop-shadow-sm group-hover:scale-110 transition-transform"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4a2 2 0 00-2 2v5a2 2 0 002 2h2.44l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.5 12A6.49 6.49 0 0017 7.75a1 1 0 10-1.414 1.414A4.49 4.49 0 0116.5 12c0 1.2-.47 2.29-1.236 3.107a1 1 0 101.442 1.386A6.49 6.49 0 0018.5 12zm3 0c0-3.32-1.72-6.24-4.32-7.9a1 1 0 10-1.08 1.68 7.48 7.48 0 013.4 6.22c0 2.54-1.26 4.79-3.18 6.13a1 1 0 101.16 1.63A9.48 9.48 0 0021.5 12z" />
            </svg>
          </button>
        </div>

        {/* Playback Speed Controls */}
        <div className="flex items-center gap-2.5 sm:gap-4 my-2.5 sm:my-3">
          <button
            type="button"
            onClick={() => handlePlay(1.0)}
            className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full border-2 border-[#2B2523] flex items-center gap-1.5 font-bold text-xs sm:text-sm transition-all shadow-[1.5px_2px_0px_#2B2523] active:translate-y-0.5 cursor-pointer ${
              currentSpeed === 1.0 ? 'bg-blue-50 text-blue-700 border-blue-600' : 'bg-white text-stone-800 hover:bg-stone-50'
            }`}
          >
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Chuẩn (1.0x)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePlay(0.6)}
            className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full border-2 border-[#2B2523] flex items-center gap-1.5 font-bold text-xs sm:text-sm transition-all shadow-[1.5px_2px_0px_#2B2523] active:translate-y-0.5 cursor-pointer ${
              currentSpeed === 0.6 ? 'bg-amber-50 text-amber-800 border-amber-600' : 'bg-white text-stone-800 hover:bg-stone-50'
            }`}
          >
            <span className="text-xs sm:text-sm">🐢</span>
            <span>Chậm (0.6x)</span>
          </button>
        </div>

        {/* IPA Phonetic Display */}
        {d.phonetic && (
          <div className="text-sm sm:text-xl font-semibold tracking-widest text-stone-600 font-mono mb-2 select-text">
            /{d.phonetic}/
          </div>
        )}

        {/* Hint and Definition Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap justify-center">
          <button
            type="button"
            onClick={handleRevealHint}
            disabled={hintLevel >= Math.max(1, totalLetters - 1) || !!submitted}
            className="px-3 sm:px-4 py-1 sm:py-1.5 bg-amber-50 border-2 border-stone-800 rounded-full flex items-center gap-1 font-bold text-xs sm:text-sm text-amber-900 shadow-[1.5px_1.5px_0px_#2B2523] hover:bg-amber-100 cursor-pointer active:translate-y-0.5 disabled:opacity-40"
          >
            <span>💡</span>
            <span>Gợi ý ({hintLevel}/{totalLetters})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMeaning((m) => !m)}
            className="px-3 sm:px-4 py-1 sm:py-1.5 bg-stone-50 border-2 border-stone-800 rounded-full flex items-center gap-1 font-bold text-xs sm:text-sm text-stone-700 shadow-[1.5px_1.5px_0px_#2B2523] hover:bg-stone-100 cursor-pointer active:translate-y-0.5"
          >
            <span>👁</span>
            <span>{showMeaning ? 'Ẩn nghĩa' : 'Xem nghĩa'}</span>
          </button>
        </div>

        {/* Meaning dropdown box if active */}
        {showMeaning && (
          <div className="mb-3 px-4 py-2 bg-amber-50/90 border-2 border-dashed border-amber-400 rounded-2xl text-xs sm:text-sm text-stone-800 text-center font-quicksand font-bold animate-fade-in max-w-md w-full">
            Nghĩa tiếng Việt: <span className="text-[#3b6e8c]">{d.meaning || d.meaningHint || '...'}</span>
          </div>
        )}

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
                        slotClass += 'border-[3px] border-[#2B4566] bg-[#F1F7FF] text-[#2B4566] shadow-[2.5px_3.5px_0px_#2B2523] ring-4 ring-sky-300/60 scale-105 z-10';
                      } else if (isFilled) {
                        slotClass += 'border-2 border-[#2B2523] bg-white text-stone-900 shadow-[1.5px_2px_0px_#2B2523] hover:border-stone-800';
                      } else {
                        slotClass += 'border-2 border-stone-300 border-dashed text-stone-400 bg-white/70 shadow-2xs hover:bg-stone-50';
                      }
                    } else {
                      if (submitted.correct) {
                        slotClass += 'border-[2.5px] border-[#3D7A46] bg-[#EEF8EC] text-[#2B6135] shadow-[2px_2.5px_0px_#2B6135]';
                      } else {
                        slotClass += 'border-[2.5px] border-[#D34E36] bg-[#FDF0ED] text-[#B83822] shadow-[2px_2.5px_0px_#B83822]';
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
                          data-listen-index={flatIdx}
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

        {/* Typing Guidance Tip - Desktop Only */}
        <p className="hidden sm:flex text-xs md:text-sm font-semibold text-stone-500 text-center mb-5 sm:mb-6 items-center flex-wrap justify-center gap-1.5 font-quicksand">
          <span>Gõ ký tự sẽ tự chuyển ô</span>
          <span className="text-stone-300">•</span>
          <span>
            Nhấn{' '}
            <kbd className="px-2 py-0.5 bg-stone-100 border border-stone-400 rounded text-[11px] font-mono text-stone-700 shadow-2xs">
              Space
            </kbd>{' '}
            để nghe lại
          </span>
          <span className="text-stone-300">•</span>
          <span>
            Nhấn{' '}
            <kbd className="px-2 py-0.5 bg-stone-100 border border-stone-400 rounded text-[11px] font-mono text-stone-700 shadow-2xs">
              Backspace
            </kbd>{' '}
            để lùi
          </span>
        </p>

        {/* Primary Action: Check Answer Button (Reliable SVG) */}
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={handleCheck}
            disabled={!!submitted}
            className="w-full py-3 sm:py-4 px-6 sm:px-8 bg-[#243A5E] hover:bg-[#1C2F4D] text-white font-crayon font-bold text-base sm:text-lg rounded-2xl border-2 border-[#2B2523] shadow-[3px_5px_0px_#2B2523] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[1px_2px_0px_#2B2523] transition-all flex items-center justify-center gap-2 sm:gap-3 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Kiểm tra đáp án</span>
          </button>
        </div>
      </div>

      {/* ── Companion Mascot Encouragement Bar ── */}
      <div className="w-full max-w-2xl mt-3 sm:mt-5 flex items-center justify-between gap-2 sm:gap-3 px-1 sm:px-2">
        <div className="flex items-center gap-2.5 sm:gap-4 flex-1">
          <div className="w-10 h-10 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-amber-200 border-2 border-[#2B2523] shadow-[2px_2px_0px_#2B2523] flex items-center justify-center text-xl sm:text-3xl relative overflow-hidden">
            <span>🐯</span>
          </div>

          <div className="relative bg-white border-2 border-[#2B2523] rounded-2xl px-3 sm:px-5 py-2 sm:py-2.5 shadow-[2px_2px_0px_#2B2523] flex-1">
            <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[7px] border-t-transparent border-r-[10px] border-r-[#2B2523] border-b-[7px] border-b-transparent"></div>
            <div className="absolute -left-[7px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-white border-b-[6px] border-b-transparent"></div>
            <p className="font-quicksand font-bold text-stone-700 text-xs sm:text-sm md:text-base leading-relaxed">
              <span className="text-amber-800 font-extrabold font-crayon">Churbito:</span> "Lắng nghe thật kỹ và gõ từng chữ cái nhé! 🐾"
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReport}
          aria-label="Đánh dấu câu hỏi cần xem lại"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border-2 border-[#2B2523] shadow-[2px_2px_0px_#2B2523] flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
          title="Báo cáo câu hỏi"
        >
          <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* ── Pop-up Result Notification Modal ── */}
      <ExerciseResultModal
        isOpen={showResultModal}
        isCorrect={!!submitted?.correct}
        word={d.answer}
        phonetic={d.phonetic}
        meaning={d.meaning || d.meaningHint}
        userAnswer={userTyped}
        onContinue={handleModalContinue}
      />
    </div>
  );
}
