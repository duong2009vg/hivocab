// api/dictionary.js
// Vercel Serverless Function: GET/POST /api/dictionary
// Hỗ trợ môi trường local Vite / Vercel đồng bộ với Cloudflare Pages

import { setCors } from './_cors.js';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
const CKEY_URL = 'https://api.xah.io/v1/chat/completions';
const CKEY_MODEL = 'deepseek-v4-flash';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function extractJson(text) {
    if (!text) return null;
    let trimmed = String(text).trim();

    // 1. Thử parse trực tiếp
    try {
        return JSON.parse(trimmed);
    } catch (_) {}

    // 2. Trích xuất từ markdown code block ```json ... ``` hoặc ``` ... ```
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
        const candidate = codeBlockMatch[1].trim();
        try {
            return JSON.parse(candidate);
        } catch (_) {
            try {
                return JSON.parse(candidate.replace(/,\s*([\]}])/g, '$1'));
            } catch (_) {}
        }
    }

    // 3. Trích xuất qua cặp dấu ngoặc nhọn đầu tiên và cuối cùng { ... }
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        const jsonSubstring = trimmed.substring(firstBrace, lastBrace + 1);
        try {
            return JSON.parse(jsonSubstring);
        } catch (_) {
            try {
                return JSON.parse(jsonSubstring.replace(/,\s*([\]}])/g, '$1'));
            } catch (_) {}
        }
    }

    return null;
}

async function fetchAI(url, apiKey, model, systemPrompt, userPrompt, timeoutMs = 22000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.2,
                max_tokens: 350
            }),
            signal: controller.signal
        });
        clearTimeout(timer);
        if (!res.ok) {
            console.warn(`[Dictionary] Provider ${model} returned HTTP ${res.status}`);
            return null;
        }
        const json = await res.json();
        const content = json?.choices?.[0]?.message?.content;
        return extractJson(content);
    } catch (e) {
        clearTimeout(timer);
        console.warn(`[Dictionary] Provider ${model} error:`, e.name === 'AbortError' ? 'timeout' : e.message);
        return null;
    }
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

    const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_KEY;
    const ckeyKey = process.env.CKEY_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!deepseekKey && !ckeyKey && !groqKey) {
        return res.status(500).json({ ok: false, error: 'Chưa cấu hình API Key AI trên server.' });
    }

    const systemPrompt = `You are a concise English-Vietnamese dictionary assistant.
For the requested English word, return strictly raw JSON with this exact schema:
{
  "word": "word",
  "phonetic": "/.../",
  "pos": "noun" | "verb" | "adjective" | "adverb" | "phrase" | "idiom",
  "meaning": "nghĩa tiếng Việt ngắn gọn, chuẩn xác",
  "example": "Authentic example sentence in English",
  "example_vi": "Bản dịch tiếng Việt của câu ví dụ"
}
Rules:
1. Provide accurate IPA phonetic notation in "phonetic".
2. Provide concise, natural Vietnamese meaning in "meaning".
3. Provide 1 authentic example sentence in "example" with its natural Vietnamese translation in "example_vi".
4. Output strictly raw JSON only, no markdown, no explanation.`;

    const userPrompt = `Lookup word: "${word}"`;
    let parsedResult = null;
    let providerUsed = '';

    // 1. Thử DeepSeek official
    if (deepseekKey) {
        parsedResult = await fetchAI(DEEPSEEK_URL, deepseekKey, DEEPSEEK_MODEL, systemPrompt, userPrompt, 22000);
        if (parsedResult) providerUsed = 'deepseek_ai';
    }

    // 2. Thử DeepSeek qua CKEY proxy
    if (!parsedResult && ckeyKey) {
        parsedResult = await fetchAI(CKEY_URL, ckeyKey, CKEY_MODEL, systemPrompt, userPrompt, 22000);
        if (parsedResult) providerUsed = 'ckey_deepseek';
    }

    // 3. Fallback sang Groq
    if (!parsedResult && groqKey) {
        parsedResult = await fetchAI(GROQ_URL, groqKey, GROQ_MODEL, systemPrompt, userPrompt, 12000);
        if (parsedResult) providerUsed = 'groq';
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
