// src/components/modals/RequireLoginModal.jsx
// 100% Cozy Crayon Handcrafted Theme - Modal thông báo yêu cầu đăng nhập cho khách
import React from 'react';
import { useModal } from '../../context/ModalContext.jsx';
import { useRoute } from '../../router/RouteContext.jsx';

export function RequireLoginModal() {
  const { modals, closeModal } = useModal();
  const { navigateTo } = useRoute();

  const modalState = modals?.requireLogin;
  const isOpen = Boolean(modalState?.open);

  if (!isOpen) return null;

  const title = modalState?.title || 'Đăng nhập để tiếp tục 🐾';
  const message =
    modalState?.message ||
    'Bạn cần đăng nhập hoặc tạo tài khoản để lưu từ vựng, đồng bộ tiến độ học và sử dụng các tính năng nâng cao nhé!';
  const actionName = modalState?.actionName || null;

  const handleGoToLogin = (mode = 'login') => {
    if (typeof window !== 'undefined') {
      window._initialAuthMode = mode;
    }
    closeModal('requireLogin');
    navigateTo('login');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2825]/60 backdrop-blur-xs select-none"
      onClick={() => closeModal('requireLogin')}
    >
      <div
        className="w-full max-w-md bg-[#FBF8F1] rounded-[28px] border-[3px] border-[#3D352E] shadow-[6px_8px_0px_#3D352E] p-6 text-[#302A24] font-comfortaa relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage: 'radial-gradient(#D6CEC2 1.2px, transparent 1.2px)',
          backgroundSize: '18px 18px',
        }}
      >
        {/* Header Ribbon */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#E5DAC6]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF5E6] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center text-xl">
              🐯
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#302A24] tracking-tight">
                {title}
              </h2>
              <span className="inline-block text-[10px] font-bold text-[#8A796F] uppercase tracking-wider">
                Chế độ khách trải nghiệm
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => closeModal('requireLogin')}
            className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] flex items-center justify-center text-sm font-black text-[#302A24] transition-transform active:scale-90 cursor-pointer"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Center Mascot & Content */}
        <div className="flex flex-col items-center text-center py-2 px-1">
          <div className="relative mb-3 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-orange-100/60 border-2 border-dashed border-[#DE5D53]/40 absolute"></div>
            <img
              src="/mascot/mascot_cozy.png"
              alt="Bé Hổ HiVocab"
              className="w-24 h-24 object-contain relative z-10 mix-blend-multiply drop-shadow-sm select-none"
            />
            <span className="absolute -top-1 -right-1 text-xl animate-bounce">✨</span>
          </div>

          {actionName && (
            <div className="mb-2 px-3 py-1 rounded-full bg-[#FAF0E6] border border-[#3D352E]/20 text-xs font-bold text-[#C85A3F]">
              Tính năng: {actionName}
            </div>
          )}

          <p className="text-xs sm:text-sm text-[#5C5046] font-semibold leading-relaxed mb-5">
            {message}
          </p>

          {/* Quick Perks Pill */}
          <div className="w-full bg-white rounded-2xl border-2 border-[#3D352E] p-3 mb-5 text-left text-xs space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 text-[#3D352E] font-bold">
              <span className="text-[#609966]">✓</span>
              <span>Lưu và đồng bộ từ vựng cá nhân vĩnh viễn</span>
            </div>
            <div className="flex items-center gap-2 text-[#3D352E] font-bold">
              <span className="text-[#609966]">✓</span>
              <span>Ghi nhận chu kỳ ngắt quãng SRS & giữ streak học tập 🔥</span>
            </div>
            <div className="flex items-center gap-2 text-[#3D352E] font-bold">
              <span className="text-[#609966]">✓</span>
              <span>Dùng AI đặt câu ví dụ và giải thích từ chuyên sâu</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleGoToLogin('login')}
            className="w-full py-3 px-4 rounded-2xl bg-[#D96B43] hover:bg-[#C85A3F] text-white font-black text-sm border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Đăng nhập ngay</span>
            <span>🔑</span>
          </button>

          <button
            type="button"
            onClick={() => handleGoToLogin('signup')}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#EAF2E8] hover:bg-[#DDEBD9] text-[#2F5233] font-black text-sm border-2 border-[#3D352E] shadow-[2px_3px_0px_#3D352E] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Tạo tài khoản mới (Miễn phí)</span>
            <span>✨</span>
          </button>

          <button
            type="button"
            onClick={() => closeModal('requireLogin')}
            className="w-full py-2 text-center text-xs font-bold text-[#8A796F] hover:text-[#3D352E] transition-colors cursor-pointer"
          >
            Để sau, tôi muốn tiếp tục xem thử
          </button>
        </div>
      </div>
    </div>
  );
}

export default RequireLoginModal;
