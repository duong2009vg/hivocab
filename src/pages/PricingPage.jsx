// src/pages/PricingPage.jsx
// Trang Nâng cấp HiVocab PRO & Thanh toán PayOS

import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore.js';

export function PricingPage() {
    const { user, isPro } = useAuthStore();
    const [selectedPlan, setSelectedPlan] = useState('yearly');
    const [loading, setLoading] = useState(false);

    const plans = [
        {
            id: 'monthly',
            name: 'Gói 1 Tháng',
            price: '49.000đ',
            originalPrice: '79.000đ',
            period: '/tháng',
            description: 'Phù hợp trải nghiệm ngắn hạn trước kỳ thi',
            popular: false
        },
        {
            id: 'yearly',
            name: 'Gói 1 Năm',
            price: '299.000đ',
            originalPrice: '588.000đ',
            period: '/năm (chỉ 25k/tháng)',
            description: 'Tiết kiệm 50% - Lựa chọn phổ biến nhất cho học sinh, sinh viên',
            popular: true
        },
        {
            id: 'lifetime',
            name: 'Trọn Đời (Lifetime)',
            price: '499.000đ',
            originalPrice: '1.200.000đ',
            period: 'thanh toán 1 lần duy nhất',
            description: 'Sở hữu vĩnh viễn mọi bản cập nhật và tính năng AI trong tương lai',
            popular: false
        }
    ];

    const benefits = [
        'Mở khóa trọn bộ 70.000 từ vựng và toàn bộ Cambridge IELTS 10–21',
        'Tra từ điển AI DeepSeek không giới hạn, lưu cache Cloudflare KV siêu tốc',
        'Phát âm chuẩn tức thì (Zero-delay) không giới hạn lượt nghe',
        'Phòng thi THPT Quốc Gia mô phỏng 50 câu có giải thích chi tiết',
        'Đồng bộ tiến độ học tập trên mọi thiết bị máy tính và điện thoại'
    ];

    async function handlePayment(planId) {
        if (!user) {
            alert('Vui lòng đăng nhập tài khoản trước khi nâng cấp.');
            return;
        }

        setLoading(true);
        try {
            // Gọi API PayOS tạo payment link
            const res = await fetch('/api/create-payment-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId,
                    userId: user.id,
                    email: user.email
                })
            });

            const data = await res.json();
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                alert('Hệ thống thanh toán đang chuẩn bị kích hoạt. Vui lòng liên hệ hỗ trợ.');
            }
        } catch (_) {
            alert('Chưa thể kết nối cổng thanh toán PayOS lúc này. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-12 pt-6 lg:pt-10 flex flex-col items-center gap-8">
            {/* Header */}
            <div className="text-center flex flex-col items-center gap-2 max-w-lg">
                <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center gap-1.5 shadow-xs">
                    <span className="material-symbols-outlined text-[16px] text-amber-500">diamond</span>
                    Nâng cấp HiVocab PRO
                </span>
                <h1 className="text-2xl sm:text-4xl font-black text-on-surface tracking-tight mt-1">
                    Bứt phá điểm số cùng công nghệ học từ vựng thông minh
                </h1>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    Đầu tư nhỏ cho tương lai ngoại ngữ. Học nhanh hơn gấp 3 lần với phương pháp lặp lại ngắt quãng khoa học.
                </p>
            </div>

            {/* Current Status Banner */}
            {isPro && (
                <div className="w-full p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-500 text-[24px]">verified</span>
                    <div>
                        <h4 className="font-bold text-sm text-on-surface">Tài khoản của bạn đã là HiVocab PRO</h4>
                        <p className="text-xs text-on-surface-variant">Bạn đang được tận hưởng toàn bộ tính năng cao cấp không giới hạn.</p>
                    </div>
                </div>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                {plans.map((p) => {
                    const isSelected = selectedPlan === p.id;

                    return (
                        <div
                            key={p.id}
                            onClick={() => setSelectedPlan(p.id)}
                            className={`glass-card soft-shadow rounded-3xl p-6 flex flex-col justify-between gap-6 cursor-pointer transition-all relative ${
                                isSelected
                                    ? 'border-2 border-primary shadow-xl scale-[1.02] bg-primary/[0.02]'
                                    : 'border border-outline-variant/30 hover:border-primary/40'
                            }`}
                        >
                            {p.popular && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary text-on-primary shadow-sm">
                                    Được chọn nhiều nhất
                                </span>
                            )}

                            <div>
                                <h3 className="font-bold text-lg text-on-surface">{p.name}</h3>
                                <p className="text-xs text-on-surface-variant mt-1">{p.description}</p>

                                <div className="mt-4 flex items-baseline gap-2">
                                    <span className="text-2xl sm:text-3xl font-black text-on-surface">{p.price}</span>
                                    <span className="text-xs text-outline line-through">{p.originalPrice}</span>
                                </div>
                                <span className="text-[11px] font-medium text-on-surface-variant block mt-0.5">{p.period}</span>
                            </div>

                            <button
                                onClick={() => handlePayment(p.id)}
                                disabled={loading}
                                className={`w-full py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer ${
                                    isSelected
                                        ? 'bg-primary text-on-primary hover:opacity-95 active:scale-95'
                                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                                }`}
                            >
                                {loading ? 'Đang xử lý...' : 'Chọn gói này'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Benefits Checklist */}
            <div className="w-full glass-card soft-shadow rounded-3xl p-6 sm:p-8 border border-outline-variant/30 flex flex-col gap-4">
                <h3 className="font-bold text-base text-on-surface">Đặc quyền khi nâng cấp HiVocab PRO</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {benefits.map((b, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                                check_circle
                            </span>
                            <span className="text-xs sm:text-sm text-on-surface-variant font-medium leading-relaxed">
                                {b}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}

export default PricingPage;
