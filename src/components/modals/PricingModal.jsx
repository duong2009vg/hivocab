// src/components/modals/PricingModal.jsx
// 100% Pure React Modal for HiVocab PRO Membership & PayOS / VietQR Checkout
import React, { useState, useEffect, useRef } from 'react';
import { useModal } from '../../context/ModalContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { supabase } from '../../lib/supabaseClient.js';

const PLANS = {
  pro_1m: {
    id: 'pro_1m',
    name: 'Gói 1 Tháng',
    badge: 'Trải Nghiệm',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    priceFormatted: '29.000đ',
    monthlyEquivalent: '29.000đ / tháng',
    savings: 'Giá siêu rẻ',
    amount: 29000,
  },
  pro_6m: {
    id: 'pro_6m',
    name: 'Gói 6 Tháng',
    badge: '⭐ Phổ Biến Nhất',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    priceFormatted: '149.000đ',
    monthlyEquivalent: '~24.800đ / tháng',
    savings: 'Đúng chuẩn 25k/tháng',
    amount: 149000,
    recommended: true,
  },
  pro_1y: {
    id: 'pro_1y',
    name: 'Gói 1 Năm',
    badge: '🔥 Tiết Kiệm Nhất',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    priceFormatted: '249.000đ',
    monthlyEquivalent: '~20.700đ / tháng',
    savings: 'Tiết kiệm hơn 40%',
    amount: 249000,
  },
  pro_lifetime: {
    id: 'pro_lifetime',
    name: 'Gói Trọn Đời',
    badge: '👑 Vĩnh Viễn',
    badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    priceFormatted: '499.000đ',
    monthlyEquivalent: 'Mua 1 lần dùng mãi mãi',
    savings: 'Không gia hạn thêm',
    amount: 499000,
  },
};

export function PricingModal() {
  const { modals, closeModal } = useModal();
  const { success, error: toastError } = useToast();

  const isOpen = Boolean(modals?.pricingModal?.open);

  const [selectedPlanId, setSelectedPlanId] = useState('pro_6m');
  const [view, setView] = useState('selection'); // 'selection' | 'checkout' | 'success'
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const pollingRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }
    setView('selection');
    setSelectedPlanId('pro_6m');
    setOrderData(null);
    setErrorMessage('');
    setIsLoading(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    closeModal('pricingModal');
  };

  const handleStartCheckout = async () => {
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
        body: JSON.stringify({ planId: selectedPlanId }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Không thể khởi tạo thanh toán với cổng PayOS.');
      }

      setOrderData(data);
      setView('checkout');

      // Bắt đầu polling kiểm tra trạng thái đơn hàng mỗi 3 giây
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
                setView('success');
                success('Nâng cấp PRO thành công! Cảm ơn bạn 🎉');
                if (typeof window !== 'undefined') {
                  window._isUserPro = true;
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

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-3xl bg-surface border border-outline-variant/30 shadow-2xl p-5 sm:p-8 flex flex-col">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="Đóng"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* ── VIEW 1: Lựa chọn gói cước ── */}
        {view === 'selection' && (
          <div className="space-y-6">
            <div className="text-center space-y-2 pr-8 sm:pr-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[15px]">diamond</span>
                <span>HiVocab PRO Membership</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
                Bứt Phá Điểm Số &amp; Làm Chủ Từ Vựng
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl mx-auto">
                Mở khóa toàn bộ kho tài liệu IELTS Cambridge, Destination C1-C2, SAT và tính năng học Spaced Repetition không giới hạn.
              </p>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {Object.values(PLANS).map((plan) => {
                const isSelected = plan.id === selectedPlanId;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative rounded-2xl border p-4 flex flex-col justify-between transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/[0.04]'
                        : 'border-outline-variant/30 hover:border-amber-500/50 bg-surface-container-low'
                    }`}
                  >
                    {plan.badge && (
                      <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${plan.badgeColor} whitespace-nowrap`}>
                        {plan.badge}
                      </div>
                    )}

                    <div className="space-y-2 text-center pt-1">
                      <div className="text-xs font-bold text-outline uppercase tracking-wider">{plan.name}</div>
                      <div className="text-2xl font-black text-on-surface tracking-tight">{plan.priceFormatted}</div>
                      <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">{plan.monthlyEquivalent}</div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-outline-variant/15 text-center">
                      <span className="text-[10px] font-medium text-on-surface-variant">{plan.savings}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quyền lợi PRO */}
            <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-4 sm:p-5 space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-outline">
                Quyền lợi độc quyền của thành viên PRO:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-on-surface">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                  <span>Toàn bộ đề thi &amp; bài đọc Cambridge IELTS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                  <span>Kho từ vựng Destination C1-C2, SAT, Actual Tests</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                  <span>Thuật toán lặp lại ngắt quãng (SM-2) cá nhân hóa</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                  <span>Đồng bộ tiến độ học tập đa thiết bị</span>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-error-container text-error text-xs font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-on-surface-variant">
                Thanh toán quét mã VietQR tự động kích hoạt trong 30s.
              </div>
              <button
                type="button"
                onClick={handleStartCheckout}
                disabled={isLoading}
                className="px-7 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                    <span>Đang kết nối PayOS...</span>
                  </>
                ) : (
                  <>
                    <span>Thanh toán ngay</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── VIEW 2: Màn hình quét mã VietQR PayOS ── */}
        {view === 'checkout' && orderData && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/15">
              <button
                type="button"
                onClick={() => setView('selection')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div>
                <h3 className="text-base font-bold text-on-surface">
                  Thanh toán {PLANS[selectedPlanId]?.name}
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                  Số tiền: {PLANS[selectedPlanId]?.priceFormatted}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30">
              {orderData.qrCode ? (
                <div className="p-3 bg-white rounded-2xl shadow-md shrink-0">
                  <img src={orderData.qrCode} alt="VietQR PayOS" className="w-56 h-56 object-contain" />
                </div>
              ) : orderData.checkoutUrl ? (
                <div className="text-center py-6">
                  <a
                    href={orderData.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm inline-flex items-center gap-2"
                  >
                    <span>Mở trang thanh toán PayOS</span>
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  </a>
                </div>
              ) : null}

              <div className="space-y-3 text-xs text-on-surface-variant flex-1 max-w-sm">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                  <p className="font-bold flex items-center gap-1 mb-1">
                    <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                    <span>Hướng dẫn chuyển khoản:</span>
                  </p>
                  <p>Mở ứng dụng Ngân hàng bất kỳ, chọn <strong>Quét mã QR</strong> để thanh toán chính xác số tiền và nội dung.</p>
                </div>

                <div className="space-y-1.5 font-mono text-[11px] p-3 rounded-xl bg-surface border border-outline-variant/20">
                  <div className="flex justify-between">
                    <span className="text-outline">Mã đơn hàng:</span>
                    <span className="font-bold text-on-surface">{orderData.orderCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Nội dung CK:</span>
                    <span className="font-bold text-primary">{orderData.description || `HV${orderData.orderCode}`}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-outline">
                  <span className="material-symbols-outlined text-[15px] animate-spin text-primary">sync</span>
                  <span>Hệ thống đang tự động lắng nghe thanh toán...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 3: Thành công ── */}
        {view === 'success' && (
          <div className="text-center py-8 space-y-5">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <span className="material-symbols-outlined text-5xl">verified</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-on-surface">
                Nâng Cấp PRO Thành Công! 🎉
              </h3>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                Cảm ơn bạn đã đồng hành cùng HiVocab. Toàn bộ tính năng cao cấp đã được mở khóa ngay bây giờ!
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="py-3 px-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
              >
                Bắt đầu học ngay 🚀
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PricingModal;
