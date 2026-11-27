// src/components/arena/BattleResultView.jsx
// Post-Match BVN WinnerStage Showcase & Vocabulary Mistake Vault with FSRS-6 saver.
import React from 'react';
import { RotateCcw, ArrowLeft, Volume2, BookmarkPlus, CheckCircle2, XCircle, Zap, Flame } from 'lucide-react';
import { useModal } from '../../context/ModalContext.jsx';
import { getCharacterById, getOpponentCharacter } from './CharacterRoster.js';
import { PixelIcon } from './PixelSprites.jsx';
import BvnFaceImg from './BvnFaceImg.jsx';

function computeGrade(accuracyPct, hp) {
  if (hp >= 150 && accuracyPct >= 85) return { rank: 'S', bg: '#F4D06F', text: '#0B0E14' };
  if (accuracyPct >= 70) return { rank: 'A', bg: '#22C55E', text: '#0B0E14' };
  if (accuracyPct >= 50) return { rank: 'B', bg: '#38BDF8', text: '#0B0E14' };
  return { rank: 'C', bg: '#E66946', text: '#FFFFFF' };
}

export default function BattleResultView({ arena, selectedCharacter, lobbyBg, onRollRandomStage }) {
  const { openModal } = useModal();
  const self = arena.selfPlayer;
  const opp = arena.oppPlayer;

  const isDraw = !arena.isSolo && arena.winnerUserId === null;
  const isWin = arena.isSolo ? (self?.hp || 0) > 0 : arena.winnerUserId === arena.myUserId;

  const stampTitle = arena.isSolo
    ? isWin
      ? 'HOÀN THÀNH!'
      : 'HẾT SINH LỰC!'
    : isDraw
      ? 'HÒA KỊCH TÍNH!'
      : isWin
        ? 'CHIẾN THẮNG!'
        : 'BẠI TRẬN!';

  const headline = arena.isSolo
    ? isWin
      ? 'Hoàn thành bài tự luyện xuất sắc!'
      : 'Bạn đã dừng bước — Lưu từ sai & thử lại nhé!'
    : isDraw
      ? 'Trận đấu bất phân thắng bại!'
      : isWin
        ? 'Chiến thắng vang dội 1vs1!'
        : 'Suýt nữa hạ gục đối thủ — Tái đấu ngay!';

  const totalWords = arena.reviewWords?.length || 0;
  const accuracyPct = totalWords
    ? Math.min(100, Math.round(((self?.correctCount || 0) / totalWords) * 100))
    : 0;
  const grade = computeGrade(accuracyPct, self?.hp || 0);
  const myChar = getCharacterById(selectedCharacter?.id);
  const isBotOpp =
    arena.matchType === 'bot' ||
    String(opp?.userId || '').startsWith('bot:') ||
    /churbito|bot/i.test(opp?.displayName || '');
  const oppChar = opp?.characterId
    ? getCharacterById(opp.characterId)
    : getOpponentCharacter(myChar.id, isBotOpp, opp?.userId || opp?.displayName);

  const handleRematch = () => {
    onRollRandomStage?.();
    if (arena.isSolo) arena.startSoloPractice();
    else arena.startQuickMatch();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {lobbyBg?.bgUrl && (
        <img
          src={lobbyBg.bgUrl}
          alt=""
          aria-hidden="true"
          crossOrigin="anonymous"
          className="fixed inset-0 w-full h-full object-cover opacity-35 pointer-events-none select-none"
          style={{ imageRendering: 'pixelated' }}
        />
      )}
      <div className="fixed inset-0 bg-[#090C14]/82 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-3.5 sm:px-6 py-5 pb-14 space-y-5">
      {/* BVN Winner Showcase Card */}
      <section className="bvn-modal-surface p-5 sm:p-7 text-center space-y-4">
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          <div
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#0B0E14] border-2 overflow-hidden flex items-center justify-center ${
              isWin || isDraw ? 'border-[#F4D06F] shadow-[0_0_20px_rgba(244,208,111,0.35)]' : 'border-white/25 opacity-65'
            }`}
          >
            <BvnFaceImg
              characterId={myChar.id}
              variant={isWin || isDraw ? 'win' : 'big'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col items-center">
            <span
              className="font-bvn text-2xl sm:text-3xl font-bold px-4 py-1.5 rounded-xl border-2 border-[#0B0E14] shadow-[4px_4px_0_#000]"
              style={{ backgroundColor: grade.bg, color: grade.text }}
            >
              HẠNG {grade.rank}
            </span>
            <span className="font-bvn text-sm font-bold text-[#F4D06F] mt-2 tracking-wider">{stampTitle}</span>
          </div>
          {opp && (
            <div
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#0B0E14] border-2 overflow-hidden flex items-center justify-center ${
                !isWin || isDraw ? 'border-[#E66946]' : 'border-white/25 opacity-65'
              }`}
            >
              <BvnFaceImg
                characterId={oppChar.id}
                variant={!isWin || isDraw ? 'win' : 'big'}
                flip
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-lg bg-[#0E1118] border border-white/20 text-xs font-black text-[#F4D06F] mb-1.5">
            <PixelIcon name="trophy" size={16} />
            <span>{arena.topicName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{headline}</h1>
          {selectedCharacter?.quote && (
            <p className="text-xs font-semibold text-[#CBD5E1] italic mt-1">
              {selectedCharacter.name}: “{selectedCharacter.quote}”
            </p>
          )}
        </div>

        {/* 4 Unified BVN Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto">
          <div className="bvn-card p-3">
            <div className="text-[11px] font-bold text-[#94A3B8]">Điểm số</div>
            <div className="font-bvn text-xl font-bold text-[#F4D06F] mt-0.5">{self?.score || 0}</div>
          </div>
          <div className="bvn-card p-3">
            <div className="text-[11px] font-bold text-[#94A3B8]">Tốc độ / Chính xác</div>
            <div className="font-bvn text-xl font-bold text-[#38BDF8] flex items-center justify-center gap-1 mt-0.5">
              <Zap className="w-4 h-4" />
              {self?.avgResponseMs ? `${(self.avgResponseMs / 1000).toFixed(1)}s` : `${accuracyPct}%`}
            </div>
          </div>
          <div className="bvn-card p-3">
            <div className="text-[11px] font-bold text-[#94A3B8]">Chuỗi Hit cao nhất</div>
            <div className="font-bvn text-xl font-bold text-[#E66946] flex items-center justify-center gap-1 mt-0.5">
              <Flame className="w-4 h-4" />
              x{self?.maxCombo || 0}
            </div>
          </div>
          <div className="bvn-card p-3">
            <div className="text-[11px] font-bold text-[#94A3B8]">
              {arena.isSolo ? 'XP nhận được' : 'Biến động ELO'}
            </div>
            <div className="font-bvn text-xl font-bold text-[#22C55E] mt-0.5">
              {arena.isSolo
                ? `+${self?.xpDelta || 25} XP`
                : `${(self?.eloDelta || 0) >= 0 ? '+' : ''}${self?.eloDelta || 0}`}
            </div>
          </div>
        </div>

        {/* Head-to-head Comparison */}
        {opp && (
          <div className="max-w-lg mx-auto bvn-card px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-black">
            <span className="text-[#86EFAC]">
              {self?.displayName}: {self?.score || 0} đ ({self?.hp} HP)
            </span>
            <span className="font-bvn text-xs font-bold text-[#F4D06F]">VS</span>
            <span className="text-[#FCA5A5]">
              {opp.displayName}: {opp.score || 0} đ ({opp.hp} HP)
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleRematch}
            className="px-btn px-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-black cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            {arena.isSolo ? 'Tự luyện lại (Map mới)' : 'Tìm trận mới'}
          </button>

          <button
            type="button"
            onClick={arena.leaveMatch}
            className="bvn-btn-ghost inline-flex items-center gap-2 px-5 py-2.5 text-sm font-black cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#F4D06F]" />
            Về Menu chính
          </button>
        </div>
      </section>

      {/* Post-Match Mistake Vault (Unified Dark-Gold BVN UI) */}
      <section className="bvn-modal-surface p-4 sm:p-6 space-y-3.5">
        <div>
          <h2 className="font-bvn text-base sm:text-lg font-bold text-[#F4D06F]">
            KHO TỪ VỰNG VỪA HỌC ({arena.reviewWords.length} TỪ)
          </h2>
          <p className="text-xs font-semibold text-[#94A3B8] mt-0.5">
            Nghe lại phát âm chuẩn và lưu ngay các từ cần nhớ vào Sổ từ FSRS-6
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {arena.reviewWords.map((item, idx) => {
            const myOutcome = item.byUser?.[arena.myUserId];
            const wrongOrUnanswered = myOutcome && !myOutcome.isCorrect;

            return (
              <div
                key={`${idx}-${item.word}`}
                className={`rounded-xl p-3.5 border-2 flex items-start justify-between gap-3 ${
                  wrongOrUnanswered
                    ? 'bg-[#2A1519]/90 border-[#E66946]'
                    : 'bvn-card'
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm sm:text-base text-white">{item.word}</span>
                    {item.phonetic && <span className="text-xs font-bold text-[#38BDF8]">{item.phonetic}</span>}
                    {myOutcome &&
                      (myOutcome.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#F87171] shrink-0" />
                      ))}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-[#E2E8F0]">{item.meaning}</p>
                  {item.example && (
                    <p className="text-[11px] font-medium text-[#94A3B8] italic line-clamp-2">{item.example}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => arena.speakWord(item.word, 0.9)}
                    title="Nghe phát âm"
                    aria-label={`Nghe phát âm từ ${item.word}`}
                    className="bvn-btn-ghost w-8 h-8 flex items-center justify-center cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openModal('saveWordToTopic', {
                        wordData: {
                          word: item.word,
                          phonetic: item.phonetic || '',
                          meaning: item.meaning || '',
                          example_sentence: item.example || '',
                        },
                      })
                    }
                    title="Lưu vào Sổ từ"
                    aria-label={`Lưu từ ${item.word} vào Sổ từ`}
                    className="px-btn px-btn-sage w-8 h-8 flex items-center justify-center cursor-pointer"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      </div>
    </div>
  );
}
