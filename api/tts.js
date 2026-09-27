// api/tts.js
// Vercel Serverless Function — High-performance Google TTS Proxy for English Collocations & Words
import { setCors } from './_cors.js';

export default async function handler(req, res) {
    if (setCors(req, res)) return;

    const text = (req.query?.text || req.query?.q || '').trim();
    const lang = (req.query?.tl || req.query?.lang || 'en').trim();

    if (!text) {
        return res.status(400).send('Missing text parameter');
    }

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
            }
        });

        if (!upstream.ok) {
            return res.status(upstream.status).send(`TTS Upstream Error: ${upstream.status}`);
        }

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=604800, immutable');
        const buffer = await upstream.arrayBuffer();
        return res.status(200).send(Buffer.from(buffer));
    } catch (err) {
        return res.status(502).send(`TTS Exception: ${err.message}`);
    }
}
