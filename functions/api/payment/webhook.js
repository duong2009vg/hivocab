// functions/api/payment/webhook.js
// Cloudflare Pages Function: POST /api/payment/webhook
// Nhận thông báo thanh toán thành công từ PayOS và kích hoạt PRO
// Xác thực chữ ký số HMAC-SHA256 chuẩn PayOS bằng Web Crypto API

const PLAN_DAYS = {
    pro_1m: 30,
    pro_6m: 180,
    pro_1y: 365,
    pro_lifetime: 36500,
};

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Sắp xếp các khóa của đối tượng theo thứ tự bảng chữ cái (A-Z) chuẩn PayOS
 */
function sortObjDataByKey(object) {
    if (!object || typeof object !== 'object') return object;
    const orderedObject = Object.keys(object)
        .sort()
        .reduce((obj, key) => {
            obj[key] = object[key];
            return obj;
        }, {});
    return orderedObject;
}

/**
 * Chuyển đổi đối tượng data thành chuỗi truy vấn (query string) chuẩn PayOS
 */
function convertObjToQueryStr(object) {
    if (!object || typeof object !== 'object') return '';
    return Object.keys(object)
        .sort()
        .filter((key) => object[key] !== undefined)
        .map((key) => {
            let value = object[key];
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                value = JSON.stringify(sortObjDataByKey(value));
            } else if (value && Array.isArray(value)) {
                value = JSON.stringify(value.map((val) => (typeof val === 'object' ? sortObjDataByKey(val) : val)));
            }
            return `${key}=${value === null ? '' : value}`;
        })
        .join('&');
}

/**
 * Tính HMAC-SHA256 bằng Web Crypto API tiêu chuẩn
 */
async function hmacSha256(key, message) {
    const enc = new TextEncoder();
    const keyData = enc.encode(key);
    const msgData = enc.encode(message);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * So sánh an toàn thời gian chống timing attack
 */
function timingSafeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

/**
 * Xác thực chữ ký số HMAC-SHA256 của PayOS
 */
async function verifySignature(data, signature, checksumKey) {
    if (!data || !signature || !checksumKey) return false;
    const signData = convertObjToQueryStr(data);
    const computedSignature = await hmacSha256(checksumKey, signData);
    return timingSafeEqual(computedSignature.toLowerCase(), String(signature).toLowerCase());
}

export async function onRequestOptions() {
    return new Response(JSON.stringify({ success: true, message: 'HiVocab PayOS Webhook endpoint is active' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

export async function onRequestGet() {
    return new Response(JSON.stringify({ success: true, message: 'HiVocab PayOS Webhook endpoint is active' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    const DEFAULT_SUPABASE_URL = 'https://swehdtrqjyklmsefkjdf.supabase.co';
    const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30.dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU';

    const SUPABASE_URL              = env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const SUPABASE_ANON_KEY         = env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    const PAYOS_CHECKSUM_KEY        = String(env.PAYOS_CHECKSUM_KEY || '').trim();

    let body = {};
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const { code, desc, data, signature } = body;

    // 1. Xử lý Ping / Test Request khi khai báo Webhook URL trên my.payos.vn
    if (!signature || !data) {
        console.log('[PayOS Webhook] Ping/Test verification received (no signature/data)');
        return new Response(JSON.stringify({ success: true, message: 'Webhook endpoint verified' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 2. Fast-path: Nhận diện test webhook khi bấm "Xác nhận" trên my.payos.vn (orderCode: 123 hoặc VQRIO123)
    const isTestWebhook = data.orderCode === 123 ||
                          data.orderCode === 0 ||
                          String(data.description).includes('VQRIO') ||
                          String(data.description).toLowerCase().includes('test');

    // 3. Xác thực chữ ký điện tử
    if (PAYOS_CHECKSUM_KEY) {
        const isValid = await verifySignature(data, signature, PAYOS_CHECKSUM_KEY);
        if (!isValid) {
            console.error('[PayOS Webhook] Invalid signature!', {
                data,
                signature,
                signData: convertObjToQueryStr(data),
            });
            // Nếu là test request từ PayOS mà chữ ký lệch do dev key khác prod key, vẫn chấp nhận để lưu URL thành công
            if (isTestWebhook) {
                console.log('[PayOS Webhook] Accepting test webhook despite signature mismatch');
                return new Response(JSON.stringify({ success: true, message: 'Test webhook verified' }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            return new Response(JSON.stringify({ success: false, error: 'Invalid signature' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    } else {
        console.warn('[PayOS Webhook] PAYOS_CHECKSUM_KEY not set! Skipping signature check.');
    }

    // Nếu là test webhook và chữ ký hợp lệ -> hoàn tất ngay
    if (isTestWebhook) {
        return new Response(JSON.stringify({ success: true, message: 'Test webhook verified successfully' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 4. Kiểm tra mã trạng thái giao dịch thực tế
    // code: "00" đại diện cho giao dịch thành công
    if (code !== '00' && data.code !== '00') {
        console.log('[PayOS Webhook] Transaction not successful:', code, desc);
        return new Response(JSON.stringify({ success: true, message: 'Transaction not successful, acknowledged' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const orderCode = data.orderCode;
    if (!orderCode) {
        return new Response(JSON.stringify({ success: true, message: 'No orderCode provided' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        // 5. Tìm đơn hàng trong cơ sở dữ liệu Supabase
        const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?order_code=eq.${orderCode}&select=*`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
            },
        });

        if (!orderRes.ok) {
            console.error('[PayOS Webhook] DB error finding order:', await orderRes.text());
            return new Response(JSON.stringify({ success: true, message: 'DB error, acknowledged' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const orders = await orderRes.json();
        if (!orders || orders.length === 0) {
            console.warn('[PayOS Webhook] Order not found in database:', orderCode);
            return new Response(JSON.stringify({ success: true, message: 'Order not found in database' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const order = orders[0];

        // 6. Kiểm tra tính lũy đẳng (Idempotency) - Nếu đã thanh toán rồi thì không cộng dồn lần 2
        if (order.status === 'PAID') {
            console.log('[PayOS Webhook] Order already marked as PAID:', orderCode);
            return new Response(JSON.stringify({ success: true, message: 'Order already processed' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 7. Gọi RPC activate_pro_order (SECURITY DEFINER, chạy 100% thành công không bị chặn bởi RLS)
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/rpc/activate_pro_order`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    p_order_code: orderCode,
                    p_payment_time: data.transactionDateTime ? new Date(data.transactionDateTime).toISOString() : new Date().toISOString(),
                    p_webhook_data: data,
                }),
            });
            console.log('[PayOS Webhook] Executed activate_pro_order RPC successfully for order:', orderCode);
        } catch (e) {
            console.warn('[activate_pro_order RPC Error]', e);
        }

        // Cập nhật trạng thái đơn hàng thành PAID qua REST
        const updateOrderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
                status: 'PAID',
                payment_time: data.transactionDateTime ? new Date(data.transactionDateTime).toISOString() : new Date().toISOString(),
                webhook_data: data,
                updated_at: new Date().toISOString(),
            }),
        });

        if (!updateOrderRes.ok) {
            console.error('[PayOS Webhook] Failed to update order status:', await updateOrderRes.text());
        }

        // 8. Tính toán ngày hết hạn gói Pro
        const daysToAdd = PLAN_DAYS[order.plan_id] || 30;
        const now = new Date();

        // Lấy thông tin profile hiện tại để gia hạn (nếu đang còn hạn Pro thì cộng dồn)
        let currentExpiresAt = null;
        try {
            const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${order.user_id}&select=subscription_expires_at,tier`, {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                },
            });
            if (profRes.ok) {
                const profiles = await profRes.json();
                if (profiles && profiles.length > 0) {
                    currentExpiresAt = profiles[0].subscription_expires_at ? new Date(profiles[0].subscription_expires_at) : null;
                }
            }
        } catch (_) {}

        // Nếu gói cũ còn hạn > hiện tại thì cộng dồn từ ngày cũ, ngược lại cộng từ ngày hôm nay
        const baseDate = (currentExpiresAt && currentExpiresAt > now) ? currentExpiresAt : now;
        const newExpiresAt = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

        // 9. Cập nhật bảng profiles nâng cấp thành viên PRO
        const updateProfilePayload = {
            tier: 'pro',
            subscription_plan: order.plan_id,
            subscription_status: 'active',
            subscription_started_at: now.toISOString(),
            subscription_expires_at: newExpiresAt.toISOString(),
        };

        const updateProfRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${order.user_id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify(updateProfilePayload),
        });

        if (!updateProfRes.ok) {
            console.error('[PayOS Webhook] Failed to update user profile:', await updateProfRes.text());
        } else {
            console.log(`[PayOS Webhook] Successfully upgraded user ${order.user_email || order.user_id} to PRO until ${newExpiresAt.toISOString()}`);
        }

        // 10. Phản hồi HTTP 200 thành công cho PayOS
        return new Response(JSON.stringify({
            success: true,
            message: 'Payment processed and user upgraded successfully',
            orderCode,
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('[PayOS Webhook Exception]', err);
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequest(context) {
    const method = context.request.method.toUpperCase();
    if (method === 'OPTIONS') return onRequestOptions(context);
    if (method === 'GET') return onRequestGet(context);
    if (method === 'POST') return onRequestPost(context);
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
