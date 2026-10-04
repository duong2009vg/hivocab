// src/components/bilingual/BilingualHeader.jsx
// Header & Navigation cho bài đọc song ngữ - Phong cách Cozy Crayon ấm áp

import React, { useState } from 'react';
import { BilingualPassageSwitcher } from './BilingualPassageSwitcher.jsx';

export function BilingualHeader({
  passage,
  activeTab,
  onTabChange,
  viewMode,
  onViewModeChange,
  fontSize,
  onChangeFontSize,
  onClose,
  onReportError,
  onSelectPassage,
}) {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const title = passage?.title || `Passage ${passage?.passageNumber || ''}`;
  const topicTxt = passage?.topicName || 'IELTS';
  const testTxt = passage?.testName || 'Test';
  const passTxt = `Passage ${passage?.passageNumber || ''}`;
  const metaText = `${topicTxt} · ${testTxt} · ${passTxt}`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-b-2 border-[#382E2B] px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 shadow-[0_2px_0px_#382E2B] select-none">
        {/* Left: Back button & Breadcrumb Title with Quick Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] text-[#382E2B] hover:bg-[#FAF5EB] active:translate-y-0.5 transition-all shrink-0 cursor-pointer"
            title="Quay lại"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div className="min-w-0 relative">
            <div className="flex items-center gap-1.5">
              <h1 className="font-heading font-black text-sm sm:text-base md:text-lg text-[#382E2B] truncate leading-tight">
                {title}
              </h1>
              <button
                type="button"
                onClick={() => setIsSwitcherOpen((prev) => !prev)}
                className="w-6 h-6 rounded-lg bg-[#FAF5EB] border border-[#382E2B]/40 hover:border-[#382E2B] text-[#382E2B] flex items-center justify-center transition-colors shrink-0 cursor-pointer text-xs font-bold"
                title="Đổi bài đọc khác trong bộ đề"
              >
                ▼
              </button>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-[#766C5F] truncate mt-0.5">
              {metaText}
            </p>

            {/* Dropdown menu switcher */}
            <BilingualPassageSwitcher
              isOpen={isSwitcherOpen}
              onClose={() => setIsSwitcherOpen(false)}
              currentPassageId={passage?.id}
              onSelectPassage={onSelectPassage}
            />
          </div>
        </div>

        {/* Center: Tab Switcher (Đọc chủ động vs Đục lỗ) */}
        <div className="flex bg-[#F4EFE6] rounded-2xl p-1 border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('reading')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm transition-all active:scale-95 cursor-pointer ${
              activeTab === 'reading'
                ? 'bg-[#5a7d4d] text-white font-black shadow-xs'
                : 'text-[#766C5F] hover:text-[#382E2B] font-bold'
            }`}
          >
            <span>📖</span>
            <span className="hidden sm:inline">Đọc chủ động</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('gap-fill')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm transition-all active:scale-95 cursor-pointer ${
              activeTab === 'gap-fill'
                ? 'bg-[#5a7d4d] text-white font-black shadow-xs'
                : 'text-[#766C5F] hover:text-[#382E2B] font-bold'
            }`}
          >
            <span>✏️</span>
            <span className="hidden sm:inline">Đục lỗ song ngữ</span>
          </button>
        </div>

        {/* Right: Tools + Prominent Exit Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Desktop Tools only shown in Reading mode */}
          {activeTab === 'reading' && (
            <div className="hidden md:flex items-center gap-2">
              {/* Font size adjustment */}
              <div className="flex items-center bg-[#F4EFE6] rounded-2xl p-1 border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] text-xs font-black text-[#382E2B]">
                <button
                  type="button"
                  onClick={() => onChangeFontSize(-1)}
                  className="px-2.5 py-1 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="Giảm cỡ chữ"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => onChangeFontSize(1)}
                  className="px-2.5 py-1 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="Tăng cỡ chữ"
                >
                  A+
                </button>
              </div>

              {/* View mode filter */}
              <div className="flex bg-[#F4EFE6] rounded-2xl p-1 border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] text-xs font-black">
                <button
                  type="button"
                  onClick={() => onViewModeChange('bilingual')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'bilingual'
                      ? 'bg-[#382E2B] text-white'
                      : 'text-[#766C5F] hover:text-[#382E2B]'
                  }`}
                >
                  Song ngữ
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange('en')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'en'
                      ? 'bg-[#382E2B] text-white'
                      : 'text-[#766C5F] hover:text-[#382E2B]'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange('vi')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'vi'
                      ? 'bg-[#382E2B] text-white'
                      : 'text-[#766C5F] hover:text-[#382E2B]'
                  }`}
                >
                  Tiếng Việt
                </button>
              </div>

              {/* Report Button */}
              <button
                type="button"
                onClick={onReportError}
                className="w-9 h-9 rounded-2xl bg-white border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] text-[#C85A3F] flex items-center justify-center hover:bg-[#FFF3E8] active:translate-y-0.5 transition-all cursor-pointer"
                title="Báo lỗi bài đọc này"
              >
                🚩
              </button>
            </div>
          )}

          {/* Prominent Exit Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-[#D36135] hover:bg-[#c2542a] text-white font-black text-xs sm:text-sm shrink-0 border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer"
            title="Thoát bài đọc"
          >
            <span>✕</span>
            <span>Thoát</span>
          </button>
        </div>
      </header>

      {/* Mobile Secondary Toolbar (shown in Reading tab) */}
      {activeTab === 'reading' && (
        <div className="md:hidden flex items-center justify-between px-3 py-2 bg-[#FFFDF9] border-b-2 border-[#382E2B] text-xs font-bold select-none">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#766C5F] uppercase font-black mr-0.5">Chế độ:</span>
            <button
              type="button"
              onClick={() => onViewModeChange('bilingual')}
              className={`px-2.5 py-1 rounded-xl transition-colors font-black ${
                viewMode === 'bilingual'
                  ? 'bg-[#382E2B] text-white'
                  : 'text-[#766C5F]'
              }`}
            >
              Song ngữ
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('en')}
              className={`px-2.5 py-1 rounded-xl transition-colors font-black ${
                viewMode === 'en'
                  ? 'bg-[#382E2B] text-white'
                  : 'text-[#766C5F]'
              }`}
            >
              Anh
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('vi')}
              className={`px-2.5 py-1 rounded-xl transition-colors font-black ${
                viewMode === 'vi'
                  ? 'bg-[#382E2B] text-white'
                  : 'text-[#766C5F]'
              }`}
            >
              Việt
            </button>
          </div>

          <div className="flex items-center gap-1.5 font-black text-[#382E2B]">
            <button
              type="button"
              onClick={() => onChangeFontSize(-1)}
              className="p-1 px-2 bg-[#F4EFE6] border border-[#382E2B]/40 rounded-lg cursor-pointer"
              title="Giảm cỡ chữ"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => onChangeFontSize(1)}
              className="p-1 px-2 bg-[#F4EFE6] border border-[#382E2B]/40 rounded-lg cursor-pointer"
              title="Tăng cỡ chữ"
            >
              A+
            </button>
            <button
              type="button"
              onClick={onReportError}
              className="p-1 px-2 text-[#C85A3F] cursor-pointer"
              title="Báo lỗi bài đọc"
            >
              🚩
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default BilingualHeader;
