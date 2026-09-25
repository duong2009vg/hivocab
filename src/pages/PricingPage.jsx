// src/pages/PricingPage.jsx
// Trang Nâng cấp HiVocab PRO & Thanh toán PayOS chuẩn bảo mật

import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore.js';
import { supabase } from '../services/supabase.js';
import { Sparkles, Check, Diamond, ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export function PricingPage() {
    const { user, profile, isPro } = useAuthStore();
    const [selectedPlan, setSelectedPlan] = useState('pro_1y');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const plans = [
        {
            id: 'pro_1m',
            name: 'Gói 1 Tháng',
            price: '29.000đ',
            originalPrice: '59.000đ',
            period: '/tháng',
            description: 'Phù hợp trải nghiệm ngắn hạn trước kỳ thi',
            popular: false
        },
        {
            id: 'pro_6m',
            name: 'Gói 6 Tháng',
            price: '149.000đ',
            originalPrice: '299.000đ',
            period: '/6 tháng (~25k/tháng)',
            description: 'Tiết kiệm 50% - Lựa chọn phổ biến cho học sinh, sinh viên',
            popular: false
        },
        {
            id: 'pro_1y',
            name: 'Gói 1 Năm',
            price: '249.000đ',
            originalPrice: '499.000đ',
            period: '/năm (~20k/tháng)',
            description: 'Tiết kiệm 60% - Luyện thi bứt phá mục tiêu IELTS 7.5+',
            popular: true
        },
        {
            id: 'pro_lifetime',
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
        'Thuật toán SM-2 lập lịch ôn tập thông minh tối ưu đường cong quên lãng',
        'Đồng bộ tiến độ học tập trên mọi thiết bị máy tính và điện thoại'
    ];

    async function handlePayment(planId) {
        setErrorMessage('');
        if (!user) {
            alert('Vui lòng đăng nhập tài khoản trước khi nâng cấp.');
            return;
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new Error('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.');
            }

            const res = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ planId })
            });

            const data = await res.json();
            if (data.ok && data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                setErrorMessage(data.error || 'Cổng thanh toán PayOS đang bảo trì. Vui lòng thử lại sau.');
            }
        } catch (err) {
            setErrorMessage(err.message || 'Không thể kết nối cổng thanh toán. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col items-center gap-8">
            {/* Header */}
            <div className="text-center flex flex-col items-center gap-2 max-w-xl">
                <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-500/10 text-amber-500 border border-amber-500/25 flex items-center gap-1.5 shadow-xs">
                    <Diamond className="w-3.5 h-3.5" />
                    <span>Nâng cấp HiVocab PRO</span>
                </span>
                <h1 className="text-2xl sm:text-4xl font-black text-on-surface tracking-tight mt-1">
                    Bứt phá điểm số cùng công nghệ học từ vựng thông minh
                </h1>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    Đầu tư nhỏ cho tương lai ngoại ngữ. Ghi nhớ sâu hơn gấp 3 lần với phương pháp lặp lại ngắt quãng khoa học.
                </p>
            </div>

            {/* Trạng thái hiện tại nếu đã là PRO */}
            {isPro && (
                <div className="w-full p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div className="text-xs sm:text-sm">
                        <strong className="text-emerald-500 font-bold block">Bạn đang sở hữu tài khoản HiVocab VIP</strong>
                        <span className="text-on-surface-variant">Tất cả các tính năng nâng cao và kho từ điển đã được mở khóa toàn quyền.</span>
                    </div>
                </div>
            )}

            {errorMessage && (
                <div className="w-full p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm font-medium text-center">
                    {errorMessage}
                </div>
            )}

            {/* Danh sách các gói thanh toán */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {plans.map((plan) => {
                    const isSelected = selectedPlan === plan.id;

                    return (
                        <div
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan.id)}
                            className={`relative rounded-3xl p-6 transition-all cursor-pointer border flex flex-col justify-between ${
                                isSelected
                                    ? 'bg-surface-container-high/90 border-primary ring-2 ring-primary/20 shadow-md'
                                    : 'bg-surface-container-lowest/80 border-outline-variant/30 hover:border-primary/40'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-black uppercase tracking-wider shadow-xs">
                                    Khuyên dùng
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg text-on-surface">{plan.name}</h3>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/60'}`}>
                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                </div>

                                <div className="mt-3 flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-on-surface">{plan.price}</span>
                                    <span className="text-xs text-on-surface-variant line-through">{plan.originalPrice}</span>
                                    <span className="text-xs text-on-surface-variant">{plan.period}</span>
                                </div>

                                <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                                    {plan.description}
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePayment(plan.id);
                                }}
                                className={`mt-6 w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                                    isSelected
                                        ? 'bg-primary text-on-primary hover:bg-primary/90'
                                        : 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high'
                                }`}
                            >
                                {loading && selectedPlan === plan.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <span>Nâng cấp ngay</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Đặc quyền thành viên VIP */}
            <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-bold text-base text-on-surface">Đặc quyền trọn gói thành viên HiVocab PRO</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {benefits.map((b, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-on-surface-variant">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{b}</span>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}

export default PricingPage;
