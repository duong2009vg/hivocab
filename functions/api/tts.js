// functions/api/tts.js
// Cloudflare Pages Function — High-performance Google TTS Proxy for English Collocations & Words
// Supports Collocations, Phrasal Verbs, and Special Delimiters with Global Edge Caching

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
};

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestHead(context) {
    return onRequestGet(context);
}

export async function onRequestGet(context) {
    const { request } = context;
    const url = new URL(request.url);
    const text = (url.searchParams.get('text') || url.searchParams.get('q') || '').trim();
    const lang = (url.searchParams.get('tl') || url.searchParams.get('lang') || 'en').trim();

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

    try {
        const upstream = await fetch(googleTtsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'audio/mpeg, audio/*;q=0.9, */*;q=0.8',
            },
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

        const headers = new Headers(corsHeaders);
        headers.set('Content-Type', upstream.headers.get('Content-Type') || 'audio/mpeg');
        headers.set('Cache-Control', 'public, max-age=604800, s-maxage=604800, immutable');

        return new Response(upstream.body, {
            status: 200,
            headers
        });
    } catch (err) {
        return new Response(`TTS Fetch Exception: ${err.message}`, {
            status: 502,
            headers: corsHeaders
        });
    }
}
