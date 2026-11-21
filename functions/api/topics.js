// functions/api/topics.js
// Cloudflare Pages Function — trả về danh sách topics của user
import { checkRateLimit, rateLimitResponse } from '../_rateLimit.js';
import { getCorsHeaders, requireSupabaseUser } from '../_security.js';

export async function onRequestOptions(context) {
    return new Response(null, { status: 204, headers: getCorsHeaders(context.request, 'GET, OPTIONS') });
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const corsHeaders = getCorsHeaders(request, 'GET, OPTIONS');

    const preRateLimit = await checkRateLimit({ request, env, ruleName: 'public' });
    if (!preRateLimit.allowed) return rateLimitResponse(preRateLimit, corsHeaders);

    const auth = await requireSupabaseUser(request, env, corsHeaders);
    if (!auth.ok) return auth.response;

    const rateLimit = await checkRateLimit({
        request,
        env,
        ruleName: 'public',
        subject: auth.user.id,
    });
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit, corsHeaders);

    const supabaseUrl = String(env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
    const supabaseAnonKey = String(env.SUPABASE_ANON_KEY || '').trim();

    try {
        const topicsRes = await fetch(
            `${supabaseUrl}/rest/v1/topics?select=id,name,icon,category,created_at&order=created_at.asc`,
            {
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
            }
        );

        const noCacheHeaders = {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        };

        if (!topicsRes.ok) {
            console.error('[Topics] Supabase query failed:', topicsRes.status);
            return new Response(JSON.stringify({ ok: false, error: 'Không thể tải danh sách chủ đề.' }), {
                status: 502,
                headers: noCacheHeaders
            });
        }

        const topics = await topicsRes.json();

        return new Response(JSON.stringify({
            ok: true,
            topics: (topics || []).map(t => ({
                id:       t.id,
                name:     t.name,
                icon:     t.icon || 'folder',
                category: t.category || 'General English',
            })),
        }), {
            status: 200,
            headers: noCacheHeaders
        });
    } catch (err) {
        console.error('[Topics]', err);
        return new Response(JSON.stringify({ ok: false, error: 'Lỗi xử lý nội bộ' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
