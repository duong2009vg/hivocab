// functions/api/payment/create-order.js
// Cloudflare Pages Function: POST /api/payment/create-order
// Tạo đơn hàng PayOS và trả về checkoutUrl cho Embedded Form

const PLANS = {
    pro_1m: {
        id: 'pro_1m',
        name: 'HiVocab Pro 1 Tháng',
        amount: 29000,
        days: 30,
    },
    pro_6m: {
        id: 'pro_6m',
        name: 'HiVocab Pro 6 Tháng',
        amount: 149000,
        days: 180,
    },
    pro_1y: {
        id: 'pro_1y',
        name: 'HiVocab Pro 1 Năm',
        amount: 249000,
        days: 365,
    },
    pro_lifetime: {
        id: 'pro_lifetime',
        name: 'HiVocab Pro Trọn Đời',
        amount: 499000,
        days: 36500, // ~100 năm
    },
};

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Tính HMAC-SHA256 bằng Web Crypto API tiêu chuẩn (hoạt động 100% trên Cloudflare Workers/Pages không cần node:crypto)
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
 * Tính chữ ký số HMAC-SHA256 cho yêu cầu tạo link thanh toán PayOS
 */
async function createPayOSSignature({ amount, cancelUrl, description, orderCode, returnUrl }, checksumKey) {
    const rawData = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
    return await hmacSha256(checksumKey, rawData);
}

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    const SUPABASE_URL              = env.SUPABASE_URL || 'https://swehdtrqjyklmsefkjdf.supabase.co';
    const SUPABASE_ANON_KEY         = env.SUPABASE_ANON_KEY;
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

    const PAYOS_CLIENT_ID    = env.PAYOS_CLIENT_ID;
    const PAYOS_API_KEY      = env.PAYOS_API_KEY;
    const PAYOS_CHECKSUM_KEY = env.PAYOS_CHECKSUM_KEY;

    // 1. Kiểm tra cấu hình PayOS
    if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
        return new Response(JSON.stringify({
            ok: false,
            error: 'PayOS chưa được cấu hình biến môi trường trên Cloudflare Pages (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY)',
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 2. Xác thực user qua token
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
        return new Response(JSON.stringify({ ok: false, error: 'Vui lòng đăng nhập để nâng cấp' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    let user = null;
    try {
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY,
            },
        });
        if (!userRes.ok) {
            return new Response(JSON.stringify({ ok: false, error: 'Phiên đăng nhập hết hạn' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        user = await userRes.json();
    } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: 'Lỗi xác thực người dùng: ' + err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 3. Kiểm tra gói cước
    let body = {};
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ ok: false, error: 'Dữ liệu JSON không hợp lệ' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const { planId } = body || {};
    const plan = PLANS[planId];
    if (!plan) {
        return new Response(JSON.stringify({ ok: false, error: 'Gói cước không hợp lệ' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        // 4. Sinh orderCode duy nhất (số nguyên dương an toàn < 9007199254740991)
        const orderCode = Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 1000);
        
        // Mô tả chuyển khoản (tối đa 25 ký tự, không dấu, không ký tự đặc biệt)
        const description = `HV${orderCode.toString().slice(-8)}`;

        const origin = request.headers.get('origin') || 'https://hivocab.site';
        const returnUrl = `${origin}/#pricing?status=success&orderCode=${orderCode}`;
        const cancelUrl = `${origin}/#pricing?status=cancelled&orderCode=${orderCode}`;

        // 5. Tính signature cho PayOS bằng Web Crypto
        const signature = await createPayOSSignature({
            amount: plan.amount,
            cancelUrl,
            description,
            orderCode,
            returnUrl,
        }, PAYOS_CHECKSUM_KEY);

        // 6. Gọi PayOS API tạo Payment Request
        const payosRes = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
            method: 'POST',
            headers: {
                'x-client-id': PAYOS_CLIENT_ID,
                'x-api-key': PAYOS_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderCode,
                amount: plan.amount,
                description,
                returnUrl,
                cancelUrl,
                signature,
                items: [
                    {
                        name: plan.name,
                        quantity: 1,
                        price: plan.amount,
                    }
                ],
            }),
        });

        const payosResult = await payosRes.json();
        if (!payosRes.ok || payosResult.code !== '00') {
            console.error('[PayOS Create Error]', payosResult);
            return new Response(JSON.stringify({
                ok: false,
                error: payosResult.desc || 'Không thể tạo liên kết thanh toán với PayOS',
                details: payosResult,
            }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const payosData = payosResult.data || {};

        // 7. Lưu đơn hàng vào database Supabase (status: PENDING)
        const insertOrderPayload = {
            order_code: orderCode,
            user_id: user.id,
            user_email: user.email,
            plan_id: plan.id,
            plan_name: plan.name,
            amount: plan.amount,
            currency: 'VND',
            status: 'PENDING',
            payos_payment_link_id: payosData.paymentLinkId || null,
            checkout_url: payosData.checkoutUrl || null,
            qr_code: payosData.qrCode || null,
        };

        const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
            },
            body: JSON.stringify(insertOrderPayload),
        });

        if (!dbRes.ok) {
            const dbErr = await dbRes.text();
            console.warn('[Orders DB Insert Warn]', dbErr);
        }

        // 8. Trả về thông tin cho Frontend nhúng PayOS
        return new Response(JSON.stringify({
            ok: true,
            orderCode,
            checkoutUrl: payosData.checkoutUrl,
            qrCode: payosData.qrCode,
            amount: plan.amount,
            planName: plan.name,
            accountNumber: payosData.accountNumber,
            accountName: payosData.accountName,
            description: payosData.description,
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('[create-order Exception]', err);
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequest(context) {
    const method = context.request.method.toUpperCase();
    if (method === 'OPTIONS') return onRequestOptions(context);
    if (method === 'POST') return onRequestPost(context);
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
