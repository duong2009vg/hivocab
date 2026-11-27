// functions/api/battle/[[path]].js
// Authenticated Cloudflare Pages gateway + WebSocket bridge for HiVocab Battle Arena Worker.
import { checkRateLimit, rateLimitResponse } from '../../_rateLimit.js';
import { getCorsHeaders, requireSupabaseUser, timingSafeEqual } from '../../_security.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_MODES = new Set(['speed_blitz', 'audio_sniper', 'word_duel', 'flash_match']);
const GENERAL_POOL_CACHE_KEY = 'https://battle-cache.hivocab.internal/general-word-pool-v1';

function jsonResponse(payload, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function toBase64Url(bytes) {
  let binary = '';
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(str) {
  const base64 = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

async function signTicket(payload, secret) {
  const enc = new TextEncoder();
  const payloadB64 = toBase64Url(enc.encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
  return `${payloadB64}.${toBase64Url(new Uint8Array(sig))}`;
}

async function verifyTicket(ticket, secret) {
  const parts = String(ticket || '').split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expectedSig = toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64))));
  if (!timingSafeEqual(sigB64, expectedSig)) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
    if (!data?.userId || !data?.roomId || !data?.exp || Date.now() > Number(data.exp)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

async function fetchUserBattleIdentity(auth, env) {
  const supabaseUrl = String(env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const supabaseAnonKey = String(env.SUPABASE_ANON_KEY || '').trim();
  const meta = auth.user?.user_metadata || {};
  let displayName =
    meta.full_name || meta.name || (auth.user?.email ? auth.user.email.split('@')[0] : '') || 'Học viên HiVocab';
  const avatarUrl = meta.avatar_url || meta.picture || '';
  let isPro = false;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(auth.user.id)}&select=full_name,role,tier,subscription_plan,subscription_expires_at`,
      {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          apikey: supabaseAnonKey,
        },
      }
    );
    if (res.ok) {
      const rows = await res.json().catch(() => []);
      const prof = rows?.[0];
      if (prof?.full_name) displayName = prof.full_name;
      const notExpired = !prof?.subscription_expires_at || new Date(prof.subscription_expires_at).getTime() > Date.now();
      isPro = Boolean(
        prof?.role === 'admin' ||
          ((['pro', 'lifetime'].includes(prof?.tier) ||
            ['pro_1m', 'pro_6m', 'pro_1y', 'pro_lifetime', 'lifetime'].includes(prof?.subscription_plan)) &&
            notExpired)
      );
    }
  } catch (_) {}

  return {
    userId: auth.user.id,
    displayName: String(displayName).trim().slice(0, 50) || 'Học viên HiVocab',
    avatarUrl: String(avatarUrl || '').trim().slice(0, 300),
    isPro,
  };
}

function sampleRandomItems(arr, limit = 45) {
  const copy = [...(arr || [])];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, limit);
}

async function fetchBattleWords(env, auth, topicId = null) {
  const supabaseUrl = String(env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const supabaseAnonKey = String(env.SUPABASE_ANON_KEY || '').trim();
  const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (topicId && UUID_RE.test(topicId)) {
    // Respect RLS with the user's own JWT for custom/selected topics
    const [topicRes, wordsRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/topics?id=eq.${encodeURIComponent(topicId)}&select=id,name&limit=1`, {
        headers: { Authorization: `Bearer ${auth.token}`, apikey: supabaseAnonKey },
      }),
      fetch(
        `${supabaseUrl}/rest/v1/words?topic_id=eq.${encodeURIComponent(topicId)}&select=id,word,phonetic,meaning,example_sentence&limit=90`,
        {
          headers: { Authorization: `Bearer ${auth.token}`, apikey: supabaseAnonKey },
        }
      ),
    ]);

    const topicRow = topicRes.ok ? (await topicRes.json().catch(() => []))[0] : null;
    const wordsRows = wordsRes.ok ? await wordsRes.json().catch(() => []) : [];
    const usable = (Array.isArray(wordsRows) ? wordsRows : []).filter(
      (w) => w?.word && w?.meaning && String(w.word).trim().length <= 36
    );
    if (topicRow && usable.length >= 4) {
      return {
        topicId: topicRow.id,
        topicName: topicRow.name || 'Chủ đề đã chọn',
        words: sampleRandomItems(usable, 45),
      };
    }
    if (topicRow && usable.length < 4) {
      throw new Error(`Chủ đề "${topicRow.name}" cần ít nhất 4 từ có nghĩa để mở đấu trường.`);
    }
  }

  // General high-quality pool (cached 10 mins at Cloudflare Edge to keep Supabase DB load near zero)
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  if (cache) {
    try {
      const cached = await cache.match(GENERAL_POOL_CACHE_KEY);
      if (cached) {
        const cachedPool = await cached.json().catch(() => null);
        if (Array.isArray(cachedPool) && cachedPool.length >= 20) {
          return {
            topicId: null,
            topicName: 'Kho Từ Vựng Chung HiVocab',
            words: sampleRandomItems(cachedPool, 45),
          };
        }
      }
    } catch (_) {}
  }

  const authHeader = serviceRoleKey ? `Bearer ${serviceRoleKey}` : `Bearer ${auth.token}`;
  const apiKeyHeader = serviceRoleKey || supabaseAnonKey;

  // Prefer words from public/free curated topics that already have example & phonetic
  const wordsRes = await fetch(
    `${supabaseUrl}/rest/v1/words?select=id,word,phonetic,meaning,example_sentence&phonetic=not.is.null&example_sentence=not.is.null&limit=200`,
    {
      headers: {
        Authorization: authHeader,
        apikey: apiKeyHeader,
      },
    }
  );
  let pool = wordsRes.ok ? await wordsRes.json().catch(() => []) : [];
  pool = (Array.isArray(pool) ? pool : []).filter(
    (w) =>
      w?.word &&
      w?.meaning &&
      /^[A-Za-z][A-Za-z\s'-]{1,28}$/.test(String(w.word).trim()) &&
      String(w.phonetic || '').includes('/')
  );

  if (pool.length < 20) {
    const fallbackRes = await fetch(
      `${supabaseUrl}/rest/v1/words?select=id,word,phonetic,meaning,example_sentence&limit=150`,
      {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          apikey: supabaseAnonKey,
        },
      }
    );
    const fbRows = fallbackRes.ok ? await fallbackRes.json().catch(() => []) : [];
    pool = (Array.isArray(fbRows) ? fbRows : []).filter((w) => w?.word && w?.meaning);
  }

  if (pool.length < 4) {
    throw new Error('Kho từ vựng chưa đủ dữ liệu để tạo trận đấu.');
  }

  if (cache && pool.length >= 20) {
    try {
      await cache.put(
        GENERAL_POOL_CACHE_KEY,
        new Response(JSON.stringify(pool), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=600',
          },
        })
      );
    } catch (_) {}
  }

  return {
    topicId: null,
    topicName: 'Kho Từ Vựng Chung HiVocab',
    words: sampleRandomItems(pool, 45),
  };
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(context.request, 'GET, POST, OPTIONS'),
  });
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const corsHeaders = getCorsHeaders(request, 'GET, POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const battleService = env?.HIVOCAB_BATTLE_SERVICE;
  const internalSecret = String(env?.BATTLE_INTERNAL_SECRET || env?.HIVOCAB_RATE_LIMIT_SECRET || '').trim();
  if (!battleService || !internalSecret) {
    return jsonResponse({ ok: false, error: 'Dịch vụ Đấu trường chưa được cấu hình.' }, 503, corsHeaders);
  }

  const pathParts = Array.isArray(params?.path) ? params.path : [];
  const subPath = `/${pathParts.join('/')}`;

  // 1. WebSocket Upgrade Bridge -> verify signed ticket & pipe straight to BattleRoomDO
  if (subPath === '/ws' && request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
    const url = new URL(request.url);
    const ticket = url.searchParams.get('ticket');
    const roomId = url.searchParams.get('roomId');
    const verified = await verifyTicket(ticket, internalSecret);
    if (!verified || (roomId && verified.roomId !== roomId)) {
      return new Response('Unauthorized WebSocket ticket', { status: 401 });
    }

    const forwardHeaders = new Headers(request.headers);
    forwardHeaders.set('X-Battle-Internal-Secret', internalSecret);
    forwardHeaders.set('X-Battle-User-Id', verified.userId);

    return battleService.fetch(
      new Request(`https://battle-worker/ws/${encodeURIComponent(verified.roomId)}`, {
        method: 'GET',
        headers: forwardHeaders,
      })
    );
  }

  // 2. All HTTP endpoints require authenticated Supabase user + rate limit
  const preLimit = await checkRateLimit({ request, env, ruleName: 'public' });
  if (!preLimit.allowed) return rateLimitResponse(preLimit, corsHeaders);

  const auth = await requireSupabaseUser(request, env, corsHeaders);
  if (!auth.ok) return auth.response;

  const userLimit = await checkRateLimit({ request, env, ruleName: 'public', subject: auth.user.id });
  if (!userLimit.allowed) return rateLimitResponse(userLimit, corsHeaders);

  const callWorker = async (workerPath, payload) => {
    const res = await battleService.fetch(`https://battle-worker${workerPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Battle-Internal-Secret': internalSecret,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data };
  };

  if (request.method === 'GET' && subPath === '/leaderboard') {
    const user = await fetchUserBattleIdentity(auth, env);
    const wRes = await callWorker('/leaderboard/top', { limit: 30, user });
    return jsonResponse(wRes.data || { ok: false }, wRes.status, corsHeaders);
  }

  if (request.method === 'GET' && subPath === '/profile') {
    const user = await fetchUserBattleIdentity(auth, env);
    const wRes = await callWorker('/leaderboard/profile', user);
    return jsonResponse(wRes.data || { ok: false }, wRes.status, corsHeaders);
  }

  if (request.method === 'GET' && subPath === '/topics') {
    const supabaseUrl = String(env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
    const supabaseAnonKey = String(env.SUPABASE_ANON_KEY || '').trim();
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/topics?select=id,name,icon,category,word_count,is_public,user_id&order=word_count.desc.nullslast&limit=60`,
        {
          headers: { Authorization: `Bearer ${auth.token}`, apikey: supabaseAnonKey },
        }
      );
      const rows = res.ok ? await res.json().catch(() => []) : [];
      const usableTopics = (Array.isArray(rows) ? rows : [])
        .filter((t) => (Number(t.word_count) || 0) >= 6 || t.user_id === auth.user.id)
        .map((t) => ({
          id: t.id,
          name: t.name,
          icon: t.icon || 'folder',
          category: t.category || 'General English',
          wordCount: Number(t.word_count) || 0,
          isMine: t.user_id === auth.user.id,
        }));
      return jsonResponse({ ok: true, topics: usableTopics }, 200, corsHeaders);
    } catch {
      return jsonResponse({ ok: true, topics: [] }, 200, corsHeaders);
    }
  }

  if (request.method === 'POST' && (subPath === '/queue' || subPath === '/room/create')) {
    const body = await request.json().catch(() => ({}));
    const mode = ALLOWED_MODES.has(body?.mode) ? body.mode : 'speed_blitz';
    const rawTopicId = body?.topicId && UUID_RE.test(body.topicId) ? body.topicId : null;
    const rawCharId = String(body?.characterId || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);

    try {
      const [user, deckPool] = await Promise.all([
        fetchUserBattleIdentity(auth, env),
        fetchBattleWords(env, auth, rawTopicId),
      ]);
      if (rawCharId) user.characterId = rawCharId;

      const workerPath = subPath === '/queue' ? '/queue' : '/room/create';
      const wRes = await callWorker(workerPath, {
        user,
        mode,
        topicId: deckPool.topicId,
        topicName: deckPool.topicName,
        words: deckPool.words,
      });

      if (!wRes.ok || !wRes.data?.ok || !wRes.data?.roomId) {
        return jsonResponse(wRes.data || { ok: false, error: 'Không thể tạo phòng đấu.' }, wRes.status || 400, corsHeaders);
      }

      const ticket = await signTicket(
        { roomId: wRes.data.roomId, userId: user.userId, exp: Date.now() + 120 * 1000 },
        internalSecret
      );

      return jsonResponse(
        {
          ok: true,
          matched: Boolean(wRes.data.matched),
          roomId: wRes.data.roomId,
          roomCode: wRes.data.roomCode,
          mode: wRes.data.mode || mode,
          topicName: deckPool.topicName,
          ticket,
        },
        200,
        corsHeaders
      );
    } catch (err) {
      return jsonResponse({ ok: false, error: err?.message || 'Lỗi khởi tạo trận đấu.' }, 400, corsHeaders);
    }
  }

  if (request.method === 'POST' && subPath === '/room/join') {
    const body = await request.json().catch(() => ({}));
    const roomCode = String(body?.roomCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    const rawCharId = String(body?.characterId || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
    if (!roomCode) {
      return jsonResponse({ ok: false, error: 'Vui lòng nhập mã phòng hợp lệ.' }, 400, corsHeaders);
    }

    const user = await fetchUserBattleIdentity(auth, env);
    if (rawCharId) user.characterId = rawCharId;
    const wRes = await callWorker('/room/join', { user, roomCode });
    if (!wRes.ok || !wRes.data?.ok || !wRes.data?.roomId) {
      return jsonResponse(wRes.data || { ok: false, error: 'Không thể tham gia phòng.' }, wRes.status || 400, corsHeaders);
    }

    const ticket = await signTicket(
      { roomId: wRes.data.roomId, userId: user.userId, exp: Date.now() + 120 * 1000 },
      internalSecret
    );

    return jsonResponse(
      {
        ok: true,
        roomId: wRes.data.roomId,
        roomCode: wRes.data.roomCode,
        mode: wRes.data.mode,
        ticket,
      },
      200,
      corsHeaders
    );
  }

  if (request.method === 'POST' && subPath === '/solo-record') {
    const body = await request.json().catch(() => ({}));
    const user = await fetchUserBattleIdentity(auth, env);
    const xpEarned = Math.max(10, Math.min(250, Number(body?.xpEarned) || 25));
    const wRes = await callWorker('/leaderboard/record', {
      isSolo: true,
      players: [{ ...user, xpEarned }],
    });
    return jsonResponse(wRes.data || { ok: true }, wRes.status || 200, corsHeaders);
  }

  return jsonResponse({ ok: false, error: 'Not found' }, 404, corsHeaders);
}
