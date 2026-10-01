// src/components/learning/ExerciseFill.jsx
// Fill-in-the-blank letter boxes — pure React with keyboard navigation.

import { useState, useEffect, useRef, useCallback } from 'react';

function buildSentenceHTML(sentence) {
  // Replace ___ with a styled blank span
  return sentence.replace(/_{2,}(?:\s+_{2,})*/g, (placeholder) =>
    placeholder.split(/\s+/).map(part => {
      const width = Math.max(2.5, Math.min(part.length * 0.75, 7));
      return `<span class="inline-block border-b-2 border-primary mx-1 align-bottom text-transparent font-bold" style="width:${width}em">${part}</span>`;
    }).join(' ')
  );
}

export default function ExerciseFill({ item, onSubmit, onReport }) {
  const d = item?.exerciseData || {};
  const answerParts = d.answerParts?.length ? d.answerParts : (d.answer || '').trim().split(/\s+/).filter(Boolean);
  const totalLetters = d.letters || answerParts.join('').length;

  // Build flat array of { partIdx, letterIdx } for each input box
  const boxes = answerParts.flatMap((part, pi) =>
    [...part].map((_, li) => ({ partIdx: pi, letterIdx: li }))
  );

  const [values, setValues] = useState(() => boxes.map(() => ''));
  const [hintLevel, setHintLevel] = useState(0);
  const [submitted, setSubmitted] = useState(null); // { correct, correctAnswer }
  const inputRefs = useRef([]);

  // Reset on new item
  useEffect(() => {
    setValues(boxes.map(() => ''));
    setHintLevel(0);
    setSubmitted(null);
    setTimeout(() => inputRefs.current[0]?.focus(), 120);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const handleInput = useCallback((e, flatIdx) => {
    if (submitted) return;
    const raw = e.target.value;
    if (!raw) {
      setValues(prev => { const n = [...prev]; n[flatIdx] = ''; return n; });
      return;
    }
    // Paste handling
    if (raw.length > 1) {
      const chars = raw.toUpperCase().replace(/[^A-Z0-9\-']/g, '').split('');
      setValues(prev => {
        const n = [...prev];
        chars.forEach((c, i) => { if (n[flatIdx + i] !== undefined) n[flatIdx + i] = c; });
        return n;
      });
      const nextIdx = Math.min(flatIdx + chars.length, boxes.length - 1);
      setTimeout(() => { inputRefs.current[nextIdx]?.focus(); inputRefs.current[nextIdx]?.select(); }, 10);
      return;
    }
    const char = raw.slice(-1).toUpperCase();
    setValues(prev => { const n = [...prev]; n[flatIdx] = char; return n; });
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
  }, [submitted, boxes.length]);

  const handleKeyDown = useCallback((e, flatIdx) => {
    if (e.key === 'Backspace') {
      if (!values[flatIdx] && flatIdx > 0) {
        e.preventDefault();
        setValues(prev => { const n = [...prev]; n[flatIdx - 1] = ''; return n; });
        inputRefs.current[flatIdx - 1]?.focus();
      } else if (values[flatIdx]) {
        e.preventDefault();
        setValues(prev => { const n = [...prev]; n[flatIdx] = ''; return n; });
      }
    } else if (e.key === 'ArrowLeft' && flatIdx > 0) {
      e.preventDefault(); inputRefs.current[flatIdx - 1]?.focus(); inputRefs.current[flatIdx - 1]?.select();
    } else if (e.key === 'ArrowRight' && flatIdx < boxes.length - 1) {
      e.preventDefault(); inputRefs.current[flatIdx + 1]?.focus(); inputRefs.current[flatIdx + 1]?.select();
    } else if ((e.key === ' ' || e.code === 'Space') && flatIdx < boxes.length - 1) {
      e.preventDefault(); inputRefs.current[flatIdx + 1]?.focus(); inputRefs.current[flatIdx + 1]?.select();
    } else if (e.key === 'Enter') {
      e.preventDefault(); handleCheck();
    }
  }, [values, boxes.length]);

  const handleRevealHint = useCallback(() => {
    if (submitted) return;
    const answerChars = (d.answer || '').replace(/\s+/g, '').split('');
    const maxHint = Math.max(1, answerChars.length - 1);
    if (hintLevel >= maxHint) return;
    // Find next empty input index (hintLevel is the next char to reveal)
    setValues(prev => {
      const n = [...prev];
      n[hintLevel] = (answerChars[hintLevel] || '').toUpperCase();
      return n;
    });
    // Animate revealed input
    const el = inputRefs.current[hintLevel];
    if (el) {
      el.classList.add('border-primary', 'bg-primary/10', 'text-primary', 'scale-110');
      setTimeout(() => el.classList.remove('scale-110'), 200);
    }
    setHintLevel(h => h + 1);
    // Focus next empty
    setTimeout(() => {
      const nextEmpty = inputRefs.current.find((inp, i) => i > hintLevel && !values[i]);
      const nextInp = nextEmpty || inputRefs.current[Math.min(hintLevel + 1, boxes.length - 1)];
      nextInp?.focus(); nextInp?.select();
    }, 60);
  }, [submitted, d.answer, hintLevel, values, boxes.length]);

  const handleCheck = useCallback(() => {
    if (submitted) return;
    // Reconstruct typed answer
    const answer = d.answer || '';
    let letterIdx = 0;
    const typed = answer.split('').map(char => {
      if (char === ' ') return ' ';
      return values[letterIdx++] || '_';
    }).join('');

    const r = onSubmit(typed);
    setSubmitted(r);

    if (!r.skipped) {
      setTimeout(() => { setValues(boxes.map(() => '')); setSubmitted(null); setHintLevel(0); }, 1800);
    }
  }, [submitted, d.answer, values, onSubmit, boxes]);

  // Determine input colour based on submission
  function inputClass(flatIdx) {
    const base = 'w-9 h-11 sm:w-11 sm:h-13 md:w-12 md:h-14 p-0 m-0 text-center text-base sm:text-xl font-bold uppercase border-2 rounded-xl bg-surface outline-none transition-all font-mono leading-none flex items-center justify-center shadow-2xs select-none';
    if (!submitted) return `${base} border-outline-variant/40 focus:border-primary focus:bg-primary/5 text-on-surface focus:ring-2 focus:ring-primary/20`;
    if (submitted.correct) return `${base} border-green-500 bg-green-50 text-green-700`;
    return `${base} border-error bg-error-container/20 text-error`;
  }

  let partOffset = 0;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3 px-1 sm:px-3">
      {/* Header */}
      <div className="w-full max-w-xl flex items-center justify-between px-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Bài tập: Điền vào chỗ trống
        </div>
        <button type="button" onClick={onReport}
          className="p-1 rounded-lg text-outline hover:text-red-500 hover:bg-red-50/50 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          title="Báo lỗi bài tập này">
          <span className="material-symbols-outlined text-[15px]">flag</span>
          <span className="hidden sm:inline">Báo lỗi</span>
        </button>
      </div>

      {/* Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm w-full max-w-xl p-5 sm:p-7 md:p-8 flex flex-col items-center min-h-[300px] justify-between">

        {/* Prompt */}
        <div className="text-center mb-6 w-full">
          <div className="flex items-center justify-center gap-2 mb-3">
            <p className="text-xs sm:text-sm text-on-surface-variant font-medium">Điền từ tiếng Anh có nghĩa:</p>
            <button
              onClick={() => window.HiAudio?.playWord?.(d.answer, 0.9)}
              title="Nghe phát âm từ cần điền"
              className="p-1.5 rounded-full bg-surface-container-low text-primary hover:bg-primary/10 transition-colors active:scale-95 touch-manipulation">
              <span className="material-symbols-outlined text-[18px]">volume_up</span>
            </button>
          </div>

          {d.sentence ? (
            <p
              className="text-base sm:text-lg md:text-xl text-on-surface leading-relaxed mx-auto max-w-lg"
              dangerouslySetInnerHTML={{ __html: buildSentenceHTML(d.sentence) }}
            />
          ) : (
            <p className="text-base sm:text-lg md:text-xl text-on-surface-variant leading-relaxed mx-auto max-w-lg">
              {d.meaningHint}
            </p>
          )}

          {/* Hint button */}
          <div className="mt-3 flex items-center justify-center">
            <button
              onClick={handleRevealHint}
              disabled={hintLevel >= Math.max(1, totalLetters - 1) || !!submitted}
              className="text-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:bg-primary/10 border border-primary/25 bg-primary/5 px-3.5 py-1.5 rounded-xl transition-all active:scale-95 touch-manipulation shadow-sm disabled:opacity-40">
              <span className="material-symbols-outlined text-[17px]">tips_and_updates</span>
              <span>Gợi ý ({hintLevel}/{totalLetters})</span>
            </button>
          </div>
        </div>

        {/* Letter boxes */}
        <div
          className="flex gap-y-3 gap-x-1.5 sm:gap-x-2 justify-center flex-wrap max-w-full items-center my-2 p-1 overflow-x-auto select-none"
          onClick={e => {
            if (e.target.tagName !== 'INPUT') {
              const firstEmpty = inputRefs.current.find((inp, i) => !values[i]);
              const target = firstEmpty || inputRefs.current[inputRefs.current.length - 1];
              target?.focus(); target?.select();
            }
          }}
        >
          {answerParts.map((part, pi) => {
            const startOffset = partOffset;
            partOffset += part.length;
            return (
              <span key={pi} className="inline-flex gap-1 sm:gap-1.5 md:gap-2 flex-nowrap justify-center max-w-full">
                {[...part].map((_, li) => {
                  const flatIdx = startOffset + li;
                  return (
                    <input
                      key={flatIdx}
                      ref={el => inputRefs.current[flatIdx] = el}
                      type="text"
                      maxLength={2}
                      value={values[flatIdx]}
                      disabled={!!submitted}
                      data-fill-index={flatIdx}
                      className={inputClass(flatIdx)}
                      style={{ caretColor: 'transparent', textAlign: 'center' }}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      onFocus={e => { e.target.select(); e.target.scrollLeft = 0; }}
                      onBlur={e => { e.target.scrollLeft = 0; }}
                      onClick={e => { e.target.select(); e.target.scrollLeft = 0; }}
                      onChange={e => handleInput(e, flatIdx)}
                      onKeyDown={e => handleKeyDown(e, flatIdx)}
                    />
                  );
                })}
                {pi < answerParts.length - 1 && (
                  <span className="w-2.5 sm:w-4 md:w-5 shrink-0" aria-hidden="true" />
                )}
              </span>
            );
          })}
        </div>

        <p className="text-[11px] text-outline text-center mt-2 mb-4">
          Gõ ký tự sẽ tự chuyển ô • Nhấn{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-surface-container-low font-mono text-[10px]">Backspace</kbd>{' '}
          để lùi
        </p>

        {/* Check button */}
        <div className="w-full max-w-md">
          <button
            onClick={handleCheck}
            disabled={!!submitted}
            className="w-full py-3.5 rounded-xl text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Kiểm tra</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {submitted && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-white text-sm font-bold shadow-lg ${submitted.correct ? 'bg-green-500' : 'bg-error'}`}>
          {submitted.correct ? '✓ Chính xác!' : `✗ Đáp án: ${submitted.correctAnswer}`}
        </div>
      )}
    </div>
  );
}
