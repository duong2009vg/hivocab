// src/components/pages/PageBilingualReading.jsx
// Trang Đọc Song Ngữ & Đục Lỗ Ngữ Cảnh - Phong cách Cozy Crayon ấm áp

import React, { useCallback } from 'react';
import { useRoute } from '../../router/RouteContext.jsx';
import { useBilingualReading } from '../../hooks/useBilingualReading.js';
import { BilingualHeader } from '../bilingual/BilingualHeader.jsx';
import { BilingualReadingView } from '../bilingual/BilingualReadingView.jsx';
import { BilingualGapFillView } from '../bilingual/BilingualGapFillView.jsx';
import { BilingualVocabTooltip } from '../bilingual/BilingualVocabTooltip.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import { CrayonLockOverlay } from '../common/CrayonLockOverlay.jsx';

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

  const isProLocked = Boolean(
    error?.includes('Pro') ||
    error === 'PRO_REQUIRED' ||
    (!loading && (!passage?.contentEn || !passage?.contentVi) && passage?.isPro) ||
    (!loading && error && error.toLowerCase().includes('pro'))
  );

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
  }, [passage, activeTab, openModal]);

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
        onClose={handleClose}
        onReportError={handleReportError}
        onSelectPassage={switchPassage}
      />

      {/* Main Body */}
      <main id="bilingual-reading-body" className="px-4 sm:px-6 lg:px-12 py-6 md:py-8 min-h-[calc(100vh-64px)]">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-[#5a7d4d]/30 border-t-[#5a7d4d] rounded-full animate-spin" />
            <p className="text-[#766C5F] text-xs sm:text-sm font-bold animate-pulse">
              Đang chuẩn bị nội dung bài đọc song ngữ... 🐾
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
                badgeText="NỘI DUNG ĐỘC QUYỀN PRO 👑"
                description="Bài đọc này nằm trong bộ đề Cambridge IELTS dành riêng cho gói HiVocab PRO. Nâng cấp ngay để đọc song ngữ Anh - Việt, tra cứu từ vựng ngữ cảnh và luyện đục lỗ nhé!"
                ctaText="Nâng Cấp PRO Ngay — Chỉ từ 25k/tháng 🚀"
                onUnlockSuccess={() => window.location.reload()}
                onBack={handleClose}
                backText="Quay lại danh sách bài"
              />
            </div>
          </div>
        )}

        {error && !isProLocked && !loading && (
          <div className="max-w-md mx-auto text-center py-16 px-6 bg-white rounded-3xl border-2 border-[#382E2B] shadow-[3px_4px_0px_#382E2B]">
            <span className="text-4xl mb-3 block">⚠️</span>
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
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#D36135] text-white border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 transition-all text-xs font-black cursor-pointer"
        >
          <span>✕</span>
          <span>Thoát bài đọc</span>
        </button>
      </div>

      {/* Floating Vocab Popover Tooltip */}
      <BilingualVocabTooltip tooltip={activeTooltip} onClose={closeVocabTooltip} />
    </div>
  );
}

export default PageBilingualReading;
