// src/components/modals/PricingModal.jsx
// Redesigned HiVocab PRO Membership & PayOS / VietQR Checkout
// 100% Inspired by Claude.ai Minimalist Upgrade Style
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  Copy,
  ExternalLink,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useModal } from '../../context/ModalContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { supabase } from '../../lib/supabaseClient.js';

// Botanical Glyphs matching Claude.ai style
function ClaudePlantIcon({ level = 1 }) {
  if (level === 1) {
    // Free / Seedling
    return (
      <svg className="w-10 h-10 text-stone-900 stroke-current shrink-0" viewBox="0 0 40 40" fill="none">
        <line x1="20" y1="36" x2="20" y2="12" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="20" cy="9" r="3.5" strokeWidth="1.75" />
        <path d="M20 25C15 25 12 21 12 17" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="12" cy="17" r="2.5" strokeWidth="1.75" />
        <path d="M20 25C25 25 28 21 28 17" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="28" cy="17" r="2.5" strokeWidth="1.75" />
      </svg>
    );
  }
  if (level === 2) {
    // 1 Month / Growing
    return (
      <svg className="w-10 h-10 text-stone-900 stroke-current shrink-0" viewBox="0 0 40 40" fill="none">
        <line x1="20" y1="36" x2="20" y2="10" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="20" cy="7" r="3.5" strokeWidth="1.75" />
        <path d="M20 28C14 28 10 24 10 20" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="10" cy="20" r="2.5" strokeWidth="1.75" />
        <path d="M20 28C26 28 30 24 30 20" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="30" cy="20" r="2.5" strokeWidth="1.75" />
        <path d="M20 18C16 18 13 15 13 13" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="13" cy="13" r="2.5" strokeWidth="1.75" />
        <path d="M20 18C24 18 27 15 27 13" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="27" cy="13" r="2.5" strokeWidth="1.75" />
      </svg>
    );
  }
  if (level === 3) {
    // 6 Months / Flourishing
    return (
      <svg className="w-10 h-10 text-stone-900 stroke-current shrink-0" viewBox="0 0 40 40" fill="none">
        <line x1="20" y1="36" x2="20" y2="10" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="20" cy="7" r="3.5" strokeWidth="1.75" />
        <path d="M20 30C13 30 8 26 8 21" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="8" cy="21" r="2.5" strokeWidth="1.75" />
        <path d="M20 30C27 30 32 26 32 21" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="32" cy="21" r="2.5" strokeWidth="1.75" />
        <path d="M20 22C14 22 11 18 11 15" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="11" cy="15" r="2.5" strokeWidth="1.75" />
        <path d="M20 22C26 22 29 18 29 15" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="29" cy="15" r="2.5" strokeWidth="1.75" />
        <circle cx="20" cy="18" r="2" fill="currentColor" />
      </svg>
    );
  }
  // 1 Year / Tree of Knowledge
  return (
    <svg className="w-10 h-10 text-stone-900 stroke-current shrink-0" viewBox="0 0 40 40" fill="none">
      <line x1="20" y1="36" x2="20" y2="8" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="20" cy="6" r="3.5" strokeWidth="1.75" />
      <path d="M20 31C12 31 6 26 6 21" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="6" cy="21" r="2.5" strokeWidth="1.75" />
      <path d="M20 31C28 31 34 26 34 21" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="34" cy="21" r="2.5" strokeWidth="1.75" />
      <path d="M20 23C13 23 9 18 9 14" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="9" cy="14" r="2.5" strokeWidth="1.75" />
      <path d="M20 23C27 23 31 18 31 14" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="31" cy="14" r="2.5" strokeWidth="1.75" />
      <path d="M20 15C16 15 14 12 14 10" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="14" cy="10" r="2" strokeWidth="1.75" />
      <path d="M20 15C24 15 26 12 26 10" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="26" cy="10" r="2" strokeWidth="1.75" />
    </svg>
  );
}

const PLANS = {
  pro_1m: {
    id: 'pro_1m',
    name: '1 Tháng',
    badge: null,
    priceFormatted: '29.000 ₫',
    priceNumber: '29.000',
    monthlyEquivalent: '29.000 ₫ / tháng',
    periodNote: 'Thanh toán theo từng tháng',
    amount: 29000,
    subtitle: 'Trải nghiệm ngắn hạn',
    level: 2,
    featuresHeader: 'Bao gồm toàn bộ Cơ bản, cộng thêm:',
    features: [
      'Mở khóa 100% kho từ vựng chuyên sâu',
      'Không giới hạn số từ ôn tập mỗi ngày',
      'Thuật toán ngắt quãng SM-2 cá nhân hóa',
      'Mở khóa toàn bộ bài đọc IELTS & THPT',
      'Học tập liền mạch, không quảng cáo',
    ],
  },
  pro_6m: {
    id: 'pro_6m',
    name: '6 Tháng',
    badge: 'Phổ biến nhất · Tiết kiệm 50%',
    priceFormatted: '149.000 ₫',
    priceNumber: '149.000',
    monthlyEquivalent: '~24.800 ₫ / tháng',
    periodNote: '149.000 ₫ thanh toán mỗi 6 tháng',
    amount: 149000,
    recommended: true,
    subtitle: 'Luyện thi trọng tâm & bứt phá',
    level: 3,
    featuresHeader: 'Bao gồm toàn bộ gói 1 Tháng, cộng thêm:',
    features: [
      'Tiết kiệm 50% so với gói từng tháng',
      'Kho 38+ đề thi THPT Quốc Gia ma trận chuẩn',
      'Luyện đề thi thử có tính giờ thi thực tế',
      'Đồng bộ tiến độ học tập trên mọi thiết bị',
      'Ưu tiên hỗ trợ kỹ thuật và học tập',
    ],
  },
  pro_1y: {
    id: 'pro_1y',
    name: '1 Năm',
    badge: 'Tiết kiệm nhất · 60%',
    priceFormatted: '249.000 ₫',
    priceNumber: '249.000',
    monthlyEquivalent: '~20.700 ₫ / tháng',
    periodNote: '249.000 ₫ thanh toán theo năm',
    amount: 249000,
    subtitle: 'Đồng hành trọn vẹn cả năm học',
    level: 4,
    featuresHeader: 'Bao gồm toàn bộ gói 6 Tháng, cộng thêm:',
    features: [
      'Mức giá tối ưu nhất (~20.000 ₫ / tháng)',
      'Toàn bộ bài đọc & đề thi cập nhật 2026',
      'Không giới hạn tra cứu từ điển thông minh AI',
      'Huy hiệu thành viên Chuyên cần PRO',
      'Tặng sổ tay phương pháp nhớ từ vựng SRS',
    ],
  },
  pro_lifetime: {
    id: 'pro_lifetime',
    name: 'Trọn Đời',
    badge: 'Vĩnh viễn',
    priceFormatted: '499.000 ₫',
    priceNumber: '499.000',
    monthlyEquivalent: 'Sở hữu mãi mãi',
    periodNote: 'Thanh toán một lần duy nhất',
    amount: 499000,
    subtitle: 'Đầu tư vĩnh viễn cho tương lai',
    level: 4,
    featuresHeader: 'Toàn bộ quyền lợi PRO cao cấp nhất:',
    features: [
      'Sở hữu vĩnh viễn, không gia hạn thêm',
      'Tự động nhận mọi tính năng mới trong tương lai',
      'Toàn bộ các khoá học bổ sung sau này',
      'Hỗ trợ ưu tiên 1:1 trực tiếp từ đội ngũ',
    ],
  },
};

const FREE_PLAN = {
  name: 'Cơ bản',
  subtitle: 'Làm quen với HiVocab',
  priceNumber: '0',
  periodNote: 'Miễn phí mãi mãi',
  level: 1,
  featuresHeader: 'Tính năng bao gồm:',
  features: [
    'Kho từ vựng Oxford 3000 nền tảng',
    'Ôn tập tối đa 20 từ mỗi ngày',
    '2 bài đọc song ngữ IELTS mẫu',
    'Luyện phát âm & tra từ vựng cơ bản',
    'Học trên Web và điện thoại di động',
  ],
};

function getQrImageUrl(data, selectedPlanAmount) {
  if (!data) return null;
  if (data.qrImageUrl && /^https?:\/\//i.test(data.qrImageUrl)) {
    return data.qrImageUrl;
  }
  if (data.qrCode && (/^https?:\/\//i.test(data.qrCode) || /^data:image/i.test(data.qrCode))) {
    return data.qrCode;
  }
  const bin = data.bin || '970422';
  const acc = data.accountNumber;
  const amount = data.amount || selectedPlanAmount || 0;
  const desc = encodeURIComponent(data.description || `HV${data.orderCode || ''}`);
  const accName = encodeURIComponent(data.accountName || '');
  if (acc) {
    return `https://img.vietqr.io/image/${bin}-${acc}-compact2.png?amount=${amount}&addInfo=${desc}&accountName=${accName}`;
  }
  if (data.qrCode && typeof data.qrCode === 'string') {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.qrCode)}`;
  }
  return null;
}

export function PricingModal({ onSuccess: propOnSuccess }) {
  const { modals, closeModal } = useModal();
  const { success, error: toastError } = useToast();
  const { refreshProfile } = useAuth();

  const modalData = modals?.pricingModal;
  const isOpen = Boolean(modalData?.open);

  const [selectedPlanId, setSelectedPlanId] = useState('pro_6m');
  const [view, setView] = useState('selection'); // 'selection' | 'checkout' | 'success'
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedField, setCopiedField] = useState('');

  const pollingRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }
    const initialPlan = modalData?.defaultPlanId || 'pro_6m';
    setSelectedPlanId(PLANS[initialPlan] ? initialPlan : 'pro_6m');
    setView('selection');
    setOrderData(null);
    setErrorMessage('');
    setIsLoading(false);
    setCopiedField('');
  }, [isOpen, modalData?.defaultPlanId]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (view === 'success') {
      const callback = modalData?.onSuccess || propOnSuccess;
      if (typeof callback === 'function') {
        try {
          callback();
        } catch (cbErr) {
          console.warn('[PricingModal] Callback error:', cbErr);
        }
      }
    }
    closeModal('pricingModal');
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard?.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleStartCheckout = async (targetPlanId) => {
    const planToBuy = targetPlanId || selectedPlanId;
    setSelectedPlanId(planToBuy);
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        toastError('Vui lòng đăng nhập tài khoản để nâng cấp gói PRO!');
        handleClose();
        if (typeof window !== 'undefined' && window.navigateTo) {
          window.navigateTo('login');
        }
        return;
      }

      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: planToBuy }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Không thể khởi tạo thanh toán với cổng PayOS.');
      }

      setOrderData(data);
      setView('checkout');

      if (data.orderCode) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(async () => {
          try {
            const checkRes = await fetch(`/api/payment/check-status?orderCode=${data.orderCode}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (checkRes.ok) {
              const statusData = await checkRes.json();
              if (statusData.paid || statusData.status === 'PAID') {
                clearInterval(pollingRef.current);

                if (typeof window !== 'undefined') {
                  window._isUserPro = true;
                }

                try {
                  if (typeof refreshProfile === 'function') {
                    await refreshProfile();
                  }
                } catch (refErr) {
                  console.warn('[PricingModal] refreshProfile exception:', refErr);
                }

                setView('success');
                success('Nâng cấp PRO thành công! Cảm ơn bạn');

                const callback = modalData?.onSuccess || propOnSuccess;
                if (typeof callback === 'function') {
                  try {
                    callback(statusData);
                  } catch (cbErr) {
                    console.warn('[PricingModal] onSuccess callback error:', cbErr);
                  }
                }
              }
            }
          } catch (_) {}
        }, 3000);
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Lỗi khi tạo đơn thanh toán.');
      toastError(err?.message || 'Lỗi kết nối cổng thanh toán.');
    } finally {
      setIsLoading(false);
    }
  };

  const fourPlans = [
    { key: 'free', isFree: true, data: FREE_PLAN },
    { key: 'pro_1m', isFree: false, data: PLANS.pro_1m },
    { key: 'pro_6m', isFree: false, data: PLANS.pro_6m },
    { key: 'pro_1y', isFree: false, data: PLANS.pro_1y },
  ];

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-stone-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="relative w-full max-w-6xl max-h-[94vh] overflow-y-auto rounded-[32px] bg-[#FAF9F5] border border-stone-200 shadow-2xl p-6 sm:p-10 my-auto text-stone-900"
        style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}
      >
        {/* Nút Đóng tối giản phong cách Claude */}
        <button
          onClick={handleClose}
          type="button"
          className="absolute top-5 right-5 sm:top-7 sm:right-7 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 flex items-center justify-center transition-colors cursor-pointer z-20"
          aria-label="Đóng bảng giá"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── VIEW 1: LỰA CHỌN GÓI CƯỚC (CLAUDE.AI 4 CỘT) ── */}
        {view === 'selection' && (
          <div className="space-y-8 sm:space-y-10">
            {/* Header trung tâm thanh lịch */}
            <div className="text-center max-w-2xl mx-auto space-y-3 pr-8 sm:pr-0">
              <h2 className="text-2xl sm:text-4xl text-stone-900 tracking-tight font-serif font-normal">
                Plans that grow with you
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed">
                Đồng hành và bứt phá điểm số cùng kho bài đọc IELTS Cambridge, 38+ đề thi THPT và thuật toán ghi nhớ SRS ngắt quãng.
              </p>

              {/* Segmented control pill */}
              <div className="inline-flex items-center p-1 bg-stone-200/60 rounded-full border border-stone-200/80 text-xs font-medium text-stone-600 select-none">
                <span className="px-4 py-1 rounded-full bg-white text-stone-900 shadow-xs font-semibold">
                  Cá nhân
                </span>
                <span className="px-4 py-1 rounded-full text-stone-500 hover:text-stone-800 transition-colors cursor-pointer">
                  Đội nhóm &amp; Lớp học
                </span>
              </div>
            </div>

            {/* LƯỚI 4 CỘT CHUẨN CLAUDE.AI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
              {fourPlans.map((item) => {
                const isFree = item.isFree;
                const plan = item.data;
                const planId = item.key;
                const isRecommended = plan.recommended;
                const isSelected = selectedPlanId === planId;

                return (
                  <article
                    key={item.key}
                    onClick={() => !isFree && setSelectedPlanId(planId)}
                    className={`relative rounded-3xl bg-white p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 select-none ${
                      isRecommended
                        ? 'border-2 border-stone-900 shadow-lg ring-1 ring-stone-900/10'
                        : isSelected && !isFree
                        ? 'border-2 border-stone-800 shadow-md'
                        : 'border border-stone-200/90 shadow-xs hover:border-stone-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Badge nổi bật góc trên nếu có */}
                    {plan.badge && (
                      <div className="absolute -top-3 left-6 sm:left-7">
                        <span className="inline-block rounded-full bg-stone-900 text-white px-3 py-0.5 text-[11px] font-medium shadow-xs">
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    {/* Phần trên: Icon thực vật + Tên gói + Giá + Nút bấm */}
                    <div>
                      {/* Botanical Motif */}
                      <div className="pt-1 pb-4">
                        <ClaudePlantIcon level={plan.level} />
                      </div>

                      {/* Tên & Mô tả ngắn */}
                      <h3 className="text-xl font-bold text-stone-900 tracking-tight">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1 min-h-[1.25rem]">
                        {plan.subtitle}
                      </p>

                      {/* Giá tiền */}
                      <div className="mt-4 pt-2">
                        <div className="flex items-baseline gap-1 text-stone-900">
                          <span className="text-3xl sm:text-4xl font-normal tracking-tight font-sans">
                            {plan.priceNumber}
                          </span>
                          <span className="text-base font-normal text-stone-700">₫</span>
                          {!isFree && planId === 'pro_1m' && (
                            <span className="text-xs text-stone-500 ml-1">/ tháng</span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">
                          {plan.periodNote}
                        </p>
                      </div>

                      {/* Nút hành động chuẩn Claude.ai */}
                      <div className="mt-6">
                        {isFree ? (
                          <button
                            type="button"
                            onClick={handleClose}
                            className="w-full h-11 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-sm transition-colors cursor-pointer"
                          >
                            Dùng miễn phí
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleStartCheckout(planId)}
                            className={`w-full h-11 rounded-xl font-medium text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              isRecommended || isSelected
                                ? 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs active:scale-[0.99]'
                                : 'bg-stone-900 hover:bg-stone-800 text-white'
                            } disabled:opacity-50`}
                          >
                            {isLoading && selectedPlanId === planId ? (
                              <>
                                <RotateCcw className="w-4 h-4 animate-spin shrink-0" />
                                <span>Đang tạo đơn...</span>
                              </>
                            ) : (
                              <span>Nâng cấp {plan.name}</span>
                            )}
                          </button>
                        )}
                        <p className="text-[10px] text-stone-400 text-center mt-2">
                          {isFree ? 'Không cần thẻ thanh toán' : 'Kích hoạt tự động · VietQR PayOS'}
                        </p>
                      </div>
                    </div>

                    {/* Vạch ngăn cách mảnh */}
                    <div className="border-t border-stone-100 my-6" />

                    {/* Danh sách tính năng */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-stone-800">
                        {plan.featuresHeader}
                      </p>
                      <ul className="space-y-2.5">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-stone-600 leading-snug">
                            <Check className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Thông báo lỗi nếu có */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5 max-w-xl mx-auto">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Footer cam kết phong cách Claude */}
            <div className="pt-2 text-center text-xs text-stone-500 space-y-2">
              <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-stone-600" />
                  Bảo mật giao dịch qua Cổng thanh toán Quốc gia PayOS
                </span>
                <span>·</span>
                <span>Kích hoạt tài khoản PRO tự động 24/7 trong 30 giây</span>
                <span>·</span>
                <span className="text-emerald-700 font-medium">
                  Hoàn tiền trong 05 ngày làm việc nếu phát sinh lỗi
                </span>
              </div>
              <p className="text-stone-400 text-[11px]">
                Bạn muốn sử dụng vĩnh viễn không cần gia hạn?{' '}
                <button
                  type="button"
                  onClick={() => handleStartCheckout('pro_lifetime')}
                  className="text-stone-700 font-semibold underline underline-offset-2 hover:text-stone-900 cursor-pointer"
                >
                  Xem Gói Trọn Đời (499.000 ₫)
                </button>
                {' · '}
                <a
                  href="/terms.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-500 hover:text-stone-800 underline"
                >
                  Điều khoản hoàn tiền
                </a>
              </p>
            </div>
          </div>
        )}

        {/* ── VIEW 2: MÀN HÌNH QUÉT MÃ VIETQR (CLAUDE MINIMALIST CHECKOUT) ── */}
        {view === 'checkout' && orderData && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Thanh điều hướng quay lại */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <button
                type="button"
                onClick={() => setView('selection')}
                className="inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              >
                <span>←</span>
                <span>Quay lại chọn gói</span>
              </button>
              <div className="text-right">
                <span className="text-xs text-stone-500">Đơn hàng:</span>{' '}
                <span className="text-xs font-bold text-stone-900">{PLANS[selectedPlanId]?.name}</span>
              </div>
            </div>

            {/* Khung thanh toán VietQR Minimalist */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center gap-8">
              {/* QR Code Container */}
              {(() => {
                const qrImageSrc = getQrImageUrl(orderData, PLANS[selectedPlanId]?.amount);
                if (qrImageSrc) {
                  return (
                    <div className="flex flex-col items-center gap-3 shrink-0">
                      <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-center">
                        <img
                          src={qrImageSrc}
                          alt="VietQR PayOS"
                          className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-lg"
                        />
                      </div>
                      {orderData.checkoutUrl && (
                        <a
                          href={orderData.checkoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium transition-colors cursor-pointer"
                        >
                          <span>Mở trang thanh toán PayOS</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Thông tin chuyển khoản & copy */}
              <div className="flex-1 space-y-4 w-full text-xs">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 font-serif">
                    Quét mã để kích hoạt PRO
                  </h3>
                  <p className="text-stone-500 text-xs mt-0.5">
                    Mở ứng dụng ngân hàng bất kỳ để quét mã QR tự động.
                  </p>
                </div>

                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Số tiền:</span>
                    <span className="text-sm font-bold text-stone-900">
                      {PLANS[selectedPlanId]?.priceFormatted}
                    </span>
                  </div>

                  {orderData.accountNumber && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-500">Ngân hàng:</span>
                        <span className="font-semibold text-stone-800">
                          {orderData.bin === '970422' || !orderData.bin ? 'MBBank (Quân Đội)' : 'VietQR'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-stone-500">Số tài khoản:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-900">{orderData.accountNumber}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(orderData.accountNumber, 'acc')}
                            className="p-1 rounded hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                            title="Sao chép"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {orderData.accountName && (
                        <div className="flex justify-between items-center">
                          <span className="text-stone-500">Chủ tài khoản:</span>
                          <span className="font-semibold text-stone-800 uppercase">
                            {orderData.accountName}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Nội dung CK:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900">
                        {orderData.description || `HV${orderData.orderCode}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(orderData.description || `HV${orderData.orderCode}`, 'desc')}
                        className="p-1 rounded hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                        title="Sao chép"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Animated status listener */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-stone-100/70 text-stone-600 text-xs">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span>Đang tự động lắng nghe thanh toán... (Tự kích hoạt trong 3s)</span>
                </div>

                <p className="text-[11px] text-stone-500 text-center pt-1">
                  💡 Hỗ trợ đối soát & cam kết hoàn tiền 100% trong 05 ngày làm việc nếu xảy ra lỗi trừ tiền.{' '}
                  <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-800">
                    Chi tiết điều khoản
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 3: THÀNH CÔNG (SUCCESS VIEW) ── */}
        {view === 'success' && (
          <div className="text-center py-10 max-w-md mx-auto space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight">
                Chào mừng bạn đến với HiVocab PRO!
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Tài khoản của bạn đã được nâng cấp thành công. Toàn bộ kho bài đọc Cambridge IELTS và đề thi THPT Quốc Gia đã được mở khóa.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <span>Bắt đầu học ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PricingModal;
