// functions/api/payment/check-status.js
// Cloudflare Pages Function: GET /api/payment/check-status?orderCode=123456
// Kiểm tra trạng thái đơn hàng và gói cước của người dùng

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
    const { request, env } = context;

    const SUPABASE_URL              = env.SUPABASE_URL || 'https://swehdtrqjyklmsefkjdf.supabase.co';
    const SUPABASE_ANON_KEY         = env.SUPABASE_ANON_KEY;
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

    const url = new URL(request.url);
    const orderCode = url.searchParams.get('orderCode');
    if (!orderCode) {
        return new Response(JSON.stringify({ ok: false, error: 'Thiếu mã đơn hàng orderCode' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?order_code=eq.${orderCode}&select=*`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
            },
        });

        if (!orderRes.ok) {
            return new Response(JSON.stringify({ ok: false, error: 'Không thể truy vấn đơn hàng' }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const orders = await orderRes.json();
        if (!orders || orders.length === 0) {
            return new Response(JSON.stringify({ ok: false, error: 'Không tìm thấy đơn hàng' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
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

        return new Response(JSON.stringify({
            ok: true,
            orderCode: order.order_code,
            status: order.status,
            amount: order.amount,
            planName: order.plan_name,
            paymentTime: order.payment_time,
            userTier: profile?.tier || 'free',
            subscriptionExpiresAt: profile?.subscription_expires_at || null,
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequest(context) {
    const method = context.request.method.toUpperCase();
    if (method === 'OPTIONS') return onRequestOptions(context);
    if (method === 'GET') return onRequestGet(context);
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
