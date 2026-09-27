// src/components/pages/PageLessonDetail.jsx
// 100% Pure React Component with Reactive State, Word Filters, Audio Player & SRS Levels
import React from 'react';
import { useLessonDetail, SRS_LEVEL_CONFIG } from '../../hooks/useLessonDetail.js';
import { openAddWordModal, openPricingModal } from '../../legacy/legacyBridge.js';

export function PageLessonDetail() {
  const {
    topicId,
    topicName,
    passageId,
    lessonName,
    words,
    filteredWords,
    loading,
    error,
    progressPercent,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    handleDeleteWord,
    handlePlayWord,
    startPractice,
    startReading,
    goBack,
  } = useLessonDetail();

  const isPassage = Boolean(passageId && passageId !== '__unlinked__');

  return (
    <div id="page-lesson-detail" className="page active min-h-screen">
      {/* Sidebar bên trái (Desktop) */}
      <nav
        id="sub-sidebar"
        className="hidden lg:flex flex-col h-screen fixed left-0 top-0 w-64 p-6 bg-surface/80 backdrop-blur-xl border-r border-outline-variant/20 shadow-sm z-50 select-none"
      >
        <div className="mb-6 shrink-0">
          <img className="brand-logo" src="logo-mark.svg" alt="Hi" />
          <p id="ld-sidebar-topic" className="text-on-surface-variant text-xs mt-3 truncate">
            {topicName}
          </p>
          <p id="ld-sidebar-lesson" className="text-base font-bold text-on-surface mt-1 line-clamp-2">
            {lessonName}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1">
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-1 ml-2 shrink-0">
            Chế độ học
          </p>
          <a
            onClick={() => startPractice(0)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[20px]">flash_on</span>
            <span>Flashcard</span>
          </a>
          <a
            onClick={() => startPractice(1)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[20px]">quiz</span>
            <span>Trắc Nghiệm</span>
          </a>
          <a
            onClick={() => startPractice(2)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[20px]">text_fields</span>
            <span>Điền từ</span>
          </a>
          <a
            onClick={() => startPractice(3)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[20px]">record_voice_over</span>
            <span>Nghe và viết</span>
          </a>
          {isPassage && (
            <a
              id="ld-sidebar-reading-btn"
              onClick={() => startReading()}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-primary font-bold bg-primary/10 hover:bg-primary/15 transition-colors cursor-pointer text-sm"
            >
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
              <span>Đọc &amp; Dịch</span>
            </a>
          )}
        </div>

        <div className="mt-auto shrink-0 pt-4 border-t border-outline-variant/20">
          <a
            onClick={goBack}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface cursor-pointer text-sm font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Quay lại</span>
          </a>
        </div>
      </nav>

      {/* Mobile header */}
      <header
        id="sub-mobile-header"
        className="lg:hidden flex fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20 px-3 pb-2.5 items-center gap-2 mobile-sticky-top"
      >
        <button
          onClick={goBack}
          className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-all active:scale-90 shrink-0 cursor-pointer"
          aria-label="Quay lại chủ đề"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div id="ld-mobile-header-title" className="font-bold text-on-surface truncate text-base sm:text-lg">
          {lessonName}
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-28 lg:pt-8 pb-28 lg:pb-12 px-4 sm:px-6 lg:px-12 flex flex-col">
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6 lg:gap-8 fade-in">

          {/* Desktop header */}
          <div className="hidden lg:flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h2 id="ld-title" className="text-2xl sm:text-headline-lg font-bold text-on-surface tracking-tight">
                {lessonName}
              </h2>
              <p id="ld-subtitle" className="text-on-surface-variant text-sm mt-1">
                {words.length} từ vựng
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => openAddWordModal(topicId, passageId)}
                className="bg-primary text-on-primary hover:opacity-95 font-bold text-sm px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm shadow-primary/20 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Thêm từ vựng</span>
              </button>
              {isPassage && (
                <button
                  type="button"
                  onClick={() => startReading()}
                  className="bg-primary/10 text-primary hover:bg-primary/20 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">menu_book</span>
                  <span>Đọc bài song ngữ</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile header card */}
          <div className="flex flex-col lg:hidden gap-3 mt-2">
            <div className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/20 rounded-2xl p-5 soft-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block mb-1">
                    {passageId ? 'Passage' : 'Lesson'}
                  </span>
                  <h2 id="ld-title-mobile" className="text-xl font-bold text-on-surface leading-tight truncate">
                    {lessonName}
                  </h2>
                  <p id="ld-subtitle-mobile" className="text-xs text-on-surface-variant mt-1">
                    {words.length} từ vựng
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openAddWordModal(topicId, passageId)}
                    className="bg-primary text-on-primary font-bold text-xs px-3 py-2 rounded-xl transition-all active:opacity-85 shadow-sm shadow-primary/20 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Thêm từ</span>
                  </button>
                </div>
              </div>

              {/* Progress bar mobile */}
              <div className="mt-4 pt-3 border-t border-outline-variant/10 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs text-on-surface-variant">
                  <span>Tiến độ ghi nhớ</span>
                  <span className="text-primary font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Search bar & Status Filter Pills */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/20 rounded-2xl p-3 soft-shadow">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm từ, phát âm, nghĩa tiếng Việt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-surface-container-low border border-outline-variant/20 text-on-surface placeholder:text-outline focus:border-primary focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 rounded-full cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-hide">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'new', label: 'Từ mới' },
                { id: 'learning', label: 'Đang ôn' },
                { id: 'mastered', label: 'Đã thuộc' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setStatusFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === pill.id
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* PRO Access Locked Screen */}
          {error === 'PRO_REQUIRED' && (
            <div className="py-16 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                <span className="material-symbols-outlined text-3xl">lock</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-on-surface">Nội dung dành riêng cho gói PRO</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  Chủ đề này thuộc gói tài liệu cao cấp. Nâng cấp HiVocab PRO để mở khóa toàn bộ từ vựng và luyện tập không giới hạn.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => openPricingModal()}
                  className="py-2.5 px-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-500/25 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">diamond</span>
                  <span>Mở khóa PRO ngay</span>
                </button>
              </div>
            </div>
          )}

          {/* Other Errors */}
          {error && error !== 'PRO_REQUIRED' && (
            <div className="p-4 rounded-xl bg-error-container text-error text-sm font-semibold">
              {error}
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4 bg-surface-container-lowest/60 border border-outline-variant/20 animate-pulse flex items-center gap-4 min-h-[72px]"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high/60 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/4 rounded bg-surface-container-high/60" />
                    <div className="h-3 w-1/2 rounded bg-surface-container-high/40" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Words List */}
          {!loading && error !== 'PRO_REQUIRED' && (
            <div id="lesson-words-list" className="flex flex-col gap-3">
              {filteredWords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-3">
                  <span className="material-symbols-outlined text-[48px] opacity-30">inbox</span>
                  <p className="font-semibold">
                    {searchQuery ? 'Không tìm thấy từ vựng phù hợp.' : 'Phần này chưa có từ vựng.'}
                  </p>
                </div>
              ) : (
                filteredWords.map((w, i) => {
                  const lv = Math.min(Math.max(w.level || 0, 0), 5);
                  const lvConfig = SRS_LEVEL_CONFIG[lv] || SRS_LEVEL_CONFIG[0];
                  const wordId = w.id || w.wordId;

                  return (
                    <div
                      key={wordId || i}
                      className="group bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 soft-shadow hover:shadow-md transition-all fade-in"
                    >
                      {/* Index badge */}
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs sm:text-sm font-bold text-primary">{i + 1}</span>
                      </div>

                      {/* Word Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">
                            {w.word}
                          </span>
                          {w.pos && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {w.pos}
                            </span>
                          )}
                          {w.phonetic && (
                            <span className="text-xs text-outline font-mono">
                              {w.phonetic}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lvConfig.color}`}>
                            {lvConfig.label}
                          </span>

                          {/* Sound button */}
                          <button
                            type="button"
                            onClick={() => handlePlayWord(w.word)}
                            className="p-1 rounded-full hover:bg-primary/10 transition-colors text-outline hover:text-primary cursor-pointer ml-auto"
                            title="Phát âm"
                          >
                            <span className="material-symbols-outlined text-[18px]">volume_up</span>
                          </button>

                          {/* Delete word button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteWord(wordId, w.word)}
                            className="p-1 rounded-full hover:bg-error-container text-outline hover:text-error transition-colors cursor-pointer"
                            title="Xóa từ"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>

                        {/* Meaning (Vietnamese) */}
                        <p className="text-sm font-medium text-on-surface mt-0.5 leading-snug">
                          {w.meaning}
                        </p>

                        {/* Example sentence */}
                        {w.exampleSentence && (
                          <p className="text-xs text-on-surface-variant italic mt-1 leading-relaxed border-l-2 border-outline-variant/30 pl-2">
                            "{w.exampleSentence}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default PageLessonDetail;
