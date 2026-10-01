// ============================================================
// GROQ PROXY  |  api/groq.js
// Vercel Serverless Function — forward request đến Groq API
// Bảo vệ API key, thêm CORS cho frontend static.
// ============================================================

// Rate Limiting in-memory cache (per serverless instance)
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

export default async function handler(req, res) {

    // ── CORS ─────────────────────────────────────────────────
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── RATE LIMITING ─────────────────────────────────────────
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] ||
                     req.socket?.remoteAddress ||
                     'unknown-ip';

    if (isRateLimited(clientIp, 20, 60000)) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({
            error: 'Too many requests. Vui lòng thử lại sau 1 phút.'
        });
    }

    // ── PAYLOAD VALIDATION & SANITIZATION ─────────────────────
    const { model, messages, temperature = 0.5, max_tokens = 250 } = req.body || {};

    // Validate Model
    const targetModel = ALLOWED_MODELS.has(model) ? model : 'groq/compound-mini';

    // Validate Messages
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 5) {
        return res.status(400).json({ error: 'Invalid messages array (must contain 1-5 items)' });
    }

    let totalChars = 0;
    const sanitizedMessages = [];
    for (const msg of messages) {
        if (!msg || typeof msg.content !== 'string') {
            return res.status(400).json({ error: 'Invalid message content' });
        }
        totalChars += msg.content.length;
        if (totalChars > 2500) {
            return res.status(400).json({ error: 'Prompt too long (max 2500 characters)' });
        }
        sanitizedMessages.push({
            role: msg.role === 'system' ? 'system' : 'user',
            content: msg.content.slice(0, 2000)
        });
    }

    // Clamped max_tokens (10 - 300)
    const clampedMaxTokens = Math.min(Math.max(Number(max_tokens) || 200, 10), 300);
    const clampedTemp = Math.min(Math.max(Number(temperature) || 0.5, 0.0), 1.0);

    // ── API KEY ───────────────────────────────────────────────
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        return res.status(500).json({
            error: 'Missing GROQ_API_KEY — add it in Vercel → Project → Settings → Environment Variables'
        });
    }

    // ── FORWARD TO GROQ ───────────────────────────────────────
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method:  'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type':  'application/json',
            },
            body: JSON.stringify({
                model: targetModel,
                messages: sanitizedMessages,
                temperature: clampedTemp,
                max_tokens: clampedMaxTokens
            }),
        });

        const data = await response.json();
        return res.status(response.status).json(data);

    } catch (error) {
        console.error('[Groq Proxy] Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
