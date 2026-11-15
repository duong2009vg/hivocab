// src/components/learning/ExerciseHangman.jsx
// Crayon Sketchbook Hangman Vocabulary Game:
// - PC (lg+): Direct physical A-Z keyboard typing + compact tried-letter tracker
// - Mobile (<lg): Ring-bound portrait sketchbook with embedded QWERTY tap keyboard & floating golden hint bulb

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AlertTriangle, Crown, Flame, Lightbulb, Volume2, ArrowRight, Keyboard } from 'lucide-react';
import HangmanSketchbookSvg from './HangmanSketchbookSvg.jsx';
import {
  MAX_HANGMAN_WRONG,
  MAX_HANGMAN_HINTS,
  QWERTY_ROWS,
  normalizeHangmanChar,
  buildWordBlankParts,
  evaluateHangmanState,
  pickHangmanHintLetter,
} from './hangmanUtils.js';

function getBlankSlotSize(maxWordLen) {
  if (maxWordLen <= 5) return 'w-8 sm:w-9 pb-1 text-xl sm:text-2xl';
  if (maxWordLen <= 8) return 'w-7 sm:w-8 pb-1 text-lg sm:text-xl';
  if (maxWordLen <= 11) return 'w-6 sm:w-7 pb-0.5 text-base sm:text-lg';
  return 'w-5 sm:w-6 pb-0.5 text-sm sm:text-base';
}

function RingBinderHoles() {
  return (
    <div className="pointer-events-none flex items-center justify-between px-6 sm:px-9 -mt-5 mb-1 relative z-20">
      {[0, 1].map((idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="w-3 h-7 rounded-full bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 border-2 border-[#2B2523] shadow-[1px_2px_0px_#2B2523]" />
          <div className="w-4 h-4 -mt-2 rounded-full bg-[#4A2552] border-2 border-[#2B2523]" />
        </div>
      ))}
    </div>
  );
}

function QwertyKeyButton({ letter, state, disabled, compact = false, onGuess }) {
  // state: 'unused' | 'correct' | 'wrong'
  let btnClass = compact
    ? 'relative inline-flex items-center justify-center w-7 h-8 rounded-lg font-mono font-black text-xs transition-all select-none '
    : 'relative inline-flex items-center justify-center flex-1 max-w-[34px] h-9 sm:h-10 rounded-xl font-mono font-black text-base transition-all select-none ';

  if (state === 'correct') {
    btnClass +=
      'bg-white text-[#16A34A] border-2 border-[#22C55E] shadow-[0_2px_0_#16A34A] scale-[1.03] cursor-default';
  } else if (state === 'wrong') {
    btnClass += 'bg-[#EFE8D5]/75 text-stone-400 border border-stone-300/80 cursor-default';
  } else {
    btnClass += disabled
      ? 'bg-transparent text-stone-400 cursor-default'
      : compact
        ? 'bg-white hover:bg-amber-50 text-[#2B2523] border border-stone-300 shadow-[0_1.5px_0_#2B2523] active:translate-y-0.5 cursor-pointer'
        : 'bg-transparent hover:bg-amber-100/70 active:bg-amber-200/80 text-[#2B2523] active:scale-95 cursor-pointer';
  }

  return (
    <button
      type="button"
      disabled={disabled || state !== 'unused'}
      onClick={() => onGuess(letter)}
      aria-label={`Đoán chữ ${letter}`}
      className={btnClass}
    >
      <span className={state === 'wrong' ? 'opacity-65' : ''}>{letter}</span>
      {state === 'wrong' && (
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full p-1 text-[#2B2523]"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <line x1="18" y1="4" x2="6" y2="20" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

export default function ExerciseHangman({
  item,
  onSubmit,
  onNext,
  speakWord,
  onReport,
  streak = 0,
  bestStreak = 0,
  onStreakResult,
}) {
  const d = item?.exerciseData || {};
  const answer = (d.answer || item?.word?.word || '').trim();
  const meaning = d.meaning || item?.word?.meaning || '...';
  const wordPos = item?.word?.pos || d.pos || '';
  const phonetic = d.phonetic || item?.word?.phonetic || '';

  const wordParts = useMemo(() => buildWordBlankParts(answer), [answer]);
  const maxWordLen = useMemo(() => Math.max(...wordParts.map((p) => p.length), 1), [wordParts]);
  const slotSizeClass = getBlankSlotSize(maxWordLen);

  const [guessedLetters, setGuessedLetters] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [shakeTrigger, setShakeTrigger] = useState(false);

  const roundSubmittedRef = useRef(false);

  // Reset per question key
  useEffect(() => {
    setGuessedLetters([]);
    setHintsUsed(0);
    setShakeTrigger(false);
    roundSubmittedRef.current = false;
  }, [answer, item?.word?.id, item?.word?.wordId]);

  const gameState = useMemo(
    () => evaluateHangmanState(answer, guessedLetters, MAX_HANGMAN_WRONG),
    [answer, guessedLetters]
  );

  const { status, wrongCount, remainingLives, uniqueTarget } = gameState;
  const isPlaying = status === 'playing';
  const targetSet = useMemo(() => new Set(uniqueTarget), [uniqueTarget]);
  const guessedSet = useMemo(() => new Set(guessedLetters), [guessedLetters]);
  const hintsLeft = Math.max(0, MAX_HANGMAN_HINTS - hintsUsed);

  const playPronunciation = useCallback(() => {
    if (!answer) return;
    try {
      if (speakWord) {
        speakWord(answer, 0.9);
      } else if (window.HiAudio?.playWord) {
        window.HiAudio.playWord(answer, 0.9);
      } else if ('speechSynthesis' in window) {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(answer);
        u.lang = 'en-US';
        u.rate = 0.9;
        window._activeUtterance = u;
        window.speechSynthesis.speak(u);
      }
    } catch (_) {}
  }, [answer, speakWord]);

  // Finalize round once on win or loss
  useEffect(() => {
    if (status === 'playing' || roundSubmittedRef.current) return;
    roundSubmittedRef.current = true;
    const won = status === 'won';
    onSubmit?.(won ? answer : '__HANGMAN_MISS__');
    onStreakResult?.(won);
    const t = setTimeout(() => playPronunciation(), 420);
    return () => clearTimeout(t);
  }, [status, answer, onSubmit, onStreakResult, playPronunciation]);

  const handleGuessLetter = useCallback(
    (rawLetter) => {
      if (!isPlaying) return;
      const letter = normalizeHangmanChar(rawLetter);
      if (!letter || guessedSet.has(letter)) return;

      setGuessedLetters((prev) => (prev.includes(letter) ? prev : [...prev, letter]));

      if (!targetSet.has(letter)) {
        setShakeTrigger(true);
        setTimeout(() => setShakeTrigger(false), 320);
      }
    },
    [isPlaying, guessedSet, targetSet]
  );

  const handleUseHint = useCallback(() => {
    if (!isPlaying || hintsLeft <= 0) return;
    const hintChar = pickHangmanHintLetter(answer, guessedLetters);
    if (!hintChar) return;
    setHintsUsed((h) => h + 1);
    setGuessedLetters((prev) => (prev.includes(hintChar) ? prev : [...prev, hintChar]));
  }, [isPlaying, hintsLeft, answer, guessedLetters]);

  const handleContinue = useCallback(() => {
    if (isPlaying) return;
    onNext?.();
  }, [isPlaying, onNext]);

  // Physical Keyboard Listener (Primary UX for PC, also works with external tablet keyboards)
  useEffect(() => {
    function onKeyDown(e) {
      if (e.repeat) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.target?.closest?.('[role="dialog"]')) return;

      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        handleUseHint();
        return;
      }

      if (!isPlaying) {
        if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          handleContinue();
        }
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      let letter = normalizeHangmanChar(e.key);
      if (!letter && typeof e.code === 'string' && /^Key([A-Z])$/.test(e.code)) {
        letter = e.code.slice(3);
      }
      if (letter) {
        e.preventDefault();
        handleGuessLetter(letter);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPlaying, handleGuessLetter, handleUseHint, handleContinue]);

  const getKeyState = (letter) => {
    if (!guessedSet.has(letter)) return 'unused';
    return targetSet.has(letter) ? 'correct' : 'wrong';
  };

  // Render spaced blanks per word (supports multi-word phrases like "agree about")
  const renderWordBlanks = (compactMobile = false) => (
    <div
      className={`flex flex-wrap items-center justify-center ${
        wordParts.length > 1 ? 'gap-x-5 sm:gap-x-7 gap-y-2.5' : 'gap-x-3'
      }`}
    >
      {wordParts.map((chars, wi) => (
        <div key={wi} className="inline-flex flex-col items-center gap-1 shrink-0">
          <div className="inline-flex items-end gap-1 sm:gap-1.5 flex-nowrap">
            {chars.map((itemChar, ci) => {
              const isRevealed =
                !itemChar.isGuessable || guessedSet.has(itemChar.guessKey) || status === 'lost';
              const showRedLost = status === 'lost' && itemChar.isGuessable && !guessedSet.has(itemChar.guessKey);
              const showGreenWon = status === 'won' && itemChar.isGuessable;

              return (
                <div
                  key={ci}
                  className={`${
                    compactMobile ? 'w-6 sm:w-8 pb-0.5 text-lg sm:text-xl' : slotSizeClass
                  } text-center font-mono font-black leading-none border-b-[3px] transition-all duration-150 select-none ${
                    showRedLost
                      ? 'border-[#EF4444] text-[#EF4444]'
                      : showGreenWon
                        ? 'border-[#16A34A] text-[#16A34A]'
                        : isRevealed
                          ? 'border-[#2B2523] text-[#7C3AED]'
                          : 'border-[#2B2523] text-transparent'
                  }`}
                >
                  {isRevealed ? itemChar.displayChar : '_'}
                </div>
              );
            })}
          </div>
          {wordParts.length > 1 && (
            <span className="text-[10px] font-bold text-stone-400 font-quicksand leading-none">
              Từ {wi + 1} ({chars.filter((c) => c.isGuessable).length} chữ)
            </span>
          )}
        </div>
      ))}
    </div>
  );

  // Render win/loss resolution ribbon cleanly without covering the Hangman canvas
  const renderRoundOutcomeBanner = () => {
    if (isPlaying) return null;
    const isWon = status === 'won';

    return (
      <div
        className={`w-full rounded-2xl border-2 border-[#2B2523] px-3.5 py-2.5 shadow-[2px_3px_0px_#2B2523] flex flex-col sm:flex-row items-center justify-between gap-2.5 ${
          isWon ? 'bg-[#EEF8EC] text-[#1E5629]' : 'bg-[#FDF0ED] text-[#9F2D19]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={playPronunciation}
            title="Nghe phát âm"
            className="w-9 h-9 rounded-full bg-white border-2 border-[#2B2523] flex items-center justify-center text-[#2B2523] hover:scale-105 active:scale-95 transition shrink-0 cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <div className="min-w-0 text-left">
            <div className="font-extrabold text-xs sm:text-sm truncate">
              {isWon ? 'Chuẩn xác! +1 chuỗi thắng 🎉' : `Hết lượt! Đáp án: ${answer.toUpperCase()}`}
            </div>
            <div className="text-[11px] font-semibold opacity-85 truncate">
              {phonetic ? `/${phonetic}/ • ` : ''}
              {meaning}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          className={`w-full sm:w-auto px-4 py-2 rounded-xl border-2 border-[#2B2523] font-bold text-xs sm:text-sm shadow-[1.5px_2px_0px_#2B2523] flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition active:translate-y-0.5 ${
            isWon
              ? 'bg-[#1DB954] hover:bg-[#199e47] text-white'
              : 'bg-[#243A5E] hover:bg-[#1B2C47] text-white'
          }`}
        >
          <span>Từ tiếp theo</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center justify-center select-none font-comfortaa px-2 py-1">
      {/* ── Top Streak HUD + Report (Matches Reference Screenshots + Crayon Style) ── */}
      <div className="w-full max-w-md lg:max-w-3xl flex items-center justify-between gap-2 mb-2.5 px-1">
        <div className="flex items-center gap-2">
          {/* CURRENT STREAK */}
          <div className="bg-[#1F2937] text-white px-3 py-1 rounded-xl border-2 border-[#2B2523] shadow-[2px_2px_0px_#2B2523] flex flex-col items-center min-w-[88px]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300 leading-none">
              Chuỗi đúng
            </span>
            <span className="text-sm sm:text-base font-black text-amber-300 leading-tight inline-flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              {streak}
            </span>
          </div>

          {/* ALL TIME BEST STREAK */}
          <div className="relative bg-[#1F2937] text-white px-3 py-1 rounded-xl border-2 border-[#2B2523] shadow-[2px_2px_0px_#2B2523] flex flex-col items-center min-w-[82px]">
            <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-2 left-1/2 -translate-x-1/2 fill-amber-400 drop-shadow-xs" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 leading-none mt-0.5">
              Kỷ lục
            </span>
            <span className="text-sm sm:text-base font-black text-emerald-400 leading-tight">
              {bestStreak}
            </span>
          </div>
        </div>

        {/* Right: Remaining Lives + Optional Report */}
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border-2 border-[#2B2523] shadow-[1.5px_1.5px_0px_#2B2523] ${
              remainingLives <= 3 ? 'bg-red-100 text-red-700' : 'bg-white text-stone-800'
            }`}
          >
            Lượt: {remainingLives}/{MAX_HANGMAN_WRONG}
          </span>
          {onReport && (
            <button
              type="button"
              onClick={onReport}
              className="p-1.5 rounded-full bg-white hover:bg-stone-100 border-2 border-[#2B2523] text-stone-500 hover:text-stone-800 cursor-pointer shadow-[1.5px_1.5px_0px_#2B2523]"
              title="Báo cáo câu hỏi"
              aria-label="Báo cáo câu hỏi"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MOBILE PORTRAIT SKETCHBOOK (Faithful to uploaded screenshots + Crayon) */}
      {/* ===================================================================== */}
      <div
        className={`block lg:hidden w-full max-w-[390px] relative mb-6 ${
          shakeTrigger ? 'animate-pulse' : ''
        }`}
      >
        <div className="bg-[#8B5A96] border-[3px] border-[#2B2523] rounded-[26px] shadow-[4px_6px_0px_#2B2523] p-2 pt-3 pb-3">
          <div className="bg-[#FFFDF4] border-2 border-[#2B2523] border-b-[5px] border-b-[#EAE1C8] rounded-[20px] px-2.5 pt-2 pb-7 relative">
            <RingBinderHoles />

            {/* Compact Meaning Clue inside paper */}
            <div className="text-center mb-1 px-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-[11px] font-bold text-stone-700 max-w-full">
                {wordPos && (
                  <span className="px-1.5 py-0.2 rounded bg-white border border-stone-300 text-[10px] text-stone-700 shrink-0">
                    {wordPos}
                  </span>
                )}
                <span className="truncate">{meaning}</span>
              </div>
            </div>

            {/* Gallows & Hills Illustration */}
            <HangmanSketchbookSvg
              wrongCount={wrongCount}
              status={status}
              className="w-full h-36 mx-auto"
            />

            {/* Spaced Word Blanks */}
            <div className="my-2 px-1 flex justify-center">{renderWordBlanks(true)}</div>

            {/* Outcome Ribbon OR Embedded 3-Row QWERTY Tap Keyboard */}
            {!isPlaying ? (
              <div className="mt-3">{renderRoundOutcomeBanner()}</div>
            ) : (
              <div className="mt-3 flex flex-col gap-1.5">
                {QWERTY_ROWS.map((row, ri) => (
                  <div key={ri} className="flex items-center justify-center gap-1">
                    {row.map((letter) => (
                      <QwertyKeyButton
                        key={letter}
                        letter={letter}
                        state={getKeyState(letter)}
                        disabled={!isPlaying}
                        onGuess={handleGuessLetter}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Floating Golden Lightbulb Hint Button on Bottom Edge */}
            {isPlaying && (
              <button
                type="button"
                onClick={handleUseHint}
                disabled={hintsLeft <= 0}
                title={hintsLeft > 0 ? `Gợi ý 1 chữ cái (còn ${hintsLeft})` : 'Đã hết lượt gợi ý'}
                aria-label="Gợi ý một chữ cái"
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-95 border-[3px] border-[#2B2523] shadow-[2px_3px_0px_#2B2523] flex items-center justify-center text-[#2B2523] cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed transition z-20"
              >
                <Lightbulb className="w-6 h-6 text-white fill-white drop-shadow-xs" />
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#1DB954] border-2 border-[#2B2523] text-[10px] font-black text-white leading-tight">
                  {hintsLeft}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* DESKTOP (PC) LAYOUT — Direct Keyboard Typing + Compact Crayon Card     */}
      {/* ===================================================================== */}
      <div
        className={`hidden lg:block w-full max-w-3xl relative mb-4 ${
          shakeTrigger ? 'animate-pulse' : ''
        }`}
      >
        <div className="bg-[#8B5A96] border-[3px] border-[#2B2523] rounded-[28px] shadow-[5px_7px_0px_#2B2523] p-2.5 pt-3.5">
          <div className="bg-[#FFFDF4] border-2 border-[#2B2523] rounded-[22px] px-6 pt-3 pb-5 relative">
            <RingBinderHoles />

            <div className="grid grid-cols-12 gap-5 items-center mt-1">
              {/* Left Canvas Column: Hangman Illustration */}
              <div className="col-span-5 bg-[#FFF9EB] border-2 border-[#2B2523]/20 rounded-2xl p-3 flex flex-col items-center">
                <HangmanSketchbookSvg
                  wrongCount={wrongCount}
                  status={status}
                  className="w-full h-48"
                />
                <span className="mt-1 text-xs font-bold text-stone-600">
                  Số nét sai: <span className="text-[#C81E2B]">{wrongCount}</span> / {MAX_HANGMAN_WRONG}
                </span>
              </div>

              {/* Right Gameplay Column: Meaning Clue + Blanks + PC Keyboard Indicator */}
              <div className="col-span-7 flex flex-col justify-between gap-3.5">
                {/* Meaning Clue Box */}
                <div className="bg-[#FAF5EB] border-2 border-[#2B2523] rounded-2xl px-4 py-2.5 shadow-[2px_2.5px_0px_#2B2523]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                        Gợi ý nghĩa
                      </span>
                      {wordPos && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-stone-700 border border-stone-300">
                          {wordPos}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3b6e8c]">
                      <Keyboard className="w-3.5 h-3.5" />
                      Gõ trực tiếp A–Z
                    </span>
                  </div>
                  <p className="text-base font-bold text-[#1e1b17] leading-snug select-text">{meaning}</p>
                </div>

                {/* Word Blanks (multi-word separated) */}
                <div className="py-2 flex justify-center">{renderWordBlanks(false)}</div>

                {/* Win/Loss Outcome OR Compact Tried-Letters QWERTY Tracker + Hint */}
                {!isPlaying ? (
                  renderRoundOutcomeBanner()
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Compact QWERTY Status Rows (instant visual feedback + optional click) */}
                    <div className="bg-white/75 border border-stone-200 rounded-2xl p-2 flex flex-col gap-1">
                      {QWERTY_ROWS.map((row, ri) => (
                        <div key={ri} className="flex items-center justify-center gap-1">
                          {row.map((letter) => (
                            <QwertyKeyButton
                              key={letter}
                              letter={letter}
                              state={getKeyState(letter)}
                              disabled={!isPlaying}
                              compact
                              onGuess={handleGuessLetter}
                            />
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Hint Pill & PC Shortcut Bar */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className="text-[11px] font-semibold text-stone-500 font-quicksand">
                        Gõ phím <kbd className="px-1.5 py-0.2 bg-stone-100 border border-stone-400 rounded text-[10px] font-mono">A–Z</kbd> để đoán •{' '}
                        <kbd className="px-1.5 py-0.2 bg-stone-100 border border-stone-400 rounded text-[10px] font-mono">Alt+H</kbd> gợi ý
                      </span>
                      <button
                        type="button"
                        onClick={handleUseHint}
                        disabled={hintsLeft <= 0}
                        className="px-3 py-1 rounded-full bg-amber-400 hover:bg-amber-300 border-2 border-[#2B2523] shadow-[1.5px_2px_0px_#2B2523] text-xs font-extrabold text-[#2B2523] flex items-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed transition active:translate-y-0.5 shrink-0"
                      >
                        <Lightbulb className="w-3.5 h-3.5 fill-white text-[#2B2523]" />
                        <span>Gợi ý ({hintsLeft})</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
