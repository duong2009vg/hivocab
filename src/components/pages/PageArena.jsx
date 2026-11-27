// src/components/pages/PageArena.jsx
// Full-screen Bleach vs Naruto (BVN) Learning Arena (#arena) with user-customizable Lobby BG & random Battle Stage.
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useRoute } from '../../router/RouteContext.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import { useBattleArena } from '../../hooks/useBattleArena.js';
import { useBattleFeel } from '../../hooks/useBattleFeel.js';
import { getCharacterById, getStageById, pickRandomStage } from '../arena/CharacterRoster.js';
import { loadBvnManifest } from '../../services/bvnAssetLoader.js';
import { preloadBvnSfx, startLobbyBgm, stopLobbyBgm } from '../../services/sound.js';
import ArenaLobbyView from '../arena/ArenaLobbyView.jsx';
import CharacterSelectView from '../arena/CharacterSelectView.jsx';
import { BattleWaitingView, BattleVsScreen } from '../arena/BattleWaitingAndVsView.jsx';
import BattleMatchArena from '../arena/BattleMatchArena.jsx';
import BattleResultView from '../arena/BattleResultView.jsx';

const CHAR_STORAGE_KEY = 'hi_arena_char_v1';
const LOBBY_BG_STORAGE_KEY = 'hi_arena_bg_v1';
const LEGACY_STAGE_STORAGE_KEY = 'hi_arena_stage_v1';

function readStoredId(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage?.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function parseInitialRoomCode() {
  if (typeof window === 'undefined') return '';
  const hash = window.location.hash || '';
  const qIndex = hash.indexOf('?');
  const searchStr = qIndex !== -1 ? hash.slice(qIndex) : window.location.search;
  if (!searchStr) return '';
  try {
    const params = new URLSearchParams(searchStr);
    return String(params.get('room') || '').trim().toUpperCase();
  } catch {
    return '';
  }
}

export function PageArena({ onMatchStateChange }) {
  const { user } = useAuth();
  const { navigateTo } = useRoute();
  const { openModal } = useModal();
  const initialRoomCode = parseInitialRoomCode();

  const [lobbyScreen, setLobbyScreen] = useState('main'); // 'main' | 'character'
  const [selectedCharacterId, setSelectedCharacterId] = useState(() =>
    getCharacterById(readStoredId(CHAR_STORAGE_KEY, 'ichigo')).id
  );
  // Main Menu background (customizable in Settings)
  const [lobbyBgId, setLobbyBgId] = useState(() =>
    getStageById(
      readStoredId(LOBBY_BG_STORAGE_KEY, readStoredId(LEGACY_STAGE_STORAGE_KEY, 'muyecun'))
    ).id
  );
  // Active Battle Stage (rolled randomly for every match!)
  const [matchStageId, setMatchStageId] = useState(() => pickRandomStage().id);

  const arena = useBattleArena({ user, initialRoomCode, selectedCharacterId });
  const feel = useBattleFeel();
  const { triggerCombatEvent, resetCombatVisuals, sfxVolume } = feel;
  const { combatEvent, phase, soundMuted, setSoundMuted } = arena;

  useEffect(() => {
    loadBvnManifest();
    preloadBvnSfx();
    return () => {
      stopLobbyBgm();
    };
  }, []);

  useEffect(() => {
    if (phase === 'lobby') {
      startLobbyBgm();
    } else {
      stopLobbyBgm();
    }
  }, [phase]);

  const selectedCharacter = getCharacterById(selectedCharacterId);
  const lobbyBg = getStageById(lobbyBgId);
  const matchStage = getStageById(matchStageId);

  const handleEquipCharacter = (charId) => {
    setSelectedCharacterId(charId);
    try {
      window.localStorage?.setItem(CHAR_STORAGE_KEY, charId);
    } catch (_) {}
  };

  const handleSelectLobbyBg = (bgId) => {
    const next = getStageById(bgId).id;
    setLobbyBgId(next);
    try {
      window.localStorage?.setItem(LOBBY_BG_STORAGE_KEY, next);
    } catch (_) {}
  };

  const handleRollRandomMatchStage = useCallback(() => {
    setMatchStageId((prev) => pickRandomStage(prev).id);
  }, []);

  useEffect(() => {
    onMatchStateChange?.(arena.isMatchActive);
    return () => onMatchStateChange?.(false);
  }, [arena.isMatchActive, onMatchStateChange]);

  useEffect(() => {
    if (combatEvent) {
      triggerCombatEvent(combatEvent);
    }
  }, [combatEvent, triggerCombatEvent]);

  useEffect(() => {
    if (phase === 'lobby' || phase === 'waiting') {
      resetCombatVisuals();
    }
    if (phase !== 'lobby') {
      setLobbyScreen('main');
    }
    if (phase === 'vs_intro') {
      handleRollRandomMatchStage();
    }
  }, [phase, resetCombatVisuals, handleRollRandomMatchStage]);

  useEffect(() => {
    const muted = sfxVolume <= 0;
    if (soundMuted !== muted) {
      setSoundMuted(muted);
    }
  }, [sfxVolume, soundMuted, setSoundMuted]);

  const handleRequireLogin = (message) => {
    openModal('requireLogin', {
      title: 'Đăng nhập để thi đấu 1v1',
      message: message || 'Đăng nhập tài khoản HiVocab để ghép trận PvP và lưu điểm xếp hạng ELO.',
      actionName: 'Đấu trường Từ vựng',
    });
  };

  const handleExitToApp = () => {
    navigateTo('dashboard');
  };

  return (
    <main className="min-h-screen w-full bvn-shell text-[#FAF5EB]">
      {arena.phase === 'lobby' && lobbyScreen === 'character' && (
        <CharacterSelectView
          selectedCharacterId={selectedCharacter.id}
          lobbyBg={lobbyBg}
          onSelectCharacter={handleEquipCharacter}
          onBack={() => setLobbyScreen('main')}
          soundMuted={arena.soundMuted}
        />
      )}

      {arena.phase === 'lobby' && lobbyScreen === 'main' && (
        <ArenaLobbyView
          arena={arena}
          user={user}
          feel={feel}
          selectedCharacter={selectedCharacter}
          lobbyBg={lobbyBg}
          onSelectLobbyBg={handleSelectLobbyBg}
          onRollRandomStage={handleRollRandomMatchStage}
          onOpenCharacter={() => setLobbyScreen('character')}
          onExitGame={handleExitToApp}
          onRequireLogin={handleRequireLogin}
        />
      )}

      {arena.phase === 'waiting' && (
        <BattleWaitingView
          arena={arena}
          user={user}
          selectedCharacter={selectedCharacter}
          selectedStage={matchStage}
        />
      )}
      {arena.phase === 'vs_intro' && (
        <BattleVsScreen
          arena={arena}
          selectedCharacter={selectedCharacter}
          selectedStage={matchStage}
        />
      )}
      {arena.phase === 'playing' && (
        <BattleMatchArena
          arena={arena}
          feel={feel}
          selectedCharacter={selectedCharacter}
          selectedStage={matchStage}
        />
      )}
      {arena.phase === 'finished' && (
        <BattleResultView
          arena={arena}
          feel={feel}
          selectedCharacter={selectedCharacter}
          lobbyBg={lobbyBg}
          onRollRandomStage={handleRollRandomMatchStage}
        />
      )}
    </main>
  );
}

export default PageArena;
