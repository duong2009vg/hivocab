const MAX_ITEMS = 24;
const MAX_TEXT_LENGTH = 900;
const DEEPL_URL = 'https://api-free.deepl.com/v2/translate';

import { setCors } from './_cors.js';

function normalizeTexts(body) {
    const value = Array.isArray(body?.texts) ? body.texts : [body?.text];
    return value
        .map(item => String(item || '').trim())
        .filter(Boolean)
        .slice(0, MAX_ITEMS)
        .map(item => item.slice(0, MAX_TEXT_LENGTH));
}

// Rate Limiting in-memory cache
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

export default async function handler(req, res) {
    setCors(req, res);

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    // Rate Limiting by IP
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] ||
                     req.socket?.remoteAddress ||
                     'unknown-ip';

    if (isRateLimited(clientIp, 35, 60000)) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({ ok: false, error: 'Too many requests. Please wait a minute.' });
    }

    const texts = normalizeTexts(req.body || {});
    const sourceLang = String(req.body?.from || 'en').toUpperCase();
    const targetLang = String(req.body?.to || 'vi').toUpperCase();

    if (!texts.length) {
        return res.status(400).json({ ok: false, error: 'Missing text' });
    }

    const apiKey = process.env.DEEPL_API_KEY;

    async function fallbackTranslate(items, targetLangCode = 'vi') {
        const results = [];
        for (const item of items) {
            try {
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLangCode)}&dt=t&q=${encodeURIComponent(item)}`;
                const fRes = await fetch(url);
                if (fRes.ok) {
                    const data = await fRes.json();
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
        return res.status(200).json({
            ok: true,
            text: fallbackResults[0] || '',
            translations: fallbackResults,
            source: 'fallback'
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
            const fallbackResults = await fallbackTranslate(texts, targetLang.toLowerCase());
            return res.status(200).json({
                ok: true,
                text: fallbackResults[0] || '',
                translations: fallbackResults,
                source: 'fallback'
            });
        }

        const data = await deeplRes.json();
        const translated = (data.translations || []).map(t => t.detected_source_language ? t.text : t.text || '');

        return res.status(200).json({
            ok: true,
            text: translated[0] || '',
            translations: translated,
            source: 'deepl'
        });
    } catch (error) {
        const fallbackResults = await fallbackTranslate(texts, targetLang.toLowerCase());
        return res.status(200).json({
            ok: true,
            text: fallbackResults[0] || '',
            translations: fallbackResults,
            source: 'fallback'
        });
    }
}
