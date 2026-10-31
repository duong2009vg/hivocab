// src/components/common/CrayonLockOverlay.jsx
// Lớp phủ khóa nội dung Pro phong cách sáp màu ấm áp Cozy Crayon
import React from 'react';
import { useModal } from '../../context/ModalContext.jsx';
import { Lock, Check } from 'lucide-react';

export function CrayonLockOverlay({
  title = 'Mở Khóa Toàn Bộ Bài Đọc & Đề Thi',
  description,
  message,
  badgeText = 'NỘI DUNG ĐỘC QUYỀN PRO',
  defaultPlanId = 'pro_6m',
  onUnlockSuccess,
  onUpgrade,
  onBack,
  backText = 'Quay lại danh sách',
  ctaText,
  upgradeText,
  mode = 'overlay', // 'overlay' | 'inline'
  children,
  className = '',
}) {
  const { openModal } = useModal();

  const effectiveDescription =
    description ||
    message ||
    'Nội dung này dành riêng cho thành viên HiVocab PRO. Nâng cấp ngay để đọc song ngữ Anh - Việt không giới hạn, tra cứu từ vựng học thuật theo ngữ cảnh và luyện trọn bộ kho đề thi THPT!';

  const effectiveCtaText = ctaText || upgradeText || 'Nâng Cấp PRO Ngay — Chỉ từ 25k/tháng';

  const handleOpenPricing = () => {
    if (typeof onUpgrade === 'function') {
      onUpgrade();
      return;
    }
    openModal('pricingModal', {
      defaultPlanId: defaultPlanId || 'pro_6m',
      onSuccess: onUnlockSuccess,
    });
  };

  const lockContentCard = (
    <div
      className={`relative max-w-md w-full mx-auto bg-[#FAF5EB] border-[3px] border-[#3D352E] rounded-[28px] shadow-[5px_7px_0px_#3D352E] p-6 sm:p-8 text-center select-none z-30 ${className}`}
      style={{
        backgroundImage: 'radial-gradient(#E8DFC8 1.2px, transparent 1.2px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Icon Ổ khóa dạng tách nền */}
      <Lock className="w-14 h-14 sm:w-16 sm:h-16 text-[#D96C4D] mx-auto mb-3.5 shrink-0" />

      {/* Huy hiệu sticker */}
      <span className="inline-block px-3 py-1 bg-[#FBECE7] text-[#C85A3F] border border-[#C85A3F]/40 rounded-full text-[11px] font-heading font-black uppercase tracking-wider mb-2.5 shadow-[1px_1px_0px_#3D352E]">
        {badgeText}
      </span>

      {/* Tiêu đề */}
      <h3 className="font-heading font-black text-xl sm:text-2xl text-[#3D352E] mb-2 leading-snug">
        {title}
      </h3>

      {/* Lời nhắn ấm áp */}
      <p className="font-quicksand text-xs sm:text-sm font-semibold text-[#786F66] leading-relaxed mb-6">
        {effectiveDescription}
      </p>

      {/* Danh sách micro perks */}
      <div className="bg-[#FFFDF9] border border-dashed border-[#C4B9AA] rounded-2xl p-3 mb-6 text-left space-y-1.5 text-xs font-bold text-[#3D352E]">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-[#4D6B53] shrink-0" />
          <span>Đọc song ngữ Anh - Việt đối chiếu từng câu</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-[#4D6B53] shrink-0" />
          <span>Kho 38+ đề thi THPT bấm giờ & giải chi tiết</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-[#4D6B53] shrink-0" />
          <span>Ghi nhớ dài hạn với thuật toán Spaced Repetition (SM-2)</span>
        </div>
      </div>

      {/* Nhóm nút bấm hành động */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleOpenPricing}
          className="w-full py-3.5 px-6 bg-[#D96C4D] hover:bg-[#C85A3F] text-white font-heading font-black text-sm rounded-2xl border-2 border-[#3D352E] shadow-crayon active:translate-y-1 active:shadow-crayonSm transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>{effectiveCtaText}</span>
        </button>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF5EB] text-[#3D352E] font-heading font-black text-xs rounded-xl border border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer"
          >
            {backText}
          </button>
        )}
      </div>
    </div>
  );

  // Nếu là chế độ Inline (nhúng trong trang)
  if (mode === 'inline') {
    return <div className="py-6 px-4 flex justify-center items-center w-full">{lockContentCard}</div>;
  }

  // Chế độ Overlay: Bao phủ trẻ em và làm mờ nền
  return (
    <div className="relative w-full h-full min-h-[360px] overflow-hidden rounded-3xl">
      {/* Lớp nội dung mờ phía sau */}
      {children && (
        <div className="filter blur-md select-none pointer-events-none opacity-25 transition-all">
          {children}
        </div>
      )}

      {/* Lớp màng mờ và Card khóa căn giữa */}
      <div className="absolute inset-0 z-20 bg-[#FAF5EB]/80 backdrop-blur-sm flex items-center justify-center p-4">
        {lockContentCard}
      </div>
    </div>
  );
}

export default CrayonLockOverlay;
