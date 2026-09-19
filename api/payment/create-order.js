// api/payment/create-order.js
// POST /api/payment/create-order — Tạo đơn hàng PayOS và trả về checkoutUrl cho Embedded Form
// Header: Authorization: Bearer <supabase_jwt>
// Body: { planId: 'pro_1m' | 'pro_6m' | 'pro_1y' | 'pro_lifetime' }

import crypto from 'crypto';
import { setCors } from '../_cors.js';

const SUPABASE_URL              = process.env.SUPABASE_URL || 'https://swehdtrqjyklmsefkjdf.supabase.co';
const SUPABASE_ANON_KEY         = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const PAYOS_CLIENT_ID    = process.env.PAYOS_CLIENT_ID;
const PAYOS_API_KEY      = process.env.PAYOS_API_KEY;
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;

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

/**
 * Tính chữ ký số HMAC-SHA256 cho yêu cầu tạo link thanh toán PayOS
 */
function createPayOSSignature({ amount, cancelUrl, description, orderCode, returnUrl }, checksumKey) {
    const rawData = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
    return crypto.createHmac('sha256', checksumKey).update(rawData).digest('hex');
}

export default async function handler(req, res) {
    setCors(req, res, ['POST', 'OPTIONS']);
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

    // 1. Kiểm tra cấu hình PayOS
    if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
        return res.status(500).json({
            ok: false,
            error: 'PayOS chưa được cấu hình biến môi trường (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY)',
        });
    }

    // 2. Xác thực user qua token
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return res.status(401).json({ ok: false, error: 'Vui lòng đăng nhập để nâng cấp' });

    let user = null;
    try {
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY,
            },
        });
        if (!userRes.ok) return res.status(401).json({ ok: false, error: 'Phiên đăng nhập hết hạn' });
        user = await userRes.json();
    } catch (err) {
        return res.status(500).json({ ok: false, error: 'Lỗi xác thực người dùng: ' + err.message });
    }

    // 3. Kiểm tra gói cước
    const { planId } = req.body || {};
    const plan = PLANS[planId];
    if (!plan) {
        return res.status(400).json({ ok: false, error: 'Gói cước không hợp lệ' });
    }

    try {
        // 4. Sinh orderCode duy nhất (số nguyên dương an toàn < 9007199254740991)
        // Format: [timestamp 10 số][3 số ngẫu nhiên]
        const orderCode = Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 1000);
        
        // Mô tả chuyển khoản (tối đa 25 ký tự, không dấu, không ký tự đặc biệt)
        const description = `HV${orderCode.toString().slice(-8)}`;

        const origin = req.headers.origin || 'https://hivocab.site';
        const returnUrl = `${origin}/#pricing?status=success&orderCode=${orderCode}`;
        const cancelUrl = `${origin}/#pricing?status=cancelled&orderCode=${orderCode}`;

        // 5. Tính signature cho PayOS
        const signature = createPayOSSignature({
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
            return res.status(502).json({
                ok: false,
                error: payosResult.desc || 'Không thể tạo liên kết thanh toán với PayOS',
                details: payosResult,
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
            // Vẫn cho phép client tiếp tục thanh toán vì checkoutUrl đã được PayOS sinh thành công
        }

        // 8. Trả về thông tin cho Frontend nhúng PayOS
        return res.status(200).json({
            ok: true,
            orderCode,
            checkoutUrl: payosData.checkoutUrl,
            qrCode: payosData.qrCode,
            amount: plan.amount,
            planName: plan.name,
            accountNumber: payosData.accountNumber,
            accountName: payosData.accountName,
            description: payosData.description,
        });

    } catch (err) {
        console.error('[create-order Exception]', err);
        return res.status(500).json({ ok: false, error: err.message });
    }
}
