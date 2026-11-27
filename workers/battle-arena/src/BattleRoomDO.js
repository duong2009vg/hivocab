import { DurableObject } from 'cloudflare:workers';
import {
  ALLOWED_EMOTES,
  ALLOWED_POWERUPS,
  AUTO_CLEANUP_MS,
  COUNTER_WINDOW_MS,
  FAST_CLASH_REVEAL_MS,
  MISS_REVEAL_MS,
  START_HP,
  VS_INTRO_MS,
  buildQuestionDeck,
  calculateHitOutcome,
  getComboChainMeta,
  getModeConfig,
  sanitizeRoundForClient,
} from './battleLogic.js';

const SAFE_CHAR_RE = /^[a-z0-9_]{2,24}$/;
const BOT_CHARACTER_POOL = ['naruto', 'ichigo', 'sasuke', 'byakuya', 'kakashi', 'toushirou', 'gaara', 'ulquiorra'];

function sanitizeCharId(id, fallback = 'ichigo') {
  const s = String(id || '').trim().toLowerCase();
  return SAFE_CHAR_RE.test(s) ? s : fallback;
}

function createBotOpponent(playerElo = 1000, hostCharId = 'ichigo') {
  const tierLevel = playerElo >= 1500 ? 'Cao thủ' : playerElo >= 1200 ? 'Nhanh nhẹn' : 'Thân thiện';
  const candidates = BOT_CHARACTER_POOL.filter((c) => c !== hostCharId);
  const botCharId = candidates[Math.floor(Math.random() * candidates.length)] || 'naruto';
  return {
    userId: 'bot:churbito',
    isBot: true,
    displayName: `Bé Hổ Churbito (${tierLevel})`,
    avatarUrl: '/mascot/mascot_cozy.png',
    characterId: botCharId,
    isPro: true,
    elo: Math.max(950, Math.min(1450, playerElo)),
    accuracy: playerElo >= 1500 ? 0.84 : playerElo >= 1200 ? 0.74 : 0.65,
    minDelayMs: playerElo >= 1500 ? 2100 : playerElo >= 1200 ? 2800 : 3500,
    maxDelayMs: playerElo >= 1500 ? 5200 : playerElo >= 1200 ? 6400 : 7600,
  };
}

export class BattleRoomDO extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
  }

  async loadRoom() {
    return this.ctx.storage.get('room');
  }

  async saveRoom(room) {
    await this.ctx.storage.put('room', room);
  }

  getSocketsForUser(userId) {
    return this.ctx.getWebSockets(userId);
  }

  broadcast(payload, excludeUserId = null) {
    const raw = JSON.stringify(payload);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        const tags = this.ctx.getTags(ws);
        if (excludeUserId && tags.includes(excludeUserId)) continue;
        ws.send(raw);
      } catch (_) {}
    }
  }

  sendToUser(userId, payload) {
    const raw = JSON.stringify(payload);
    for (const ws of this.getSocketsForUser(userId)) {
      try {
        ws.send(raw);
      } catch (_) {}
    }
  }

  makePublicPlayers(room) {
    return room.players.map((p) => ({
      userId: p.userId,
      isBot: Boolean(p.isBot),
      displayName: p.displayName,
      avatarUrl: p.avatarUrl || '',
      characterId: p.characterId || 'ichigo',
      isPro: Boolean(p.isPro),
      elo: p.elo || 1000,
      hp: p.hp,
      maxHp: room.startHp,
      mana: Math.max(0, Math.min(100, Number(p.mana) || 0)),
      score: p.score,
      combo: p.combo,
      maxCombo: p.maxCombo,
      correctCount: p.correctCount,
      answeredCurrent: Boolean(p.answeredRound === room.currentRound),
      waveProgress: p.waveProgress || 0,
      powerUps: p.powerUps,
    }));
  }

  buildMaskedWordPattern(targetWord, guessedLetters = []) {
    const guessedSet = new Set((guessedLetters || []).map((c) => String(c).toUpperCase()));
    return String(targetWord || '')
      .split('')
      .map((ch) => {
        const up = ch.toUpperCase();
        if (!/[A-Z]/.test(up)) return ch;
        return guessedSet.has(up) ? up : '_';
      })
      .join('');
  }

  async removeFromMatchmakerQueue(roomId) {
    try {
      const mmId = this.env.MATCHMAKER.idFromName('global-matchmaker');
      await this.env.MATCHMAKER.get(mmId).fetch('https://do/queue/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
    } catch (_) {}
  }

  createPlayerRecord(player) {
    return {
      userId: player.userId,
      isBot: Boolean(player.isBot),
      displayName: player.displayName || 'Học viên HiVocab',
      avatarUrl: player.avatarUrl || '',
      characterId: sanitizeCharId(player.characterId, player.isBot ? 'naruto' : 'ichigo'),
      isPro: Boolean(player.isPro),
      elo: Number(player.elo) || 1000,
      hp: START_HP,
      mana: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      correctCount: 0,
      totalResponseMs: 0,
      answerCount: 0,
      answeredRound: -1,
      waveProgress: 0,
      matchedPairsInWave: [],
      wordDuelLetters: [],
      doubleStrikeRound: -1,
      powerUps: {
        fifty_fifty: 1,
        slow_audio: 1,
        double_strike: 1,
      },
      accuracy: player.accuracy || 0.72,
      minDelayMs: player.minDelayMs || 2800,
      maxDelayMs: player.maxDelayMs || 6500,
    };
  }

  async startVsIntro(room) {
    const now = Date.now();
    room.status = 'vs_intro';
    room.phase = 'vs_intro';
    room.vsEndsAt = now + VS_INTRO_MS;
    await this.saveRoom(room);
    await this.removeFromMatchmakerQueue(room.roomId);

    this.broadcast({
      type: 'match_found',
      roomId: room.roomId,
      roomCode: room.roomCode,
      mode: room.mode,
      topicName: room.topicName,
      totalRounds: room.totalRounds,
      startHp: room.startHp,
      vsEndsAt: room.vsEndsAt,
      players: this.makePublicPlayers(room),
    });

    await this.ctx.storage.setAlarm(room.vsEndsAt);
  }

  async startNextRound(room) {
    const cfg = getModeConfig(room.mode);
    const nextIdx = room.currentRound + 1;

    if (nextIdx >= room.deck.length || room.players.some((p) => p.hp <= 0)) {
      await this.finishMatch(room);
      return;
    }

    const now = Date.now();
    room.status = 'playing';
    room.phase = 'round_active';
    room.currentRound = nextIdx;
    room.roundWinnerUserId = null;
    room.roundStartedAt = now;
    room.roundDeadline = now + cfg.roundTimeMs;
    room.botActedRound = -1;

    for (const p of room.players) {
      p.answeredRound = -1;
      p.waveProgress = 0;
      p.matchedPairsInWave = [];
      p.wordDuelLetters = [];
      p.doubleStrikeRound = -1;
    }

    // Schedule bot reaction time if a bot is in this match
    const bot = room.players.find((p) => p.isBot);
    let nextAlarm = room.roundDeadline;
    if (bot) {
      const botSpan = Math.max(800, bot.maxDelayMs - bot.minDelayMs);
      const botDelay =
        room.mode === 'flash_match'
          ? Math.min(cfg.roundTimeMs - 2500, 14000 + Math.floor(Math.random() * 14000))
          : room.mode === 'word_duel'
            ? Math.min(cfg.roundTimeMs - 2000, 6500 + Math.floor(Math.random() * 8500))
            : Math.min(cfg.roundTimeMs - 1500, bot.minDelayMs + Math.floor(Math.random() * botSpan));
      room.botActionAt = now + botDelay;
      nextAlarm = Math.min(room.roundDeadline, room.botActionAt);
    } else {
      room.botActionAt = null;
    }

    await this.saveRoom(room);

    const safeQuestion = sanitizeRoundForClient(room.deck[nextIdx]);
    this.broadcast({
      type: 'round_start',
      roundIndex: nextIdx,
      totalRounds: room.deck.length,
      roundStartedAt: room.roundStartedAt,
      roundDeadline: room.roundDeadline,
      question: safeQuestion,
      players: this.makePublicPlayers(room),
    });

    await this.ctx.storage.setAlarm(nextAlarm);
  }

  async applyAnswerForPlayer(room, player, { isCorrect, elapsedMs, submittedAnswer = '' }) {
    const cfg = getModeConfig(room.mode);
    const round = room.deck[room.currentRound];
    const opponent = room.players.find((p) => p.userId !== player.userId);
    const doubleStrike = player.doubleStrikeRound === room.currentRound;

    const outcome = calculateHitOutcome({
      isCorrect,
      elapsedMs,
      timeLimitMs: cfg.roundTimeMs,
      streak: player.combo,
      doubleStrike,
      mode: room.mode,
    });

    player.answeredRound = room.currentRound;
    player.score += outcome.points;
    player.combo = outcome.nextStreak;
    player.maxCombo = Math.max(player.maxCombo, outcome.nextStreak);
    player.answerCount += 1;
    player.totalResponseMs += Math.max(200, Math.min(cfg.roundTimeMs, Number(elapsedMs) || cfg.roundTimeMs));
    if (isCorrect) {
      player.correctCount += 1;
      player.mana = Math.min(100, (Number(player.mana) || 0) + 34);
      room.roundWinnerUserId = player.userId;
      if (opponent) {
        opponent.hp = Math.max(0, opponent.hp - outcome.enemyDamage);
        // Getting struck first breaks opponent's active combo streak
        opponent.combo = 0;
      }
    } else {
      player.hp = Math.max(0, player.hp - outcome.selfDamage);
    }

    // Track per-word outcome for post-match mistake vault
    if (round && round.kind !== 'flash_match') {
      if (!room.wordOutcomes[round.roundIndex]) {
        room.wordOutcomes[round.roundIndex] = {
          word: round.word,
          phonetic: round.phonetic,
          meaning: round.meaning,
          example: round.example,
          byUser: {},
        };
      }
      room.wordOutcomes[round.roundIndex].byUser[player.userId] = {
        isCorrect: Boolean(isCorrect),
        submittedAnswer: String(submittedAnswer || ''),
      };
    }

    return outcome;
  }

  async maybeEnterRoundReveal(room, { forceImmediate = false } = {}) {
    const someoneKo = room.players.some((p) => p.hp <= 0);
    if (someoneKo) {
      await this.saveRoom(room);
      await this.finishMatch(room);
      return true;
    }

    const someoneWonClash = Boolean(room.roundWinnerUserId);
    const allAnswered = room.players.every((p) => p.answeredRound === room.currentRound);

    if (!forceImmediate && !someoneWonClash && !allAnswered) {
      // One player missed (lost their turn) — accelerate opponent's counter-attack window so nobody stalls!
      const now = Date.now();
      const bot = room.players.find((p) => p.isBot && p.answeredRound !== room.currentRound);
      if (bot) {
        room.botActionAt = Math.min(room.botActionAt || now + 450, now + 450);
        await this.saveRoom(room);
        await this.ctx.storage.setAlarm(Math.min(room.roundDeadline, room.botActionAt));
      } else if (room.roundDeadline > now + COUNTER_WINDOW_MS) {
        room.roundDeadline = now + COUNTER_WINDOW_MS;
        await this.saveRoom(room);
        this.broadcast({
          type: 'round_deadline_updated',
          roundIndex: room.currentRound,
          roundDeadline: room.roundDeadline,
        });
        await this.ctx.storage.setAlarm(room.roundDeadline);
      }
      return false;
    }

    const round = room.deck[room.currentRound];
    const now = Date.now();
    const delayMs = someoneWonClash ? FAST_CLASH_REVEAL_MS : MISS_REVEAL_MS;
    room.phase = 'round_reveal';
    room.revealEndsAt = now + delayMs;
    await this.saveRoom(room);

    this.broadcast({
      type: 'round_reveal',
      roundIndex: room.currentRound,
      winnerUserId: room.roundWinnerUserId || null,
      correctAnswer: round?.word || round?.correctAnswer || '',
      meaning: round?.meaning || '',
      phonetic: round?.phonetic || '',
      players: this.makePublicPlayers(room),
      revealEndsAt: room.revealEndsAt,
    });

    await this.ctx.storage.setAlarm(room.revealEndsAt);
    return true;
  }

  async finishMatch(room, forfeitUserId = null) {
    if (room.status === 'finished') return;
    room.status = 'finished';
    room.phase = 'finished';
    room.finishedAt = Date.now();

    const [p1, p2] = room.players;
    let winnerUserId = null;

    if (forfeitUserId && p1 && p2) {
      winnerUserId = p1.userId === forfeitUserId ? p2.userId : p1.userId;
    } else if (p1 && p2) {
      if (p1.hp !== p2.hp) {
        winnerUserId = p1.hp > p2.hp ? p1.userId : p2.userId;
      } else if (p1.score !== p2.score) {
        winnerUserId = p1.score > p2.score ? p1.userId : p2.userId;
      } else {
        winnerUserId = null; // Draw
      }
    } else if (p1) {
      winnerUserId = p1.userId;
    }

    room.winnerUserId = winnerUserId;

    // Record ELO & XP on LeaderboardDO
    let eloDeltas = {};
    if (p1 && p2) {
      try {
        const lbId = this.env.LEADERBOARD.idFromName('global-leaderboard');
        const lbRes = await this.env.LEADERBOARD.get(lbId).fetch('https://do/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            winnerUserId,
            isBotMatch: room.players.some((p) => p.isBot),
            players: room.players.map((p) => ({
              userId: p.userId,
              displayName: p.displayName,
              avatarUrl: p.avatarUrl,
              isPro: p.isPro,
              elo: p.elo,
              isBot: p.isBot,
            })),
          }),
        });
        const lbJson = await lbRes.json().catch(() => null);
        if (lbJson?.ok && lbJson?.deltas) {
          eloDeltas = lbJson.deltas;
        }
      } catch (_) {}
    }

    // Build flat review words list for post-match saving
    const reviewWords = [];
    const seenReview = new Set();
    for (let i = 0; i < room.deck.length; i++) {
      const round = room.deck[i];
      if (round.kind === 'flash_match') {
        for (const pair of round.pairs || []) {
          const key = pair.word.toLowerCase();
          if (seenReview.has(key)) continue;
          seenReview.add(key);
          reviewWords.push({
            word: pair.word,
            phonetic: pair.phonetic,
            meaning: pair.meaning,
            example: pair.example,
            byUser: {},
          });
        }
      } else {
        const key = String(round.word || '').toLowerCase();
        if (seenReview.has(key)) continue;
        seenReview.add(key);
        const rec = room.wordOutcomes[i];
        reviewWords.push({
          word: round.word,
          phonetic: round.phonetic,
          meaning: round.meaning,
          example: round.example,
          byUser: rec?.byUser || {},
        });
      }
    }

    room.eloDeltas = eloDeltas;
    room.reviewWords = reviewWords;
    await this.saveRoom(room);

    this.broadcast({
      type: 'match_finished',
      roomId: room.roomId,
      winnerUserId,
      forfeitUserId,
      players: this.makePublicPlayers(room).map((p) => {
        const rawP = room.players.find((rp) => rp.userId === p.userId);
        const avgMs = rawP?.answerCount ? Math.round(rawP.totalResponseMs / rawP.answerCount) : 0;
        return {
          ...p,
          avgResponseMs: avgMs,
          eloDelta: eloDeltas[p.userId]?.eloDelta || 0,
          xpDelta: eloDeltas[p.userId]?.xpDelta || 0,
          eloAfter: eloDeltas[p.userId]?.eloAfter || p.elo,
        };
      }),
      reviewWords,
    });

    // Clean up room storage after 5 minutes
    await this.ctx.storage.setAlarm(Date.now() + AUTO_CLEANUP_MS);
  }

  async alarm() {
    const room = await this.loadRoom();
    if (!room) return;

    const now = Date.now();

    if (room.status === 'finished') {
      for (const ws of this.ctx.getWebSockets()) {
        try {
          ws.close(1000, 'Match cleanup');
        } catch (_) {}
      }
      await this.ctx.storage.deleteAll();
      return;
    }

    if (room.status === 'waiting') {
      // Waiting room expired cleanly without leaking storage
      await this.removeFromMatchmakerQueue(room.roomId);
      await this.ctx.storage.deleteAll();
      return;
    }

    if (room.status === 'vs_intro') {
      await this.startNextRound(room);
      return;
    }

    if (room.status === 'playing' && room.phase === 'round_reveal') {
      await this.startNextRound(room);
      return;
    }

    if (room.status === 'playing' && room.phase === 'round_active') {
      const bot = room.players.find((p) => p.isBot);

      // 1. Trigger Bot Bé Hổ's simulated move if it's due before round deadline
      if (
        bot &&
        !room.roundWinnerUserId &&
        bot.answeredRound !== room.currentRound &&
        room.botActionAt &&
        now >= room.botActionAt - 80
      ) {
        const botCorrect = Math.random() < bot.accuracy;
        const botElapsed = Math.max(1200, now - room.roundStartedAt);
        const outcome = await this.applyAnswerForPlayer(room, bot, {
          isCorrect: botCorrect,
          elapsedMs: botElapsed,
          submittedAnswer: botCorrect ? room.deck[room.currentRound]?.correctAnswer : '',
        });

        await this.saveRoom(room);
        this.broadcast({
          type: 'opponent_acted',
          actorUserId: bot.userId,
          roundIndex: room.currentRound,
          isCorrect: botCorrect,
          firstStrike: botCorrect,
          lostTurn: !botCorrect,
          comboTier: outcome.comboTier,
          comboLabel: outcome.comboLabel,
          damageMultiplier: outcome.damageMultiplier,
          enemyDamage: outcome.enemyDamage,
          selfDamage: outcome.selfDamage,
          players: this.makePublicPlayers(room),
        });

        const transitioned = await this.maybeEnterRoundReveal(room);
        if (!transitioned && room.roundDeadline) {
          await this.ctx.storage.setAlarm(room.roundDeadline);
        }
        return;
      }

      // 2. Round timer expired -> penalize anyone who hasn't answered and advance
      if (now >= room.roundDeadline - 80) {
        for (const p of room.players) {
          if (p.answeredRound !== room.currentRound) {
            await this.applyAnswerForPlayer(room, p, {
              isCorrect: false,
              elapsedMs: getModeConfig(room.mode).roundTimeMs,
              submittedAnswer: '',
            });
          }
        }
        await this.saveRoom(room);
        const transitioned = await this.maybeEnterRoundReveal(room);
        if (!transitioned) {
          await this.startNextRound(room);
        }
        return;
      }

      // Re-arm alarm cleanly if woken early
      const targetAlarm =
        bot && bot.answeredRound !== room.currentRound && room.botActionAt
          ? Math.min(room.roundDeadline, room.botActionAt)
          : room.roundDeadline;
      await this.ctx.storage.setAlarm(targetAlarm);
    }
  }

  async webSocketMessage(ws, rawMessage) {
    const tags = this.ctx.getTags(ws);
    const userId = tags[0];
    if (!userId) return;

    const room = await this.loadRoom();
    if (!room) {
      ws.send(JSON.stringify({ type: 'error', error: 'Phòng đấu không tồn tại hoặc đã đóng.' }));
      return;
    }

    let msg = null;
    try {
      msg = JSON.parse(typeof rawMessage === 'string' ? rawMessage : new TextDecoder().decode(rawMessage));
    } catch {
      return;
    }

    const player = room.players.find((p) => p.userId === userId);
    if (!player) return;

    if (msg?.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', now: Date.now() }));
      return;
    }

    if (msg?.type === 'emote') {
      const emote = String(msg.emote || '').trim();
      if (!ALLOWED_EMOTES.has(emote)) return;
      this.broadcast({ type: 'emote', fromUserId: userId, emote, ts: Date.now() });
      return;
    }

    if (msg?.type === 'set_character') {
      player.characterId = sanitizeCharId(msg.characterId, player.characterId || 'ichigo');
      await this.saveRoom(room);
      this.broadcast({ type: 'players_updated', players: this.makePublicPlayers(room) });
      return;
    }

    if (msg?.type === 'trigger_ultimate') {
      if (room.status !== 'playing' || (Number(player.mana) || 0) < 100) return;
      const opponent = room.players.find((p) => p.userId !== player.userId);
      const ultiDamage = 28;
      const ultiPoints = 160;
      player.mana = 0;
      player.score += ultiPoints;
      if (opponent) {
        opponent.hp = Math.max(0, opponent.hp - ultiDamage);
      }
      await this.saveRoom(room);
      this.broadcast({
        type: 'ultimate_used',
        actorUserId: userId,
        characterId: player.characterId || 'ichigo',
        enemyDamage: ultiDamage,
        pointsEarned: ultiPoints,
        players: this.makePublicPlayers(room),
      });
      if (opponent && opponent.hp <= 0) {
        await this.finishMatch(room);
      }
      return;
    }

    if (msg?.type === 'request_bot') {
      if (room.status === 'waiting' && room.players.length === 1) {
        const botPlayer = this.createPlayerRecord(createBotOpponent(player.elo, player.characterId));
        room.players.push(botPlayer);
        room.matchType = 'bot';
        await this.startVsIntro(room);
      }
      return;
    }

    if (msg?.type === 'forfeit') {
      if (room.status === 'playing' || room.status === 'vs_intro') {
        await this.finishMatch(room, userId);
      } else if (room.status === 'waiting') {
        await this.removeFromMatchmakerQueue(room.roomId);
        room.status = 'cancelled';
        await this.saveRoom(room);
        ws.send(JSON.stringify({ type: 'room_cancelled' }));
      }
      return;
    }

    if (room.status !== 'playing' || room.phase !== 'round_active') return;
    const roundIdx = Number(msg?.roundIndex);
    if (roundIdx !== room.currentRound) return;
    const round = room.deck[room.currentRound];
    if (!round) return;

    if (msg?.type === 'use_powerup') {
      const powerUp = String(msg.powerUp || '').trim();
      if (!ALLOWED_POWERUPS.has(powerUp) || !player.powerUps?.[powerUp] || player.powerUps[powerUp] <= 0) return;

      player.powerUps[powerUp] -= 1;
      let extra = {};
      if (powerUp === 'fifty_fifty') {
        if (round.kind === 'word_duel') {
          const targetUpper = String(round.correctAnswer || '');
          const unrevealed = [...new Set(targetUpper.replace(/[^A-Z]/g, '').split(''))].filter(
            (ch) => !(player.wordDuelLetters || []).includes(ch)
          );
          extra = { revealLetter: unrevealed[0] || '' };
          if (extra.revealLetter) {
            player.wordDuelLetters = [...(player.wordDuelLetters || []), extra.revealLetter];
            extra.maskedPattern = this.buildMaskedWordPattern(round.word, player.wordDuelLetters);
          }
        } else if (Array.isArray(round.options)) {
          const wrongOpts = round.options.filter(
            (opt) => String(opt).trim().toLowerCase() !== String(round.correctAnswer || '').trim().toLowerCase()
          );
          extra = { eliminateOptions: wrongOpts.slice(0, 2) };
        }
      } else if (powerUp === 'double_strike') {
        player.doubleStrikeRound = room.currentRound;
        extra = { activeForRound: room.currentRound };
      }

      await this.saveRoom(room);
      this.sendToUser(userId, { type: 'powerup_applied', powerUp, powerUps: player.powerUps, ...extra });
      return;
    }

    // Flash match: incremental pair verification
    if (msg?.type === 'flash_match_pair' && round.kind === 'flash_match') {
      if (player.answeredRound === room.currentRound) return;
      const leftId = String(msg.leftPairId || '');
      const rightId = String(msg.rightPairId || '');
      const isMatch = Boolean(leftId && leftId === rightId && !(player.matchedPairsInWave || []).includes(leftId));
      const opponent = room.players.find((p) => p.userId !== player.userId);

      if (isMatch) {
        player.matchedPairsInWave = [...(player.matchedPairsInWave || []), leftId];
        player.waveProgress = Math.round((player.matchedPairsInWave.length / round.pairs.length) * 100);
        player.combo += 1;
        player.maxCombo = Math.max(player.maxCombo, player.combo);
        player.correctCount += 1;
        player.mana = Math.min(100, (Number(player.mana) || 0) + 20);
        const chain = getComboChainMeta(player.combo, 'flash_match');
        const dmg = Math.round(7 * chain.damageMultiplier) * (player.doubleStrikeRound === room.currentRound ? 2 : 1);
        const pts = Math.round(65 * chain.pointsMultiplier) * (player.doubleStrikeRound === room.currentRound ? 2 : 1);
        player.score += pts;
        if (opponent) opponent.hp = Math.max(0, opponent.hp - dmg);

        this.sendToUser(userId, {
          type: 'flash_pair_ack',
          leftPairId: leftId,
          isMatch: true,
          matchedPairs: player.matchedPairsInWave,
          pointsEarned: pts,
          enemyDamage: dmg,
          comboTier: chain.tier,
          comboLabel: chain.label,
          damageMultiplier: chain.damageMultiplier,
          players: this.makePublicPlayers(room),
        });
        this.broadcast(
          {
            type: 'opponent_progress',
            actorUserId: userId,
            waveProgress: player.waveProgress,
            enemyDamage: dmg,
            players: this.makePublicPlayers(room),
          },
          userId
        );

        if (opponent && opponent.hp <= 0) {
          await this.saveRoom(room);
          await this.finishMatch(room);
          return;
        }

        if (player.matchedPairsInWave.length >= round.pairs.length) {
          player.answeredRound = room.currentRound;
          room.roundWinnerUserId = player.userId;
          player.answerCount += 1;
          player.totalResponseMs += Math.max(500, Date.now() - room.roundStartedAt);
          await this.saveRoom(room);
          await this.maybeEnterRoundReveal(room);
          return;
        }
      } else {
        player.combo = 0;
        player.hp = Math.max(0, player.hp - 4);
        this.sendToUser(userId, {
          type: 'flash_pair_ack',
          leftPairId: leftId,
          rightPairId: rightId,
          isMatch: false,
          selfDamage: 4,
          players: this.makePublicPlayers(room),
        });
        if (player.hp <= 0) {
          await this.saveRoom(room);
          await this.finishMatch(room);
          return;
        }
      }
      await this.saveRoom(room);
      return;
    }

    // Word duel incremental letter guess OR full-word submit
    if (msg?.type === 'word_duel_letter' && round.kind === 'word_duel') {
      if (room.roundWinnerUserId || player.answeredRound === room.currentRound) return;
      const letter = String(msg.letter || '').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
      if (!letter) return;

      const targetUpper = String(round.correctAnswer || '');
      const nextLetters = Array.from(new Set([...(player.wordDuelLetters || []), letter]));
      player.wordDuelLetters = nextLetters;
      const uniqueTarget = Array.from(new Set(targetUpper.replace(/[^A-Z]/g, '').split('')));
      const hit = uniqueTarget.includes(letter);
      const revealedCount = uniqueTarget.filter((ch) => nextLetters.includes(ch)).length;
      player.waveProgress = uniqueTarget.length ? Math.round((revealedCount / uniqueTarget.length) * 100) : 100;

      if (!hit) {
        player.hp = Math.max(0, player.hp - 2);
      }

      const solvedAll = uniqueTarget.every((ch) => nextLetters.includes(ch));
      if (solvedAll) {
        const elapsedMs = Date.now() - room.roundStartedAt;
        const outcome = await this.applyAnswerForPlayer(room, player, {
          isCorrect: true,
          elapsedMs,
          submittedAnswer: targetUpper,
        });
        await this.saveRoom(room);
        this.sendToUser(userId, {
          type: 'answer_ack',
          roundIndex: room.currentRound,
          isCorrect: true,
          firstStrike: true,
          comboTier: outcome.comboTier,
          comboLabel: outcome.comboLabel,
          damageMultiplier: outcome.damageMultiplier,
          correctAnswer: round.word,
          pointsEarned: outcome.points,
          enemyDamage: outcome.enemyDamage,
          selfDamage: 0,
          players: this.makePublicPlayers(room),
        });
        this.broadcast(
          {
            type: 'opponent_acted',
            actorUserId: userId,
            roundIndex: room.currentRound,
            isCorrect: true,
            firstStrike: true,
            comboTier: outcome.comboTier,
            comboLabel: outcome.comboLabel,
            damageMultiplier: outcome.damageMultiplier,
            enemyDamage: outcome.enemyDamage,
            players: this.makePublicPlayers(room),
          },
          userId
        );
        await this.maybeEnterRoundReveal(room);
        return;
      }

      await this.saveRoom(room);
      this.sendToUser(userId, {
        type: 'word_duel_letter_ack',
        letter,
        hit,
        guessedLetters: nextLetters,
        maskedPattern: this.buildMaskedWordPattern(round.word, nextLetters),
        players: this.makePublicPlayers(room),
      });
      this.broadcast(
        {
          type: 'opponent_progress',
          actorUserId: userId,
          waveProgress: player.waveProgress,
          players: this.makePublicPlayers(room),
        },
        userId
      );
      if (player.hp <= 0) {
        await this.finishMatch(room);
      }
      return;
    }

    // Standard single-answer submission (speed_blitz, audio_sniper, or full-word word_duel)
    if (msg?.type === 'submit_answer') {
      if (room.roundWinnerUserId || player.answeredRound === room.currentRound) return;

      const submitted = String(msg.answer || '').trim();
      const expected = String(round.correctAnswer || '').trim();
      const isCorrect =
        round.kind === 'word_duel'
          ? submitted.toUpperCase().replace(/[^A-Z'-]/g, '') === expected.toUpperCase().replace(/[^A-Z'-]/g, '')
          : submitted.toLowerCase() === expected.toLowerCase();

      const elapsedMs = Date.now() - room.roundStartedAt;
      const outcome = await this.applyAnswerForPlayer(room, player, {
        isCorrect,
        elapsedMs,
        submittedAnswer: submitted,
      });

      await this.saveRoom(room);

      this.sendToUser(userId, {
        type: 'answer_ack',
        roundIndex: room.currentRound,
        isCorrect,
        firstStrike: isCorrect,
        lostTurn: !isCorrect,
        comboTier: outcome.comboTier,
        comboLabel: outcome.comboLabel,
        damageMultiplier: outcome.damageMultiplier,
        correctAnswer: round.word || expected,
        pointsEarned: outcome.points,
        enemyDamage: outcome.enemyDamage,
        selfDamage: outcome.selfDamage,
        players: this.makePublicPlayers(room),
      });

      this.broadcast(
        {
          type: 'opponent_acted',
          actorUserId: userId,
          roundIndex: room.currentRound,
          isCorrect,
          firstStrike: isCorrect,
          lostTurn: !isCorrect,
          comboTier: outcome.comboTier,
          comboLabel: outcome.comboLabel,
          damageMultiplier: outcome.damageMultiplier,
          enemyDamage: outcome.enemyDamage,
          selfDamage: outcome.selfDamage,
          players: this.makePublicPlayers(room),
        },
        userId
      );

      await this.maybeEnterRoundReveal(room);
    }
  }

  async webSocketClose(ws) {
    try {
      ws.close(1000, 'Closed');
    } catch (_) {}
  }

  async webSocketError(ws) {
    try {
      ws.close(1011, 'Error');
    } catch (_) {}
  }

  async fetch(request) {
    const url = new URL(request.url);

    // WebSocket Upgrade into active BattleRoom
    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const userId = String(request.headers.get('X-Battle-User-Id') || '').trim();
      const room = await this.loadRoom();
      if (!userId || !room) {
        return new Response('Room not found', { status: 404 });
      }
      const isParticipant = room.players.some((p) => p.userId === userId);
      if (!isParticipant) {
        return new Response('Not a participant in this room', { status: 403 });
      }

      const pair = new globalThis.WebSocketPair();
      const client = pair[0];
      const server = pair[1];
      this.ctx.acceptWebSocket(server, [userId]);

      const cfg = getModeConfig(room.mode);
      const currentQuestion =
        room.status === 'playing' && room.currentRound >= 0 && room.deck[room.currentRound]
          ? sanitizeRoundForClient(room.deck[room.currentRound])
          : null;

      server.send(
        JSON.stringify({
          type: 'room_snapshot',
          roomId: room.roomId,
          roomCode: room.roomCode,
          mode: room.mode,
          matchType: room.matchType,
          topicName: room.topicName,
          status: room.status,
          phase: room.phase,
          startHp: room.startHp,
          totalRounds: room.deck.length,
          currentRound: room.currentRound,
          roundStartedAt: room.roundStartedAt || null,
          roundDeadline: room.roundDeadline || null,
          roundTimeMs: cfg.roundTimeMs,
          vsEndsAt: room.vsEndsAt || null,
          question: currentQuestion,
          players: this.makePublicPlayers(room),
          winnerUserId: room.winnerUserId || null,
          reviewWords: room.status === 'finished' ? room.reviewWords || [] : [],
        })
      );

      return new Response(null, { status: 101, webSocket: client });
    }

    if (request.method === 'POST' && url.pathname === '/init') {
      const body = await request.json().catch(() => null);
      if (!body?.roomId || !body?.host || !Array.isArray(body?.words)) {
        return Response.json({ ok: false, error: 'Invalid room payload' }, { status: 400 });
      }

      const mode = String(body.mode || 'speed_blitz');
      const cfg = getModeConfig(mode);
      const deck = buildQuestionDeck(body.words, mode);

      const room = {
        roomId: String(body.roomId),
        roomCode: String(body.roomCode || ''),
        mode,
        matchType: String(body.matchType || 'quick'),
        topicId: body.topicId ? String(body.topicId) : null,
        topicName: String(body.topicName || 'Kho Từ Vựng Chung HiVocab'),
        status: 'waiting',
        phase: 'waiting',
        startHp: cfg.startHp,
        totalRounds: deck.length,
        currentRound: -1,
        players: [this.createPlayerRecord(body.host)],
        deck,
        wordOutcomes: {},
        createdAt: Date.now(),
      };

      await this.saveRoom(room);
      await this.ctx.storage.setAlarm(Date.now() + 30 * 60 * 1000);

      return Response.json({
        ok: true,
        roomId: room.roomId,
        roomCode: room.roomCode,
        status: room.status,
      });
    }

    if (request.method === 'POST' && url.pathname === '/join') {
      const body = await request.json().catch(() => null);
      const guest = body?.player;
      if (!guest?.userId) {
        return Response.json({ ok: false, error: 'Missing player' }, { status: 400 });
      }

      const room = await this.loadRoom();
      if (!room) {
        return Response.json({ ok: false, error: 'Phòng đấu không tồn tại hoặc đã hết hạn.' }, { status: 404 });
      }

      const alreadyIn = room.players.some((p) => p.userId === guest.userId);
      if (alreadyIn) {
        return Response.json({
          ok: true,
          roomId: room.roomId,
          roomCode: room.roomCode,
          mode: room.mode,
          status: room.status,
        });
      }

      if (room.status !== 'waiting' || room.players.length >= 2) {
        return Response.json({ ok: false, error: 'Phòng đấu đã đủ người hoặc đã bắt đầu.' }, { status: 409 });
      }

      room.players.push(this.createPlayerRecord(guest));
      await this.startVsIntro(room);

      return Response.json({
        ok: true,
        roomId: room.roomId,
        roomCode: room.roomCode,
        mode: room.mode,
        status: room.status,
      });
    }

    return Response.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
}
