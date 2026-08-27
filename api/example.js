// api/example.js
// POST /api/example — dùng Groq tạo 1 câu ví dụ tiếng Anh tự nhiên
// Body: { term: "break a leg", isPhrase: true }
// Returns: { ok: true, sentence: "..." }

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ ok: false, error: 'GROQ_API_KEY not configured' });

    const term     = String(req.body?.term || '').trim().slice(0, 100);
    const isPhrase = Boolean(req.body?.isPhrase);
    if (!term) return res.status(400).json({ ok: false, error: 'Missing term' });

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
            return res.status(502).json({ ok: false, error: `Groq error: ${err}` });
        }

        const data     = await groqRes.json();
        const msg      = data.choices?.[0]?.message;
        const raw      = (msg?.content || msg?.reasoning || '').trim();
        const sentence = raw.replace(/^["""''`]+|["""''`]+$/g, '').trim();

        return res.status(200).json({ ok: !!sentence, sentence: sentence || '' });
    } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
    }
}
