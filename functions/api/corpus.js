// functions/api/corpus.js
// Cloudflare Pages Function: GET /api/corpus?name=...
// Protected, rate-limited, per-exercise paginated API replacing unauthenticated public/data/*.json dumps.
import { checkRateLimit, rateLimitResponse } from '../_rateLimit.js';
import { getCorsHeaders, isAllowedOrigin, verifySupabaseUserIfPresent } from '../_security.js';
import chuyenDeExercises from '../_data/hivocab_29_chuyen_de_exercises.js';
import chuyenDeTheories from '../_data/hivocab_29_chuyen_de_ly_thuyet.js';
import chuyenDeQuestions from '../_data/hivocab_29_chuyen_de_questions.js';
import shadowingCatalog from '../_data/studio/shadowing-catalog.js';
import dictationLessons from '../_data/studio/dictation-lessons.js';
import phonemeStudy from '../_data/studio/phoneme-study.js';
import minimalPairs from '../_data/studio/minimal-pairs.js';
import kokoroVoices from '../_data/studio/kokoro-voices.js';

function isValidExerciseId(id) {
  return typeof id === 'string' && /^[a-z0-9_-]{4,64}$/i.test(id);
}

function isSuspiciousCrossOriginOrNonBrowser(request) {
  const origin = request.headers.get('Origin') || '';
  if (origin && !isAllowedOrigin(origin)) return true;
  const fetchSite = (request.headers.get('Sec-Fetch-Site') || '').toLowerCase();
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'same-site' && fetchSite !== 'none') {
    return true;
  }
  return false;
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: getCorsHeaders(context.request, 'GET, OPTIONS') });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(request, 'GET, OPTIONS');

  if (isSuspiciousCrossOriginOrNonBrowser(request)) {
    return new Response(JSON.stringify({ ok: false, error: 'Forbidden origin' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  const user = await verifySupabaseUserIfPresent(request, env);
  const rateLimit = await checkRateLimit({
    request,
    env,
    ruleName: 'corpus',
    subject: user?.id || undefined,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit, corsHeaders);

  const url = new URL(request.url);
  const name = String(url.searchParams.get('name') || '').trim();
  const exerciseId = String(url.searchParams.get('exercise_id') || '').trim();
  const mode = String(url.searchParams.get('mode') || '').trim();

  let payload = null;
  let cacheControl = 'private, max-age=300';

  switch (name) {
    case 'chuyen-de-exercises': {
      payload = chuyenDeExercises;
      break;
    }
    case 'chuyen-de-theory': {
      const theories = Array.isArray(chuyenDeTheories?.theories) ? chuyenDeTheories.theories : [];
      if (mode === 'meta') {
        payload = {
          meta: theories.map((t) => ({
            exercise_id: t.exercise_id,
            questions_count: t.questions_count || 0,
            examples_count: Array.isArray(t.examples) ? t.examples.length : 0,
          })),
        };
      } else {
        if (!isValidExerciseId(exerciseId)) {
          return new Response(JSON.stringify({ ok: false, error: 'Missing valid exercise_id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          });
        }
        const match = theories.find((t) => t.exercise_id === exerciseId) || null;
        payload = { theory: match };
      }
      break;
    }
    case 'chuyen-de-questions': {
      // Never serve all 1,004 questions in a single unpaginated response; scope strictly per exercise_id.
      if (!isValidExerciseId(exerciseId)) {
        return new Response(JSON.stringify({ ok: false, error: 'Missing valid exercise_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      }
      const list = (Array.isArray(chuyenDeQuestions) ? chuyenDeQuestions : [])
        .filter((q) => q.exercise_id === exerciseId)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      payload = { questions: list };
      cacheControl = 'private, no-store';
      break;
    }
    case 'studio-shadowing': {
      payload = shadowingCatalog;
      break;
    }
    case 'studio-shadowing-index': {
      const supabaseUrl = String(env?.SUPABASE_URL || '').trim().replace(/\/+$/, '');
      const supabaseAnonKey = String(env?.SUPABASE_ANON_KEY || '').trim();
      let dbClips = null;
      if (supabaseUrl && supabaseAnonKey) {
        try {
          const selectCols =
            'id,youtube_video_id,title,channel_name,author,genre,level,tags,start_seconds,end_seconds,cue_count,caption_status,translation_status,sort_order,is_pro,created_at';
          const res = await fetch(
            `${supabaseUrl}/rest/v1/studio_videos?select=${selectCols}&is_published=eq.true&order=sort_order.asc,created_at.desc&limit=500`,
            {
              headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
              },
            }
          );
          if (res.ok) {
            const rows = await res.json().catch(() => null);
            if (Array.isArray(rows) && rows.length > 0) {
              dbClips = rows.map((row) => ({
                ...row,
                origin: row.channel_name || row.author || 'YouTube',
                provider: 'youtube',
                cues: [], // Lazy-loaded via ?name=studio-shadowing-cues
              }));
            }
          }
        } catch {
          // Fallback to static catalog below
        }
      }

      if (dbClips && dbClips.length > 0) {
        payload = { version: 2, source: 'supabase', count: dbClips.length, clips: dbClips };
      } else {
        const fallbackClips = (shadowingCatalog?.clips || []).map((c) => ({
          ...c,
          channel_name: c.channel_name || c.genre || 'YouTube',
          cue_count: Array.isArray(c.cues) ? c.cues.length : 0,
          cues: [],
        }));
        payload = { version: 2, source: 'static_fallback', count: fallbackClips.length, clips: fallbackClips };
      }
      break;
    }
    case 'studio-shadowing-cues': {
      const videoId = String(url.searchParams.get('video_id') || '').trim();
      if (!videoId || !/^[a-z0-9_-]{3,128}$/i.test(videoId)) {
        return new Response(JSON.stringify({ ok: false, error: 'Missing valid video_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      }

      const supabaseUrl = String(env?.SUPABASE_URL || '').trim().replace(/\/+$/, '');
      const supabaseAnonKey = String(env?.SUPABASE_ANON_KEY || '').trim();
      let foundClip = null;
      if (supabaseUrl && supabaseAnonKey) {
        try {
          const res = await fetch(
            `${supabaseUrl}/rest/v1/studio_videos?select=id,youtube_video_id,cues,cue_count,start_seconds,end_seconds,is_pro&id=eq.${encodeURIComponent(videoId)}&is_published=eq.true&limit=1`,
            {
              headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
              },
            }
          );
          if (res.ok) {
            const rows = await res.json().catch(() => []);
            if (Array.isArray(rows) && rows[0]) {
              foundClip = rows[0];
            }
          }
        } catch {
          // Fallback to static catalog below
        }
      }

      if (!foundClip) {
        const staticClip = (shadowingCatalog?.clips || []).find((c) => c.id === videoId);
        if (staticClip) {
          foundClip = {
            id: staticClip.id,
            youtube_video_id: staticClip.youtube_video_id,
            cues: Array.isArray(staticClip.cues) ? staticClip.cues : [],
            cue_count: Array.isArray(staticClip.cues) ? staticClip.cues.length : 0,
            start_seconds: staticClip.start_seconds || 0,
            end_seconds: staticClip.end_seconds || 0,
            is_pro: false,
          };
        }
      }

      if (!foundClip) {
        return new Response(JSON.stringify({ ok: false, error: 'Video not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      }

      payload = foundClip;
      break;
    }
    case 'studio-dictation': {
      // Optionally enforce auth for full premium dictation lists later; currently rate-limited per caller
      payload = dictationLessons;
      break;
    }
    case 'studio-phoneme': {
      payload = phonemeStudy;
      break;
    }
    case 'studio-minimal-pairs': {
      payload = minimalPairs;
      break;
    }
    case 'studio-voices': {
      payload = kokoroVoices;
      break;
    }
    default:
      return new Response(JSON.stringify({ ok: false, error: 'Unknown corpus resource' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
  }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
    },
  });
}
