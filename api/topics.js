// api/topics.js
// GET /api/topics — trả về danh sách topics của user đang đăng nhập
// Header: Authorization: Bearer <supabase_jwt>

const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
    setCors(res);

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return res.status(401).json({ ok: false, error: 'Missing auth token' });

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return res.status(500).json({ ok: false, error: 'Supabase not configured' });
    }

    try {
        // Lấy user từ token
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': SUPABASE_ANON_KEY,
            },
        });

        if (!userRes.ok) return res.status(401).json({ ok: false, error: 'Invalid or expired token' });
        const { id: userId } = await userRes.json();

        // Gọi Supabase REST để lấy topics
        const topicsRes = await fetch(
            `${SUPABASE_URL}/rest/v1/topics?select=id,name,icon,category,created_at&order=created_at.asc`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!topicsRes.ok) {
            const err = await topicsRes.text();
            return res.status(502).json({ ok: false, error: `Supabase error: ${err}` });
        }

        const topics = await topicsRes.json();

        return res.status(200).json({
            ok: true,
            topics: (topics || []).map(t => ({
                id:       t.id,
                name:     t.name,
                icon:     t.icon || 'folder',
                category: t.category || 'General English',
            })),
        });
    } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
    }
}
