/**
 * HiVocab App Header Component
 * Handles mobile top navbar, user profile badge, streak display, and quick actions.
 */

export function renderHeader(user, streak = 0) {
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Khách';
  const avatar = user?.user_metadata?.avatar_url;

  return `
    <header class="fixed top-0 inset-x-0 h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant/40 z-40 flex items-center justify-between px-4 lg:px-6">
      <div class="flex items-center gap-3">
        <a href="#dashboard" class="flex items-center gap-2">
          <img src="/logo-mark.svg" alt="HiVocab" class="w-8 h-8"/>
          <span class="font-bold text-lg text-on-surface">HiVocab</span>
        </a>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 font-semibold text-sm">
          <span class="material-symbols-outlined text-base">local_fire_department</span>
          <span>${streak} ngày</span>
        </div>
        <div class="relative cursor-pointer" onclick="window.toggleMobileProfileDropdown && window.toggleMobileProfileDropdown()">
          ${avatar ? 
            `<img src="${avatar}" alt="${name}" class="w-9 h-9 rounded-full object-cover border border-outline-variant"/>` :
            `<div class="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">${name[0].toUpperCase()}</div>`
          }
        </div>
      </div>
    </header>
  `;
}

export default { renderHeader };
