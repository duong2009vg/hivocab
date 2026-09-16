/**
 * HiVocab Mobile Bottom Navigation Bar (Dock)
 * Clean, tactile Apple-style dock bar for iOS & Android
 */

export function renderBottomNav(activeRoute = 'dashboard') {
  const items = [
    { id: 'dashboard', label: 'Tổng quan', icon: 'space_dashboard' },
    { id: 'topics',    label: 'Chủ đề',    icon: 'folder' },
    { id: 'thpt',      label: 'Luyện đề',  icon: 'school' },
    { id: 'library',   label: 'Thư viện',  icon: 'explore' },
    { id: 'settings',  label: 'Cài đặt',   icon: 'settings' }
  ];

  return `
    <nav class="lg:hidden fixed bottom-0 inset-x-0 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/30 z-40 pb-safe">
      <div class="flex items-center justify-around h-16">
        ${items.map(item => {
          const isActive = activeRoute === item.id;
          const colorClass = isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface';
          return `
            <a href="#${item.id}" class="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${colorClass}">
              <span class="material-symbols-outlined text-2xl ${isActive ? 'icon-fill' : ''}">${item.icon}</span>
              <span class="text-[11px] tracking-tight">${item.label}</span>
            </a>
          `;
        }).join('')}
      </div>
    </nav>
  `;
}

export default { renderBottomNav };
