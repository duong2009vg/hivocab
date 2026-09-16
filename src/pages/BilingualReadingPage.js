/**
 * HiVocab Bilingual Reading Page Component
 * Wraps the parallel-fetched, in-memory cached bilingual reading engine
 */

export function renderBilingualReading() {
  return `
    <div id="bilingual-reading-container" class="max-w-4xl mx-auto space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-outline-variant/30">
        <button onclick="window.navigateTo && window.navigateTo('dashboard')" class="flex items-center gap-1.5 text-primary hover:text-primary/80 font-semibold text-sm transition-colors">
          <span class="material-symbols-outlined text-lg">arrow_back</span>
          <span>Quay lại</span>
        </button>
        <div id="bilingual-reading-controls" class="flex items-center gap-2">
          <!-- Reading Mode / Display Options -->
        </div>
      </div>

      <!-- Passage Body Container -->
      <article id="bilingual-reading-body" class="glass-card soft-shadow rounded-2xl p-5 md:p-8 space-y-6">
        <div id="bilingual-passage-loading" class="flex flex-col items-center justify-center py-16 text-on-surface-variant gap-3">
          <div class="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-medium">Đang tải bài đọc và từ vựng...</p>
        </div>
        <div id="bilingual-passage-content" class="hidden space-y-6 text-on-surface leading-relaxed text-base md:text-lg">
          <!-- Injected via bilingualReading.js -->
        </div>
      </article>
    </div>
  `;
}

export default { renderBilingualReading };
