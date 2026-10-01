// src/context/ToastContext.jsx
// 100% Pure React Toast Notification System with Liquid-Glass Floating UI
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idCounter = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3200) => {
    if (!message) return;
    const id = ++idCounter.current;
    const newToast = { id, message, type, duration };

    // Giữ tối đa 3 toast đồng thời để không tràn màn hình
    setToasts((prev) => [...prev.slice(-2), newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const success = useCallback((msg, duration) => showToast(msg, 'success', duration), [showToast]);
  const error = useCallback((msg, duration) => showToast(msg, 'error', duration), [showToast]);
  const info = useCallback((msg, duration) => showToast(msg, 'info', duration), [showToast]);
  const warning = useCallback((msg, duration) => showToast(msg, 'warning', duration), [showToast]);

  // Backward-compatibility: expose to window.showHiToast so legacy code and external callbacks still work
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.showHiToast = (msg, type = 'info') => showToast(msg, type);
    }
    return () => {
      if (typeof window !== 'undefined' && window.showHiToast) {
        delete window.showHiToast;
      }
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning, removeToast }}>
      {children}

      {/* Floating Toast Container */}
      <div
        className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none flex flex-col items-center gap-2 max-w-[92vw] sm:max-w-md w-full px-4"
        aria-live="polite"
      >
        {toasts.map((t) => {
          let bgClass = 'bg-slate-900/90 text-white border-white/10';
          let icon = 'info';
          let iconColor = 'text-blue-400';

          if (t.type === 'success') {
            bgClass = 'bg-emerald-700/95 text-white border-emerald-500/30';
            icon = 'check_circle';
            iconColor = 'text-emerald-300';
          } else if (t.type === 'error') {
            bgClass = 'bg-rose-700/95 text-white border-rose-500/30';
            icon = 'error';
            iconColor = 'text-rose-200';
          } else if (t.type === 'warning') {
            bgClass = 'bg-amber-600/95 text-white border-amber-400/30';
            icon = 'warning';
            iconColor = 'text-amber-200';
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md border text-xs sm:text-sm font-semibold transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200 ${bgClass}`}
              role="alert"
            >
              <span className={`material-symbols-outlined text-[20px] shrink-0 ${iconColor}`}>
                {icon}
              </span>
              <span className="flex-1 leading-snug break-words">{t.message}</span>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="ml-1 p-0.5 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-label="Đóng thông báo"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback nếu gọi ngoài ToastProvider
    return {
      showToast: (msg, type) => (typeof window !== 'undefined' ? window.alert?.(msg) : null),
      success: (msg) => (typeof window !== 'undefined' ? window.alert?.(msg) : null),
      error: (msg) => (typeof window !== 'undefined' ? window.alert?.(msg) : null),
      info: (msg) => (typeof window !== 'undefined' ? window.alert?.(msg) : null),
      warning: (msg) => (typeof window !== 'undefined' ? window.alert?.(msg) : null),
      removeToast: () => {},
    };
  }
  return ctx;
}

export default ToastContext;
