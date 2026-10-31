// src/components/common/CrayonProfileProCard.jsx
// Thẻ quản lý gói đăng ký PRO trên trang Hồ sơ cá nhân (PageProfile.jsx)
import React from 'react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import { CrayonProBadge } from './CrayonProBadge.jsx';
import { Crown, Sparkles, Calendar, Clock, RotateCcw, GraduationCap, ArrowRight } from 'lucide-react';

const PLAN_NAMES = {
  pro_1m: 'Gói 1 Tháng (Trải Nghiệm)',
  pro_6m: 'Gói 6 Tháng (Phổ Biến Nhất)',
  pro_1y: 'Gói 1 Năm (Tiết Kiệm Nhất)',
  pro_lifetime: 'Gói PRO Trọn Đời (Vĩnh Viễn)',
  lifetime: 'Gói PRO Trọn Đời (Vĩnh Viễn)',
};

export function CrayonProfileProCard({ className = '' }) {
  const { user, profile, isPaidPro: isPro, refreshProfile } = useAuth();
  const { openModal } = useModal();

  const handleOpenPricing = (planId = 'pro_6m') => {
    openModal('pricingModal', {
      defaultPlanId: planId,
      onSuccess: async () => {
        if (typeof refreshProfile === 'function') {
          await refreshProfile();
        }
      },
    });
  };

  const planId = String(profile?.subscription_plan || '').toLowerCase();
  const isLifetime =
    profile?.tier === 'lifetime' ||
    planId === 'pro_lifetime' ||
    planId === 'lifetime' ||
    (isPro && !profile?.subscription_expires_at);

  const expiresAt = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
  const startedAt = profile?.subscription_started_at ? new Date(profile.subscription_started_at) : null;

  // Tính số ngày còn lại
  let daysRemaining = 0;
  if (expiresAt) {
    const diffMs = expiresAt.getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  // Định dạng ngày Tiếng Việt dd/MM/yyyy
  const formatVietnameseDate = (dateObj) => {
    if (!dateObj || isNaN(dateObj.getTime())) return '—';
    return dateObj.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TRẠNG THÁI: THÀNH VIÊN TRỌN ĐỜI (LIFETIME)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isPro && isLifetime) {
    return (
      <section className={`bg-gradient-to-r from-[#FAF5EB] via-[#FFFDF9] to-[#F5EEFF] border-[2.5px] border-[#3D352E] shadow-crayon rounded-3xl p-6 relative overflow-hidden select-none ${className}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <Crown className="w-12 h-12 text-[#6B21A8] shrink-0" />
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
                <CrayonProBadge variant="lifetime" size="sm" />
                <span className="text-[11px] font-black text-[#5A7D4D] bg-[#E3EDE2] px-2.5 py-0.5 rounded-full border border-[#5A7D4D]/40">
                  Đang kích hoạt vĩnh viễn
                </span>
              </div>
              <h3 className="font-heading font-black text-xl text-[#3D352E]">
                Thành viên HiVocab PRO Trọn Đời
              </h3>
              <p className="font-quicksand text-xs font-semibold text-[#786F66] mt-0.5 max-w-lg">
                Bạn đang sở hữu đặc quyền tối cao của HiVocab! Không giới hạn thời gian, tự động mở khóa mọi bài đọc Cambridge và bộ đề thi THPT mới nhất mãi mãi.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <span className="px-4 py-2 rounded-2xl bg-[#F3E8FF] border-2 border-[#3D352E] shadow-crayonSm text-xs font-heading font-black text-[#6B21A8] inline-flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#6B21A8] shrink-0" />
              <span>Đặc quyền Vô Cực</span>
            </span>
          </div>
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. TRẠNG THÁI: THÀNH VIÊN PRO CÓ THỜI HẠN (ACTIVE PRO)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isPro && expiresAt) {
    const isUrgent = daysRemaining <= 15;
    const planDisplayName = PLAN_NAMES[planId] || 'Gói Thành Viên HiVocab PRO';

    return (
      <section className={`bg-gradient-to-r from-[#FFFDF9] via-[#FAF5EB] to-[#FFF8EE] border-[2.5px] border-[#3D352E] shadow-crayon rounded-3xl p-6 relative overflow-hidden select-none ${className}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Cột trái: Tên gói và thời hạn */}
          <div className="flex items-start gap-4 text-center md:text-left">
            <Crown className="w-12 h-12 text-[#8C5311] shrink-0" />
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap mb-1">
                <CrayonProBadge variant="crown" size="sm" />
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                  isUrgent
                    ? 'bg-[#FBECE7] text-[#C85A3F] border-[#C85A3F]/50 animate-pulse'
                    : 'bg-[#E3EDE2] text-[#4D6B53] border-[#4D6B53]/50'
                }`}>
                  {isUrgent ? `Sắp hết hạn (Còn ${daysRemaining} ngày)` : `Đang kích hoạt (Còn ${daysRemaining} ngày)`}
                </span>
              </div>
              <h3 className="font-heading font-black text-xl text-[#3D352E]">
                {planDisplayName}
              </h3>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-[#786F66] mt-2">
                {startedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#786F66] shrink-0" />
                    <span>Bắt đầu: {formatVietnameseDate(startedAt)}</span>
                  </span>
                )}
                <span className="flex items-center gap-1 text-[#3D352E]">
                  <Clock className="w-3.5 h-3.5 text-[#786F66] shrink-0" />
                  <span>Hết hạn: <strong className="text-[#C85A3F]">{formatVietnameseDate(expiresAt)}</strong></span>
                </span>
              </div>
            </div>
          </div>

          {/* Cột phải: Các nút Gia hạn / Nâng cấp Trọn Đời */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => handleOpenPricing('pro_6m')}
              className="w-full sm:w-auto py-2.5 px-5 bg-[#4D6B53] hover:bg-[#3D5642] text-white font-heading font-black text-xs rounded-2xl border-2 border-[#3D352E] shadow-crayonSm active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Gia hạn gói cước</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenPricing('pro_lifetime')}
              className="w-full sm:w-auto py-2.5 px-5 bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#6B21A8] font-heading font-black text-xs rounded-2xl border-2 border-[#3D352E] shadow-crayonSm active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5 shrink-0" />
              <span>Lên Trọn Đời</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. TRẠNG THÁI: TÀI KHOẢN MIỄN PHÍ (FREE TIER)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <section className={`bg-[#FAF5EB] border-2 border-[#3D352E] shadow-crayon rounded-3xl p-6 relative overflow-hidden select-none ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Nội dung bên trái */}
        <div className="flex items-center gap-4 text-center sm:text-left">
          <GraduationCap className="w-12 h-12 text-[#557A46] shrink-0" />
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#EFE7DA] text-[#3D352E] border border-[#3D352E]">
                Tài khoản Miễn Phí (Free Tier)
              </span>
            </div>
            <h3 className="font-heading font-black text-lg sm:text-xl text-[#3D352E]">
              Mở Khóa Toàn Bộ Đề Thi &amp; Bài Đọc Với HiVocab PRO
            </h3>
            <p className="font-quicksand text-xs font-semibold text-[#786F66] mt-0.5 max-w-xl">
              Nâng cấp gói PRO để đọc song ngữ Cambridge không giới hạn, làm 38+ đề thi THPT bấm giờ và lưu tiến độ học tập không quảng cáo.
            </p>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleOpenPricing('pro_6m')}
            className="w-full sm:w-auto py-3 px-6 bg-[#D96C4D] hover:bg-[#C85A3F] text-white font-heading font-black text-xs sm:text-sm rounded-2xl border-2 border-[#3D352E] shadow-crayon active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Nâng cấp PRO ngay</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default CrayonProfileProCard;
