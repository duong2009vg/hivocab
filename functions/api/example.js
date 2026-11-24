// functions/api/example.js
// POST /api/example — dùng CKEY tạo 1 câu ví dụ tiếng Anh tự nhiên
// Body: { term: "break a leg", isPhrase: true }
// Returns: { ok: true, sentence: "..." }
import { checkRateLimit, rateLimitResponse } from '../_rateLimit.js';
import { getCorsHeaders, requireSupabaseUser } from '../_security.js';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
const CKEY_URL = 'https://api.xah.io/v1/chat/completions';
const CKEY_MODEL = 'deepseek-v4-flash';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export async function onRequestOptions(context) {
    return new Response(null, { status: 204, headers: getCorsHeaders(context.request, 'POST, OPTIONS') });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const corsHeaders = getCorsHeaders(request, 'POST, OPTIONS');

    const preRateLimit = await checkRateLimit({ request, env, ruleName: 'ai' });
    if (!preRateLimit.allowed) return rateLimitResponse(preRateLimit, corsHeaders);

    const auth = await requireSupabaseUser(request, env, corsHeaders);
    if (!auth.ok) return auth.response;

    const rateLimit = await checkRateLimit({ request, env, ruleName: 'ai', subject: auth.user.id });
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit, corsHeaders);

    const deepseekKey = env.DEEPSEEK_API_KEY || env.DEEPSEEK_KEY || (typeof process !== 'undefined' ? (process.env?.DEEPSEEK_API_KEY || process.env?.DEEPSEEK_KEY) : '');
    const ckeyKey = env.CKEY_API_KEY || (typeof process !== 'undefined' ? process.env?.CKEY_API_KEY : '');
    const groqKey = env.GROQ_API_KEY || (typeof process !== 'undefined' ? process.env?.GROQ_API_KEY : '');

    if (!deepseekKey && !ckeyKey && !groqKey) {
        return new Response(JSON.stringify({ ok: false, error: 'AI service not configured' }), {
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

    const label = isPhrase ? 'phrase' : 'word';
    const prompt = `Write exactly one short, natural English example sentence that clearly uses the ${label} "${term}" in context. Return only the sentence — no quotes, no explanation, nothing else.`;

    const providers = [];
    if (deepseekKey) providers.push({ name: 'deepseek', url: DEEPSEEK_URL, key: deepseekKey, model: DEEPSEEK_MODEL });
    if (ckeyKey) providers.push({ name: 'ckey', url: CKEY_URL, key: ckeyKey, model: CKEY_MODEL });
    if (groqKey) providers.push({ name: 'groq', url: GROQ_URL, key: groqKey, model: GROQ_MODEL });

    let sentence = '';
    let sawTimeout = false;

    for (const p of providers) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        try {
            const aiRes = await fetch(p.url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${p.key}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: p.model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 150,
                    temperature: 0.5,
                }),
                signal: controller.signal,
            });

            if (!aiRes.ok) {
                console.warn(`[Example] Provider ${p.name} returned HTTP ${aiRes.status}`);
                continue;
            }

            const data = await aiRes.json();
            const msg = data.choices?.[0]?.message;
            const raw = (msg?.content || msg?.reasoning || '').trim();
            const cleaned = raw.replace(/^["""''`]+|["""''`]+$/g, '').trim();
            if (cleaned) {
                sentence = cleaned;
                break;
            }
        } catch (err) {
            if (err?.name === 'AbortError') sawTimeout = true;
            console.warn(`[Example] Provider ${p.name} error:`, err?.message || err);
        } finally {
            clearTimeout(timeoutId);
        }
    }

    if (sentence) {
        return new Response(JSON.stringify({ ok: true, sentence }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        ok: false,
        error: sawTimeout ? 'Hệ thống AI phản hồi chậm, vui lòng thử lại.' : 'Không thể tạo câu ví dụ lúc này.'
    }), {
        status: sawTimeout ? 504 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
