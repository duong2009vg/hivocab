import { DurableObject } from 'cloudflare:workers';

const QUICK_QUEUE_TTL_MS = 45 * 1000;
const PRIVATE_ROOM_TTL_MS = 30 * 60 * 1000;
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export class MatchmakerDO extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS waiting_queue (
        room_id TEXT PRIMARY KEY,
        room_code TEXT NOT NULL,
        mode TEXT NOT NULL,
        host_user_id TEXT NOT NULL,
        host_elo INTEGER NOT NULL DEFAULT 1000,
        topic_id TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_waiting_queue_mode ON waiting_queue (mode, created_at ASC);

      CREATE TABLE IF NOT EXISTS room_codes (
        room_code TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        mode TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
  }

  cleanupExpired(now = Date.now()) {
    this.ctx.storage.sql.exec('DELETE FROM waiting_queue WHERE created_at < ?', now - QUICK_QUEUE_TTL_MS);
    this.ctx.storage.sql.exec('DELETE FROM room_codes WHERE created_at < ?', now - PRIVATE_ROOM_TTL_MS);
  }

  allocateUniqueCode() {
    for (let i = 0; i < 12; i++) {
      const code = generateRoomCode();
      const exists = this.ctx.storage.sql
        .exec('SELECT room_code FROM room_codes WHERE room_code = ?', code)
        .toArray()[0];
      if (!exists) return code;
    }
    return `${Date.now().toString(36).slice(-6)}`.toUpperCase();
  }

  async fetch(request) {
    const url = new URL(request.url);
    const now = Date.now();
    this.cleanupExpired(now);

    if (request.method === 'POST' && url.pathname === '/queue/claim-or-create') {
      const body = await request.json().catch(() => null);
      const userId = String(body?.userId || '').trim();
      const mode = String(body?.mode || 'speed_blitz').trim();
      const elo = Number(body?.elo) || 1000;
      const topicId = body?.topicId ? String(body.topicId) : null;

      if (!userId) return Response.json({ ok: false, error: 'Missing userId' }, { status: 400 });

      // Remove any previous stale waiting room owned by the same user
      this.ctx.storage.sql.exec('DELETE FROM waiting_queue WHERE host_user_id = ?', userId);

      // Look for an open quick-match waiting room with matching mode & topic preference
      const candidates = this.ctx.storage.sql
        .exec(
          `SELECT * FROM waiting_queue
           WHERE mode = ? AND host_user_id != ?
             AND (? IS NULL AND topic_id IS NULL OR topic_id = ?)
           ORDER BY ABS(host_elo - ?) ASC, created_at ASC
           LIMIT 1`,
          mode,
          userId,
          topicId,
          topicId,
          elo
        )
        .toArray();

      if (candidates.length > 0) {
        const match = candidates[0];
        this.ctx.storage.sql.exec('DELETE FROM waiting_queue WHERE room_id = ?', match.room_id);
        return Response.json({
          ok: true,
          matched: true,
          roomId: match.room_id,
          roomCode: match.room_code,
        });
      }

      const roomId = crypto.randomUUID();
      const roomCode = this.allocateUniqueCode();
      this.ctx.storage.sql.exec(
        'INSERT INTO waiting_queue (room_id, room_code, mode, host_user_id, host_elo, topic_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        roomId,
        roomCode,
        mode,
        userId,
        elo,
        topicId,
        now
      );
      this.ctx.storage.sql.exec(
        'INSERT OR REPLACE INTO room_codes (room_code, room_id, mode, created_at) VALUES (?, ?, ?, ?)',
        roomCode,
        roomId,
        mode,
        now
      );

      return Response.json({
        ok: true,
        matched: false,
        roomId,
        roomCode,
      });
    }

    if (request.method === 'POST' && url.pathname === '/room/register-private') {
      const body = await request.json().catch(() => null);
      const mode = String(body?.mode || 'speed_blitz').trim();
      const roomId = crypto.randomUUID();
      const roomCode = this.allocateUniqueCode();
      this.ctx.storage.sql.exec(
        'INSERT OR REPLACE INTO room_codes (room_code, room_id, mode, created_at) VALUES (?, ?, ?, ?)',
        roomCode,
        roomId,
        mode,
        now
      );
      return Response.json({ ok: true, roomId, roomCode });
    }

    if (request.method === 'POST' && url.pathname === '/room/resolve') {
      const body = await request.json().catch(() => null);
      const roomCode = String(body?.roomCode || '').trim().toUpperCase();
      if (!roomCode) return Response.json({ ok: false, error: 'Thiếu mã phòng.' }, { status: 400 });
      const row = this.ctx.storage.sql
        .exec('SELECT room_id, mode FROM room_codes WHERE room_code = ?', roomCode)
        .toArray()[0];
      if (!row) {
        return Response.json({ ok: false, error: 'Không tìm thấy phòng hoặc phòng đã hết hạn.' }, { status: 404 });
      }
      return Response.json({ ok: true, roomId: row.room_id, mode: row.mode, roomCode });
    }

    if (request.method === 'POST' && url.pathname === '/queue/remove') {
      const body = await request.json().catch(() => null);
      if (body?.roomId) {
        this.ctx.storage.sql.exec('DELETE FROM waiting_queue WHERE room_id = ?', String(body.roomId));
      }
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
}
