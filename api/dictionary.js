// api/dictionary.js
// Vercel Serverless Function: GET/POST /api/dictionary
// Hỗ trợ môi trường local Vite / Vercel đồng bộ với Cloudflare Pages

import { setCors } from './_cors.js';

const CKEY_URL = 'https://api.xah.io/v1/chat/completions';
const CKEY_MODEL = 'deepseek-v4-flash';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function extractJson(text) {
    if (!text) return null;
    const trimmed = text.trim();
    try {
        return JSON.parse(trimmed);
    } catch (_) {}

    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
        try {
            return JSON.parse(codeBlockMatch[1]);
        } catch (_) {}
    }

    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
        try {
            return JSON.parse(match[0]);
        } catch (_) {}
    }
    return null;
}

export default async function handler(req, res) {
    setCors(req, res, ['GET', 'POST', 'OPTIONS']);

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    const rawWord = req.method === 'GET' ? (req.query.word || req.query.q) : (req.body?.word || req.body?.term);
    const word = String(rawWord || '').trim().slice(0, 100);

    if (!word) {
        return res.status(400).json({ ok: false, error: 'Vui lòng nhập từ cần tra.' });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const ckeyKey = process.env.CKEY_API_KEY;

    if (!groqKey && !ckeyKey) {
        return res.status(500).json({ ok: false, error: 'Chưa cấu hình API Key AI trên server.' });
    }

    const systemPrompt = `You are a concise English-Vietnamese dictionary assistant.
For the requested English word, return strictly raw JSON with this exact schema:
{
  "word": "${word}",
  "phonetic": "/.../",
  "pos": "noun" | "verb" | "adjective" | "adverb" | "phrase" | "idiom",
  "meaning": "nghĩa tiếng Việt ngắn gọn, chuẩn xác",
  "example": "Authentic example sentence in English",
  "example_vi": "Bản dịch tiếng Việt của câu ví dụ"
}
Rules:
1. Provide accurate IPA phonetic notation.
2. Provide concise, natural Vietnamese meaning.
3. Provide 1 authentic example sentence with its natural Vietnamese translation.
4. Output strictly raw JSON only, no markdown, no explanation.`;

    let parsedResult = null;
    let providerUsed = '';

    if (groqKey) {
        try {
            providerUsed = 'groq';
            const groqRes = await fetch(GROQ_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Lookup word: "${word}"` }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.2,
                    max_tokens: 250
                })
            });
            if (groqRes.ok) {
                const groqJson = await groqRes.json();
                parsedResult = extractJson(groqJson?.choices?.[0]?.message?.content);
            }
        } catch (_) {}
    }

    if (!parsedResult && ckeyKey) {
        try {
            providerUsed = 'ckey_deepseek';
            const ckeyRes = await fetch(CKEY_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ckeyKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: CKEY_MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Lookup word: "${word}"` }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.2,
                    max_tokens: 250
                })
            });
            if (ckeyRes.ok) {
                const ckeyJson = await ckeyRes.json();
                parsedResult = extractJson(ckeyJson?.choices?.[0]?.message?.content);
            }
        } catch (_) {}
    }

    if (!parsedResult) {
        return res.status(502).json({ ok: false, error: 'Không thể xử lý từ điển lúc này.' });
    }

    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    return res.status(200).json({
        ok: true,
        data: {
            word: parsedResult.word || word,
            phonetic: parsedResult.phonetic || '',
            pos: parsedResult.pos || 'từ vựng',
            meaning: parsedResult.meaning || '',
            example: parsedResult.example || '',
            example_vi: parsedResult.example_vi || '',
            viSummary: parsedResult.meaning || '',
            updated_at: new Date().toISOString()
        },
        source: providerUsed
    });
}
