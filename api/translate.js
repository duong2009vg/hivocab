const MAX_ITEMS = 24;
const MAX_TEXT_LENGTH = 900;
const DEEPL_URL = 'https://api-free.deepl.com/v2/translate';

function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function normalizeTexts(body) {
    const value = Array.isArray(body?.texts) ? body.texts : [body?.text];
    return value
        .map(item => String(item || '').trim())
        .filter(Boolean)
        .slice(0, MAX_ITEMS)
        .map(item => item.slice(0, MAX_TEXT_LENGTH));
}

export default async function handler(req, res) {
    setCors(res);

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ ok: false, error: 'DEEPL_API_KEY is not configured' });
    }

    const texts = normalizeTexts(req.body || {});
    const sourceLang = String(req.body?.from || 'en').toUpperCase();
    const targetLang = String(req.body?.to || 'vi').toUpperCase();

    if (!texts.length) {
        return res.status(400).json({ ok: false, error: 'Missing text' });
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
            const errText = await deeplRes.text();
            return res.status(502).json({ ok: false, error: `DeepL error ${deeplRes.status}: ${errText}` });
        }

        const data = await deeplRes.json();
        const translated = (data.translations || []).map(t => t.detected_source_language ? t.text : t.text || '');

        return res.status(200).json({
            ok: true,
            text: translated[0] || '',
            translations: translated,
        });
    } catch (error) {
        return res.status(502).json({
            ok: false,
            error: error?.message || 'Translate failed',
        });
    }
}
