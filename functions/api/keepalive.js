// functions/api/keepalive.js
// Cloudflare Pages Function — keepalive ping Supabase RPC

const rateLimitMap = new Map();
function isRateLimited(ip, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, resetTime: now };
    if (now - record.resetTime > windowMs) {
        record.count = 1;
        record.resetTime = now;
    } else {
        record.count += 1;
    }
    rateLimitMap.set(ip, record);
    return record.count > maxRequests;
}

async function handleKeepalive(context) {
    const { request, env } = context;

    const clientIp = request.headers.get('cf-connecting-ip') ||
                     request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     'unknown-ip';

    if (isRateLimited(clientIp, 10, 60000)) {
        return new Response(JSON.stringify({ ok: false, error: 'Too many requests' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const cronSecret = env.CRON_SECRET;
    if (cronSecret) {
        const auth = request.headers.get('authorization') || '';
        if (auth !== `Bearer ${cronSecret}`) {
            return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseAnonKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return new Response(JSON.stringify({
            ok: false,
            error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY',
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/keepalive`, {
            method: 'POST',
            headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
            },
            body: '{}',
        });

        const text = await response.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = text;
        }

        return new Response(JSON.stringify({ ok: response.ok, status: response.status, data }), {
            status: response.ok ? 200 : response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ ok: false, error: error.message || 'Keepalive failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestGet(context) {
    return handleKeepalive(context);
}

export async function onRequestPost(context) {
    return handleKeepalive(context);
}
