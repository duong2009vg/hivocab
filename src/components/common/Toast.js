/**
 * HiVocab Toast Notification Component
 */
export function showToast(message, type = 'info', durationMs = 3000) {
  if (typeof document === 'undefined') return;

  let container = document.getElementById('hivocab-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'hivocab-toast-container';
    container.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none px-4 w-full max-w-sm';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-emerald-600 text-white' :
                  type === 'error'   ? 'bg-rose-600 text-white' :
                  type === 'warning' ? 'bg-amber-500 text-white' :
                                       'bg-slate-900/90 text-white backdrop-blur-md';

  toast.className = `${bgClass} px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium text-center transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto border border-white/10`;
  toast.textContent = message;

  container.appendChild(toast);

  // Trigger animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, durationMs);
}

// Global window bridge
if (typeof window !== 'undefined') {
  window.showToast = showToast;
  window.showHiToast = showToast;
}

export default { showToast };
