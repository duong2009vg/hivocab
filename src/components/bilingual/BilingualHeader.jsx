// src/components/bilingual/BilingualHeader.jsx
// Sticky Header & Navigation for Bilingual Reading

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
      <header className="sticky top-0 z-40 bg-surface/90 dark:bg-neutral-900/90 backdrop-blur-xl border-b border-outline-variant/20 px-3 sm:px-6 md:px-8 pb-2.5 sm:pb-3 flex items-center justify-between gap-2 sm:gap-3 shadow-xs mobile-sticky-top lg:pt-3 select-none">
        {/* Left: Back button & Breadcrumb Title with Quick Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container active:scale-90 transition-all shrink-0 cursor-pointer"
            title="Quay lại"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>

          <div className="min-w-0 relative">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm sm:text-base md:text-lg text-on-surface truncate leading-tight">
                {title}
              </h1>
              <button
                type="button"
                onClick={() => setIsSwitcherOpen((prev) => !prev)}
                className="p-1 rounded-md text-outline hover:text-primary hover:bg-primary/10 transition-colors shrink-0 cursor-pointer"
                title="Đổi bài đọc khác trong bộ đề"
              >
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
            </div>
            <p className="text-[11px] sm:text-xs text-on-surface-variant truncate mt-0.5">
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
        <div className="flex bg-surface-container rounded-2xl p-1 border border-outline-variant/20 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('reading')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm transition-all active:scale-95 cursor-pointer ${
              activeTab === 'reading'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-semibold'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">menu_book</span>
            <span className="hidden sm:inline">Đọc chủ động</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('gap-fill')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm transition-all active:scale-95 cursor-pointer ${
              activeTab === 'gap-fill'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-semibold'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">edit_note</span>
            <span className="hidden sm:inline">Đục lỗ song ngữ</span>
          </button>
        </div>

        {/* Right: Tools + Prominent Exit Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Desktop Tools only shown in Reading mode */}
          {activeTab === 'reading' && (
            <div className="hidden md:flex items-center gap-2">
              {/* Font size adjustment */}
              <div className="flex items-center bg-surface-container rounded-xl p-1 border border-outline-variant/20 text-xs font-bold text-on-surface-variant">
                <button
                  type="button"
                  onClick={() => onChangeFontSize(-1)}
                  className="px-2 py-1 hover:text-primary rounded cursor-pointer"
                  title="Giảm cỡ chữ"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => onChangeFontSize(1)}
                  className="px-2 py-1 hover:text-primary rounded cursor-pointer"
                  title="Tăng cỡ chữ"
                >
                  A+
                </button>
              </div>

              {/* View mode filter */}
              <div className="flex bg-surface-container rounded-xl p-1 border border-outline-variant/20 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => onViewModeChange('bilingual')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    viewMode === 'bilingual'
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Song ngữ
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    viewMode === 'en'
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange('vi')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    viewMode === 'vi'
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Tiếng Việt
                </button>
              </div>

              {/* Report Button */}
              <button
                type="button"
                onClick={onReportError}
                className="p-2 rounded-xl text-on-surface-variant hover:text-red-600 hover:bg-surface-container transition-colors cursor-pointer"
                title="Báo lỗi bài đọc này"
              >
                <span className="material-symbols-outlined text-[20px]">flag</span>
              </button>
            </div>
          )}

          {/* Prominent Exit Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-error/10 hover:bg-error/20 active:bg-error/30 text-error font-bold text-xs sm:text-sm shrink-0 transition-all cursor-pointer active:scale-95"
            title="Thoát bài đọc"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
            <span>Thoát</span>
          </button>
        </div>
      </header>

      {/* Mobile Secondary Toolbar (shown in Reading tab) */}
      {activeTab === 'reading' && (
        <div className="md:hidden flex items-center justify-between px-4 py-2 bg-surface-container-low/70 border-b border-outline-variant/15 text-xs font-semibold select-none">
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-outline uppercase font-bold mr-1">Chế độ:</span>
            <button
              type="button"
              onClick={() => onViewModeChange('bilingual')}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === 'bilingual'
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-on-surface-variant'
              }`}
            >
              Song ngữ
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('en')}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === 'en'
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-on-surface-variant'
              }`}
            >
              Anh
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('vi')}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === 'vi'
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-on-surface-variant'
              }`}
            >
              Việt
            </button>
          </div>

          <div className="flex items-center gap-1.5 font-bold text-on-surface-variant">
            <button
              type="button"
              onClick={() => onChangeFontSize(-1)}
              className="p-1 px-2 hover:bg-surface-container rounded cursor-pointer"
              title="Giảm cỡ chữ"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => onChangeFontSize(1)}
              className="p-1 px-2 hover:bg-surface-container rounded cursor-pointer"
              title="Tăng cỡ chữ"
            >
              A+
            </button>
            <button
              type="button"
              onClick={onReportError}
              className="p-1 px-1.5 hover:bg-surface-container text-outline hover:text-red-600 rounded cursor-pointer"
              title="Báo lỗi bài đọc"
            >
              <span className="material-symbols-outlined text-[18px]">flag</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default BilingualHeader;
