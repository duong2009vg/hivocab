// functions/api/example.js
// POST /api/example — dùng CKEY tạo 1 câu ví dụ tiếng Anh tự nhiên
// Body: { term: "break a leg", isPhrase: true }
// Returns: { ok: true, sentence: "..." }
import { checkRateLimit, rateLimitResponse } from '../_rateLimit.js';

const CKEY_URL = 'https://api.xah.io/v1/chat/completions';
const CKEY_MODEL = 'deepseek-v4-flash';

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://hivocab.site',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    const rateLimit = await checkRateLimit({ request, env, ruleName: 'ai' });
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit, corsHeaders);

    const apiKey = env.CKEY_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ ok: false, error: 'CKEY_API_KEY not configured' }), {
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

    const rawTerm = String(body?.term || '').trim();
    const term = rawTerm.slice(0, 80).replace(/[^\w\s\-']/g, '').trim();
    const isPhrase = Boolean(body?.isPhrase);
    if (!term) {
        return new Response(JSON.stringify({ ok: false, error: 'Missing or invalid term' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const label  = isPhrase ? 'phrase' : 'word';
    const prompt = `Write exactly one short, natural English example sentence that clearly uses the ${label} "${term}" in context. Return only the sentence — no quotes, no explanation, nothing else.`;

    try {
        const ckeyRes = await fetch(CKEY_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model:       CKEY_MODEL,
                messages:    [{ role: 'user', content: prompt }],
                max_tokens:  150,
                temperature: 0.5,
            }),
        });

        if (!ckeyRes.ok) {
            console.warn('[Example] CKEY provider returned HTTP', ckeyRes.status);
            return new Response(JSON.stringify({ ok: false, error: 'Không thể tạo câu ví dụ lúc này.' }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const data     = await ckeyRes.json();
        const msg      = data.choices?.[0]?.message;
        const raw      = (msg?.content || msg?.reasoning || '').trim();
        const sentence = raw.replace(/^["""''`]+|["""''`]+$/g, '').trim();

        return new Response(JSON.stringify({ ok: !!sentence, sentence: sentence || '' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('[Example generation]', err);
        return new Response(JSON.stringify({ ok: false, error: 'Lỗi xử lý nội bộ' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
