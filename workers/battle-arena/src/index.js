import { MatchmakerDO } from './MatchmakerDO.js';
import { BattleRoomDO } from './BattleRoomDO.js';
import { LeaderboardDO } from './LeaderboardDO.js';

export { MatchmakerDO, BattleRoomDO, LeaderboardDO };

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] || 0) ^ (bb[i] || 0);
  }
  return diff === 0;
}

export default {
  async fetch(request, env) {
    const secret = String(env.BATTLE_INTERNAL_SECRET || env.RATE_LIMITER_INTERNAL_SECRET || '');
    const provided = String(request.headers.get('X-Battle-Internal-Secret') || '');
    if (!secret || !timingSafeEqual(provided, secret)) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const lbStub = env.LEADERBOARD.get(env.LEADERBOARD.idFromName('global-leaderboard'));
    const mmStub = env.MATCHMAKER.get(env.MATCHMAKER.idFromName('global-matchmaker'));

    if (url.pathname === '/leaderboard/profile' && request.method === 'POST') {
      return lbStub.fetch('https://do/profile', request);
    }

    if (url.pathname === '/leaderboard/top' && request.method === 'POST') {
      return lbStub.fetch('https://do/top', request);
    }

    if (url.pathname === '/leaderboard/record' && request.method === 'POST') {
      return lbStub.fetch('https://do/record', request);
    }

    if (url.pathname === '/queue' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      if (!body?.user?.userId) {
        return Response.json({ ok: false, error: 'Missing user' }, { status: 400 });
      }

      const lbRes = await lbStub.fetch('https://do/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body.user),
      });
      const lbData = await lbRes.json().catch(() => null);
      const elo = lbData?.profile?.elo || 1000;

      const claimRes = await mmStub.fetch('https://do/queue/claim-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: body.user.userId,
          mode: body.mode || 'speed_blitz',
          elo,
          topicId: body.topicId || null,
        }),
      });
      const claimData = await claimRes.json().catch(() => null);
      if (!claimData?.ok || !claimData?.roomId) {
        return Response.json({ ok: false, error: claimData?.error || 'Matchmaking error' }, { status: 500 });
      }

      const roomStub = env.BATTLE_ROOM.get(env.BATTLE_ROOM.idFromName(claimData.roomId));
      const playerObj = { ...body.user, elo };

      if (claimData.matched) {
        const joinRes = await roomStub.fetch('https://do/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player: playerObj }),
        });
        const joinData = await joinRes.json().catch(() => null);
        if (joinRes.ok && joinData?.ok) {
          return Response.json({
            ok: true,
            matched: true,
            roomId: claimData.roomId,
            roomCode: claimData.roomCode,
            mode: body.mode || 'speed_blitz',
          });
        }
        // If that room raced or filled just milliseconds earlier, fall back to a fresh room
        const freshRes = await mmStub.fetch('https://do/room/register-private', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: body.mode || 'speed_blitz' }),
        });
        const fresh = await freshRes.json();
        const freshRoomStub = env.BATTLE_ROOM.get(env.BATTLE_ROOM.idFromName(fresh.roomId));
        await freshRoomStub.fetch('https://do/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: fresh.roomId,
            roomCode: fresh.roomCode,
            mode: body.mode || 'speed_blitz',
            matchType: 'quick',
            topicId: body.topicId || null,
            topicName: body.topicName || 'Kho Từ Vựng Chung HiVocab',
            host: playerObj,
            words: body.words || [],
          }),
        });
        return Response.json({
          ok: true,
          matched: false,
          roomId: fresh.roomId,
          roomCode: fresh.roomCode,
          mode: body.mode || 'speed_blitz',
        });
      }

      const initRes = await roomStub.fetch('https://do/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: claimData.roomId,
          roomCode: claimData.roomCode,
          mode: body.mode || 'speed_blitz',
          matchType: 'quick',
          topicId: body.topicId || null,
          topicName: body.topicName || 'Kho Từ Vựng Chung HiVocab',
          host: playerObj,
          words: body.words || [],
        }),
      });
      const initData = await initRes.json().catch(() => null);
      if (!initRes.ok || !initData?.ok) {
        await mmStub.fetch('https://do/queue/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: claimData.roomId }),
        });
        return Response.json({ ok: false, error: initData?.error || 'Không thể khởi tạo phòng.' }, { status: 400 });
      }

      return Response.json({
        ok: true,
        matched: false,
        roomId: claimData.roomId,
        roomCode: claimData.roomCode,
        mode: body.mode || 'speed_blitz',
      });
    }

    if (url.pathname === '/room/create' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      if (!body?.user?.userId) {
        return Response.json({ ok: false, error: 'Missing user' }, { status: 400 });
      }

      const lbRes = await lbStub.fetch('https://do/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body.user),
      });
      const lbData = await lbRes.json().catch(() => null);
      const elo = lbData?.profile?.elo || 1000;

      const regRes = await mmStub.fetch('https://do/room/register-private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: body.mode || 'speed_blitz' }),
      });
      const reg = await regRes.json();

      const roomStub = env.BATTLE_ROOM.get(env.BATTLE_ROOM.idFromName(reg.roomId));
      const initRes = await roomStub.fetch('https://do/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: reg.roomId,
          roomCode: reg.roomCode,
          mode: body.mode || 'speed_blitz',
          matchType: 'private',
          topicId: body.topicId || null,
          topicName: body.topicName || 'Kho Từ Vựng Chung HiVocab',
          host: { ...body.user, elo },
          words: body.words || [],
        }),
      });
      const initData = await initRes.json().catch(() => null);
      if (!initRes.ok || !initData?.ok) {
        return Response.json({ ok: false, error: initData?.error || 'Không thể tạo phòng.' }, { status: 400 });
      }

      return Response.json({
        ok: true,
        roomId: reg.roomId,
        roomCode: reg.roomCode,
        mode: body.mode || 'speed_blitz',
      });
    }

    if (url.pathname === '/room/join' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      if (!body?.user?.userId || !body?.roomCode) {
        return Response.json({ ok: false, error: 'Thiếu mã phòng hoặc thông tin người chơi.' }, { status: 400 });
      }

      const resolveRes = await mmStub.fetch('https://do/room/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: body.roomCode }),
      });
      const resolved = await resolveRes.json().catch(() => null);
      if (!resolveRes.ok || !resolved?.ok) {
        return Response.json({ ok: false, error: resolved?.error || 'Không tìm thấy phòng.' }, { status: resolveRes.status || 404 });
      }

      const lbRes = await lbStub.fetch('https://do/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body.user),
      });
      const lbData = await lbRes.json().catch(() => null);
      const elo = lbData?.profile?.elo || 1000;

      const roomStub = env.BATTLE_ROOM.get(env.BATTLE_ROOM.idFromName(resolved.roomId));
      const joinRes = await roomStub.fetch('https://do/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: { ...body.user, elo } }),
      });
      const joinData = await joinRes.json().catch(() => null);
      if (!joinRes.ok || !joinData?.ok) {
        return Response.json({ ok: false, error: joinData?.error || 'Không thể vào phòng.' }, { status: joinRes.status || 400 });
      }

      return Response.json({
        ok: true,
        roomId: resolved.roomId,
        roomCode: resolved.roomCode,
        mode: joinData.mode,
      });
    }

    if (url.pathname.startsWith('/ws/') && request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const roomId = url.pathname.replace('/ws/', '').trim();
      if (!roomId) return new Response('Missing roomId', { status: 400 });
      const roomStub = env.BATTLE_ROOM.get(env.BATTLE_ROOM.idFromName(roomId));
      return roomStub.fetch(request);
    }

    return Response.json({ ok: false, error: 'Not found' }, { status: 404 });
  },
};
