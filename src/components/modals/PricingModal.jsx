// src/components/modals/PricingModal.jsx
// 100% Pure React Modal for HiVocab PRO Membership & PayOS / VietQR Checkout
// Chuẩn phong cách Cozy Crayon Study Room (Sáp màu & Giấy thủ công)
import React, { useState, useEffect, useRef } from 'react';
import { 
  Crown, 
  X, 
  Check, 
  AlertTriangle, 
  ArrowRight, 
  Pin, 
  Sparkles, 
  RotateCcw, 
  Star 
} from 'lucide-react';
import { useModal } from '../../context/ModalContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { supabase } from '../../lib/supabaseClient.js';
import { CrayonProBadge } from '../common/CrayonProBadge.jsx';

const PLANS = {
  pro_1m: {
    id: 'pro_1m',
    name: 'Gói 1 Tháng',
    badge: 'Trải Nghiệm',
    badgeColor: 'bg-[#E3EDE2] text-[#4D6B53]',
    priceFormatted: '29.000đ',
    monthlyEquivalent: '29.000đ / tháng',
    savings: 'Dành cho người mới',
    amount: 29000,
  },
  pro_6m: {
    id: 'pro_6m',
    name: 'Gói 6 Tháng',
    badge: 'Phổ Biến Nhất',
    badgeColor: 'bg-[#FFE8C2] text-[#8C5311]',
    priceFormatted: '149.000đ',
    monthlyEquivalent: '~24.800đ / tháng',
    savings: 'Tiết kiệm 50%',
    amount: 149000,
    recommended: true,
  },
  pro_1y: {
    id: 'pro_1y',
    name: 'Gói 1 Năm',
    badge: 'Tiết Kiệm Nhất',
    badgeColor: 'bg-[#FBECE7] text-[#C85A3F]',
    priceFormatted: '249.000đ',
    monthlyEquivalent: '~20.700đ / tháng',
    savings: 'Tiết kiệm hơn 60%',
    amount: 249000,
  },
  pro_lifetime: {
    id: 'pro_lifetime',
    name: 'Gói Trọn Đời',
    badge: 'Vĩnh Viễn',
    badgeColor: 'bg-[#F3E8FF] text-[#6B21A8]',
    priceFormatted: '499.000đ',
    monthlyEquivalent: 'Dùng mãi mãi',
    savings: 'Không gia hạn thêm',
    amount: 499000,
  },
};

function getQrImageUrl(data, selectedPlanAmount) {
  if (!data) return null;

  // 1. Nếu data đã có sẵn URL ảnh hợp lệ (http hoặc https hoặc data:image)
  if (data.qrImageUrl && /^https?:\/\//i.test(data.qrImageUrl)) {
    return data.qrImageUrl;
  }
  if (data.qrCode && (/^https?:\/\//i.test(data.qrCode) || /^data:image/i.test(data.qrCode))) {
    return data.qrCode;
  }

  // 2. Tạo qua img.vietqr.io nếu có số tài khoản
  const bin = data.bin || '970422'; // 970422 là MBBank (PayOS default virtual account)
  const acc = data.accountNumber;
  const amount = data.amount || selectedPlanAmount || 0;
  const desc = encodeURIComponent(data.description || `HV${data.orderCode || ''}`);
  const accName = encodeURIComponent(data.accountName || '');
  if (acc) {
    return `https://img.vietqr.io/image/${bin}-${acc}-compact2.png?amount=${amount}&addInfo=${desc}&accountName=${accName}`;
  }

  // 3. Fallback: chuyển đổi raw EMVCo qrCode thành mã QR bằng qrserver
  if (data.qrCode && typeof data.qrCode === 'string') {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.qrCode)}`;
  }

  return null;
}

export function PricingModal({ onSuccess: propOnSuccess }) {
  const { modals, closeModal } = useModal();
  const { success, error: toastError } = useToast();
  const { user, refreshProfile } = useAuth();

  const modalData = modals?.pricingModal;
  const isOpen = Boolean(modalData?.open);

  const [selectedPlanId, setSelectedPlanId] = useState('pro_6m');
  const [view, setView] = useState('selection'); // 'selection' | 'checkout' | 'success'
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedField, setCopiedField] = useState('');

  const pollingRef = useRef(null);

  // Lắng nghe khi mở modal: đặt lại state và nhận defaultPlanId
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

  // Dọn dẹp polling khi unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    // Nếu đóng khi đã thanh toán thành công, kích hoạt callback mở khóa
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Khởi tạo đơn thanh toán với Cloudflare Function /api/payment/create-order
  // ─────────────────────────────────────────────────────────────────────────────
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

                // Đồng bộ biến window cho legacy code
                if (typeof window !== 'undefined') {
                  window._isUserPro = true;
                }

                // CẬP NHẬT TRẠNG THÁI REACT PROFILE TRONG AUTH PROVIDER NGAY TẠI CHỖ
                try {
                  if (typeof refreshProfile === 'function') {
                    await refreshProfile();
                  }
                } catch (refErr) {
                  console.warn('[PricingModal] refreshProfile exception:', refErr);
                }

                setView('success');
                success('Nâng cấp PRO thành công! Cảm ơn bạn');

                // Kích hoạt callback mở khóa tức thì nếu có
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

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-[32px] bg-[#FAF5EB] border-[3.5px] border-[#3D352E] shadow-[6px_8px_0px_#3D352E] p-5 sm:p-8 flex flex-col"
        style={{
          backgroundImage: 'radial-gradient(#E8DFC8 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Nút Đóng sáp màu tròn */}
        <button
          onClick={handleClose}
          type="button"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white hover:bg-[#FAF5EB] text-[#3D352E] border-2 border-[#3D352E] shadow-crayonSm active:translate-y-0.5 flex items-center justify-center transition-all cursor-pointer z-20 select-none"
          aria-label="Đóng bảng giá"
        >
          <X className="w-5 h-5 text-[#3D352E]" />
        </button>

        {/* ── VIEW 1: LỰA CHỌN GÓI CƯỚC ── */}
        {view === 'selection' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2 pr-8 sm:pr-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-black bg-[#FFE8C2] text-[#8C5311] border-2 border-[#3D352E] shadow-crayonSm rotate-[-1deg] select-none">
                <Crown className="w-3.5 h-3.5 text-[#8C5311] shrink-0" />
                <span>HIVOCAB PRO MEMBERSHIP</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#3D352E] tracking-tight">
                Bứt Phá Điểm Số Cùng HiVocab PRO
              </h2>
              <p className="font-quicksand text-xs sm:text-sm font-semibold text-[#786F66] max-w-xl mx-auto">
                Mở khóa toàn bộ kho bài đọc Cambridge IELTS song ngữ, 38+ đề thi THPT Quốc Gia và chế độ ôn tập lặp lại ngắt quãng (SM-2) không giới hạn.
              </p>
            </div>

            {/* Lưới 4 Thẻ Gói Cước Sáp Màu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
              {Object.values(PLANS).map((plan) => {
                const isSelected = plan.id === selectedPlanId;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative rounded-2xl border-2 border-[#3D352E] p-4 flex flex-col justify-between transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#FFF9F5] border-[3px] border-[#D96C4D] shadow-[4px_6px_0px_#3D352E] ring-2 ring-[#D96C4D]/30 -translate-y-1'
                        : 'bg-white shadow-crayonSm hover:-translate-y-0.5 hover:shadow-crayon'
                    }`}
                  >
                    {plan.badge && (
                      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-black border border-[#3D352E] shadow-[1px_1px_0px_#3D352E] ${plan.badgeColor} whitespace-nowrap`}>
                        {plan.badge}
                      </div>
                    )}

                    <div className="space-y-1.5 text-center pt-2">
                      <div className="text-xs font-heading font-black text-[#786F66] uppercase tracking-wide">
                        {plan.name}
                      </div>
                      <div className="text-2xl sm:text-[26px] font-heading font-black text-[#3D352E] tracking-tight">
                        {plan.priceFormatted}
                      </div>
                      <div className="text-[11px] font-bold text-[#D96C4D]">
                        {plan.monthlyEquivalent}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t-2 border-dashed border-[#EBE4D8] text-center">
                      <span className="text-[11px] font-bold text-[#786F66]">
                        {plan.savings}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hộp Quyền Lợi Độc Quyền PRO */}
            <div className="rounded-2xl bg-[#FFFDF9] border-2 border-dashed border-[#C4B9AA] p-4 sm:p-5 space-y-3">
              <div className="text-xs font-heading font-black uppercase tracking-wider text-[#3D352E] flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Đặc quyền dành riêng cho thành viên HiVocab PRO:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-bold text-[#3D352E]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4D6B53] shrink-0" />
                  <span>Toàn bộ bài đọc &amp; đề thi Cambridge IELTS song ngữ</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4D6B53] shrink-0" />
                  <span>Kho 38+ đề thi THPT Quốc Gia chuẩn ma trận Bộ GD&amp;ĐT</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4D6B53] shrink-0" />
                  <span>Thuật toán lặp lại ngắt quãng (SM-2) cá nhân hóa</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4D6B53] shrink-0" />
                  <span>Đồng bộ tiến độ học tập đa thiết bị, không quảng cáo</span>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-[#FBECE7] border border-[#C85A3F] text-[#C85A3F] text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C85A3F] shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Footer hành động */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs font-semibold text-[#786F66] text-center sm:text-left">
                Thanh toán quét mã VietQR tự động kích hoạt trong 30 giây.
              </div>
              <button
                type="button"
                onClick={handleStartCheckout}
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#D96C4D] hover:bg-[#C85A3F] text-white font-heading font-black text-sm border-2 border-[#3D352E] shadow-crayon active:translate-y-1 active:shadow-crayonSm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Đang kết nối PayOS...</span>
                  </>
                ) : (
                  <>
                    <span>Thanh toán ngay</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── VIEW 2: MÀN HÌNH QUÉT MÃ VIETQR PAYOS ── */}
        {view === 'checkout' && orderData && (
          <div className="space-y-5">
            {/* Thanh tiêu đề con */}
            <div className="flex items-center gap-3 pb-3 border-b-2 border-dashed border-[#EBE4D8]">
              <button
                type="button"
                onClick={() => setView('selection')}
                className="w-9 h-9 rounded-full bg-white hover:bg-[#FAF5EB] text-[#3D352E] border-2 border-[#3D352E] shadow-crayonSm flex items-center justify-center font-black cursor-pointer active:translate-y-0.5"
                title="Quay lại chọn gói"
              >
                ←
              </button>
              <div>
                <h3 className="font-heading font-black text-base sm:text-lg text-[#3D352E]">
                  Thanh toán {PLANS[selectedPlanId]?.name}
                </h3>
                <p className="text-xs text-[#D96C4D] font-bold">
                  Số tiền cần thanh toán: {PLANS[selectedPlanId]?.priceFormatted}
                </p>
              </div>
            </div>

            {/* Khung QR và Giấy Ghi Chú */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-4 sm:p-6 bg-white rounded-3xl border-2 border-[#3D352E] shadow-crayon">
              
              {/* Mã QR */}
              {(() => {
                const qrImageSrc = getQrImageUrl(orderData, PLANS[selectedPlanId]?.amount);
                if (qrImageSrc) {
                  return (
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="p-3.5 bg-white rounded-2xl border-2 border-[#3D352E] shadow-crayonSm shrink-0 flex items-center justify-center min-w-[230px] min-h-[230px]">
                        <img
                          src={qrImageSrc}
                          alt="VietQR PayOS"
                          className="w-56 h-56 sm:w-60 sm:h-60 object-contain rounded-lg"
                          onError={(e) => {
                            if (orderData.qrCode && !e.currentTarget.dataset.fallbackTried) {
                              e.currentTarget.dataset.fallbackTried = '1';
                              e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(orderData.qrCode)}`;
                            } else if (orderData.qrCode && !e.currentTarget.dataset.quickchartTried) {
                              e.currentTarget.dataset.quickchartTried = '1';
                              e.currentTarget.src = `https://quickchart.io/qr?size=250&text=${encodeURIComponent(orderData.qrCode)}`;
                            }
                          }}
                        />
                      </div>
                      {orderData.checkoutUrl && (
                        <a
                          href={orderData.checkoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-[#4D6B53] hover:text-[#3D5642] hover:underline flex items-center gap-1 cursor-pointer pt-0.5"
                        >
                          <span>Mở trang thanh toán PayOS</span>
                          <span>↗</span>
                        </a>
                      )}
                    </div>
                  );
                }
                if (orderData.checkoutUrl) {
                  return (
                    <div className="text-center py-8">
                      <a
                        href={orderData.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3.5 bg-[#4D6B53] hover:bg-[#3D5642] text-white rounded-2xl font-heading font-black text-sm border-2 border-[#3D352E] shadow-crayonSm inline-flex items-center gap-2"
                      >
                        <span>Mở trang thanh toán PayOS</span>
                        <span>↗</span>
                      </a>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Tờ Giấy Note Vàng Hướng Dẫn */}
              <div className="space-y-3.5 text-xs text-[#3D352E] flex-1 max-w-sm">
                <div className="p-4 rounded-2xl bg-[#FFF9E6] border-2 border-[#3D352E] shadow-crayonSm">
                  <p className="font-heading font-black flex items-center gap-1.5 mb-1.5 text-sm text-[#8C5311]">
                    <Pin className="w-3.5 h-3.5 text-[#8C5311] shrink-0" />
                    <span>Hướng dẫn chuyển khoản:</span>
                  </p>
                  <p className="font-quicksand font-semibold leading-relaxed text-[#786F66]">
                    Mở ứng dụng Ngân hàng hoặc ví điện tử bất kỳ, chọn <strong>Quét mã QR</strong> để hệ thống tự điền chính xác số tiền và nội dung.
                  </p>
                </div>

                {/* Thông tin đơn hàng */}
                <div className="space-y-2 font-mono text-xs p-3.5 rounded-2xl bg-[#FAF5EB] border-2 border-[#3D352E]">
                  {orderData.accountNumber && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[#786F66] font-sans font-bold">Ngân hàng:</span>
                        <span className="font-black text-[#3D352E] font-sans">
                          {orderData.bin === '970422' || !orderData.bin ? 'MBBank (Quân Đội)' : 'VietQR'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#786F66] font-sans font-bold">Số tài khoản:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-[#3D352E]">{orderData.accountNumber}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(orderData.accountNumber, 'acc')}
                            className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-white border border-[#3D352E] cursor-pointer"
                          >
                            {copiedField === 'acc' ? 'Đã chép' : 'Chép'}
                          </button>
                        </div>
                      </div>
                      {orderData.accountName && (
                        <div className="flex justify-between items-center">
                          <span className="text-[#786F66] font-sans font-bold">Chủ tài khoản:</span>
                          <span className="font-black text-[#3D352E] font-sans uppercase">
                            {orderData.accountName}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-[#786F66] font-sans font-bold">Mã đơn hàng:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-[#3D352E]">{orderData.orderCode}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(orderData.orderCode, 'orderCode')}
                        className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-white border border-[#3D352E] cursor-pointer"
                      >
                        {copiedField === 'orderCode' ? 'Đã chép' : 'Chép'}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#786F66] font-sans font-bold">Nội dung CK:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-[#D96C4D]">{orderData.description || `HV${orderData.orderCode}`}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(orderData.description || `HV${orderData.orderCode}`, 'desc')}
                        className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-white border border-[#3D352E] cursor-pointer"
                      >
                        {copiedField === 'desc' ? 'Đã chép' : 'Chép'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Trạng thái lắng nghe với Bé Hổ mascot */}
                <div className="flex items-center gap-2.5 text-xs font-bold text-[#786F66] p-2 rounded-xl bg-white border border-[#3D352E]/30">
                  <div className="w-6 h-6 shrink-0 rounded-full overflow-hidden border border-[#3D352E]">
                    <img
                      src="/mascot/mascot_cozy.png"
                      alt="Mascot"
                      className="w-full h-full object-cover animate-pulse"
                    />
                  </div>
                  <span>Đang tự động lắng nghe thanh toán qua PayOS...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 3: THÀNH CÔNG (SUCCESS VIEW) ── */}
        {view === 'success' && (
          <div className="text-center py-8 space-y-6">
            {/* Bé Hổ mascot chúc mừng */}
            <div className="w-28 h-28 mx-auto relative">
              <div className="w-full h-full rounded-3xl bg-[#E3EDE2] border-2 border-[#3D352E] shadow-crayon flex items-center justify-center p-2">
                <img
                  src="/mascot/mascot_celebrating.png"
                  alt="Bé Hổ Chúc Mừng"
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.src = '/mascot/mascot_cozy.png'; }}
                />
              </div>
              <Sparkles className="w-7 h-7 text-amber-500 absolute -top-2 -right-2 select-none" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-heading font-black text-[#3D352E]">
                Nâng Cấp PRO Thành Công!
              </h3>
              <p className="font-quicksand text-sm font-semibold text-[#786F66] max-w-md mx-auto leading-relaxed">
                Bé Hổ chúc mừng bạn đã chính thức gia nhập <strong>HiVocab PRO</strong>! Toàn bộ bài đọc IELTS Cambridge và 38+ đề thi THPT đã được mở khóa ngay bây giờ.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="py-3.5 px-10 rounded-2xl bg-[#4D6B53] hover:bg-[#3D5642] text-white font-heading font-black text-sm border-2 border-[#3D352E] shadow-crayon active:translate-y-1 active:shadow-crayonSm transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Bắt đầu học ngay</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PricingModal;
