// api/payment/check-status.js
// GET /api/payment/check-status?orderCode=123456 — Kiểm tra trạng thái đơn hàng và gói cước

import { setCors } from '../_cors.js';

const SUPABASE_URL              = process.env.SUPABASE_URL || 'https://swehdtrqjyklmsefkjdf.supabase.co';
const SUPABASE_ANON_KEY         = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
    setCors(req, res, ['GET', 'OPTIONS']);
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

    const orderCode = req.query?.orderCode;
    if (!orderCode) {
        return res.status(400).json({ ok: false, error: 'Thiếu mã đơn hàng orderCode' });
    }

    try {
        const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?order_code=eq.${orderCode}&select=*`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
            },
        });

        if (!orderRes.ok) {
            return res.status(502).json({ ok: false, error: 'Không thể truy vấn đơn hàng' });
        }

        const orders = await orderRes.json();
        if (!orders || orders.length === 0) {
            return res.status(404).json({ ok: false, error: 'Không tìm thấy đơn hàng' });
        }

        const order = orders[0];

        // Lấy trạng thái profile của user
        let profile = null;
        try {
            const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${order.user_id}&select=*`, {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
                },
            });
            if (profRes.ok) {
                const profiles = await profRes.json();
                if (profiles && profiles.length > 0) profile = profiles[0];
            }
        } catch (_) {}

        return res.status(200).json({
            ok: true,
            orderCode: order.order_code,
            status: order.status,
            amount: order.amount,
            planName: order.plan_name,
            paymentTime: order.payment_time,
            userTier: profile?.tier || 'free',
            subscriptionExpiresAt: profile?.subscription_expires_at || null,
        });

    } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
    }
}
