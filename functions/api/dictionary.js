// functions/api/dictionary.js
// Cloudflare Pages Function: GET/POST /api/dictionary
// Tra cứu từ điển kết hợp Cloudflare KV & Edge Cache

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

    // Ưu tiên Groq (siêu nhanh ~150-250ms), fallback DeepSeek CKEY
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
                        { role: 'user', content: `Lookup word: "${word}"` }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.2,
                    max_tokens: 250
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

    // Chuẩn hóa dữ liệu kết quả đơn giản: nghĩa tiếng Việt, IPA, ví dụ
    const finalData = {
        word: parsedResult.word || word,
        phonetic: parsedResult.phonetic || '',
        pos: parsedResult.pos || 'từ vựng',
        meaning: parsedResult.meaning || '',
        example: parsedResult.example || '',
        example_vi: parsedResult.example_vi || '',
        viSummary: parsedResult.meaning || '',
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
