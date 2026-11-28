// src/components/modals/PricingModal.jsx
// HiVocab 3-Tier Membership (Free / Pro / Premium) & PayOS / VietQR Checkout
// Multi-cycle billing (1m / 3m / 6m / 1y) with exact savings % and decoy anchoring
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
  ShieldCheck,
  Crown,
  Zap,
  Infinity as InfinityIcon,
} from 'lucide-react';
import { useModal } from '../../context/ModalContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { supabase } from '../../lib/supabaseClient.js';
import {
  BILLING_CYCLES,
  SUBSCRIPTION_PLANS,
  getPlanById,
  getPlanForTierAndCycle,
  formatVnd,
  formatVndNumber,
} from '../../config/plans.js';

function ClaudePlantIcon({ level = 1 }) {
  if (level === 1) {
    return (
      <svg className="w-9 h-9 text-[#3D352E] stroke-current shrink-0" viewBox="0 0 40 40" fill="none">
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
    return (
      <svg className="w-9 h-9 text-[#D95D39] stroke-current shrink-0" viewBox="0 0 40 40" fill="none">
        <line x1="20" y1="36" x2="20" y2="10" strokeWidth="1.85" strokeLinecap="round" />
        <circle cx="20" cy="7" r="3.5" strokeWidth="1.85" />
        <path d="M20 30C13 30 8 26 8 21" strokeWidth="1.85" strokeLinecap="round" />
        <circle cx="8" cy="21" r="2.5" strokeWidth="1.85" />
        <path d="M20 30C27 30 32 26 32 21" strokeWidth="1.85" strokeLinecap="round" />
        <circle cx="32" cy="21" r="2.5" strokeWidth="1.85" />
        <path d="M20 21C14 21 11 17 11 14" strokeWidth="1.85" strokeLinecap="round" />
        <circle cx="11" cy="14" r="2.5" strokeWidth="1.85" />
        <path d="M20 21C26 21 29 17 29 14" strokeWidth="1.85" strokeLinecap="round" />
        <circle cx="29" cy="14" r="2.5" strokeWidth="1.85" />
        <circle cx="20" cy="17" r="2" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg className="w-9 h-9 text-[#6B21A8] stroke-current shrink-0" viewBox="0 0 40 40" fill="none">
      <line x1="20" y1="36" x2="20" y2="8" strokeWidth="1.85" strokeLinecap="round" />
      <circle cx="20" cy="6" r="3.5" strokeWidth="1.85" />
      <path d="M20 31C12 31 6 26 6 21" strokeWidth="1.85" strokeLinecap="round" />
      <circle cx="6" cy="21" r="2.5" strokeWidth="1.85" />
      <path d="M20 31C28 31 34 26 34 21" strokeWidth="1.85" strokeLinecap="round" />
      <circle cx="34" cy="21" r="2.5" strokeWidth="1.85" />
      <path d="M20 23C13 23 9 18 9 14" strokeWidth="1.85" strokeLinecap="round" />
      <circle cx="9" cy="14" r="2.5" strokeWidth="1.85" />
      <path d="M20 23C27 23 31 18 31 14" strokeWidth="1.85" strokeLinecap="round" />
      <circle cx="31" cy="14" r="2.5" strokeWidth="1.85" />
      <path d="M20 15C16 15 14 12 14 10" strokeWidth="1.85" strokeLinecap="round" />
      <circle cx="14" cy="10" r="2" strokeWidth="1.85" />
      <path d="M20 15C24 15 26 12 26 10" strokeWidth="1.85" strokeLinecap="round" />
      <circle cx="26" cy="10" r="2" strokeWidth="1.85" />
    </svg>
  );
}

const REASON_BANNERS = {
  word_limit: {
    title: 'Bạn đã chạm mốc 1.000 từ vựng cá nhân của gói Free',
    desc: 'Nâng cấp HiVocab Pro chỉ từ 16.600 ₫/tháng để lưu trữ và ôn tập từ vựng không giới hạn!',
  },
  ai_shadowing_limit: {
    title: 'Bạn đã dùng hết lượt AI phân tích Shadowing hôm nay',
    desc: 'Nâng cấp lên Pro (500 lượt/ngày) hoặc Premium (không giới hạn) kèm làm ấm AI tức thì khi vào bài học.',
  },
  youtube_limit: {
    title: 'Bạn đã chạm giới hạn 5 video YouTube cá nhân',
    desc: 'Nâng cấp lên HiVocab Premium để tải lên không giới hạn video YouTube cá nhân và mở khóa toàn bộ AI.',
  },
};

const FREE_FEATURES = [
  'Truy cập rộng các khu học tập (Flashcard FSRS, Quiz, Studio, Đấu trường)',
  'Lưu tối đa 1.000 từ vựng cá nhân',
  'Tải lên tối đa 5 video YouTube cá nhân',
  '50 lượt / ngày AI chấm phát âm Shadowing (chạy khi bấm Chấm bài)',
  'Tra cứu từ điển song ngữ & kho học liệu miễn phí',
];

const PRO_FEATURES = [
  'Không giới hạn từ vựng lưu & ôn tập cá nhân',
  '500 lượt / ngày AI phân tích chấm Shadowing (gấp 10 lần Free)',
  'Tự động làm ấm AI ngay khi vào bài học (không chờ cold start)',
  'Tải lên tối đa 5 video YouTube cá nhân (giống bản Free)',
  'Mở khóa toàn bộ kho IELTS Cambridge & 38+ đề thi THPT Quốc Gia',
  'Đồng bộ tiến độ FSRS-6 trên mọi thiết bị, không quảng cáo',
];

const PREMIUM_FEATURES = [
  'Bao gồm toàn bộ quyền lợi của gói Pro, cộng thêm:',
  'Không giới hạn lượt AI chấm phát âm Shadowing mỗi ngày',
  'Không giới hạn tải lên video YouTube cá nhân',
  'Không giới hạn toàn bộ tính năng AI, từ điển & học liệu mới',
  'Ưu tiên làm ấm & xử lý AI tốc độ cao ngay khi mở bài học',
  'Huy hiệu HiVocab PREMIUM & hỗ trợ ưu tiên 1:1',
];

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
  const { tier: currentTier, refreshProfile } = useAuth();

  const modalData = modals?.pricingModal;
  const isOpen = Boolean(modalData?.open);

  const [billingCycle, setBillingCycle] = useState('6m'); // '1m' | '3m' | '6m' | '1y'
  const [selectedPlanId, setSelectedPlanId] = useState('pro_6m');
  const [view, setView] = useState('selection'); // 'selection' | 'checkout' | 'success'
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedField, setCopiedField] = useState('');

  const pollingRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const rawDefaultPlan = modalData?.defaultPlanId ? getPlanById(modalData.defaultPlanId) : null;
    if (rawDefaultPlan) {
      setBillingCycle(rawDefaultPlan.cycleId);
      setSelectedPlanId(rawDefaultPlan.id);
    } else {
      const targetTier = modalData?.defaultTier === 'premium' ? 'premium' : 'pro';
      const cycle = ['1m', '3m', '6m', '1y'].includes(modalData?.defaultCycle) ? modalData.defaultCycle : '6m';
      setBillingCycle(cycle);
      setSelectedPlanId(`${targetTier}_${cycle}`);
    }

    setView('selection');
    setOrderData(null);
    setErrorMessage('');
    setIsLoading(false);
    setLoadingPlanId('');
    setCopiedField('');
  }, [isOpen, modalData?.defaultPlanId, modalData?.defaultTier, modalData?.defaultCycle]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const proPlan = getPlanForTierAndCycle('pro', billingCycle);
  const premiumPlan = getPlanForTierAndCycle('premium', billingCycle);
  const activeCheckoutPlan = getPlanById(selectedPlanId) || proPlan;
  const activeCycleMeta = BILLING_CYCLES.find((c) => c.id === billingCycle) || BILLING_CYCLES[2];
  const reasonBanner = modalData?.reason ? REASON_BANNERS[modalData.reason] : null;
  const emphasizePremium = modalData?.defaultTier === 'premium' || modalData?.reason === 'youtube_limit';

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
    const planMeta = SUBSCRIPTION_PLANS[planToBuy];
    if (!planMeta) return;

    setSelectedPlanId(planToBuy);
    setLoadingPlanId(planToBuy);
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        toastError('Vui lòng đăng nhập tài khoản để nâng cấp gói học!');
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
                  if (planMeta.tier === 'premium') {
                    window._isUserPremium = true;
                  }
                }

                try {
                  if (typeof refreshProfile === 'function') {
                    await refreshProfile();
                  }
                } catch (refErr) {
                  console.warn('[PricingModal] refreshProfile exception:', refErr);
                }

                setView('success');
                success(`Nâng cấp ${planMeta.tier === 'premium' ? 'PREMIUM' : 'PRO'} thành công! Cảm ơn bạn`);

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
      setLoadingPlanId('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-5 bg-stone-900/55 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="relative w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-[28px] sm:rounded-[32px] bg-[#FAF8F2] border-2 border-[#3D352E] shadow-2xl p-5 sm:p-8 lg:p-10 my-auto text-[#2E2823]"
        style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          type="button"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white hover:bg-[#EFE7DA] border-2 border-[#3D352E]/20 hover:border-[#3D352E] text-[#554D42] hover:text-[#2E2823] flex items-center justify-center transition-colors cursor-pointer z-20"
          aria-label="Đóng bảng giá"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── VIEW 1: 3-TIER PLAN SELECTION (FREE / PRO / PREMIUM) ── */}
        {view === 'selection' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Header & Billing Cycle Switcher */}
            <div className="text-center max-w-3xl mx-auto space-y-3.5 pr-8 sm:pr-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE8C2] border border-[#3D352E]/25 text-[#8C5311] text-[11px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gói càng dài · Giá càng rẻ · Tiết kiệm tới 34%</span>
              </div>

              <h2 className="text-2xl sm:text-4xl text-[#2E2823] tracking-tight font-heading font-black">
                Chọn gói học phù hợp với bạn
              </h2>
              <p className="text-xs sm:text-sm text-[#6E5D53] font-medium leading-relaxed max-w-xl mx-auto">
                Khởi đầu miễn phí với đầy đủ công cụ, nâng cấp <strong className="text-[#2E2823]">Pro chỉ 25.000 ₫/tháng</strong> để mở khóa từ vựng không giới hạn &amp; 500 lượt chấm AI mỗi ngày.
              </p>

              {/* Context-aware trigger banner */}
              {reasonBanner && (
                <div className="mx-auto max-w-2xl px-4 py-2.5 rounded-2xl bg-[#FFF3D1] border-2 border-[#D9822B] text-left flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                  <div className="text-xs leading-snug">
                    <div className="font-black text-[#7C2D12]">{reasonBanner.title}</div>
                    <div className="font-semibold text-[#92400E] mt-0.5">{reasonBanner.desc}</div>
                  </div>
                </div>
              )}

              {/* 4-Cycle Billing Switcher */}
              <div className="pt-1 flex flex-col items-center gap-2">
                <div
                  role="tablist"
                  aria-label="Chọn thời hạn gói cước"
                  className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-[#EFE7DA] rounded-2xl border-2 border-[#3D352E]/15 select-none"
                >
                  {BILLING_CYCLES.map((cycle) => {
                    const active = billingCycle === cycle.id;
                    const proCyclePlan = getPlanForTierAndCycle('pro', cycle.id);
                    return (
                      <button
                        key={cycle.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setBillingCycle(cycle.id)}
                        className={`relative px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-[13px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                          active
                            ? 'bg-[#2E2823] text-white shadow-[0_2px_8px_rgba(46,40,35,0.22)]'
                            : 'text-[#554D42] hover:bg-white/70 hover:text-[#2E2823]'
                        }`}
                      >
                        <span>{cycle.label}</span>
                        {proCyclePlan.savingsPercent > 0 && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                              active
                                ? 'bg-[#4ADE80] text-[#14532D]'
                                : cycle.id === '1y'
                                ? 'bg-[#DCFCE7] text-[#166534]'
                                : 'bg-white text-[#4D6B53]'
                            }`}
                          >
                            -{proCyclePlan.savingsPercent}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11.5px] font-bold text-[#4D6B53] min-h-[1.25rem]">
                  {billingCycle === '1m' ? (
                    <span className="text-[#786F66]">
                      Mẹo: Chọn gói 3 tháng, 6 tháng hoặc 1 năm để tiết kiệm ngay từ <strong>13% đến 34%</strong>!
                    </span>
                  ) : (
                    <span>
                      Đang chọn <strong>{activeCycleMeta.label}</strong> · Tiết kiệm ngay{' '}
                      <strong>{proPlan.savingsPercent}%</strong> (Pro) và{' '}
                      <strong>{premiumPlan.savingsPercent}%</strong> (Premium) so với đóng lẻ 1 tháng!
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* 3-COLUMN GRID: FREE · PRO (HERO) · PREMIUM (DECOY) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch pt-2">
              {/* ── CARD 1: FREE ── */}
              <article className="relative rounded-[26px] bg-white border-2 border-[#E2D8C8] p-6 sm:p-7 flex flex-col justify-between transition-all">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-4">
                    <ClaudePlantIcon level={1} />
                    {currentTier === 'free' && (
                      <span className="px-2.5 py-1 rounded-full bg-[#EFE7DA] text-[#554D42] text-[10.5px] font-black uppercase tracking-wide">
                        Gói hiện tại
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-heading font-black text-[#2E2823] tracking-tight">
                    Free
                  </h3>
                  <p className="text-xs font-medium text-[#786F66] mt-1 min-h-[2rem]">
                    Truy cập rộng các tính năng của web để trải nghiệm &amp; xây thói quen học mỗi ngày.
                  </p>

                  {/* Price */}
                  <div className="mt-4 pt-3 border-t border-[#F0E9DC]">
                    <div className="flex items-baseline gap-1 text-[#2E2823]">
                      <span className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums">0</span>
                      <span className="text-base font-bold text-[#6E5D53]">₫</span>
                      <span className="text-xs font-semibold text-[#786F66] ml-1">/ mãi mãi</span>
                    </div>
                    <p className="text-[11px] font-semibold text-[#786F66] mt-1.5 min-h-[2.25rem]">
                      Miễn phí không cần thẻ thanh toán
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-full h-11 rounded-2xl bg-[#F3EDE2] hover:bg-[#E8DFCE] text-[#3D352E] font-extrabold text-sm border-2 border-[#3D352E]/15 transition-colors cursor-pointer"
                    >
                      {currentTier === 'free' ? 'Đang dùng miễn phí' : 'Tiếp tục học'}
                    </button>
                    <p className="text-[10.5px] text-[#8C7E71] text-center mt-2 font-semibold">
                      Nâng cấp bất kỳ lúc nào khi cần mở rộng
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#F0E9DC] my-5" />

                <div className="space-y-3 flex-1">
                  <p className="text-xs font-black text-[#2E2823] uppercase tracking-wide">
                    Quyền lợi &amp; Hạn mức:
                  </p>
                  <ul className="space-y-2.5">
                    {FREE_FEATURES.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs font-medium text-[#554D42] leading-snug">
                        <Check className="w-4 h-4 text-[#786F66] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>

              {/* ── CARD 2: PRO (TARGET HERO CONVERSION TIER) ── */}
              <article
                className={`relative rounded-[26px] bg-white p-6 sm:p-7 flex flex-col justify-between transition-all ${
                  !emphasizePremium
                    ? 'border-[3px] border-[#2E2823] shadow-[0_14px_34px_rgba(46,40,35,0.14)] lg:-translate-y-1.5 ring-2 ring-[#D95D39]/20'
                    : 'border-2 border-[#3D352E] shadow-md'
                }`}
              >
                {/* Top Popular Badge */}
                <div className="absolute -top-3.5 left-6 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#D95D39] text-white border-2 border-[#2E2823] px-3 py-0.5 text-[11px] font-black shadow-[2px_2px_0px_#2E2823]">
                    <Zap className="w-3 h-3 fill-current" />
                    <span>PHỔ BIẾN NHẤT</span>
                  </span>
                  {proPlan.savingsPercent > 0 && (
                    <span className="inline-flex items-center rounded-full bg-[#16A34A] text-white border-2 border-[#2E2823] px-2.5 py-0.5 text-[10.5px] font-black shadow-[2px_2px_0px_#2E2823]">
                      Tiết kiệm {proPlan.savingsPercent}%
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 pt-1 pb-4">
                    <ClaudePlantIcon level={2} />
                    {currentTier === 'pro' && (
                      <span className="px-2.5 py-1 rounded-full bg-[#FFE8C2] text-[#8C5311] border border-[#8C5311]/30 text-[10.5px] font-black uppercase tracking-wide">
                        Đang sử dụng
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-heading font-black text-[#2E2823] tracking-tight">
                      HiVocab Pro
                    </h3>
                    <span className="px-2 py-0.5 rounded-lg bg-[#FFF3D1] text-[#B45309] text-[10px] font-black uppercase">
                      Đáng mua nhất
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#6E5D53] mt-1 min-h-[2rem]">
                    Học từ không giới hạn &amp; 500 lượt chấm AI mỗi ngày — giá chỉ bằng 1/3 gói Premium.
                  </p>

                  {/* Dynamic Price Block */}
                  <div className="mt-4 pt-3 border-t border-[#F0E9DC]">
                    <div className="flex items-baseline gap-1 text-[#2E2823]">
                      <span className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums">
                        {formatVndNumber(proPlan.monthlyEquivalent)}
                      </span>
                      <span className="text-base font-bold text-[#3D352E]">₫</span>
                      <span className="text-xs font-bold text-[#6E5D53] ml-0.5">/ tháng</span>
                    </div>

                    <div className="mt-1.5 min-h-[2.25rem] space-y-1">
                      {proPlan.months > 1 ? (
                        <>
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="font-extrabold text-[#2E2823]">
                              Tổng: {formatVnd(proPlan.amount)}
                            </span>
                            <span className="line-through text-[#9A8E82] font-semibold">
                              {formatVnd(proPlan.originalAmount)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-[#DCFCE7] text-[#15803D] font-black text-[10.5px]">
                              -{proPlan.savingsPercent}% ({formatVnd(proPlan.savingsAmount)})
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-[#786F66]">
                            {proPlan.periodNote}
                          </p>
                        </>
                      ) : (
                        <p className="text-[11px] font-semibold text-[#786F66]">
                          Thanh toán linh hoạt 25.000 ₫ mỗi 30 ngày
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-5">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleStartCheckout(proPlan.id)}
                      className="w-full h-11 rounded-2xl bg-[#D95D39] hover:bg-[#C24D2B] text-white font-black text-sm border-2 border-[#2E2823] shadow-[3px_3px_0px_#2E2823] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isLoading && loadingPlanId === proPlan.id ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin shrink-0" />
                          <span>Đang tạo mã VietQR...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {currentTier === 'pro'
                              ? `Gia hạn Pro (${activeCycleMeta.label})`
                              : `Nâng cấp Pro · ${formatVnd(proPlan.amount)}`}
                          </span>
                          <ArrowRight className="w-4 h-4 shrink-0" />
                        </>
                      )}
                    </button>
                    <p className="text-[10.5px] text-[#786F66] text-center mt-2 font-semibold">
                      Kích hoạt tự động sau 3 giây · VietQR PayOS
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#F0E9DC] my-5" />

                <div className="space-y-3 flex-1">
                  <p className="text-xs font-black text-[#2E2823] uppercase tracking-wide">
                    Mở khóa cùng HiVocab Pro:
                  </p>
                  <ul className="space-y-2.5">
                    {PRO_FEATURES.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-[#3D352E] leading-snug">
                        <Check className="w-4 h-4 text-[#D95D39] shrink-0 mt-0.5 stroke-[2.5]" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>

              {/* ── CARD 3: PREMIUM (DECOY / HIGH-ANCHOR POWER TIER) ── */}
              <article
                className={`relative rounded-[26px] bg-gradient-to-b from-[#FBF7FF] via-white to-white p-6 sm:p-7 flex flex-col justify-between transition-all ${
                  emphasizePremium
                    ? 'border-[3px] border-[#6B21A8] shadow-[0_14px_34px_rgba(107,33,168,0.15)] lg:-translate-y-1.5'
                    : 'border-2 border-[#D8C5EE] hover:border-[#9333EA]/60'
                }`}
              >
                {/* Top Premium Badge */}
                <div className="absolute -top-3.5 left-6 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#6B21A8] text-white border-2 border-[#2E2823] px-3 py-0.5 text-[11px] font-black shadow-[2px_2px_0px_#2E2823]">
                    <InfinityIcon className="w-3.5 h-3.5" />
                    <span>KHÔNG GIỚI HẠN</span>
                  </span>
                  {premiumPlan.savingsPercent > 0 && (
                    <span className="inline-flex items-center rounded-full bg-[#DCFCE7] text-[#166534] border-2 border-[#2E2823] px-2.5 py-0.5 text-[10.5px] font-black">
                      -{premiumPlan.savingsPercent}%
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 pt-1 pb-4">
                    <ClaudePlantIcon level={3} />
                    {(currentTier === 'premium' || currentTier === 'lifetime') && (
                      <span className="px-2.5 py-1 rounded-full bg-[#F3E8FF] text-[#6B21A8] border border-[#6B21A8]/30 text-[10.5px] font-black uppercase tracking-wide">
                        Đang sử dụng
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-heading font-black text-[#2E2823] tracking-tight">
                      HiVocab Premium
                    </h3>
                    <Crown className="w-4 h-4 text-[#6B21A8] shrink-0" />
                  </div>
                  <p className="text-xs font-medium text-[#6E5D53] mt-1 min-h-[2rem]">
                    Mở khóa 100% không giới hạn AI, từ vựng &amp; video YouTube cho người học chuyên sâu.
                  </p>

                  {/* Dynamic Price Block */}
                  <div className="mt-4 pt-3 border-t border-[#EFE6FA]">
                    <div className="flex items-baseline gap-1 text-[#2E2823]">
                      <span className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums">
                        {formatVndNumber(premiumPlan.monthlyEquivalent)}
                      </span>
                      <span className="text-base font-bold text-[#3D352E]">₫</span>
                      <span className="text-xs font-bold text-[#6E5D53] ml-0.5">/ tháng</span>
                    </div>

                    <div className="mt-1.5 min-h-[2.25rem] space-y-1">
                      {premiumPlan.months > 1 ? (
                        <>
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="font-extrabold text-[#2E2823]">
                              Tổng: {formatVnd(premiumPlan.amount)}
                            </span>
                            <span className="line-through text-[#9A8E82] font-semibold">
                              {formatVnd(premiumPlan.originalAmount)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-[#F3E8FF] text-[#6B21A8] font-black text-[10.5px]">
                              -{premiumPlan.savingsPercent}% ({formatVnd(premiumPlan.savingsAmount)})
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-[#786F66]">
                            {premiumPlan.periodNote}
                          </p>
                        </>
                      ) : (
                        <p className="text-[11px] font-semibold text-[#786F66]">
                          Thanh toán 69.000 ₫ mỗi 30 ngày · Toàn quyền không giới hạn
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-5">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleStartCheckout(premiumPlan.id)}
                      className="w-full h-11 rounded-2xl bg-[#2E2823] hover:bg-[#1F1B17] text-white font-black text-sm border-2 border-[#2E2823] shadow-[3px_3px_0px_#6B21A8] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isLoading && loadingPlanId === premiumPlan.id ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin shrink-0" />
                          <span>Đang tạo mã VietQR...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {currentTier === 'premium'
                              ? `Gia hạn Premium (${activeCycleMeta.label})`
                              : `Chọn Premium · ${formatVnd(premiumPlan.amount)}`}
                          </span>
                          <ArrowRight className="w-4 h-4 shrink-0" />
                        </>
                      )}
                    </button>
                    <p className="text-[10.5px] text-[#786F66] text-center mt-2 font-semibold">
                      {currentTier === 'pro'
                        ? 'Quy đổi công bằng số ngày Pro còn dư khi nâng cấp'
                        : 'Kích hoạt tự động sau 3 giây · VietQR PayOS'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#EFE6FA] my-5" />

                <div className="space-y-3 flex-1">
                  <p className="text-xs font-black text-[#6B21A8] uppercase tracking-wide">
                    Đặc quyền không giới hạn:
                  </p>
                  <ul className="space-y-2.5">
                    {PREMIUM_FEATURES.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-[#3D352E] leading-snug">
                        <Check className="w-4 h-4 text-[#6B21A8] shrink-0 mt-0.5 stroke-[2.5]" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </div>

            {/* Error alert */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 max-w-xl mx-auto">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Trust Footer */}
            <div className="pt-2 text-center text-xs text-[#6E5D53] space-y-2">
              <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#4D6B53]" />
                  Cổng thanh toán PayOS VietQR bảo mật
                </span>
                <span>·</span>
                <span>Kích hoạt tài khoản tự động 24/7 trong 30 giây</span>
                <span>·</span>
                <span className="text-[#4D6B53] font-bold">
                  Hoàn tiền trong 05 ngày làm việc nếu phát sinh lỗi
                </span>
              </div>
              <p className="text-[#8C7E71] text-[11px]">
                Xem chi tiết{' '}
                <a
                  href="/terms.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#554D42] hover:text-[#2E2823] underline font-semibold"
                >
                  Điều khoản dịch vụ &amp; hoàn tiền
                </a>
                {' · '}
                <a
                  href="/privacy.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#554D42] hover:text-[#2E2823] underline font-semibold"
                >
                  Chính sách bảo mật
                </a>
              </p>
            </div>
          </div>
        )}

        {/* ── VIEW 2: VIETQR CHECKOUT ── */}
        {view === 'checkout' && orderData && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5DCCB]">
              <button
                type="button"
                onClick={() => setView('selection')}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#6E5D53] hover:text-[#2E2823] transition-colors cursor-pointer"
              >
                <span>←</span>
                <span>Quay lại chọn gói</span>
              </button>
              <div className="text-right">
                <span className="text-xs text-[#786F66]">Đơn hàng:</span>{' '}
                <span className="text-xs font-black text-[#2E2823]">
                  {activeCheckoutPlan?.name}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border-2 border-[#3D352E]/15 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center gap-8">
              {(() => {
                const qrImageSrc = getQrImageUrl(orderData, activeCheckoutPlan?.amount);
                if (qrImageSrc) {
                  return (
                    <div className="flex flex-col items-center gap-3 shrink-0">
                      <div className="p-3 bg-white rounded-2xl border-2 border-[#E5DCCB] shadow-xs flex items-center justify-center">
                        <img
                          src={qrImageSrc}
                          alt="VietQR PayOS"
                          className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-lg"
                        />
                      </div>
                      {/^https:\/\//i.test(String(orderData.checkoutUrl || '')) && (
                        <a
                          href={orderData.checkoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#6E5D53] hover:text-[#2E2823] font-bold transition-colors cursor-pointer"
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

              <div className="flex-1 space-y-4 w-full text-xs">
                <div>
                  <h3 className="text-lg font-heading font-black text-[#2E2823]">
                    Quét mã kích hoạt {activeCheckoutPlan?.tier === 'premium' ? 'PREMIUM' : 'PRO'}
                  </h3>
                  <p className="text-[#6E5D53] text-xs mt-0.5 font-medium">
                    Mở ứng dụng ngân hàng bất kỳ để quét mã QR chuyển khoản tự động.
                  </p>
                </div>

                <div className="bg-[#FAF8F2] rounded-2xl p-4 border border-[#E5DCCB] space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[#786F66] font-medium">Số tiền:</span>
                    <span className="text-sm font-black text-[#2E2823] tabular-nums">
                      {formatVnd(activeCheckoutPlan?.amount)}
                    </span>
                  </div>

                  {orderData.accountNumber && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[#786F66] font-medium">Ngân hàng:</span>
                        <span className="font-bold text-[#2E2823]">
                          {orderData.bin === '970422' || !orderData.bin ? 'MBBank (Quân Đội)' : 'VietQR'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[#786F66] font-medium">Số tài khoản:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#2E2823]">{orderData.accountNumber}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(orderData.accountNumber, 'acc')}
                            className="p-1 rounded hover:bg-[#EFE7DA] text-[#6E5D53] hover:text-[#2E2823] transition-colors cursor-pointer"
                            title="Sao chép"
                          >
                            {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {orderData.accountName && (
                        <div className="flex justify-between items-center">
                          <span className="text-[#786F66] font-medium">Chủ tài khoản:</span>
                          <span className="font-bold text-[#2E2823] uppercase">
                            {orderData.accountName}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-[#786F66] font-medium">Nội dung CK:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#2E2823]">
                        {orderData.description || `HV${orderData.orderCode}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(orderData.description || `HV${orderData.orderCode}`, 'desc')}
                        className="p-1 rounded hover:bg-[#EFE7DA] text-[#6E5D53] hover:text-[#2E2823] transition-colors cursor-pointer"
                        title="Sao chép"
                      >
                        {copiedField === 'desc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EEF5EC] text-[#355A3B] text-xs font-bold">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                  </span>
                  <span>Đang tự động lắng nghe thanh toán... (Tự kích hoạt trong 3 giây)</span>
                </div>

                <p className="text-[11px] text-[#786F66] text-center pt-1">
                  Hỗ trợ đối soát &amp; cam kết hoàn tiền 100% trong 05 ngày làm việc nếu xảy ra lỗi trừ tiền.{' '}
                  <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#2E2823]">
                    Chi tiết điều khoản
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 3: SUCCESS VIEW ── */}
        {view === 'success' && (
          <div className="text-center py-10 max-w-md mx-auto space-y-6">
            <div
              className={`w-16 h-16 rounded-full border-2 mx-auto flex items-center justify-center ${
                activeCheckoutPlan?.tier === 'premium'
                  ? 'bg-[#F3E8FF] border-[#6B21A8] text-[#6B21A8]'
                  : 'bg-[#EEF5EC] border-[#4D6B53] text-[#4D6B53]'
              }`}
            >
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-heading font-black text-[#2E2823] tracking-tight">
                Chào mừng bạn đến với {activeCheckoutPlan?.tier === 'premium' ? 'HiVocab PREMIUM' : 'HiVocab PRO'}!
              </h3>
              <p className="text-sm text-[#6E5D53] font-medium leading-relaxed">
                {activeCheckoutPlan?.tier === 'premium'
                  ? 'Tài khoản của bạn đã mở khóa toàn bộ đặc quyền không giới hạn: AI Shadowing, tải video YouTube, lưu từ vựng và toàn bộ kho IELTS/THPT.'
                  : 'Tài khoản của bạn đã mở khóa lưu từ vựng không giới hạn, 500 lượt chấm AI Shadowing/ngày (làm ấm sẵn tức thì) cùng toàn bộ kho IELTS & THPT.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3.5 rounded-2xl bg-[#2E2823] hover:bg-[#1F1B17] text-white font-black text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2"
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
