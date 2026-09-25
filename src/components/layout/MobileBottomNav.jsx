// Generated 1:1 Pixel-Perfect Component: MobileBottomNav
import React from 'react';

export function MobileBottomNav() {
  return (
    <>
<nav id="mobile-bottom-nav" className="hidden lg:hidden mobile-floating-dock fixed bottom-[max(8px,calc(env(safe-area-inset-bottom,0px)-16px))] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-[420px] h-[54px] rounded-full items-center justify-around px-1.5" style={{"display":"none"}}>
    <a href="javascript:void(0)" onClick={(event) => { try { (function(event){ window.navigateTo('dashboard') }).call(this, event); } catch(e){ console.error(e); } }} className="nav-item dock-nav-item flex-1 flex flex-col items-center justify-center h-full py-1 px-1 rounded-full cursor-pointer" data-tab="dashboard" role="button">
        <span className="material-symbols-outlined dock-icon text-[22px] leading-none">home</span>
        <span className="dock-label text-[10px] font-semibold leading-tight mt-1 whitespace-nowrap">Trang chủ</span>
    </a>
    <a href="javascript:void(0)" onClick={(event) => { try { (function(event){ window.navigateTo('topics') }).call(this, event); } catch(e){ console.error(e); } }} className="nav-item dock-nav-item flex-1 flex flex-col items-center justify-center h-full py-1 px-1 rounded-full cursor-pointer" data-tab="topics" role="button">
        <span className="material-symbols-outlined dock-icon text-[22px] leading-none">category</span>
        <span className="dock-label text-[10px] font-semibold leading-tight mt-1 whitespace-nowrap">Chủ đề</span>
    </a>
    <a href="javascript:void(0)" onClick={(event) => { try { (function(event){ window.navigateTo('library') }).call(this, event); } catch(e){ console.error(e); } }} className="nav-item dock-nav-item flex-1 flex flex-col items-center justify-center h-full py-1 px-1 rounded-full cursor-pointer" data-tab="library" role="button">
        <span className="material-symbols-outlined dock-icon text-[22px] leading-none">explore</span>
        <span className="dock-label text-[10px] font-semibold leading-tight mt-1 whitespace-nowrap">Thư viện</span>
    </a>
    <a href="javascript:void(0)" onClick={(event) => { try { (function(event){ window.navigateTo('vocabulary') }).call(this, event); } catch(e){ console.error(e); } }} className="nav-item dock-nav-item flex-1 flex flex-col items-center justify-center h-full py-1 px-1 rounded-full cursor-pointer" data-tab="vocabulary" role="button">
        <span className="material-symbols-outlined dock-icon text-[22px] leading-none">bookmark</span>
        <span className="dock-label text-[10px] font-semibold leading-tight mt-1 whitespace-nowrap">Sổ từ</span>
    </a>
    <a href="javascript:void(0)" onClick={(event) => { try { (function(event){ window.navigateTo('dictionary') }).call(this, event); } catch(e){ console.error(e); } }} className="nav-item dock-nav-item flex-1 flex flex-col items-center justify-center h-full py-1 px-1 rounded-full cursor-pointer" data-tab="dictionary" role="button">
        <span className="material-symbols-outlined dock-icon text-[22px] leading-none">search</span>
        <span className="dock-label text-[10px] font-semibold leading-tight mt-1 whitespace-nowrap">Tra từ</span>
    </a>
</nav>
    </>
  );
}

export default MobileBottomNav;
