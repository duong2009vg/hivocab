// Generated 1:1 Pixel-Perfect Component: PageLogin
import React from 'react';

export function PageLogin() {
  return (
    <>
<div id="page-login" className="page">
<main className="relative z-10 w-full min-h-screen flex items-center justify-center px-4 md:px-6 py-10 bg-gradient-to-br from-[#1a1c2c] via-[#3a4a6b] to-[#7d87a8]">
<div className="w-full max-w-md bg-surface/90 backdrop-blur-[24px] p-6 md:p-8 rounded-[24px] soft-shadow border border-white/50 fade-in">
<div className="text-center mb-6">
<img className="brand-logo mx-auto mb-2.5 h-10" src="logo-mark.svg" alt="Hi"/>
<h2 id="auth-title" className="font-headline-md text-xl font-bold text-on-surface">Chào mừng trở lại!</h2>
<p id="auth-subtitle" className="text-xs md:text-sm text-on-surface-variant mt-1">Đăng nhập để tiếp tục hành trình học từ vựng</p>
</div>

{/* GOOGLE LOGIN BUTTON */}
<button onClick={(event) => { try { (function(event){ window.handleGoogleLogin() }).call(this, event); } catch(e){ console.error(e); } }} className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 border border-outline-variant/60 rounded-xl transition-all shadow-xs">
<svg fill="none" height="20" viewBox="0 0 24 24" width="20"><path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.78 15.68 17.55V20.31H19.25C21.34 18.39 22.56 15.58 22.56 12.25Z" fill="#4285F4"/><path d="M12 23C14.97 23 17.46 22.02 19.25 20.31L15.68 17.55C14.71 18.2 13.46 18.59 12 18.59C9.17 18.59 6.78 16.68 5.92 14.11H2.23V16.97C4.03 20.54 7.71 23 12 23Z" fill="#34A853"/><path d="M5.92 14.11C5.7 13.45 5.57 12.74 5.57 12C5.57 11.26 5.7 10.55 5.92 9.89V7.03H2.23C1.49 8.5 1.05 10.2 1.05 12C1.05 13.8 1.49 15.5 2.23 16.97L5.92 9.89C6.78 7.32 9.17 5.41 12 5.41Z" fill="#FBBC05"/><path d="M12 5.41C13.62 5.41 15.07 5.96 16.21 7.05L19.34 3.92C17.45 2.16 14.97 1.05 12 1.05C7.71 1.05 4.03 3.46 2.23 7.03L5.92 9.89C6.78 7.32 9.17 5.41 12 5.41Z" fill="#EA4335"/></svg>
<span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tiếp tục với Google</span>
</button>

<div className="flex items-center my-4">
<div className="flex-1 border-t border-outline-variant/30"></div>
<span className="px-3 text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">hoặc email</span>
<div className="flex-1 border-t border-outline-variant/30"></div>
</div>

{/* AUTH MODE TOGGLE */}
<div className="flex bg-surface-container-high/60 p-1 rounded-xl mb-4 border border-outline-variant/20">
<button type="button" id="tab-auth-login" onClick={(event) => { try { (function(event){ window.switchAuthMode('login') }).call(this, event); } catch(e){ console.error(e); } }} className="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all bg-white text-primary shadow-xs">Đăng nhập</button>
<button type="button" id="tab-auth-signup" onClick={(event) => { try { (function(event){ window.switchAuthMode('signup') }).call(this, event); } catch(e){ console.error(e); } }} className="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-on-surface-variant hover:text-on-surface">Đăng ký</button>
</div>

{/* EMAIL / PASSWORD FORM */}
<form id="email-auth-form" onSubmit={(event) => { try { (function(event){ window.handleEmailAuth(event) }).call(this, event); } catch(e){ console.error(e); } }} className="space-y-3">
<div>
<label htmlFor="auth-email" className="block text-xs font-semibold text-on-surface mb-1">Email</label>
<input type="email" id="auth-email" aria-label="Email đăng nhập" required placeholder="name@example.com" className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant text-xs bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
</div>

<div>
<div className="flex items-center justify-between mb-1">
<label htmlFor="auth-password" className="block text-xs font-semibold text-on-surface">Mật khẩu</label>
<button type="button" id="link-forgot-pw" onClick={(event) => { try { (function(event){ window.openForgotPasswordModal() }).call(this, event); } catch(e){ console.error(e); } }} className="text-[11px] text-primary hover:underline font-medium">Quên mật khẩu?</button>
</div>
<input type="password" id="auth-password" aria-label="Mật khẩu" required placeholder="••••••••" className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant text-xs bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
</div>

{/* Confirm Password field (Only in Signup mode) */}
<div id="field-confirm-password" className="hidden">
<label htmlFor="auth-confirm-password" className="block text-xs font-semibold text-on-surface mb-1">Xác nhận mật khẩu</label>
<input type="password" id="auth-confirm-password" aria-label="Xác nhận mật khẩu" placeholder="••••••••" className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant text-xs bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
</div>

<div id="turnstile-user" className="cf-turnstile my-2 flex justify-center" data-sitekey="0x4AAAAAAE9CY0FtESpbO_Cj" data-theme="auto"></div>
<div id="auth-error" className="hidden text-xs text-error bg-error-container/40 border border-error/30 p-2.5 rounded-xl font-medium"></div>
<div id="auth-success" className="hidden text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-medium"></div>

<button type="submit" id="btn-auth-submit" className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-all shadow-xs">
Đăng nhập
</button>
</form>

<p className="text-[11px] text-center text-on-surface-variant mt-3 leading-relaxed">
    Bằng việc tiếp tục, bạn đồng ý với <a href="/terms.html" target="_blank" className="text-primary hover:underline font-medium">Điều khoản</a> & <a href="/privacy.html" target="_blank" className="text-primary hover:underline font-medium">Chính sách quyền riêng tư</a> của HiVocab.
</p>

<div className="mt-4 text-center">
<a className="text-on-surface-variant text-xs hover:text-primary cursor-pointer transition-colors" onClick={(event) => { try { (function(event){ window.navigateTo('landing') }).call(this, event); } catch(e){ console.error(e); } }}>← Quay lại trang chủ</a>
</div>

{/* Dev mode toggle */}
<div className="mt-5 pt-3 border-t border-outline-variant/20 text-center">
  <button onClick={(event) => { try { (function(event){ window.toggleDevMode() }).call(this, event); } catch(e){ console.error(e); } }} id="dev-mode-btn" className="text-[11px] text-outline hover:text-primary transition-colors px-3 py-1 rounded-lg hover:bg-surface-container-low">
    <span className="material-symbols-outlined text-[13px] align-middle">developer_mode</span>
    <span id="dev-mode-label">Chế độ Demo (offline)</span>
  </button>
</div>
</div>
</main>
</div>
    </>
  );
}

export default PageLogin;
