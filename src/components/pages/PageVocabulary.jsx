// src/components/pages/PageVocabulary.jsx
// Pixel-Perfect React Component with Reactive State, Filter, Search, Audio & SRS Charts
import React from 'react';
import { useVocabulary } from '../../hooks/useVocabulary.js';
import {
  openVocabAddModal,
  openVocabBulkAddModal,
  toggleMobileProfileDropdown,
  openSRSExplainerModal,
  navigate,
} from '../../legacy/legacyBridge.js';

const LV_LABEL = ['Mới', '1h', '8h', '1 ngày', '1 tuần', '1 tháng'];
const LV_COLOR = [
  'bg-surface-container text-outline',
  'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300',
  'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
  'bg-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
];

const LEVEL_PALETTE = {
  lv0: { color: '#94a3b8', name: 'Lvl 0' },
  lv1: { color: '#f97316', name: 'Lvl 1' },
  lv2: { color: '#f59e0b', name: 'Lvl 2' },
  lv3: { color: '#0ea5e9', name: 'Lvl 3' },
  lv4: { color: '#a855f7', name: 'Lvl 4' },
  lv5: { color: '#10b981', name: 'Lvl 5' },
};

export function PageVocabulary() {
  const {
    words,
    total,
    page,
    setPage,
    pageSize,
    search,
    handleSearchChange,
    clearSearch,
    levelFilter,
    handleLevelFilterChange,
    topicId,
    handleTopicFilterChange,
    topics,
    srsStats,
    loading,
    error,
    deleteWord,
    playWord,
    refresh,
  } = useVocabulary();

  const memoryLevels = srsStats.memoryLevels || { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 };
  const totalSRS =
    (memoryLevels.lv0 || 0) +
    (memoryLevels.lv1 || 0) +
    (memoryLevels.lv2 || 0) +
    (memoryLevels.lv3 || 0) +
    (memoryLevels.lv4 || 0) +
    (memoryLevels.lv5 || 0);

  const maxLevelCount = Math.max(
    memoryLevels.lv0 || 0,
    memoryLevels.lv1 || 0,
    memoryLevels.lv2 || 0,
    memoryLevels.lv3 || 0,
    memoryLevels.lv4 || 0,
    memoryLevels.lv5 || 0,
    1
  );

  const getBarHeight = (count) => {
    if (!count || count === 0) return '10px';
    return `${Math.max(12, Math.round((count / maxLevelCount) * 100))}%`;
  };

  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;

  const isFilterActive = search || levelFilter !== null || topicId !== '';

  const getPagesToShow = () => {
    const pages = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)) {
        pages.push(p);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div id="page-vocabulary" className="page active">
      <main className="lg:ml-64 min-h-screen mobile-page-top lg:pt-8 pb-32 lg:pb-14 px-4 sm:px-6 lg:px-12 flex flex-col">
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-5 lg:gap-6 fade-in">
          {/* Header Section */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 lg:gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-headline-lg text-xl sm:text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight">
                  <span className="hidden lg:inline">Kho từ vựng</span>
                  <span className="lg:hidden">Sổ từ cá nhân</span>
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Đã học
                </span>
              </div>
              <p id="vocab-subtitle" className="text-xs sm:text-sm text-on-surface-variant mt-1">
                {search
                  ? `Tìm thấy ${total.toLocaleString('vi-VN')} từ vựng trong sổ tay phù hợp với "${search}".`
                  : levelFilter !== null
                  ? `Lọc được ${total.toLocaleString('vi-VN')} từ vựng theo cấp độ ghi nhớ.`
                  : `Sổ tay cá nhân · Tổng cộng ${total.toLocaleString('vi-VN')} từ vựng bạn đã học và lưu trữ.`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={openVocabAddModal}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-primary text-on-primary text-xs sm:text-sm font-semibold flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Thêm từ vựng</span>
              </button>
              <button
                type="button"
                onClick={openVocabBulkAddModal}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 text-xs sm:text-sm font-semibold flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">playlist_add</span>
                <span>Thêm hàng loạt</span>
              </button>
              <button
                type="button"
                onClick={toggleMobileProfileDropdown}
                className="mobile-user-avatar lg:hidden w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden bg-cover bg-center active:scale-90 transition-transform cursor-pointer border border-outline-variant/30 shrink-0"
                aria-label="Hồ sơ"
              >
                <span className="material-symbols-outlined text-outline text-sm">person</span>
              </button>
            </div>
          </header>

          {/* THẺ TỔNG QUAN SRS & PHÂN BỐ TỪ VỰNG THEO CẤP ĐỘ */}
          <section className="bg-surface-container-lowest dark:bg-surface-container-low/60 rounded-3xl p-4 sm:p-6 border border-outline-variant/20 shadow-xs flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px] icon-fill">
                  published_with_changes
                </span>
                <h2 className="font-bold text-sm sm:text-base text-on-surface">Tổng quan SRS</h2>
                <button
                  type="button"
                  onClick={openSRSExplainerModal}
                  className="text-outline hover:text-primary transition-colors p-1 rounded-full cursor-pointer flex items-center justify-center"
                  title="Tìm hiểu về thuật toán ghi nhớ SRS & 6 cấp độ"
                >
                  <span className="material-symbols-outlined text-[18px]">help_outline</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={refresh}
                  className="text-outline hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-container cursor-pointer flex items-center justify-center"
                  title="Làm mới dữ liệu"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                </button>
              </div>
            </div>

            {/* Card phân bố dạng viên thuốc */}
            <div className="bg-surface-container-low/50 dark:bg-surface-container/30 rounded-2xl p-3 sm:p-5 border border-outline-variant/15">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] sm:text-xs md:text-sm font-extrabold text-on-surface-variant tracking-wider uppercase">
                  Phân bố từ vựng theo cấp độ
                </span>
                <span
                  id="vocab-total-summary-badge"
                  className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full"
                >
                  {totalSRS.toLocaleString('vi-VN')} từ
                </span>
              </div>

              {/* 6 Cột viên thuốc Lvl 0 -> Lvl 5 */}
              <div className="grid grid-cols-6 gap-1 sm:gap-2 md:gap-3 items-end pt-2 pb-1 select-none">
                {[0, 1, 2, 3, 4, 5].map((lvl) => {
                  const key = `lv${lvl}`;
                  const count = memoryLevels[key] || 0;
                  const cfg = LEVEL_PALETTE[key];
                  const isSelected = levelFilter === lvl;

                  return (
                    <div
                      key={lvl}
                      id={`vocab-col-lv${lvl}`}
                      onClick={() => handleLevelFilterChange(isSelected ? null : lvl)}
                      className={`vocab-chart-col flex flex-col items-center group cursor-pointer p-1 sm:p-1.5 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-primary/15 ring-2 ring-primary/40'
                          : 'hover:bg-surface-container-high/60'
                      }`}
                      title={`Cấp ${lvl}: Bấm để lọc`}
                    >
                      <span
                        id={`vocab-mem-lv${lvl}-count`}
                        className="text-xs sm:text-sm font-bold text-on-surface mb-1.5 transition-transform group-hover:scale-110"
                      >
                        {count}
                      </span>
                      <div className="w-full flex items-end justify-center h-[95px] sm:h-[120px] md:h-[135px]">
                        <div
                          id={`vocab-mem-lv${lvl}-bar`}
                          className="w-5 sm:w-6 md:w-7 rounded-full transition-all duration-700 ease-out shadow-xs group-hover:brightness-95"
                          style={{ backgroundColor: cfg.color, height: getBarHeight(count) }}
                        ></div>
                      </div>
                      <span
                        className={`text-[10px] sm:text-xs font-bold mt-2 transition-colors ${
                          isSelected ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'
                        }`}
                      >
                        Lvl {lvl}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section Heading: Danh sách từ đang học */}
          <div className="flex items-center justify-between pt-1">
            <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-1.5">
              <span>Danh sách từ đang học</span>
              <span id="vocab-list-heading-count" className="text-xs sm:text-sm font-bold text-outline">
                ({total.toLocaleString('vi-VN')})
              </span>
            </h2>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                search
              </span>
              <input
                id="vocab-search"
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-label="Tìm kiếm từ vựng hoặc nghĩa tiếng Việt"
                placeholder="Tìm kiếm từ vựng, nghĩa tiếng Việt..."
                className="w-full pl-10 pr-9 py-2.5 bg-surface-container-low border border-outline-variant/25 focus:border-primary focus:bg-surface transition-all outline-none rounded-2xl text-xs sm:text-sm text-on-surface placeholder:text-outline/70 shadow-2xs"
              />
              {search && (
                <button
                  id="vocab-search-clear"
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Topic Filter Dropdown */}
            <div className="flex items-center gap-2">
              <select
                id="vocab-topic-filter"
                value={topicId}
                onChange={(e) => handleTopicFilterChange(e.target.value)}
                className="bg-surface-container-low border border-outline-variant/25 rounded-2xl px-3 py-2 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary cursor-pointer transition-colors shadow-2xs max-w-[200px] truncate"
              >
                <option value="">📁 Tất cả chủ đề</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pill Filter Badges (Levels) */}
          <div
            id="vocab-level-pills"
            className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs font-semibold no-scrollbar"
          >
            <button
              type="button"
              onClick={() => handleLevelFilterChange(null)}
              className={`vocab-pill px-3 py-1.5 rounded-full shrink-0 cursor-pointer transition-all ${
                levelFilter === null
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => handleLevelFilterChange(-1)}
              className={`vocab-pill px-3 py-1.5 rounded-full shrink-0 cursor-pointer transition-all flex items-center gap-1 ${
                levelFilter === -1
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span>⏰ Cần ôn</span>
            </button>
            {[0, 1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => handleLevelFilterChange(lvl)}
                className={`vocab-pill px-3 py-1.5 rounded-full shrink-0 cursor-pointer transition-all ${
                  levelFilter === lvl
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                Lvl {lvl}
              </button>
            ))}
          </div>

          {/* Vocabulary List Container */}
          <div id="vocab-list" className="flex flex-col gap-3 flex-1 min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-3">
                <span className="material-symbols-outlined text-primary text-[40px] animate-spin">refresh</span>
                <p className="text-xs sm:text-sm font-medium">Đang tải sổ từ của bạn...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-error gap-3 bg-red-50/50 dark:bg-red-950/20 rounded-3xl border border-red-200 dark:border-red-900/40 p-6 text-center">
                <span className="material-symbols-outlined text-[44px]">error</span>
                <h3 className="font-bold text-sm">Không thể tải sổ từ vựng</h3>
                <p className="text-xs text-on-surface-variant">{error}</p>
                <button
                  type="button"
                  onClick={refresh}
                  className="mt-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer hover:bg-primary-dark transition-all"
                >
                  Thử lại
                </button>
              </div>
            ) : words.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-on-surface-variant gap-4 bg-surface-container-lowest/60 rounded-3xl border border-outline-variant/20 p-6 sm:p-8 text-center max-w-lg mx-auto w-full my-4">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[36px]">
                    {isFilterActive ? 'search_off' : 'collections_bookmark'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-on-surface">
                    {isFilterActive ? 'Không tìm thấy từ vựng phù hợp' : 'Sổ từ của bạn đang trống'}
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                    {isFilterActive
                      ? 'Thử xóa từ khóa tìm kiếm hoặc đổi bộ lọc cấp độ để xem lại các từ khác trong sổ tay.'
                      : 'Những từ bạn học trong mục Chủ đề sẽ tự động lưu vào đây. Bạn cũng có thể tự thêm từ vựng mới vào sổ tay ngay bây giờ!'}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 pt-2 flex-wrap justify-center">
                  {isFilterActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        clearSearch();
                        handleLevelFilterChange(null);
                        handleTopicFilterChange('');
                      }}
                      className="px-4 py-2 bg-surface-container text-on-surface font-semibold text-xs rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                      Xóa tất cả bộ lọc
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => navigate('topics')}
                        className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary">explore</span>
                        <span>Khám phá Chủ đề để học</span>
                      </button>
                      <button
                        type="button"
                        onClick={openVocabAddModal}
                        className="px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-xs hover:bg-surface-tint transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Thêm từ đầu tiên</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              words.map((w, i) => {
                const lv = Math.min(Math.max(w.level || 0, 0), 5);
                const globalIndex = startIndex + i + 1;

                return (
                  <div
                    key={w.id || i}
                    className="group bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant/20 hover:border-primary/40 rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 soft-shadow hover:shadow-md transition-all"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 text-primary font-black text-xs sm:text-sm flex items-center justify-center shrink-0 mt-0.5">
                      {globalIndex}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-on-surface text-base sm:text-lg group-hover:text-primary transition-colors tracking-tight">
                          {w.word}
                        </span>
                        {w.pos && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {w.pos}
                          </span>
                        )}
                        {w.phonetic && (
                          <span className="text-xs sm:text-sm text-outline font-mono">{w.phonetic}</span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LV_COLOR[lv]}`}>
                          {LV_LABEL[lv]}
                        </span>
                        {w.topicName && (
                          <span
                            className="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant truncate max-w-[180px]"
                            title={w.topicName}
                          >
                            {w.topicName}
                          </span>
                        )}

                        <div className="ml-auto flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => playWord(w.word)}
                            className="p-1.5 rounded-full hover:bg-primary/10 transition-colors text-outline hover:text-primary cursor-pointer"
                            title="Phát âm"
                          >
                            <span className="material-symbols-outlined text-[19px]">volume_up</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteWord(w.id, w.word)}
                            className="p-1.5 rounded-full hover:bg-rose-500/10 transition-colors text-outline hover:text-rose-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Xóa khỏi sổ từ"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 font-medium leading-relaxed">
                        {w.meaning}
                      </p>
                      {w.exampleSentence && (
                        <p className="text-xs sm:text-sm text-outline italic mt-1.5 leading-relaxed bg-surface-container-lowest/60 p-2 rounded-xl border border-outline-variant/15">
                          {w.exampleSentence}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div id="vocab-pagination" className="flex items-center justify-center gap-2 py-4 flex-wrap">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs font-bold transition-all ${
                  page <= 1
                    ? 'opacity-40 cursor-not-allowed text-outline'
                    : 'hover:bg-primary/10 text-on-surface cursor-pointer'
                }`}
              >
                &larr; Trước
              </button>

              {getPagesToShow().map((p, idx) =>
                p === '...' ? (
                  <span key={idx} className="px-2 py-1 text-xs text-outline font-bold select-none">
                    ...
                  </span>
                ) : (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                      p === page
                        ? 'bg-primary text-white shadow-xs pointer-events-none'
                        : 'border border-outline-variant/40 hover:bg-primary/10 text-on-surface font-semibold'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={`px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs font-bold transition-all ${
                  page >= totalPages
                    ? 'opacity-40 cursor-not-allowed text-outline'
                    : 'hover:bg-primary/10 text-on-surface cursor-pointer'
                }`}
              >
                Sau &rarr;
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={openVocabAddModal}
        className="lg:hidden fixed bottom-20 right-5 z-40 w-13 h-13 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.35)] active:scale-90 transition-transform cursor-pointer border border-white/20"
        title="Thêm từ mới vào Sổ từ"
        aria-label="Thêm từ vựng"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>
    </div>
  );
}

export default PageVocabulary;
