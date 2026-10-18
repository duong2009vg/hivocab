// functions/api/payment/webhook.js
// Cloudflare Pages Function: POST /api/payment/webhook
// Nhận thông báo thanh toán thành công từ PayOS và kích hoạt PRO
// Xác thực chữ ký số HMAC-SHA256 chuẩn PayOS bằng Web Crypto API
import { checkRateLimit, rateLimitResponse } from '../../_rateLimit.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://hivocab.site',
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

    const rateLimit = await checkRateLimit({ request, env, ruleName: 'webhook' });
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit, corsHeaders);

    const SUPABASE_URL              = String(env.SUPABASE_URL || '').trim();
    const SUPABASE_SERVICE_ROLE_KEY = String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    const PAYOS_CHECKSUM_KEY        = String(env.PAYOS_CHECKSUM_KEY || '').trim();

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PAYOS_CHECKSUM_KEY) {
        console.error('[PayOS Webhook] Required server secrets are not configured.');
        return new Response(JSON.stringify({ success: false, error: 'Webhook server misconfiguration' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

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

    if (typeof data !== 'object' || Array.isArray(data)) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid webhook data' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 2. Nhận diện test webhook khi bấm "Xác nhận" trên my.payos.vn.
    const isTestWebhook = data.orderCode === 123 ||
                          data.orderCode === 0 ||
                          String(data.description).includes('VQRIO') ||
                          String(data.description).toLowerCase().includes('test');

    // 3. Xác thực chữ ký điện tử, luôn fail-closed kể cả với payload test.
    const isValid = await verifySignature(data, signature, PAYOS_CHECKSUM_KEY);
    if (!isValid) {
        console.error('[PayOS Webhook] Invalid signature!', {
            data,
            signature,
            signData: convertObjToQueryStr(data),
        });
        return new Response(JSON.stringify({ success: false, error: 'Invalid signature' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
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

    const orderCode = String(data.orderCode || '').trim();
    if (!/^\d{1,20}$/.test(orderCode)) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid orderCode' }), {
            status: 400,
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
            return new Response(JSON.stringify({ success: false, error: 'Temporary database error' }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const orders = await orderRes.json();
        if (!orders || orders.length === 0) {
            console.warn('[PayOS Webhook] Order not found in database:', orderCode);
            return new Response(JSON.stringify({ success: false, error: 'Order not found yet' }), {
                status: 502,
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

        // 7. Giao toàn bộ việc kích hoạt cho RPC transactionally/idempotently.
        // Không PATCH profile thủ công ở đây vì có thể cộng hạn hai lần khi
        // PayOS gửi webhook trùng hoặc hai request chạy đồng thời.
        const paymentTime = data.transactionDateTime
            ? new Date(data.transactionDateTime).toISOString()
            : new Date().toISOString();
        const activateRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/activate_pro_order`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                p_order_code: orderCode,
                p_payment_time: paymentTime,
                p_webhook_data: data,
            }),
        });

        if (!activateRes.ok) {
            console.error('[PayOS Webhook] activate_pro_order failed:', await activateRes.text());
            return new Response(JSON.stringify({ success: false, error: 'Không thể kích hoạt đơn hàng' }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Fallback metadata update only. The profile subscription must be
        // changed by activate_pro_order, which is the idempotency boundary.
        const updateOrderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}&status=eq.PENDING`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
                status: 'PAID',
                payment_time: paymentTime,
                webhook_data: data,
                updated_at: new Date().toISOString(),
            }),
        });

        if (!updateOrderRes.ok) {
            console.error('[PayOS Webhook] Failed to update order status:', await updateOrderRes.text());
            return new Response(JSON.stringify({ success: false, error: 'Không thể cập nhật trạng thái đơn hàng' }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 8. Phản hồi HTTP 200 thành công cho PayOS
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
        return new Response(JSON.stringify({ success: false, error: 'Lỗi xử lý webhook thanh toán' }), {
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
