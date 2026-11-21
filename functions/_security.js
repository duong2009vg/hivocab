// Shared edge security helpers for Cloudflare Pages Functions.

export const SECURITY_CSP = [
  "default-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self' https://payos.vn https://*.payos.vn",
  "script-src 'self' https://cdn.payos.vn https://static.cloudflareinsights.com https://challenges.cloudflare.com https://www.youtube.com https://s.ytimg.com",
  "style-src 'self' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "style-src-elem 'self' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "style-src-attr 'unsafe-inline'",
  "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
  "img-src 'self' data: blob: https: https://img.vietqr.io https://*.r2.cloudflarestorage.com https://pub-d574cb0773d248b29827bfc428bb1f81.r2.dev https://*.supabase.co https://*.payos.vn",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.dictionaryapi.dev https://payos.vn https://*.payos.vn https://fonts.googleapis.com https://fonts.gstatic.com https://static.cloudflareinsights.com https://challenges.cloudflare.com https://*.modal.run",
  "media-src 'self' data: blob: https:",
  "frame-src 'self' https://accounts.google.com https://payos.vn https://*.payos.vn https://cdn.payos.vn https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com",
].join('; ') + ';';

export function isAllowedOrigin(origin) {
  if (!origin || typeof origin !== 'string') return false;
  return (
    origin === 'https://hivocab.site' ||
    origin === 'https://www.hivocab.site' ||
    /^https:\/\/[a-z0-9-]+\.hivocab\.pages\.dev$/i.test(origin) ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
  );
}

export function getCorsHeaders(
  request,
  methods = 'GET, POST, OPTIONS',
  allowHeaders = 'Content-Type, Authorization'
) {
  const origin = request?.headers?.get('Origin') || '';
  const allowOrigin = isAllowedOrigin(origin) ? origin : 'https://hivocab.site';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': allowHeaders,
    Vary: 'Origin',
  };
}

export function applyHtmlSecurityHeaders(headers, { noStore = false } = {}) {
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  headers.set('Content-Security-Policy', SECURITY_CSP);
  if (noStore) {
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
  } else if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate, no-transform');
  }
}

export function timingSafeEqual(a, b) {
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

export async function requireSupabaseUser(request, env, corsHeaders = {}) {
  const supabaseUrl = String(env?.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const supabaseAnonKey = String(env?.SUPABASE_ANON_KEY || '').trim();
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ ok: false, error: 'Server authentication not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      }),
    };
  }

  const authHeader = request.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : '';
  if (!token || token.length > 4096) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ ok: false, error: 'Vui lòng đăng nhập để sử dụng tính năng này.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      }),
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
      signal: controller.signal,
    });
    if (!userRes.ok) {
      return {
        ok: false,
        response: new Response(JSON.stringify({ ok: false, error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        }),
      };
    }
    const user = await userRes.json().catch(() => null);
    if (!user?.id) {
      return {
        ok: false,
        response: new Response(JSON.stringify({ ok: false, error: 'Không thể xác thực người dùng.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        }),
      };
    }
    return { ok: true, user, token };
  } catch {
    return {
      ok: false,
      response: new Response(JSON.stringify({ ok: false, error: 'Không thể kiểm tra phiên đăng nhập.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      }),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function verifySupabaseUserIfPresent(request, env) {
  const authHeader = request.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : '';
  if (!token) return null;
  const res = await requireSupabaseUser(request, env);
  return res.ok ? res.user : null;
}
