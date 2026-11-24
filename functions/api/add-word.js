// functions/api/add-word.js
// Cloudflare Pages Function — thêm từ vựng vào topic của user
import { checkRateLimit, rateLimitResponse } from '../_rateLimit.js';
import { getCorsHeaders, requireSupabaseUser } from '../_security.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isEnglishExample(value) {
    const text = String(value || '').trim();
    if (!text || !/[a-z]/i.test(text)) return false;
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) return false;
    if (/\b(và|là|của|cho|trong|một|những|các|được|không|với|khi|từ|người|này|đó)\b/i.test(text)) return false;
    return true;
}

export async function onRequestOptions(context) {
    return new Response(null, { status: 204, headers: getCorsHeaders(context.request, 'POST, OPTIONS') });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const corsHeaders = getCorsHeaders(request, 'POST, OPTIONS');

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

    let body = {};
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const {
        topicId,
        word,
        phonetic = '',
        meaning,
        englishMeaning = '',
        english_meaning = '',
        exampleSentence = '',
        passageId,
        passage_id
    } = body || {};
    const cleanTopicId = String(topicId || '').trim();
    const cleanWord = String(word || '').trim().slice(0, 120);
    const cleanMeaning = String(meaning || '').trim().slice(0, 500);
    const cleanEnglishMeaning = String(englishMeaning || english_meaning || '').trim().slice(0, 500);
    const cleanPassageId = String(passageId || passage_id || '').trim();

    if (!UUID_RE.test(cleanTopicId) || !cleanWord || !cleanMeaning) {
        return new Response(JSON.stringify({ ok: false, error: 'Missing or invalid required fields: topicId, word, meaning' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    if (cleanPassageId && !UUID_RE.test(cleanPassageId)) {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid passageId' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const insertPayload = {
            topic_id:         cleanTopicId,
            word:             cleanWord,
            phonetic:         String(phonetic || '').trim().slice(0, 120),
            meaning:          cleanMeaning,
            example_sentence: isEnglishExample(exampleSentence) ? String(exampleSentence).trim().slice(0, 500) : '',
        };
        if (cleanEnglishMeaning) {
            insertPayload.english_meaning = cleanEnglishMeaning;
        }
        if (cleanPassageId) {
            insertPayload.passage_id = cleanPassageId;
        }

        const insertRes = await fetch(`${supabaseUrl}/rest/v1/words`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${auth.token}`,
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
