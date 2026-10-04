// src/components/common/AdminProtectedRoute.jsx
// Guards administrative routes (#admin) with role verification, dedicated Admin Login form & Cloudflare Turnstile
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useRoute } from '../../router/RouteContext.jsx';
import RouteLoadingFallback from './RouteLoadingFallback.jsx';

export function AdminProtectedRoute({ children }) {
  const { user, profile, isAdmin, loading, signInWithEmail, signOut } = useAuth();
  const { navigateTo } = useRoute();

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-render Turnstile cho Admin Login
  useEffect(() => {
    if (!user && typeof window !== 'undefined' && window.turnstile && typeof window.turnstile.render === 'function') {
      const el = document.getElementById('turnstile-admin');
      if (el && !el.hasChildNodes()) {
        try {
          window.turnstile.render('#turnstile-admin', {
            sitekey: '0x4AAAAAAE9CY0FtESpbO_Cj',
            theme: 'auto',
          });
        } catch (_) {}
      }
    }
  }, [user]);

  if (loading) {
    return <RouteLoadingFallback />;
  }

  // Trường hợp 1: Chưa đăng nhập -> Hiển thị Form Đăng Nhập Quản Trị Viên kèm Turnstile CAPTCHA
  if (!user) {
    const handleAdminLogin = async (e) => {
      e.preventDefault();
      setErrorMsg('');

      let captchaToken = '';
      if (typeof window !== 'undefined' && typeof window.turnstile !== 'undefined') {
        try {
          captchaToken = window.turnstile.getResponse('#turnstile-admin') || window.turnstile.getResponse();
        } catch (_) {}
      }
      if (!captchaToken && typeof document !== 'undefined') {
        const hiddenInput = document.querySelector('#turnstile-admin [name="cf-turnstile-response"]') || document.querySelector('[name="cf-turnstile-response"]');
        if (hiddenInput && hiddenInput.value) {
          captchaToken = hiddenInput.value;
        }
      }

      if (!captchaToken && typeof window !== 'undefined' && typeof window.turnstile !== 'undefined') {
        setErrorMsg('Vui lòng hoàn thành xác thực bảo mật Cloudflare (tích chọn vào ô CAPTCHA) trước khi đăng nhập!');
        return;
      }

      setIsSubmitting(true);
      try {
        await signInWithEmail(adminEmail.trim(), adminPassword, captchaToken);
      } catch (err) {
        if (typeof window !== 'undefined' && typeof window.turnstile !== 'undefined') {
          try {
            window.turnstile.reset('#turnstile-admin');
          } catch (_) {
            try { window.turnstile.reset(); } catch (__) {}
          }
        }
        setErrorMsg(err.message || 'Email hoặc mật khẩu không chính xác.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#FAF5EB] flex flex-col items-center justify-center p-4 sm:p-6 text-[#3D352E] font-nunito" style={{ backgroundImage: 'radial-gradient(#E2D6C3 1.2px, transparent 1.2px)', backgroundSize: '22px 22px' }}>
        <div className="w-full max-w-md bg-[#FFFDF9] rounded-[28px] border-[3px] border-[#3D352E] shadow-[5px_6px_0px_#3D352E] p-6 sm:p-8 select-none">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center mx-auto mb-3 text-2xl">
              🛡️
            </div>
            <h1 className="text-2xl font-black text-[#302A24] font-quicksand tracking-tight">
              HiVocab Studio Admin
            </h1>
            <p className="text-xs text-[#786F66] mt-1 font-medium">
              Khu vực dành riêng cho Quản trị viên hệ thống
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-[#302A24] uppercase tracking-wider mb-1">
                Email Quản trị viên
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@hivocab.site"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] text-xs sm:text-sm bg-white text-[#302A24] focus:outline-none focus:ring-2 focus:ring-[#557A46]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[#302A24] uppercase tracking-wider mb-1">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] text-xs sm:text-sm bg-white text-[#302A24] focus:outline-none focus:ring-2 focus:ring-[#557A46]"
              />
            </div>

            {/* Cloudflare Turnstile cho Admin */}
            <div
              id="turnstile-admin"
              className="cf-turnstile my-2.5 flex justify-center min-h-[65px]"
              data-sitekey="0x4AAAAAAE9CY0FtESpbO_Cj"
              data-theme="auto"
            ></div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#FDEAE2] border-2 border-[#F8C8B8] text-xs font-bold text-[#B4482B] flex items-start gap-1.5">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#3D352E] hover:bg-[#2A2420] text-white font-black text-xs sm:text-sm border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng nhập Quản trị viên 🔐'}</span>
            </button>
          </form>

          <div className="mt-5 pt-3 border-t border-[#DECDBB] text-center">
            <button
              type="button"
              onClick={() => navigateTo('landing')}
              className="text-xs font-bold text-[#786F66] hover:text-[#302A24] transition-colors cursor-pointer"
            >
              ← Về trang chủ học tập
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Trường hợp 2: Đã đăng nhập nhưng không có vai trò Admin -> 403 Forbidden
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF5EB] flex flex-col items-center justify-center p-6 text-center select-none" style={{ backgroundImage: 'radial-gradient(#E2D6C3 1.2px, transparent 1.2px)', backgroundSize: '22px 22px' }}>
        <div className="w-full max-w-md bg-[#FFFDF9] rounded-[28px] border-[3px] border-[#3D352E] shadow-[5px_6px_0px_#3D352E] p-7">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center mx-auto mb-4 text-3xl">
            🔒
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-[#302A24] font-quicksand tracking-tight mb-2">
            Từ chối quyền truy cập (403)
          </h1>

          <p className="text-xs sm:text-sm text-[#786F66] mb-6 leading-relaxed">
            Tài khoản <span className="font-bold text-[#302A24]">{user.email}</span> (vai trò: <span className="font-bold text-amber-700">{profile?.role || 'user'}</span>) không có quyền quản trị viên để truy cập không gian này.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => navigateTo('dashboard')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#557A46] text-white font-bold text-xs border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] hover:opacity-95 active:translate-y-0.5 cursor-pointer"
            >
              Về Bảng điều khiển Học tập
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigateTo('landing');
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border-2 border-[#3D352E] text-[#302A24] font-bold text-xs hover:bg-[#FAF5EB] cursor-pointer"
            >
              Đổi tài khoản khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Trường hợp 3: Đã đăng nhập và là Admin -> Mở toàn bộ quyền Studio Admin
  return children;
}

export default AdminProtectedRoute;
