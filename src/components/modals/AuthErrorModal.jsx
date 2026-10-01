// src/components/modals/AuthErrorModal.jsx
// 100% Pure React Modal for Authentication Errors
import React from 'react';
import { useModal } from '../../context/ModalContext.jsx';

export function AuthErrorModal() {
  const { modals, closeModal } = useModal();
  const isOpen = Boolean(modals?.authError?.open);
  const desc = modals?.authError?.desc || 'Đã có lỗi xảy ra trong quá trình xác thực tài khoản.';

  if (!isOpen) return null;

  const handleClose = () => {
    closeModal('authError');
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-sm bg-surface rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30 p-6 space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
          <span className="material-symbols-outlined text-3xl">error_outline</span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-on-surface">Lỗi xác thực</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">{desc}</p>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:opacity-95 transition-all shadow-sm cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthErrorModal;
