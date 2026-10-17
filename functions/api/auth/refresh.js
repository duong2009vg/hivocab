// functions/api/auth/refresh.js
// Cloudflare Pages Function — đổi refresh_token lấy access_token mới

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const rateLimitMap = new Map();
function isRateLimited(ip, maxRequests = 12, windowMs = 60_000) {
    const now = Date.now();
    const current = rateLimitMap.get(ip);
    if (!current || now - current.startedAt >= windowMs) {
        rateLimitMap.set(ip, { startedAt: now, count: 1 });
        return false;
    }
    current.count += 1;
    return current.count > maxRequests;
}

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    const clientIp = request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        'unknown-ip';
    if (isRateLimited(clientIp)) {
        return new Response(JSON.stringify({ ok: false, error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' }
        });
    }

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseAnonKey = env.SUPABASE_ANON_KEY;

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

    const { refresh_token } = body || {};
    if (!refresh_token || typeof refresh_token !== 'string' || refresh_token.length > 2048) {
        return new Response(JSON.stringify({ ok: false, error: 'Missing refresh_token' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const sbRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseAnonKey,
            },
            body: JSON.stringify({ refresh_token }),
        });

        if (!sbRes.ok) {
            return new Response(JSON.stringify({ ok: false, error: 'Refresh token hết hạn hoặc không hợp lệ.' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const data = await sbRes.json();
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
    }
}
