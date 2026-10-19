// functions/api/topics.js
// Cloudflare Pages Function — trả về danh sách topics của user
import { checkRateLimit, rateLimitResponse } from '../_rateLimit.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://hivocab.site',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
    const { request, env } = context;

    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
        return new Response(JSON.stringify({ ok: false, error: 'Missing auth token' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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

    try {
        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': supabaseAnonKey,
            },
        });

        if (!userRes.ok) {
            return new Response(JSON.stringify({ ok: false, error: 'Invalid or expired token' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const authenticatedUser = await userRes.json();
        const rateLimit = await checkRateLimit({
            request,
            env,
            ruleName: 'public',
            subject: authenticatedUser?.id || undefined,
        });
        if (!rateLimit.allowed) return rateLimitResponse(rateLimit, corsHeaders);

        const topicsRes = await fetch(
            `${supabaseUrl}/rest/v1/topics?select=id,name,icon,category,created_at&order=created_at.asc`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
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
