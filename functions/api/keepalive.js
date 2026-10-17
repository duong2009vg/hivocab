// functions/api/keepalive.js
// Cloudflare Pages Function — keepalive ping Supabase RPC
import { checkRateLimit, rateLimitResponse } from '../_rateLimit.js';

async function handleKeepalive(context) {
    const { request, env } = context;

    const rateLimit = await checkRateLimit({ request, env, ruleName: 'keepalive' });
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

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

        if (!response.ok) {
            console.error('[Keepalive] Supabase RPC failed:', response.status);
        }

        return new Response(JSON.stringify({ ok: response.ok, status: response.status }), {
            status: response.ok ? 200 : response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[Keepalive]', error);
        return new Response(JSON.stringify({ ok: false, error: 'Keepalive failed' }), {
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
