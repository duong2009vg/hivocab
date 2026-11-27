// src/components/arena/CharacterSelectView.jsx
// Dedicated 16-Fighter Bleach vs Naruto Roster Selector (no map picker — battle maps roll randomly!).
import React, { useState } from 'react';
import { ArrowLeft, Check, Swords, Sparkles } from 'lucide-react';
import { ARENA_CHARACTERS, getCharacterById } from './CharacterRoster.js';
import BvnBattleCanvas from './BvnBattleCanvas.jsx';
import BvnFaceImg from './BvnFaceImg.jsx';
import { playBattleSfx, playCharacterUltiSfx } from '../../services/sound.js';

export default function CharacterSelectView({
  selectedCharacterId,
  lobbyBg,
  onSelectCharacter,
  onBack,
  soundMuted,
}) {
  const activeChar = getCharacterById(selectedCharacterId);
  const [previewTrigger, setPreviewTrigger] = useState(null);

  const bleachChars = ARENA_CHARACTERS.filter((c) => c.faction === 'bleach');
  const narutoChars = ARENA_CHARACTERS.filter((c) => c.faction === 'naruto');

  const handlePickChar = (charId) => {
    if (!soundMuted) playBattleSfx('ui_select');
    onSelectCharacter(charId);
    setPreviewTrigger({ id: `pick-${Date.now()}`, clip: 'win' });
  };

  const triggerMove = (clip) => {
    if (!soundMuted) {
      if (clip === 'super') playCharacterUltiSfx(activeChar.id);
      else playBattleSfx('hit');
    }
    setPreviewTrigger({ id: `move-${clip}-${Date.now()}`, clip });
  };

  const renderFighterTile = (char) => {
    const isSelected = char.id === activeChar.id;
    return (
      <button
        key={char.id}
        type="button"
        onClick={() => handlePickChar(char.id)}
        className={`px-focus relative rounded-xl p-2 border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
          isSelected
            ? 'bvn-card-active -translate-y-0.5'
            : 'bvn-card'
        }`}
      >
        {isSelected && (
          <span className="absolute -top-2 right-1 font-bvn text-[10px] font-bold bg-[#F4D06F] text-[#0B0E14] px-1.5 rounded border border-[#0B0E14] z-10">
            P1
          </span>
        )}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[#0B0E14] border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
          <BvnFaceImg characterId={char.id} variant="face" size={56} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 w-full">
          <div className="text-[11px] font-black text-white truncate">{char.shortName}</div>
          <div className="text-[9.5px] font-semibold text-[#94A3B8] truncate">{char.name}</div>
        </div>
      </button>
    );
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden flex flex-col">
      {/* Full-Screen BVN Game Background */}
      {lobbyBg?.bgUrl && (
        <img
          src={lobbyBg.bgUrl}
          alt=""
          aria-hidden="true"
          crossOrigin="anonymous"
          className="fixed inset-0 w-full h-full object-cover pointer-events-none select-none"
          style={{ imageRendering: 'pixelated' }}
        />
      )}
      <div className="fixed inset-0 bg-gradient-to-br from-[#090C14]/82 via-[#0B0F1A]/78 to-[#090C14]/92 pointer-events-none" />

      <div className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-5 flex-1 flex flex-col justify-between gap-4">
        {/* Top Bar */}
        <header className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (!soundMuted) playBattleSfx('ui_select');
              onBack();
            }}
            className="bvn-btn-ghost px-3.5 py-2 text-xs sm:text-sm font-black inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#F4D06F]" />
            Quay lại Menu chính
          </button>

          <div className="text-right">
            <div className="font-bvn text-lg sm:text-2xl font-bold text-[#F4D06F] tracking-wider drop-shadow-[2px_2px_0_#000]">
              CHARACTER SELECT
            </div>
            <div className="text-[11px] font-bold text-[#CBD5E1]">
              16 Chiến Binh Bleach vs Naruto · Sàn đấu được quay ngẫu nhiên mỗi trận
            </div>
          </div>
        </header>

        {/* Main Split: Left Live Character Spotlight | Right 2-Faction 16-Fighter Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center my-auto">
          {/* Left Character Showcase */}
          <section className="lg:col-span-5 bvn-modal-surface p-4 sm:p-5 flex flex-col justify-between gap-3.5">
            <div className="relative h-[270px] sm:h-[310px] rounded-xl border border-white/15 bg-gradient-to-b from-[#0E1525]/60 via-transparent to-[#090C14]/90 overflow-hidden flex flex-col justify-end">
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
                <span className="font-bvn text-[10px] font-bold bg-[#E66946] text-white px-2 py-0.5 rounded border border-[#0B0E14]">
                  P1 EQUIPPED
                </span>
                <span className="text-[10px] font-extrabold bg-[#0E1118]/85 text-[#F4D06F] px-2 py-0.5 rounded border border-[#F4D06F]/40">
                  {activeChar.factionLabel}
                </span>
              </div>

              <div className="absolute top-2.5 right-2.5 w-16 h-16 rounded-xl bg-[#0B0E14]/85 border-2 border-[#F4D06F]/70 overflow-hidden shadow-lg z-10 pointer-events-none">
                <BvnFaceImg characterId={activeChar.id} variant="big" className="w-full h-full object-cover" />
              </div>

              {/* Transparent Live Animated Character Sprite */}
              <div className="absolute inset-0 bottom-14">
                <BvnBattleCanvas
                  previewMode
                  transparentBg
                  p1Id={activeChar.id}
                  stageId={lobbyBg?.id || 'muyecun'}
                  previewTrigger={previewTrigger}
                />
              </div>

              {/* Nameplate directly beneath feet + move preview buttons */}
              <div className="relative z-10 px-3 pb-2.5 pt-2 bg-gradient-to-t from-[#090C14] via-[#090C14]/85 to-transparent flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#F4D06F] truncate">
                    {activeChar.title}
                  </div>
                  <h2 className="font-bvn text-lg sm:text-xl font-bold text-white leading-tight truncate">
                    {activeChar.name}
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => triggerMove('attack1')}
                    className="bvn-btn-ghost px-2.5 py-1 text-[11px] font-black inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Swords className="w-3.5 h-3.5 text-[#38BDF8]" />
                    Đánh
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerMove('super')}
                    className="px-btn px-btn-gold px-2.5 py-1 text-[11px] font-black inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Ulti
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-[#0D111B]/90 border border-white/10 rounded-xl p-3.5">
              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                <span className="text-[#94A3B8]">Tuyệt chiêu tối thượng</span>
                <span className="text-[#F4D06F] font-extrabold text-right">{activeChar.ultiName}</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#E2E8F0] italic leading-relaxed border-l-2 border-[#E66946] pl-3">
                “{activeChar.quote}”
              </p>
              <button
                type="button"
                onClick={onBack}
                className="px-btn px-btn-primary w-full py-2.5 text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Chọn {activeChar.name}
              </button>
            </div>
          </section>

          {/* Right 16-Fighter 2-Faction Grid */}
          <section className="lg:col-span-7 bvn-modal-surface p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-black text-white">
                Danh Sách Chiến Binh ({ARENA_CHARACTERS.length})
              </h3>
              <span className="font-bvn text-xs font-bold text-[#38BDF8]">BLEACH vs NARUTO</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-black text-[#38BDF8] mb-2 tracking-wider uppercase">
                  Phe Bleach ({bleachChars.length})
                </div>
                <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                  {bleachChars.map(renderFighterTile)}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-black text-[#F97316] mb-2 tracking-wider uppercase">
                  Phe Naruto ({narutoChars.length})
                </div>
                <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                  {narutoChars.map(renderFighterTile)}
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="text-center text-[11px] font-bold text-[#94A3B8]">
          Muốn đổi hình nền sảnh chính? Vào mục SETTING ở Menu chính!
        </footer>
      </div>
    </div>
  );
}
