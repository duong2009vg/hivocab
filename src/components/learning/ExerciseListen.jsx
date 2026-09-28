// src/components/learning/ExerciseListen.jsx
// Listen & type exercise — pure React with ripple animation and TTS.

import { useState, useEffect, useRef, useCallback } from 'react';

export default function ExerciseListen({ item, onSubmit, speakWord, onReport }) {
  const d = item?.exerciseData || {};
  const answerParts = d.answerParts?.length ? d.answerParts : (d.answer || '').trim().split(/\s+/).filter(Boolean);
  const totalLetters = d.letters || answerParts.join('').length;

  const boxes = answerParts.flatMap((part, pi) =>
    [...part].map((_, li) => ({ partIdx: pi, letterIdx: li }))
  );

  const [values, setValues]       = useState(() => boxes.map(() => ''));
  const [hintLevel, setHintLevel] = useState(0);
  const [submitted, setSubmitted] = useState(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [playCount, setPlayCount]   = useState(0);
  const [rippleActive, setRippleActive] = useState(false);
  const [phoneticVisible, setPhoneticVisible] = useState(false);
  const inputRefs = useRef([]);

  // Reset on new item + auto-play after 400ms
  useEffect(() => {
    setValues(boxes.map(() => ''));
    setHintLevel(0);
    setSubmitted(null);
    setShowMeaning(false);
    setPlayCount(0);
    setRippleActive(false);
    setPhoneticVisible(false);
    const t = setTimeout(() => handlePlay(0.9), 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  function animateRipple(durationMs = 1200) {
    setRippleActive(true);
    setTimeout(() => setRippleActive(false), durationMs);
  }

  function handlePlay(rate = 0.9) {
    const word = d.wordToSpeak || d.answer || '';
    speakWord(word, rate);
    animateRipple(rate < 0.8 ? 1800 : 1200);
    setPlayCount(c => c + 1);
    setPhoneticVisible(true);
    // Focus first empty input after play
    setTimeout(() => {
      const firstEmpty = inputRefs.current.find((inp, i) => !values[i]);
      const target = firstEmpty || inputRefs.current[0];
      target?.focus(); target?.select();
    }, 500);
  }

  const handleInput = useCallback((e, flatIdx) => {
    if (submitted) return;
    const raw = e.target.value;
    if (!raw) {
      setValues(prev => { const n = [...prev]; n[flatIdx] = ''; return n; });
      return;
    }
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
    if (flatIdx < boxes.length - 1) {
      setTimeout(() => { inputRefs.current[flatIdx + 1]?.focus(); inputRefs.current[flatIdx + 1]?.select(); }, 10);
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
    } else if ((e.key === ' ' || e.code === 'Space') && e.target.tagName === 'INPUT') {
      // Space on an input = advance to next box
      e.preventDefault(); inputRefs.current[Math.min(flatIdx + 1, boxes.length - 1)]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault(); handleCheck();
    }
  }, [values, boxes.length]);

  // Space on non-input = replay
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); handlePlay(0.9); }
      if (e.key === 'Enter' && !submitted) handleCheck();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, values]);

  const handleRevealHint = useCallback(() => {
    if (submitted) return;
    const answerChars = (d.answer || '').replace(/\s+/g, '').split('');
    const maxHint = Math.max(1, answerChars.length - 1);
    if (hintLevel >= maxHint) return;
    setValues(prev => {
      const n = [...prev];
      n[hintLevel] = (answerChars[hintLevel] || '').toUpperCase();
      return n;
    });
    const el = inputRefs.current[hintLevel];
    if (el) {
      el.classList.add('border-primary', 'bg-primary/10', 'text-primary', 'scale-110');
      setTimeout(() => el.classList.remove('scale-110'), 200);
    }
    setHintLevel(h => h + 1);
    setTimeout(() => {
      const nextInp = inputRefs.current[Math.min(hintLevel + 1, boxes.length - 1)];
      nextInp?.focus(); nextInp?.select();
    }, 60);
  }, [submitted, d.answer, hintLevel, boxes.length]);

  const handleCheck = useCallback(() => {
    if (submitted) return;
    if (!values.some(v => v)) {
      // Shake empty boxes
      inputRefs.current.forEach(inp => {
        if (!inp) return;
        inp.classList.add('border-error', 'animate-pulse');
        setTimeout(() => inp.classList.remove('border-error', 'animate-pulse'), 800);
      });
      inputRefs.current[0]?.focus();
      return;
    }
    const answer = d.answer || '';
    let letterIdx = 0;
    const typed = answer.split('').map(char => {
      if (char === ' ') return ' ';
      return values[letterIdx++] || '_';
    }).join('');

    const r = onSubmit(typed);
    setSubmitted(r);

    if (!r.skipped) {
      setTimeout(() => { setValues(boxes.map(() => '')); setSubmitted(null); setHintLevel(0); setPhoneticVisible(false); }, 1800);
    }
  }, [submitted, values, d.answer, onSubmit, boxes]);

  function inputClass(flatIdx) {
    const base = 'w-7 h-9 sm:w-8 sm:h-10 text-center text-sm sm:text-base font-bold uppercase border-2 rounded-lg bg-surface outline-none transition-all';
    if (!submitted) return `${base} border-outline-variant/40 focus:border-primary focus:bg-primary/5 text-on-surface`;
    if (submitted.correct) return `${base} border-green-500 bg-green-50 text-green-700`;
    return `${base} border-error bg-error-container/20 text-error`;
  }

  let partOffset = 0;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3 px-1 sm:px-3">
      {/* Header */}
      <div className="w-full max-w-xl flex items-center justify-between px-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Bài tập: Luyện nghe &amp; Điền từ
        </div>
        <button type="button" onClick={onReport}
          className="p-1 rounded-lg text-outline hover:text-red-500 hover:bg-red-50/50 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          title="Báo lỗi bài tập này">
          <span className="material-symbols-outlined text-[15px]">flag</span>
          <span className="hidden sm:inline">Báo lỗi</span>
        </button>
      </div>

      {/* Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm w-full max-w-xl p-5 sm:p-7 md:p-8 flex flex-col items-center min-h-[380px] md:min-h-[420px] justify-between">

        {/* Title */}
        <div className="text-center w-full">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
            <span className="material-symbols-outlined text-[15px]">hearing</span>
            Luyện phản xạ nghe
          </span>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-on-surface">Nghe và điền từng chữ cái</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Lắng nghe phát âm chuẩn và gõ từng ký tự vào ô chữ</p>
        </div>

        {/* Audio station */}
        <div className="my-3 flex flex-col items-center justify-center relative w-full">
          <div className="relative flex items-center justify-center mb-3">
            {/* Ripple ring */}
            <div
              className={`absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary/15 transition-all pointer-events-none ${rippleActive ? 'scale-125 opacity-100' : 'scale-100 opacity-0'}`}
            />
            {/* Main play button */}
            <button
              onClick={() => handlePlay(0.9)}
              title="Bấm để nghe phát âm chuẩn (Phím Space)"
              className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-primary to-primary/80 text-on-primary flex items-center justify-center shadow-[0_8px_25px_rgba(0,97,146,0.35)] hover:scale-105 active:scale-95 transition-all z-10 touch-manipulation group"
              style={{ width: '4.5rem', height: '4.5rem' }}
            >
              <span className="material-symbols-outlined text-[32px] sm:text-[38px] group-hover:scale-110 transition-transform">volume_up</span>
            </button>
          </div>

          {/* Sound wave indicator */}
          <div className={`flex items-center gap-1 h-4 mb-2 transition-opacity ${rippleActive ? 'opacity-100' : 'opacity-0'}`}>
            <span className="w-1 bg-primary rounded-full animate-pulse h-2" />
            <span className="w-1 bg-primary rounded-full animate-pulse h-4" />
            <span className="w-1 bg-primary rounded-full animate-pulse h-4" />
            <span className="w-1 bg-primary rounded-full animate-pulse h-3" />
            <span className="w-1 bg-primary rounded-full animate-pulse h-2" />
          </div>

          {/* Speed buttons */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 w-full max-w-xs">
            <button onClick={() => handlePlay(0.9)}
              className="flex-1 py-1.5 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation">
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              <span>Chuẩn (1.0x)</span>
            </button>
            <button onClick={() => handlePlay(0.6)}
              className="flex-1 py-1.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-bold border border-outline-variant/30 flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation">
              <span>🐢</span>
              <span>Chậm (0.6x)</span>
            </button>
          </div>

          {/* Phonetic + hint controls */}
          <div className="mt-2 flex flex-col items-center gap-1">
            <p className={`text-on-surface-variant font-mono text-xs sm:text-sm transition-opacity ${phoneticVisible ? 'opacity-100' : 'opacity-0'}`}>
              {d.phonetic ? `/${d.phonetic}/` : ''}
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-center mt-1">
              <button
                onClick={handleRevealHint}
                disabled={hintLevel >= Math.max(1, totalLetters - 1) || !!submitted}
                className="text-primary font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-primary/10 border border-primary/25 bg-primary/5 px-3 py-1.5 rounded-xl transition-all active:scale-95 touch-manipulation shadow-sm disabled:opacity-40">
                <span className="material-symbols-outlined text-[16px]">tips_and_updates</span>
                <span>Gợi ý ({hintLevel}/{totalLetters})</span>
              </button>
              <button
                onClick={() => setShowMeaning(m => !m)}
                className="text-on-surface-variant hover:text-on-surface text-xs font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-[15px]">lightbulb</span>
                <span>Xem nghĩa</span>
              </button>
            </div>
            {showMeaning && (
              <div className="text-xs text-primary font-medium bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 mt-1">
                Nghĩa: <strong>{d.meaning}</strong>
              </div>
            )}
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
                      data-listen-index={flatIdx}
                      className={inputClass(flatIdx)}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      onFocus={e => e.target.select()}
                      onClick={e => e.target.select()}
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

        <p className="text-[11px] text-outline text-center mt-1 mb-3">
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
            <span>Kiểm tra đáp án</span>
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
