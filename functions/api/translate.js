// functions/api/translate.js
// Cloudflare Pages Function — DeepL translation proxy
import { checkRateLimit, rateLimitResponse } from '../_rateLimit.js';

const MAX_ITEMS = 24;
const MAX_TEXT_LENGTH = 900;
const DEEPL_URL = 'https://api-free.deepl.com/v2/translate';

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://hivocab.site',
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

async function fetchWithTimeout(input, init = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(input, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    const rateLimit = await checkRateLimit({ request, env, ruleName: 'translate' });
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit, corsHeaders);

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
        return Promise.all(items.map(async (item) => {
            try {
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLangCode)}&dt=t&q=${encodeURIComponent(item)}`;
                const res = await fetchWithTimeout(url, {}, 5000);
                if (res.ok) {
                    const data = await res.json();
                    const trans = (data[0] || []).map(seg => seg[0]).join('');
                    return trans || item;
                }
                return item;
            } catch (_) {
                return item;
            }
        }));
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
        const deeplRes = await fetchWithTimeout(DEEPL_URL, {
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
        }, 12000);

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
