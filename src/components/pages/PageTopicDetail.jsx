// src/components/pages/PageTopicDetail.jsx
// 100% Exact match to "frontend fix" (code.html, DESIGN.md, screen.png)
import React, { useMemo } from 'react';
import { useTopicDetail } from '../../hooks/useTopicDetail.js';
import { useRoute } from '../../router/RouteContext.jsx';
import { useModal } from '../../context/ModalContext.jsx';

export function PageTopicDetail() {
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
    openLesson,
    startPractice,
    startReading,
  } = useTopicDetail();

  const { navigateTo } = useRoute();
  const { openModal } = useModal();

  // Metrics computation safely guarded against NaN
  const totalTests = useMemo(() => {
    return isCambridge ? (camHierarchy?.tests?.length || 0) : 0;
  }, [isCambridge, camHierarchy]);

  const totalPassages = useMemo(() => {
    return isCambridge
      ? (camStats?.totalPassages || camHierarchy?.tests?.reduce((sum, t) => sum + (t.passages?.length || 0), 0) || 0)
      : 0;
  }, [isCambridge, camStats, camHierarchy]);

  const totalWords = useMemo(() => {
    if (isCambridge) {
      if (camStats?.totalWords && camStats.totalWords > 0) return camStats.totalWords;
      return (
        camHierarchy?.tests?.reduce(
          (sum, t) => sum + (t.passages?.reduce((pSum, p) => pSum + (p.totalWords || p.wordsCount || 0), 0) || 0),
          0
        ) || 0
      );
    }
    return nonCamTotalWords || 0;
  }, [isCambridge, camStats, camHierarchy, nonCamTotalWords]);

  const learnedCount = useMemo(() => {
    if (isCambridge) {
      return (
        camHierarchy?.tests?.reduce(
          (sum, t) => sum + (t.passages?.reduce((pSum, p) => pSum + (p.learnedWords || 0), 0) || 0),
          0
        ) || 0
      );
    }
    return lessons?.reduce((sum, l) => sum + (l.learnedWords || 0), 0) || 0;
  }, [isCambridge, camHierarchy, lessons]);

  const overallProgress = useMemo(() => {
    if (totalWords > 0 && learnedCount > 0) {
      return Math.min(100, Math.round((learnedCount / totalWords) * 100));
    }
    if (isCambridge) {
      const allPassages = camHierarchy?.tests?.flatMap((t) => t.passages || []) || [];
      if (allPassages.length === 0) return 0;
      const totalProg = allPassages.reduce((sum, p) => sum + (p.progress || 0), 0);
      return Math.round(totalProg / allPassages.length);
    }
    if (!lessons || lessons.length === 0) return 0;
    const totalProg = lessons.reduce((sum, l) => sum + (l.progress || 0), 0);
    return Math.round(totalProg / lessons.length);
  }, [totalWords, learnedCount, isCambridge, camHierarchy, lessons]);

  const dueOrLearningCount = useMemo(() => {
    return Math.max(0, totalWords - learnedCount);
  }, [totalWords, learnedCount]);

  const handleAddWord = () => {
    openModal('addWord', { topicId });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `HiVocab - ${topicName}`,
          text: `Cùng học từ vựng bài đọc ${topicName} trên HiVocab nhé!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Đã sao chép liên kết vào bộ nhớ tạm!');
      }
    } catch (_) {}
  };

  const currentTest = isCambridge && camHierarchy?.tests ? camHierarchy.tests[currentTestIndex] : null;
  const firstPassage = currentPassages?.[0];

  // Colors for passage badges
  const passageBadgeColors = [
    { badgeBg: 'bg-[#FFF5E6]', progBg: 'bg-[#E0F2E9] text-emerald-800 border-emerald-400', barColor: 'bg-[#4D6B53]' },
    { badgeBg: 'bg-[#EBF4FA]', progBg: 'bg-[#FEF3C7] text-amber-800 border-amber-300', barColor: 'bg-amber-500' },
    { badgeBg: 'bg-[#FFF0ED]', progBg: 'bg-[#F3EEEA] text-[#786F66] border-gray-300', barColor: 'bg-gray-300' },
  ];

  return (
    <div
      id="page-topic-detail"
      className="page active min-h-screen text-[#302A24] font-['Quicksand',sans-serif] bg-[#FBF8F1] antialiased selection:bg-[#C85A3F] selection:text-white"
      style={{ backgroundImage: 'radial-gradient(#D6CEC2 1.2px, transparent 1.2px)', backgroundSize: '20px 20px' }}
    >
      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (block lg:hidden)                                           */}
      {/* ========================================================================= */}
      <div className="block lg:hidden w-full max-w-md mx-auto min-h-screen flex flex-col pb-28">
        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-40 bg-[#FBF8F1]/95 backdrop-blur-xs px-4 py-3 flex items-center justify-between border-b border-[#E8DEC8]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTo('topics')}
              aria-label="Quay lại"
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#302A24] border border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:scale-95 transition-transform"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
            </button>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base text-[#302A24] truncate font-['Comfortaa',sans-serif]">{topicName || 'Chi tiết'}</span>
              <span className="text-[11px] text-[#786F66]">Luyện đọc &amp; Từ vựng</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-xl bg-white text-[#302A24] flex items-center justify-center border border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] active:scale-95"
              title="Chia sẻ"
            >
              <svg className="w-4 h-4 text-[#786F66]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>
            <button
              onClick={handleAddWord}
              className="px-3 py-1.5 rounded-xl bg-[#C85A3F] text-white text-xs font-bold border border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] active:scale-95"
            >
              + Từ mới
            </button>
          </div>
        </header>

        {/* Mascot Encouragement Strip */}
        <section className="px-4 mt-3">
          <div className="bg-[#EFF6EE] rounded-2xl p-3.5 flex items-center gap-3 border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
            <div className="relative w-11 h-11 shrink-0 bg-[#FFF7E8] rounded-xl border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] flex items-center justify-center text-xl">
              🐾
              <span className="absolute -top-1 -right-1 text-xs">✨</span>
            </div>
            <div className="flex-1 text-xs text-[#302A24]">
              <span className="font-bold text-[#4D6B53]">Bé Hổ HiVocab nhắn nhủ: </span>
              <p className="font-medium inline">
                "Hôm nay mình đọc thử <strong>{firstPassage?.title || 'Passage 1'}</strong> nhé! Bám sát từ vựng thực chiến sẽ nâng band điểm rất nhanh đấy!"
              </p>
            </div>
          </div>
        </section>

        {/* Course Overview Card */}
        <main className="px-4 mt-3 flex flex-col gap-4">
          <div className="bg-white rounded-[20px] border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] p-4 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-[11px] font-bold text-[#302A24] bg-[#EFE7DA] rounded-full border border-[#3D352E]">
                📖 {isCambridge ? 'Bộ đề Cambridge Official' : 'Chủ đề từ vựng'}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-300">
                IELTS Academic Reading
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#3D352E] tracking-tight font-['Comfortaa',sans-serif]">{topicName}</h1>
            <div className="mt-3 p-3 rounded-xl bg-[#FFFDF9] border border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E]">
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span>Tổng tiến độ ghi nhớ khóa</span>
                <span className="text-[#4D6B53] font-bold">{overallProgress}% hoàn thành</span>
              </div>
              <div className="w-full h-3 bg-[#EAE2D5] rounded-full border border-[#3D352E] overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#4D6B53] to-[#6AA173] rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-semibold text-[#786F66] mt-1.5">
                <span>Đã nạp: <strong className="text-[#302A24]">{learnedCount} / {totalWords}</strong> từ</span>
                <span>SRS đang ôn: <strong className="text-[#C85A3F]">{dueOrLearningCount} từ</strong></span>
              </div>
            </div>
          </div>

          {/* Test Selector Pills (if Cambridge) */}
          {isCambridge && camHierarchy?.tests && camHierarchy.tests.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#F6EBE5] border border-[#3D352E] flex items-center justify-center text-xs font-bold">
                    📚
                  </div>
                  <h2 className="font-bold text-xs uppercase tracking-wide text-[#3D352E]">CHỌN BÀI TEST ĐỌC</h2>
                </div>
                <span className="text-[11px] font-bold text-[#786F66]">
                  {currentTest?.name || `Test ${currentTestIndex + 1}`} ({currentPassages.length} bài)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {camHierarchy.tests.map((test, index) => {
                  const isActive = index === currentTestIndex;
                  const testWords = test.passages?.reduce((sum, p) => sum + (p.totalWords || p.wordsCount || 0), 0) || 0;
                  return (
                    <button
                      key={test.id || index}
                      onClick={() => setCurrentTestIndex(index)}
                      className={`p-2.5 rounded-xl border-2 border-[#3D352E] flex items-center justify-between text-left transition-all active:scale-95 ${
                        isActive
                          ? 'bg-[#302A24] text-white shadow-[2px_3px_0px_#3D352E]'
                          : 'bg-white text-[#302A24] shadow-[1.5px_2px_0px_#3D352E]'
                      }`}
                      type="button"
                    >
                      <div>
                        <div className={`text-[10px] uppercase font-bold ${isActive ? 'text-amber-300' : 'text-[#786F66]'}`}>
                          {isActive ? 'Đang học' : 'Bài Test'}
                        </div>
                        <div className="text-xs font-bold">{test.name || `Test ${index + 1}`}</div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isActive ? 'bg-[#473E36] text-white border-[#5C5147]' : 'bg-[#EFE7DA] text-[#302A24] border-[#3D352E]/30'
                      }`}>
                        {testWords} từ
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Passages List */}
          <div className="flex flex-col gap-4">
            {isCambridge ? (
              currentPassages.map((passage, pIdx) => {
                const pNum = passage.passageNumber || pIdx + 1;
                const pTitle = passage.title || `Passage ${pNum}`;
                const pWords = passage.totalWords || passage.wordsCount || 0;
                const pProg = passage.progress || 0;
                const pLearned = Math.round((pProg * pWords) / 100);
                const colorTheme = passageBadgeColors[pIdx % passageBadgeColors.length];

                return (
                  <article
                    key={passage.id || pIdx}
                    className="bg-white rounded-[20px] border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2.5 py-1 text-xs font-bold text-[#302A24] ${colorTheme.badgeBg} rounded-xl border border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] flex items-center gap-1`}>
                          📑 Passage {pNum}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${colorTheme.progBg}`}>
                          {pProg}% hoàn thành
                        </span>
                      </div>

                      <h3
                        onClick={() => openPassage(passage, currentTest?.name)}
                        className="font-bold text-lg text-[#302A24] leading-snug cursor-pointer hover:text-[#C85A3F] font-['Playfair_Display',serif] uppercase"
                      >
                        {pTitle}
                      </h3>
                      <p className="text-xs font-semibold text-[#786F66] mt-0.5 line-clamp-1">
                        {passage.topicLabel || 'History, Architecture, Science'}
                      </p>

                      <div className="mt-2.5 w-full h-2 bg-[#EFE8DD] rounded-full border border-[#3D352E] overflow-hidden">
                        <div className={`h-full ${colorTheme.barColor} rounded-full`} style={{ width: `${pProg}%` }}></div>
                      </div>

                      <div className="mt-3 p-3 bg-[#FAF7F0] rounded-xl border border-dashed border-[#C4B9AA] text-xs text-[#302A24]/90 italic font-['Playfair_Display',serif] relative">
                        <span className="text-base text-[#C85A3F] font-bold absolute -top-0.5 left-2">“</span>
                        <p className="pl-3.5 line-clamp-3">
                          {passage.contentEn ? passage.contentEn.slice(0, 140) + '...' : 'Đoạn trích bài đọc học thuật IELTS...'}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs py-1.5 border-y border-[#EBE4D8]">
                        <span className="font-bold text-[#3D352E]">📝 {pWords} từ vựng</span>
                        <span className="text-[11px] text-[#786F66]">
                          Đã thuộc: <strong className="text-[#4D6B53]">{pLearned}/{pWords}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={() => openPassage(passage, currentTest?.name)}
                        className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#4D6B53] hover:bg-[#3D5642] rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                        type="button"
                      >
                        <span>📖</span>
                        <span>Học bài ngay</span>
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              lessons.map((lesson, lIdx) => (
                <article
                  key={lesson.id || lIdx}
                  className="bg-white rounded-[20px] border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-1 text-xs font-bold text-[#302A24] bg-[#FFF5E6] rounded-xl border border-[#3D352E]">
                        Lesson {lIdx + 1}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full border bg-[#E0F2E9] text-emerald-800 border-emerald-400">
                        {lesson.progress || 0}%
                      </span>
                    </div>
                    <h3
                      onClick={() => openLesson(lesson.id)}
                      className="font-bold text-lg text-[#302A24] cursor-pointer hover:text-[#C85A3F]"
                    >
                      {lesson.name || lesson.title}
                    </h3>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => openLesson(lesson.id)}
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#4D6B53] hover:bg-[#3D5642] rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                    >
                      <span>📖</span>
                      <span>Học bài ngay</span>
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (hidden lg:flex) - 100% Verbatim Stitch Screen (screen.png) */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-1 w-full max-w-[1536px] mx-auto min-h-screen lg:pl-64 xl:pl-72">
        <main className="flex-1 px-8 py-6 flex flex-col min-w-0 overflow-y-auto" data-purpose="main-content">
        
        {/* BEGIN: TopBar & Breadcrumbs */}
        <header className="mb-6 space-y-3" data-purpose="top-navigation-bar">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Breadcrumb & Back Link */}
            <div className="flex items-center gap-2 text-xs font-bold">
              <button
                onClick={() => navigateTo('topics')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-[#302A24] hover:bg-[#EFE7DA] transition-colors cursor-pointer"
                type="button"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                <span>Quay lại danh sách chủ đề</span>
              </button>
              <span className="text-[#786F66]">/</span>
              <span onClick={() => navigateTo('topics')} className="text-[#786F66] hover:text-[#302A24] cursor-pointer">
                Chủ đề &amp; Khóa học
              </span>
              <span className="text-[#786F66]">/</span>
              <span className="text-[#786F66] hover:text-[#302A24] cursor-pointer">
                {isCambridge ? 'Bộ đề Cambridge' : 'Chủ đề từ vựng'}
              </span>
              <span className="text-[#786F66]">/</span>
              <span className="text-[#C85A3F] font-bold font-['Comfortaa',sans-serif]">{topicName}</span>
            </div>

            {/* Quick Actions & Search */}
            <div className="flex items-center gap-3">
              {/* Search bar */}
              <div className="relative w-64">
                <input
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-xl border border-[#3D352E] shadow-[2px_2px_0px_#3D352E] focus:outline-none focus:ring-2 focus:ring-[#4D6B53] font-body placeholder:text-gray-400"
                  placeholder="Tìm từ, passage..."
                  type="text"
                />
                <svg className="w-4 h-4 absolute left-3 top-2 text-[#786F66]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="px-3.5 py-1.5 text-xs font-bold bg-white text-[#302A24] rounded-xl border border-[#3D352E] shadow-[2px_2px_0px_#3D352E] hover:bg-[#EFE7DA] transition-all flex items-center gap-1.5 cursor-pointer"
                type="button"
              >
                <svg className="w-4 h-4 text-[#786F66]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                <span>Chia sẻ</span>
              </button>

              {/* Add new word */}
              <button
                onClick={handleAddWord}
                className="px-3.5 py-1.5 text-xs font-bold bg-[#C85A3F] text-white rounded-xl border border-[#3D352E] shadow-[2px_2px_0px_#3D352E] hover:brightness-105 transition-all flex items-center gap-1.5 cursor-pointer"
                type="button"
              >
                <span className="text-sm leading-none font-bold">+</span>
                <span>Thêm từ mới</span>
              </button>
            </div>
          </div>
        </header>

        {/* BEGIN: MascotSpeechBanner */}
        <section className="mb-6" data-purpose="mascot-coach-tip">
          <div className="p-4 rounded-2xl bg-[#EFF6EE] border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] flex items-center gap-4">
            {/* Mascot Avatar with cute badge */}
            <div className="relative w-12 h-12 shrink-0 bg-[#FFF7E8] rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center text-2xl">
              🐾
              <span className="absolute -top-1 -right-1 text-xs">✨</span>
            </div>
            {/* Speech Text */}
            <div className="flex-1 text-xs md:text-sm text-[#302A24]">
              <span className="font-['Comfortaa',sans-serif] font-bold text-[#4D6B53]">Bé Hổ HiVocab nhắn nhủ:</span>
              <p className="font-medium inline ml-1">
                "Hôm nay mình đọc thử <strong>{firstPassage?.title ? `Passage 1: ${firstPassage.title}` : 'Passage 1'}</strong> nhé! Các cấu trúc câu học thuật và từ vựng xuất hiện liên tục trong đề thi thật đấy!"
              </p>
            </div>
            {/* Quick motivate button */}
            <button
              onClick={() => {
                if (firstPassage) openPassage(firstPassage, currentTest?.name);
                else if (lessons[0]) openLesson(lessons[0].id);
              }}
              className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#4D6B53] text-white border border-[#3D352E] shadow-[2px_2px_0px_#3D352E] hover:bg-emerald-800 transition cursor-pointer"
              type="button"
            >
              Vào học ngay →
            </button>
          </div>
        </section>

        {/* BEGIN: CourseOverviewCard */}
        <section className="mb-6" data-purpose="course-hero-overview">
          <div className="p-6 relative overflow-hidden bg-gradient-to-r from-white via-white to-[#FDF8F3] border-2 border-[#3D352E] rounded-[20px] shadow-[3px_4px_0px_#3D352E]">
            {/* Decorative Background Crayon Blob */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#FDE8DF] rounded-full blur-2xl opacity-60 pointer-events-none"></div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              {/* Left Info Block */}
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-bold text-[#302A24] bg-[#EFE7DA] rounded-full border border-[#3D352E] flex items-center gap-1.5">
                    📖 {isCambridge ? 'Bộ đề Cambridge Official' : 'Chủ đề từ vựng'}
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-300">
                    IELTS Academic Reading
                  </span>
                </div>
                <div>
                  <h2 className="text-3xl font-['Comfortaa',sans-serif] font-bold text-[#3D352E] tracking-tight flex items-center gap-3">
                    {topicName}
                    <span className="text-sm font-sans px-2.5 py-0.5 bg-[#FFF2DE] text-amber-900 border border-[#3D352E] rounded-lg font-bold">
                      {topicName}
                    </span>
                  </h2>
                </div>
              </div>

              {/* Right Progress & Overall Metrics */}
              <div className="w-full lg:w-80 p-4 rounded-2xl bg-[#FFFDF9] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-[#302A24]">Tổng tiến độ ghi nhớ khóa</span>
                  <span className="text-[#4D6B53] text-sm font-['Comfortaa',sans-serif] font-bold">{overallProgress}% hoàn thành</span>
                </div>
                {/* Progress bar styled like crayon fill */}
                <div className="w-full h-3.5 bg-[#EAE2D5] rounded-full border border-[#3D352E] overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#4D6B53] to-[#6AA173] rounded-full border-r border-[#3D352E] transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[11px] font-semibold text-[#786F66]">
                  <span>Đã nạp: <strong className="text-[#302A24]">{learnedCount} / {totalWords}</strong> từ</span>
                  <span>SRS đang ôn: <strong className="text-[#C85A3F]">{dueOrLearningCount} từ</strong></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BEGIN: TestSelectorSection */}
        {isCambridge && camHierarchy?.tests && camHierarchy.tests.length > 0 && (
          <section className="mb-6" data-purpose="test-selector-tabs">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
              {/* Section Heading */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F6EBE5] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center text-sm font-bold">
                  📚
                </div>
                <div>
                  <h3 className="text-base font-['Comfortaa',sans-serif] font-bold text-[#3D352E] tracking-wide uppercase">
                    Chọn Bài Test Đọc
                  </h3>
                  <p className="text-xs text-[#786F66]">Mỗi Test gồm các Passages chuẩn cấu trúc đề thi Academic</p>
                </div>
              </div>
              {/* Filter / Summary indicator */}
              <span className="text-xs font-bold text-[#786F66] bg-white px-3 py-1 rounded-xl border border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
                Đang xem: <strong className="text-[#302A24]">{currentTest?.name || `Test ${currentTestIndex + 1}`} ({currentPassages.length} bài đọc)</strong>
              </span>
            </div>

            {/* 4 Test Selector Pills */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {camHierarchy.tests.map((test, index) => {
                const isActive = index === currentTestIndex;
                const testWords = test.passages?.reduce((sum, p) => sum + (p.totalWords || p.wordsCount || 0), 0) || 0;
                const testLearned = test.passages?.reduce((sum, p) => sum + (p.learnedWords || 0), 0) || 0;
                const testPct = testWords > 0 ? Math.round((testLearned / testWords) * 100) : 0;

                return (
                  <button
                    key={test.id || index}
                    onClick={() => setCurrentTestIndex(index)}
                    className={`p-3 rounded-2xl border-2 border-[#3D352E] flex items-center justify-between text-left transition-transform cursor-pointer ${
                      isActive
                        ? 'bg-[#302A24] text-white shadow-[3px_4px_0px_#3D352E] scale-[1.01]'
                        : 'bg-white hover:bg-[#FAF4EC] text-[#302A24] shadow-[2px_2px_0px_#3D352E]'
                    }`}
                    type="button"
                  >
                    <div>
                      <div className={`text-xs uppercase tracking-wider font-bold ${isActive ? 'text-amber-300' : 'text-[#786F66]'}`}>
                        {isActive ? 'Đang học' : 'Chưa học'}
                      </div>
                      <div className="text-sm font-['Comfortaa',sans-serif] font-bold">{test.name || `Test ${index + 1}`}</div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        isActive ? 'bg-[#473E36] text-white border-[#5C5147]' : 'bg-[#EFE7DA] text-[#302A24] border-[#3D352E]/30'
                      }`}>
                        {testWords} từ
                      </span>
                      {isActive && (
                        <div className="text-[10px] text-emerald-300 font-bold mt-0.5">{testPct}% xong</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* BEGIN: PassagesThreeColumnGrid */}
        <section className="mb-8" data-purpose="passages-grid">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#C85A3F] border border-[#3D352E] inline-block"></span>
              <h4 className="font-['Comfortaa',sans-serif] font-bold text-[#3D352E] text-base">
                {isCambridge
                  ? `Danh Sách Bài Đọc Trong ${currentTest?.name || `Test ${currentTestIndex + 1}`}`
                  : 'Danh Sách Bài Học'}
              </h4>
            </div>
            <span className="text-xs font-semibold text-[#786F66]">
              Tip: Click vào thẻ để đọc bài song ngữ và tra từ bấm chọn trực tiếp
            </span>
          </div>

          {/* 3-Column Passage Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isCambridge ? (
              currentPassages.map((passage, pIdx) => {
                const pNum = passage.passageNumber || pIdx + 1;
                const pTitle = passage.title || `Passage ${pNum}`;
                const pWords = passage.totalWords || passage.wordsCount || 0;
                const pProg = passage.progress || 0;
                const pLearned = Math.round((pProg * pWords) / 100);
                const colorTheme = passageBadgeColors[pIdx % passageBadgeColors.length];

                return (
                  <article
                    key={passage.id || pIdx}
                    className="p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200 group bg-white border-2 border-[#3D352E] rounded-[20px] shadow-[3px_4px_0px_#3D352E]"
                  >
                    <div>
                      {/* Top Badge Row */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 text-xs font-['Comfortaa',sans-serif] font-bold text-[#302A24] ${colorTheme.badgeBg} rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center gap-1.5`}>
                          📑 Passage {pNum}
                        </span>
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${colorTheme.progBg}`}>
                          {pProg}% hoàn thành
                        </span>
                      </div>

                      {/* Passage Title & Topic */}
                      <h5
                        onClick={() => openPassage(passage, currentTest?.name)}
                        className="font-['Playfair_Display',serif] font-bold text-xl text-[#302A24] tracking-tight leading-snug group-hover:text-[#C85A3F] transition-colors cursor-pointer uppercase"
                      >
                        {pTitle}
                      </h5>
                      <p className="text-xs font-semibold text-[#786F66] mt-1 line-clamp-1">
                        {passage.topicLabel || 'History, Architecture, Water Management'}
                      </p>

                      {/* Progress bar miniature */}
                      <div className="mt-3 w-full h-2 bg-[#EFE8DD] rounded-full border border-[#3D352E] overflow-hidden">
                        <div className={`h-full ${colorTheme.barColor} rounded-full transition-all duration-300`} style={{ width: `${pProg}%` }}></div>
                      </div>

                      {/* Passage Snippet Preview in Handcrafted Paper Box */}
                      <div className="mt-4 p-3.5 bg-[#FAF7F0] rounded-xl border border-dashed border-[#C4B9AA] text-xs text-[#302A24]/90 leading-relaxed font-['Playfair_Display',serif] italic relative">
                        <span className="text-lg font-['Playfair_Display',serif] text-[#C85A3F] font-bold absolute -top-1 left-2">“</span>
                        <p className="pl-3.5 line-clamp-3">
                          {passage.contentEn
                            ? passage.contentEn.slice(0, 160) + '...'
                            : 'During the sixth and seventh centuries, the inhabitants of the northwestern regions of India developed a method of gaining access to clean, fresh groundwater...'}
                        </p>
                      </div>

                      {/* Vocabulary Stats Details */}
                      <div className="mt-4 flex items-center justify-between text-xs py-2 border-y border-[#EBE4D8]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">📝</span>
                          <span className="font-bold text-[#3D352E]">{pWords} từ vựng</span>
                        </div>
                        <div className="text-[11px] text-[#786F66]">
                          Đã thuộc: <span className="font-bold text-[#4D6B53]">{pLearned}/{pWords}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom Actions */}
                    <div className="mt-5 space-y-2.5">
                      <button
                        onClick={() => openPassage(passage, currentTest?.name)}
                        className="w-full py-2.5 px-4 text-xs font-['Comfortaa',sans-serif] font-bold text-white bg-[#4D6B53] hover:bg-[#3D5642] rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center gap-2 transition-all cursor-pointer"
                        type="button"
                      >
                        <span>📖</span>
                        <span>Học bài ngay</span>
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              lessons.map((lesson, lIdx) => {
                const lWords = lesson.totalWords || lesson.wordsCount || 0;
                const lProg = lesson.progress || 0;
                const lLearned = Math.round((lProg * lWords) / 100);

                return (
                  <article
                    key={lesson.id || lIdx}
                    className="p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200 group bg-white border-2 border-[#3D352E] rounded-[20px] shadow-[3px_4px_0px_#3D352E]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 text-xs font-['Comfortaa',sans-serif] font-bold text-[#302A24] bg-[#FFF5E6] rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center gap-1.5">
                          Lesson {lIdx + 1}
                        </span>
                        <span className="px-2.5 py-0.5 text-xs font-bold text-emerald-800 bg-[#E0F2E9] rounded-full border border-emerald-400">
                          {lProg}% hoàn thành
                        </span>
                      </div>

                      <h5
                        onClick={() => openLesson(lesson.id)}
                        className="font-bold text-xl text-[#302A24] tracking-tight leading-snug group-hover:text-[#C85A3F] transition-colors cursor-pointer"
                      >
                        {lesson.name || lesson.title}
                      </h5>

                      <div className="mt-3 w-full h-2 bg-[#EFE8DD] rounded-full border border-[#3D352E] overflow-hidden">
                        <div className="h-full bg-[#4D6B53] rounded-full" style={{ width: `${lProg}%` }}></div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs py-2 border-y border-[#EBE4D8]">
                        <span className="font-bold text-[#3D352E]">📝 {lWords} từ vựng</span>
                        <span className="text-[#786F66]">Đã thuộc: <strong className="text-[#4D6B53]">{lLearned}/{lWords}</strong></span>
                      </div>
                    </div>

                    <div className="mt-5">
                      <button
                        onClick={() => openLesson(lesson.id)}
                        className="w-full py-2.5 px-4 text-xs font-['Comfortaa',sans-serif] font-bold text-white bg-[#4D6B53] hover:bg-[#3D5642] rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <span>📖</span>
                        <span>Học bài ngay</span>
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* BEGIN: BottomHelpBanner */}
        <section className="mt-auto pt-2 pb-6" data-purpose="quick-tips-footer">
          <div className="p-4 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div className="text-xs text-[#302A24]">
                <span className="font-bold">Phương pháp học hiệu quả: </span>
                <span className="text-[#786F66]">
                  Nên đọc lướt qua bài đọc một lần để hiểu ngữ cảnh chung, sau đó sử dụng tính năng <strong>Tra từ nhanh</strong> rồi ôn lại bằng <strong>Flashcard Spaced Repetition</strong>.
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <a className="text-xs font-bold text-[#4D6B53] hover:underline cursor-pointer">Xem cẩm nang đọc IELTS</a>
              <span className="text-[#786F66]">•</span>
              <a className="text-xs font-bold text-[#C85A3F] hover:underline cursor-pointer">Báo lỗi đề / từ vựng</a>
            </div>
          </div>
        </section>

        {/* BEGIN: PageFooter */}
        <footer className="w-full bg-[#FAF5EC] border-t border-[#E8DEC8] py-4 px-2 text-xs text-[#786F66] rounded-xl mb-4" data-purpose="page-footer">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              © 2026 <strong>HiVocab!</strong> - Ứng dụng ghi nhớ từ vựng thông minh cho học sinh Việt Nam. Thiết kế phong cách Sổ tay Crayon.
            </div>
            <div className="flex items-center gap-4">
              <a className="hover:text-[#302A24] transition cursor-pointer">Điều khoản</a>
              <span>•</span>
              <a className="hover:text-[#302A24] transition cursor-pointer">Cẩm nang ôn thi</a>
              <span>•</span>
              <a className="hover:text-[#302A24] transition flex items-center gap-1 cursor-pointer">Hỗ trợ bé Hổ 🐯</a>
            </div>
          </div>
        </footer>
        </main>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => openModal('bugReport')}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-white border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] flex items-center justify-center hover:scale-105 hover:bg-[#FFF5E6] transition-all cursor-pointer group"
        title="Báo lỗi đề / từ vựng"
        aria-label="Báo lỗi đề / từ vựng"
      >
        <span className="text-xl group-hover:scale-110 transition-transform">🚩</span>
      </button>
    </div>
  );
}

export default PageTopicDetail;
