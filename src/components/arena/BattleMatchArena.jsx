// src/components/arena/BattleMatchArena.jsx
// Full-viewport Bleach vs Naruto (BVN) Match Arena:
// - Fluid flex-1 Live Canvas Stage (~58%-68%) + Overlaid FightBar HUD (HP + Mana/Qi Bar)
// - Auto-fitting Always-Visible Learning Dock (never clipped even on long sentences!)
// - Interactive ULTI button unlocked when Mana reaches 100%!
import React, { useEffect, useState } from 'react';
import { Volume2, CheckCircle2, XCircle, AlertTriangle, X, Pause } from 'lucide-react';
import {
  BATTLE_EMOTES,
  BATTLE_POWERUPS,
  BATTLE_START_HP,
  getComboChainMeta,
  getModeMeta,
} from '../../utils/battleEngine.js';
import { QWERTY_ROWS, normalizeHangmanChar } from '../learning/hangmanUtils.js';
import { getCharacterById, getOpponentCharacter, getStageById } from './CharacterRoster.js';
import BvnBattleCanvas from './BvnBattleCanvas.jsx';
import BvnFaceImg from './BvnFaceImg.jsx';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

function BvnHpAndManaBar({
  hp,
  maxHp = BATTLE_START_HP,
  mana = 0,
  tone = 'p1',
  flip = false,
}) {
  const safeHp = Math.max(0, Number(hp) || 0);
  const pct = Math.max(0, Math.min(100, Math.round((safeHp / maxHp) * 100)));
  const isLow = pct > 0 && pct <= 25;

  // Real Mana / Qi Bar (0..100 -> 3 segments; 100% = ULTI READY!)
  const safeMana = Math.max(0, Math.min(100, Number(mana) || 0));
  const manaSegs = (safeMana / 100) * 3;
  const manaLv = Math.min(3, Math.floor(manaSegs));
  const ultiReady = safeMana >= 100;

  const mainFill = isLow
    ? 'bg-[#DC2626]'
    : tone === 'p1'
      ? 'bg-[#22C55E]'
      : 'bg-[#E66946]';

  return (
    <div className="space-y-0.5">
      {/* Skewed BVN Health Bar with delayed gold drain trail */}
      <div
        className={`w-full h-3 sm:h-3.5 bg-[#0B0E14] overflow-hidden relative ${
          flip ? 'bvn-hp-skew-flip' : 'bvn-hp-skew'
        }`}
      >
        <div
          className={`absolute top-0 bottom-0 bg-[#FDE047] transition-[width] duration-700 ease-out delay-150 ${
            flip ? 'right-0' : 'left-0'
          }`}
          style={{ width: `${pct}%` }}
        />
        <div
          className={`relative h-full transition-[width] duration-200 ${mainFill} arena-hp-segments ${
            flip ? 'ml-auto' : ''
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* BVN Mana / Chakra / Reiatsu Bar (3 segments -> ULTI READY!) */}
      <div className={`flex items-center gap-1 ${flip ? 'flex-row-reverse' : ''}`}>
        <span
          className={`font-bvn text-[8.5px] font-bold shrink-0 ${
            ultiReady ? 'text-[#FDE047] animate-pulse' : 'text-[#38BDF8]'
          }`}
        >
          {ultiReady ? 'ULTI MAX' : `MANA ${Math.round(safeMana)}%`}
        </span>
        <div className={`flex-1 flex gap-0.5 ${flip ? 'flex-row-reverse' : ''}`}>
          {[0, 1, 2].map((segIdx) => {
            const segFill = Math.max(0, Math.min(1, manaSegs - segIdx)) * 100;
            return (
              <div
                key={segIdx}
                className={`flex-1 h-1.5 bg-[#0B0E14] rounded-xs border overflow-hidden ${
                  ultiReady ? 'border-[#FDE047]' : 'border-white/20'
                }`}
              >
                <div
                  className={`h-full transition-[width] duration-200 ${
                    ultiReady
                      ? 'bg-gradient-to-r from-[#F97316] via-[#FDE047] to-[#FFFDF7]'
                      : 'bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]'
                  }`}
                  style={{ width: `${segFill}%` }}
                />
              </div>
            );
          })}
        </div>
        <span className="font-bvn text-[8px] font-bold text-white/75 shrink-0">LV.{manaLv}</span>
        {isLow && (
          <span className="inline-flex items-center gap-0.5 text-[8.5px] font-black text-[#FCA5A5] shrink-0">
            <AlertTriangle className="w-2.5 h-2.5" />
            NGUY KỊCH
          </span>
        )}
      </div>
    </div>
  );
}

function renderPromptContent(promptText) {
  const parts = String(promptText || '...').split(/(__{3,})/g);
  if (parts.length <= 1) return promptText;
  return parts.map((part, idx) =>
    /^_{3,}$/.test(part) ? (
      <span
        key={idx}
        className="inline-block mx-1 px-2 py-0.5 rounded bg-[#FDF4DC] border-b-2 border-[#C44D2D] text-[#9A6A0F] font-mono font-black tracking-widest align-baseline"
      >
        ____
      </span>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}

function DockActionBar({ arena, myChar, layout = 'rail' }) {
  const self = arena.selfPlayer;
  const selfMana = Math.max(0, Math.min(100, Number(self?.mana) || 0));
  const ultiReady = selfMana >= 100;
  const powerups = BATTLE_POWERUPS.filter(
    (pu) => !(pu.id === 'fifty_fifty' && arena.selectedMode === 'flash_match')
  );

  if (layout === 'rail') {
    return (
      <div
        data-testid="bvn-action-rail"
        className="hidden md:flex flex-col justify-between gap-1.5 w-[134px] lg:w-[150px] shrink-0"
      >
        {ultiReady ? (
          <button
            type="button"
            data-testid="bvn-ulti-btn"
            onClick={() => arena.triggerUltimate(myChar.ultiName)}
            title={`Tung tuyệt chiêu mạnh nhất: ${myChar.ultiName} (-28 HP, +160 điểm) [Phím U]`}
            className="px-focus w-full px-2.5 py-2 rounded-lg border-2 border-[#0B0E14] bg-gradient-to-r from-[#E66946] via-[#F59E0B] to-[#FDE047] text-[#0B0E14] text-xs font-black shadow-[0_0_14px_rgba(245,158,11,0.75)] animate-pulse cursor-pointer hover:brightness-110 active:translate-y-0.5 text-center leading-tight"
          >
            ULTI · {myChar.shortName}
          </button>
        ) : (
          <div
            title="Trả lời đúng để nạp đầy 100% Mana và mở khóa nút Tung Ulti!"
            className="w-full px-2.5 py-1.5 rounded-lg border border-white/15 bg-[#1B202C] text-[#CBD5E1] select-none space-y-1"
          >
            <div className="flex items-center justify-between text-[10.5px] font-black">
              <span className="text-[#94A3B8]">ULTI</span>
              <span className="font-bvn text-[#38BDF8]">{Math.round(selfMana)}%</span>
            </div>
            <div className="w-full h-1 bg-[#0B0E14] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#38BDF8] transition-[width] duration-200"
                style={{ width: `${selfMana}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {powerups.map((pu) => {
            const count = self?.powerUps?.[pu.id] ?? 0;
            const disabled = count <= 0 || Boolean(arena.roundFeedback);
            const label = pu.id === 'fifty_fifty' ? '50/50' : pu.id === 'slow_audio' ? '0.75x' : 'x2 Đòn';
            return (
              <button
                key={pu.id}
                type="button"
                disabled={disabled}
                onClick={() => arena.usePowerUp(pu.id)}
                title={pu.desc}
                className={`px-focus w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border-2 text-xs font-black transition-all ${
                  disabled
                    ? 'bg-[#1D2230] border-white/10 text-white/35 cursor-not-allowed'
                    : 'px-btn px-btn-paper text-[#2D2824] cursor-pointer'
                }`}
              >
                <span>{label}</span>
                <span className="font-bvn text-[10px] font-bold bg-[#1B202C] text-[#F4D06F] px-1.5 py-0.5 rounded">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Mobile compact action strip — placed below the answers, aligned right
  return (
    <div
      data-testid="bvn-action-mobile"
      className="flex md:hidden items-center justify-end gap-1.5 pt-1 flex-wrap"
    >
      {ultiReady ? (
        <button
          type="button"
          data-testid="bvn-ulti-btn-mobile"
          onClick={() => arena.triggerUltimate(myChar.ultiName)}
          title={`Tung tuyệt chiêu mạnh nhất: ${myChar.ultiName} [Phím U]`}
          className="px-focus px-2.5 py-1 rounded-md border-2 border-[#0B0E14] bg-gradient-to-r from-[#E66946] via-[#F59E0B] to-[#FDE047] text-[#0B0E14] text-[10.5px] font-black shadow-[0_0_10px_rgba(245,158,11,0.75)] animate-pulse cursor-pointer"
        >
          ULTI!
        </button>
      ) : (
        <span className="px-2 py-1 rounded-md border border-white/15 bg-[#1B202C] text-[#94A3B8] text-[10px] font-black select-none">
          Ulti {Math.round(selfMana)}%
        </span>
      )}

      {powerups.map((pu) => {
        const count = self?.powerUps?.[pu.id] ?? 0;
        const disabled = count <= 0 || Boolean(arena.roundFeedback);
        const label = pu.id === 'fifty_fifty' ? '50/50' : pu.id === 'slow_audio' ? '0.75x' : 'x2';
        return (
          <button
            key={pu.id}
            type="button"
            disabled={disabled}
            onClick={() => arena.usePowerUp(pu.id)}
            title={pu.desc}
            className={`px-focus inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10.5px] font-black transition-all ${
              disabled
                ? 'bg-[#1D2230] border-white/10 text-white/35 cursor-not-allowed'
                : 'px-btn px-btn-paper text-[#2D2824] cursor-pointer'
            }`}
          >
            <span>{label}</span>
            <span className="font-bvn text-[9px] font-bold bg-[#1B202C] text-[#F4D06F] px-1 rounded">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SpeedOrAudioRound({ arena, myChar, disabledByPause }) {
  const q = arena.question;
  const feedback = arena.roundFeedback;
  const options = q?.options || [];
  const promptText = q?.promptTitle || '...';
  const isExtraLongPrompt = promptText.length > 90;
  const isMediumPrompt = promptText.length > 52;
  const subtitleText =
    q?.promptSubtitle && q.promptSubtitle !== 'Chọn từ tiếng Anh tương ứng' ? q.promptSubtitle : '';

  useEffect(() => {
    const onKey = (e) => {
      if (disabledByPause) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if ((e.key === 'u' || e.key === 'U') && (arena.selfPlayer?.mana || 0) >= 100) {
        e.preventDefault();
        arena.triggerUltimate(myChar.ultiName);
        return;
      }
      if (feedback) return;
      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx !== -1 && options[idx] && !arena.eliminatedOptions.includes(options[idx])) {
        e.preventDefault();
        arena.submitAnswer(options[idx]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [arena, disabledByPause, feedback, myChar.ultiName, options]);

  return (
    <div className="space-y-1.5 sm:space-y-2">
      {/* Dedicated Clean Question Card — 100% focused on question text */}
      <div className="px-panel px-panel-paper text-[#1B1714] px-3.5 py-2 sm:px-4 sm:py-2.5 flex items-start sm:items-center gap-2.5">
        {(q?.audioWord || q?.kind === 'audio_to_word') && (
          <button
            type="button"
            onClick={() => arena.speakWord(q.audioWord, 0.9)}
            className="px-btn px-btn-cerulean px-2.5 py-1 inline-flex items-center gap-1 cursor-pointer shrink-0 mt-0.5 sm:mt-0"
            title="Nghe phát âm"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-black">Nghe</span>
          </button>
        )}

        <div className="min-w-0 flex-1">
          <h2
            className={`text-[#1B1714] whitespace-normal break-words ${
              isExtraLongPrompt
                ? 'text-[13px] sm:text-[15px] leading-relaxed font-extrabold'
                : isMediumPrompt
                  ? 'text-sm sm:text-base leading-snug font-black'
                  : 'text-[15px] sm:text-lg leading-snug font-black'
            }`}
          >
            {renderPromptContent(promptText)}
          </h2>
          {subtitleText && (
            <p className="mt-0.5 text-[11.5px] sm:text-xs font-bold text-[#68594D] leading-snug whitespace-normal break-words">
              {subtitleText}
            </p>
          )}
        </div>

        {arena.doubleStrikeActive && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#F4D06F] border border-[#3D352E] text-[#2D2824] shrink-0">
            x2 Đòn
          </span>
        )}
      </div>

      {/* 2x2 Answer Grid — full text always visible, zero clipping */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {options.map((opt, idx) => {
          const isEliminated = arena.eliminatedOptions.includes(opt);
          const isCorrectChoice =
            feedback &&
            String(opt).trim().toLowerCase() === String(feedback.correctAnswer || '').trim().toLowerCase();

          let btnCls = 'px-btn px-btn-paper text-[#2D2824]';
          if (isEliminated) {
            btnCls =
              'bg-[#EFE8D8] border-2 border-[#C7BBA4] text-[#9E9386] opacity-45 cursor-not-allowed line-through rounded-[10px]';
          } else if (feedback) {
            if (isCorrectChoice) {
              btnCls =
                'bg-[#E7EFE3] border-[2.5px] border-[#4B6B46] text-[#2B4628] shadow-[0_3px_0_#4B6B46] rounded-[10px]';
            } else {
              btnCls = 'bg-[#FAF5EB]/75 border-2 border-[#D4C8B4] text-[#8E8377] rounded-[10px]';
            }
          }

          return (
            <button
              key={`${idx}-${opt}`}
              type="button"
              disabled={Boolean(feedback) || isEliminated}
              onClick={() => arena.submitAnswer(opt)}
              className={`px-focus px-2.5 sm:px-3 py-1.5 sm:py-2 min-h-[38px] sm:min-h-[42px] text-left flex items-center gap-2 cursor-pointer ${btnCls}`}
            >
              <span className="w-6 h-6 rounded-md bg-[#1B202C] text-[#F4D06F] border border-[#3D352E] text-[11px] font-black flex items-center justify-center shrink-0">
                {OPTION_LETTERS[idx] || idx + 1}
              </span>
              <span className="font-extrabold text-xs sm:text-[13.5px] leading-snug whitespace-normal break-words flex-1">
                {opt}
              </span>
              {feedback && isCorrectChoice && <CheckCircle2 className="w-4 h-4 text-[#4B6B46] shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WordDuelRound({ arena, disabledByPause }) {
  const q = arena.question;
  const feedback = arena.roundFeedback;
  const activeMask = arena.wordDuelMask || q?.pattern || '';
  const patternChars = String(activeMask).split('');
  const guessedSet = new Set(arena.wordDuelGuessed || []);
  const targetChars = feedback?.correctAnswer ? String(feedback.correctAnswer).toUpperCase().split('') : null;

  useEffect(() => {
    const onKeyDown = (e) => {
      if (feedback || disabledByPause) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      const letter = normalizeHangmanChar(e.key);
      if (letter && !guessedSet.has(letter)) {
        e.preventDefault();
        arena.submitWordDuelLetter(letter);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div className="space-y-1.5">
      <div className="px-panel px-panel-paper text-[#1B1714] px-3.5 py-2 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-black text-[#1B1714] leading-snug whitespace-normal break-words">
              {q?.meaning || '...'}
            </h2>
            {q?.phonetic && <p className="mt-0.5 text-[11px] font-bold text-[#68594D]">{q.phonetic}</p>}
          </div>
          <span className="text-[10.5px] font-black text-[#C44D2D] shrink-0 pt-0.5">
            {q?.letterCount || patternChars.length} chữ
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {(targetChars || patternChars).map((ch, idx) => {
            const revealed = Boolean(targetChars);
            const showChar = revealed ? ch : ch === '_' ? '' : ch;
            return (
              <div
                key={idx}
                className={`w-6 h-7 sm:w-7 sm:h-7 rounded border-2 border-[#3D352E] flex items-center justify-center font-mono text-xs sm:text-sm font-black ${
                  revealed
                    ? 'bg-[#E7EFE3] text-[#2B4628]'
                    : showChar
                      ? 'bg-[#FDF4DC] text-[#2D2824]'
                      : 'bg-[#FAF5EB] text-[#786F66]'
                }`}
              >
                {showChar}
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact QWERTY Keyboard */}
      <div className="px-panel px-panel-cream p-1.5 space-y-1">
        {QWERTY_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1">
            {row.map((letter) => {
              const used = guessedSet.has(letter);
              return (
                <button
                  key={letter}
                  type="button"
                  disabled={Boolean(feedback) || used}
                  onClick={() => arena.submitWordDuelLetter(letter)}
                  className={`px-focus flex-1 max-w-[34px] h-7 rounded font-mono font-black text-[11px] border-2 transition-all cursor-pointer ${
                    used
                      ? 'bg-[#E5DEC9] border-[#C9BEA8] text-[#9A8F82] cursor-default'
                      : 'px-btn px-btn-paper'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function FlashMatchRound({ arena }) {
  const q = arena.question;
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [wrongPair, setWrongPair] = useState(null);
  const matchedSet = new Set(arena.flashMatchedIds || []);

  useEffect(() => {
    setSelectedLeft(null);
    setWrongPair(null);
  }, [arena.currentRound]);

  const handlePickRight = (rightPairId) => {
    if (!selectedLeft || matchedSet.has(rightPairId) || arena.roundFeedback) return;
    if (selectedLeft !== rightPairId) {
      setWrongPair({ left: selectedLeft, right: rightPairId });
      setTimeout(() => setWrongPair(null), 450);
    }
    arena.submitFlashMatchPair(selectedLeft, rightPairId);
    setSelectedLeft(null);
  };

  return (
    <div className="px-panel px-panel-paper text-[#2D2824] p-2 sm:p-2.5 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-black bg-[#FDF4DC] border border-[#3D352E] px-2 py-0.5 rounded text-[#9A6A0F]">
          Đợt {arena.currentRound + 1}/{arena.totalRounds} · {matchedSet.size}/{q?.pairCount || 6} cặp
        </span>
        {arena.doubleStrikeActive && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#F4D06F] border border-[#3D352E] text-[#2D2824]">
            x2 Đòn
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {(q?.leftCards || []).map((card) => {
            const matched = matchedSet.has(card.pairId);
            const active = selectedLeft === card.pairId;
            const isWrong = wrongPair?.left === card.pairId;
            return (
              <button
                key={card.pairId}
                type="button"
                disabled={matched || Boolean(arena.roundFeedback)}
                onClick={() => setSelectedLeft(card.pairId)}
                className={`px-focus w-full rounded-lg px-2 py-1.5 border-2 text-left transition-all cursor-pointer ${
                  matched
                    ? 'bg-[#E7EFE3]/60 border-[#5A7E56]/40 text-[#5A7E56] opacity-45 cursor-default'
                    : isWrong
                      ? 'bg-[#FCECE7] border-[#C44D2D]'
                      : active
                        ? 'bg-[#F4D06F] border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                        : 'px-btn px-btn-paper'
                }`}
              >
                <span className="font-black text-[11px] sm:text-xs text-[#2D2824] break-words leading-tight block">
                  {card.text}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {(q?.rightCards || []).map((card) => {
            const matched = matchedSet.has(card.pairId);
            const isWrong = wrongPair?.right === card.pairId;
            return (
              <button
                key={card.pairId}
                type="button"
                disabled={matched || Boolean(arena.roundFeedback)}
                onClick={() => handlePickRight(card.pairId)}
                className={`px-focus w-full rounded-lg px-2 py-1.5 border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-1 ${
                  matched
                    ? 'bg-[#E7EFE3]/60 border-[#5A7E56]/40 text-[#5A7E56] opacity-45 cursor-default'
                    : isWrong
                      ? 'bg-[#FCECE7] border-[#C44D2D]'
                      : selectedLeft
                        ? 'bg-[#FFFDF7] hover:bg-[#E7EFE3] border-[#3D352E]'
                        : 'bg-[#FAF5EB] border-[#D7CCB8]'
                }`}
              >
                <span className="font-bold text-[11px] sm:text-xs text-[#2D2824] break-words leading-tight">
                  {card.text}
                </span>
                {matched && <CheckCircle2 className="w-3 h-3 text-[#5A7E56] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BattleMatchArena({
  arena,
  feel,
  selectedCharacter,
  selectedStage,
}) {
  const [pauseOpen, setPauseOpen] = useState(false);

  const modeMeta = getModeMeta(arena.selectedMode);
  const self = arena.selfPlayer;
  const opp = arena.oppPlayer;
  const timeSec = Math.max(0, Math.ceil((arena.timeLeftMs || 0) / 1000));
  const timePct = Math.max(
    0,
    Math.min(100, Math.round(((arena.timeLeftMs || 0) / (modeMeta.roundTimeMs || 12000)) * 100))
  );
  const isBotOpp =
    !opp ||
    arena.matchType === 'bot' ||
    String(opp?.userId || '').startsWith('bot:') ||
    /churbito|bot/i.test(opp?.displayName || '');

  // Exact player-selected characters (synced over WebSocket in PvP, real rival in Solo/Bot)
  const myChar = getCharacterById(self?.characterId || selectedCharacter?.id);
  const oppChar = opp?.characterId
    ? getCharacterById(opp.characterId)
    : getOpponentCharacter(myChar.id, isBotOpp, opp?.userId || opp?.displayName);
  const activeStage = getStageById(selectedStage?.id);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setPauseOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-[#0B0E14]">
      {/* FLUID TOP STAGE: fills remaining viewport cleanly, flexes gracefully when long sentences wrap */}
      <section
        data-testid="bvn-stage-section"
        className="relative flex-1 min-h-[32dvh] sm:min-h-[40dvh] w-full overflow-hidden bg-[#090B10] select-none"
      >
        <BvnBattleCanvas
          p1Id={myChar.id}
          p2Id={oppChar.id}
          stageId={activeStage.id}
          combatEvent={arena.combatEvent}
          comboCount={self?.combo || 0}
          doubleStrikeActive={arena.doubleStrikeActive}
          reduceShake={feel?.reduceShake}
          reduceFlash={feel?.reduceFlash}
        />

        {/* Overlaid Top BVN FightBar HUD */}
        <header className="absolute top-0 inset-x-0 z-20 px-2.5 sm:px-6 pt-2 pointer-events-none">
          <div className="max-w-5xl mx-auto grid grid-cols-11 items-center gap-1.5 sm:gap-3 pointer-events-auto">
            {/* P1 Portrait + HP + Mana Bar */}
            <div className="col-span-5 flex items-center gap-2 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#0B0E14]/90 border-2 border-[#38BDF8] overflow-hidden shrink-0 shadow-md">
                <BvnFaceImg characterId={myChar.id} variant="bar" size={48} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5 bg-[#090B10]/60 px-2 py-1 rounded-lg backdrop-blur-[2px]">
                <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs">
                  <span className="font-black text-white truncate">
                    {self?.displayName || 'Bạn'} · <span className="text-[#38BDF8]">{myChar.shortName}</span>
                  </span>
                  <span className="font-bvn font-bold text-[#F4D06F] shrink-0">{self?.score || 0} đ</span>
                </div>
                <BvnHpAndManaBar
                  hp={self?.hp ?? BATTLE_START_HP}
                  maxHp={BATTLE_START_HP}
                  mana={self?.mana ?? 0}
                  tone="p1"
                />
              </div>
            </div>

            {/* Center BVN Clock + Round + Pause */}
            <div className="col-span-1 flex flex-col items-center justify-center gap-1">
              <div
                className={`w-10 h-9 sm:w-12 sm:h-10 rounded-lg border-2 flex flex-col items-center justify-center shadow-md ${
                  timeSec <= 3
                    ? 'bg-[#DC2626] border-[#F4D06F] text-white animate-pulse'
                    : 'bg-[#0B0E14]/90 border-[#38BDF8]/70 text-[#F4D06F]'
                }`}
              >
                <span className="font-bvn text-sm sm:text-base leading-none font-bold">{timeSec}</span>
                <span className="text-[7px] font-bold uppercase text-white/80">
                  {arena.currentRound + 1}/{arena.totalRounds}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPauseOpen(true)}
                aria-label="Mở menu tạm dừng và cài đặt"
                title="Tạm dừng & Cài đặt"
                className="px-btn px-btn-paper px-1.5 py-0.5 inline-flex items-center text-[10px] font-black cursor-pointer"
              >
                <Pause className="w-3 h-3" />
              </button>
            </div>

            {/* P2 Portrait + Mirrored HP + Mana Bar */}
            <div className="col-span-5 flex items-center justify-end gap-2 min-w-0 text-right">
              <div className="min-w-0 flex-1 space-y-0.5 bg-[#090B10]/60 px-2 py-1 rounded-lg backdrop-blur-[2px]">
                <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs">
                  {opp?.answeredCurrent ? (
                    <span className="text-[9.5px] font-black bg-[#16A34A] text-white px-1.5 py-0.5 rounded shrink-0">
                      Đã chọn ✓
                    </span>
                  ) : (
                    <span className="font-bvn font-bold text-[#F4D06F] shrink-0">
                      {opp ? `${opp.score || 0} đ` : `${arena.currentRound + 1}/${arena.totalRounds}`}
                    </span>
                  )}
                  <span className="font-black text-white truncate">
                    <span className="text-[#FB7185]">{oppChar.shortName}</span> · {opp ? opp.displayName : 'Bot'}
                  </span>
                </div>
                <BvnHpAndManaBar
                  hp={opp ? opp.hp ?? BATTLE_START_HP : arena.soloEnemyHp ?? BATTLE_START_HP}
                  maxHp={BATTLE_START_HP}
                  mana={opp?.mana ?? 0}
                  tone="p2"
                  flip
                />
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#0B0E14]/90 border-2 border-[#E66946] overflow-hidden shrink-0 shadow-md">
                <BvnFaceImg
                  characterId={oppChar.id}
                  variant="bar"
                  size={48}
                  flip
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Slim top timer bar */}
          <div className="max-w-5xl mx-auto mt-1 h-1 bg-[#0B0E14]/80 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                timeSec <= 3 ? 'bg-[#EF4444]' : timeSec <= 5 ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'
              }`}
              style={{ width: `${timePct}%` }}
            />
          </div>
        </header>

        {/* BVN Escalating Combo Chain Multiplier HUD (1x -> 2x -> 3x -> 4x -> 5x MAX) */}
        {(self?.combo || 0) >= 1 && (() => {
          const chain = getComboChainMeta(self.combo, arena.selectedMode);
          const tierColor =
            chain.tier >= 5
              ? 'text-[#FDE047] border-[#EF4444] bg-[#7F1D1D]/85'
              : chain.tier >= 4
                ? 'text-[#FCA5A5] border-[#EF4444] bg-[#0B0E14]/85'
                : chain.tier >= 3
                  ? 'text-[#FDBA74] border-[#F97316] bg-[#0B0E14]/85'
                  : chain.tier >= 2
                    ? 'text-[#F4D06F] border-[#F4D06F] bg-[#0B0E14]/85'
                    : 'text-[#38BDF8] border-[#38BDF8]/70 bg-[#0B0E14]/80';
          return (
            <div
              key={`hits-${self.combo}`}
              data-testid="bvn-combo-hud"
              className="bvn-hits-pop absolute top-16 sm:top-20 left-3 sm:left-7 z-20 pointer-events-none"
            >
              <div className={`px-2.5 py-1 rounded-lg border-2 shadow-[2px_2px_0_#000] backdrop-blur-[2px] ${tierColor}`}>
                <div className="font-bvn text-lg sm:text-2xl font-bold leading-none drop-shadow-[1px_1px_0_#000]">
                  {chain.label} <span className="text-[11px] sm:text-xs text-white">CHUỖI ĐÁNH</span>
                </div>
                <div className="text-[9.5px] sm:text-[10.5px] font-black text-white/90 tracking-wide mt-0.5">
                  Sát thương ×{chain.damageMultiplier.toFixed(1)} · {self.combo} đòn
                </div>
              </div>
            </div>
          );
        })()}

        {/* Rival Combo Chain Badge (warns player to interrupt rival's streak!) */}
        {(opp?.combo || 0) >= 2 && (() => {
          const oppChain = getComboChainMeta(opp.combo, arena.selectedMode);
          return (
            <div
              key={`opp-hits-${opp.combo}`}
              className="bvn-hits-pop absolute top-16 sm:top-20 right-3 sm:right-7 z-20 pointer-events-none text-right"
            >
              <div className="px-2 py-0.5 rounded-lg border-2 border-[#FB7185] bg-[#0B0E14]/85 shadow-[2px_2px_0_#000]">
                <div className="font-bvn text-sm sm:text-lg font-bold text-[#FB7185] leading-none">
                  {oppChain.label} <span className="text-[10px] text-white">ĐỐI THỦ</span>
                </div>
                <div className="text-[9px] font-black text-white/80">DMG ×{oppChain.damageMultiplier.toFixed(1)}</div>
              </div>
            </div>
          );
        })()}

        {/* Emotes */}
        {arena.activeEmotes.self && (
          <div className="absolute bottom-14 left-12 bg-white text-[#2D2824] border-2 border-[#3D352E] rounded-lg px-2 py-0.5 text-base shadow-md animate-bounce z-20 pointer-events-none">
            {BATTLE_EMOTES.find((e) => e.id === arena.activeEmotes.self.emote)?.emoji}
          </div>
        )}
        {arena.activeEmotes.opp && (
          <div className="absolute bottom-14 right-12 bg-white text-[#2D2824] border-2 border-[#3D352E] rounded-lg px-2 py-0.5 text-base shadow-md animate-bounce z-20 pointer-events-none">
            {BATTLE_EMOTES.find((e) => e.id === arena.activeEmotes.opp.emote)?.emoji}
          </div>
        )}

        {/* Callouts & Floating Damage */}
        {feel?.callout && (
          <div key={feel.callout.id} className="px-callout-pop absolute inset-x-0 top-20 text-center z-20 pointer-events-none">
            <span
              className={`inline-block font-bvn text-lg sm:text-2xl font-bold px-3.5 py-1 rounded border-2 border-[#0B0E14] shadow-[3px_3px_0_#000] ${
                feel.callout.tone === 'gold'
                  ? 'bg-[#F4D06F] text-[#0B0E14]'
                  : feel.callout.tone === 'vermilion'
                    ? 'bg-[#E66946] text-white'
                    : feel.callout.tone === 'arcane'
                      ? 'bg-[#7B5288] text-white'
                      : 'bg-[#22C55E] text-[#0B0E14]'
              }`}
            >
              {feel.callout.text}
            </span>
          </div>
        )}

        <div className="absolute bottom-3 inset-x-0 flex justify-around px-8 pointer-events-none z-20">
          {arena.floatingEvents.map((ev) => (
            <span
              key={ev.id}
              className={`px-damage-float font-bvn text-xs sm:text-sm font-bold px-2 py-0.5 rounded border border-[#0B0E14] bg-white ${
                ev.tone === 'selfDmg'
                  ? 'text-[#DC2626]'
                  : ev.tone === 'dmg'
                    ? 'text-[#E66946]'
                    : 'text-[#16A34A]'
              }`}
            >
              {ev.text}
            </span>
          ))}
        </div>

        {/* Overlaid Round Feedback Pill */}
        {arena.roundFeedback && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 max-w-[92%] pointer-events-none">
            <div
              className={`px-3 py-1 rounded-full border-2 shadow-md flex items-center gap-1.5 text-xs font-black ${
                arena.roundFeedback.isCorrect
                  ? 'bg-[#E7EFE3]/95 border-[#4B6B46] text-[#2B4628]'
                  : 'bg-[#FCECE7]/95 border-[#C44D2D] text-[#9E351A]'
              }`}
            >
              {arena.roundFeedback.isCorrect ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">
                {arena.roundFeedback.isCorrect
                  ? `${arena.roundFeedback.comboLabel || '1x'} ĐÒN!${
                      arena.roundFeedback.enemyDamage ? ` -${arena.roundFeedback.enemyDamage} HP` : ''
                    }`
                  : arena.roundFeedback.rivalFirstStrike
                    ? `Đối thủ nhanh hơn!${
                        arena.roundFeedback.correctAnswer ? ` · Đáp án: ${arena.roundFeedback.correctAnswer}` : ''
                      }`
                    : arena.roundFeedback.lostTurn
                      ? `Mất lượt (-${arena.roundFeedback.selfDamage || 10} HP) · Đáp án: ${arena.roundFeedback.correctAnswer}`
                      : arena.roundFeedback.timeout
                        ? `Hết giờ · Đáp án: ${arena.roundFeedback.correctAnswer}`
                        : `Sai rồi · Đáp án: ${arena.roundFeedback.correctAnswer}`}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ALWAYS-FIT LEARNING DOCK: Question & Answers stay dominant; actions sit right on Desktop & below answers on Mobile */}
      <section
        data-testid="bvn-quiz-dock"
        className="shrink-0 max-h-[66dvh] sm:max-h-[58dvh] overflow-y-auto bg-[#141822] border-t-[3px] border-[#3D352E] px-2.5 sm:px-5 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
      >
        <div className="max-w-5xl w-full mx-auto flex flex-col md:flex-row md:items-stretch gap-2">
          <div className="min-w-0 flex-1">
            {arena.selectedMode === 'word_duel' ? (
              <WordDuelRound arena={arena} disabledByPause={pauseOpen} />
            ) : arena.selectedMode === 'flash_match' ? (
              <FlashMatchRound arena={arena} />
            ) : (
              <SpeedOrAudioRound arena={arena} myChar={myChar} disabledByPause={pauseOpen} />
            )}
          </div>
          <DockActionBar arena={arena} myChar={myChar} layout="rail" />
          <DockActionBar arena={arena} myChar={myChar} layout="mobile" />
        </div>
      </section>

      {/* Pause & Settings Modal (Unified Dark-Gold BVN UI) */}
      {pauseOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu tạm dừng trận đấu"
          className="fixed inset-0 z-50 bg-[#05070D]/80 backdrop-blur-[3px] flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bvn-modal-surface p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="font-bvn text-base font-bold text-[#F4D06F]">TẠM DỪNG &amp; CÀI ĐẶT</h3>
              <button
                type="button"
                onClick={() => setPauseOpen(false)}
                aria-label="Đóng menu tạm dừng"
                className="bvn-btn-ghost p-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feel && (
              <div className="bvn-card p-3.5 space-y-3 text-xs font-extrabold">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#E2E8F0]">Âm lượng SFX ({Math.round(feel.sfxVolume * 100)}%)</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(feel.sfxVolume * 100)}
                    onChange={(e) => feel.setSfxVolume(Number(e.target.value) / 100)}
                    aria-label="Âm lượng hiệu ứng SFX"
                    className="w-28 accent-[#F4D06F] cursor-pointer"
                  />
                </div>
                <label className="flex items-center justify-between cursor-pointer text-[#E2E8F0]">
                  <span>Giảm rung màn hình</span>
                  <input
                    type="checkbox"
                    checked={feel.reduceShake}
                    onChange={(e) => feel.setReduceShake(e.target.checked)}
                    className="w-4 h-4 accent-[#F4D06F]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer text-[#E2E8F0]">
                  <span>Giảm chớp sáng</span>
                  <input
                    type="checkbox"
                    checked={feel.reduceFlash}
                    onChange={(e) => feel.setReduceFlash(e.target.checked)}
                    className="w-4 h-4 accent-[#F4D06F]"
                  />
                </label>
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPauseOpen(false)}
                className="px-btn px-btn-sage flex-1 py-2.5 text-xs font-black cursor-pointer"
              >
                Tiếp tục chiến đấu
              </button>
              <button
                type="button"
                onClick={() => {
                  setPauseOpen(false);
                  arena.leaveMatch();
                }}
                className="px-btn px-btn-primary px-4 py-2.5 text-xs font-black cursor-pointer"
              >
                Rời trận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
