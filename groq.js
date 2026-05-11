// ============================================================
// GROQ PROXY  |  api/groq.js
// Vercel Serverless Function — forward request đến Groq API
// Bảo vệ API key, thêm CORS cho frontend static.
// ============================================================

export default async function handler(req, res) {

    // ── CORS ─────────────────────────────────────────────────
    // Cho phép domain của app gọi vào proxy này
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight request (browser tự gửi trước POST)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        return res.status(response.status).json(data);

    } catch (error) {
        console.error('[Groq Proxy] Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
