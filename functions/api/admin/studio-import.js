// functions/api/admin/studio-import.js
// Admin-only Cloudflare Pages Function: resolve 20 latest videos from a YouTube channel URL & import YouTube videos into public.studio_videos

import { checkRateLimit, rateLimitResponse } from '../../_rateLimit.js';
import { getCorsHeaders, requireSupabaseUser } from '../../_security.js';
import {
  extractYoutubeVideoId,
  extractYoutubeVideoCaptions,
  resolveYoutubeChannelVideos,
  fetchWithTimeout,
} from '../../_lib/studioCaptionExtractor.js';

function jsonResponse(payload, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function getSupabaseRestConfig(env) {
  const supabaseUrl = String(env?.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const supabaseAnonKey = String(env?.SUPABASE_ANON_KEY || '').trim();
  return { supabaseUrl, supabaseAnonKey };
}

async function requireAdminRole(env, userId, token, corsHeaders) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseRestConfig(env);
  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, response: jsonResponse({ ok: false, error: 'Server Supabase configuration missing.' }, 500, corsHeaders) };
  }
  try {
    const res = await fetchWithTimeout(
      `${supabaseUrl}/rest/v1/profiles?select=role&id=eq.${encodeURIComponent(userId)}&limit=1`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${token}`,
        },
      },
      6000
    );
    if (!res.ok) {
      return { ok: false, response: jsonResponse({ ok: false, error: 'Không thể kiểm tra quyền Admin.' }, 403, corsHeaders) };
    }
    const rows = await res.json().catch(() => []);
    const role = Array.isArray(rows) ? rows[0]?.role : '';
    if (role !== 'admin') {
      return {
        ok: false,
        response: jsonResponse({ ok: false, error: 'Chỉ tài khoản Admin mới được dùng tính năng này.' }, 403, corsHeaders),
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, response: jsonResponse({ ok: false, error: 'Lỗi xác thực quyền Admin.' }, 502, corsHeaders) };
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: getCorsHeaders(context.request, 'POST, OPTIONS') });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(request, 'POST, OPTIONS');

  const preRateLimit = await checkRateLimit({ request, env, ruleName: 'public' });
  if (!preRateLimit.allowed) return rateLimitResponse(preRateLimit, corsHeaders);

  const auth = await requireSupabaseUser(request, env, corsHeaders);
  if (!auth.ok) return auth.response;

  const adminCheck = await requireAdminRole(env, auth.user.id, auth.token, corsHeaders);
  if (!adminCheck.ok) return adminCheck.response;

  let body = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'JSON gửi lên không hợp lệ.' }, 400, corsHeaders);
  }

  const action = String(body?.action || 'import_single').trim();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseRestConfig(env);

  // ── ACTION 1: Resolve 20 latest videos from a YouTube channel link ────────
  if (action === 'resolve_channel') {
    const channelUrl = String(body?.channel_url || body?.url || '').trim();
    const limit = Math.min(30, Math.max(1, Number.parseInt(String(body?.limit || 20), 10) || 20));
    try {
      const resolved = await resolveYoutubeChannelVideos(channelUrl, limit);

      // Mark which videos are already imported into studio_videos
      const ytIds = resolved.videos.map((v) => v.youtube_video_id);
      let existingSet = new Set();
      if (ytIds.length > 0 && supabaseUrl && supabaseAnonKey) {
        try {
          const inFilter = `(${ytIds.join(',')})`;
          const existRes = await fetchWithTimeout(
            `${supabaseUrl}/rest/v1/studio_videos?select=youtube_video_id&youtube_video_id=in.${encodeURIComponent(inFilter)}`,
            {
              headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${auth.token}`,
              },
            },
            6000
          );
          if (existRes.ok) {
            const existRows = await existRes.json().catch(() => []);
            if (Array.isArray(existRows)) {
              existingSet = new Set(existRows.map((r) => r?.youtube_video_id).filter(Boolean));
            }
          }
        } catch {
          // Ignore check errors; UI will still work
        }
      }

      return jsonResponse(
        {
          ok: true,
          channel_id: resolved.channel_id,
          channel_name: resolved.channel_name,
          count: resolved.videos.length,
          videos: resolved.videos.map((v) => ({
            ...v,
            already_imported: existingSet.has(v.youtube_video_id),
          })),
        },
        200,
        corsHeaders
      );
    } catch (err) {
      return jsonResponse(
        {
          ok: false,
          error: err?.detail || err?.message || 'Không thể lấy danh sách video từ kênh YouTube.',
        },
        Number(err?.status) || 502,
        corsHeaders
      );
    }
  }

  // ── ACTION 2: Extract & upsert a single YouTube video into studio_videos ──
  if (action === 'import_single') {
    const videoId = extractYoutubeVideoId(body?.youtube_url || body?.url || body?.video_id);
    if (!videoId) {
      return jsonResponse({ ok: false, error: 'Link hoặc ID YouTube không hợp lệ.' }, 400, corsHeaders);
    }

    const customTitle = String(body?.title || '').trim().slice(0, 260);
    const customChannelName = String(body?.channel_name || '').trim().slice(0, 120);
    const level = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(String(body?.level || '').toUpperCase())
      ? String(body.level).toUpperCase()
      : 'B1';
    const customGenre = String(body?.genre || '').trim().slice(0, 120);
    const isPublished = body?.is_published !== false;

    let extracted;
    try {
      extracted = await extractYoutubeVideoCaptions({
        videoId,
        env,
        userTitle: customTitle,
        userAuthor: customChannelName,
        includeVi: true,
        allowDeepL: true,
        translateAll: true,
      });
    } catch (err) {
      return jsonResponse(
        {
          ok: false,
          error: err?.detail || err?.message || 'Không lấy được phụ đề tiếng Anh từ video này.',
        },
        Number(err?.status) || 502,
        corsHeaders
      );
    }

    const channelName = customChannelName || extracted.author || 'YouTube';
    const genre = customGenre || `${channelName} · Shadowing`;

    // Check if youtube_video_id already exists so we preserve its primary id
    let existingId = '';
    try {
      const checkRes = await fetchWithTimeout(
        `${supabaseUrl}/rest/v1/studio_videos?select=id&youtube_video_id=eq.${encodeURIComponent(videoId)}&limit=1`,
        {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${auth.token}`,
          },
        },
        5000
      );
      if (checkRes.ok) {
        const rows = await checkRes.json().catch(() => []);
        if (Array.isArray(rows) && rows[0]?.id) existingId = rows[0].id;
      }
    } catch {}

    const clipId = existingId || `yt-${videoId}`;
    const recordPayload = {
      id: clipId,
      youtube_video_id: videoId,
      title: extracted.title,
      channel_name: channelName,
      author: extracted.author || channelName,
      genre,
      level,
      tags: ['shadowing', 'youtube', level.toLowerCase()],
      start_seconds: extracted.startSeconds,
      end_seconds: extracted.endSeconds,
      cue_count: extracted.cueCount,
      cues: extracted.cues,
      caption_status: extracted.captionSource === 'youtube_caption_track' ? 'youtube_manual' : 'youtube_auto',
      translation_status: extracted.translationStatus,
      is_pro: false, // Default free as requested
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    };

    try {
      const upsertRes = await fetchWithTimeout(
        `${supabaseUrl}/rest/v1/studio_videos`,
        {
          method: 'POST',
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(recordPayload),
        },
        10000
      );
      if (!upsertRes.ok) {
        const errText = await upsertRes.text();
        return jsonResponse({ ok: false, error: `Lỗi lưu DB: ${errText.slice(0, 180)}` }, 500, corsHeaders);
      }
      const savedRows = await upsertRes.json().catch(() => []);
      const saved = Array.isArray(savedRows) ? savedRows[0] : recordPayload;
      return jsonResponse(
        {
          ok: true,
          video: {
            id: saved.id,
            youtube_video_id: saved.youtube_video_id,
            title: saved.title,
            channel_name: saved.channel_name,
            level: saved.level,
            cue_count: saved.cue_count,
            translated_cues: extracted.translatedCuesCount,
            is_pro: saved.is_pro,
            is_published: saved.is_published,
          },
        },
        200,
        corsHeaders
      );
    } catch (err) {
      return jsonResponse({ ok: false, error: err?.message || 'Không thể lưu video vào database.' }, 500, corsHeaders);
    }
  }

  return jsonResponse({ ok: false, error: `Unsupported action: ${action}` }, 400, corsHeaders);
}
