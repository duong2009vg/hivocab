// functions/api/example.js
// POST /api/example — dùng Groq tạo 1 câu ví dụ tiếng Anh tự nhiên
// Body: { term: "break a leg", isPhrase: true }
// Returns: { ok: true, sentence: "..." }

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const rateLimitMap = new Map();
const CLEANUP_INTERVAL = 60000;
let lastCleanup = Date.now();

function isRateLimited(ip, maxRequests = 25, windowMs = 60000) {
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

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    const clientIp = request.headers.get('cf-connecting-ip') ||
                     request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     'unknown-ip';

    if (isRateLimited(clientIp, 25, 60000)) {
        return new Response(JSON.stringify({ ok: false, error: 'Too many requests. Please wait a minute.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' }
        });
    }

    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ ok: false, error: 'GROQ_API_KEY not configured' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    let body = {};
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const rawTerm = String(body?.term || '').trim();
    const term = rawTerm.slice(0, 80).replace(/[^\w\s\-']/g, '').trim();
    const isPhrase = Boolean(body?.isPhrase);
    if (!term) {
        return new Response(JSON.stringify({ ok: false, error: 'Missing or invalid term' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const label  = isPhrase ? 'phrase' : 'word';
    const prompt = `Write exactly one short, natural English example sentence that clearly uses the ${label} "${term}" in context. Return only the sentence — no quotes, no explanation, nothing else.`;

    try {
        const groqRes = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model:       'groq/compound-mini',
                messages:    [{ role: 'user', content: prompt }],
                max_tokens:  150,
                temperature: 0.5,
            }),
        });

        if (!groqRes.ok) {
            const err = await groqRes.text();
            return new Response(JSON.stringify({ ok: false, error: `Groq error: ${err}` }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const data     = await groqRes.json();
        const msg      = data.choices?.[0]?.message;
        const raw      = (msg?.content || msg?.reasoning || '').trim();
        const sentence = raw.replace(/^["""''`]+|["""''`]+$/g, '').trim();

        return new Response(JSON.stringify({ ok: !!sentence, sentence: sentence || '' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
