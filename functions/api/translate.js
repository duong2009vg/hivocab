// functions/api/translate.js
// Cloudflare Pages Function — DeepL translation proxy

const MAX_ITEMS = 24;
const MAX_TEXT_LENGTH = 900;
const DEEPL_URL = 'https://api-free.deepl.com/v2/translate';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function normalizeTexts(body) {
    const value = Array.isArray(body?.texts) ? body.texts : [body?.text];
    return value
        .map(item => String(item || '').trim())
        .filter(Boolean)
        .slice(0, MAX_ITEMS)
        .map(item => item.slice(0, MAX_TEXT_LENGTH));
}

const rateLimitMap = new Map();
const CLEANUP_INTERVAL = 60000;
let lastCleanup = Date.now();

function isRateLimited(ip, maxRequests = 35, windowMs = 60000) {
    const now = Date.now();
    if (now - lastCleanup > CLEANUP_INTERVAL) {
        for (const [key, record] of rateLimitMap.entries()) {
            if (now - record.resetTime > windowMs) rateLimitMap.delete(key);
        }
        lastCleanup = now;
    }

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

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    const clientIp = request.headers.get('cf-connecting-ip') ||
                     request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     'unknown-ip';

    if (isRateLimited(clientIp, 35, 60000)) {
        return new Response(JSON.stringify({ ok: false, error: 'Too many requests. Please wait a minute.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' }
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

    const texts = normalizeTexts(body);
    const sourceLang = String(body?.from || 'en').toUpperCase();
    const targetLang = String(body?.to || 'vi').toUpperCase();

    if (!texts.length) {
        return new Response(JSON.stringify({ ok: false, error: 'Missing text' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const apiKey = env.DEEPL_API_KEY;

    async function fallbackTranslate(items, targetLangCode = 'vi') {
        const results = [];
        for (const item of items) {
            try {
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLangCode)}&dt=t&q=${encodeURIComponent(item)}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    const trans = (data[0] || []).map(seg => seg[0]).join('');
                    results.push(trans || item);
                } else {
                    results.push(item);
                }
            } catch (_) {
                results.push(item);
            }
        }
        return results;
    }

    if (!apiKey) {
        const fallbackResults = await fallbackTranslate(texts, targetLang.toLowerCase());
        return new Response(JSON.stringify({
            ok: true,
            text: fallbackResults[0] || '',
            translations: fallbackResults,
            source: 'fallback'
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const deeplRes = await fetch(DEEPL_URL, {
            method: 'POST',
            headers: {
                'Authorization': `DeepL-Auth-Key ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: texts,
                source_lang: sourceLang,
                target_lang: targetLang,
            }),
        });

        if (!deeplRes.ok) {
            console.warn(`[Translate] DeepL failed with status ${deeplRes.status}, switching to fallback...`);
            const fallbackResults = await fallbackTranslate(texts, targetLang.toLowerCase());
            return new Response(JSON.stringify({
                ok: true,
                text: fallbackResults[0] || '',
                translations: fallbackResults,
                source: 'fallback'
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const data = await deeplRes.json();
        const translated = (data.translations || []).map(t => t.detected_source_language ? t.text : t.text || '');

        return new Response(JSON.stringify({
            ok: true,
            text: translated[0] || '',
            translations: translated,
            source: 'deepl'
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.warn('[Translate] DeepL request exception, falling back:', error);
        const fallbackResults = await fallbackTranslate(texts, targetLang.toLowerCase());
        return new Response(JSON.stringify({
            ok: true,
            text: fallbackResults[0] || '',
            translations: fallbackResults,
            source: 'fallback'
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
