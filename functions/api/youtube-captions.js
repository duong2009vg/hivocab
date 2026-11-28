// functions/api/youtube-captions.js
// Cloudflare Pages Function — YouTube timedtext caption & Vietnamese translation extractor for logged-in users
import { checkRateLimit } from '../_rateLimit.js';
import { getCorsHeaders as getSharedCorsHeaders, requireSupabaseUser } from '../_security.js';
import {
  SERVER_BUSY_MSG,
  fetchWithTimeout,
  extractYoutubeVideoId,
  extractYoutubeVideoCaptions,
} from '../_lib/studioCaptionExtractor.js';

const DEFAULT_USER_YOUTUBE_VIDEO_LIMIT = 5;

function getCorsHeaders(request) {
  return getSharedCorsHeaders(request, 'POST, OPTIONS', 'Content-Type, Authorization');
}

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

async function computeGuestClipId(videoId) {
  const bytes = new TextEncoder().encode(`guest:${videoId}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `guest-${hex.slice(0, 18)}`;
}

function getSupabaseRestConfig(env) {
  const supabaseUrl = String(env?.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const supabaseAnonKey = String(env?.SUPABASE_ANON_KEY || '').trim();
  return { supabaseUrl, supabaseAnonKey };
}

async function fetchConfiguredYoutubeVideoLimit(env) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseRestConfig(env);
  if (!supabaseUrl || !supabaseAnonKey) return DEFAULT_USER_YOUTUBE_VIDEO_LIMIT;
  try {
    const url = `${supabaseUrl}/rest/v1/system_settings?select=value&key=eq.user_youtube_video_limit&limit=1`;
    const res = await fetchWithTimeout(url, { headers: { apikey: supabaseAnonKey } }, 5000);
    if (!res.ok) return DEFAULT_USER_YOUTUBE_VIDEO_LIMIT;
    const rows = await res.json().catch(() => []);
    const raw = Array.isArray(rows) ? String(rows[0]?.value || '').trim() : '';
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed >= 1) {
      return Math.min(100, parsed);
    }
  } catch {
    // Fallback to default limit
  }
  return DEFAULT_USER_YOUTUBE_VIDEO_LIMIT;
}

async function fetchUserEffectiveTier(env, userId, token) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseRestConfig(env);
  if (!supabaseUrl || !supabaseAnonKey || !userId || !token) return 'free';
  try {
    const url = `${supabaseUrl}/rest/v1/profiles?select=role,tier,subscription_plan,subscription_expires_at&id=eq.${encodeURIComponent(userId)}&limit=1`;
    const res = await fetchWithTimeout(
      url,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${token}`,
        },
      },
      6000
    );
    if (!res.ok) return 'free';
    const rows = await res.json().catch(() => []);
    const p = Array.isArray(rows) ? rows[0] : null;
    if (!p) return 'free';
    if (p.role === 'admin') return 'premium';
    const rawTier = String(p.tier || '').toLowerCase();
    const plan = String(p.subscription_plan || '').toLowerCase();
    if (rawTier === 'lifetime' || plan === 'lifetime' || plan === 'pro_lifetime') return 'lifetime';
    if (p.subscription_expires_at && new Date(p.subscription_expires_at) <= new Date()) return 'free';
    if (rawTier === 'premium' || plan.startsWith('premium')) return 'premium';
    if (rawTier === 'pro' || plan.startsWith('pro')) return 'pro';
    return 'free';
  } catch {
    return 'free';
  }
}

async function fetchUserSavedVideoIds(env, userId, token) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseRestConfig(env);
  if (!supabaseUrl || !supabaseAnonKey || !userId || !token) {
    throw new Error('Server Supabase configuration missing.');
  }
  const url = `${supabaseUrl}/rest/v1/user_youtube_videos?select=youtube_video_id&user_id=eq.${encodeURIComponent(userId)}`;
  const res = await fetchWithTimeout(
    url,
    {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
    },
    8000
  );
  if (!res.ok) {
    throw new Error(`Không thể kiểm tra danh sách video tài khoản (HTTP ${res.status}).`);
  }
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows.map((r) => r?.youtube_video_id).filter(Boolean) : [];
}

async function upsertUserYoutubeVideo(
  env,
  userId,
  token,
  { clipId, videoId, title, author, clipData, alreadySaved, videoLimit = DEFAULT_USER_YOUTUBE_VIDEO_LIMIT }
) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseRestConfig(env);
  const restBase = `${supabaseUrl}/rest/v1/user_youtube_videos`;
  const headers = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };

  if (alreadySaved) {
    const patchUrl = `${restBase}?user_id=eq.${encodeURIComponent(userId)}&youtube_video_id=eq.${encodeURIComponent(videoId)}`;
    const patchRes = await fetchWithTimeout(
      patchUrl,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          clip_id: clipId,
          title,
          author,
          clip_data: clipData,
          updated_at: new Date().toISOString(),
        }),
      },
      8000
    );
    if (!patchRes.ok) {
      const errBody = await patchRes.json().catch(() => ({}));
      throw { status: 500, detail: errBody?.message || 'Không thể cập nhật video vào tài khoản.' };
    }
    return;
  }

  const postRes = await fetchWithTimeout(
    restBase,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: userId,
        clip_id: clipId,
        youtube_video_id: videoId,
        title,
        author,
        clip_data: clipData,
      }),
    },
    8000
  );
  if (!postRes.ok) {
    const errBody = await postRes.json().catch(() => ({}));
    const msg = String(errBody?.message || '');
    if (errBody?.code === '23505') {
      return upsertUserYoutubeVideo(env, userId, token, {
        clipId,
        videoId,
        title,
        author,
        clipData,
        alreadySaved: true,
        videoLimit,
      });
    }
    if (msg.includes('tối đa') || errBody?.code === 'P0001') {
      throw {
        status: 403,
        code: 'VIDEO_QUOTA_EXCEEDED',
        detail: `Mỗi tài khoản chỉ được lưu tối đa ${videoLimit} video YouTube cá nhân. Hãy xóa bớt video cũ để thêm video mới.`,
      };
    }
    throw { status: 500, detail: msg || 'Không thể lưu video vào tài khoản.' };
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: getCorsHeaders(context.request) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(request);

  const preRateLimit = await checkRateLimit({ request, env, ruleName: 'public' });
  if (!preRateLimit.allowed) {
    return jsonResponse(
      { ok: false, detail: SERVER_BUSY_MSG, error: SERVER_BUSY_MSG },
      preRateLimit.unavailable ? 503 : 429,
      { ...corsHeaders, 'Retry-After': String(preRateLimit.retryAfter || 60) }
    );
  }

  const auth = await requireSupabaseUser(request, env, corsHeaders);
  if (!auth.ok) return auth.response;

  const rateLimit = await checkRateLimit({ request, env, ruleName: 'public', subject: auth.user.id });
  if (!rateLimit.allowed) {
    return jsonResponse(
      { ok: false, detail: SERVER_BUSY_MSG, error: SERVER_BUSY_MSG },
      rateLimit.unavailable ? 503 : 429,
      { ...corsHeaders, 'Retry-After': String(rateLimit.retryAfter || 60) }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ detail: 'JSON gửi lên không hợp lệ.' }, 400, corsHeaders);
  }

  const videoId = extractYoutubeVideoId(body?.youtube_url || body?.url || body?.video_id);
  if (!videoId) {
    return jsonResponse(
      { detail: 'Link hoặc ID YouTube không hợp lệ (ví dụ: https://www.youtube.com/watch?v=...).' },
      400,
      corsHeaders
    );
  }

  let savedVideoIds = [];
  let videoLimit = DEFAULT_USER_YOUTUBE_VIDEO_LIMIT;
  let userTier = 'free';
  try {
    [savedVideoIds, videoLimit, userTier] = await Promise.all([
      fetchUserSavedVideoIds(env, auth.user.id, auth.token),
      fetchConfiguredYoutubeVideoLimit(env),
      fetchUserEffectiveTier(env, auth.user.id, auth.token),
    ]);
  } catch (err) {
    return jsonResponse(
      { detail: err?.message || 'Không thể kiểm tra giới hạn video của tài khoản.' },
      500,
      corsHeaders
    );
  }

  const isUnlimitedYoutube = userTier === 'premium' || userTier === 'lifetime';
  const alreadySaved = savedVideoIds.includes(videoId);
  if (!isUnlimitedYoutube && !alreadySaved && savedVideoIds.length >= videoLimit) {
    return jsonResponse(
      {
        ok: false,
        code: 'VIDEO_QUOTA_EXCEEDED',
        tier: userTier,
        limit: videoLimit,
        used: savedVideoIds.length,
        detail: `Gói ${userTier === 'pro' ? 'Pro' : 'Miễn phí'} chỉ được lưu tối đa ${videoLimit} video YouTube cá nhân (${savedVideoIds.length}/${videoLimit}). Hãy xóa bớt video cũ hoặc nâng cấp HiVocab Premium để tải lên không giới hạn!`,
      },
      403,
      corsHeaders
    );
  }

  const includeVi = body?.include_vi !== false;
  const userTitle = String(body?.title || '').trim().slice(0, 160);
  const userAuthor = String(body?.author || '').trim().slice(0, 80);

  let extracted;
  try {
    extracted = await extractYoutubeVideoCaptions({
      videoId,
      env,
      userTitle,
      userAuthor,
      includeVi,
      allowDeepL: true,
      translateAll: false,
    });
  } catch (err) {
    const status = Number(err?.status) || 502;
    const detail = typeof err?.detail === 'string' ? err.detail : 'Không thể lấy dữ liệu phụ đề từ YouTube.';
    return jsonResponse({ detail }, status, corsHeaders);
  }

  const clipId = await computeGuestClipId(videoId);
  const clipMeta = {
    id: clipId,
    title: extracted.title,
    origin: 'YouTube',
    author: extracted.author,
    channel_name: extracted.author,
    provider: 'youtube',
    youtube_video_id: videoId,
    level: 'Custom',
    content_kind: 'education',
    genre: 'Video cá nhân',
    tags: ['personal'],
    start_seconds: extracted.startSeconds,
    end_seconds: extracted.endSeconds,
    personal: true,
    guest: true,
    caption_status: 'youtube_english_unreviewed',
    caption_source: extracted.captionSource,
    translation_status: extracted.translationStatus,
    truncated_at_limit: extracted.truncatedAtLimit,
  };

  try {
    await upsertUserYoutubeVideo(env, auth.user.id, auth.token, {
      clipId,
      videoId,
      title: extracted.title,
      author: extracted.author,
      clipData: { ...clipMeta, cues: extracted.cues },
      alreadySaved,
      videoLimit,
    });
  } catch (err) {
    return jsonResponse(
      {
        ok: false,
        code: err?.code || 'SAVE_FAILED',
        limit: videoLimit,
        used: savedVideoIds.length,
        detail: err?.detail || 'Không thể lưu video vào tài khoản.',
      },
      Number(err?.status) || 500,
      corsHeaders
    );
  }

  const nextUsedCount = alreadySaved
    ? savedVideoIds.length
    : (isUnlimitedYoutube ? savedVideoIds.length + 1 : Math.min(videoLimit, savedVideoIds.length + 1));

  return jsonResponse(
    {
      scope: 'user_account',
      storage: 'supabase_user_youtube_videos',
      quota: {
        used: nextUsedCount,
        limit: isUnlimitedYoutube ? null : videoLimit,
        unlimited: isUnlimitedYoutube,
      },
      clip: clipMeta,
      cues_doc: {
        schema: 'peakfour.shadowing.cues.v1',
        clip_id: clipId,
        language: 'en',
        timing: 'youtube_caption_timing_unreviewed',
        cues: extracted.cues,
      },
      cue_count: extracted.cueCount,
      translated_cues: extracted.translatedCuesCount,
      truncated_at_limit: extracted.truncatedAtLimit,
    },
    200,
    corsHeaders
  );
}
