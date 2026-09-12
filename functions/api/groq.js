// ============================================================
// GROQ PROXY  |  functions/api/groq.js
// Cloudflare Pages Function — forward request đến Groq API
// ============================================================

const rateLimitMap = new Map();
const CLEANUP_INTERVAL = 60000;
let lastCleanup = Date.now();

function isRateLimited(ip, maxRequests = 20, windowMs = 60000) {
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

const ALLOWED_MODELS = new Set([
    'groq/compound-mini',
    'openai/gpt-oss-20b',
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'mixtral-8x7b-32768'
]);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    // Rate Limiting by IP
    const clientIp = request.headers.get('cf-connecting-ip') ||
                     request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     'unknown-ip';

    if (isRateLimited(clientIp, 20, 60000)) {
        return new Response(JSON.stringify({
            error: 'Too many requests. Vui lòng thử lại sau 1 phút.'
        }), {
            status: 429,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Retry-After': '60'
            }
        });
    }

    // Payload Validation
    let body = {};
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const { model, messages, temperature = 0.5, max_tokens = 250 } = body || {};

    const targetModel = ALLOWED_MODELS.has(model) ? model : 'groq/compound-mini';

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 5) {
        return new Response(JSON.stringify({ error: 'Invalid messages array (must contain 1-5 items)' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    let totalChars = 0;
    const sanitizedMessages = [];
    for (const msg of messages) {
        if (!msg || typeof msg.content !== 'string') {
            return new Response(JSON.stringify({ error: 'Invalid message content' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        totalChars += msg.content.length;
        if (totalChars > 2500) {
            return new Response(JSON.stringify({ error: 'Prompt too long (max 2500 characters)' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        sanitizedMessages.push({
            role: msg.role === 'system' ? 'system' : 'user',
            content: msg.content.slice(0, 2000)
        });
    }

    const clampedMaxTokens = Math.min(Math.max(Number(max_tokens) || 200, 10), 300);
    const clampedTemp = Math.min(Math.max(Number(temperature) || 0.5, 0.0), 1.0);

    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({
            error: 'Missing GROQ_API_KEY — add it in Cloudflare Pages → Settings → Environment Variables'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: targetModel,
                messages: sanitizedMessages,
                temperature: clampedTemp,
                max_tokens: clampedMaxTokens
            }),
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
