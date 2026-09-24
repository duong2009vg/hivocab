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

    const systemPrompt = `You are an elite bilingual lexicographer creating authentic Oxford and Cambridge learner's dictionary entries for Vietnamese learners of English.
You MUST output strictly valid JSON matching this schema:
{
  "word": "${word}",
  "cefr": "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null,
  "pos": "noun" | "verb" | "adjective" | "adverb" | "phrase" | "idiom" | "phrasal verb",
  "phonetics": {
    "uk": "/.../",
    "us": "/.../"
  },
  "senses": [
    {
      "id": 1,
      "grammar": "[ C ]" | "[ U ]" | "[ T ]" | "[ I ]" | "[ C/U ]" | "",
      "definition_en": "clear, simple learner definition in English",
      "definition_vi": "dịch nghĩa tiếng Việt chuẩn xác, súc tích",
      "examples": [
        {
          "en": "Authentic example sentence.",
          "vi": "Bản dịch tiếng Việt."
        }
      ]
    }
  ],
  "collocations": [
    { "phrase": "collocation", "meaning": "nghĩa tiếng Việt" }
  ],
  "word_family": {
    "noun": "...",
    "verb": "...",
    "adjective": "...",
    "adverb": "..."
  },
  "synonyms": ["syn1", "syn2"]
}
Return ONLY raw valid JSON.`;

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
                        { role: 'user', content: `Create an Oxford/Cambridge dictionary entry for: "${word}"` }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.2,
                    max_tokens: 1200
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
                        { role: 'user', content: `Create an Oxford/Cambridge dictionary entry for: "${word}"` }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.2,
                    max_tokens: 1200
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
            cefr: parsedResult.cefr ? String(parsedResult.cefr).toUpperCase() : null,
            pos: parsedResult.pos || 'vocabulary',
            phonetics: {
                uk: parsedResult.phonetics?.uk || '',
                us: parsedResult.phonetics?.us || parsedResult.phonetics?.uk || ''
            },
            senses: Array.isArray(parsedResult.senses) ? parsedResult.senses : [],
            collocations: Array.isArray(parsedResult.collocations) ? parsedResult.collocations : [],
            word_family: parsedResult.word_family || {},
            synonyms: Array.isArray(parsedResult.synonyms) ? parsedResult.synonyms.slice(0, 8) : [],
            updated_at: new Date().toISOString()
        },
        source: providerUsed
    });
}
