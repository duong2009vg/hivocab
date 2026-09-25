// Generated 1:1 Pixel-Perfect Component: PageBilingualReading
import React from 'react';

export function PageBilingualReading() {
  return (
    <>
<div id="page-bilingual-reading" className="page bg-background min-h-screen">
  {/* Sticky Top Header */}
  <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20 px-3 sm:px-6 md:px-8 pb-2.5 sm:pb-3 flex items-center justify-between gap-2 sm:gap-3 shadow-sm mobile-sticky-top lg:pt-3">
    {/* Left: Back button & Breadcrumb Title with Quick Switcher */}
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
      <button id="br-back-btn" onClick={(event) => { try { (function(event){ window.closeBilingualReading() }).call(this, event); } catch(e){ console.error(e); } }} className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container active:scale-90 transition-all shrink-0 cursor-pointer" title="Quay lại">
        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
      </button>

      <div className="min-w-0 relative">
        <div className="flex items-center gap-1.5">
          <h1 id="br-header-title" className="font-bold text-sm sm:text-base md:text-lg text-on-surface truncate leading-tight">Bài đọc song ngữ</h1>
          <button id="br-passage-switcher-btn" onClick={(event) => { try { (function(event){ window.togglePassageSwitcher() }).call(this, event); } catch(e){ console.error(e); } }} className="p-1 rounded-md text-outline hover:text-primary hover:bg-primary/10 transition-colors shrink-0 cursor-pointer" title="Đổi bài đọc khác trong bộ đề">
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
        </div>
        <p id="br-header-meta" className="text-[11px] sm:text-xs text-on-surface-variant truncate mt-0.5">—</p>

        {/* Dropdown menu switcher */}
        <div id="br-passage-switcher-dropdown" className="hidden absolute left-0 top-full mt-2 w-72 sm:w-80 bg-surface/95 backdrop-blur-2xl border border-outline-variant/30 rounded-2xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto fade-in">
          <div id="br-passage-switcher-menu"></div>
        </div>
      </div>
    </div>

    {/* Center: Tab Switcher (Đọc chủ động vs Đục lỗ) */}
    <div className="flex bg-surface-container rounded-2xl p-1 border border-outline-variant/20 shrink-0">
      <button id="br-tab-reading" onClick={(event) => { try { (function(event){ window.switchBilingualTab('reading') }).call(this, event); } catch(e){ console.error(e); } }} className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer">
        <span className="material-symbols-outlined text-[17px]">menu_book</span>
        <span className="hidden sm:inline">Đọc chủ động</span>
      </button>
      <button id="br-tab-gap" onClick={(event) => { try { (function(event){ window.switchBilingualTab('gap-fill') }).call(this, event); } catch(e){ console.error(e); } }} className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-semibold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer">
        <span className="material-symbols-outlined text-[17px]">edit_note</span>
        <span className="hidden sm:inline">Đục lỗ song ngữ</span>
      </button>
    </div>

    {/* Right: Tools + Prominent Exit Button */}
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      {/* Desktop Tools (Font size, View filter EN/VI/Song ngữ) */}
      <div id="br-reading-tools" className="hidden md:flex items-center gap-2">
        {/* Font size adjustment */}
        <div className="flex items-center bg-surface-container rounded-xl p-1 border border-outline-variant/20 text-xs font-bold text-on-surface-variant">
          <button onClick={(event) => { try { (function(event){ window.changeBilingualFontSize(-1) }).call(this, event); } catch(e){ console.error(e); } }} className="px-2 py-1 hover:text-primary rounded cursor-pointer" title="Giảm cỡ chữ">A-</button>
          <button onClick={(event) => { try { (function(event){ window.changeBilingualFontSize(1) }).call(this, event); } catch(e){ console.error(e); } }} className="px-2 py-1 hover:text-primary rounded cursor-pointer" title="Tăng cỡ chữ">A+</button>
        </div>

        {/* View mode filter */}
        <div className="flex bg-surface-container rounded-xl p-1 border border-outline-variant/20 text-xs font-semibold">
          <button id="br-view-bilingual" onClick={(event) => { try { (function(event){ window.setBilingualViewMode('bilingual') }).call(this, event); } catch(e){ console.error(e); } }} className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-xs shadow-sm transition-all cursor-pointer">Song ngữ</button>
          <button id="br-view-en" onClick={(event) => { try { (function(event){ window.setBilingualViewMode('en') }).call(this, event); } catch(e){ console.error(e); } }} className="px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-all cursor-pointer">English</button>
          <button id="br-view-vi" onClick={(event) => { try { (function(event){ window.setBilingualViewMode('vi') }).call(this, event); } catch(e){ console.error(e); } }} className="px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-all cursor-pointer">Tiếng Việt</button>
        </div>

        {/* Report Button */}
        <button onClick={(event) => { try { (function(event){ window.reportBilingualReadingError && window.reportBilingualReadingError() }).call(this, event); } catch(e){ console.error(e); } }} className="p-2 rounded-xl text-on-surface-variant hover:text-red-600 hover:bg-surface-container transition-colors cursor-pointer" title="Báo lỗi bài đọc này">
          <span className="material-symbols-outlined text-[20px]">flag</span>
        </button>
      </div>

      {/* Prominent Exit Button (Always visible on mobile & desktop) */}
      <button onClick={(event) => { try { (function(event){ window.closeBilingualReading() }).call(this, event); } catch(e){ console.error(e); } }} className="flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-error/10 hover:bg-error/20 active:bg-error/30 text-error font-bold text-xs sm:text-sm shrink-0 transition-all cursor-pointer active:scale-95" title="Thoát bài đọc">
        <span className="material-symbols-outlined text-[18px]">close</span>
        <span>Thoát</span>
      </button>
    </div>
  </header>

  {/* Mobile Secondary Toolbar (cho màn hình nhỏ) */}
  <div className="md:hidden flex items-center justify-between px-4 py-2 bg-surface-container-low/70 border-b border-outline-variant/15 text-xs font-semibold">
    <div className="flex items-center gap-1">
      <span className="text-[11px] text-outline uppercase font-bold mr-1">Chế độ:</span>
      <button onClick={(event) => { try { (function(event){ window.setBilingualViewMode('bilingual') }).call(this, event); } catch(e){ console.error(e); } }} className="px-2 py-1 rounded bg-primary/10 text-primary font-bold cursor-pointer">Song ngữ</button>
      <button onClick={(event) => { try { (function(event){ window.setBilingualViewMode('en') }).call(this, event); } catch(e){ console.error(e); } }} className="px-2 py-1 rounded text-on-surface-variant cursor-pointer">Anh</button>
      <button onClick={(event) => { try { (function(event){ window.setBilingualViewMode('vi') }).call(this, event); } catch(e){ console.error(e); } }} className="px-2 py-1 rounded text-on-surface-variant cursor-pointer">Việt</button>
    </div>
    <div className="flex items-center gap-1.5 font-bold text-on-surface-variant">
      <button onClick={(event) => { try { (function(event){ window.changeBilingualFontSize(-1) }).call(this, event); } catch(e){ console.error(e); } }} className="p-1 px-2 hover:bg-surface-container rounded cursor-pointer" title="Giảm cỡ chữ">A-</button>
      <button onClick={(event) => { try { (function(event){ window.changeBilingualFontSize(1) }).call(this, event); } catch(e){ console.error(e); } }} className="p-1 px-2 hover:bg-surface-container rounded cursor-pointer" title="Tăng cỡ chữ">A+</button>
      <button onClick={(event) => { try { (function(event){ window.reportBilingualReadingError && window.reportBilingualReadingError() }).call(this, event); } catch(e){ console.error(e); } }} className="p-1 px-1.5 hover:bg-surface-container text-outline hover:text-red-600 rounded cursor-pointer" title="Báo lỗi bài đọc">
        <span className="material-symbols-outlined text-[18px]">flag</span>
      </button>
    </div>
  </div>

  {/* Body Container */}
  <main id="bilingual-reading-body" className="px-4 sm:px-6 lg:px-12 py-6 md:py-8 min-h-[calc(100vh-64px)]">
    {/* Nội dung render động qua bilingualReading.js */}
  </main>

  {/* Floating Exit Button on Mobile for seamless exit at any scroll position */}
  <div className="md:hidden fixed bottom-6 right-4 z-50">
    <button id="br-floating-exit-btn" onClick={(event) => { try { (function(event){ window.closeBilingualReading() }).call(this, event); } catch(e){ console.error(e); } }} 
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-surface-container-highest/95 text-error border border-error/30 shadow-2xl backdrop-blur-md active:scale-95 transition-all text-xs font-bold cursor-pointer">
      <span className="material-symbols-outlined text-[18px]">close</span>
      <span>Thoát bài đọc</span>
    </button>
  </div>
</div>
    </>
  );
}

export default PageBilingualReading;
