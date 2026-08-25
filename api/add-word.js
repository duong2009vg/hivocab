// api/add-word.js
// POST /api/add-word — thêm từ vựng vào topic của user
// Header: Authorization: Bearer <supabase_jwt>
// Body: { topicId, word, phonetic?, meaning, exampleSentence? }

const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function isEnglishExample(value) {
    const text = String(value || '').trim();
    if (!text || !/[a-z]/i.test(text)) return false;
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) return false;
    if (/\b(và|là|của|cho|trong|một|những|các|được|không|với|khi|từ|người|này|đó)\b/i.test(text)) return false;
    return true;
}

export default async function handler(req, res) {
    setCors(res);

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return res.status(401).json({ ok: false, error: 'Missing auth token' });

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return res.status(500).json({ ok: false, error: 'Supabase not configured' });
    }

    const { topicId, word, phonetic = '', meaning, exampleSentence = '' } = req.body || {};
    if (!topicId || !word || !meaning) {
        return res.status(400).json({ ok: false, error: 'Missing required fields: topicId, word, meaning' });
    }

    try {
        // Xác thực token (chỉ cần kiểm tra hợp lệ, RLS trên Supabase tự handle phân quyền)
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': SUPABASE_ANON_KEY,
            },
        });

        if (!userRes.ok) return res.status(401).json({ ok: false, error: 'Invalid or expired token' });

        // Insert từ vào Supabase
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/words`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
                topic_id:         topicId,
                word:             String(word).trim(),
                phonetic:         String(phonetic || '').trim(),
                meaning:          String(meaning).trim(),
                example_sentence: isEnglishExample(exampleSentence) ? String(exampleSentence).trim() : '',
            }),
        });

        if (!insertRes.ok) {
            const err = await insertRes.text();
            return res.status(502).json({ ok: false, error: `Supabase error: ${err}` });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
    }
}
