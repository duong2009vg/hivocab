// scripts/local-importer-gui.mjs
// Local Desktop Web GUI Server for bulk-importing YouTube videos into HiVocab (uses your own PC's IP, bypassing Cloudflare blocks)

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import {
  extractYoutubeVideoId,
  extractYoutubeVideoCaptions,
  resolveYoutubeChannelVideos,
} from '../functions/_lib/studioCaptionExtractor.js';

const PORT = Number.parseInt(process.env.HIVOCAB_IMPORTER_PORT || '4199', 10) || 4199;
const HOST = '127.0.0.1';
const VALID_LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
const ENV_LOCAL_PATH = path.resolve(process.cwd(), '.env.local');

let runtimeAuth = {
  serviceRoleKey: '',
  adminJwt: '',
  adminEmail: '',
};

async function loadEnvFiles() {
  for (const filename of ['.env', '.env.local']) {
    try {
      const content = await fs.readFile(path.resolve(process.cwd(), filename), 'utf8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx === -1) continue;
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (key && !(key in process.env)) {
          process.env[key] = val;
        }
      }
    } catch {
      // Optional .env files
    }
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    runtimeAuth.serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY).trim();
  }
}

function getSupabaseConfig() {
  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  return { supabaseUrl, supabaseAnonKey };
}

function getActiveSupabaseHeaders() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  if (!supabaseUrl) return null;
  if (runtimeAuth.serviceRoleKey) {
    return {
      supabaseUrl,
      mode: 'service_role',
      headers: {
        apikey: runtimeAuth.serviceRoleKey,
        Authorization: `Bearer ${runtimeAuth.serviceRoleKey}`,
      },
    };
  }
  if (runtimeAuth.adminJwt && supabaseAnonKey) {
    return {
      supabaseUrl,
      mode: 'admin_login',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${runtimeAuth.adminJwt}`,
      },
    };
  }
  return null;
}

async function saveServiceKeyToEnvLocal(newKey) {
  const cleanKey = String(newKey || '').trim();
  if (!cleanKey) throw new Error('Service Role Key không được để trống.');
  let lines = [];
  try {
    const existing = await fs.readFile(ENV_LOCAL_PATH, 'utf8');
    lines = existing.split(/\r?\n/);
  } catch {
    lines = [];
  }

  let replaced = false;
  const updated = lines.map((line) => {
    if (/^\s*SUPABASE_SERVICE_ROLE_KEY\s*=/.test(line)) {
      replaced = true;
      return `SUPABASE_SERVICE_ROLE_KEY=${cleanKey}`;
    }
    return line;
  });
  if (!replaced) {
    if (updated.length && updated[updated.length - 1] !== '') updated.push('');
    updated.push(`SUPABASE_SERVICE_ROLE_KEY=${cleanKey}`);
  }
  await fs.writeFile(ENV_LOCAL_PATH, `${updated.join('\n').replace(/\n+$/, '')}\n`, 'utf8');
  process.env.SUPABASE_SERVICE_ROLE_KEY = cleanKey;
  runtimeAuth.serviceRoleKey = cleanKey;
}

function isAllowedBridgeOrigin(rawOrigin) {
  const origin = String(rawOrigin || '').trim();
  if (!origin) return false;
  try {
    const u = new URL(origin);
    const host = u.hostname.toLowerCase();
    if (host === 'hivocab.site' || host === 'www.hivocab.site') return u.protocol === 'https:';
    if (host.endsWith('.hivocab.pages.dev') && u.protocol === 'https:') return true;
    if ((host === '127.0.0.1' || host === 'localhost') && (u.protocol === 'http:' || u.protocol === 'https:')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function getBridgeCorsHeaders(req) {
  const origin = req.headers.origin || '';
  if (!isAllowedBridgeOrigin(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Access-Control-Request-Private-Network',
    'Access-Control-Allow-Private-Network': 'true',
    Vary: 'Origin',
  };
}

function sendJson(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > 2 * 1024 * 1024) throw new Error('Payload too large');
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

async function handleApi(req, res, urlObj) {
  const pathname = urlObj.pathname;

  if (req.method === 'GET' && pathname === '/api/status') {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    const active = getActiveSupabaseHeaders();
    return sendJson(res, 200, {
      ok: true,
      supabaseConfigured: Boolean(supabaseUrl && (supabaseAnonKey || runtimeAuth.serviceRoleKey)),
      supabaseUrl,
      authReady: Boolean(active),
      authMode: active?.mode || 'none',
      adminEmail: runtimeAuth.adminEmail || '',
    });
  }

  if (req.method === 'POST' && pathname === '/api/save-service-key') {
    try {
      const body = await readJsonBody(req);
      const key = String(body?.service_role_key || '').trim();
      const { supabaseUrl } = getSupabaseConfig();
      if (!supabaseUrl) {
        return sendJson(res, 400, { ok: false, error: 'Thiếu VITE_SUPABASE_URL trong .env.local.' });
      }
      const probeRes = await fetch(`${supabaseUrl}/rest/v1/studio_videos?select=id&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (!probeRes.ok) {
        return sendJson(res, 401, {
          ok: false,
          error: `Service Role Key không hợp lệ hoặc không có quyền truy cập (HTTP ${probeRes.status}).`,
        });
      }
      await saveServiceKeyToEnvLocal(key);
      return sendJson(res, 200, { ok: true, authMode: 'service_role' });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err?.message || 'Không thể lưu key.' });
    }
  }

  if (req.method === 'POST' && pathname === '/api/connect-token') {
    const cors = getBridgeCorsHeaders(req);
    if (req.headers.origin && !isAllowedBridgeOrigin(req.headers.origin)) {
      return sendJson(res, 403, { ok: false, error: 'Origin không được phép kết nối Tool PC.' });
    }
    try {
      const body = await readJsonBody(req);
      const token = String(body?.access_token || body?.token || '').trim();
      if (!token) {
        return sendJson(res, 400, { ok: false, error: 'Thiếu Access Token Admin.' }, cors);
      }
      const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
      if (!supabaseUrl || !supabaseAnonKey) {
        return sendJson(res, 400, { ok: false, error: 'Thiếu cấu hình VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.' }, cors);
      }
      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json().catch(() => null);
      if (!userRes.ok || !userData?.id) {
        return sendJson(res, 401, { ok: false, error: 'Token không hợp lệ hoặc đã hết hạn.' }, cors);
      }
      const roleRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles?select=role&id=eq.${encodeURIComponent(userData.id)}&limit=1`,
        {
          headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` },
        }
      );
      const roleRows = await roleRes.json().catch(() => []);
      if (!Array.isArray(roleRows) || roleRows[0]?.role !== 'admin') {
        return sendJson(res, 403, { ok: false, error: 'Tài khoản của Token này không phải Admin.' }, cors);
      }
      runtimeAuth.adminJwt = token;
      runtimeAuth.adminEmail = String(userData.email || 'Admin');
      return sendJson(res, 200, { ok: true, authMode: 'admin_login', adminEmail: runtimeAuth.adminEmail }, cors);
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err?.message || 'Lỗi xác thực Token Admin.' }, cors);
    }
  }

  if (req.method === 'POST' && pathname === '/api/login') {
    try {
      const body = await readJsonBody(req);
      const email = String(body?.email || '').trim();
      const password = String(body?.password || '');
      const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
      if (!supabaseUrl || !supabaseAnonKey) {
        return sendJson(res, 400, { ok: false, error: 'Thiếu cấu hình VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY.' });
      }
      const loginRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await loginRes.json().catch(() => ({}));
      if (!loginRes.ok || !data?.access_token || !data?.user?.id) {
        const rawErr = String(data?.error_description || data?.msg || '');
        const isCaptcha = /captcha/i.test(rawErr);
        return sendJson(res, 401, {
          ok: false,
          error: isCaptcha
            ? 'Supabase đang bật Turnstile CAPTCHA nên không thể đăng nhập Email/Mật khẩu trực tiếp từ tool ngoài trình duyệt. Hãy dùng Cách 1 (Service Role Key) hoặc Cách 2 (Kết nối từ phiên Web Admin).'
            : rawErr || 'Sai email hoặc mật khẩu.',
        });
      }
      const roleRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles?select=role&id=eq.${encodeURIComponent(data.user.id)}&limit=1`,
        {
          headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${data.access_token}` },
        }
      );
      const roleRows = await roleRes.json().catch(() => []);
      if (!Array.isArray(roleRows) || roleRows[0]?.role !== 'admin') {
        return sendJson(res, 403, { ok: false, error: 'Tài khoản này không có quyền Admin.' });
      }
      runtimeAuth.adminJwt = data.access_token;
      runtimeAuth.adminEmail = email;
      return sendJson(res, 200, { ok: true, authMode: 'admin_login', adminEmail: email });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err?.message || 'Lỗi đăng nhập.' });
    }
  }

  if (req.method === 'POST' && pathname === '/api/resolve-channel') {
    try {
      const body = await readJsonBody(req);
      const channelUrl = String(body?.channel_url || '').trim();
      const limit = Math.min(30, Math.max(1, Number.parseInt(String(body?.limit || 20), 10) || 20));
      const cursor = body?.cursor && typeof body.cursor === 'object' ? body.cursor : null;
      const resolved = await resolveYoutubeChannelVideos(channelUrl, limit, { cursor });

      const existingSet = new Set();
      const active = getActiveSupabaseHeaders();
      const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
      const ytIds = resolved.videos.map((v) => v.youtube_video_id);
      const readUrl = active?.supabaseUrl || supabaseUrl;
      const readHeaders = active?.headers || (supabaseAnonKey ? { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` } : null);
      if (readUrl && readHeaders && ytIds.length > 0) {
        try {
          const inFilter = `(${ytIds.join(',')})`;
          const existRes = await fetch(
            `${readUrl}/rest/v1/studio_videos?select=youtube_video_id&youtube_video_id=in.${encodeURIComponent(inFilter)}`,
            { headers: readHeaders }
          );
          if (existRes.ok) {
            const rows = await existRes.json().catch(() => []);
            if (Array.isArray(rows)) {
              for (const r of rows) {
                if (r?.youtube_video_id) existingSet.add(r.youtube_video_id);
              }
            }
          }
        } catch {
          // Non-fatal
        }
      }

      return sendJson(res, 200, {
        ok: true,
        channel_id: resolved.channel_id,
        channel_name: resolved.channel_name,
        count: resolved.videos.length,
        has_more: Boolean(resolved.has_more),
        next_cursor: resolved.next_cursor || null,
        videos: resolved.videos.map((v) => ({
          ...v,
          already_imported: existingSet.has(v.youtube_video_id),
        })),
      });
    } catch (err) {
      return sendJson(res, Number(err?.status) || 502, {
        ok: false,
        error: err?.detail || err?.message || 'Không thể quét danh sách video từ kênh này.',
      });
    }
  }

  if (req.method === 'POST' && pathname === '/api/import-single') {
    const active = getActiveSupabaseHeaders();
    if (!active) {
      return sendJson(res, 401, {
        ok: false,
        error: 'Chưa kết nối Supabase Admin. Hãy nhập Service Role Key hoặc đăng nhập Admin ở khung phía trên.',
      });
    }

    try {
      const body = await readJsonBody(req);
      const videoId = extractYoutubeVideoId(body?.youtube_url || body?.url || body?.video_id);
      if (!videoId) {
        return sendJson(res, 400, { ok: false, error: 'Link hoặc ID YouTube không hợp lệ.' });
      }

      const customTitle = String(body?.title || '').trim().slice(0, 260);
      const customChannelName = String(body?.channel_name || '').trim().slice(0, 120);
      const rawLevel = String(body?.level || 'B1').toUpperCase();
      const level = VALID_LEVELS.has(rawLevel) ? rawLevel : 'B1';
      const overwrite = body?.overwrite !== false;

      let existingId = '';
      try {
        const checkRes = await fetch(
          `${active.supabaseUrl}/rest/v1/studio_videos?select=id&youtube_video_id=eq.${encodeURIComponent(videoId)}&limit=1`,
          { headers: active.headers }
        );
        if (checkRes.ok) {
          const rows = await checkRes.json().catch(() => []);
          if (Array.isArray(rows) && rows[0]?.id) existingId = rows[0].id;
        }
      } catch {
        // Ignore
      }

      if (existingId && !overwrite) {
        return sendJson(res, 200, {
          ok: true,
          skipped: true,
          video: { id: existingId, youtube_video_id: videoId, title: customTitle || videoId },
        });
      }

      const extracted = await extractYoutubeVideoCaptions({
        videoId,
        env: { DEEPL_API_KEY: process.env.DEEPL_API_KEY || '' },
        userTitle: customTitle,
        userAuthor: customChannelName,
        includeVi: true,
        allowDeepL: true,
        translateAll: true,
      });

      const channelName = customChannelName || extracted.author || 'YouTube';
      const payload = {
        id: existingId || `yt-${videoId}`,
        youtube_video_id: videoId,
        title: extracted.title,
        channel_name: channelName,
        author: extracted.author || channelName,
        genre: `${channelName} · Shadowing`,
        level,
        tags: ['shadowing', 'youtube', level.toLowerCase()],
        start_seconds: extracted.startSeconds,
        end_seconds: extracted.endSeconds,
        cue_count: extracted.cueCount,
        cues: extracted.cues,
        caption_status: extracted.captionSource === 'youtube_caption_track' ? 'youtube_manual' : 'youtube_auto',
        translation_status: extracted.translationStatus,
        is_pro: false,
        is_published: true,
        updated_at: new Date().toISOString(),
      };

      const upsertRes = await fetch(`${active.supabaseUrl}/rest/v1/studio_videos`, {
        method: 'POST',
        headers: {
          ...active.headers,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(payload),
      });
      if (!upsertRes.ok) {
        const errText = await upsertRes.text();
        return sendJson(res, 500, { ok: false, error: `Lỗi lưu Supabase: ${errText.slice(0, 180)}` });
      }

      return sendJson(res, 200, {
        ok: true,
        skipped: false,
        video: {
          id: payload.id,
          youtube_video_id: videoId,
          title: payload.title,
          channel_name: channelName,
          level,
          cue_count: extracted.cueCount,
          translated_cues: extracted.translatedCuesCount,
        },
      });
    } catch (err) {
      return sendJson(res, Number(err?.status) || 502, {
        ok: false,
        error: err?.detail || err?.message || 'Lỗi xử lý video YouTube.',
      });
    }
  }

  if (req.method === 'GET' && pathname === '/api/videos') {
    const active = getActiveSupabaseHeaders();
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    if (!supabaseUrl) return sendJson(res, 400, { ok: false, error: 'Missing Supabase URL' });
    const headers = active
      ? active.headers
      : { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` };
    const listRes = await fetch(
      `${supabaseUrl}/rest/v1/studio_videos?select=id,youtube_video_id,title,channel_name,author,level,cue_count,is_pro,is_published,sort_order,created_at&order=sort_order.asc,created_at.desc&limit=500`,
      { headers }
    );
    const rows = await listRes.json().catch(() => []);
    if (!listRes.ok) {
      return sendJson(res, listRes.status, { ok: false, error: 'Không tải được kho video.' });
    }
    return sendJson(res, 200, { ok: true, videos: Array.isArray(rows) ? rows : [] });
  }

  if (req.method === 'POST' && pathname === '/api/videos/update') {
    const active = getActiveSupabaseHeaders();
    if (!active) return sendJson(res, 401, { ok: false, error: 'Chưa kết nối quyền Admin Supabase.' });
    const body = await readJsonBody(req);
    const id = String(body?.id || '').trim();
    if (!id) return sendJson(res, 400, { ok: false, error: 'Thiếu ID video.' });
    const patch = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) patch.title = String(body.title).trim();
    if (body.channel_name !== undefined) {
      patch.channel_name = String(body.channel_name).trim() || 'YouTube';
      patch.author = patch.channel_name;
    }
    if (body.level !== undefined && VALID_LEVELS.has(String(body.level).toUpperCase())) {
      patch.level = String(body.level).toUpperCase();
    }
    if (body.is_published !== undefined) patch.is_published = Boolean(body.is_published);

    const patchRes = await fetch(`${active.supabaseUrl}/rest/v1/studio_videos?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { ...active.headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });
    if (!patchRes.ok) {
      return sendJson(res, patchRes.status, { ok: false, error: await patchRes.text() });
    }
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'POST' && pathname === '/api/videos/delete') {
    const active = getActiveSupabaseHeaders();
    if (!active) return sendJson(res, 401, { ok: false, error: 'Chưa kết nối quyền Admin Supabase.' });
    const body = await readJsonBody(req);
    const id = String(body?.id || '').trim();
    if (!id) return sendJson(res, 400, { ok: false, error: 'Thiếu ID video.' });
    const delRes = await fetch(`${active.supabaseUrl}/rest/v1/studio_videos?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: active.headers,
    });
    if (!delRes.ok) {
      return sendJson(res, delRes.status, { ok: false, error: await delRes.text() });
    }
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 404, { ok: false, error: 'Not found' });
}

const HTML_PAGE = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>HiVocab — Tool Nạp Video YouTube Trực Tiếp</title>
  <style>
    :root {
      --bg: #FAF5EB;
      --card: #FFFCF7;
      --ink: #2E2823;
      --muted: #786F66;
      --border: #3D352E;
      --accent: #D96B43;
      --green: #4D6B53;
      --cream: #F4E3B4;
      --danger: #B53D2A;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: var(--bg); color: var(--ink); padding: 20px 16px 48px;
    }
    .wrap { max-width: 1040px; margin: 0 auto; display: grid; gap: 16px; }
    .card {
      background: var(--card); border: 2px solid var(--border); border-radius: 20px;
      padding: 18px 20px; box-shadow: 3px 3px 0 var(--border);
    }
    .row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .between { justify-content: space-between; }
    h1 { margin: 0; font-size: 20px; font-weight: 900; }
    h2 { margin: 0 0 8px; font-size: 15px; font-weight: 900; }
    p.sub { margin: 4px 0 0; font-size: 13px; color: var(--muted); font-weight: 600; }
    .badge {
      display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px;
      border-radius: 999px; border: 1.5px solid var(--border); font-size: 12px; font-weight: 800;
      background: #EEF5EC; color: #355A3B;
    }
    .badge.warn { background: #FFF0EB; color: var(--danger); }
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      padding: 9px 14px; border-radius: 12px; border: 2px solid var(--border);
      font-size: 13px; font-weight: 800; cursor: pointer; background: #fff; color: var(--ink);
      box-shadow: 2px 2px 0 var(--border); transition: transform .08s;
    }
    .btn:active { transform: translateY(1px); }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .btn.primary { background: var(--accent); color: #fff; }
    .btn.green { background: var(--green); color: #fff; }
    .btn.soft { background: var(--bg); box-shadow: none; }
    .btn.danger { background: #FDECE8; color: var(--danger); box-shadow: none; }
    input, select, textarea {
      width: 100%; padding: 9px 12px; border-radius: 11px; border: 2px solid var(--border);
      background: #fff; color: var(--ink); font-size: 13px; font-weight: 600;
    }
    textarea { font-family: Consolas, monospace; min-height: 115px; }
    label.lbl { display: block; font-size: 11px; font-weight: 900; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
    .grid { display: grid; gap: 10px; }
    .grid-12 { display: grid; grid-template-columns: repeat(12, 1fr); gap: 10px; align-items: end; }
    .c2 { grid-column: span 2; } .c3 { grid-column: span 3; } .c4 { grid-column: span 4; }
    .c5 { grid-column: span 5; } .c6 { grid-column: span 6; } .c7 { grid-column: span 7; }
    .c8 { grid-column: span 8; } .c9 { grid-column: span 9; }
    @media (max-width: 760px) { .grid-12 > div { grid-column: span 12 !important; } }
    .tabs { display: flex; flex-wrap: wrap; gap: 8px; }
    .tab-btn.active { background: var(--accent); color: #fff; }
    .list-box { max-height: 360px; overflow-y: auto; display: grid; gap: 7px; padding-right: 4px; }
    .vid-item {
      display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 12px;
      border: 2px solid #E8DEC8; background: #fff; cursor: pointer;
    }
    .vid-item.checked { background: #EEF5EC; border-color: var(--green); }
    .vid-item img { width: 72px; height: 41px; object-fit: cover; border-radius: 7px; border: 1px solid var(--border); flex-shrink: 0; }
    .vid-item input[type="checkbox"] { width: 17px; height: 17px; accent-color: var(--green); flex-shrink: 0; }
    .progress-bar { width: 100%; height: 11px; border-radius: 999px; background: var(--bg); border: 1.5px solid var(--border); overflow: hidden; }
    .progress-fill { height: 100%; background: var(--green); width: 0%; transition: width .25s; }
    .q-row {
      display: flex; justify-content: space-between; align-items: center; gap: 10px;
      padding: 7px 11px; border-radius: 10px; background: var(--bg); border: 1px solid #E8DEC8; font-size: 12px; font-weight: 700;
    }
    .hidden { display: none !important; }
    .pill { padding: 3px 9px; border-radius: 999px; background: var(--cream); border: 1px solid var(--border); font-size: 11px; font-weight: 800; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card row between">
      <div>
        <h1>HiVocab — Tool Nạp Video YouTube Trực Tiếp (Desktop Local)</h1>
        <p class="sub">Chạy trực tiếp trên IP máy tính của bạn · Tự quét 20 video mới nhất, bóc phụ đề Anh &amp; dịch 100% tiếng Việt · Mặc định Free.</p>
      </div>
      <div id="authBadge" class="badge warn">Đang kiểm tra kết nối...</div>
    </div>

    <div id="authCard" class="card hidden">
      <div class="row between" style="margin-bottom:10px">
        <h2>Bước 1: Kết nối quyền Admin Supabase</h2>
        <span style="font-size:12px;color:var(--muted);font-weight:700">Supabase bật Turnstile CAPTCHA nên Tool dùng Key hoặc Token từ phiên Web Admin</span>
      </div>

      <div style="padding:12px;border-radius:14px;background:var(--bg);border:1.5px solid #E8DEC8;margin-bottom:12px">
        <div style="font-size:13px;font-weight:900;margin-bottom:6px">Cách 1 (Nhanh nhất — làm 1 lần dùng vĩnh viễn): Dùng Service Role Key</div>
        <div class="grid-12">
          <div class="c9">
            <label class="lbl">Supabase → Project Settings → API Keys → service_role (lưu vào .env.local trên máy bạn)</label>
            <input id="serviceKeyInput" type="password" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..." />
          </div>
          <div class="c3">
            <button id="btnSaveKey" class="btn green" style="width:100%">Lưu Key &amp; Kết nối</button>
          </div>
        </div>
      </div>

      <div style="padding:12px;border-radius:14px;background:#EEF5EC;border:1.5px solid var(--green)">
        <div style="font-size:13px;font-weight:900;margin-bottom:4px">Cách 2 (Không cần vào Supabase Dashboard): Dùng phiên Web Admin đang đăng nhập</div>
        <div style="font-size:12px;color:#355A3B;font-weight:700;margin-bottom:8px">
          Mở trang Web Admin trên <strong>hivocab.site</strong> (nơi bạn đã đăng nhập bình thường), rồi bấm nút <strong>&ldquo;Kết nối Tool PC&rdquo;</strong> — Tool PC sẽ tự nhận phiên ngay, hoặc dán Access Token vừa chép vào ô dưới:
        </div>
        <div class="grid-12">
          <div class="c9">
            <input id="tokenInput" type="password" placeholder="Dán Access Token Admin lấy từ nút Kết nối Tool PC trên web..." />
          </div>
          <div class="c3">
            <button id="btnConnectToken" class="btn primary" style="width:100%">Kết nối bằng Token</button>
          </div>
        </div>
      </div>
      <div id="authMsg" style="margin-top:8px;font-size:12px;font-weight:800;color:var(--danger)"></div>
    </div>

    <div class="tabs">
      <button class="btn tab-btn active" data-tab="channel">1. Quét từ Link Kênh YouTube</button>
      <button class="btn tab-btn" data-tab="urls">2. Dán Danh Sách Link YouTube</button>
      <button class="btn tab-btn" data-tab="catalog">3. Kho Video Hệ Thống (<span id="catalogCount">0</span>)</button>
    </div>

    <!-- TAB 1: CHANNEL -->
    <div id="tab-channel" class="card grid">
      <form id="channelForm" class="grid-12">
        <div class="c7">
          <label class="lbl">Link Kênh YouTube (@handle, /channel/UC..., /c/...)</label>
          <input id="chUrl" type="text" placeholder="https://www.youtube.com/@TEDEd" />
        </div>
        <div class="c2">
          <label class="lbl">Số video mới</label>
          <select id="chLimit"><option value="10">10 video</option><option value="20" selected>20 video</option><option value="30">30 video</option></select>
        </div>
        <div class="c3">
          <button id="btnScanChannel" type="submit" class="btn green" style="width:100%">Quét video mới nhất</button>
        </div>
      </form>

      <div id="channelScannedBox" class="grid hidden" style="padding-top:10px;border-top:1.5px solid #E8DEC8">
        <div class="grid-12">
          <div class="c8"><label class="lbl">Tên Kênh hiển thị (Mục Kênh)</label><input id="chNameOverride" type="text" /></div>
          <div class="c4 row">
            <button id="btnSelectNew" type="button" class="btn soft">Chọn video mới</button>
            <button id="btnSelectNone" type="button" class="btn soft">Bỏ chọn hết</button>
          </div>
        </div>
        <div id="channelList" class="list-box"></div>
        <div class="row between">
          <span id="chSelectedSummary" style="font-size:12px;font-weight:800;color:var(--muted)"></span>
          <div class="row">
            <button id="btnLoadMoreChannel" type="button" class="btn soft hidden">+ Quét thêm video kênh này</button>
            <label class="row" style="font-size:12px;font-weight:700;cursor:pointer">
              <input id="chOverwrite" type="checkbox" style="width:16px;height:16px" /> Ghi đè video đã có
            </label>
            <button id="btnImportChannel" type="button" class="btn primary">Bắt đầu Nạp</button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: BATCH URLS -->
    <div id="tab-urls" class="card grid hidden">
      <div>
        <label class="lbl">Dán nhiều link YouTube (mỗi dòng 1 link hoặc cách nhau bằng dấu phẩy)</label>
        <textarea id="batchUrlsInput" placeholder="https://www.youtube.com/watch?v=...&#10;https://youtu.be/..."></textarea>
      </div>
      <div class="grid-12">
        <div class="c9"><label class="lbl">Tên Kênh phân loại (bỏ trống sẽ tự lấy theo YouTube)</label><input id="batchChannelName" type="text" placeholder="Friends, TED-Ed, BBC Learning English..." /></div>
        <div class="c3"><button id="btnImportUrls" type="button" class="btn primary" style="width:100%">Nạp <span id="batchCount">0</span> link</button></div>
      </div>
    </div>

    <!-- QUEUE PROGRESS -->
    <div id="queueBox" class="card grid hidden">
      <div class="row between">
        <strong id="queueSummary" style="font-size:13px">Tiến độ: 0/0</strong>
        <button id="btnRetryFailed" type="button" class="btn soft hidden">Thử lại video lỗi</button>
      </div>
      <div class="progress-bar"><div id="queueProgressFill" class="progress-fill"></div></div>
      <div id="queueList" class="list-box" style="max-height:240px"></div>
    </div>

    <!-- TAB 3: CATALOG -->
    <div id="tab-catalog" class="card grid hidden">
      <div class="row between">
        <h2>Danh sách Video trên Supabase (studio_videos)</h2>
        <div class="row">
          <select id="catFilterChannel" style="width:auto"></select>
          <input id="catSearch" type="text" placeholder="Tìm tiêu đề..." style="width:170px" />
          <button id="btnReloadCatalog" type="button" class="btn soft">Tải lại</button>
        </div>
      </div>
      <div id="catalogList" class="list-box" style="max-height:460px"></div>
    </div>
  </div>

  <script>
    const $ = (id) => document.getElementById(id);
    let scannedVideos = [];
    let selectedIds = new Set();
    let nextChannelCursor = null;
    let scannedChannelUrl = '';
    let isLoadingMore = false;
    let queueJobs = [];
    let isImporting = false;
    let allVideos = [];

    async function api(url, method = 'GET', body = null) {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || 'HTTP ' + res.status);
      }
      return data;
    }

    function escapeHtml(s) {
      return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    async function refreshStatus() {
      const st = await api('/api/status');
      const badge = $('authBadge');
      if (st.authReady) {
        badge.className = 'badge';
        badge.textContent = st.authMode === 'service_role' ? 'Đã kết nối Supabase (Service Key)' : 'Đã đăng nhập Admin: ' + st.adminEmail;
        $('authCard').classList.add('hidden');
      } else {
        badge.className = 'badge warn';
        badge.textContent = 'Chưa cấp quyền Supabase (xem khung bên dưới)';
        $('authCard').classList.remove('hidden');
      }
      return st.authReady;
    }

    $('btnSaveKey').onclick = async () => {
      $('authMsg').textContent = '';
      try {
        await api('/api/save-service-key', 'POST', { service_role_key: $('serviceKeyInput').value.trim() });
        $('serviceKeyInput').value = '';
        await refreshStatus();
      } catch (e) {
        $('authMsg').textContent = e.message;
      }
    };

    $('btnConnectToken').onclick = async () => {
      $('authMsg').textContent = '';
      try {
        await api('/api/connect-token', 'POST', { access_token: $('tokenInput').value.trim() });
        $('tokenInput').value = '';
        await refreshStatus();
      } catch (e) {
        $('authMsg').textContent = e.message;
      }
    };

    setInterval(async () => {
      try {
        if (!$('authCard').classList.contains('hidden')) {
          await refreshStatus();
        }
      } catch {}
    }, 3000);

    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        ['channel', 'urls', 'catalog'].forEach((t) => $('tab-' + t).classList.toggle('hidden', t !== btn.dataset.tab));
        if (btn.dataset.tab === 'catalog') loadCatalog();
      };
    });

    function renderScannedList() {
      const listEl = $('channelList');
      listEl.innerHTML = scannedVideos.map((v) => {
        const chk = selectedIds.has(v.youtube_video_id);
        return '<label class="vid-item ' + (chk ? 'checked' : '') + '">' +
          '<input type="checkbox" data-vid="' + escapeHtml(v.youtube_video_id) + '" ' + (chk ? 'checked' : '') + ' />' +
          '<img src="https://i.ytimg.com/vi/' + encodeURIComponent(v.youtube_video_id) + '/mqdefault.jpg" />' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escapeHtml(v.title || v.youtube_video_id) + '</div>' +
            '<div style="font-size:11px;color:var(--muted);font-weight:700">ID: ' + escapeHtml(v.youtube_video_id) + (v.duration_text ? ' · ' + escapeHtml(v.duration_text) : '') + (v.published_text ? ' · ' + escapeHtml(v.published_text) : '') + '</div>' +
          '</div>' +
          (v.already_imported ? '<span class="pill">Đã có trong kho</span>' : '') +
        '</label>';
      }).join('');
      listEl.querySelectorAll('input[type="checkbox"]').forEach((inp) => {
        inp.onchange = () => {
          const id = inp.dataset.vid;
          if (inp.checked) selectedIds.add(id); else selectedIds.delete(id);
          renderScannedList();
        };
      });
      $('chSelectedSummary').textContent = 'Đã chọn ' + selectedIds.size + ' / ' + scannedVideos.length + ' video';
      $('btnImportChannel').disabled = isImporting || selectedIds.size === 0;
      const moreBtn = $('btnLoadMoreChannel');
      moreBtn.classList.toggle('hidden', !nextChannelCursor);
      moreBtn.disabled = isImporting || isLoadingMore;
    }

    $('channelForm').onsubmit = async (e) => {
      e.preventDefault();
      const url = $('chUrl').value.trim();
      if (!url) return alert('Hãy nhập link kênh YouTube.');
      $('btnScanChannel').disabled = true;
      $('btnScanChannel').textContent = 'Đang quét kênh...';
      nextChannelCursor = null;
      scannedChannelUrl = url;
      try {
        const res = await api('/api/resolve-channel', 'POST', { channel_url: url, limit: Number($('chLimit').value) });
        scannedVideos = res.videos || [];
        nextChannelCursor = res.next_cursor || null;
        $('chNameOverride').value = res.channel_name || '';
        selectedIds = new Set(scannedVideos.filter((v) => !v.already_imported).map((v) => v.youtube_video_id));
        $('channelScannedBox').classList.remove('hidden');
        renderScannedList();
      } catch (err) {
        alert(err.message);
      } finally {
        $('btnScanChannel').disabled = false;
        $('btnScanChannel').textContent = 'Quét video mới nhất';
      }
    };

    $('btnLoadMoreChannel').onclick = async () => {
      if (!nextChannelCursor || isLoadingMore) return;
      isLoadingMore = true;
      const btn = $('btnLoadMoreChannel');
      btn.textContent = 'Đang quét thêm...';
      renderScannedList();
      try {
        const res = await api('/api/resolve-channel', 'POST', {
          channel_url: scannedChannelUrl,
          limit: Number($('chLimit').value),
          cursor: nextChannelCursor,
        });
        const existingSet = new Set(scannedVideos.map((v) => v.youtube_video_id));
        const added = (res.videos || []).filter((v) => !existingSet.has(v.youtube_video_id));
        scannedVideos = scannedVideos.concat(added);
        for (const v of added) {
          if (!v.already_imported) selectedIds.add(v.youtube_video_id);
        }
        nextChannelCursor = res.next_cursor || null;
        renderScannedList();
        const listEl = $('channelList');
        listEl.scrollTop = listEl.scrollHeight;
      } catch (err) {
        alert(err.message);
      } finally {
        isLoadingMore = false;
        btn.textContent = '+ Quét thêm video kênh này';
        renderScannedList();
      }
    };

    $('btnSelectNew').onclick = () => {
      selectedIds = new Set(scannedVideos.filter((v) => !v.already_imported).map((v) => v.youtube_video_id));
      renderScannedList();
    };
    $('btnSelectNone').onclick = () => {
      selectedIds = new Set();
      renderScannedList();
    };

    function parseUrls(raw) {
      const tokens = String(raw || '').split(/[\\n,\\s]+/).map((s) => s.trim()).filter(Boolean);
      const seen = new Set();
      const out = [];
      for (const t of tokens) {
        let vid = '';
        if (/^[A-Za-z0-9_-]{11}$/.test(t)) vid = t;
        else {
          const m = t.match(/(?:v=|youtu\\.be\\/|\\/shorts\\/|\\/embed\\/|\\/live\\/)([A-Za-z0-9_-]{11})/);
          if (m) vid = m[1];
        }
        if (vid && !seen.has(vid)) { seen.add(vid); out.push({ youtube_video_id: vid, url: 'https://www.youtube.com/watch?v=' + vid }); }
      }
      return out;
    }

    $('batchUrlsInput').oninput = () => {
      const n = parseUrls($('batchUrlsInput').value).length;
      $('batchCount').textContent = n;
    };

    function renderQueue() {
      $('queueBox').classList.remove('hidden');
      const done = queueJobs.filter((j) => j.status === 'done' || j.status === 'skipped').length;
      const err = queueJobs.filter((j) => j.status === 'error').length;
      const fin = done + err;
      $('queueSummary').textContent = 'Tiến độ: ' + fin + '/' + queueJobs.length + ' (' + done + ' xong' + (err ? ', ' + err + ' lỗi' : '') + ')';
      $('queueProgressFill').style.width = (queueJobs.length ? Math.round((fin / queueJobs.length) * 100) : 0) + '%';
      $('btnRetryFailed').classList.toggle('hidden', isImporting || err === 0);
      $('queueList').innerHTML = queueJobs.map((j) => {
        let badge = '<span style="color:var(--muted)">Đang chờ</span>';
        if (j.status === 'processing') badge = '<span style="color:var(--accent)">Đang lấy sub &amp; dịch...</span>';
        if (j.status === 'done') badge = '<span style="color:var(--green)">OK (' + j.cueCount + ' câu)</span>';
        if (j.status === 'skipped') badge = '<span style="color:var(--muted)">Bỏ qua (đã có)</span>';
        if (j.status === 'error') badge = '<span style="color:var(--danger)">' + escapeHtml(j.error) + '</span>';
        return '<div class="q-row"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(j.title || j.youtube_video_id) + '</span><span style="flex-shrink:0">' + badge + '</span></div>';
      }).join('');
    }

    async function runJobs(jobs) {
      if (!jobs.length || isImporting) return;
      isImporting = true;
      queueJobs = jobs;
      renderScannedList();
      renderQueue();
      for (let i = 0; i < queueJobs.length; i++) {
        queueJobs[i].status = 'processing';
        queueJobs[i].error = '';
        renderQueue();
        try {
          const res = await api('/api/import-single', 'POST', {
            youtube_url: queueJobs[i].url,
            title: queueJobs[i].title,
            channel_name: queueJobs[i].channelName,
            level: queueJobs[i].level,
            overwrite: queueJobs[i].overwrite,
          });
          if (res.skipped) {
            queueJobs[i].status = 'skipped';
          } else {
            queueJobs[i].status = 'done';
            queueJobs[i].title = res.video?.title || queueJobs[i].title;
            queueJobs[i].cueCount = res.video?.cue_count || 0;
          }
        } catch (err) {
          queueJobs[i].status = 'error';
          queueJobs[i].error = err.message;
        }
        renderQueue();
      }
      isImporting = false;
      renderScannedList();
      renderQueue();
      loadCatalog();
    }

    $('btnImportChannel').onclick = () => {
      const chName = $('chNameOverride').value.trim();
      const overwrite = $('chOverwrite').checked;
      const picked = scannedVideos.filter((v) => selectedIds.has(v.youtube_video_id));
      runJobs(picked.map((v) => ({
        youtube_video_id: v.youtube_video_id,
        url: v.url,
        title: v.title || '',
        channelName: chName,
        overwrite,
        status: 'pending',
        cueCount: 0,
      })));
    };

    $('btnImportUrls').onclick = () => {
      const items = parseUrls($('batchUrlsInput').value);
      if (!items.length) return alert('Chưa có link YouTube hợp lệ.');
      runJobs(items.map((it) => ({
        youtube_video_id: it.youtube_video_id,
        url: it.url,
        title: '',
        channelName: $('batchChannelName').value.trim(),
        overwrite: true,
        status: 'pending',
        cueCount: 0,
      })));
    };

    $('btnRetryFailed').onclick = () => {
      const failed = queueJobs.filter((j) => j.status === 'error').map((j) => ({ ...j, status: 'pending', error: '' }));
      runJobs(failed);
    };

    async function loadCatalog() {
      try {
        const res = await api('/api/videos');
        allVideos = res.videos || [];
        $('catalogCount').textContent = allVideos.length;
        const chCounts = new Map();
        allVideos.forEach((v) => {
          const ch = (v.channel_name || v.author || 'YouTube').trim();
          chCounts.set(ch, (chCounts.get(ch) || 0) + 1);
        });
        const sel = $('catFilterChannel');
        const prev = sel.value || 'all';
        sel.innerHTML = '<option value="all">Tất cả kênh (' + allVideos.length + ')</option>' +
          Array.from(chCounts.entries()).map(([n, c]) => '<option value="' + escapeHtml(n) + '">' + escapeHtml(n) + ' (' + c + ')</option>').join('');
        sel.value = prev;
        renderCatalog();
      } catch (err) {
        $('catalogList').innerHTML = '<div style="color:var(--danger);font-weight:700">' + escapeHtml(err.message) + '</div>';
      }
    }

    function renderCatalog() {
      const fc = $('catFilterChannel').value || 'all';
      const q = $('catSearch').value.trim().toLowerCase();
      const filtered = allVideos.filter((v) => {
        const ch = (v.channel_name || v.author || 'YouTube').trim();
        if (fc !== 'all' && ch !== fc) return false;
        if (q && !(v.title + ' ' + v.youtube_video_id + ' ' + ch).toLowerCase().includes(q)) return false;
        return true;
      });
      $('catalogList').innerHTML = filtered.map((v) =>
        '<div class="vid-item" style="cursor:default">' +
          '<img src="https://i.ytimg.com/vi/' + encodeURIComponent(v.youtube_video_id) + '/mqdefault.jpg" />' +
          '<div style="flex:1;min-width:0;display:grid;grid-template-columns:6fr 4fr;gap:6px">' +
            '<input data-edit="title" data-id="' + escapeHtml(v.id) + '" value="' + escapeHtml(v.title) + '" />' +
            '<input data-edit="channel" data-id="' + escapeHtml(v.id) + '" value="' + escapeHtml(v.channel_name || v.author || '') + '" />' +
          '</div>' +
          '<span class="pill">' + (v.cue_count || 0) + ' câu</span>' +
          '<button class="btn soft" onclick="saveRow(\\'' + escapeHtml(v.id) + '\\')">Lưu</button>' +
          '<button class="btn soft" onclick="togglePub(\\'' + escapeHtml(v.id) + '\\',' + (!v.is_published) + ')">' + (v.is_published ? 'Đang hiện' : 'Đang ẩn') + '</button>' +
          '<button class="btn danger" onclick="delRow(\\'' + escapeHtml(v.id) + '\\')">Xóa</button>' +
        '</div>'
      ).join('');
    }

    window.saveRow = async (id) => {
      const t = document.querySelector('input[data-edit="title"][data-id="' + id + '"]').value;
      const c = document.querySelector('input[data-edit="channel"][data-id="' + id + '"]').value;
      try { await api('/api/videos/update', 'POST', { id, title: t, channel_name: c }); await loadCatalog(); }
      catch (e) { alert(e.message); }
    };
    window.togglePub = async (id, nextPub) => {
      try { await api('/api/videos/update', 'POST', { id, is_published: nextPub }); await loadCatalog(); }
      catch (e) { alert(e.message); }
    };
    window.delRow = async (id) => {
      if (!confirm('Xóa video này khỏi kho Shadowing hệ thống?')) return;
      try { await api('/api/videos/delete', 'POST', { id }); await loadCatalog(); }
      catch (e) { alert(e.message); }
    };

    $('catFilterChannel').onchange = renderCatalog;
    $('catSearch').oninput = renderCatalog;
    $('btnReloadCatalog').onclick = loadCatalog;

    refreshStatus();
    loadCatalog();
  </script>
</body>
</html>`;

function openBrowser(url) {
  if (process.env.HIVOCAB_NO_OPEN_BROWSER === '1') return;
  const cmd =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

async function main() {
  await loadEnvFiles();

  const server = http.createServer(async (req, res) => {
    try {
      const urlObj = new URL(req.url || '/', `http://${HOST}:${PORT}`);
      if (req.method === 'OPTIONS' && urlObj.pathname.startsWith('/api/')) {
        const cors = getBridgeCorsHeaders(req);
        if (!Object.keys(cors).length) {
          res.writeHead(403);
          res.end();
          return;
        }
        res.writeHead(204, cors);
        res.end();
        return;
      }
      if (urlObj.pathname === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(HTML_PAGE);
        return;
      }
      if (urlObj.pathname.startsWith('/api/')) {
        await handleApi(req, res, urlObj);
        return;
      }
      sendJson(res, 404, { ok: false, error: 'Not found' });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err?.message || 'Internal error' });
    }
  });

  server.listen(PORT, HOST, () => {
    const appUrl = `http://${HOST}:${PORT}`;
    console.log(`\nHiVocab YouTube Importer GUI dang chay tai: ${appUrl}`);
    console.log('Nhan Ctrl+C hoac dong cua so nay khi ban da upload xong.\n');
    openBrowser(appUrl);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
