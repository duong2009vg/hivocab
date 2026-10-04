// api/ai-lookup.js
// Vercel Serverless Function: POST /api/ai-lookup
// Tra cứu từ vựng và tự động sinh phiên âm IPA, nghĩa tiếng Việt, câu ví dụ qua DeepSeek AI

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
const CKEY_URL = 'https://api.xah.io/v1/chat/completions';
const CKEY_MODEL = 'deepseek-v4-flash';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

import { setCors } from './_cors.js';

const rateLimitMap = new Map();
const CLEANUP_INTERVAL = 60000;
let lastCleanup = Date.now();

function isRateLimited(ip, maxRequests = 30, windowMs = 60000) {
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

function extractJson(text) {
    if (!text) return null;
    const trimmed = text.trim();
    try {
        return JSON.parse(trimmed);
    } catch (e) {}

    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
        try {
            return JSON.parse(match[0]);
        } catch (e) {}
    }
    return null;
}

export default async function handler(req, res) {
    setCors(req, res, ['POST', 'OPTIONS']);

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    // Rate Limiting
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] ||
                     req.socket?.remoteAddress ||
                     'unknown-ip';

    if (isRateLimited(clientIp, 30, 60000)) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({ ok: false, error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.' });
    }

    const rawWords = req.body?.words;
    const isBatch = Array.isArray(rawWords) && rawWords.length > 0;
    const rawWord = String(req.body?.word || req.body?.term || '').trim();
    const word = rawWord.slice(0, 100).trim();

    if (!isBatch && !word) {
        return res.status(400).json({ ok: false, error: 'Vui lòng cung cấp từ hoặc danh sách từ cần tra cứu.' });
    }

    const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_KEY;
    const ckeyKey = process.env.CKEY_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!deepseekKey && !ckeyKey && !groqKey) {
        return res.status(500).json({ ok: false, error: 'Chưa cấu hình API Key AI (DEEPSEEK_API_KEY hoặc CKEY_API_KEY) trên server.' });
    }

    let prompt = '';
    let wordList = [];
    if (isBatch) {
        wordList = rawWords.slice(0, 20).map(w => String(w).trim().slice(0, 100)).filter(Boolean);
        prompt = `You are an English dictionary assistant.
For each of the following English words: ${JSON.stringify(wordList)}, provide:
1. IPA phonetic transcription (e.g. /.../)
2. Most accurate and common Vietnamese meaning (concise, clear)
3. One natural, short example sentence in English using this word.

Respond ONLY with a valid JSON object with a "results" array:
{
  "results": [
    {
      "word": "word1",
      "phonetic": "/.../",
      "meaning": "nghĩa tiếng Việt",
      "example": "English example"
    }
  ]
}`;
    } else {
        prompt = `You are an English dictionary assistant. 
For the English word or phrase "${word}", provide:
1. IPA phonetic transcription (e.g. /.../)
2. Most accurate and common Vietnamese meaning (short, clear)
3. One natural, short example sentence in English using this word.

Respond ONLY with a valid JSON object in this exact format:
{
  "phonetic": "/.../",
  "meaning": "...",
  "example": "..."
}`;
    }

    // Ưu tiên DeepSeek -> CKEY DeepSeek -> Groq
    const providers = [];
    if (deepseekKey) providers.push({ url: DEEPSEEK_URL, key: deepseekKey, model: DEEPSEEK_MODEL });
    if (ckeyKey) providers.push({ url: CKEY_URL, key: ckeyKey, model: CKEY_MODEL });
    if (groqKey) providers.push({ url: GROQ_URL, key: groqKey, model: GROQ_MODEL });

    let parsed = null;
    let lastError = null;

    for (const p of providers) {
        try {
            const aiRes = await fetch(p.url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${p.key}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: p.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an English dictionary assistant. Respond only with valid JSON.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    response_format: { type: 'json_object' },
                    max_tokens: isBatch ? 1800 : 350,
                    temperature: 0.3,
                }),
            });

            if (aiRes.ok) {
                const data = await aiRes.json();
                const msg = data.choices?.[0]?.message;
                const rawContent = (msg?.content || msg?.reasoning || '').trim();
                parsed = extractJson(rawContent);
                if (parsed) break;
            } else {
                lastError = await aiRes.text();
            }
        } catch (err) {
            lastError = err.message;
        }
    }

    if (!parsed) {
        return res.status(500).json({ ok: false, error: lastError || 'Không thể phân tích dữ liệu JSON từ AI.' });
    }

        if (isBatch) {
            const results = Array.isArray(parsed.results) ? parsed.results : (Array.isArray(parsed) ? parsed : []);
            return res.status(200).json({
                ok: true,
                isBatch: true,
                count: results.length,
                results: results.map(item => ({
                    word: String(item.word || '').trim(),
                    phonetic: String(item.phonetic || '').trim(),
                    meaning: String(item.meaning || '').trim(),
                    example: String(item.example || '').trim()
                }))
            });
        }

        const phonetic = String(parsed.phonetic || '').trim();
        const meaning = String(parsed.meaning || '').trim();
        const example = String(parsed.example || '').trim();

        return res.status(200).json({
            ok: true,
            word,
            phonetic,
            meaning,
            example,
            data: { phonetic, meaning, example }
        });

    } catch (err) {
        return res.status(500).json({ ok: false, error: err.message || 'Lỗi xử lý nội bộ' });
    }
}
