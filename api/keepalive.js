export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const userAgent = req.headers['user-agent'] || '';
    const isVercelCron = userAgent.includes('vercel-cron/1.0');

    const cronSecret = process.env.CRON_SECRET;
    if (!isVercelCron && cronSecret) {
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
