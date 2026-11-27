// src/components/arena/BattleWaitingAndVsView.jsx
// BVN Shonen Matchmaking Radar Room & Dramatic 1v1 VS Splash Screen with real R2 Fighter Portraits & Maps.
import React, { useState } from 'react';
import { Copy, Check, ArrowLeft, Share2, Swords } from 'lucide-react';
import { getModeMeta, getRankTier } from '../../utils/battleEngine.js';
import { supabase } from '../../lib/supabaseClient.js';
import { getCharacterById, getOpponentCharacter, getStageById } from './CharacterRoster.js';
import { PixelModeIcon, PixelRankCrest } from './PixelSprites.jsx';
import BvnFaceImg from './BvnFaceImg.jsx';

export function BattleWaitingView({ arena, user, selectedCharacter, selectedStage }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharedToChat, setSharedToChat] = useState(false);
  const modeMeta = getModeMeta(arena.selectedMode);
  const myChar = getCharacterById(selectedCharacter?.id);
  const stage = getStageById(selectedStage?.id);

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/app#arena?room=${encodeURIComponent(arena.roomCode || '')}`
      : '';

  const copyText = async (text, setter) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 1800);
    } catch (_) {}
  };

  const handleShareToCommunityChat = async () => {
    if (!user || !arena.roomCode || sharedToChat) return;
    try {
      const displayName =
        arena.selfProfile?.displayName ||
        user?.user_metadata?.full_name ||
        user?.email?.split('@')[0] ||
        'Học viên HiVocab';
      await supabase.from('community_messages').insert({
        channel_id: 'general',
        user_id: user.id,
        author_name: displayName,
        content: `⚔️ Mình vừa mở phòng Đấu trường "${modeMeta.label}" (${arena.topicName})! Nhập mã [${arena.roomCode}] trong mục Đấu trường hoặc mở link: ${inviteUrl}`,
      });
      setSharedToChat(true);
    } catch (_) {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bvn-modal-surface p-5 sm:p-6 text-center space-y-5">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={arena.leaveMatch}
            className="bvn-btn-ghost px-3 py-1.5 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#F4D06F]" />
            Rời hàng chờ
          </button>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B0E14] text-[#F4D06F] border border-[#F4D06F]/50 text-xs font-black">
            <PixelModeIcon modeId={arena.selectedMode} size={18} />
            {modeMeta.label}
          </span>
        </div>

        {/* 1v1 Challenger Radar Preview over real BVN stage backdrop */}
        <div className="relative rounded-xl border-2 border-[#3D352E] overflow-hidden p-4 flex items-center justify-around gap-3 bg-[#0B0E14]">
          <img
            src={stage.bgUrl}
            alt=""
            aria-hidden="true"
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-cover opacity-55 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090B10]/85 via-transparent to-[#090B10]/65 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <span className="font-bvn text-[10px] font-bold bg-[#5A7E56] text-white px-2 py-0.5 rounded border border-[#0B0E14]">
              P1 READY
            </span>
            <div className="w-20 h-20 rounded-xl bg-[#0B0E14]/80 border-2 border-[#38BDF8] overflow-hidden">
              <BvnFaceImg characterId={myChar.id} variant="big" className="w-full h-full object-cover" />
            </div>
            <span className="text-[11px] font-black text-white">{myChar.shortName}</span>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <span className="font-bvn text-2xl font-bold text-[#F4D06F] drop-shadow-[2px_2px_0_#000]">VS</span>
            <span className="text-[10px] font-bold text-white/90 animate-pulse mt-1">Đang ghép...</span>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <span className="font-bvn text-[10px] font-bold bg-[#0E1118] text-[#F4D06F] px-2 py-0.5 rounded border border-[#F4D06F]/40">
              CHALLENGER
            </span>
            <div className="w-20 h-20 rounded-xl bg-[#0E1118]/75 border-2 border-dashed border-white/40 flex items-center justify-center">
              <span className="font-bvn text-3xl font-bold text-[#F4D06F] animate-pulse">?</span>
            </div>
            <span className="text-[11px] font-bold text-[#CBD5E1]">Chờ đối thủ</span>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-black text-white">
            {arena.matchType === 'private' ? 'Đang chờ bạn bè vào phòng đấu...' : 'Đang tìm đối thủ 1vs1 xứng tầm...'}
          </h2>
          <p className="text-xs font-bold text-[#CBD5E1] mt-1">Bộ từ: {arena.topicName}</p>
        </div>

        {arena.roomCode && (
          <div className="bvn-card p-4 space-y-3">
            <div className="text-[11px] font-black text-[#38BDF8] uppercase tracking-wider">Mã phòng mời bạn bè</div>
            <div className="flex items-center justify-center gap-2">
              <span className="font-bvn text-2xl sm:text-3xl font-bold tracking-[0.18em] text-[#F4D06F] bg-[#0B0E14] px-4 py-1.5 rounded-lg border-2 border-[#F4D06F]/60">
                {arena.roomCode}
              </span>
              <button
                type="button"
                onClick={() => copyText(arena.roomCode, setCopiedCode)}
                className="bvn-btn-ghost p-2.5 cursor-pointer"
                title="Sao chép mã phòng"
                aria-label="Sao chép mã phòng"
              >
                {copiedCode ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4 text-[#F4D06F]" />}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => copyText(inviteUrl, setCopiedLink)}
                className="bvn-btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Share2 className="w-3.5 h-3.5 text-[#38BDF8]" />}
                {copiedLink ? 'Đã chép link!' : 'Chép link mời'}
              </button>

              {user && (
                <button
                  type="button"
                  onClick={handleShareToCommunityChat}
                  disabled={sharedToChat}
                  className="px-btn px-btn-sage inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black disabled:opacity-60 cursor-pointer"
                >
                  <Swords className="w-3.5 h-3.5" />
                  {sharedToChat ? 'Đã rủ vào #Chung ✓' : 'Rủ trên Chat #Chung'}
                </button>
              )}
            </div>
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={arena.requestBotNow}
            className={`px-btn w-full py-2.5 px-4 font-black flex items-center justify-center gap-2.5 cursor-pointer ${
              arena.botReadyOffer ? 'px-btn-primary text-sm' : 'px-btn-gold text-xs'
            }`}
          >
            <BvnFaceImg
              characterId={getOpponentCharacter(myChar.id, true).id}
              variant="bar"
              size={28}
              className="rounded border border-[#0B0E14]"
            />
            <span>
              {arena.botReadyOffer ? 'Đấu ngay với Bot Churbito EX!' : 'Không muốn đợi? Đấu ngay với Bot Churbito'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function BattleVsScreen({ arena, selectedCharacter, selectedStage }) {
  const p1 = arena.selfPlayer;
  const p2 = arena.oppPlayer;
  const t1 = getRankTier(p1?.elo || 1000);
  const t2 = getRankTier(p2?.elo || 1000);
  const modeMeta = getModeMeta(arena.selectedMode);
  const isBotOpp =
    arena.matchType === 'bot' ||
    String(p2?.userId || '').startsWith('bot:') ||
    /churbito|bot/i.test(p2?.displayName || '');
  const secLeft = Math.max(1, Math.ceil((arena.vsTimeLeftMs || 1000) / 1000));

  const myChar = getCharacterById(selectedCharacter?.id);
  const oppChar = p2?.characterId
    ? getCharacterById(p2.characterId)
    : getOpponentCharacter(myChar.id, isBotOpp, p2?.userId || p2?.displayName);
  const stage = getStageById(selectedStage?.id);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-3xl px-panel-dark overflow-hidden p-5 sm:p-8 text-center space-y-6 bg-[#0B0E14]">
        <img
          src={stage.bgUrl}
          alt=""
          aria-hidden="true"
          crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-cover opacity-45 pointer-events-none"
        />
        <div className="relative z-10 inline-flex items-center gap-2 flex-wrap justify-center px-3.5 py-1 rounded-xl bg-[#0E1118]/90 border-2 border-[#F4D06F]/60 text-xs font-black text-white">
          <PixelModeIcon modeId={arena.selectedMode} size={18} />
          <span>{modeMeta.label}</span>
          <span>·</span>
          <span className="text-[#F4D06F] truncate max-w-[180px] sm:max-w-xs">{arena.topicName}</span>
          <span>·</span>
          <span className="text-[#38BDF8]">🎲 Sàn đấu: {stage.name}</span>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-7 items-center gap-4">
          <div className="sm:col-span-3 px-panel-dark p-4 flex flex-col items-center gap-2 border-2 border-[#38BDF8]">
            <div className="w-full flex items-center justify-between">
              <span className="font-bvn text-xs font-bold bg-[#38BDF8] text-[#0B0E14] px-2 py-0.5 rounded">P1</span>
              <span className="font-bvn text-xs font-bold text-[#F4D06F]">{p1?.elo || 1000} ELO</span>
            </div>
            <div className="w-24 h-24 rounded-xl bg-[#0B0E14] border-2 border-[#38BDF8]/70 overflow-hidden">
              <BvnFaceImg characterId={myChar.id} variant="big" className="w-full h-full object-cover" />
            </div>
            <div className="font-black text-base text-white truncate max-w-full">
              {p1?.displayName || 'Bạn'} · <span className="text-[#38BDF8]">{myChar.shortName}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#E2E8F0] bg-[#12151E] px-2.5 py-0.5 rounded-lg border border-white/15">
              <PixelRankCrest color={t1.color} bg={t1.bg} size={18} />
              <span>{t1.name}</span>
            </div>
          </div>

          <div className="sm:col-span-1 flex flex-col items-center justify-center py-1">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#E66946] to-[#B91C1C] border-[3px] border-[#F4D06F] shadow-[0_0_24px_rgba(230,105,70,0.65)] flex items-center justify-center px-vs-pulse">
              <span className="font-bvn text-3xl font-bold text-white drop-shadow-[2px_2px_0_#000]">VS</span>
            </div>
            <div className="mt-3 font-bvn text-xs font-bold bg-[#0E1118] text-[#F4D06F] px-3 py-1 rounded border border-[#F4D06F]/50">
              {secLeft <= 1 ? 'READY!' : `BẮT ĐẦU ${secLeft}s`}
            </div>
          </div>

          <div className="sm:col-span-3 px-panel-dark p-4 flex flex-col items-center gap-2 border-2 border-[#E66946]">
            <div className="w-full flex items-center justify-between">
              <span className="font-bvn text-xs font-bold bg-[#E66946] text-white px-2 py-0.5 rounded">
                {isBotOpp ? 'CPU' : 'P2'}
              </span>
              <span className="font-bvn text-xs font-bold text-[#F4D06F]">{p2?.elo || 1000} ELO</span>
            </div>
            <div className="w-24 h-24 rounded-xl bg-[#0B0E14] border-2 border-[#E66946]/70 overflow-hidden">
              <BvnFaceImg characterId={oppChar.id} variant="big" flip className="w-full h-full object-cover" />
            </div>
            <div className="font-black text-base text-white truncate max-w-full">
              {p2?.displayName || 'Đối thủ'} · <span className="text-[#FB7185]">{oppChar.shortName}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#E2E8F0] bg-[#12151E] px-2.5 py-0.5 rounded-lg border border-white/15">
              <PixelRankCrest color={t2.color} bg={t2.bg} size={18} />
              <span>{t2.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
