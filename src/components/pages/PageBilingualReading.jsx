// src/components/pages/PageBilingualReading.jsx
// 100% Pure React Bilingual Reading & Interactive Context Gap-Fill Page

import React, { useCallback } from 'react';
import { useRoute } from '../../router/RouteContext.jsx';
import { useBilingualReading } from '../../hooks/useBilingualReading.js';
import { BilingualHeader } from '../bilingual/BilingualHeader.jsx';
import { BilingualReadingView } from '../bilingual/BilingualReadingView.jsx';
import { BilingualGapFillView } from '../bilingual/BilingualGapFillView.jsx';
import { BilingualVocabTooltip } from '../bilingual/BilingualVocabTooltip.jsx';
import { useModal } from '../../context/ModalContext.jsx';

export function PageBilingualReading() {
  const { navigateTo } = useRoute();
  const { openModal } = useModal();

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
    revealedParas,
    toggleParaCurtain,
    revealAllParas,
    hideAllParas,
    activeTooltip,
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
  } = useBilingualReading();

  const handleClose = useCallback(() => {
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
  }, [navigateTo]);

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
  }, [passage, activeTab]);

  return (
    <div id="page-bilingual-reading" className="page active bg-background min-h-screen">
      {/* Sticky Header & Toolbar */}
      <BilingualHeader
        passage={passage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        fontSize={fontSize}
        onChangeFontSize={changeFontSize}
        onClose={handleClose}
        onReportError={handleReportError}
        onSelectPassage={switchPassage}
      />

      {/* Main Body */}
      <main id="bilingual-reading-body" className="px-4 sm:px-6 lg:px-12 py-6 md:py-8 min-h-[calc(100vh-64px)]">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="material-symbols-outlined text-primary text-[48px] animate-spin">
              refresh
            </span>
            <p className="text-on-surface-variant text-sm font-medium animate-pulse">
              Đang chuẩn bị nội dung bài đọc song ngữ...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="max-w-md mx-auto text-center py-20 px-4">
            <span className="material-symbols-outlined text-error text-[48px] mb-3">
              error_outline
            </span>
            <h3 className="font-bold text-lg text-on-surface mb-2">Không thể tải bài đọc</h3>
            <p className="text-sm text-on-surface-variant mb-6">{error}</p>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm cursor-pointer"
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
                revealedParas={revealedParas}
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
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-surface-container-highest/95 text-error border border-error/30 shadow-2xl backdrop-blur-md active:scale-95 transition-all text-xs font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
          <span>Thoát bài đọc</span>
        </button>
      </div>

      {/* Floating Vocab Popover Tooltip */}
      <BilingualVocabTooltip tooltip={activeTooltip} onClose={closeVocabTooltip} />
    </div>
  );
}

export default PageBilingualReading;
