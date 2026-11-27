// src/hooks/useBattleArena.js
// Unified state machine for both Realtime PvP WebSocket battles (Cloudflare DO) and Solo Arcade.
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BATTLE_BOT_WAIT_MS,
  BATTLE_FAST_NEXT_MS,
  BATTLE_MISS_NEXT_MS,
  BATTLE_START_HP,
  BATTLE_VS_INTRO_MS,
  calculateRoundScoreAndDamage,
  generateSoloDeck,
  getComboChainMeta,
  getModeMeta,
} from '../utils/battleEngine.js';
import {
  buildBattleWebSocketUrl,
  createPrivateBattleRoom,
  enterQuickMatchQueue,
  fetchArenaLeaderboard,
  fetchArenaTopics,
  fetchSoloWords,
  joinPrivateBattleRoom,
  recordSoloBattleXp,
} from '../services/battleService.js';
import { playBattleSfx, playCharacterUltiSfx, playWordAudio, preloadCharacterUltiSfx } from '../services/sound.js';

export function useBattleArena({ user = null, initialRoomCode = '', selectedCharacterId = 'ichigo' } = {}) {
  const [phase, setPhase] = useState('lobby'); // 'lobby' | 'waiting' | 'vs_intro' | 'playing' | 'finished'
  const [selectedMode, setSelectedMode] = useState('speed_blitz');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [topics, setTopics] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selfProfile, setSelfProfile] = useState(null);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);

  const [isSolo, setIsSolo] = useState(false);
  const [matchType, setMatchType] = useState('quick'); // 'quick' | 'private' | 'bot' | 'solo'
  const [roomId, setRoomId] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [topicName, setTopicName] = useState('Kho Từ Vựng Chung HiVocab');
  const [errorMsg, setErrorMsg] = useState('');
  const [soundMuted, setSoundMuted] = useState(false);

  const [players, setPlayers] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(15);
  const [roundStartedAt, setRoundStartedAt] = useState(0);
  const [roundDeadline, setRoundDeadline] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(12000);
  const [vsTimeLeftMs, setVsTimeLeftMs] = useState(BATTLE_VS_INTRO_MS);
  const [question, setQuestion] = useState(null);
  const [roundFeedback, setRoundFeedback] = useState(null); // { isCorrect, correctAnswer, pointsEarned, ... }
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [doubleStrikeActive, setDoubleStrikeActive] = useState(false);
  const [wordDuelGuessed, setWordDuelGuessed] = useState([]);
  const [wordDuelMask, setWordDuelMask] = useState('');
  const [flashMatchedIds, setFlashMatchedIds] = useState([]);
  const [floatingEvents, setFloatingEvents] = useState([]); // { id, side: 'self'|'opp', text, tone }
  const [activeEmotes, setActiveEmotes] = useState({ self: null, opp: null });
  const [botReadyOffer, setBotReadyOffer] = useState(false);

  const [winnerUserId, setWinnerUserId] = useState(null);
  const [reviewWords, setReviewWords] = useState([]);
  const [combatEvent, setCombatEvent] = useState(null);
  const [soloEnemyHp, setSoloEnemyHp] = useState(BATTLE_START_HP);

  const wsRef = useRef(null);
  const soloDeckRef = useRef([]);
  const soloTimersRef = useRef([]);
  const soloStatsRef = useRef({ totalMs: 0, answers: 0, correct: 0, outcomes: {} });
  const soloEnemyHpRef = useRef(BATTLE_START_HP);
  const mutedRef = useRef(soundMuted);
  mutedRef.current = soundMuted;
  const charIdRef = useRef(selectedCharacterId);
  charIdRef.current = selectedCharacterId;

  const myUserId = user?.id || 'guest:local';

  const emitCombatEvent = useCallback((payload) => {
    setCombatEvent({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...payload,
    });
  }, []);

  const pushFloating = useCallback((side, text, tone = 'dmg') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setFloatingEvents((prev) => [...prev.slice(-5), { id, side, text, tone }]);
    setTimeout(() => {
      setFloatingEvents((prev) => prev.filter((item) => item.id !== id));
    }, 1150);
  }, []);

  const triggerSfx = useCallback((name, opts = {}) => {
    if (!mutedRef.current) {
      playBattleSfx(name, opts);
    }
  }, []);

  const clearSoloTimers = useCallback(() => {
    for (const t of soloTimersRef.current) {
      clearTimeout(t);
    }
    soloTimersRef.current = [];
  }, []);

  const closeSocket = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close(1000, 'Leave arena');
      } catch (_) {}
      wsRef.current = null;
    }
  }, []);

  const loadLobbyMeta = useCallback(async () => {
    if (!user) {
      setSelfProfile(null);
      setLeaderboard([]);
      return;
    }
    setIsLoadingMeta(true);
    try {
      const [lbRes, topicRes] = await Promise.all([
        fetchArenaLeaderboard().catch(() => null),
        fetchArenaTopics().catch(() => null),
      ]);
      if (lbRes?.ok) {
        setLeaderboard(lbRes.leaderboard || []);
        setSelfProfile(lbRes.self || null);
      }
      if (topicRes?.ok) {
        setTopics(topicRes.topics || []);
      }
    } finally {
      setIsLoadingMeta(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedCharacterId) preloadCharacterUltiSfx(selectedCharacterId);
  }, [selectedCharacterId]);

  useEffect(() => {
    loadLobbyMeta();
  }, [loadLobbyMeta]);

  useEffect(() => {
    return () => {
      closeSocket();
      clearSoloTimers();
    };
  }, [closeSocket, clearSoloTimers]);

  // Countdown tick timer during active round / VS intro
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'vs_intro') return undefined;
    let lastSecondTick = -1;

    const timer = setInterval(() => {
      const now = Date.now();
      if (phase === 'vs_intro') {
        const rem = Math.max(0, roundDeadline - now);
        setVsTimeLeftMs(rem);
        return;
      }
      const rem = Math.max(0, roundDeadline - now);
      setTimeLeftMs(rem);
      const sec = Math.ceil(rem / 1000);
      if (sec <= 3 && sec >= 1 && sec !== lastSecondTick && !roundFeedback) {
        lastSecondTick = sec;
        triggerSfx('tick');
      }
    }, 100);

    return () => clearInterval(timer);
  }, [phase, roundDeadline, roundFeedback, triggerSfx]);

  // Offer Bot sparring after 8s in Quick Match queue
  useEffect(() => {
    if (phase !== 'waiting' || matchType !== 'quick') {
      setBotReadyOffer(false);
      return undefined;
    }
    setBotReadyOffer(false);
    const t = setTimeout(() => {
      setBotReadyOffer(true);
    }, BATTLE_BOT_WAIT_MS);
    return () => clearTimeout(t);
  }, [phase, matchType]);

  const handleServerEvent = useCallback(
    (msg) => {
      if (!msg || !msg.type) return;

      if (msg.type === 'room_snapshot') {
        setRoomId(msg.roomId || '');
        setRoomCode(msg.roomCode || '');
        if (msg.mode) setSelectedMode(msg.mode);
        if (msg.topicName) setTopicName(msg.topicName);
        if (msg.totalRounds) setTotalRounds(msg.totalRounds);
        if (Array.isArray(msg.players)) setPlayers(msg.players);

        if (msg.status === 'waiting') {
          setPhase('waiting');
        } else if (msg.status === 'vs_intro') {
          setPhase('vs_intro');
          setRoundDeadline(msg.vsEndsAt || Date.now() + BATTLE_VS_INTRO_MS);
        } else if (msg.status === 'playing') {
          setPhase('playing');
          setCurrentRound(msg.currentRound || 0);
          setRoundStartedAt(msg.roundStartedAt || Date.now());
          setRoundDeadline(msg.roundDeadline || Date.now() + 12000);
          setQuestion(msg.question || null);
          setWordDuelMask(msg.question?.pattern || '');
        } else if (msg.status === 'finished') {
          setPhase('finished');
          setWinnerUserId(msg.winnerUserId || null);
          setReviewWords(msg.reviewWords || []);
        }
        return;
      }

      if (msg.type === 'match_found') {
        setPlayers(msg.players || []);
        setTotalRounds(msg.totalRounds || 15);
        setTopicName(msg.topicName || 'Kho Từ Vựng Chung HiVocab');
        setRoundDeadline(msg.vsEndsAt || Date.now() + BATTLE_VS_INTRO_MS);
        setVsTimeLeftMs(BATTLE_VS_INTRO_MS);
        setPhase('vs_intro');
        triggerSfx('vs_gong');
        return;
      }

      if (msg.type === 'round_start') {
        setPhase('playing');
        setCurrentRound(msg.roundIndex || 0);
        setTotalRounds(msg.totalRounds || 15);
        setRoundStartedAt(msg.roundStartedAt || Date.now());
        setRoundDeadline(msg.roundDeadline || Date.now() + 12000);
        setTimeLeftMs(Math.max(1000, (msg.roundDeadline || Date.now() + 12000) - Date.now()));
        setQuestion(msg.question || null);
        if (Array.isArray(msg.players)) setPlayers(msg.players);
        setRoundFeedback(null);
        setEliminatedOptions([]);
        setDoubleStrikeActive(false);
        setWordDuelGuessed([]);
        setWordDuelMask(msg.question?.pattern || '');
        setFlashMatchedIds([]);

        if ((msg.roundIndex || 0) === 0) {
          triggerSfx('fight_start');
          emitCombatEvent({ type: 'fight_start', sublabel: '1VS1!' });
        }

        if (msg.question?.audioWord && !mutedRef.current) {
          setTimeout(() => playWordAudio(msg.question.audioWord, 0.92), 120);
        }
        return;
      }

      if (msg.type === 'round_deadline_updated') {
        if (msg.roundDeadline) {
          setRoundDeadline(msg.roundDeadline);
          setTimeLeftMs(Math.max(400, msg.roundDeadline - Date.now()));
        }
        return;
      }

      if (msg.type === 'answer_ack') {
        if (Array.isArray(msg.players)) setPlayers(msg.players);
        const me = msg.players?.find((p) => p.userId === myUserId);
        const combo = me?.combo || 0;
        const chainLabel = msg.comboLabel || `${Math.min(5, Math.max(1, combo))}x`;
        setRoundFeedback({
          isCorrect: Boolean(msg.isCorrect),
          firstStrike: Boolean(msg.firstStrike),
          lostTurn: Boolean(msg.lostTurn),
          comboLabel: chainLabel,
          enemyDamage: msg.enemyDamage || 0,
          selfDamage: msg.selfDamage || 0,
          correctAnswer: msg.correctAnswer || '',
          pointsEarned: msg.pointsEarned || 0,
        });
        if (msg.isCorrect) {
          const dmg = msg.enemyDamage || 12;
          pushFloating('opp', `${chainLabel} -${dmg} HP`, 'dmg');
          pushFloating('self', `+${msg.pointsEarned || 100}`, 'pts');
          const isCrit = combo >= 3 || dmg >= 24;
          triggerSfx(isCrit ? 'crit' : 'hit', { combo });
          emitCombatEvent({
            type: isCrit ? 'p1_crit' : 'p1_hit',
            label: combo >= 2 ? `${chainLabel} COMBO! -${dmg} HP` : `1x ĐÒN! -${dmg} HP`,
            sublabel: `+${msg.pointsEarned || 100} PTS`,
            combo,
          });
        } else {
          const selfDmg = msg.selfDamage || 10;
          pushFloating('self', `Mất lượt -${selfDmg} HP`, 'selfDmg');
          triggerSfx('damage');
          emitCombatEvent({
            type: 'self_damage',
            label: `MẤT LƯỢT -${selfDmg} HP`,
            sublabel: 'COMBO RESET',
          });
        }
        return;
      }

      if (msg.type === 'opponent_acted') {
        if (Array.isArray(msg.players)) setPlayers(msg.players);
        if (msg.actorUserId && msg.actorUserId !== myUserId) {
          if (msg.isCorrect) {
            const dmg = msg.enemyDamage || 12;
            const oppLabel = msg.comboLabel || '1x';
            pushFloating('self', `${oppLabel} -${dmg} HP`, 'selfDmg');
            triggerSfx('damage');
            emitCombatEvent({
              type: 'p2_hit',
              label: `-${dmg} HP`,
              sublabel: msg.firstStrike ? `ĐỐI THỦ ${oppLabel}!` : 'RIVAL HIT!',
            });
            if (msg.firstStrike) {
              setRoundFeedback((prev) =>
                prev?.lostTurn
                  ? prev
                  : {
                      isCorrect: false,
                      rivalFirstStrike: true,
                      enemyDamage: dmg,
                      comboLabel: oppLabel,
                      correctAnswer: '',
                      pointsEarned: 0,
                    }
              );
            }
          } else if (msg.selfDamage) {
            pushFloating('opp', `Trượt -${msg.selfDamage} HP`, 'dmg');
          }
        }
        return;
      }

      if (msg.type === 'opponent_progress') {
        if (Array.isArray(msg.players)) setPlayers(msg.players);
        if (msg.enemyDamage && msg.actorUserId !== myUserId) {
          pushFloating('self', `-${msg.enemyDamage} HP`, 'selfDmg');
          emitCombatEvent({
            type: 'p2_hit',
            label: `-${msg.enemyDamage} HP`,
            sublabel: 'RIVAL ATTACK!',
          });
        }
        return;
      }

      if (msg.type === 'word_duel_letter_ack') {
        if (Array.isArray(msg.players)) setPlayers(msg.players);
        if (Array.isArray(msg.guessedLetters)) setWordDuelGuessed(msg.guessedLetters);
        if (msg.maskedPattern) setWordDuelMask(msg.maskedPattern);
        if (msg.hit) {
          triggerSfx('hit');
          emitCombatEvent({ type: 'p1_hit', label: 'NICE!', sublabel: '' });
        } else {
          pushFloating('self', '-2 HP', 'selfDmg');
          triggerSfx('damage');
          emitCombatEvent({ type: 'self_damage', label: '-2 HP', sublabel: '' });
        }
        return;
      }

      if (msg.type === 'flash_pair_ack') {
        if (Array.isArray(msg.players)) setPlayers(msg.players);
        if (Array.isArray(msg.matchedPairs)) setFlashMatchedIds(msg.matchedPairs);
        if (msg.isMatch) {
          const dmg = msg.enemyDamage || 9;
          pushFloating('opp', `-${dmg} HP`, 'dmg');
          pushFloating('self', `+${msg.pointsEarned || 60}`, 'pts');
          triggerSfx('hit');
          emitCombatEvent({
            type: 'p1_hit',
            label: `-${dmg} HP`,
            sublabel: `+${msg.pointsEarned || 60} PTS`,
          });
        } else {
          const selfDmg = msg.selfDamage || 4;
          pushFloating('self', `-${selfDmg} HP`, 'selfDmg');
          triggerSfx('damage');
          emitCombatEvent({
            type: 'self_damage',
            label: `-${selfDmg} HP`,
            sublabel: 'WRONG PAIR',
          });
        }
        return;
      }

      if (msg.type === 'powerup_applied') {
        setPlayers((prev) =>
          prev.map((p) => (p.userId === myUserId ? { ...p, powerUps: msg.powerUps || p.powerUps } : p))
        );
        if (Array.isArray(msg.eliminateOptions)) {
          setEliminatedOptions(msg.eliminateOptions);
        }
        if (msg.revealLetter) {
          setWordDuelGuessed((prev) => Array.from(new Set([...prev, msg.revealLetter])));
        }
        if (msg.maskedPattern) {
          setWordDuelMask(msg.maskedPattern);
        }
        if (msg.powerUp === 'double_strike') {
          setDoubleStrikeActive(true);
        }
        triggerSfx('powerup');
        emitCombatEvent({
          type: 'powerup',
          label: msg.powerUp === 'double_strike' ? 'x2 POWER!' : msg.powerUp === 'fifty_fifty' ? '50/50 CUT!' : '0.75x FOCUS',
          sublabel: 'SKILL ACTIVE',
        });
        return;
      }

      if (msg.type === 'round_reveal') {
        if (Array.isArray(msg.players)) setPlayers(msg.players);
        const rivalWon = Boolean(msg.winnerUserId && msg.winnerUserId !== myUserId);
        setRoundFeedback((prev) =>
          prev
            ? {
                ...prev,
                correctAnswer: prev.correctAnswer || msg.correctAnswer || '',
                meaning: prev.meaning || msg.meaning || '',
              }
            : {
                isCorrect: false,
                rivalFirstStrike: rivalWon,
                correctAnswer: msg.correctAnswer || '',
                meaning: msg.meaning || '',
                pointsEarned: 0,
                timeout: !rivalWon,
              }
        );
        return;
      }

      if (msg.type === 'players_updated') {
        if (Array.isArray(msg.players)) setPlayers(msg.players);
        return;
      }

      if (msg.type === 'ultimate_used') {
        if (Array.isArray(msg.players)) setPlayers(msg.players);
        const isSelfActor = msg.actorUserId === myUserId;
        const dmg = msg.enemyDamage || 28;
        const actorCharId = msg.characterId || (isSelfActor ? charIdRef.current : 'naruto');
        if (!mutedRef.current) {
          playCharacterUltiSfx(actorCharId);
        }
        if (isSelfActor) {
          pushFloating('opp', `-${dmg} HP ULTI!`, 'dmg');
          pushFloating('self', `+${msg.pointsEarned || 160}`, 'pts');
          emitCombatEvent({
            type: 'p1_ulti',
            label: `ULTIMATE! -${dmg} HP`,
            sublabel: `+${msg.pointsEarned || 160} PTS`,
          });
        } else {
          pushFloating('self', `-${dmg} HP ULTI!`, 'selfDmg');
          emitCombatEvent({
            type: 'p2_ulti',
            label: `RIVAL ULTI! -${dmg} HP`,
            sublabel: 'TUYỆT CHIÊU!',
          });
        }
        return;
      }

      if (msg.type === 'emote') {
        const side = msg.fromUserId === myUserId ? 'self' : 'opp';
        setActiveEmotes((prev) => ({ ...prev, [side]: { id: msg.ts, emote: msg.emote } }));
        triggerSfx('emote');
        setTimeout(() => {
          setActiveEmotes((prev) =>
            prev[side]?.id === msg.ts ? { ...prev, [side]: null } : prev
          );
        }, 2000);
        return;
      }

      if (msg.type === 'match_finished') {
        setPhase('finished');
        if (Array.isArray(msg.players)) setPlayers(msg.players);
        setWinnerUserId(msg.winnerUserId || null);
        setReviewWords(msg.reviewWords || []);
        const won = msg.winnerUserId === myUserId || msg.winnerUserId === null;
        triggerSfx('ko');
        setTimeout(() => triggerSfx(won ? 'victory' : 'defeat'), 180);
        emitCombatEvent({ type: won ? 'ko_win' : 'ko_lose' });
        loadLobbyMeta();
        return;
      }

      if (msg.type === 'room_cancelled') {
        closeSocket();
        setPhase('lobby');
        return;
      }

      if (msg.type === 'error') {
        setErrorMsg(msg.error || 'Lỗi kết nối phòng đấu.');
      }
    },
    [emitCombatEvent, myUserId, pushFloating, triggerSfx, loadLobbyMeta, closeSocket]
  );

  const connectRoomWebSocket = useCallback(
    (targetRoomId, ticket) => {
      closeSocket();
      const wsUrl = buildBattleWebSocketUrl(targetRoomId, ticket);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        try {
          if (charIdRef.current) {
            ws.send(JSON.stringify({ type: 'set_character', characterId: charIdRef.current }));
          }
        } catch (_) {}
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          handleServerEvent(parsed);
        } catch (_) {}
      };

      ws.onerror = () => {
        setErrorMsg('Kết nối WebSocket bị gián đoạn. Đang thử đồng bộ lại...');
      };
    },
    [closeSocket, handleServerEvent]
  );

  const startQuickMatch = useCallback(
    async (modeOverride = null, topicOverride = null) => {
      setErrorMsg('');
      const mode = modeOverride || selectedMode;
      const tId = topicOverride !== null ? topicOverride : selectedTopicId || null;
      setSelectedMode(mode);
      setIsSolo(false);
      setMatchType('quick');
      try {
        const res = await enterQuickMatchQueue({
          mode,
          topicId: tId,
          characterId: charIdRef.current,
        });
        setRoomId(res.roomId);
        setRoomCode(res.roomCode);
        setTopicName(res.topicName || 'Kho Từ Vựng Chung HiVocab');
        setPhase('waiting');
        connectRoomWebSocket(res.roomId, res.ticket);
      } catch (err) {
        setErrorMsg(err?.message || 'Không thể tìm trận lúc này.');
      }
    },
    [selectedMode, selectedTopicId, connectRoomWebSocket]
  );

  const startPrivateRoom = useCallback(
    async (modeOverride = null, topicOverride = null) => {
      setErrorMsg('');
      const mode = modeOverride || selectedMode;
      const tId = topicOverride !== null ? topicOverride : selectedTopicId || null;
      setSelectedMode(mode);
      setIsSolo(false);
      setMatchType('private');
      try {
        const res = await createPrivateBattleRoom({
          mode,
          topicId: tId,
          characterId: charIdRef.current,
        });
        setRoomId(res.roomId);
        setRoomCode(res.roomCode);
        setTopicName(res.topicName || 'Kho Từ Vựng Chung HiVocab');
        setPhase('waiting');
        connectRoomWebSocket(res.roomId, res.ticket);
        return res;
      } catch (err) {
        setErrorMsg(err?.message || 'Không thể tạo phòng bạn bè.');
        return null;
      }
    },
    [selectedMode, selectedTopicId, connectRoomWebSocket]
  );

  const joinRoomByCode = useCallback(
    async (code) => {
      setErrorMsg('');
      setIsSolo(false);
      setMatchType('private');
      try {
        const res = await joinPrivateBattleRoom(code, charIdRef.current);
        setRoomId(res.roomId);
        setRoomCode(res.roomCode);
        if (res.mode) setSelectedMode(res.mode);
        setPhase('waiting');
        connectRoomWebSocket(res.roomId, res.ticket);
        return true;
      } catch (err) {
        setErrorMsg(err?.message || 'Không tìm thấy phòng với mã này.');
        return false;
      }
    },
    [connectRoomWebSocket]
  );

  // Auto-join via deep link (?room=XXXXXX) if authenticated
  useEffect(() => {
    if (!user || !initialRoomCode || phase !== 'lobby') return;
    joinRoomByCode(initialRoomCode);
  }, [user, initialRoomCode, phase, joinRoomByCode]);

  const requestBotNow = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setMatchType('bot');
      wsRef.current.send(JSON.stringify({ type: 'request_bot' }));
    }
  }, []);

  // ── Solo Arcade Mode (runs cleanly locally for practice or guests) ─────────
  const startSoloRound = useCallback(
    (roundIdx, modeId, finishOverride = null) => {
      clearSoloTimers();
      const deck = soloDeckRef.current;
      if (finishOverride || roundIdx >= deck.length) {
        // Finish solo match (either K.O. or all rounds complete)
        setPhase('finished');
        let resolvedWon = finishOverride ? Boolean(finishOverride.won) : true;
        setPlayers((prev) => {
          const self = prev[0];
          const avgMs = soloStatsRef.current.answers
            ? Math.round(soloStatsRef.current.totalMs / soloStatsRef.current.answers)
            : 0;
          const xpDelta = Math.max(15, Math.min(180, Math.round((self?.score || 0) / 25)));
          if (user) {
            recordSoloBattleXp(xpDelta);
          }
          const updatedSelf = { ...self, avgResponseMs: avgMs, eloDelta: 0, xpDelta };
          if (!finishOverride) {
            resolvedWon = (self?.hp || 0) > 0 && (self?.hp || 0) >= soloEnemyHpRef.current;
          }
          setWinnerUserId(resolvedWon ? self?.userId || myUserId : 'bot:solo_rival');
          return [updatedSelf];
        });
        const builtReview = [];
        const seen = new Set();
        deck.forEach((round, idx) => {
          if (round.kind === 'flash_match') {
            round.pairs.forEach((pair) => {
              if (!seen.has(pair.word.toLowerCase())) {
                seen.add(pair.word.toLowerCase());
                builtReview.push({
                  word: pair.word,
                  phonetic: pair.phonetic,
                  meaning: pair.meaning,
                  example: pair.example,
                  byUser: {},
                });
              }
            });
          } else if (!seen.has(round.word.toLowerCase())) {
            seen.add(round.word.toLowerCase());
            builtReview.push({
              word: round.word,
              phonetic: round.phonetic,
              meaning: round.meaning,
              example: round.example,
              byUser: { [myUserId]: soloStatsRef.current.outcomes[idx] || { isCorrect: false } },
            });
          }
        });
        setReviewWords(builtReview);
        triggerSfx('ko');
        setTimeout(() => triggerSfx(resolvedWon ? 'victory' : 'defeat'), 180);
        emitCombatEvent({ type: resolvedWon ? 'ko_win' : 'ko_lose' });
        return;
      }

      const meta = getModeMeta(modeId);
      const round = deck[roundIdx];
      const now = Date.now();
      const deadline = now + meta.roundTimeMs;

      setPhase('playing');
      setCurrentRound(roundIdx);
      setRoundStartedAt(now);
      setRoundDeadline(deadline);
      setTimeLeftMs(meta.roundTimeMs);
      setQuestion(round);
      setRoundFeedback(null);
      setEliminatedOptions([]);
      setDoubleStrikeActive(false);
      setWordDuelGuessed([]);
      setWordDuelMask(round.pattern || '');
      setFlashMatchedIds([]);

      if (roundIdx === 0) {
        triggerSfx('fight_start');
        emitCombatEvent({ type: 'fight_start', sublabel: 'TỰ LUYỆN!' });
      }

      if (round.audioWord && !mutedRef.current) {
        setTimeout(() => playWordAudio(round.audioWord, 0.92), 120);
      }

      const timeoutId = setTimeout(() => {
        const missDmg = modeId === 'word_duel' ? 12 : 10;
        let playerKo = false;
        setPlayers((prev) => {
          const self = prev[0];
          if (!self) return prev;
          const nextHp = Math.max(0, self.hp - missDmg);
          if (nextHp <= 0) playerKo = true;
          return [{ ...self, hp: nextHp, combo: 0 }];
        });
        setRoundFeedback({
          isCorrect: false,
          correctAnswer: round.word || round.correctAnswer || '',
          selfDamage: missDmg,
          pointsEarned: 0,
          timeout: true,
        });
        pushFloating('self', `-${missDmg} HP`, 'selfDmg');
        triggerSfx('damage');
        emitCombatEvent({ type: 'self_damage', label: `HẾT GIỜ -${missDmg} HP`, sublabel: 'COMBO RESET' });
        soloStatsRef.current.outcomes[roundIdx] = { isCorrect: false };
        const nextId = setTimeout(
          () => startSoloRound(roundIdx + 1, modeId, playerKo ? { won: false } : null),
          BATTLE_MISS_NEXT_MS
        );
        soloTimersRef.current.push(nextId);
      }, meta.roundTimeMs);
      soloTimersRef.current.push(timeoutId);
    },
    [clearSoloTimers, emitCombatEvent, myUserId, pushFloating, triggerSfx, user]
  );

  const startSoloPractice = useCallback(
    async (modeOverride = null, topicOverride = null) => {
      setErrorMsg('');
      closeSocket();
      clearSoloTimers();
      const mode = modeOverride || selectedMode;
      const tId = topicOverride !== null ? topicOverride : selectedTopicId || null;
      const tMeta = topics.find((t) => t.id === tId);
      setSelectedMode(mode);
      setIsSolo(true);
      setMatchType('solo');
      setTopicName(tMeta?.name || 'Kho Từ Vựng Chung HiVocab');

      const words = await fetchSoloWords(tId);
      const deck = generateSoloDeck(words, mode);
      soloDeckRef.current = deck;
      soloStatsRef.current = { totalMs: 0, answers: 0, correct: 0, outcomes: {} };

      const selfPlayer = {
        userId: myUserId,
        displayName: user?.user_metadata?.full_name || user?.user_metadata?.name || 'Bạn học',
        avatarUrl: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '',
        characterId: charIdRef.current || 'ichigo',
        elo: selfProfile?.elo || 1000,
        hp: BATTLE_START_HP,
        maxHp: BATTLE_START_HP,
        mana: 0,
        score: 0,
        combo: 0,
        maxCombo: 0,
        correctCount: 0,
        powerUps: { fifty_fifty: 1, slow_audio: 1, double_strike: 1 },
      };

      soloEnemyHpRef.current = BATTLE_START_HP;
      setSoloEnemyHp(BATTLE_START_HP);
      setPlayers([selfPlayer]);
      setTotalRounds(deck.length);
      startSoloRound(0, mode);
    },
    [clearSoloTimers, closeSocket, myUserId, selfProfile, selectedMode, selectedTopicId, startSoloRound, topics, user]
  );

  const submitAnswer = useCallback(
    (answer) => {
      if (roundFeedback) return;
      if (!isSolo) {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'submit_answer', roundIndex: currentRound, answer }));
        }
        return;
      }

      clearSoloTimers();
      const meta = getModeMeta(selectedMode);
      const round = soloDeckRef.current[currentRound];
      if (!round) return;

      const isCorrect =
        round.kind === 'word_duel'
          ? String(answer || '').toUpperCase().replace(/[^A-Z'-]/g, '') ===
            String(round.correctAnswer || '').toUpperCase().replace(/[^A-Z'-]/g, '')
          : String(answer || '').trim().toLowerCase() === String(round.correctAnswer || '').trim().toLowerCase();

      const elapsed = Date.now() - roundStartedAt;
      soloStatsRef.current.answers += 1;
      soloStatsRef.current.totalMs += elapsed;
      if (isCorrect) soloStatsRef.current.correct += 1;
      soloStatsRef.current.outcomes[currentRound] = { isCorrect };

      const currentSelf = players[0];
      const outcome = calculateRoundScoreAndDamage({
        isCorrect,
        elapsedMs: elapsed,
        timeLimitMs: meta.roundTimeMs,
        streak: currentSelf?.combo || 0,
        doubleStrike: doubleStrikeActive,
        mode: selectedMode,
      });

      const healAmount =
        selectedMode === 'survival_endless' &&
        isCorrect &&
        outcome.nextStreak > 0 &&
        outcome.nextStreak % 3 === 0
          ? 6
          : 0;
      const nextSelfHp = Math.min(
        BATTLE_START_HP,
        Math.max(0, (currentSelf?.hp ?? BATTLE_START_HP) - outcome.selfDamage + healAmount)
      );
      const playerKo = nextSelfHp <= 0;
      let enemyKo = false;

      if (isCorrect) {
        const dealt = outcome.enemyDamage || 12;
        const remEnemyHp = soloEnemyHpRef.current - dealt;
        if (remEnemyHp <= 0) {
          if (selectedMode === 'survival_endless') {
            soloEnemyHpRef.current = BATTLE_START_HP;
            setSoloEnemyHp(BATTLE_START_HP);
          } else {
            soloEnemyHpRef.current = 0;
            setSoloEnemyHp(0);
            enemyKo = true;
          }
        } else {
          soloEnemyHpRef.current = remEnemyHp;
          setSoloEnemyHp(remEnemyHp);
        }

        pushFloating('opp', `${outcome.comboLabel} -${dealt} HP`, 'dmg');
        pushFloating('self', `+${outcome.points}`, 'pts');
        if (healAmount > 0) pushFloating('self', `+${healAmount} HP`, 'pts');
        const isCrit = doubleStrikeActive || outcome.nextStreak >= 3;
        triggerSfx(isCrit ? 'crit' : 'hit', { combo: outcome.nextStreak });
        emitCombatEvent({
          type: isCrit ? 'p1_crit' : 'p1_hit',
          label:
            remEnemyHp <= 0 && selectedMode === 'survival_endless'
              ? 'K.O. ĐỢT MỚI!'
              : healAmount > 0
                ? `+${healAmount} HP · ${outcome.comboLabel}`
                : doubleStrikeActive
                  ? `x2 ${outcome.comboLabel} -${dealt} HP`
                  : `${outcome.comboLabel} ĐÒN! -${dealt} HP`,
          sublabel: `+${outcome.points} PTS`,
          combo: outcome.nextStreak,
        });
      } else {
        pushFloating('self', `Mất lượt -${outcome.selfDamage} HP`, 'selfDmg');
        triggerSfx('damage');
        emitCombatEvent({
          type: 'self_damage',
          label: `MẤT LƯỢT -${outcome.selfDamage} HP`,
          sublabel: 'COMBO RESET',
        });
      }

      setPlayers((prev) => {
        const self = prev[0];
        if (!self) return prev;
        return [
          {
            ...self,
            score: self.score + outcome.points,
            combo: outcome.nextStreak,
            maxCombo: Math.max(self.maxCombo, outcome.nextStreak),
            correctCount: self.correctCount + (isCorrect ? 1 : 0),
            hp: nextSelfHp,
            mana: isCorrect ? Math.min(100, (Number(self.mana) || 0) + 34) : Number(self.mana) || 0,
          },
        ];
      });

      setRoundFeedback({
        isCorrect,
        firstStrike: isCorrect,
        lostTurn: !isCorrect,
        comboLabel: outcome.comboLabel,
        enemyDamage: outcome.enemyDamage,
        selfDamage: outcome.selfDamage,
        correctAnswer: round.word || round.correctAnswer,
        pointsEarned: outcome.points,
      });

      const delayMs = enemyKo || playerKo ? 420 : isCorrect ? BATTLE_FAST_NEXT_MS : BATTLE_MISS_NEXT_MS;
      const finishOverride = enemyKo ? { won: true } : playerKo ? { won: false } : null;
      const t = setTimeout(
        () => startSoloRound(currentRound + 1, selectedMode, finishOverride),
        delayMs
      );
      soloTimersRef.current.push(t);
    },
    [
      clearSoloTimers,
      currentRound,
      doubleStrikeActive,
      emitCombatEvent,
      isSolo,
      players,
      pushFloating,
      roundFeedback,
      roundStartedAt,
      selectedMode,
      startSoloRound,
      triggerSfx,
    ]
  );

  const submitWordDuelLetter = useCallback(
    (letter) => {
      const clean = String(letter || '').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
      if (!clean || roundFeedback) return;
      if (!isSolo) {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'word_duel_letter', roundIndex: currentRound, letter: clean }));
        }
        return;
      }

      const round = soloDeckRef.current[currentRound];
      if (!round) return;
      const nextGuessed = Array.from(new Set([...wordDuelGuessed, clean]));
      setWordDuelGuessed(nextGuessed);
      const guessedSet = new Set(nextGuessed);
      setWordDuelMask(
        String(round.word || '')
          .split('')
          .map((ch) => (!/[A-Za-z]/.test(ch) ? ch : guessedSet.has(ch.toUpperCase()) ? ch.toUpperCase() : '_'))
          .join('')
      );
      const uniqueTarget = Array.from(new Set(String(round.correctAnswer || '').replace(/[^A-Z]/g, '').split('')));
      const hit = uniqueTarget.includes(clean);
      if (hit) {
        const nextEnemy = Math.max(10, soloEnemyHpRef.current - 6);
        soloEnemyHpRef.current = nextEnemy;
        setSoloEnemyHp(nextEnemy);
        setPlayers((prev) =>
          prev.map((p) => ({ ...p, mana: Math.min(100, (Number(p.mana) || 0) + 12) }))
        );
      }
      triggerSfx(hit ? 'hit' : 'damage');
      emitCombatEvent({
        type: hit ? 'p1_hit' : 'self_damage',
        label: hit ? clean : '-2 HP',
        sublabel: '',
      });
      if (uniqueTarget.every((ch) => nextGuessed.includes(ch))) {
        submitAnswer(round.correctAnswer);
      }
    },
    [currentRound, emitCombatEvent, isSolo, roundFeedback, submitAnswer, triggerSfx, wordDuelGuessed]
  );

  const submitFlashMatchPair = useCallback(
    (leftPairId, rightPairId) => {
      if (roundFeedback) return;
      if (!isSolo) {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({ type: 'flash_match_pair', roundIndex: currentRound, leftPairId, rightPairId })
          );
        }
        return;
      }

      const round = soloDeckRef.current[currentRound];
      if (!round) return;
      const isMatch = Boolean(leftPairId && leftPairId === rightPairId && !flashMatchedIds.includes(leftPairId));
      if (isMatch) {
        const nextMatched = [...flashMatchedIds, leftPairId];
        setFlashMatchedIds(nextMatched);
        const nextCombo = (players[0]?.combo || 0) + 1;
        const chain = getComboChainMeta(nextCombo, 'flash_match');
        const dealt = Math.round(7 * chain.damageMultiplier) * (doubleStrikeActive ? 2 : 1);
        const pts = Math.round(65 * chain.pointsMultiplier) * (doubleStrikeActive ? 2 : 1);
        const remEnemyHp = soloEnemyHpRef.current - dealt;
        let enemyKo = false;
        if (remEnemyHp <= 0) {
          soloEnemyHpRef.current = 0;
          setSoloEnemyHp(0);
          enemyKo = true;
        } else {
          soloEnemyHpRef.current = remEnemyHp;
          setSoloEnemyHp(remEnemyHp);
        }
        pushFloating('opp', `${chain.label} -${dealt} HP`, 'dmg');
        pushFloating('self', `+${pts}`, 'pts');
        triggerSfx(nextCombo >= 3 ? 'crit' : 'hit', { combo: nextCombo });
        emitCombatEvent({
          type: nextCombo >= 3 ? 'p1_crit' : 'p1_hit',
          label: `${chain.label} -${dealt} HP`,
          sublabel: `+${pts} PTS`,
          combo: nextCombo,
        });
        setPlayers((prev) =>
          prev.map((p) => ({
            ...p,
            score: p.score + pts,
            combo: nextCombo,
            maxCombo: Math.max(p.maxCombo, nextCombo),
            correctCount: p.correctCount + 1,
            mana: Math.min(100, (Number(p.mana) || 0) + 20),
          }))
        );
        if (enemyKo) {
          clearSoloTimers();
          const t = setTimeout(() => startSoloRound(currentRound + 1, selectedMode, { won: true }), 420);
          soloTimersRef.current.push(t);
        } else if (nextMatched.length >= round.pairCount) {
          clearSoloTimers();
          setRoundFeedback({ isCorrect: true, firstStrike: true, comboLabel: chain.label, enemyDamage: dealt, correctAnswer: 'Hoàn thành đợt!', pointsEarned: pts });
          const t = setTimeout(() => startSoloRound(currentRound + 1, selectedMode), 360);
          soloTimersRef.current.push(t);
        }
      } else {
        triggerSfx('damage');
        pushFloating('self', '-4 HP', 'selfDmg');
        emitCombatEvent({ type: 'self_damage', label: '-4 HP', sublabel: 'WRONG PAIR' });
        let playerKo = false;
        setPlayers((prev) =>
          prev.map((p) => {
            const nextHp = Math.max(0, p.hp - 4);
            if (nextHp <= 0) playerKo = true;
            return { ...p, combo: 0, hp: nextHp };
          })
        );
        if (playerKo) {
          clearSoloTimers();
          const t = setTimeout(() => startSoloRound(currentRound + 1, selectedMode, { won: false }), 420);
          soloTimersRef.current.push(t);
        }
      }
    },
    [
      clearSoloTimers,
      currentRound,
      doubleStrikeActive,
      emitCombatEvent,
      flashMatchedIds,
      isSolo,
      players,
      pushFloating,
      roundFeedback,
      selectedMode,
      startSoloRound,
      triggerSfx,
    ]
  );

  const usePowerUp = useCallback(
    (powerUpId) => {
      const me = players.find((p) => p.userId === myUserId);
      if (!me || !me.powerUps?.[powerUpId] || roundFeedback) return;

      if (powerUpId === 'slow_audio') {
        const targetAudio = question?.audioWord || question?.word || '';
        if (targetAudio) playWordAudio(targetAudio, 0.72);
      }

      if (!isSolo) {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'use_powerup', roundIndex: currentRound, powerUp: powerUpId }));
        }
        return;
      }

      setPlayers((prev) =>
        prev.map((p) =>
          p.userId === myUserId
            ? { ...p, powerUps: { ...p.powerUps, [powerUpId]: Math.max(0, p.powerUps[powerUpId] - 1) } }
            : p
        )
      );
      if (powerUpId === 'double_strike') {
        setDoubleStrikeActive(true);
      } else if (powerUpId === 'fifty_fifty') {
        if (question?.kind === 'word_duel') {
          const round = soloDeckRef.current[currentRound];
          const unrevealed = Array.from(new Set(String(round?.correctAnswer || '').replace(/[^A-Z]/g, '').split(''))).filter(
            (ch) => !wordDuelGuessed.includes(ch)
          );
          if (unrevealed[0]) {
            const nextGuessed = Array.from(new Set([...wordDuelGuessed, unrevealed[0]]));
            setWordDuelGuessed(nextGuessed);
            const gSet = new Set(nextGuessed);
            setWordDuelMask(
              String(round?.word || '')
                .split('')
                .map((ch) => (!/[A-Za-z]/.test(ch) ? ch : gSet.has(ch.toUpperCase()) ? ch.toUpperCase() : '_'))
                .join('')
            );
          }
        } else if (Array.isArray(question?.options)) {
          const round = soloDeckRef.current[currentRound];
          const wrongOpts = question.options.filter(
            (opt) => String(opt).toLowerCase() !== String(round?.correctAnswer || '').toLowerCase()
          );
          setEliminatedOptions(wrongOpts.slice(0, 2));
        }
      }
      triggerSfx('powerup');
      emitCombatEvent({
        type: 'powerup',
        label: powerUpId === 'double_strike' ? 'x2 POWER!' : powerUpId === 'fifty_fifty' ? '50/50 CUT!' : '0.75x FOCUS',
        sublabel: 'SKILL ACTIVE',
      });
    },
    [currentRound, emitCombatEvent, isSolo, myUserId, players, question, roundFeedback, triggerSfx, wordDuelGuessed]
  );

  const triggerUltimate = useCallback(
    (ultiTitle = 'ULTIMATE!') => {
      const me = players.find((p) => p.userId === myUserId) || players[0];
      if (!me || (Number(me.mana) || 0) < 100 || phase !== 'playing') return;

      if (!isSolo) {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'trigger_ultimate' }));
        }
        return;
      }

      setPlayers((prev) =>
        prev.map((p) =>
          p.userId === myUserId ? { ...p, mana: 0, score: p.score + 160 } : p
        )
      );
      const remAfterUlti = soloEnemyHpRef.current - 28;
      let ultiKo = false;
      if (remAfterUlti <= 0) {
        if (selectedMode === 'survival_endless') {
          soloEnemyHpRef.current = BATTLE_START_HP;
          setSoloEnemyHp(BATTLE_START_HP);
        } else {
          soloEnemyHpRef.current = 0;
          setSoloEnemyHp(0);
          ultiKo = true;
        }
      } else {
        soloEnemyHpRef.current = remAfterUlti;
        setSoloEnemyHp(remAfterUlti);
      }
      pushFloating('opp', '-28 HP ULTI!', 'dmg');
      pushFloating('self', '+160 PTS', 'pts');
      if (!mutedRef.current) {
        playCharacterUltiSfx(charIdRef.current || 'ichigo');
      }
      emitCombatEvent({
        type: 'p1_ulti',
        label: ultiTitle,
        sublabel: '-28 HP · +160 PTS',
      });
      if (ultiKo) {
        clearSoloTimers();
        const t = setTimeout(() => startSoloRound(currentRound + 1, selectedMode, { won: true }), 650);
        soloTimersRef.current.push(t);
      }
    },
    [clearSoloTimers, currentRound, emitCombatEvent, isSolo, myUserId, phase, players, pushFloating, selectedMode, startSoloRound]
  );

  const sendEmote = useCallback((emoteId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'emote', emote: emoteId }));
    }
  }, []);

  const leaveMatch = useCallback(() => {
    clearSoloTimers();
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'forfeit' }));
      } catch (_) {}
    }
    closeSocket();
    setPhase('lobby');
    setQuestion(null);
    setRoundFeedback(null);
    setPlayers([]);
    setRoomCode('');
    setRoomId('');
    loadLobbyMeta();
  }, [clearSoloTimers, closeSocket, loadLobbyMeta]);

  const selfPlayer = players.find((p) => p.userId === myUserId) || players[0] || null;
  const oppPlayer = players.find((p) => p.userId !== myUserId) || null;

  return {
    phase,
    isMatchActive: phase === 'waiting' || phase === 'vs_intro' || phase === 'playing',
    selectedMode,
    setSelectedMode,
    selectedTopicId,
    setSelectedTopicId,
    topics,
    leaderboard,
    selfProfile,
    isLoadingMeta,
    isSolo,
    matchType,
    roomId,
    roomCode,
    topicName,
    errorMsg,
    setErrorMsg,
    soundMuted,
    setSoundMuted,
    selfPlayer,
    oppPlayer,
    players,
    currentRound,
    totalRounds,
    timeLeftMs,
    vsTimeLeftMs,
    question,
    roundFeedback,
    eliminatedOptions,
    doubleStrikeActive,
    wordDuelGuessed,
    wordDuelMask,
    flashMatchedIds,
    floatingEvents,
    activeEmotes,
    botReadyOffer,
    winnerUserId,
    reviewWords,
    combatEvent,
    soloEnemyHp,
    myUserId,
    loadLobbyMeta,
    startQuickMatch,
    startPrivateRoom,
    joinRoomByCode,
    requestBotNow,
    startSoloPractice,
    submitAnswer,
    submitWordDuelLetter,
    submitFlashMatchPair,
    usePowerUp,
    triggerUltimate,
    sendEmote,
    leaveMatch,
    speakWord: (w, rate = 0.9) => playWordAudio(w, rate),
  };
}

export default useBattleArena;
