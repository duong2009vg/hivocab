// api/auth/refresh.js
// POST /api/auth/refresh — đổi refresh_token lấy access_token mới
// Body: { refresh_token: "..." }

const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return res.status(500).json({ ok: false, error: 'Supabase not configured' });
    }

    const { refresh_token } = req.body || {};
    if (!refresh_token) return res.status(400).json({ ok: false, error: 'Missing refresh_token' });

    try {
        const sbRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ refresh_token }),
        });

        if (!sbRes.ok) {
            return res.status(401).json({ ok: false, error: 'Refresh token hết hạn hoặc không hợp lệ.' });
        }

        const data = await sbRes.json();
        return res.status(200).json({
            ok: true,
            access_token:  data.access_token,
            refresh_token: data.refresh_token,
            expires_at:    data.expires_at,  // Unix timestamp (giây)
        });
    } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
    }
}
