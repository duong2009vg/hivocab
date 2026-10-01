// src/components/modals/ForgotPasswordModal.jsx
// 100% Pure React Modal for Forgot Password via Supabase Auth
import React, { useState } from 'react';
import { useModal } from '../../context/ModalContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { supabase } from '../../lib/supabaseClient.js';

export function ForgotPasswordModal() {
  const { modals, closeModal } = useModal();
  const { success, error: toastError } = useToast();

  const isOpen = Boolean(modals?.forgotPassword?.open);

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setEmail('');
    setIsSuccess(false);
    setErrorMessage('');
    closeModal('forgotPassword');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/#reset-password` : '';
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setIsSuccess(true);
      success('Đã gửi email khôi phục mật khẩu! 📩');
    } catch (err) {
      setErrorMessage(err?.message || 'Không thể gửi email đặt lại mật khẩu.');
      toastError(err?.message || 'Lỗi gửi email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-md bg-surface rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30 p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">lock_reset</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Quên mật khẩu</h2>
              <p className="text-xs text-on-surface-variant">Lấy lại quyền truy cập tài khoản</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-outline hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {isSuccess ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">mark_email_read</span>
            </div>
            <h3 className="font-bold text-on-surface">Kiểm tra hộp thư của bạn</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Chúng tôi đã gửi một liên kết đặt lại mật khẩu đến <strong>{email}</strong>. Vui lòng kiểm tra cả thư mục Spam/Rác.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-2 px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs"
            >
              Đã hiểu
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Nhập địa chỉ email tài khoản của bạn. Chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu.
            </p>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
                Email đăng ký
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary px-4 py-2.5 rounded-xl outline-none text-on-surface text-sm transition-colors"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-error-container text-error text-xs font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:opacity-95 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <span>Gửi liên kết</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
