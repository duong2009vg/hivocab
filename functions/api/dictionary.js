// functions/api/dictionary.js
// Cloudflare Pages Function: GET/POST /api/dictionary
// Tra cứu từ điển chuẩn Cambridge / Oxford kết hợp Cloudflare KV & Edge Cache

const CKEY_URL = 'https://api.xah.io/v1/chat/completions';
const CKEY_MODEL = 'deepseek-v4-flash';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const rateLimitMap = new Map();
const CLEANUP_INTERVAL = 60000;
let lastCleanup = Date.now();

function isRateLimited(ip, maxRequests = 45, windowMs = 60000) {
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
    } catch (_) {}

    // Trích xuất JSON từ markdown code block ```json ... ```
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
        try {
            return JSON.parse(codeBlockMatch[1]);
        } catch (_) {}
    }

    // Trích xuất qua bracket { ... }
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
        try {
            return JSON.parse(match[0]);
        } catch (_) {}
    }
    return null;
}

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
    const { request } = context;
    const url = new URL(request.url);
    const word = url.searchParams.get('word') || url.searchParams.get('q');
    return handleDictionaryLookup(context, word);
}

export async function onRequestPost(context) {
    const { request } = context;
    let word = '';
    try {
        const body = await request.json();
        word = body?.word || body?.term || '';
    } catch (_) {}
    return handleDictionaryLookup(context, word);
}

async function handleDictionaryLookup(context, rawWord) {
    const { request, env } = context;

    const clientIp = request.headers.get('cf-connecting-ip') ||
                     request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     'unknown-ip';

    if (isRateLimited(clientIp, 45, 60000)) {
        return new Response(JSON.stringify({ ok: false, error: 'Quá nhiều yêu cầu. Vui lòng chờ 1 phút.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' }
        });
    }

    const word = String(rawWord || '').trim().slice(0, 100);
    if (!word) {
        return new Response(JSON.stringify({ ok: false, error: 'Vui lòng nhập từ hoặc cụm từ cần tra.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const cacheKey = `dict:${word.toLowerCase()}`;

    // ─────────────────────────────────────────────────────────────
    // 1. KIỂM TRA CLOUDFLARE KV (NẾU ĐÃ BIND)
    // ─────────────────────────────────────────────────────────────
    if (env.DICTIONARY_KV) {
        try {
            const kvData = await env.DICTIONARY_KV.get(cacheKey, 'json');
            if (kvData && kvData.word) {
                return new Response(JSON.stringify({ ok: true, data: kvData, source: 'cloudflare_kv' }), {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
                        'X-Cache': 'HIT-KV'
                    }
                });
            }
        } catch (kvErr) {
            console.warn('[Dictionary] Cloudflare KV get error:', kvErr);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. GỌI HIGH-SPEED AI (GROQ hoặc DEEPSEEK CKEY)
    // ─────────────────────────────────────────────────────────────
    const groqKey = env.GROQ_API_KEY || (typeof process !== 'undefined' ? process.env?.GROQ_API_KEY : '');
    const ckeyKey = env.CKEY_API_KEY || (typeof process !== 'undefined' ? process.env?.CKEY_API_KEY : '');

    if (!groqKey && !ckeyKey) {
        return new Response(JSON.stringify({
            ok: false,
            error: 'Chưa cấu hình API Key AI (GROQ_API_KEY hoặc CKEY_API_KEY) trên Cloudflare Pages.'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
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
      "grammar": "[ C ]" | "[ U ]" | "[ T ]" | "[ I ]" | "[ C/U ]" | "[ transitive ]" | "",
      "definition_en": "clear, simple learner definition in English",
      "definition_vi": "dịch nghĩa tiếng Việt chuẩn xác, súc tích",
      "examples": [
        {
          "en": "Authentic example sentence using the word naturally.",
          "vi": "Bản dịch tiếng Việt tự nhiên của câu ví dụ."
        }
      ]
    }
  ],
  "collocations": [
    { "phrase": "common collocation or phrasal verb", "meaning": "nghĩa tiếng Việt" }
  ],
  "word_family": {
    "noun": "...",
    "verb": "...",
    "adjective": "...",
    "adverb": "..."
  },
  "synonyms": ["syn1", "syn2", "syn3"]
}

Rules:
1. Provide accurate CEFR level (A1 to C2).
2. For each sense, definition_en must be learner-friendly (like Oxford 3000 / Cambridge Advanced).
3. definition_vi must be idiomatic Vietnamese.
4. Provide 1 to 2 realistic example sentences per sense with natural Vietnamese translations.
5. Provide 2 to 4 high-frequency collocations or idioms.
6. Provide accurate IPA for both UK and US.
7. Return ONLY valid raw JSON with NO markdown text around it.`;

    let parsedResult = null;
    let providerUsed = '';

    // Ưu tiên Groq (siêu nhanh ~250-350ms), fallback DeepSeek CKEY
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
                const content = groqJson?.choices?.[0]?.message?.content;
                parsedResult = extractJson(content);
            }
        } catch (e) {
            console.warn('[Dictionary] Groq attempt failed:', e);
        }
    }

    // Fallback sang CKEY DeepSeek nếu Groq chưa trả về hoặc chưa cấu hình
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
                const content = ckeyJson?.choices?.[0]?.message?.content;
                parsedResult = extractJson(content);
            }
        } catch (e) {
            console.warn('[Dictionary] CKEY attempt failed:', e);
        }
    }

    if (!parsedResult) {
        return new Response(JSON.stringify({
            ok: false,
            error: 'Không thể xử lý từ điển lúc này. Vui lòng thử lại sau.'
        }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Chuẩn hóa dữ liệu kết quả
    const finalData = {
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
        antonyms: Array.isArray(parsedResult.antonyms) ? parsedResult.antonyms.slice(0, 5) : [],
        updated_at: new Date().toISOString()
    };

    // ─────────────────────────────────────────────────────────────
    // 3. TỰ ĐỘNG LƯU VÀO CLOUDFLARE KV (VĨNH VIỄN / TTL 90 NGÀY)
    // ─────────────────────────────────────────────────────────────
    if (env.DICTIONARY_KV) {
        context.waitUntil((async () => {
            try {
                await env.DICTIONARY_KV.put(cacheKey, JSON.stringify(finalData), {
                    expirationTtl: 7776000 // 90 ngày
                });
            } catch (err) {
                console.warn('[Dictionary] Async KV put error:', err);
            }
        })());
    }

    return new Response(JSON.stringify({
        ok: true,
        data: finalData,
        source: providerUsed
    }), {
        status: 200,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400, s-maxage=604800',
            'X-Cache': 'MISS'
        }
    });
}
