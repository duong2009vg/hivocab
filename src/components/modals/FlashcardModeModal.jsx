// src/components/modals/FlashcardModeModal.jsx
// 100% Cozy Crayon Handcrafted Theme - Flashcard Direction Selector (Anh-Việt / Việt-Anh)
import React, { useState, useEffect } from 'react';
import { useModal } from '../../context/ModalContext.jsx';
import { useRoute } from '../../router/RouteContext.jsx';

export function FlashcardModeModal() {
  const { modals, closeModal } = useModal();
  const { navigateTo } = useRoute();
  const isOpen = Boolean(modals?.flashcardMode?.open);
  const onSelect = modals?.flashcardMode?.onSelect;

  const [selectedMode, setSelectedMode] = useState(() => {
    try {
      return localStorage.getItem('hivocab_flashcard_mode') || 'en_vi';
    } catch {
      return 'en_vi';
    }
  });

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('hivocab_flashcard_mode');
        if (saved === 'en_vi' || saved === 'vi_en') {
          setSelectedMode(saved);
        }
      } catch (_) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStart = (modeToUse = selectedMode) => {
    try {
      localStorage.setItem('hivocab_flashcard_mode', modeToUse);
    } catch (_) {}

    if (typeof window !== 'undefined') {
      window._flashcardMode = modeToUse;
    }

    closeModal('flashcardMode');

    if (typeof onSelect === 'function') {
      onSelect(modeToUse);
    } else {
      if (typeof window !== 'undefined') {
        window._practiceMode = 0;
      }
      navigateTo('learning');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2825]/60 backdrop-blur-xs select-none"
      onClick={() => closeModal('flashcardMode')}
    >
      <div
        className="w-full max-w-md bg-[#FBF8F1] rounded-[28px] border-[3px] border-[#3D352E] shadow-[6px_8px_0px_#3D352E] p-5 sm:p-6 text-[#302A24] font-comfortaa relative animate-in fade-in zoom-in-95 duration-150"
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
              🎴
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#302A24] tracking-tight">
                Chế độ Flashcard
              </h2>
              <p className="text-[11px] sm:text-xs text-[#786F66] font-medium">
                Chọn chiều ôn tập phù hợp với mục tiêu của bạn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => closeModal('flashcardMode')}
            className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] flex items-center justify-center text-sm font-black text-[#302A24] transition-transform active:scale-90 cursor-pointer"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* 2 Options Cards */}
        <div className="space-y-3 mb-5">
          {/* OPTION 1: Anh -> Việt */}
          <div
            onClick={() => setSelectedMode('en_vi')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedMode === 'en_vi'
                ? 'bg-[#EFF6EE] border-[#4D6B53] shadow-[3px_4px_0px_#4D6B53]'
                : 'bg-white hover:bg-[#FAF6EE] border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇬🇧 ➔ 🇻🇳</span>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-black text-sm sm:text-base text-[#302A24]">
                      Flashcard Anh - Việt
                    </h3>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#E0F2E9] text-[#245E3A] border border-[#245E3A]/30">
                      Khuyên dùng ⭐
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6155] mt-1 leading-relaxed">
                    Mặt trước xem <strong>từ tiếng Anh, phát âm 🔊</strong>; lật mặt sau để xem <strong>nghĩa tiếng Việt</strong>.
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedMode === 'en_vi'
                    ? 'border-[#4D6B53] bg-[#4D6B53] text-white'
                    : 'border-[#8F8477] bg-white'
                }`}
              >
                {selectedMode === 'en_vi' && <span className="text-[10px] font-bold">✓</span>}
              </div>
            </div>

            {/* Quick Preview Pill */}
            <div className="mt-2.5 pt-2 border-t border-[#3D352E]/10 flex items-center justify-between text-[11px] text-[#786F66]">
              <span>Mặt trước: <strong className="text-[#302A24]">Reluctance /rɪˈlʌk.təns/</strong></span>
              <span>Mặt sau: <strong className="text-[#4D6B53]">Sự miễn cưỡng</strong></span>
            </div>
          </div>

          {/* OPTION 2: Việt -> Anh */}
          <div
            onClick={() => setSelectedMode('vi_en')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedMode === 'vi_en'
                ? 'bg-[#FFF7E8] border-[#C85A3F] shadow-[3px_4px_0px_#C85A3F]'
                : 'bg-white hover:bg-[#FAF6EE] border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇻🇳 ➔ 🇬🇧</span>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-black text-sm sm:text-base text-[#302A24]">
                      Flashcard Việt - Anh
                    </h3>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#92400E]/30">
                      Nhớ chủ động 🎯
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6155] mt-1 leading-relaxed">
                    Mặt trước xem <strong>nghĩa tiếng Việt</strong>; lật mặt sau để xem <strong>từ tiếng Anh &amp; phiên âm 🔊</strong>.
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedMode === 'vi_en'
                    ? 'border-[#C85A3F] bg-[#C85A3F] text-white'
                    : 'border-[#8F8477] bg-white'
                }`}
              >
                {selectedMode === 'vi_en' && <span className="text-[10px] font-bold">✓</span>}
              </div>
            </div>

            {/* Quick Preview Pill */}
            <div className="mt-2.5 pt-2 border-t border-[#3D352E]/10 flex items-center justify-between text-[11px] text-[#786F66]">
              <span>Mặt trước: <strong className="text-[#302A24]">Sự miễn cưỡng</strong></span>
              <span>Mặt sau: <strong className="text-[#C85A3F]">Reluctance /rɪˈlʌk.təns/</strong></span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => closeModal('flashcardMode')}
            className="w-1/3 py-2.5 px-3 rounded-2xl bg-white hover:bg-stone-100 text-[#302A24] font-bold text-xs sm:text-sm border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => handleStart(selectedMode)}
            className="w-2/3 py-2.5 px-4 rounded-2xl bg-[#4D6B53] hover:bg-[#3D5642] text-white font-black text-xs sm:text-sm border-2 border-[#3D352E] shadow-[3px_3px_0px_#3D352E] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Bắt đầu học</span>
            <span>🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default FlashcardModeModal;
