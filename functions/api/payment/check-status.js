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

    const DEFAULT_SUPABASE_URL = 'https://swehdtrqjyklmsefkjdf.supabase.co';
    const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30.dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU';

    const SUPABASE_URL              = env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const SUPABASE_ANON_KEY         = env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

    const url = new URL(request.url);
    const orderCode = url.searchParams.get('orderCode');
    if (!orderCode) {
        return new Response(JSON.stringify({ ok: false, error: 'Thiếu mã đơn hàng orderCode' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 1. Xác thực danh tính người dùng (chống IDOR tra cứu đơn hàng của người khác)
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
        return new Response(JSON.stringify({ ok: false, error: 'Vui lòng cung cấp token xác thực' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
        },
    });

    if (!userRes.ok) {
        return new Response(JSON.stringify({ ok: false, error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const authUser = await userRes.json();
    if (!authUser?.id) {
        return new Response(JSON.stringify({ ok: false, error: 'Không thể xác thực người dùng' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?order_code=eq.${orderCode}&select=*`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
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
            // Đơn hàng đang chờ xử lý hoặc đang trong quá trình đồng bộ
            return new Response(JSON.stringify({
                ok: true,
                orderCode: Number(orderCode),
                status: 'PENDING',
                paid: false,
                message: 'Đang chờ thanh toán...'
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const order = orders[0];

        // 2. Kiểm tra quyền sở hữu đơn hàng (chỉ chủ đơn hàng hoặc admin mới được xem)
        if (order.user_id !== authUser.id) {
            let isAdmin = false;
            try {
                const adminCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${authUser.id}&select=role`, {
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    },
                });
                if (adminCheckRes.ok) {
                    const adminData = await adminCheckRes.json();
                    if (adminData?.[0]?.role === 'admin') isAdmin = true;
                }
            } catch (_) {}

            if (!isAdmin) {
                return new Response(JSON.stringify({ ok: false, error: 'Bạn không có quyền truy cập thông tin đơn hàng này' }), {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

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

        // Tự động kích hoạt (Auto-heal) nếu đơn hàng đã PAID nhưng profile chưa lên PRO
        if (order.status === 'PAID' && profile?.tier !== 'pro') {
            try {
                await fetch(`${SUPABASE_URL}/rest/v1/rpc/activate_pro_order`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        p_order_code: order.order_code,
                        p_payment_time: order.payment_time || new Date().toISOString(),
                        p_webhook_data: { source: 'auto_heal_check_status' },
                    }),
                });

                // Tải lại profile mới nhất sau khi kích hoạt
                const refreshedProfRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${order.user_id}&select=*`, {
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    },
                });
                if (refreshedProfRes.ok) {
                    const refreshedProfiles = await refreshedProfRes.json();
                    if (refreshedProfiles && refreshedProfiles.length > 0) {
                        profile = refreshedProfiles[0];
                    }
                }
            } catch (rpcErr) {
                console.warn('[check-status auto-heal error]', rpcErr);
            }
        }

        return new Response(JSON.stringify({
            ok: true,
            orderCode: order.order_code,
            status: order.status,
            paid: order.status === 'PAID',
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
