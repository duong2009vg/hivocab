// src/components/pages/PageTopics.jsx
// 100% Pure React Component with Reactive State, Folder Categorization & Topic Cards
import React, { useRef } from 'react';
import { useTopics } from '../../hooks/useTopics.js';
import { openCreateTopicModal, toggleMobileProfileDropdown } from '../../legacy/legacyBridge.js';

export function PageTopics() {
  const {
    loading,
    error,
    categories,
    activeCategory,
    setActiveCategory,
    folderList,
    filteredTopics,
    isUserPro,
    searchQuery,
    setSearchQuery,
    openTopic,
    handleDeleteTopic,
  } = useTopics();

  const tabsRef = useRef(null);

  const handleSelectCategory = (catId) => {
    setActiveCategory(catId);
    if (tabsRef.current) {
      const activeEl = tabsRef.current.querySelector(`[data-cat="${catId}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  const activeCategoryObj = categories.find((c) => c.id === activeCategory);
  const activeLabel = activeCategoryObj?.label || activeCategory || 'danh mục này';

  return (
    <div id="page-topics" className="page active min-h-screen">
      <main className="lg:ml-64 min-h-screen mobile-page-top lg:pt-8 pb-28 lg:pb-12 px-4 sm:px-6 lg:px-12 flex flex-col">
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-5 md:gap-6 fade-in">

          {/* Header & Toolbar */}
          <section className="flex items-center justify-between gap-3 pt-1">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-headline-lg font-bold text-on-surface tracking-tight">
                Chủ đề
              </h1>
              <p id="topics-page-subtitle" className="text-xs sm:text-sm text-on-surface-variant mt-0.5 truncate sm:whitespace-normal">
                {activeCategory === 'all'
                  ? 'Khám phá và lựa chọn thư mục học tập của bạn.'
                  : `Thư mục: ${activeLabel} • ${filteredTopics.length} chủ đề`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openCreateTopicModal()}
                className="bg-primary text-on-primary hover:opacity-95 font-semibold text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2.5 rounded-full transition-all active:scale-[0.98] shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Tạo chủ đề</span>
              </button>
              <button
                onClick={() => toggleMobileProfileDropdown()}
                className="mobile-user-avatar lg:hidden w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden bg-cover bg-center active:scale-90 transition-transform cursor-pointer border border-outline-variant/30 shrink-0"
                aria-label="Hồ sơ"
              >
                <span className="material-symbols-outlined text-outline text-sm">person</span>
              </button>
            </div>
          </section>

          {/* Category Tabs & Quick Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div
              ref={tabsRef}
              id="category-tabs"
              className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1"
            >
              {categories.map((cat) => {
                const isActive = cat.id === activeCategory;
                return (
                  <button
                    key={cat.id}
                    data-cat={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`category-tab flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-md'
                        : 'bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary border border-outline-variant/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Inline search filter if in specific category */}
            {activeCategory !== 'all' && (
              <div className="relative w-full sm:w-64 shrink-0">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Lọc chủ đề..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-full bg-surface-container-low border border-outline-variant/30 text-on-surface placeholder:text-outline focus:border-primary focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-error-container text-error text-sm font-semibold">
              {error}
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div id="topics-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4 md:p-6 min-h-[160px] md:min-h-[200px] bg-surface-container-lowest/60 border border-outline-variant/20 animate-pulse flex flex-col justify-between"
                >
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high/60 mb-4" />
                  <div className="h-4 w-3/4 rounded bg-surface-container-high/60 mb-2" />
                  <div className="h-2 w-full rounded bg-surface-container-high/40 mt-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Main Grid View */}
          {!loading && (
            <section id="topics-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              
              {/* CHẾ ĐỘ 1: TAB "TẤT CẢ" -> HIỂN THỊ DANH SÁCH THƯ MỤC (FOLDER CARDS) */}
              {activeCategory === 'all' && (
                <>
                  {folderList.length === 0 ? (
                    <div className="col-span-2 sm:col-span-3 lg:col-span-4 flex flex-col items-center justify-center py-16 text-on-surface-variant gap-3">
                      <span className="material-symbols-outlined text-[48px] opacity-40">folder_open</span>
                      <p className="font-semibold">Chưa có thư mục nào</p>
                    </div>
                  ) : (
                    folderList.map((folder) => (
                      <div
                        key={folder.id}
                        onClick={() => handleSelectCategory(folder.id)}
                        className="folder-card-surface topic-card-surface cursor-pointer group relative bg-surface-container-lowest/80 backdrop-blur-[24px] rounded-2xl p-4 md:p-6 min-h-[160px] md:min-h-[240px] border border-outline-variant/20 soft-shadow flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 fade-in select-none"
                      >
                        <div className="flex flex-col h-full">
                          {/* Top: Folder Icon & Topics Count Badge */}
                          <div className="flex items-start justify-between gap-2 mb-2 md:mb-4">
                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface shadow-sm shrink-0 group-hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-[18px] md:text-2xl">
                                {folder.icon || 'folder'}
                              </span>
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant/30 group-hover:border-primary/40 group-hover:text-primary transition-colors shrink-0">
                              {folder.count} chủ đề
                            </span>
                          </div>

                          {/* Middle: Folder Title */}
                          <h3 className="text-sm md:text-lg font-bold text-on-surface group-hover:text-primary transition-colors leading-snug mb-1 line-clamp-2">
                            {folder.label}
                          </h3>

                          {/* Bottom: Progress Bar */}
                          <div className="mt-auto pt-3 md:pt-4 flex flex-col gap-1 md:gap-2">
                            <div className="flex justify-between items-center font-label-sm text-[9px] md:text-xs text-on-surface-variant">
                              <span>Tiến độ</span>
                              <span className="text-primary font-bold">{folder.avgProgress}%</span>
                            </div>
                            <div className="w-full h-1 md:h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${folder.avgProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* CHẾ ĐỘ 2: THƯ MỤC CỤ THỂ -> HIỂN THỊ DANH SÁCH CHỦ ĐỀ CON (TOPIC CARDS) */}
              {activeCategory !== 'all' && (
                <>
                  {filteredTopics.length === 0 ? (
                    <div className="col-span-2 sm:col-span-3 lg:col-span-4 flex flex-col items-center justify-center py-16 text-on-surface-variant gap-3">
                      <span className="material-symbols-outlined text-[48px] opacity-40">folder_open</span>
                      <p className="font-semibold">Chưa có chủ đề nào trong {activeLabel}</p>
                      <button
                        onClick={() => openCreateTopicModal()}
                        className="mt-2 bg-primary/10 text-primary hover:bg-primary/20 font-bold text-sm px-5 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Tạo chủ đề
                      </button>
                    </div>
                  ) : (
                    filteredTopics.map((topic) => {
                      const pct = topic.progress ?? 0;
                      const isPro = Boolean(topic.is_pro);
                      const showProBadge = isPro && !isUserPro;

                      return (
                        <div
                          key={topic.id}
                          id={`topic-card-${topic.id}`}
                          onClick={() => openTopic(topic.id, topic.name, topic.category)}
                          className="topic-card-surface cursor-pointer group relative bg-surface-container-lowest/80 backdrop-blur-[24px] rounded-2xl p-4 md:p-6 min-h-[160px] md:min-h-[240px] border border-outline-variant/20 soft-shadow flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg fade-in select-none"
                        >
                          {/* Close / Delete Topic Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTopic(topic.id, topic.name);
                            }}
                            className="absolute top-2 left-2 md:top-3 md:left-3 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full text-outline hover:bg-error-container hover:text-error transition-colors z-10 cursor-pointer"
                            title="Xóa chủ đề"
                          >
                            <span className="material-symbols-outlined text-[16px] md:text-[20px]">close</span>
                          </button>

                          {/* PRO Badge */}
                          {showProBadge && (
                            <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
                                <span className="material-symbols-outlined text-[12px]">workspace_premium</span>
                                PRO
                              </span>
                            </div>
                          )}

                          <div className="flex flex-col h-full mt-4 md:mt-8">
                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface mb-2 md:mb-4 shadow-sm shrink-0">
                              <span className="material-symbols-outlined text-[18px] md:text-2xl">
                                {topic.icon || 'folder'}
                              </span>
                            </div>
                            <h3 className="text-sm md:text-lg font-bold text-on-surface group-hover:text-primary transition-colors leading-snug mb-1 line-clamp-2">
                              {topic.name}
                            </h3>
                            <div className="mt-auto pt-3 md:pt-4 flex flex-col gap-1 md:gap-2">
                              <div className="flex justify-between items-center font-label-sm text-[9px] md:text-xs text-on-surface-variant">
                                <span>Tiến độ</span>
                                <span className="text-primary font-bold">{pct}%</span>
                              </div>
                              <div className="w-full h-1 md:h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}

            </section>
          )}

        </div>
      </main>
    </div>
  );
}

export default PageTopics;
