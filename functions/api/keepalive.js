// functions/api/keepalive.js
// Cloudflare Pages Function — keepalive ping Supabase RPC
import { checkRateLimit, rateLimitResponse } from '../_rateLimit.js';
import { timingSafeEqual } from '../_security.js';

async function handleKeepalive(context) {
    const { request, env } = context;

    const rateLimit = await checkRateLimit({ request, env, ruleName: 'keepalive' });
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

    const cronSecret = String(env.CRON_SECRET || '').trim();
    if (!cronSecret) {
        return new Response(JSON.stringify({ ok: false, error: 'Server misconfiguration' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });
    }

    const auth = request.headers.get('authorization') || '';
    if (!timingSafeEqual(auth, `Bearer ${cronSecret}`)) {
        return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });
    }

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseAnonKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return new Response(JSON.stringify({
            ok: false,
            error: 'Missing Supabase server configuration',
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/keepalive`, {
            method: 'POST',
            headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
            },
            body: '{}',
            signal: controller.signal,
        });

        if (!response.ok) {
            console.error('[Keepalive] Supabase RPC failed:', response.status);
        }

        return new Response(JSON.stringify({ ok: response.ok, status: response.status }), {
            status: response.ok ? 200 : response.status,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });
    } catch (error) {
        console.error('[Keepalive]', error);
        return new Response(JSON.stringify({ ok: false, error: 'Keepalive failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });
    } finally {
        clearTimeout(timer);
    }
}

export async function onRequestGet(context) {
    return handleKeepalive(context);
}

export async function onRequestPost(context) {
    return handleKeepalive(context);
}
