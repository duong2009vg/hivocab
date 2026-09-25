// Generated 1:1 Pixel-Perfect Component: GlobalBugReportBtn
import React from 'react';

export function GlobalBugReportBtn() {
  return (
    <>
<button id="global-bug-report-btn" onClick={(event) => { try { (function(event){ window.openBugReportModal() }).call(this, event); } catch(e){ console.error(e); } }} 
    className="fixed bottom-20 sm:bottom-6 right-5 z-[80] flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-surface/90 hover:bg-surface border border-outline-variant/40 rounded-full shadow-lg hover:shadow-xl backdrop-blur-md text-on-surface text-xs font-bold hover:text-red-600 transition-all cursor-pointer group select-none"
    title="Báo lỗi hoặc góp ý phản hồi">
    <span className="material-symbols-outlined text-red-500 text-[18px] group-hover:scale-110 transition-transform">flag</span>
    <span className="hidden sm:inline text-on-surface-variant group-hover:text-on-surface">Báo lỗi &amp; Góp ý</span>
</button>
    </>
  );
}

export default GlobalBugReportBtn;
