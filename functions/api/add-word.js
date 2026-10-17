// functions/api/add-word.js
// Cloudflare Pages Function — thêm từ vựng vào topic của user
import { checkRateLimit, rateLimitResponse } from '../_rateLimit.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function isEnglishExample(value) {
    const text = String(value || '').trim();
    if (!text || !/[a-z]/i.test(text)) return false;
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) return false;
    if (/\b(và|là|của|cho|trong|một|những|các|được|không|với|khi|từ|người|này|đó)\b/i.test(text)) return false;
    return true;
}

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
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

    let body = {};
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const { topicId, word, phonetic = '', meaning, exampleSentence = '', passageId, passage_id } = body || {};
    if (!topicId || !word || !meaning) {
        return new Response(JSON.stringify({ ok: false, error: 'Missing required fields: topicId, word, meaning' }), {
            status: 400,
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

        const targetPassageId = passageId || passage_id || null;
        const insertPayload = {
            topic_id:         topicId,
            word:             String(word).trim(),
            phonetic:         String(phonetic || '').trim(),
            meaning:          String(meaning).trim(),
            example_sentence: isEnglishExample(exampleSentence) ? String(exampleSentence).trim() : '',
        };
        if (targetPassageId) {
            insertPayload.passage_id = targetPassageId;
        }

        const insertRes = await fetch(`${supabaseUrl}/rest/v1/words`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': supabaseAnonKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify(insertPayload),
        });

        if (!insertRes.ok) {
            console.error('[Add word] Supabase insert failed:', insertRes.status);
            return new Response(JSON.stringify({ ok: false, error: 'Không thể lưu từ vựng lúc này.' }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('[Add word]', err);
        return new Response(JSON.stringify({ ok: false, error: 'Lỗi xử lý nội bộ' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
