// Rate Limiting in-memory cache
const rateLimitMap = new Map();
function isRateLimited(ip, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
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

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] ||
                     'unknown-ip';

    if (isRateLimited(clientIp, 10, 60000)) {
        return res.status(429).json({ ok: false, error: 'Too many requests' });
    }

    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const auth = req.headers.authorization || '';
        if (auth !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ ok: false, error: 'Unauthorized' });
        }
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({
            ok: false,
            error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY',
        });
    }

    try {
        const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/keepalive`, {
            method: 'POST',
            headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
            },
            body: '{}',
        });

        const text = await response.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = text;
        }

        if (!response.ok) {
            return res.status(response.status).json({ ok: false, status: response.status, data });
        }

        return res.status(200).json({ ok: true, status: response.status, data });
    } catch (error) {
        return res.status(500).json({ ok: false, error: error.message || 'Keepalive failed' });
    }
}
