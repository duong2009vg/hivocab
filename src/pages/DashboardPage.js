/**
 * HiVocab Dashboard Page
 * Renders daily goal, review queue, streak, and memory level statistics
 */

export function renderDashboard(stats = {}) {
  const wordsDue = stats.wordsDueCount || 0;
  const streak = stats.streak || 0;

  return `
    <div class="space-y-6 max-w-5xl mx-auto">
      <!-- Welcome & Streak Banner -->
      <section class="glass-card soft-shadow rounded-2xl p-6 relative overflow-hidden border border-outline-variant/30">
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-on-surface">Chào mừng trở lại!</h1>
            <p class="text-on-surface-variant text-sm mt-1">Hôm nay bạn có <span class="font-bold text-primary">${wordsDue} từ</span> cần ôn tập.</p>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="window.startReviewSession && window.startReviewSession()" class="bg-primary hover:bg-surface-tint text-on-primary font-bold px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2">
              <span class="material-symbols-outlined">play_arrow</span>
              <span>Bắt đầu ôn tập (${wordsDue})</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass-card rounded-2xl p-4 border border-outline-variant/30">
          <div class="text-xs text-on-surface-variant font-medium">Chuỗi ngày học</div>
          <div class="text-2xl font-bold text-amber-500 mt-1 flex items-center gap-1">
            <span class="material-symbols-outlined">local_fire_department</span>
            <span>${streak} ngày</span>
          </div>
        </div>
        <div class="glass-card rounded-2xl p-4 border border-outline-variant/30">
          <div class="text-xs text-on-surface-variant font-medium">Cần ôn hôm nay</div>
          <div class="text-2xl font-bold text-primary mt-1">${wordsDue}</div>
        </div>
        <div class="glass-card rounded-2xl p-4 border border-outline-variant/30">
          <div class="text-xs text-on-surface-variant font-medium">Đã ghi nhớ sâu</div>
          <div class="text-2xl font-bold text-emerald-600 mt-1">${stats.masteredCount || 0}</div>
        </div>
        <div class="glass-card rounded-2xl p-4 border border-outline-variant/30">
          <div class="text-xs text-on-surface-variant font-medium">Tổng từ vựng</div>
          <div class="text-2xl font-bold text-on-surface mt-1">${stats.totalWords || 0}</div>
        </div>
      </div>
    </div>
  `;
}

export default { renderDashboard };
