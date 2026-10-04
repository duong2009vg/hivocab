// src/components/pages/PageLogin.jsx
// Trang Đăng nhập & Đăng ký - Phong cách Cozy Crayon ấm áp của HiVocab
import React, { useState } from 'react';
import { useAuth } from '../../providers/AuthProvider.jsx';

export function PageLogin() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isExistingAccount, setIsExistingAccount] = useState(false);

  const handleModeSwitch = (mode) => {
    setAuthMode(mode);
    setErrorMessage('');
    setSuccessMessage('');
    setIsExistingAccount(false);
    if (typeof window !== 'undefined' && typeof window.switchAuthMode === 'function') {
      window.switchAuthMode(mode);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsExistingAccount(false);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }

    if (authMode === 'signup') {
      if (password.length < 6) {
        setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Mật khẩu xác nhận không khớp.');
        return;
      }
    }

    setIsSubmitting(true);

    // Get Turnstile token if available
    let captchaToken = '';
    if (typeof window !== 'undefined' && typeof window.turnstile !== 'undefined') {
      try {
        captchaToken = window.turnstile.getResponse();
      } catch (_) {}
    }

    try {
      if (authMode === 'login') {
        await signInWithEmail(cleanEmail, password, captchaToken);
        if (typeof window !== 'undefined' && typeof window.navigateTo === 'function') {
          window.navigateTo('dashboard');
        }
      } else {
        const res = await signUpWithEmail(cleanEmail, password, captchaToken);

        // Account already exists in Supabase
        if (res?.user && (!res.user.identities || res.user.identities.length === 0)) {
          setIsExistingAccount(true);
          return;
        }

        if (res?.session) {
          if (typeof window !== 'undefined' && typeof window.navigateTo === 'function') {
            window.navigateTo('dashboard');
          }
        } else {
          setSuccessMessage(`Đăng ký thành công! Vui lòng kiểm tra hộp thư ${cleanEmail} và bấm vào liên kết xác thực để kích hoạt tài khoản của bạn.`);
        }
      }
    } catch (err) {
      if (typeof window !== 'undefined' && typeof window.turnstile !== 'undefined') {
        try { window.turnstile.reset(); } catch (_) {}
      }
      setErrorMessage(err.message || 'Thao tác không thành công. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMessage(err.message || 'Đăng nhập Google thất bại.');
    }
  };

  const handleForgotPassword = () => {
    if (typeof window !== 'undefined' && typeof window.openForgotPasswordModal === 'function') {
      window.openForgotPasswordModal();
    }
  };

  const handleNavigateHome = () => {
    if (typeof window !== 'undefined' && typeof window.navigateTo === 'function') {
      window.navigateTo('landing');
    }
  };

  const handleToggleDevMode = () => {
    if (typeof window !== 'undefined' && typeof window.toggleDevMode === 'function') {
      window.toggleDevMode();
    }
  };

  return (
    <div 
      id="page-login" 
      className="page active min-h-screen text-[#3D352E] font-nunito antialiased bg-[#FAF5EB] relative flex flex-col justify-between"
      style={{
        backgroundImage: 'radial-gradient(#E2D6C3 1.2px, transparent 1.2px)',
        backgroundSize: '22px 22px',
      }}
    >
      {/* Top Bar đơn giản với nút về trang chủ */}
      <header className="w-full max-w-5xl mx-auto px-4 pt-4 sm:pt-6 flex items-center justify-between z-10">
        <button
          type="button"
          onClick={handleNavigateHome}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-black text-[#302A24] hover:bg-[#F7F0DE] active:translate-y-0.5 transition-all cursor-pointer"
        >
          <span>←</span>
          <span>Về trang chủ</span>
        </button>

        <div className="flex items-center gap-1.5 select-none text-xs font-black text-[#786F66]">
          <span className="text-[#F4B41A]">★</span>
          <span>Học cùng Bé Hổ</span>
          <span className="text-[#DE5D53]">❤</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[460px] bg-[#FFFDF9] rounded-[32px] border-[3px] border-[#3D352E] shadow-[5px_6px_0px_#3D352E] p-6 sm:p-8 relative select-none">
          
          {/* Header Card với Logo HI và tiêu đề sáp màu */}
          <div className="text-center mb-6">
            <div 
              onClick={handleNavigateHome}
              className="w-16 h-16 mx-auto mb-3 rounded-2xl border-2 border-[#3D352E] shadow-[2.5px_2.5px_0px_#3D352E] overflow-hidden bg-[#F7F0DE] cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
              title="Về trang chủ HiVocab"
            >
              <img
                src="/logo-hi-cream.png"
                alt="HiVocab Logo"
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="font-quicksand font-black text-2xl sm:text-[26px] text-[#302A24] leading-tight">
              {authMode === 'login' ? 'Chào mừng trở lại! 🌿' : 'Tạo tài khoản mới ✨'}
            </h1>
            <p className="text-xs sm:text-sm text-[#786F66] font-medium mt-1">
              {authMode === 'login'
                ? 'Đăng nhập để tiếp tục hành trình học từ vựng cùng Bé Hổ'
                : 'Bắt đầu hành trình ghi nhớ từ vựng thông minh cùng HiVocab'}
            </p>
          </div>

          {/* Toggle Chuyển Đổi Tab: Đăng nhập / Đăng ký */}
          <div className="flex bg-[#F0E8D8] p-1.5 rounded-2xl border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] mb-5">
            <button
              type="button"
              id="tab-auth-login"
              onClick={() => handleModeSwitch('login')}
              className={`flex-1 py-2 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-[#557A46] text-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                  : 'text-[#786F66] hover:text-[#302A24]'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              id="tab-auth-signup"
              onClick={() => handleModeSwitch('signup')}
              className={`flex-1 py-2 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-[#DE5D53] text-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                  : 'text-[#786F66] hover:text-[#302A24]'
              }`}
            >
              Đăng ký
            </button>
          </div>

          {/* Nút Đăng nhập với Google */}
          <button
            type="button"
            onClick={handleGoogleClick}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-[#FAF5EB] border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] rounded-2xl active:translate-y-0.5 active:shadow-none transition-all cursor-pointer mb-5"
          >
            <svg fill="none" height="20" viewBox="0 0 24 24" width="20">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.78 15.68 17.55V20.31H19.25C21.34 18.39 22.56 15.58 22.56 12.25Z" fill="#4285F4" />
              <path d="M12 23C14.97 23 17.46 22.02 19.25 20.31L15.68 17.55C14.71 18.2 13.46 18.59 12 18.59C9.17 18.59 6.78 16.68 5.92 14.11H2.23V16.97C4.03 20.54 7.71 23 12 23Z" fill="#34A853" />
              <path d="M5.92 14.11C5.7 13.45 5.57 12.74 5.57 12C5.57 11.26 5.7 10.55 5.92 9.89V7.03H2.23C1.49 8.5 1.05 10.2 1.05 12C1.05 13.8 1.49 15.5 2.23 16.97L5.92 9.89C6.78 7.32 9.17 5.41 12 5.41Z" fill="#FBBC05" />
              <path d="M12 5.41C13.62 5.41 15.07 5.96 16.21 7.05L19.34 3.92C17.45 2.16 14.97 1.05 12 1.05C7.71 1.05 4.03 3.46 2.23 7.03L5.92 9.89C6.78 7.32 9.17 5.41 12 5.41Z" fill="#EA4335" />
            </svg>
            <span className="text-xs font-black text-[#302A24] uppercase tracking-wider">Tiếp tục với Google</span>
          </button>

          {/* Đường Phân Cách */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t-2 border-dashed border-[#DECDBB]"></div>
            <span className="px-3 text-[11px] font-black text-[#8A796F] uppercase tracking-wider">hoặc dùng email</span>
            <div className="flex-1 border-t-2 border-dashed border-[#DECDBB]"></div>
          </div>

          {/* Form Nhập Email / Mật Khẩu */}
          <form id="email-auth-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="block text-xs font-black text-[#302A24] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>📧 Địa chỉ Email</span>
              </label>
              <input
                type="email"
                id="auth-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email đăng nhập"
                required
                placeholder="tenbanhoc@example.com"
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] text-sm bg-white text-[#302A24] placeholder:text-[#A89C92] focus:outline-none focus:ring-2 focus:ring-[#557A46] focus:border-[#557A46] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-password" className="block text-xs font-black text-[#302A24] uppercase tracking-wider flex items-center gap-1.5">
                  <span>🔑 Mật khẩu</span>
                </label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    id="link-forgot-pw"
                    onClick={handleForgotPassword}
                    className="text-[11px] font-bold text-[#DE5D53] hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <input
                type="password"
                id="auth-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Mật khẩu"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] text-sm bg-white text-[#302A24] placeholder:text-[#A89C92] focus:outline-none focus:ring-2 focus:ring-[#557A46] focus:border-[#557A46] transition-all"
              />
            </div>

            {/* Confirm Password (chỉ hiện khi Đăng ký) */}
            {authMode === 'signup' && (
              <div id="field-confirm-password">
                <label htmlFor="auth-confirm-password" className="block text-xs font-black text-[#302A24] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span>🔒 Xác nhận mật khẩu</span>
                </label>
                <input
                  type="password"
                  id="auth-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-label="Xác nhận mật khẩu"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] text-sm bg-white text-[#302A24] placeholder:text-[#A89C92] focus:outline-none focus:ring-2 focus:ring-[#DE5D53] focus:border-[#DE5D53] transition-all"
                />
              </div>
            )}

            {/* Error Message */}
            {errorMessage && !isExistingAccount && (
              <div id="auth-error" className="text-xs text-[#B4482B] bg-[#FDEAE2] border-2 border-[#F8C8B8] p-3 rounded-2xl font-bold flex items-start gap-2 shadow-xs">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Existing Account Notice */}
            {isExistingAccount && (
              <div id="auth-error" className="text-xs bg-[#FDEAE2] border-2 border-[#F8C8B8] p-3.5 rounded-2xl font-bold space-y-2.5 shadow-xs">
                <div className="text-[#B4482B] flex items-center gap-1.5 text-xs font-black">
                  <span>⚠️</span>
                  <span>Email này đã có tài khoản trên hệ thống!</span>
                </div>
                <p className="text-[#6E5D53] text-[11px] font-medium leading-relaxed">
                  Nếu bạn từng đăng nhập bằng <b>Google</b> hoặc đã đăng ký trước đó:
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    className="w-full py-2 px-3 bg-white border-2 border-[#3D352E] rounded-xl text-[#302A24] font-black text-xs text-center shadow-[1.5px_2px_0px_#3D352E] hover:bg-[#FAF5EB] transition-all cursor-pointer"
                  >
                    Đăng nhập bằng Google
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="w-full py-2 px-3 bg-[#FAF5EB] border border-[#DE5D53] rounded-xl text-[#DE5D53] font-bold text-xs text-center hover:bg-white transition-all cursor-pointer"
                  >
                    Đặt lại mật khẩu (Quên mật khẩu)
                  </button>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div id="auth-success" className="text-xs text-[#3D5A32] bg-[#EAF5E4] border-2 border-[#8FB383] p-3 rounded-2xl font-bold space-y-1 shadow-xs">
                <p className="text-xs font-black">🎉 Đăng ký thành công!</p>
                <p className="text-[11px] font-medium leading-relaxed">{successMessage}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-auth-submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 px-4 rounded-2xl text-white font-black text-sm sm:text-base border-[2.5px] border-[#3D352E] shadow-[3px_4px_0px_#3D352E] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 ${
                authMode === 'login'
                  ? 'bg-[#557A46] hover:bg-[#48683B]'
                  : 'bg-[#DE5D53] hover:bg-[#C84F45]'
              }`}
            >
              <span>{isSubmitting ? 'Đang xử lý...' : (authMode === 'login' ? 'Đăng nhập ngay 🚀' : 'Tạo tài khoản học tập ✏️')}</span>
            </button>
          </form>

          {/* Lời nhắn nhỏ của Bé Hổ */}
          <div className="mt-4 bg-[#FAF5EB] p-2.5 rounded-2xl border border-[#DECDBB] flex items-center gap-2.5">
            <img 
              src="/mascot/mascot_cozy.png" 
              alt="Bé Hổ" 
              className="w-8 h-8 object-contain shrink-0 mix-blend-multiply" 
            />
            <p className="text-[11px] font-semibold text-[#6E5D53]">
              Bé Hổ nhắc: &ldquo;Chỉ 15 phút mỗi ngày để nâng cấp vốn từ vựng nhé!&rdquo; 🐾
            </p>
          </div>

          <p className="text-[11px] text-center text-[#8A796F] mt-4 leading-relaxed font-medium">
            Bằng việc tiếp tục, bạn đồng ý với <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="text-[#302A24] font-bold underline">Điều khoản</a> & <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="text-[#302A24] font-bold underline">Chính sách bảo mật</a> của HiVocab.
          </p>

          {/* Dev mode toggle */}
          <div className="mt-4 pt-3 border-t border-[#DECDBB]/60 text-center">
            <button
              type="button"
              onClick={handleToggleDevMode}
              id="dev-mode-btn"
              className="text-[11px] font-bold text-[#8A796F] hover:text-[#302A24] transition-colors px-3 py-1 rounded-xl hover:bg-[#FAF5EB] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[13px] align-middle mr-1">developer_mode</span>
              <span id="dev-mode-label">Chế độ Demo (offline)</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer mộc mạc */}
      <footer className="w-full text-center py-4 text-xs font-semibold text-[#8A796F]">
        <p>© 2026 HiVocab! - Nền tảng học từ vựng tiếng Anh theo phong cách sáp màu ấm áp 🌿</p>
      </footer>
    </div>
  );
}

export default PageLogin;
