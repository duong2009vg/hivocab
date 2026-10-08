// src/components/common/LanguageSwitcher.jsx
// Nút chuyển đổi ngôn ngữ chuẩn phong cách Cozy Crayon Handcrafted (Sáp màu & Thẻ ghim)
import React from 'react';
import { useLandingLang } from '../../context/LandingLangContext.jsx';

export function LanguageSwitcher({ className = '', compact = false }) {
  const { lang, setLang, isEn } = useLandingLang();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setLang(isEn ? 'vi' : 'en')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] hover:bg-[#FAF5EB] active:translate-y-0.5 active:shadow-none transition-all text-xs font-black text-[#3D352E] cursor-pointer ${className}`}
        title={isEn ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
      >
        <span className="text-sm">{isEn ? '🇬🇧' : '🇻🇳'}</span>
        <span>{isEn ? 'EN' : 'VI'}</span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center bg-white border-2 border-[#3D352E] shadow-[2.5px_2.5px_0px_#3D352E] rounded-full p-0.5 select-none ${className}`}
      role="group"
      aria-label="Language Selector"
    >
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-black rounded-full transition-all cursor-pointer ${
          isEn
            ? 'bg-[#3D352E] text-white shadow-2xs'
            : 'text-[#7A6A60] hover:text-[#3D352E] hover:bg-[#FAF5EB]'
        }`}
        title="English"
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>

      <button
        type="button"
        onClick={() => setLang('vi')}
        className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-black rounded-full transition-all cursor-pointer ${
          !isEn
            ? 'bg-[#3D352E] text-white shadow-2xs'
            : 'text-[#7A6A60] hover:text-[#3D352E] hover:bg-[#FAF5EB]'
        }`}
        title="Tiếng Việt"
      >
        <span>🇻🇳</span>
        <span>VI</span>
      </button>
    </div>
  );
}

export default LanguageSwitcher;
