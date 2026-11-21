// functions/api/tts.js
// Cloudflare Pages Function — High-performance Google TTS Proxy for English Collocations & Words
// Supports Collocations, Phrasal Verbs, and Special Delimiters with Global Edge Caching
import { checkRateLimit, rateLimitResponse } from '../_rateLimit.js';
import { getCorsHeaders } from '../_security.js';

export async function onRequestOptions(context) {
    return new Response(null, { status: 204, headers: getCorsHeaders(context.request, 'GET, HEAD, OPTIONS', 'Content-Type, Range') });
}

export async function onRequestHead(context) {
    return onRequestGet(context);
}

export async function onRequestGet(context) {
    const { request } = context;
    const corsHeaders = getCorsHeaders(request, 'GET, HEAD, OPTIONS', 'Content-Type, Range');
    const rateLimit = await checkRateLimit({ request, env: context.env, ruleName: 'tts' });
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit, corsHeaders);
    const url = new URL(request.url);
    const text = (url.searchParams.get('text') || url.searchParams.get('q') || '').trim();
    const rawLang = (url.searchParams.get('tl') || url.searchParams.get('lang') || 'en').trim();
    const lang = /^[a-z]{2}(-[A-Za-z0-9]{2,4})?$/i.test(rawLang) ? rawLang : 'en';

    if (!text) {
        return new Response('Missing text parameter', { status: 400, headers: corsHeaders });
    }

    // Sanitize and limit length to prevent abuse (300 chars is plenty for collocations/sentences)
    const sanitizedText = text
        .replace(/\.{2,}/g, ' ')
        .replace(/[/_]/g, ' ')
        .replace(/[-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300);

    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(sanitizedText)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
        const upstream = await fetch(googleTtsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'audio/mpeg, audio/*;q=0.9, */*;q=0.8',
            },
            signal: controller.signal,
            cf: {
                cacheTtl: 604800,
                cacheEverything: true
            }
        });

        if (!upstream.ok) {
            return new Response(`TTS Upstream Error: ${upstream.status}`, {
                status: upstream.status,
                headers: corsHeaders
            });
        }

        const contentType = upstream.headers.get('Content-Type') || '';
        if (!/^audio\//i.test(contentType)) {
            return new Response('Invalid TTS upstream content type', {
                status: 502,
                headers: corsHeaders,
            });
        }

        const headers = new Headers(corsHeaders);
        headers.set('Content-Type', contentType);
        headers.set('Cache-Control', 'public, max-age=604800, s-maxage=604800, immutable');

        return new Response(upstream.body, {
            status: 200,
            headers
        });
    } catch (err) {
        const isTimeout = err?.name === 'AbortError';
        console.error('[TTS]', isTimeout ? 'Upstream timeout' : err);
        return new Response(isTimeout ? 'TTS upstream timeout' : 'TTS service unavailable', {
            status: isTimeout ? 504 : 502,
            headers: corsHeaders
        });
    } finally {
        clearTimeout(timeoutId);
    }
}
