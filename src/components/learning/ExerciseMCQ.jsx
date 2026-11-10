// src/components/learning/ExerciseMCQ.jsx
// 4-Type Multiple-Choice Quiz Component with 2x2 Responsive Grid Layout & Interactive Audio UX
// Supports:
//   1. meaning_to_word: Vietnamese meaning in prompt -> 4 English words in 2x2 grid
//   2. audio_to_word: Auto-play word audio after 300ms, masked "???", speed controls, Spacebar shortcut
//   3. word_to_audio: Target word in prompt -> 4 audio cards with inline preview speaker buttons
//   4. sentence_cloze: Example sentence with highlighted blank badge & Vietnamese hint -> 4 English words

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Lightbulb } from 'lucide-react';
import ExerciseResultModal from './ExerciseResultModal.jsx';

function renderClozeSentence(sentence, placeholder = '____') {
  if (!sentence) return null;
  if (sentence.includes('___') || sentence.includes('---')) {
    const parts = sentence.split(/_{2,}|-{2,}/);
    return (
      <>
        {parts[0]}
        <span className="inline-block px-2 sm:px-3 py-0.5 mx-1 bg-amber-100 text-amber-900 font-mono font-bold rounded-lg border-2 border-dashed border-amber-400 text-sm sm:text-base align-baseline">
          ____
        </span>
        {parts.slice(1).join('')}
      </>
    );
  }
  return sentence;
}

export default function ExerciseMCQ({ item, onSubmit, onNext, onReport, sessionInfo }) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [result, setResult] = useState(null); // { correct, correctIndex }
  const [showResultModal, setShowResultModal] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [isPlayingPromptAudio, setIsPlayingPromptAudio] = useState(false);
  const [playingOptionIdx, setPlayingOptionIdx] = useState(null);

  const d = item?.exerciseData || {};
  const subtype = d.subtype || d.type || item?.exerciseSubtype || 'meaning_to_word';

  const currentNum = sessionInfo?.currentNum ?? 1;
  const totalNum = sessionInfo?.totalNum ?? 10;

  const targetWordText =
    d.prompt?.audioWord ||
    d.targetWord?.word ||
    item?.word?.word ||
    (d.word && d.word !== '???' ? d.word : '') ||
    '';

  // Stop all active audio engines (single-audio concurrency)
  const stopAllAudio = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (window.HiAudio?.stop) {
        try {
          window.HiAudio.stop();
        } catch (_) {}
      }
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
        window._activeUtterance = null;
      }
    }
    setIsPlayingPromptAudio(false);
    setPlayingOptionIdx(null);
  }, []);

  // Universal word speech synthesizer with completion callback
  const playWordText = useCallback(
    (word, rate = 1.0, onEndCallback = null) => {
      if (!word) return;
      stopAllAudio();

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        onEndCallback?.();
      };

      if (typeof window !== 'undefined' && window.HiAudio?.playWord) {
        try {
          window.HiAudio.playWord(word, rate);
          const estDuration = Math.max(700, Math.min(2500, ((word.length / 5) * 800) / rate));
          setTimeout(finish, estDuration);
          return;
        } catch (_) {}
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          if (window.speechSynthesis.paused) window.speechSynthesis.resume();
          if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(word);
          u.lang = 'en-US';
          u.rate = rate;
          window._activeUtterance = u;
          u.onend = () => {
            if (window._activeUtterance === u) window._activeUtterance = null;
            finish();
          };
          u.onerror = () => {
            if (window._activeUtterance === u) window._activeUtterance = null;
            finish();
          };
          window.speechSynthesis.speak(u);
          return;
        } catch (_) {
          finish();
        }
      }

      finish();
    },
    [stopAllAudio]
  );

  const playPromptAudio = useCallback(
    (rate = audioSpeed) => {
      const word = targetWordText;
      if (!word) return;
      setIsPlayingPromptAudio(true);
      playWordText(word, rate, () => {
        setIsPlayingPromptAudio(false);
      });
    },
    [targetWordText, audioSpeed, playWordText]
  );

  // Reset when new item appears
  useEffect(() => {
    setSelectedIdx(null);
    setResult(null);
    setShowResultModal(false);
    stopAllAudio();
  }, [item?.word?.id || item?.word?.wordId, currentNum, stopAllAudio]);

  // Type 2: Auto-play audio after 300ms using target word
  useEffect(() => {
    if (subtype === 'audio_to_word' && targetWordText && !showResultModal && result === null) {
      const timer = setTimeout(() => {
        playPromptAudio(audioSpeed);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [subtype, targetWordText, currentNum, item?.word?.id]);

  // Instant Check on Option Click
  const handleSelect = useCallback(
    (idx) => {
      if (result !== null) return; // Prevent double taps
      stopAllAudio();
      setSelectedIdx(idx);
      const correctIndex = d.options?.findIndex((o) => o.isCorrect) ?? -1;
      const r = onSubmit(idx);
      setResult({ ...r, correctIndex });
      setShowResultModal(true);
    },
    [result, d.options, onSubmit, stopAllAudio]
  );

  // Type 3: Inline preview speaker button (stops event propagation so option is NOT selected)
  const handleOptionAudioPlay = useCallback(
    (e, optIndex, optAudioWord) => {
      e.stopPropagation();
      if (playingOptionIdx === optIndex) {
        stopAllAudio();
        return;
      }
      setPlayingOptionIdx(optIndex);
      playWordText(optAudioWord, 0.9, () => {
        setPlayingOptionIdx((curr) => (curr === optIndex ? null : curr));
      });
    },
    [playingOptionIdx, stopAllAudio, playWordText]
  );

  // Keyboard shortcut: 1-4 immediately selects & checks that option; Spacebar replays audio in audio_to_word
  useEffect(() => {
    function handleKey(e) {
      if (showResultModal || result !== null) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if ((e.key === ' ' || e.code === 'Space') && subtype === 'audio_to_word') {
        e.preventDefault();
        playPromptAudio(audioSpeed);
        return;
      }

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= (d.options?.length || 4)) {
        e.preventDefault();
        handleSelect(num - 1);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showResultModal, result, d.options, handleSelect, subtype, playPromptAudio, audioSpeed]);

  const handleModalContinue = useCallback(() => {
    stopAllAudio();
    setShowResultModal(false);
    setSelectedIdx(null);
    setResult(null);
    onNext?.();
  }, [onNext, stopAllAudio]);

  const chosenOption = selectedIdx !== null ? d.options?.[selectedIdx]?.text : '';
  const correctOption =
    result?.correctIndex !== undefined && result.correctIndex >= 0
      ? d.options?.[result.correctIndex]?.text
      : '';

  return (
    <div className="w-full flex flex-col items-center justify-center select-none font-comfortaa my-auto px-2">
      {/* ── Main Question & Options Card ── */}
      <div
        className="w-full max-w-xl bg-white border-[3px] border-[#292524] rounded-[24px] sm:rounded-[30px] shadow-[4px_6px_0px_#292524] px-4 sm:px-6 pt-4 sm:pt-5 pb-5 sm:pb-6 relative my-auto max-h-[calc(100dvh-130px)] overflow-y-auto no-scrollbar"
        data-purpose="mcq-card"
      >
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
              className="min-h-[44px] min-w-[44px] px-2.5 py-2 flex items-center justify-center text-stone-400 hover:text-stone-700 text-xs transition cursor-pointer rounded-xl hover:bg-stone-50"
              title="Báo cáo lỗi câu này"
              aria-label="Báo cáo lỗi câu này"
            >
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Báo lỗi
              </span>
            </button>
          )}
        </div>

        {/* ── Question Prompt Header (Subtype-Aware) ── */}
        <div className="text-center pt-0.5 pb-2">
          {/* Question instruction label */}
          <p className="font-crayon text-base sm:text-lg text-stone-600 tracking-wide font-semibold">
            {subtype === 'meaning_to_word'
              ? (d.question || 'Chọn từ tiếng Anh phù hợp với nghĩa:')
              : subtype === 'audio_to_word'
              ? (d.question || 'Nghe phát âm và chọn đáp án chính xác:')
              : subtype === 'word_to_audio'
              ? (d.question || 'Nghe các lựa chọn và tìm phát âm đúng của từ:')
              : subtype === 'sentence_cloze'
              ? (d.question || 'Chọn từ thích hợp để điền vào chỗ trống:')
              : (d.question || (
                  <>
                    Chọn nghĩa <span className="text-[#D36135] underline decoration-wavy decoration-stone-400">đúng</span> của
                  </>
                ))}
          </p>

          {/* Subtype 1: Vietnamese Meaning -> English Word */}
          {subtype === 'meaning_to_word' && (
            <div className="flex flex-col items-center justify-center my-1 sm:my-2 px-2 text-center">
              <div className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-1">
                Nghĩa tiếng Việt {d.prompt?.hint || (d.pos ? `• ${d.pos}` : '')}
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-stone-900 font-rounded max-w-lg leading-snug">
                "{d.prompt?.text || d.meaning || item?.word?.meaning || 'Chưa có nghĩa'}"
              </h1>
            </div>
          )}

          {/* Subtype 2: Audio -> English Word (Word masked as "???", Replay Button & Speed Toggles) */}
          {subtype === 'audio_to_word' && (
            <div className="flex flex-col items-center justify-center my-1 sm:my-2">
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => playPromptAudio(audioSpeed)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-sky-400 via-[#3A82EE] to-blue-600 border-[2.5px] border-[#292524] shadow-[2px_3px_0px_#292524] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all cursor-pointer group shrink-0 min-h-[44px] min-w-[44px] ${
                    isPlayingPromptAudio ? 'scale-105 ring-4 ring-sky-200' : ''
                  }`}
                  title="Bấm hoặc nhấn Space để nghe lại"
                  aria-label="Nghe lại phát âm"
                >
                  <svg
                    className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-sm group-hover:scale-110 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4a2 2 0 00-2 2v5a2 2 0 002 2h2.44l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.5 12A6.49 6.49 0 0017 7.75a1 1 0 10-1.414 1.414A4.49 4.49 0 0116.5 12c0 1.2-.47 2.29-1.236 3.107a1 1 0 101.442 1.386A6.49 6.49 0 0018.5 12zm3 0c0-3.32-1.72-6.24-4.32-7.9a1 1 0 10-1.08 1.68 7.48 7.48 0 013.4 6.22c0 2.54-1.26 4.79-3.18 6.13a1 1 0 101.16 1.63A9.48 9.48 0 0021.5 12z" />
                  </svg>
                </button>

                <div className="flex flex-col items-start justify-center">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-widest text-stone-800 font-mono">
                    🔊 "???"
                  </span>
                  <span className="text-[11px] sm:text-xs text-stone-500 font-crayon">
                    Nhấn nút hoặc phím [Space]
                  </span>
                </div>
              </div>

              {/* Speed controls */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAudioSpeed(1.0);
                    playPromptAudio(1.0);
                  }}
                  className={`px-2.5 py-0.5 rounded-full border-2 border-[#292524] flex items-center font-bold text-[11px] sm:text-xs transition-all shadow-[1px_1.5px_0px_#292524] active:translate-y-0.5 cursor-pointer min-h-[30px] ${
                    audioSpeed === 1.0
                      ? 'bg-blue-50 text-blue-700 border-blue-600'
                      : 'bg-white text-stone-800 hover:bg-stone-50'
                  }`}
                >
                  1.0x
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAudioSpeed(0.8);
                    playPromptAudio(0.8);
                  }}
                  className={`px-2.5 py-0.5 rounded-full border-2 border-[#292524] flex items-center font-bold text-[11px] sm:text-xs transition-all shadow-[1px_1.5px_0px_#292524] active:translate-y-0.5 cursor-pointer min-h-[30px] ${
                    audioSpeed === 0.8
                      ? 'bg-amber-50 text-amber-800 border-amber-600'
                      : 'bg-white text-stone-800 hover:bg-stone-50'
                  }`}
                >
                  0.8x (Chậm)
                </button>
              </div>
            </div>
          )}

          {/* Subtype 3: Word -> Correct Audio (Word displayed, Audio preview on options) */}
          {subtype === 'word_to_audio' && (
            <div className="text-center pt-0.5 pb-1">
              <div className="flex items-center justify-center gap-2 mt-0.5">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-stone-900 font-rounded">
                  "{d.word || targetWordText}"
                </h1>
              </div>
              {(d.phonetic || d.pos) && (
                <p className="text-stone-500 font-crayon text-xs sm:text-sm mt-0.5 tracking-wider">
                  {d.phonetic ? `/${d.phonetic}/` : ''} {d.pos ? `• ${d.pos}` : ''}
                </p>
              )}
              {d.prompt?.meaning && (
                <p className="text-stone-600 font-quicksand text-xs sm:text-sm mt-0.5 italic">
                  "{d.prompt.meaning}"
                </p>
              )}
            </div>
          )}

          {/* Subtype 4: Sentence Cloze Blank -> English Word */}
          {subtype === 'sentence_cloze' && (
            <div className="flex flex-col items-center justify-center my-1 sm:my-2 px-2 text-center">
              <div className="bg-amber-50/70 border-2 border-stone-200 rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 w-full max-w-md shadow-2xs">
                <p className="text-base sm:text-lg text-stone-800 font-medium leading-relaxed">
                  {renderClozeSentence(d.sentence || d.prompt?.text, d.blankPlaceholder)}
                </p>
              </div>
              {(d.prompt?.meaningHint || d.meaning || item?.word?.meaning) && (
                <p className="text-xs sm:text-sm text-stone-500 font-crayon mt-1.5 tracking-wide">
                  Gợi ý: "{d.prompt?.meaningHint || d.meaning || item?.word?.meaning}"
                </p>
              )}
            </div>
          )}

          {/* Default Legacy Fallback */}
          {subtype !== 'meaning_to_word' &&
            subtype !== 'audio_to_word' &&
            subtype !== 'word_to_audio' &&
            subtype !== 'sentence_cloze' && (
              <div className="flex items-center justify-center gap-2 mt-0.5">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-stone-900 font-rounded">
                  "{d.word || targetWordText}"
                </h1>
                <button
                  type="button"
                  onClick={() => playPromptAudio(audioSpeed)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#E4EFF5] hover:bg-[#D4E6F1] active:scale-95 border-2 border-[#292524] text-[#253E56] flex items-center justify-center transition shadow-2xs cursor-pointer shrink-0"
                  title="Nghe phát âm chuẩn IPA"
                  aria-label="Nghe phát âm chuẩn IPA"
                >
                  <svg className="w-5 h-5 text-[#253E56]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
        </div>

        {/* ── 2x2 Responsive Options Grid Container ── */}
        <div
          className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3 my-2"
          role="radiogroup"
          aria-label="Đáp án trắc nghiệm"
          data-purpose="mcq-options-grid"
        >
          {(d.options || []).map((opt, idx) => {
            const isSelected = selectedIdx === idx;
            const isCorrect = idx === result?.correctIndex;
            const isWrong = isSelected && result && !result.correct;

            let cardClasses =
              'group relative flex items-center justify-between min-h-[50px] sm:min-h-[56px] h-full px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl border-2 transition-all cursor-pointer select-none ';

            if (!result) {
              cardClasses +=
                'border-[#292524] bg-white hover:bg-[#FAF7EE] hover:-translate-y-0.5 shadow-2xs active:scale-[0.99]';
            } else {
              if (isCorrect) {
                cardClasses +=
                  'border-[#16A34A] bg-[#DCFCE7] text-[#15803D] font-bold shadow-[2px_3px_0px_#16A34A] border-[2.5px] scale-[1.01]';
              } else if (isWrong) {
                cardClasses +=
                  'border-[#EF4444] bg-[#FEE2E2] text-[#B91C1C] font-bold shadow-[2px_3px_0px_#EF4444] border-[2.5px]';
              } else {
                cardClasses += 'border-stone-200 bg-stone-50 opacity-50';
              }
            }

            const badgeLabel = opt.label || (idx + 1);

            return (
              <div
                key={opt.id || idx}
                onClick={() => handleSelect(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(idx);
                  }
                }}
                className={cardClasses}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
              >
                <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0 pr-1">
                  {/* Number / Letter circular badge */}
                  <span
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 font-black text-xs flex items-center justify-center shrink-0 transition-colors ${
                      isCorrect
                        ? 'bg-[#16A34A] text-white border-[#16A34A]'
                        : isWrong
                        ? 'bg-[#EF4444] text-white border-[#EF4444]'
                        : 'bg-stone-100 border-stone-300 text-stone-600 group-hover:border-stone-700'
                    }`}
                  >
                    {badgeLabel}
                  </span>

                  {/* Option text */}
                  <span
                    className={`text-xs sm:text-sm md:text-base font-quicksand break-words line-clamp-2 sm:line-clamp-3 text-left leading-snug flex-1 min-w-0 ${
                      isCorrect || isWrong ? 'font-bold' : 'font-semibold text-stone-800'
                    }`}
                  >
                    {opt.text}
                  </span>
                </div>

                {/* Status / Inline Preview Controls */}
                <div className="shrink-0 flex items-center justify-center pl-1">
                  {subtype === 'word_to_audio' && !result && (
                    <button
                      type="button"
                      onClick={(e) => handleOptionAudioPlay(e, idx, opt.audioWord || opt.text)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] rounded-full border-2 border-[#292524] flex items-center justify-center transition-all cursor-pointer shrink-0 z-10 ${
                        playingOptionIdx === idx
                          ? 'bg-amber-400 text-stone-900 scale-105 shadow-xs ring-2 ring-amber-300'
                          : 'bg-[#F4F7F9] hover:bg-[#E5EEF3] text-stone-800 shadow-[1px_1.5px_0px_#292524] active:scale-95'
                      }`}
                      title={`Nghe phát âm ${opt.label || opt.text}`}
                      aria-label={`Nghe phát âm ${opt.label || opt.text}`}
                    >
                      {playingOptionIdx === idx ? (
                        <span className="flex items-center gap-0.5 px-1">
                          <span className="w-1 h-3 bg-stone-900 rounded-full animate-bounce"></span>
                          <span className="w-1 h-4 bg-stone-900 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                          <span className="w-1 h-2 bg-stone-900 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                        </span>
                      ) : (
                        <svg className="w-4 h-4 text-stone-800" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4a2 2 0 00-2 2v5a2 2 0 002 2h2.44l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.5 12A6.49 6.49 0 0017 7.75a1 1 0 10-1.414 1.414A4.49 4.49 0 0116.5 12c0 1.2-.47 2.29-1.236 3.107a1 1 0 101.442 1.386A6.49 6.49 0 0018.5 12zm3 0c0-3.32-1.72-6.24-4.32-7.9a1 1 0 10-1.08 1.68 7.48 7.48 0 013.4 6.22c0 2.54-1.26 4.79-3.18 6.13a1 1 0 101.16 1.63A9.48 9.48 0 0021.5 12z" />
                        </svg>
                      )}
                    </button>
                  )}

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
      <div className="w-full max-w-xl mt-2 flex items-center justify-between px-2 text-stone-500 font-crayon text-xs">
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="px-1.5 py-0.2 bg-white border border-stone-300 rounded text-[11px] font-sans text-stone-700 font-bold">
            1 - 4
          </span>
          <span>chọn &amp; kiểm tra tức thì</span>
          {subtype === 'audio_to_word' && (
            <>
              <span className="ml-2 px-1.5 py-0.2 bg-white border border-stone-300 rounded text-[11px] font-sans text-stone-700 font-bold">
                Space
              </span>
              <span>nghe lại</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 text-stone-600 ml-auto">
          <Lightbulb className="w-4 h-4 inline shrink-0" />
          <span>
            {d.rootHint || (targetWordText ? `Từ gồm ${targetWordText.length} ký tự` : '')}
          </span>
        </div>
      </div>

      {/* ── Modern Bottom Sheet Result Notification Modal ── */}
      <ExerciseResultModal
        isOpen={showResultModal}
        isCorrect={!!result?.correct}
        word={targetWordText || d.word}
        phonetic={d.phonetic}
        pos={item?.word?.pos || d.pos}
        meaning={
          subtype === 'word_to_audio'
            ? (d.prompt?.meaning || item?.word?.meaning || d.meaning)
            : (correctOption || d.meaning)
        }
        exampleSentence={item?.word?.example_sentence || item?.word?.exampleSentence || d.sentence}
        notes={item?.word?.notes || d.notes}
        userAnswer={chosenOption}
        onContinue={handleModalContinue}
        onReport={onReport}
      />
    </div>
  );
}
