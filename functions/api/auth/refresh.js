// functions/api/auth/refresh.js
// Cloudflare Pages Function — đổi refresh_token lấy access_token mới
import { checkRateLimit, rateLimitResponse } from '../../_rateLimit.js';
import { getCorsHeaders } from '../../_security.js';

const NO_STORE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
};

export async function onRequestOptions(context) {
    return new Response(null, { status: 204, headers: getCorsHeaders(context.request, 'POST, OPTIONS', 'Content-Type') });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const corsHeaders = {
        ...getCorsHeaders(request, 'POST, OPTIONS', 'Content-Type'),
        ...NO_STORE_HEADERS,
    };

    const rateLimit = await checkRateLimit({ request, env, ruleName: 'auth' });
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit, corsHeaders);

    const supabaseUrl = String(env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
    const supabaseAnonKey = String(env.SUPABASE_ANON_KEY || '').trim();

    if (!supabaseUrl || !supabaseAnonKey) {
        return new Response(JSON.stringify({ ok: false, error: 'Supabase not configured' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    let body = {};
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const rawToken = body?.refresh_token;
    const refreshToken = typeof rawToken === 'string' ? rawToken.trim() : '';
    if (!refreshToken || refreshToken.length < 10 || refreshToken.length > 2048 || /\s/.test(refreshToken)) {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid refresh_token' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
        const sbRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseAnonKey,
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
            signal: controller.signal,
        });

        if (!sbRes.ok) {
            return new Response(JSON.stringify({ ok: false, error: 'Refresh token hết hạn hoặc không hợp lệ.' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const data = await sbRes.json();
        if (!data?.access_token) {
            return new Response(JSON.stringify({ ok: false, error: 'Không nhận được access_token mới.' }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            ok: true,
            access_token:  data.access_token,
            refresh_token: data.refresh_token,
            expires_at:    data.expires_at,
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('[Auth refresh]', err);
        return new Response(JSON.stringify({ ok: false, error: 'Không thể làm mới phiên đăng nhập.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } finally {
        clearTimeout(timer);
    }
}
