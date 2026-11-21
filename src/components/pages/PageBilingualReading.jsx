// src/components/pages/PageBilingualReading.jsx
// Trang Đọc Song Ngữ & Đục Lỗ Ngữ Cảnh - Hỗ trợ Hub trên Taskbar chính & Đọc trực tiếp từ Bài học

import React, { useCallback, useEffect, useState } from 'react';
import { useRoute } from '../../router/RouteContext.jsx';
import { AlertTriangle, X } from 'lucide-react';
import { useBilingualReading } from '../../hooks/useBilingualReading.js';
import { useBilingualHub, saveLastBilingualReading } from '../../hooks/useBilingualHub.js';
import { BilingualHubView } from '../bilingual/BilingualHubView.jsx';
import { BilingualHeader } from '../bilingual/BilingualHeader.jsx';
import { BilingualReadingView } from '../bilingual/BilingualReadingView.jsx';
import { BilingualGapFillView } from '../bilingual/BilingualGapFillView.jsx';
import { BilingualVocabTooltip } from '../bilingual/BilingualVocabTooltip.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import { CrayonLockOverlay } from '../common/CrayonLockOverlay.jsx';

function resolveInitialEntry() {
  if (typeof window === 'undefined') {
    return { origin: 'hub', passageId: null };
  }
  const explicitOrigin = window._bilingualEntryOrigin;
  const candidatePassageId =
    window._currentPassageId && window._currentPassageId !== '__unlinked__'
      ? window._currentPassageId
      : null;

  if (explicitOrigin === 'hub') {
    return { origin: 'hub', passageId: null };
  }
  if (candidatePassageId) {
    return { origin: explicitOrigin || 'lesson', passageId: candidatePassageId };
  }
  return { origin: 'hub', passageId: null };
}

export function PageBilingualReading({ onReadingModeChange }) {
  const { navigateTo } = useRoute();
  const { openModal } = useModal();

  const [initialEntry] = useState(resolveInitialEntry);
  const [entryOrigin, setEntryOrigin] = useState(initialEntry.origin);
  const [selectedPassageId, setSelectedPassageId] = useState(initialEntry.passageId);

  const isViewingHub = !selectedPassageId;

  const hub = useBilingualHub(isViewingHub);

  const {
    passage,
    words,
    loading,
    error,
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    fontSize,
    changeFontSize,
    enParas,
    viParas,
    totalParas,
    vocabMap,
    vocabRegex,
    showHighlights,
    toggleHighlights,
    showVocabPopup,
    toggleVocabPopup,
    showVocabSidebar,
    toggleVocabSidebar,
    curtainMode,
    revealedParas,
    toggleParaCurtain,
    revealAllParas,
    hideAllParas,
    activeTooltip,
    selectedVocabWord,
    openVocabTooltip,
    closeVocabTooltip,
    // Gap fill
    gapItems,
    currentGapIndex,
    checkGapItem,
    hintGapItem,
    revealGapItem,
    resetGapExercises,
    nextGapItem,
    prevGapItem,
    setCurrentGapIndex,
    switchPassage,
  } = useBilingualReading(selectedPassageId, { skipAutoResolve: true });

  // Notify App.jsx whether reader full-width focus mode is active (hides desktop sidebar & mobile bottom nav)
  useEffect(() => {
    if (typeof onReadingModeChange === 'function') {
      onReadingModeChange(!isViewingHub);
    }
  }, [isViewingHub, onReadingModeChange]);

  useEffect(() => {
    return () => {
      if (typeof onReadingModeChange === 'function') {
        onReadingModeChange(false);
      }
    };
  }, [onReadingModeChange]);

  // Listen to explicit hub reset events from sidebar / bottom nav / dashboard
  useEffect(() => {
    const handleOpenHub = () => {
      setEntryOrigin('hub');
      setSelectedPassageId(null);
      switchPassage(null);
      hub.closeShelfDetail();
      hub.refreshLastReading();
      if (typeof window !== 'undefined') window.scrollTo(0, 0);
    };
    window.addEventListener('hi:bilingual-open-hub', handleOpenHub);
    return () => window.removeEventListener('hi:bilingual-open-hub', handleOpenHub);
  }, [switchPassage, hub]);

  // Persist last opened passage metadata once loaded cleanly
  useEffect(() => {
    if (!passage?.id || loading || error) return;
    saveLastBilingualReading({
      passageId: passage.id,
      topicId: typeof window !== 'undefined' ? window._currentTopicId : null,
      topicName: passage.topicName,
      testName: passage.testName,
      passageNumber: passage.passageNumber,
      title: passage.title,
      titleVi: passage.titleVi || null,
      topicLabel: passage.topicLabel,
      isNewsArticle: Boolean(passage.isNewsArticle),
    });
  }, [passage, loading, error]);

  const isProLocked = Boolean(
    error?.includes('Pro') ||
    error === 'PRO_REQUIRED' ||
    (!loading && (!passage?.contentEn || !passage?.contentVi) && passage?.isPro) ||
    (!loading && error && error.toLowerCase().includes('pro'))
  );

  const handleOpenPassageFromHub = useCallback(
    (item, test, initialTab = 'reading') => {
      if (!item?.id) return;
      if (typeof window !== 'undefined') {
        window._bilingualEntryOrigin = 'hub';
        window._currentTopicId = hub.selectedBook?.id || null;
        window._currentTopicName = hub.selectedBook?.name || 'IELTS Actual Tests';
        window._currentTestId = test?.id || null;
        window._currentTestName = test?.name || 'Test';
        window._currentPassageId = item.id;
        window._currentPassageIsPro = Boolean(item.isPro || test?.isPro || hub.selectedBook?.is_pro);
        window._camHierarchy = hub.hierarchy || null;
      }

      saveLastBilingualReading({
        passageId: item.id,
        topicId: hub.selectedBook?.id || null,
        topicName: hub.selectedBook?.name || 'IELTS Actual Tests',
        testId: test?.id || null,
        testName: test?.name || 'Test',
        passageNumber: item.passageNumber,
        title: item.title,
        titleVi: item.titleVi || null,
        topicLabel: item.topicLabel,
      });

      setEntryOrigin('hub');
      setSelectedPassageId(item.id);
      switchPassage(item.id, initialTab);
      if (typeof window !== 'undefined') window.scrollTo(0, 0);
    },
    [hub.selectedBook, hub.hierarchy, switchPassage]
  );

  const handleOpenNewsFromHub = useCallback(
    (article) => {
      if (!article?.id) return;
      const list = hub.filteredNewsArticles?.length > 0 ? hub.filteredNewsArticles : hub.newsArticles;
      const newsTests = [];
      for (let i = 0; i < list.length; i += 20) {
        const chunk = list.slice(i, i + 20);
        newsTests.push({
          id: `news-group-${i}`,
          name: `Bài báo ${chunk[0]?.index || i + 1} – ${chunk[chunk.length - 1]?.index || i + chunk.length}`,
          passages: chunk,
        });
      }

      if (typeof window !== 'undefined') {
        window._bilingualEntryOrigin = 'hub';
        window._currentTopicId = null;
        window._currentTopicName = article.topicName || 'Báo Song Ngữ Chọn Lọc';
        window._currentTestId = null;
        window._currentTestName = article.topicLabel || 'Báo Song Ngữ';
        window._currentPassageId = article.id;
        window._currentPassageIsPro = false;
        window._camHierarchy = { tests: newsTests };
      }

      saveLastBilingualReading({
        passageId: article.id,
        topicId: null,
        topicName: article.topicName || 'Báo Song Ngữ Chọn Lọc',
        testId: null,
        testName: article.topicLabel || 'Báo Song Ngữ',
        passageNumber: article.index,
        title: article.title,
        titleVi: article.titleVi || null,
        topicLabel: article.topicLabel,
        isNewsArticle: true,
      });

      setEntryOrigin('hub');
      setSelectedPassageId(article.id);
      switchPassage(article.id, 'reading');
      if (typeof window !== 'undefined') window.scrollTo(0, 0);
    },
    [hub.filteredNewsArticles, hub.newsArticles, switchPassage]
  );

  const handleResumeLastReading = useCallback(() => {
    const last = hub.lastReading;
    if (!last?.passageId) return;
    const isNews = Boolean(last.isNewsArticle || String(last.passageId).startsWith('news-'));
    if (typeof window !== 'undefined') {
      window._bilingualEntryOrigin = 'hub';
      window._currentTopicId = isNews ? null : last.topicId || hub.selectedBook?.id || null;
      window._currentTopicName = last.topicName || (isNews ? 'Báo Song Ngữ Chọn Lọc' : 'IELTS Actual Tests');
      window._currentTestId = last.testId || null;
      window._currentTestName = last.testName || (isNews ? last.topicLabel || 'Báo Song Ngữ' : 'Test');
      window._currentPassageId = last.passageId;
      window._currentPassageIsPro = false;
      window._camHierarchy = !isNews && last.topicId && last.topicId === hub.selectedBookId ? hub.hierarchy : null;
    }
    setEntryOrigin('hub');
    setSelectedPassageId(last.passageId);
    switchPassage(last.passageId, 'reading');
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, [hub.lastReading, hub.selectedBook, hub.selectedBookId, hub.hierarchy, switchPassage]);

  const handleOpenProModalFromHub = useCallback(
    (item) => {
      openModal('pricing', {
        source: 'bilingual-hub',
        passageTitle: item?.title || 'Đọc Song Ngữ IELTS PRO',
      });
    },
    [openModal]
  );

  const handleSwitchPassageInReader = useCallback(
    (newId) => {
      if (!newId) return;
      setSelectedPassageId(newId);
      switchPassage(newId);
    },
    [switchPassage]
  );

  const handleClose = useCallback(() => {
    if (entryOrigin === 'hub') {
      setSelectedPassageId(null);
      switchPassage(null);
      hub.refreshLastReading();
      if (typeof window !== 'undefined') {
        window._currentPassageId = null;
        window.scrollTo(0, 0);
      }
      return;
    }

    if (typeof window !== 'undefined') {
      if (window._currentPassageId && window._currentPassageId !== '__unlinked__') {
        navigateTo('lesson-detail');
        return;
      }
      if (window._currentTopicId) {
        navigateTo('topic-detail');
        return;
      }
    }
    navigateTo('topics');
  }, [entryOrigin, switchPassage, hub, navigateTo]);

  const handleReportError = useCallback(() => {
    openModal('bugReport', {
      feature: 'bilingual_reading',
      reportType: 'typo',
      title: passage ? `Bài đọc: ${passage.title || passage.id}` : 'Bài đọc Song ngữ',
      contextData: {
        passage_id: passage?.id,
        passage_title: passage?.title,
        test_name: passage?.testName,
        topic_name: passage?.topicName,
        active_tab: activeTab,
      },
    });
  }, [passage, activeTab, openModal]);

  if (isViewingHub) {
    return (
      <BilingualHubView
        activeShelf={hub.activeShelf}
        onOpenVolBook={hub.openVolBook}
        onOpenNewsShelf={hub.openNewsShelf}
        onBackToShelves={hub.closeShelfDetail}
        books={hub.books}
        booksLoading={hub.booksLoading}
        selectedBook={hub.selectedBook}
        selectedBookMeta={hub.selectedBookMeta}
        selectedBookId={hub.selectedBookId}
        onSelectBook={hub.setSelectedBookId}
        hierarchyLoading={hub.hierarchyLoading}
        hierarchyError={hub.hierarchyError}
        isUserPro={hub.isUserPro}
        tests={hub.tests}
        filteredTests={hub.filteredTests}
        selectedTestId={hub.selectedTestId}
        onSelectTest={hub.setSelectedTestId}
        searchQuery={hub.searchQuery}
        onSearchChange={hub.setSearchQuery}
        filterMode={hub.filterMode}
        onFilterModeChange={hub.setFilterMode}
        bookStats={hub.bookStats}
        lastReading={hub.lastReading}
        onResumeLastReading={handleResumeLastReading}
        onOpenPassage={handleOpenPassageFromHub}
        onOpenProModal={handleOpenProModalFromHub}
        newsCategories={hub.newsCategories}
        newsArticles={hub.newsArticles}
        newsLoading={hub.newsLoading}
        selectedNewsCategory={hub.selectedNewsCategory}
        onSelectNewsCategory={hub.setSelectedNewsCategory}
        newsSearchQuery={hub.newsSearchQuery}
        onNewsSearchChange={hub.setNewsSearchQuery}
        filteredNewsArticles={hub.filteredNewsArticles}
        newsCategoryCounts={hub.newsCategoryCounts}
        onOpenNewsArticle={handleOpenNewsFromHub}
      />
    );
  }

  return (
    <div id="page-bilingual-reading" className="page active bg-[#FAF5EB] min-h-screen text-[#382E2B] font-sans antialiased">
      {/* Sticky Header & Toolbar */}
      <BilingualHeader
        passage={passage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        fontSize={fontSize}
        onChangeFontSize={changeFontSize}
        showHighlights={showHighlights}
        onToggleHighlights={toggleHighlights}
        showVocabPopup={showVocabPopup}
        onToggleVocabPopup={toggleVocabPopup}
        showVocabSidebar={showVocabSidebar}
        onToggleVocabSidebar={toggleVocabSidebar}
        vocabCount={words.length}
        onClose={handleClose}
        onReportError={handleReportError}
        onSelectPassage={handleSwitchPassageInReader}
      />

      {/* Main Body */}
      <main id="bilingual-reading-body" className="px-4 sm:px-6 lg:px-12 py-6 md:py-8 min-h-[calc(100vh-64px)]">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-[#5a7d4d]/30 border-t-[#5a7d4d] rounded-full animate-spin" />
            <p className="text-[#766C5F] text-xs sm:text-sm font-bold animate-pulse">
              Đang chuẩn bị nội dung bài đọc song ngữ...
            </p>
          </div>
        )}

        {isProLocked && !loading && (
          <div className="relative min-h-[520px] flex items-center justify-center py-6">
            {/* Background blurred reading preview */}
            <div className="absolute inset-0 filter blur-md select-none pointer-events-none opacity-30 space-y-6 max-w-4xl mx-auto py-8 px-4" aria-hidden="true">
              <div className="h-8 bg-[#3D352E]/25 rounded-xl w-3/4 mx-auto mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-[#3D352E]/20 rounded w-full"></div>
                <div className="h-4 bg-[#3D352E]/20 rounded w-11/12"></div>
                <div className="h-4 bg-[#3D352E]/20 rounded w-full"></div>
                <div className="h-4 bg-[#3D352E]/20 rounded w-4/5"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="p-4 bg-white rounded-2xl border border-[#3D352E]/20 space-y-2">
                  <div className="h-4 bg-[#3D352E]/20 rounded w-full"></div>
                  <div className="h-4 bg-[#3D352E]/20 rounded w-5/6"></div>
                  <div className="h-4 bg-[#3D352E]/20 rounded w-full"></div>
                </div>
                <div className="p-4 bg-[#F4EDE2] rounded-2xl border border-[#3D352E]/20 space-y-2">
                  <div className="h-4 bg-[#3D352E]/20 rounded w-full"></div>
                  <div className="h-4 bg-[#3D352E]/20 rounded w-4/5"></div>
                  <div className="h-4 bg-[#3D352E]/20 rounded w-full"></div>
                </div>
              </div>
            </div>

            {/* Center Lock Overlay */}
            <div className="relative z-20 w-full px-4">
              <CrayonLockOverlay
                title="Mở Khóa Toàn Bộ Bài Đọc Song Ngữ & Tra Cứu"
                badgeText="NỘI DUNG ĐỘC QUYỀN PRO"
                description="Bài đọc này nằm trong bộ đề Cambridge IELTS dành riêng cho gói HiVocab PRO. Nâng cấp ngay để đọc song ngữ Anh - Việt, tra cứu từ vựng ngữ cảnh và luyện đục lỗ nhé!"
                ctaText="Nâng Cấp PRO Ngay — Chỉ từ 25k/tháng"
                onUnlockSuccess={() => window.location.reload()}
                onBack={handleClose}
                backText="Quay lại danh sách bài"
              />
            </div>
          </div>
        )}

        {error && !isProLocked && !loading && (
          <div className="max-w-md mx-auto text-center py-16 px-6 bg-white rounded-3xl border-2 border-[#382E2B] shadow-[3px_4px_0px_#382E2B]">
            <AlertTriangle className="w-10 h-10 text-[#C85A3F] mx-auto mb-3 shrink-0" />
            <h3 className="font-heading font-black text-lg text-[#382E2B] mb-2">Không thể tải bài đọc</h3>
            <p className="text-xs font-semibold text-[#766C5F] mb-6">{error}</p>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 rounded-2xl bg-[#5a7d4d] text-white font-black text-sm border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer"
            >
              Quay lại
            </button>
          </div>
        )}

        {!loading && !error && passage && (
          <>
            {activeTab === 'reading' && (
              <BilingualReadingView
                passage={passage}
                words={words}
                enParas={enParas}
                viParas={viParas}
                totalParas={totalParas}
                viewMode={viewMode}
                fontSize={fontSize}
                vocabRegex={vocabRegex}
                vocabMap={vocabMap}
                showHighlights={showHighlights}
                showVocabSidebar={showVocabSidebar}
                onToggleVocabSidebar={toggleVocabSidebar}
                curtainMode={curtainMode}
                revealedParas={revealedParas}
                selectedVocabWord={selectedVocabWord}
                onToggleCurtain={toggleParaCurtain}
                onRevealAll={revealAllParas}
                onHideAll={hideAllParas}
                onWordClick={openVocabTooltip}
              />
            )}

            {activeTab === 'gap-fill' && (
              <BilingualGapFillView
                gapItems={gapItems}
                currentGapIndex={currentGapIndex}
                onCheck={checkGapItem}
                onHint={hintGapItem}
                onReveal={revealGapItem}
                onReset={resetGapExercises}
                onNext={nextGapItem}
                onPrev={prevGapItem}
                onGoTo={setCurrentGapIndex}
                onSwitchTab={setActiveTab}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Exit Button on Mobile */}
      <div className="md:hidden fixed bottom-6 right-4 z-50">
        <button
          type="button"
          onClick={handleClose}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#D36135] text-white border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 transition-all text-xs font-black cursor-pointer"
        >
          <X className="w-4 h-4 shrink-0" />
          <span>{entryOrigin === 'hub' ? 'Danh sách bài' : 'Thoát bài đọc'}</span>
        </button>
      </div>

      {/* Floating Vocab Popover Tooltip */}
      <BilingualVocabTooltip tooltip={activeTooltip} onClose={closeVocabTooltip} />
    </div>
  );
}

export default PageBilingualReading;
