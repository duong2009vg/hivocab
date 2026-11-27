import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useRoute } from '../../router/RouteContext.jsx';
import { TURNSTILE_SITE_KEY } from '../../config/runtime.js';
import '../../styles/crayon-auth.css';

export function PageLogin() {
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const { navigateTo } = useRoute();

  const [authMode, setAuthMode] = useState(() => {
    if (typeof window !== 'undefined' && window._initialAuthMode) {
      const mode = window._initialAuthMode;
      delete window._initialAuthMode;
      return mode;
    }
    return 'login';
  }); // 'login' | 'signup'

  useEffect(() => {
    if (typeof window !== 'undefined' && window._initialAuthMode) {
      setAuthMode(window._initialAuthMode);
      delete window._initialAuthMode;
    }
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isExistingAccount, setIsExistingAccount] = useState(false);

  // Auto-redirect to dashboard when authenticated
  useEffect(() => {
    if (user) {
      navigateTo('dashboard');
    }
  }, [user, navigateTo]);

  const handleModeSwitch = (mode) => {
    setAuthMode(mode);
    setErrorMessage('');
    setSuccessMessage('');
    setIsExistingAccount(false);
    setConsentTerms(false);
    setConsentPrivacy(false);
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
      if (!consentTerms) {
        setErrorMessage('Vui lòng đọc và tích chọn đồng ý với Điều khoản dịch vụ để tiếp tục.');
        return;
      }
      if (!consentPrivacy) {
        setErrorMessage(
          'Vui lòng tích chọn đồng ý cho phép xử lý dữ liệu cá nhân theo Chính sách bảo mật (tuân thủ Nghị định 356/2025/NĐ-CP).'
        );
        return;
      }
    }

    setIsSubmitting(true);

    // Get Turnstile token and fail closed when TURNSTILE_SITE_KEY is configured
    let captchaToken = '';
    if (typeof window !== 'undefined' && typeof window.turnstile !== 'undefined') {
      try {
        captchaToken =
          window.turnstile.getResponse() || window.turnstile.getResponse('#turnstile-user');
      } catch (_) {}
    }
    if (!captchaToken && typeof document !== 'undefined') {
      const hiddenInput =
        document.querySelector('#turnstile-user [name="cf-turnstile-response"]') ||
        document.querySelector('[name="cf-turnstile-response"]');
      if (hiddenInput && hiddenInput.value) {
        captchaToken = hiddenInput.value;
      }
    }

    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setIsSubmitting(false);
      setErrorMessage(
        'Vui lòng hoàn thành xác thực bảo mật Cloudflare CAPTCHA trước khi tiếp tục.'
      );
      return;
    }

    try {
      if (authMode === 'login') {
        await signInWithEmail(cleanEmail, password, captchaToken);
        navigateTo('dashboard');
        if (typeof window !== 'undefined' && typeof window.navigateTo === 'function') {
          window.navigateTo('dashboard');
        }
      } else {
        const consentMeta = {
          consent_terms: true,
          consent_privacy: true,
          consent_at: new Date().toISOString(),
          decree: '356/2025/ND-CP',
          law: '91/2025/QH15',
        };
        const res = await signUpWithEmail(cleanEmail, password, captchaToken, consentMeta);

        // Account already exists in Supabase
        if (res?.user && (!res.user.identities || res.user.identities.length === 0)) {
          setIsExistingAccount(true);
          return;
        }

        if (res?.session) {
          navigateTo('dashboard');
          if (typeof window !== 'undefined' && typeof window.navigateTo === 'function') {
            window.navigateTo('dashboard');
          }
        } else {
          setSuccessMessage(
            `Đăng ký thành công! Vui lòng kiểm tra hộp thư ${cleanEmail} và bấm vào liên kết xác thực để kích hoạt tài khoản của bạn.`
          );
        }
      }
    } catch (err) {
      if (typeof window !== 'undefined' && typeof window.turnstile !== 'undefined') {
        try {
          window.turnstile.reset('#turnstile-user');
        } catch (_) {
          try {
            window.turnstile.reset();
          } catch (__) {}
        }
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
    navigateTo('landing');
    if (typeof window !== 'undefined' && typeof window.navigateTo === 'function') {
      window.navigateTo('landing');
    }
  };

  // Tự động kích hoạt / render widget Cloudflare Turnstile khi đổi tab hoặc mount
  React.useEffect(() => {
    let intervalId = null;
    let attempts = 0;

    const renderTurnstile = () => {
      attempts++;
      if (typeof window === 'undefined') return true;
      const el = document.getElementById('turnstile-user');
      if (!el) return false;

      if (window.turnstile && typeof window.turnstile.render === 'function') {
        if (!el.hasChildNodes()) {
          try {
            window.turnstile.render('#turnstile-user', {
              sitekey: TURNSTILE_SITE_KEY,
              theme: 'light',
            });
            return true;
          } catch (err) {
            console.warn('[PageLogin] Turnstile render error:', err);
          }
        } else {
          return true;
        }
      }

      return attempts > 30;
    };

    if (!renderTurnstile()) {
      intervalId = setInterval(() => {
        if (renderTurnstile()) {
          clearInterval(intervalId);
        }
      }, 150);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [authMode]);

  return (
    <div
      id="page-login"
      className="page active min-h-[100svh] w-full bg-[#FFFDF9] text-[#3D352E] font-nunito antialiased"
    >
      {/* Hidden SVG filter for authentic hand-drawn crayon card outline */}
      <svg aria-hidden="true" className="absolute w-0 h-0 overflow-hidden pointer-events-none">
        <defs>
          <filter id="auth-sketch-outline" x="-4%" y="-4%" width="108%" height="108%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" result="noise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="2.1"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Inner 50/50 split-screen container (insulated from .page.active display:block) */}
      <div className="min-h-[100svh] w-full flex flex-col lg:flex-row">
        {/* ── CỘT TRÁI (50%): FORM ĐĂNG NHẬP / ĐĂNG KÝ SIGNATURE SÁP MÀU HIVOCAB ── */}
        <main className="relative w-full lg:w-1/2 min-h-[100svh] bg-[#FFFDF9] flex flex-col justify-between px-5 sm:px-10 py-6 sm:py-8">
          {/* Top bar: Nút quay lại trang chủ + Logo HiVocab */}
          <div className="w-full flex items-center justify-between">
            <button
              type="button"
              onClick={handleNavigateHome}
              className="inline-flex items-center gap-2 text-sm font-extrabold text-[#3D352E] hover:text-[#DE5D53] transition-colors cursor-pointer py-1.5 px-2.5 -ml-2.5 rounded-xl hover:bg-[#FAF5EB]"
              aria-label="Về trang chủ HiVocab"
              title="Về trang chủ HiVocab"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Trang chủ</span>
            </button>

            <button
              type="button"
              onClick={handleNavigateHome}
              className="inline-flex items-center gap-2 cursor-pointer group"
              title="Về trang chủ HiVocab"
            >
              <div className="w-8 h-8 rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] overflow-hidden bg-[#FAF5EB] flex items-center justify-center group-hover:scale-105 transition-transform">
                <img
                  src="/logo-hi-cream.png"
                  alt="HiVocab"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-crayon font-extrabold text-base text-[#3D352E]">HiVocab</span>
            </button>
          </div>

          {/* Khối trung tâm: Badge + Heading + Crayon Auth Card */}
          <div className="w-full max-w-[440px] mx-auto my-auto py-6 sm:py-8 auth-panel-fade">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF5EB] border border-[#DFD2BE] text-xs font-extrabold text-[#557A46] mb-3">
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>Bắt đầu</span>
              </span>

              <h1 className="font-crayon font-extrabold text-3xl sm:text-[32px] text-[#3D352E] leading-tight">
                Chào mừng
              </h1>
              <p className="text-sm text-[#786F66] font-semibold mt-1">
                Đăng nhập hoặc tạo tài khoản để tiếp tục
              </p>
            </div>

            {/* Auth Card viền nét sáp vẽ tay + bóng vàng ấm signature HiVocab */}
            <div className="auth-crayon-card p-5 sm:p-6">
              <svg
                aria-hidden="true"
                className="auth-crayon-border-svg"
                viewBox="0 0 448 560"
                preserveAspectRatio="none"
              >
                <rect
                  x="3"
                  y="3"
                  width="442"
                  height="554"
                  rx="20"
                  ry="20"
                  fill="none"
                  stroke="#3D352E"
                  strokeWidth="2.4"
                  vectorEffect="non-scaling-stroke"
                  style={{ filter: 'url(#auth-sketch-outline)' }}
                />
              </svg>

              <div className="relative z-10">
                {/* Segmented Tab Toggle: Đăng nhập / Đăng ký */}
                <div
                  role="tablist"
                  aria-label="Chế độ xác thực"
                  className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#FAF5EB] border border-[#D8CBB8] mb-5"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={authMode === 'login'}
                    id="tab-auth-login"
                    onClick={() => handleModeSwitch('login')}
                    className={`py-2 text-xs sm:text-sm font-extrabold rounded-lg transition-all cursor-pointer ${
                      authMode === 'login'
                        ? 'auth-crayon-tab-active'
                        : 'text-[#786F66] hover:text-[#3D352E]'
                    }`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={authMode === 'signup'}
                    id="tab-auth-signup"
                    onClick={() => handleModeSwitch('signup')}
                    className={`py-2 text-xs sm:text-sm font-extrabold rounded-lg transition-all cursor-pointer ${
                      authMode === 'signup'
                        ? 'auth-crayon-tab-active'
                        : 'text-[#786F66] hover:text-[#3D352E]'
                    }`}
                  >
                    Đăng ký
                  </button>
                </div>

                {/* Nút Tiếp tục với Google */}
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  className="auth-crayon-btn-white w-full h-12 flex items-center justify-center gap-3 px-4 cursor-pointer mb-5"
                >
                  <svg fill="none" height="18" viewBox="0 0 24 24" width="18" aria-hidden="true">
                    <path
                      d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.78 15.68 17.55V20.31H19.25C21.34 18.39 22.56 15.58 22.56 12.25Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23C14.97 23 17.46 22.02 19.25 20.31L15.68 17.55C14.71 18.2 13.46 18.59 12 18.59C9.17 18.59 6.78 16.68 5.92 14.11H2.23V16.97C4.03 20.54 7.71 23 12 23Z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.92 14.11C5.7 13.45 5.57 12.74 5.57 12C5.57 11.26 5.7 10.55 5.92 9.89V7.03H2.23C1.49 8.5 1.05 10.2 1.05 12C1.05 13.8 1.49 15.5 2.23 16.97L5.92 9.89C6.78 7.32 9.17 5.41 12 5.41Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.41C13.62 5.41 15.07 5.96 16.21 7.05L19.34 3.92C17.45 2.16 14.97 1.05 12 1.05C7.71 1.05 4.03 3.46 2.23 7.03L5.92 9.89C6.78 7.32 9.17 5.41 12 5.41Z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="font-crayon text-sm font-bold text-[#3D352E]">
                    Tiếp tục với Google
                  </span>
                </button>

                {/* Đường phân cách */}
                <div className="flex items-center my-4">
                  <div className="flex-1 border-t border-dashed border-[#DECDBB]" />
                  <span className="px-3 text-[11px] font-extrabold text-[#8A796F] uppercase tracking-wider">
                    hoặc dùng email
                  </span>
                  <div className="flex-1 border-t border-dashed border-[#DECDBB]" />
                </div>

                {/* Tiêu đề phụ trong form */}
                <div className="mb-4 text-left">
                  <h2 className="font-crayon font-extrabold text-xl text-[#3D352E] leading-snug">
                    {authMode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[#786F66] font-medium mt-0.5">
                    {authMode === 'login'
                      ? 'Đăng nhập để tiếp tục hành trình học từ vựng'
                      : 'Bắt đầu ghi nhớ từ vựng bền lâu cùng HiVocab'}
                  </p>
                </div>

                {/* Form Nhập Email / Mật Khẩu */}
                <form id="email-auth-form" onSubmit={handleSubmit} className="space-y-3.5 text-left">
                  <div>
                    <label
                      htmlFor="auth-email"
                      className="block text-xs font-extrabold text-[#3D352E] mb-1.5"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="auth-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-label="Email đăng nhập"
                      required
                      placeholder="you@example.com"
                      className="auth-crayon-field w-full h-11 px-3.5 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="auth-password"
                      className="block text-xs font-extrabold text-[#3D352E] mb-1.5"
                    >
                      Mật khẩu
                    </label>
                    <input
                      type="password"
                      id="auth-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-label="Mật khẩu"
                      required
                      placeholder="••••••••"
                      className="auth-crayon-field w-full h-11 px-3.5 text-sm font-medium"
                    />
                  </div>

                  {/* Confirm Password (chỉ hiện khi Đăng ký) */}
                  {authMode === 'signup' && (
                    <div id="field-confirm-password">
                      <label
                        htmlFor="auth-confirm-password"
                        className="block text-xs font-extrabold text-[#3D352E] mb-1.5"
                      >
                        Xác nhận mật khẩu
                      </label>
                      <input
                        type="password"
                        id="auth-confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        aria-label="Xác nhận mật khẩu"
                        placeholder="••••••••"
                        className="auth-crayon-field w-full h-11 px-3.5 text-sm font-medium"
                      />
                    </div>
                  )}

                  {/* Tách riêng sự đồng ý theo Nghị định 356/2025/NĐ-CP & Luật 91/2025/QH15 */}
                  {authMode === 'signup' && (
                    <div className="space-y-2 pt-0.5">
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#5E5147] font-medium leading-snug select-none">
                        <input
                          type="checkbox"
                          id="consent-terms"
                          checked={consentTerms}
                          onChange={(e) => setConsentTerms(e.target.checked)}
                          className="mt-0.5 rounded border-[#3D352E] text-[#DE5D53] focus:ring-[#DE5D53] w-4 h-4 cursor-pointer accent-[#DE5D53] shrink-0"
                        />
                        <span>
                          Tôi đồng ý với{' '}
                          <a
                            href="/terms.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#3D352E] font-bold underline hover:text-[#DE5D53]"
                          >
                            Điều khoản dịch vụ
                          </a>{' '}
                          của HiVocab.
                        </span>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#5E5147] font-medium leading-snug select-none">
                        <input
                          type="checkbox"
                          id="consent-privacy"
                          checked={consentPrivacy}
                          onChange={(e) => setConsentPrivacy(e.target.checked)}
                          className="mt-0.5 rounded border-[#3D352E] text-[#DE5D53] focus:ring-[#DE5D53] w-4 h-4 cursor-pointer accent-[#DE5D53] shrink-0"
                        />
                        <span>
                          Tôi đồng ý cho phép xử lý dữ liệu cá nhân theo{' '}
                          <a
                            href="/privacy.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#3D352E] font-bold underline hover:text-[#DE5D53]"
                          >
                            Chính sách bảo mật
                          </a>
                          .
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Error Message */}
                  {errorMessage && !isExistingAccount && (
                    <div
                      id="auth-error"
                      className="text-xs text-[#B4482B] bg-[#FDEAE2] border border-[#F3B7A4] p-3 rounded-xl font-bold flex items-start gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-[#DE5D53] shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Existing Account Notice */}
                  {isExistingAccount && (
                    <div
                      id="auth-error"
                      className="text-xs bg-[#FDEAE2] border border-[#F3B7A4] p-3.5 rounded-xl font-bold space-y-2.5"
                    >
                      <div className="text-[#B4482B] flex items-center gap-1.5 text-xs font-black">
                        <AlertTriangle className="w-4 h-4 text-[#DE5D53] shrink-0" />
                        <span>Email này đã có tài khoản trên hệ thống!</span>
                      </div>
                      <p className="text-[#6E5D53] text-[11px] font-medium leading-relaxed">
                        Nếu bạn từng đăng nhập bằng <b>Google</b> hoặc đã đăng ký trước đó:
                      </p>
                      <div className="flex flex-col gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={handleGoogleClick}
                          className="w-full py-2 px-3 bg-white border border-[#3D352E] rounded-lg text-[#3D352E] font-extrabold text-xs text-center hover:bg-[#FAF5EB] transition-colors cursor-pointer"
                        >
                          Đăng nhập bằng Google
                        </button>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="w-full py-2 px-3 bg-white border border-[#DE5D53] rounded-lg text-[#DE5D53] font-bold text-xs text-center hover:bg-[#FFF8F5] transition-colors cursor-pointer"
                        >
                          Đặt lại mật khẩu (Quên mật khẩu)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {successMessage && (
                    <div
                      id="auth-success"
                      className="text-xs text-[#3D5A32] bg-[#EAF5E4] border border-[#8FB383] p-3 rounded-xl font-bold space-y-1"
                    >
                      <p className="text-xs font-black flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Đăng ký thành công!</span>
                      </p>
                      <p className="text-[11px] font-medium leading-relaxed">{successMessage}</p>
                    </div>
                  )}

                  {/* Cloudflare Turnstile CAPTCHA */}
                  <div
                    id="turnstile-user"
                    className="cf-turnstile pt-1 flex justify-center min-h-[65px] overflow-hidden max-w-full"
                    data-sitekey={TURNSTILE_SITE_KEY}
                    data-theme="light"
                  />

                  {/* Wax-Crayon Submit Button (HiVocab Sage for Login, Terracotta for Sign Up) */}
                  <button
                    type="submit"
                    id="btn-auth-submit"
                    disabled={isSubmitting}
                    className={`auth-crayon-btn-primary w-full h-12 px-4 text-white font-crayon font-extrabold text-sm sm:text-base disabled:opacity-50 cursor-pointer flex items-center justify-center ${
                      authMode === 'signup' ? 'is-signup' : ''
                    }`}
                  >
                    <span className="relative z-10">
                      {isSubmitting
                        ? 'Đang xử lý...'
                        : authMode === 'login'
                          ? 'Đăng nhập'
                          : 'Tạo tài khoản'}
                    </span>
                  </button>

                  {authMode === 'login' && (
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        id="link-forgot-pw"
                        onClick={handleForgotPassword}
                        className="text-xs font-bold text-[#DE5D53] hover:underline cursor-pointer"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Footer links nhẹ cuối thẻ */}
            <div className="mt-5 text-center space-y-1.5">
              <p className="text-[11px] text-[#8A796F] font-medium">
                <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  Điều khoản
                </a>{' '}
                ·{' '}
                <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  Bảo mật
                </a>
              </p>
            </div>
          </div>

          <div className="hidden lg:block h-4" aria-hidden="true" />
        </main>

        {/* ── CỘT PHẢI (50%): BÉ HỔ VẪY TAY CHÀO + POP-UP CHAT DỄ THƯƠNG ── */}
        <aside
          aria-label="Bé Hổ Churbito vẫy tay chào"
          className="hidden lg:flex lg:w-1/2 min-h-[100svh] bg-[#FAF5EB] border-l-2 border-dashed border-[#E3D7C5] relative items-center justify-center p-12 overflow-hidden select-none"
          style={{
            backgroundImage: 'radial-gradient(#E2D6C3 1.4px, transparent 1.4px)',
            backgroundSize: '24px 24px',
          }}
        >
          <div className="relative flex flex-col items-center justify-center gap-4 auth-panel-fade">
            {/* Pop-up chat dễ thương hướng xuống Bé Hổ */}
            <div className="relative z-20 bg-[#FFFDF9] border-[2.5px] border-[#3D352E] shadow-[4px_4.5px_0px_#F2CF7E] rounded-[24px] px-6 py-3.5 -rotate-1 transition-transform duration-300 hover:rotate-0 hover:-translate-y-0.5">
              <p className="font-crayon font-extrabold text-lg xl:text-xl text-[#3D352E] tracking-tight whitespace-nowrap">
                Học từ vựng cùng mình nhé
              </p>
              <div
                aria-hidden="true"
                className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-4 h-4 bg-[#FFFDF9] border-r-[2.5px] border-b-[2.5px] border-[#3D352E] rotate-45 rounded-br-[3px]"
              />
            </div>

            <div className="relative flex items-center justify-center">
              <div
                aria-hidden="true"
                className="absolute w-72 h-72 xl:w-96 xl:h-96 rounded-full bg-[#FFE9CF]/70 blur-2xl"
              />
              <img
                src="/mascot/mascot_waving.webp"
                alt="Bé Hổ Churbito đang vẫy tay chào"
                className="relative z-10 w-80 h-80 xl:w-[400px] xl:h-[400px] object-contain mix-blend-multiply drop-shadow-sm transition-transform duration-300 hover:scale-105 select-none"
                onError={(e) => {
                  e.currentTarget.src = '/mascot/mascot_waving.png';
                }}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PageLogin;
