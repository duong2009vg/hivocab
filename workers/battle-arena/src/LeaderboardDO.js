import { DurableObject } from 'cloudflare:workers';
import { calculateEloDelta, getRankTier } from './battleLogic.js';

export class LeaderboardDO extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS battle_ratings (
        user_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        avatar_url TEXT,
        is_pro INTEGER NOT NULL DEFAULT 0,
        elo INTEGER NOT NULL DEFAULT 1000,
        xp INTEGER NOT NULL DEFAULT 0,
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        draws INTEGER NOT NULL DEFAULT 0,
        win_streak INTEGER NOT NULL DEFAULT 0,
        best_win_streak INTEGER NOT NULL DEFAULT 0,
        matches_played INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_battle_ratings_elo ON battle_ratings (elo DESC, xp DESC);
    `);
  }

  ensureProfile(user) {
    const userId = String(user?.userId || '').trim();
    if (!userId) return null;
    const displayName = String(user?.displayName || 'Học viên HiVocab').trim().slice(0, 60) || 'Học viên HiVocab';
    const avatarUrl = user?.avatarUrl ? String(user.avatarUrl).slice(0, 300) : '';
    const isPro = user?.isPro ? 1 : 0;
    const now = Date.now();

    const existing = this.ctx.storage.sql
      .exec('SELECT * FROM battle_ratings WHERE user_id = ?', userId)
      .toArray()[0];

    if (!existing) {
      this.ctx.storage.sql.exec(
        `INSERT INTO battle_ratings (
          user_id, display_name, avatar_url, is_pro, elo, xp, wins, losses, draws, win_streak, best_win_streak, matches_played, updated_at
        ) VALUES (?, ?, ?, ?, 1000, 0, 0, 0, 0, 0, 0, 0, ?)`,
        userId,
        displayName,
        avatarUrl,
        isPro,
        now
      );
    } else if (
      existing.display_name !== displayName ||
      (avatarUrl && existing.avatar_url !== avatarUrl) ||
      existing.is_pro !== isPro
    ) {
      this.ctx.storage.sql.exec(
        `UPDATE battle_ratings
         SET display_name = ?, avatar_url = COALESCE(NULLIF(?, ''), avatar_url), is_pro = ?, updated_at = ?
         WHERE user_id = ?`,
        displayName,
        avatarUrl,
        isPro,
        now,
        userId
      );
    }

    const row = this.ctx.storage.sql
      .exec('SELECT * FROM battle_ratings WHERE user_id = ?', userId)
      .toArray()[0];
    return this.formatRow(row);
  }

  formatRow(row, rank = null) {
    if (!row) return null;
    return {
      userId: row.user_id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url || '',
      isPro: Boolean(row.is_pro),
      elo: Number(row.elo) || 1000,
      xp: Number(row.xp) || 0,
      wins: Number(row.wins) || 0,
      losses: Number(row.losses) || 0,
      draws: Number(row.draws) || 0,
      winStreak: Number(row.win_streak) || 0,
      bestWinStreak: Number(row.best_win_streak) || 0,
      matchesPlayed: Number(row.matches_played) || 0,
      tier: getRankTier(row.elo),
      ...(rank !== null ? { rank } : {}),
    };
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/profile') {
      const body = await request.json().catch(() => null);
      const profile = this.ensureProfile(body);
      if (!profile) return Response.json({ ok: false, error: 'Missing userId' }, { status: 400 });
      return Response.json({ ok: true, profile });
    }

    if (request.method === 'POST' && url.pathname === '/top') {
      const body = await request.json().catch(() => ({}));
      const limit = Math.max(5, Math.min(50, Number(body?.limit) || 25));
      let selfProfile = null;
      if (body?.user?.userId) {
        selfProfile = this.ensureProfile(body.user);
      }

      const rows = this.ctx.storage.sql
        .exec('SELECT * FROM battle_ratings ORDER BY elo DESC, xp DESC, wins DESC LIMIT ?', limit)
        .toArray();
      const leaderboard = rows.map((row, idx) => this.formatRow(row, idx + 1));

      if (selfProfile) {
        const rankRow = this.ctx.storage.sql
          .exec(
            'SELECT COUNT(*) + 1 AS rk FROM battle_ratings WHERE elo > ? OR (elo = ? AND xp > ?)',
            selfProfile.elo,
            selfProfile.elo,
            selfProfile.xp
          )
          .toArray()[0];
        selfProfile.rank = Number(rankRow?.rk || 1);
      }

      return Response.json({ ok: true, leaderboard, self: selfProfile });
    }

    if (request.method === 'POST' && url.pathname === '/record') {
      const body = await request.json().catch(() => null);
      const players = Array.isArray(body?.players) ? body.players : [];
      const isBotMatch = Boolean(body?.isBotMatch);
      const isSolo = Boolean(body?.isSolo);

      if (isSolo && players[0]?.userId) {
        const p = players[0];
        const profile = this.ensureProfile(p);
        const earnedXp = Math.max(10, Math.min(300, Number(p.xpEarned) || 20));
        this.ctx.storage.sql.exec(
          'UPDATE battle_ratings SET xp = xp + ?, updated_at = ? WHERE user_id = ?',
          earnedXp,
          Date.now(),
          profile.userId
        );
        const updated = this.ensureProfile(p);
        return Response.json({ ok: true, deltas: { [profile.userId]: { eloDelta: 0, xpDelta: earnedXp, eloAfter: updated.elo } } });
      }

      if (players.length < 2) {
        return Response.json({ ok: false, error: 'Need 2 players' }, { status: 400 });
      }

      const p1 = players[0];
      const p2 = players[1];
      const winnerId = body?.winnerUserId || null;
      const now = Date.now();
      const deltas = {};

      if (isBotMatch) {
        const human = p1.isBot ? p2 : p1;
        const bot = p1.isBot ? p1 : p2;
        const prof = this.ensureProfile(human);
        if (!prof) return Response.json({ ok: true, deltas: {} });

        const outcome = winnerId === null ? 0.5 : winnerId === human.userId ? 1 : 0;
        const rawDelta = calculateEloDelta(prof.elo, bot.elo || 1000, outcome, 16);
        // Gentle cap vs Bot so climbing high ranks still requires PvP humans
        const cappedDelta = outcome === 1 && prof.elo >= 1200 ? Math.min(4, Math.max(1, rawDelta)) : rawDelta;
        const nextElo = Math.max(800, prof.elo + cappedDelta);
        const xpGain = outcome === 1 ? 45 : outcome === 0.5 ? 25 : 15;
        const nextStreak = outcome === 1 ? prof.winStreak + 1 : 0;
        const nextBest = Math.max(prof.bestWinStreak, nextStreak);

        this.ctx.storage.sql.exec(
          `UPDATE battle_ratings
           SET elo = ?, xp = xp + ?,
               wins = wins + ?, losses = losses + ?, draws = draws + ?,
               win_streak = ?, best_win_streak = ?, matches_played = matches_played + 1, updated_at = ?
           WHERE user_id = ?`,
          nextElo,
          xpGain,
          outcome === 1 ? 1 : 0,
          outcome === 0 ? 1 : 0,
          outcome === 0.5 ? 1 : 0,
          nextStreak,
          nextBest,
          now,
          prof.userId
        );
        deltas[prof.userId] = { eloDelta: cappedDelta, xpDelta: xpGain, eloAfter: nextElo };
        return Response.json({ ok: true, deltas });
      }

      const prof1 = this.ensureProfile(p1);
      const prof2 = this.ensureProfile(p2);
      if (!prof1 || !prof2) {
        return Response.json({ ok: false, error: 'Invalid player profiles' }, { status: 400 });
      }

      const s1 = winnerId === null ? 0.5 : winnerId === prof1.userId ? 1 : 0;
      const s2 = 1 - s1;
      const d1 = calculateEloDelta(prof1.elo, prof2.elo, s1, 24);
      const d2 = calculateEloDelta(prof2.elo, prof1.elo, s2, 24);

      const updates = [
        { prof: prof1, s: s1, delta: d1 },
        { prof: prof2, s: s2, delta: d2 },
      ];

      for (const item of updates) {
        const nextElo = Math.max(800, item.prof.elo + item.delta);
        const xpGain = item.s === 1 ? 65 : item.s === 0.5 ? 35 : 20;
        const nextStreak = item.s === 1 ? item.prof.winStreak + 1 : 0;
        const nextBest = Math.max(item.prof.bestWinStreak, nextStreak);

        this.ctx.storage.sql.exec(
          `UPDATE battle_ratings
           SET elo = ?, xp = xp + ?,
               wins = wins + ?, losses = losses + ?, draws = draws + ?,
               win_streak = ?, best_win_streak = ?, matches_played = matches_played + 1, updated_at = ?
           WHERE user_id = ?`,
          nextElo,
          xpGain,
          item.s === 1 ? 1 : 0,
          item.s === 0 ? 1 : 0,
          item.s === 0.5 ? 1 : 0,
          nextStreak,
          nextBest,
          now,
          item.prof.userId
        );
        deltas[item.prof.userId] = { eloDelta: item.delta, xpDelta: xpGain, eloAfter: nextElo };
      }

      return Response.json({ ok: true, deltas });
    }

    return Response.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
}
