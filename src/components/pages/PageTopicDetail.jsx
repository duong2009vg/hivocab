// src/components/pages/PageTopicDetail.jsx
// 100% Pure React Component with Reactive State, Cambridge Tests/Passages & Non-CAM Lessons
import React from 'react';
import { useTopicDetail } from '../../hooks/useTopicDetail.js';
import { useRoute } from '../../router/RouteContext.jsx';
import { useModal } from '../../context/ModalContext.jsx';

export function PageTopicDetail() {
  const { openModal } = useModal();
  const {
    topicId,
    topicName,
    loading,
    error,
    isUserPro,
    isCambridge,
    camHierarchy,
    camStats,
    currentTestIndex,
    setCurrentTestIndex,
    currentPassages,
    lessons,
    nonCamTotalWords,
    openPassage,
    openUnlinkedWords,
    openLesson,
    startPractice,
    startReading,
  } = useTopicDetail();

  const { navigateTo } = useRoute();

  const subtitle = isCambridge
    ? `${camStats.totalTests} bài Test · ${camStats.totalPassages} bài đọc · ${camStats.totalWords} từ vựng`
    : `${lessons.length} bài học · ${nonCamTotalWords} từ vựng`;

  return (
    <div id="page-topic-detail" className="page active min-h-screen">
      {/* Sub Sidebar dùng riêng cho Chi tiết chủ đề (Desktop) */}
      <nav
        id="sub-sidebar"
        className="hidden lg:flex flex-col h-screen fixed left-0 top-0 w-64 p-6 bg-surface/80 backdrop-blur-xl border-r border-outline-variant/20 shadow-sm z-50 select-none"
      >
        <div className="mb-6 shrink-0">
          <img className="brand-logo" src="logo-mark.svg" alt="Hi" />
          <p className="text-on-surface-variant text-xs mt-3">Chủ đề hiện tại</p>
          <p id="sub-sidebar-topic-name" className="text-sm font-bold text-on-surface mt-1 line-clamp-2">
            {topicName}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1">
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-2 ml-2 shrink-0">
            Hướng dẫn
          </p>
          <div className="px-3 py-3 rounded-xl bg-primary/5 border border-primary/10 text-xs text-on-surface-variant leading-relaxed">
            <span className="material-symbols-outlined text-[16px] text-primary align-middle mr-1">info</span>
            Chọn một bài học bên dưới để bắt đầu học từ vựng và luyện tập.
          </div>
        </div>

        <div className="mt-auto shrink-0 pt-4 border-t border-outline-variant/20">
          <a
            onClick={() => navigateTo('topics')}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface cursor-pointer text-sm font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Quay lại</span>
          </a>
        </div>
      </nav>

      {/* Sub Header Mobile dùng riêng cho Chi tiết chủ đề */}
      <header
        id="sub-mobile-header"
        className="lg:hidden flex fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20 px-3 pb-2.5 items-center gap-2 mobile-sticky-top"
      >
        <button
          onClick={() => navigateTo('topics')}
          className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-all active:scale-90 shrink-0 cursor-pointer"
          aria-label="Quay lại danh sách chủ đề"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div id="td-mobile-header-title" className="font-bold text-on-surface truncate text-base sm:text-lg">
          {topicName}
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-28 lg:pt-8 pb-28 lg:pb-12 px-4 sm:px-6 lg:px-12 flex flex-col">
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6 lg:gap-8 fade-in">

          {/* Desktop header */}
          <div className="hidden lg:flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h2 id="td-title" className="text-2xl sm:text-headline-lg font-bold text-on-surface tracking-tight">
                {topicName}
              </h2>
              <p id="td-subtitle" className="text-on-surface-variant text-sm mt-1">
                {subtitle}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => openModal('addWord', { topicId })}
                className="bg-primary text-on-primary hover:opacity-95 font-bold text-sm px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm shadow-primary/20 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Thêm từ vựng</span>
              </button>
            </div>
          </div>

          {/* Mobile header card */}
          <div className="flex flex-col lg:hidden gap-3 mt-2">
            <div className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/20 rounded-2xl p-5 soft-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 id="td-title-mobile" className="text-xl font-bold text-on-surface leading-tight truncate">
                    {topicName}
                  </h2>
                  <p id="td-subtitle-mobile" className="text-xs text-on-surface-variant mt-1">
                    {subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openModal('addWord', { topicId })}
                    className="bg-primary text-on-primary font-bold text-xs px-3 py-2 rounded-xl transition-all active:opacity-85 shadow-sm shadow-primary/20 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Thêm từ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-4 rounded-xl bg-error-container text-error text-sm font-semibold">
              {error}
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5 bg-surface-container-lowest/60 border border-outline-variant/20 animate-pulse flex flex-col gap-3 min-h-[140px]"
                >
                  <div className="h-4 w-1/3 rounded bg-surface-container-high/60" />
                  <div className="h-5 w-3/4 rounded bg-surface-container-high/60" />
                  <div className="h-2 w-full rounded bg-surface-container-high/40 mt-auto" />
                </div>
              ))}
            </div>
          )}

          {/* TRƯỜNG HỢP 1: Chế độ Cambridge IELTS (Có phân cấp Test -> Passage) */}
          {!loading && isCambridge && (
            <div className="flex flex-col gap-6">
              {/* Test Tabs Selector */}
              <div id="cam-test-tabs-container" className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">quiz</span>
                    Chọn bài Test
                  </span>
                  <span id="cam-test-info" className="text-xs font-medium text-on-surface-variant">
                    {camStats.totalTests} bài Test · {camStats.totalPassages} bài đọc
                  </span>
                </div>
                <div id="cam-test-tabs" className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                  {camHierarchy.tests.map((test, idx) => {
                    const isActive = idx === currentTestIndex;
                    return (
                      <button
                        key={test.id || idx}
                        onClick={() => setCurrentTestIndex(idx)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-primary text-on-primary shadow-md'
                            : 'bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary border border-outline-variant/30'
                        }`}
                      >
                        <span>{test.name}</span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {test.totalWords} từ
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Passages List for Active Test */}
              <div id="lessons-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentPassages.map((p) => {
                  const prog = p.progress || 0;
                  const barColor = prog >= 80 ? 'bg-green-500' : prog >= 40 ? 'bg-primary' : 'bg-yellow-400';
                  const isPro = Boolean(p.isPro);
                  const showPassageProBadge = isPro && !isUserPro;
                  const testName = camHierarchy.tests[currentTestIndex]?.name || 'Test';

                  return (
                    <div
                      key={p.id}
                      onClick={() => openPassage(p, testName)}
                      className="cursor-pointer group bg-surface-container-lowest/80 backdrop-blur-[24px] rounded-2xl p-5 border border-outline-variant/20 soft-shadow flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg fade-in select-none"
                    >
                      <div>
                        {/* Top row: Badge Passage X + Progress % */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-[15px]">article</span>
                            Passage {p.passageNumber}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {showPassageProBadge && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
                                <span className="material-symbols-outlined text-[12px]">lock</span>
                                PRO
                              </span>
                            )}
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {prog}%
                            </span>
                          </div>
                        </div>

                        {/* Title & Topic label */}
                        <h3 className="font-bold text-sm sm:text-base text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {p.title || `Passage ${p.passageNumber}`}
                        </h3>
                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">
                          {p.topicLabel || 'Từ vựng cốt lõi'}
                        </p>
                      </div>

                      {/* Bottom actions & progress bar */}
                      <div className="mt-4 pt-3 border-t border-outline-variant/10 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs text-on-surface-variant">
                          <span className="font-medium">{p.totalWords || 0} từ</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startReading(p.id);
                            }}
                            className="inline-flex items-center gap-1 text-primary hover:underline font-bold text-xs"
                          >
                            <span className="material-symbols-outlined text-[15px]">menu_book</span>
                            Đọc bài
                          </button>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                          <div
                            className={`h-full ${barColor} rounded-full transition-all duration-700`}
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Unlinked words card (if user added custom words) */}
                {camHierarchy.unlinkedWords && camHierarchy.unlinkedWords.length > 0 && (
                  <div
                    onClick={() => openUnlinkedWords()}
                    className="cursor-pointer group bg-surface-container-lowest/80 backdrop-blur-[24px] rounded-2xl p-5 border border-dashed border-primary/30 soft-shadow flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg fade-in select-none"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          <span className="material-symbols-outlined text-[15px]">folder_special</span>
                          Bổ sung
                        </span>
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-on-surface group-hover:text-primary transition-colors">
                        Từ vựng tự thêm / Bổ sung
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Từ người dùng tự lưu ngoài bài đọc
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-outline-variant/10 flex items-center justify-between text-xs text-on-surface-variant">
                      <span className="font-medium">{camHierarchy.unlinkedWords.length} từ</span>
                      <span className="text-primary font-bold">Xem từ →</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TRƯỜNG HỢP 2: Chủ đề Non-CAM (Oxford, Destination C1-C2, IELTS, etc.) */}
          {!loading && !isCambridge && (
            <div id="lessons-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.length === 0 ? (
                <div className="col-span-3 flex flex-col items-center justify-center py-20 text-on-surface-variant gap-3">
                  <span className="material-symbols-outlined text-[48px] opacity-30">menu_book</span>
                  <p className="font-semibold">Chủ đề này chưa có từ vựng nào.</p>
                </div>
              ) : (
                lessons.map((lesson) => {
                  const prog = lesson.progress || 0;
                  const barColor = prog >= 80 ? 'bg-green-500' : prog >= 40 ? 'bg-primary' : 'bg-yellow-400';

                  return (
                    <div
                      key={lesson.id || lesson.index}
                      onClick={() => openLesson(lesson)}
                      className="cursor-pointer group bg-surface-container-lowest/80 backdrop-blur-[24px] rounded-2xl p-5 border border-outline-variant/20 soft-shadow flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg fade-in select-none"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">menu_book</span>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {prog}%
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors">
                          {lesson.name}
                        </h3>
                        <p className="text-sm text-on-surface-variant mt-0.5">
                          {lesson.totalWords} từ vựng
                        </p>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-700`}
                          style={{ width: `${prog}%` }}
                        />
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

export default PageTopicDetail;
