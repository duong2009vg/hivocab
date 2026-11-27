// src/components/arena/ArenaLobbyView.jsx
// Full-Screen Bleach vs Naruto (BVN) Main Menu:
// - Full-bleed customizable BVN background covering 100% viewport
// - Left: Live animated BVN character with nameplate directly beneath feet
// - Right: Angled menu stack (PLAY NOW, 1VS1, SINGLE, CHARACTER, SETTING)
// - Unified Dark-Gold BVN Pop-up Modals (Play Now Level picker + random map spin, 1vs1, Single, Settings + BG changer, Leaderboard)
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Trophy,
  Settings,
  X,
  KeyRound,
  RefreshCw,
  Sparkles,
  Shuffle,
  Volume2,
  Image as ImageIcon,
} from 'lucide-react';
import {
  ALL_SINGLE_MODES,
  BATTLE_MODES,
  getRankTier,
} from '../../utils/battleEngine.js';
import { ARENA_STAGES } from './CharacterRoster.js';
import { getArenaBgmVolume, playBattleSfx, setArenaBgmVolume } from '../../services/sound.js';
import { PixelModeIcon, PixelRankCrest, PixelIcon } from './PixelSprites.jsx';
import BvnBattleCanvas from './BvnBattleCanvas.jsx';

const LEVEL_PRESETS = [
  {
    id: 'all',
    label: 'Tất cả cấp độ',
    badge: 'MIX',
    desc: 'Tổng hợp đa dạng từ vựng chung HiVocab',
    keywords: [],
  },
  {
    id: 'basic',
    label: 'Cơ bản (A1–B1)',
    badge: 'LV.1',
    desc: 'Từ vựng nền tảng giao tiếp & căn bản',
    keywords: ['a1', 'a2', 'b1', 'cơ bản', 'co ban', 'basic', 'giao tiếp', 'starter', 'thcs', 'ket', 'pet'],
  },
  {
    id: 'intermediate',
    label: 'Trung cấp (B2 / THPT)',
    badge: 'LV.2',
    desc: 'Ôn thi THPT Quốc gia & từ vựng B2',
    keywords: ['b2', 'thpt', 'trung cấp', 'toeic', 'trung hoc', 'intermediate', 'ôn thi'],
  },
  {
    id: 'advanced',
    label: 'Nâng cao (C1–C2 / IELTS)',
    badge: 'LV.3',
    desc: 'IELTS, SAT & học thuật nâng cao C1–C2',
    keywords: ['c1', 'c2', 'ielts', 'sat', 'academic', 'nâng cao', 'advanced', 'toefl', 'gre'],
  },
];

function resolveTopicIdForLevel(levelId, topics) {
  if (!levelId || levelId === 'all' || !Array.isArray(topics) || !topics.length) return '';
  const preset = LEVEL_PRESETS.find((l) => l.id === levelId);
  if (!preset?.keywords?.length) return '';
  const matches = topics.filter((t) => {
    const hay = `${t.name || ''} ${t.category || ''}`.toLowerCase();
    return preset.keywords.some((kw) => hay.includes(kw));
  });
  if (!matches.length) return '';
  const pick = matches[Math.floor(Math.random() * matches.length)];
  return pick?.id || '';
}

export default function ArenaLobbyView({
  arena,
  user,
  feel,
  selectedCharacter,
  lobbyBg,
  onSelectLobbyBg,
  onRollRandomStage,
  onOpenCharacter,
  onExitGame,
  onRequireLogin,
}) {
  // Active unified pop-up: null | 'play_now' | 'one_vs_one' | 'single' | 'settings' | 'leaderboard'
  const [activeModal, setActiveModal] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [pvpSubTab, setPvpSubTab] = useState('create'); // 'create' | 'join'
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [previewTrigger, setPreviewTrigger] = useState(null);
  const [rollingMapName, setRollingMapName] = useState('');
  const [bgmVolume, setBgmVolumeState] = useState(() => getArenaBgmVolume());

  const handleBgmVolumeChange = (val01) => {
    const clamped = Math.max(0, Math.min(1, Number(val01) || 0));
    setBgmVolumeState(clamped);
    setArenaBgmVolume(clamped);
  };

  const myElo = arena.selfProfile?.elo || 1000;
  const myTier = getRankTier(myElo);
  const myName =
    arena.selfProfile?.displayName ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : 'Học viên HiVocab');

  const activePvpMode = BATTLE_MODES.some((m) => m.id === arena.selectedMode)
    ? arena.selectedMode
    : BATTLE_MODES[0].id;

  const filteredTopicsForLevel = useMemo(() => {
    if (selectedLevel === 'all') return arena.topics || [];
    const preset = LEVEL_PRESETS.find((l) => l.id === selectedLevel);
    if (!preset?.keywords?.length) return arena.topics || [];
    const filtered = (arena.topics || []).filter((t) => {
      const hay = `${t.name || ''} ${t.category || ''}`.toLowerCase();
      return preset.keywords.some((kw) => hay.includes(kw));
    });
    return filtered.length ? filtered : arena.topics || [];
  }, [arena.topics, selectedLevel]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && activeModal) {
        setActiveModal(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal]);

  const openMenuModal = (modalKey) => {
    if (!arena.soundMuted) playBattleSfx('ui_select');
    setActiveModal(modalKey);
  };

  // Visual random-map spin before launching match
  const spinMapAndLaunch = (launchFn) => {
    if (!arena.soundMuted) playBattleSfx('ui_select');
    let ticks = 0;
    const timer = setInterval(() => {
      const rnd = ARENA_STAGES[Math.floor(Math.random() * ARENA_STAGES.length)];
      setRollingMapName(rnd.name);
      ticks += 1;
      if (ticks >= 6) {
        clearInterval(timer);
        onRollRandomStage?.();
        setRollingMapName('');
        setActiveModal(null);
        launchFn();
      }
    }, 75);
  };

  const handlePlayNowStart = () => {
    if (!user) {
      setActiveModal(null);
      onRequireLogin?.('Đăng nhập để ghép cặp PvP và lưu điểm xếp hạng ELO!');
      return;
    }
    const chosenTopic = arena.selectedTopicId || resolveTopicIdForLevel(selectedLevel, arena.topics);
    spinMapAndLaunch(() => arena.startQuickMatch(activePvpMode, chosenTopic || ''));
  };

  const handleCreatePrivateRoom = () => {
    if (!user) {
      setActiveModal(null);
      onRequireLogin?.('Đăng nhập để tạo phòng mời bạn bè thi đấu!');
      return;
    }
    spinMapAndLaunch(() => arena.startPrivateRoom(activePvpMode, arena.selectedTopicId || ''));
  };

  const handleJoinCode = async (e) => {
    e.preventDefault();
    if (!user) {
      setActiveModal(null);
      onRequireLogin?.('Đăng nhập để tham gia phòng đấu cùng bạn bè!');
      return;
    }
    const clean = joinCodeInput.trim().toUpperCase();
    if (!clean) return;
    if (!arena.soundMuted) playBattleSfx('ui_select');
    onRollRandomStage?.();
    setIsJoining(true);
    const ok = await arena.joinRoomByCode(clean);
    setIsJoining(false);
    if (ok) setActiveModal(null);
  };

  const handleStartSingle = (modeId) => {
    const chosenTopic = arena.selectedTopicId || resolveTopicIdForLevel(selectedLevel, arena.topics);
    spinMapAndLaunch(() => arena.startSoloPractice(modeId, chosenTopic || ''));
  };

  const handleTapHero = () => {
    if (!arena.soundMuted) playBattleSfx('hit');
    setPreviewTrigger({ id: `tap-${Date.now()}`, clip: 'attack1' });
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden flex flex-col justify-between">
      {/* FULL-SCREEN GAME BACKGROUND (100% viewport) */}
      {lobbyBg?.bgUrl && (
        <img
          src={lobbyBg.bgUrl}
          alt=""
          aria-hidden="true"
          crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          style={{ imageRendering: 'pixelated' }}
        />
      )}
      {/* Balanced dramatic vignette so fighter pops on left & angled menu pops on right */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#090C14]/70 via-[#0B0F1A]/35 to-[#090C14]/82 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#090C14]/88 via-transparent to-[#090C14]/70 pointer-events-none" />

      {/* TOP UTILITY STRIP */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-3 sm:pt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onExitGame}
            className="bvn-btn-ghost px-3 py-1.5 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#F4D06F]" />
            Về HiVocab
          </button>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0B0E14]/80 border border-white/15 backdrop-blur-[2px] text-xs">
            <PixelRankCrest color={myTier.color} bg={myTier.bg} size={18} />
            <span className="font-black text-white truncate max-w-[120px]">{myName}</span>
            <span className="font-bvn font-bold text-[#F4D06F]">{myElo} ELO</span>
          </div>

          <button
            type="button"
            onClick={() => openMenuModal('leaderboard')}
            className="px-btn px-btn-gold px-3 py-1.5 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bảng Xếp Hạng</span>
            <span className="sm:hidden">BXH</span>
          </button>
        </div>
      </header>

      {/* MAIN SPLIT CONTENT: Left Live Character + Name Below Feet | Right 5 BVN Menu Buttons */}
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-2 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center min-h-0">
        {/* LEFT: LIVE HERO CHARACTER ON OPEN STAGE + NAME UNDERNEATH FEET */}
        <section className="lg:col-span-6 h-full max-h-[320px] sm:max-h-[440px] lg:max-h-[560px] flex flex-col items-center justify-end relative">
          {/* Transparent Live Animated Character Standing Directly Over Full-Screen Map */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleTapHero}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleTapHero();
            }}
            title="Nhấn vào nhân vật để thử chiêu!"
            className="w-full flex-1 min-h-[160px] sm:min-h-[240px] max-w-[460px] cursor-pointer relative"
          >
            <BvnBattleCanvas
              previewMode
              transparentBg
              p1Id={selectedCharacter.id}
              stageId={lobbyBg.id}
              previewTrigger={previewTrigger}
            />
          </div>

          {/* Character Nameplate Directly Underneath Character's Feet */}
          <div className="relative -mt-3 sm:-mt-4 text-center z-20 pointer-events-none select-none px-4">
            <div className="inline-flex flex-col items-center px-5 py-2 rounded-xl bg-[#0B0E14]/82 border-2 border-[#F4D06F]/80 shadow-[0_6px_24px_rgba(0,0,0,0.65)] backdrop-blur-[3px]">
              <span className="font-bvn text-[10px] font-bold uppercase tracking-[0.14em] text-[#38BDF8]">
                {selectedCharacter.factionLabel}
              </span>
              <div className="font-bvn text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight drop-shadow-[2px_2px_0_#000]">
                {selectedCharacter.name}
              </div>
              <div className="text-[11px] font-bold text-[#F4D06F] mt-0.5">
                {selectedCharacter.title}
              </div>
            </div>
          </div>

          {arena.errorMsg && (
            <div
              role="alert"
              className="mt-2 w-full max-w-md bvn-modal-surface border-[#E66946] px-3.5 py-2 text-xs font-bold text-[#FCA5A5] flex items-center justify-between gap-2"
            >
              <span className="truncate">{arena.errorMsg}</span>
              <button
                type="button"
                onClick={() => arena.setErrorMsg('')}
                className="underline font-black text-white cursor-pointer shrink-0"
              >
                Đóng
              </button>
            </div>
          )}
        </section>

        {/* RIGHT: REDESIGNED ANGLED BVN MENU STACK (4 CORE + SETTING) */}
        <section className="lg:col-span-6 flex flex-col justify-center">
          <nav aria-label="Menu chính Đấu trường" className="space-y-2.5 sm:space-y-3 max-w-xl w-full ml-auto">
            {/* 1. PLAY NOW */}
            <div className="lg:ml-8">
              <button
                type="button"
                data-active={activeModal === 'play_now'}
                onClick={() => openMenuModal('play_now')}
                className="bvn-menu-btn w-full bg-[#151B28]/92 px-5 py-3 text-left cursor-pointer flex items-center justify-between gap-3"
              >
                <span className="bvn-menu-slash" aria-hidden="true" />
                <div className="relative z-10 flex items-center justify-between w-full gap-3">
                  <div>
                    <div className="font-bvn text-lg sm:text-2xl font-bold text-white leading-tight">
                      PLAY NOW
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold text-[#E2E8F0]">
                      Chơi ngay · Chọn Level &amp; Quay map ngẫu nhiên
                    </div>
                  </div>
                  <span className="font-bvn text-xs font-bold px-2 py-0.5 rounded bg-[#0E1118]/80 text-[#F4D06F]">
                    ▸
                  </span>
                </div>
              </button>
            </div>

            {/* 2. 1VS1 */}
            <div className="lg:ml-5 lg:mr-2">
              <button
                type="button"
                data-active={activeModal === 'one_vs_one'}
                onClick={() => openMenuModal('one_vs_one')}
                className="bvn-menu-btn w-full bg-[#151B28]/92 px-5 py-3 text-left cursor-pointer flex items-center justify-between gap-3"
              >
                <span className="bvn-menu-slash" aria-hidden="true" />
                <div className="relative z-10 flex items-center justify-between w-full gap-3">
                  <div>
                    <div className="font-bvn text-lg sm:text-2xl font-bold text-white leading-tight">
                      1VS1
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold text-[#E2E8F0]">
                      Tạo phòng riêng &amp; Nhập mã tham gia cùng bạn bè
                    </div>
                  </div>
                  <span className="font-bvn text-xs font-bold px-2 py-0.5 rounded bg-[#0E1118]/80 text-[#F4D06F]">
                    ▸
                  </span>
                </div>
              </button>
            </div>

            {/* 3. SINGLE */}
            <div className="lg:ml-2 lg:mr-5">
              <button
                type="button"
                data-active={activeModal === 'single'}
                onClick={() => openMenuModal('single')}
                className="bvn-menu-btn w-full bg-[#151B28]/92 px-5 py-3 text-left cursor-pointer flex items-center justify-between gap-3"
              >
                <span className="bvn-menu-slash" aria-hidden="true" />
                <div className="relative z-10 flex items-center justify-between w-full gap-3">
                  <div>
                    <div className="font-bvn text-lg sm:text-2xl font-bold text-white leading-tight">
                      SINGLE
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold text-[#E2E8F0]">
                      Tự luyện từ vựng (6 chế độ chuyên sâu)
                    </div>
                  </div>
                  <span className="font-bvn text-xs font-bold px-2 py-0.5 rounded bg-[#0E1118]/80 text-[#F4D06F]">
                    6 MODES
                  </span>
                </div>
              </button>
            </div>

            {/* 4. CHARACTER */}
            <div className="lg:mr-8">
              <button
                type="button"
                onClick={() => {
                  if (!arena.soundMuted) playBattleSfx('ui_select');
                  onOpenCharacter();
                }}
                className="bvn-menu-btn w-full bg-[#151B28]/92 px-5 py-3 text-left cursor-pointer flex items-center justify-between gap-3"
              >
                <span className="bvn-menu-slash" aria-hidden="true" />
                <div className="relative z-10 flex items-center justify-between w-full gap-3">
                  <div>
                    <div className="font-bvn text-lg sm:text-2xl font-bold text-white leading-tight">
                      CHARACTER
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold text-[#E2E8F0]">
                      Nhân vật · Chọn chiến binh ({selectedCharacter.shortName})
                    </div>
                  </div>
                  <span className="font-bvn text-xs font-bold px-2 py-0.5 rounded bg-[#0E1118]/80 text-[#38BDF8]">
                    16 FIGHTERS
                  </span>
                </div>
              </button>
            </div>

            {/* 5. SETTING (Audio + Effects + Background Switcher) */}
            <div className="lg:-ml-2 lg:mr-11">
              <button
                type="button"
                data-active={activeModal === 'settings'}
                onClick={() => openMenuModal('settings')}
                className="bvn-menu-btn w-full bg-[#121724]/92 px-5 py-2.5 text-left cursor-pointer flex items-center justify-between gap-3"
              >
                <span className="bvn-menu-slash" aria-hidden="true" />
                <div className="relative z-10 flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-[#F4D06F] shrink-0" />
                    <div>
                      <div className="font-bvn text-base sm:text-xl font-bold text-white leading-tight">
                        SETTING
                      </div>
                      <div className="text-[11px] font-bold text-[#CBD5E1]">
                        Âm thanh, hiệu ứng &amp; Đổi hình nền ({lobbyBg.name})
                      </div>
                    </div>
                  </div>
                  <span className="font-bvn text-[11px] font-bold px-2 py-0.5 rounded bg-[#0E1118]/80 text-[#CBD5E1]">
                    BG · SFX
                  </span>
                </div>
              </button>
            </div>
          </nav>
        </section>
      </div>

      {/* =====================================================================
          UNIFIED BVN DARK-GOLD POP-UP MODALS
         ===================================================================== */}

      {/* 1. PLAY NOW POP-UP: Choose Level -> Choose Mode -> Random Map Spin */}
      {activeModal === 'play_now' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chơi ngay - Chọn Level và Chế độ"
          className="fixed inset-0 z-50 bg-[#05070D]/80 backdrop-blur-[3px] flex items-center justify-center p-3 sm:p-4"
        >
          <div className="w-full max-w-xl bvn-modal-surface p-4 sm:p-5 space-y-4 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <div className="font-bvn text-lg sm:text-xl font-bold text-[#F4D06F] tracking-wide">
                  PLAY NOW · CHỌN LEVEL
                </div>
                <p className="text-xs font-semibold text-[#94A3B8]">
                  Chọn cấp độ từ vựng &amp; chế độ 1v1 — Bản đồ thi đấu sẽ quay ngẫu nhiên!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Đóng pop-up Chơi ngay"
                className="bvn-btn-ghost p-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Level Selector */}
            <div className="space-y-2">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#38BDF8]">
                1. Chọn Cấp Độ Từ Vựng (Level)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {LEVEL_PRESETS.map((lv) => {
                  const active = selectedLevel === lv.id;
                  return (
                    <button
                      key={lv.id}
                      type="button"
                      onClick={() => {
                        setSelectedLevel(lv.id);
                        arena.setSelectedTopicId('');
                      }}
                      className={`p-2.5 text-left cursor-pointer ${active ? 'bvn-card-active' : 'bvn-card'}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black truncate">{lv.label}</span>
                        <span className="font-bvn text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0B0E14] text-[#F4D06F] shrink-0">
                          {lv.badge}
                        </span>
                      </div>
                      <div className="text-[10.5px] font-semibold text-[#94A3B8] mt-0.5 line-clamp-1">
                        {lv.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Optional fine-grained topic dropdown (min-w-0 w-full prevents overflow!) */}
              <div className="pt-1">
                <select
                  aria-label="Chọn bộ từ cụ thể theo cấp độ"
                  value={arena.selectedTopicId}
                  onChange={(e) => arena.setSelectedTopicId(e.target.value)}
                  className="bvn-select"
                >
                  <option value="">🌐 Tự động ghép theo Level đã chọn (Kho từ chung)</option>
                  {filteredTopicsForLevel.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.isMine ? '⭐ ' : '📚 '}
                      {t.name} ({t.wordCount || '?'} từ)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Battle Mode Selector */}
            <div className="space-y-2">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#38BDF8]">
                2. Chọn Chế Độ Thi Đấu 1v1
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BATTLE_MODES.map((m) => {
                  const selected = activePvpMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => arena.setSelectedMode(m.id)}
                      className={`p-2.5 text-left flex items-center gap-2.5 cursor-pointer ${
                        selected ? 'bvn-card-active' : 'bvn-card'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#0B0E14] border border-white/15 flex items-center justify-center shrink-0">
                        <PixelModeIcon modeId={m.id} size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate">{m.label}</div>
                        <div className="text-[10px] font-semibold text-[#94A3B8] truncate">{m.detailDesc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Random Map Info + Launch CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold text-[#CBD5E1]">
                <Shuffle className="w-4 h-4 text-[#F4D06F] shrink-0" />
                <span>
                  {rollingMapName
                    ? `Đang quay sàn đấu: ${rollingMapName}...`
                    : 'Sàn đấu sẽ được quay ngẫu nhiên (6 bản đồ BVN)'}
                </span>
              </div>
              <button
                type="button"
                disabled={Boolean(rollingMapName)}
                onClick={handlePlayNowStart}
                className="px-btn px-btn-primary px-5 py-2.5 text-sm font-black cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-70"
              >
                {rollingMapName ? '🎲 Đang quay map...' : '⚔️ Tìm Đối Thủ Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 1VS1 POP-UP: Create Private Room / Join by Code */}
      {activeModal === 'one_vs_one' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Phòng đấu 1vs1 cùng bạn bè"
          className="fixed inset-0 z-50 bg-[#05070D]/80 backdrop-blur-[3px] flex items-center justify-center p-3 sm:p-4"
        >
          <div className="w-full max-w-lg bvn-modal-surface p-4 sm:p-5 space-y-4 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <div className="font-bvn text-lg sm:text-xl font-bold text-[#F4D06F]">
                  1VS1 · ĐẤU CÙNG BẠN BÈ
                </div>
                <p className="text-xs font-semibold text-[#94A3B8]">
                  Tạo phòng nhận mã 6 ký tự hoặc nhập mã bạn bè gửi
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Đóng pop-up 1vs1"
                className="bvn-btn-ghost p-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Unified Tab Switch */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPvpSubTab('create')}
                className={`py-2.5 px-3 text-center font-bvn text-sm font-bold cursor-pointer ${
                  pvpSubTab === 'create' ? 'bvn-card-active' : 'bvn-card'
                }`}
              >
                TẠO PHÒNG MỚI
              </button>
              <button
                type="button"
                onClick={() => setPvpSubTab('join')}
                className={`py-2.5 px-3 text-center font-bvn text-sm font-bold cursor-pointer ${
                  pvpSubTab === 'join' ? 'bvn-card-active' : 'bvn-card'
                }`}
              >
                NHẬP MÃ PHÒNG
              </button>
            </div>

            {pvpSubTab === 'create' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BATTLE_MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => arena.setSelectedMode(m.id)}
                      className={`p-2.5 text-left flex items-center gap-2 cursor-pointer ${
                        activePvpMode === m.id ? 'bvn-card-active' : 'bvn-card'
                      }`}
                    >
                      <div className="w-7 h-7 rounded bg-[#0B0E14] border border-white/15 flex items-center justify-center shrink-0">
                        <PixelModeIcon modeId={m.id} size={18} />
                      </div>
                      <span className="text-xs font-black text-white truncate">{m.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-[#38BDF8] uppercase tracking-wider block">
                    Chủ đề từ vựng của phòng
                  </label>
                  <select
                    aria-label="Chọn bộ từ cho phòng riêng"
                    value={arena.selectedTopicId}
                    onChange={(e) => arena.setSelectedTopicId(e.target.value)}
                    className="bvn-select"
                  >
                    <option value="">🌐 Kho Từ Chung (IELTS &amp; THPT)</option>
                    {arena.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.isMine ? '⭐ ' : '📚 '}
                        {t.name} ({t.wordCount || '?'} từ)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                  <span className="text-[11px] font-bold text-[#94A3B8] inline-flex items-center gap-1.5">
                    <Shuffle className="w-3.5 h-3.5 text-[#F4D06F]" />
                    Map quay ngẫu nhiên
                  </span>
                  <button
                    type="button"
                    disabled={Boolean(rollingMapName)}
                    onClick={handleCreatePrivateRoom}
                    className="px-btn px-btn-sage px-5 py-2 text-sm font-black cursor-pointer shrink-0"
                  >
                    {rollingMapName ? 'Đang mở...' : 'Mở Phòng 1vs1'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleJoinCode} className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#CBD5E1]">
                  <KeyRound className="w-4 h-4 text-[#F4D06F]" />
                  <span>Nhập mã phòng 6 ký tự từ bạn bè để vào ngay sàn đấu</span>
                </div>
                <div className="flex min-w-0 gap-2">
                  <input
                    type="text"
                    maxLength={8}
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="VD: HV8K2M"
                    aria-label="Mã phòng bạn bè"
                    className="bvn-input flex-1 font-bvn text-base uppercase tracking-[0.2em]"
                  />
                  <button
                    type="submit"
                    disabled={!joinCodeInput.trim() || isJoining}
                    className="px-btn px-btn-cerulean disabled:opacity-45 px-5 py-2 text-sm font-black cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    {isJoining ? 'Đang vào...' : 'Tham gia'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 3. SINGLE PRACTICE POP-UP */}
      {activeModal === 'single' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chọn chế độ Tự luyện từ vựng"
          className="fixed inset-0 z-50 bg-[#05070D]/80 backdrop-blur-[3px] flex items-center justify-center p-3 sm:p-4"
        >
          <div className="w-full max-w-2xl bvn-modal-surface p-4 sm:p-5 space-y-4 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F4D06F]" />
                <div>
                  <div className="font-bvn text-lg sm:text-xl font-bold text-[#F4D06F]">
                    SINGLE · TỰ LUYỆN TỪ VỰNG
                  </div>
                  <p className="text-xs font-semibold text-[#94A3B8]">
                    Chọn bộ từ vựng &amp; chế độ luyện tập — Bản đồ thi đấu quay ngẫu nhiên!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Đóng pop-up Tự luyện"
                className="bvn-btn-ghost p-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[#38BDF8] uppercase tracking-wider block">
                Bộ từ vựng luyện tập
              </label>
              <select
                aria-label="Chọn bộ từ tự luyện"
                value={arena.selectedTopicId}
                onChange={(e) => arena.setSelectedTopicId(e.target.value)}
                className="bvn-select"
              >
                <option value="">🌐 Kho Từ Chung HiVocab</option>
                {arena.topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.isMine ? '⭐ ' : '📚 '}
                    {t.name} ({t.wordCount || '?'} từ)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ALL_SINGLE_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={Boolean(rollingMapName)}
                  onClick={() => handleStartSingle(m.id)}
                  className="bvn-card p-3 text-left flex items-start gap-3 cursor-pointer hover:border-[#F4D06F]"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#0B0E14] border border-white/20 flex items-center justify-center shrink-0">
                    <PixelModeIcon modeId={m.id} size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-black text-white truncate">{m.label}</span>
                      <span className="font-bvn text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[#0B0E14] text-[#F4D06F] border border-[#F4D06F]/30 shrink-0">
                        {m.badge}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-[#94A3B8] mt-0.5 line-clamp-2">
                      {m.shortDesc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. SETTING POP-UP: Audio + Effects + Main Menu Background Switcher */}
      {activeModal === 'settings' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cài đặt Đấu trường và Background"
          className="fixed inset-0 z-50 bg-[#05070D]/80 backdrop-blur-[3px] flex items-center justify-center p-3 sm:p-4"
        >
          <div className="w-full max-w-lg bvn-modal-surface p-4 sm:p-5 space-y-4 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#F4D06F]" />
                <h3 className="font-bvn text-lg font-bold text-[#F4D06F]">CÀI ĐẶT ĐẤU TRƯỜNG</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Đóng cài đặt"
                className="bvn-btn-ghost p-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Audio & Accessibility Toggles */}
            {feel && (
              <div className="bvn-card p-3.5 space-y-3 text-xs font-extrabold">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#38BDF8]">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Âm thanh &amp; Hiệu ứng chiến đấu</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#E2E8F0]">Nhạc nền sảnh ({Math.round(bgmVolume * 100)}%)</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(bgmVolume * 100)}
                    onChange={(e) => handleBgmVolumeChange(Number(e.target.value) / 100)}
                    aria-label="Âm lượng nhạc nền sảnh"
                    className="w-32 accent-[#38BDF8] cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#E2E8F0]">Âm lượng SFX ({Math.round(feel.sfxVolume * 100)}%)</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(feel.sfxVolume * 100)}
                    onChange={(e) => feel.setSfxVolume(Number(e.target.value) / 100)}
                    aria-label="Âm lượng hiệu ứng SFX"
                    className="w-32 accent-[#F4D06F] cursor-pointer"
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
                  <span>Giảm chớp sáng &amp; Cut-In</span>
                  <input
                    type="checkbox"
                    checked={feel.reduceFlash}
                    onChange={(e) => feel.setReduceFlash(e.target.checked)}
                    className="w-4 h-4 accent-[#F4D06F]"
                  />
                </label>
              </div>
            )}

            {/* Background Selector (6 real BVN maps for Main Menu background!) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#38BDF8]">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Đổi Background Sảnh Chính ({ARENA_STAGES.length})</span>
                </div>
                <span className="text-[11px] font-bold text-[#F4D06F]">{lobbyBg.name}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ARENA_STAGES.map((bg) => {
                  const active = bg.id === lobbyBg.id;
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => {
                        if (!arena.soundMuted) playBattleSfx('ui_select');
                        onSelectLobbyBg?.(bg.id);
                      }}
                      className={`p-1.5 text-left cursor-pointer flex flex-col gap-1.5 ${
                        active ? 'bvn-card-active' : 'bvn-card'
                      }`}
                    >
                      <div
                        className="w-full h-14 rounded-md overflow-hidden border border-white/20"
                        style={{ background: bg.swatchBg }}
                      >
                        <img
                          src={bg.previewUrl}
                          alt={bg.name}
                          crossOrigin="anonymous"
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[11px] font-black text-white truncate px-0.5">{bg.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-btn px-btn-primary w-full py-2.5 text-sm font-black cursor-pointer"
            >
              Lưu &amp; Đóng
            </button>
          </div>
        </div>
      )}

      {/* 5. LEADERBOARD POP-UP (Unified BVN Dark-Gold UI) */}
      {activeModal === 'leaderboard' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bảng Xếp Hạng Đấu Trường"
          className="fixed inset-0 z-50 bg-[#05070D]/80 backdrop-blur-[3px] flex items-center justify-center p-3 sm:p-4"
        >
          <div className="w-full max-w-md bvn-modal-surface p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <PixelIcon name="trophy" size={22} />
                <div>
                  <h3 className="font-bvn text-base font-bold text-[#F4D06F]">BẢNG XẾP HẠNG ELO</h3>
                  <div className="text-[11px] font-semibold text-[#94A3B8]">Top học viên PvP HiVocab</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={arena.loadLobbyMeta}
                  title="Làm mới"
                  className="bvn-btn-ghost p-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${arena.isLoadingMeta ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  aria-label="Đóng BXH"
                  className="bvn-btn-ghost p-2 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {!user ? (
              <div className="bvn-card p-5 text-center space-y-3">
                <p className="text-xs font-bold text-[#CBD5E1]">
                  Đăng nhập để lưu điểm ELO, mở khóa huy hiệu xếp hạng và tranh Top 1v1!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    onRequireLogin?.('Đăng nhập để tham gia PvP & xem Bảng xếp hạng!');
                  }}
                  className="px-btn px-btn-primary px-4 py-2 text-xs font-black cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
              </div>
            ) : arena.leaderboard.length === 0 ? (
              <div className="bvn-card p-5 text-center text-xs font-bold text-[#94A3B8]">
                Chưa có trận PvP nào được ghi nhận hôm nay.
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {arena.leaderboard.map((row) => {
                  const isMe = row.userId === user.id;
                  return (
                    <div
                      key={row.userId}
                      className={`flex items-center justify-between gap-2.5 p-2.5 ${
                        isMe ? 'bvn-card-active' : 'bvn-card'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-[#F4D06F] text-[#0B0E14] font-bvn text-xs font-bold flex items-center justify-center shrink-0">
                          {row.rank === 1 ? <PixelIcon name="crown" size={14} /> : row.rank}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate">{row.displayName}</div>
                          <div className="text-[10.5px] font-semibold text-[#94A3B8]">
                            {row.tier?.name} · {row.wins}W-{row.losses}L
                          </div>
                        </div>
                      </div>
                      <span className="font-bvn text-sm font-bold text-[#F4D06F]">{row.elo} ELO</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
