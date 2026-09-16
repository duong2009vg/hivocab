/**
 * HiVocab Desktop Sidebar Navigation Component
 */

export function renderSidebar(activeRoute = 'dashboard') {
  const navItems = [
    { id: 'dashboard', label: 'Tổng quan',   icon: 'space_dashboard' },
    { id: 'topics',    label: 'Bộ từ vựng',  icon: 'folder' },
    { id: 'thpt',      label: 'Luyện đề thi',icon: 'school' },
    { id: 'library',   label: 'Cộng đồng',   icon: 'explore' },
    { id: 'settings',  label: 'Cài đặt',     icon: 'settings' }
  ];

  return `
    <aside class="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 w-64 bg-surface/80 backdrop-blur-xl border-r border-outline-variant/30 z-40 p-5 select-none">
      <div class="flex items-center gap-3 mb-8 px-2">
        <img src="/logo-mark.svg" alt="HiVocab Logo" class="w-9 h-9"/>
        <div class="flex flex-col">
          <span class="font-bold text-lg text-on-surface leading-tight">HiVocab</span>
          <span class="text-xs text-on-surface-variant">Master Vocabulary</span>
        </div>
      </div>

      <nav class="flex flex-col gap-1.5 flex-1">
        ${navItems.map(item => {
          const isActive = activeRoute === item.id;
          const activeClass = isActive ? 
            'bg-primary text-on-primary font-semibold shadow-sm' : 
            'text-on-surface-variant hover:bg-surface-container hover:text-on-surface';
          return `
            <a href="#${item.id}" class="flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all text-sm ${activeClass}">
              <span class="material-symbols-outlined text-xl ${isActive ? 'icon-fill' : ''}">${item.icon}</span>
              <span>${item.label}</span>
            </a>
          `;
        }).join('')}
      </nav>

      <div class="pt-4 border-t border-outline-variant/30 flex items-center justify-between px-2">
        <button onclick="window.openAddWordModal && window.openAddWordModal()" class="w-full bg-primary/10 text-primary hover:bg-primary/20 font-bold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-lg">add</span>
          <span>Thêm từ mới</span>
        </button>
      </div>
    </aside>
  `;
}

export default { renderSidebar };
