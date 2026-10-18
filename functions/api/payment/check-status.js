// functions/api/payment/check-status.js
// Cloudflare Pages Function: GET /api/payment/check-status?orderCode=123456
// Kiểm tra trạng thái đơn hàng và gói cước của người dùng
import { checkRateLimit, rateLimitResponse } from '../../_rateLimit.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://hivocab.site',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
    const { request, env } = context;

    const SUPABASE_URL              = String(env.SUPABASE_URL || '').trim();
    const SUPABASE_ANON_KEY         = String(env.SUPABASE_ANON_KEY || '').trim();
    const SUPABASE_SERVICE_ROLE_KEY = String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
        return new Response(JSON.stringify({ ok: false, error: 'Máy chủ chưa được cấu hình đầy đủ cho thanh toán.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const url = new URL(request.url);
    const orderCode = String(url.searchParams.get('orderCode') || '').trim();
    if (!/^\d{1,20}$/.test(orderCode)) {
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

    const rateLimit = await checkRateLimit({
        request,
        env,
        ruleName: 'paymentStatus',
        subject: authUser.id,
    });
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit, corsHeaders);

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
                orderCode,
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
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
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
        console.error('[Payment check-status]', err);
        return new Response(JSON.stringify({ ok: false, error: 'Không thể kiểm tra trạng thái đơn hàng.' }), {
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
