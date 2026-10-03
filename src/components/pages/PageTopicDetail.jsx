// src/components/pages/PageTopicDetail.jsx
// 100% Pixel-Perfect match to Stitch Design (desktop_topic_detail.html & mobile_topic_detail.html)
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
      return camHierarchy?.tests?.reduce(
        (sum, t) => sum + (t.passages?.reduce((pSum, p) => pSum + (p.totalWords || p.wordsCount || 0), 0) || 0),
        0
      ) || 0;
    }
    return nonCamTotalWords || 0;
  }, [isCambridge, camStats, camHierarchy, nonCamTotalWords]);

  const overallProgress = useMemo(() => {
    if (isCambridge) {
      const allPassages = camHierarchy?.tests?.flatMap((t) => t.passages || []) || [];
      if (allPassages.length === 0) return 0;
      const totalProg = allPassages.reduce((sum, p) => sum + (p.progress || 0), 0);
      return Math.round(totalProg / allPassages.length);
    }
    if (!lessons || lessons.length === 0) return 0;
    const totalProg = lessons.reduce((sum, l) => sum + (l.progress || 0), 0);
    return Math.round(totalProg / lessons.length);
  }, [isCambridge, camHierarchy, lessons]);

  const handleAddWord = () => {
    openModal('addWord', { topicId });
  };

  const currentTest = isCambridge && camHierarchy?.tests ? camHierarchy.tests[currentTestIndex] : null;

  return (
    <div id="page-topic-detail" className="page active min-h-screen text-[#302A24] font-['Quicksand',sans-serif] bg-[#FBF8F1]" style={{ backgroundImage: 'radial-gradient(#D6CEC2 1.2px, transparent 1.2px)', backgroundSize: '20px 20px' }}>

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (block lg:hidden) - Verbatim Stitch Mobile Screen           */}
      {/* ========================================================================= */}
      <div className="block lg:hidden w-full max-w-md mx-auto min-h-screen flex flex-col pb-28">
        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-40 bg-[#fff8f3] shadow-sm px-4 py-2.5 flex items-center justify-between border-b border-[#e8e1db]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTo('topics')}
              aria-label="Quay lại"
              className="w-10 h-10 rounded-full bg-[#f4ede6] flex items-center justify-center text-[#1e1b17] border-2 border-[#33302c] shadow-[1.5px_2px_0px_#33302c] active:scale-95 transition-transform"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
            </button>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base text-[#1e1b17] truncate">{topicName || 'Chi tiết'}</span>
              <span className="text-xs text-[#43483f]">Luyện đọc &amp; Từ vựng</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAddWord}
              className="w-10 h-10 rounded-full bg-[#86a378] text-[#203918] flex items-center justify-center border-2 border-[#33302c] shadow-[1.5px_2px_0px_#33302c] active:scale-95 transition-transform"
              title="Thêm từ mới"
            >
              <span className="text-lg font-bold">+</span>
            </button>
          </div>
        </header>

        {/* Mascot Encouragement Strip */}
        <section className="px-4 mt-3">
          <div className="bg-[#b1cfa1]/20 rounded-2xl p-3 flex items-center gap-3 border-2 border-[#33302c] shadow-[1.5px_2px_0px_#33302c]">
            <div className="w-10 h-10 rounded-full bg-[#86a378] text-white flex items-center justify-center shrink-0 border border-[#33302c] text-xl">
              🐯
            </div>
            <p className="text-xs text-[#1e1b17] leading-tight">
              <span className="font-bold text-[#4b6540]">Bé Hổ HiVocab:</span> "Hôm nay mình cùng hoàn thành bài đọc để duy trì chuỗi học tập nhé!"
            </p>
          </div>
        </section>

        {/* Course Summary Card */}
        <main className="px-4 mt-3 flex flex-col gap-3.5">
          <div className="bg-white rounded-[24px] border-[2.5px] border-[#33302c] shadow-[3px_4px_0px_#33302c] p-4 relative overflow-hidden">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="inline-flex items-center gap-1 bg-[#f4ede6] px-2.5 py-0.5 rounded-full mb-1 border border-[#33302c]/20">
                  <span className="text-xs">📖</span>
                  <span className="text-[11px] font-bold text-[#43483f]">
                    {isCambridge ? 'Bộ đề Cambridge Official' : 'Chủ đề từ vựng'}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-[#1e1b17] tracking-tight">{topicName}</h1>
                <p className="text-xs text-[#43483f] mt-0.5">
                  {isCambridge
                    ? `${totalTests} bài Test · ${totalPassages} bài đọc · ${totalWords} từ vựng`
                    : `${lessons.length} bài học · ${totalWords} từ vựng`}
                </p>
              </div>
              <button
                onClick={handleAddWord}
                className="shrink-0 flex items-center gap-1 bg-[#33302c] text-white px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 shadow-sm"
              >
                <span>+ Thêm từ</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 pt-2.5 border-t border-[#e8e1db]">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-medium text-[#43483f]">Tổng tiến độ ghi nhớ</span>
                <span className="font-bold text-[#4b6540]">{overallProgress}% hoàn thành</span>
              </div>
              <div className="w-full bg-[#eee7e1] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#c4c8bc]">
                <div
                  className="bg-[#86a378] h-full rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Test Selector Pills (if Cambridge) */}
          {isCambridge && camHierarchy?.tests && camHierarchy.tests.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-[#ffdbc9] border border-[#33302c] flex items-center justify-center text-xs">
                    📚
                  </div>
                  <h2 className="font-bold text-xs uppercase tracking-wide text-[#1e1b17]">CHỌN BÀI TEST</h2>
                </div>
                <span className="text-xs text-[#74796f]">{totalTests} bài Test</span>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {camHierarchy.tests.map((test, index) => {
                  const isActive = index === currentTestIndex;
                  return (
                    <button
                      key={test.id || index}
                      onClick={() => setCurrentTestIndex(index)}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold border-2 border-[#33302c] transition-colors active:scale-95 ${
                        isActive
                          ? 'bg-[#33302c] text-white shadow-[1.5px_2px_0px_#33302c]'
                          : 'bg-white text-[#1e1b17]'
                      }`}
                      type="button"
                    >
                      <span>{test.name || `Test ${index + 1}`}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#e8e1db] text-[#43483f]'
                      }`}>
                        {test.passages?.length || 0} bài
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Cards List (Passages or Lessons) */}
          <div className="flex flex-col gap-3 mt-1">
            {isCambridge ? (
              currentPassages.map((passage, pIdx) => {
                const pNum = passage.passageNumber || pIdx + 1;
                const pTitle = passage.title || `Passage ${pNum}`;
                const pWords = passage.totalWords || passage.wordsCount || 0;
                return (
                  <article
                    key={passage.id || pIdx}
                    className="bg-white rounded-[24px] border-[2.5px] border-[#33302c] shadow-[3px_4px_0px_#33302c] p-4 flex flex-col gap-2 relative"
                  >
                    <div className="flex justify-between items-center">
                      <span className="inline-flex items-center gap-1 bg-[#f4ede6] px-2.5 py-0.5 rounded-full text-xs font-bold border border-[#33302c]/20">
                        📑 Passage {pNum}
                      </span>
                      <span className="text-xs font-bold bg-[#ffdbc9] text-[#70370f] px-2 py-0.5 rounded-full border border-[#33302c]/20">
                        {passage.progress || 0}%
                      </span>
                    </div>

                    <div>
                      <h3
                        onClick={() => openPassage(passage, currentTest?.name)}
                        className="text-base font-bold text-[#1e1b17] leading-snug cursor-pointer hover:text-[#4b6540]"
                      >
                        {pTitle}
                      </h3>
                      <p className="text-xs text-[#74796f] mt-0.5">{passage.topicLabel || 'Reading Academic'}</p>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-[#eee7e1] text-xs">
                      <span className="font-semibold text-[#43483f]">📝 {pWords} từ vựng</span>
                      <button
                        onClick={() => startReading(passage.id)}
                        className="flex items-center gap-1 text-[#4b6540] font-bold hover:underline cursor-pointer"
                        type="button"
                      >
                        <span>📖 Đọc bài song ngữ</span>
                      </button>
                    </div>

                    {/* Learning Modes Buttons */}
                    <div className="pt-1">
                      <p className="text-[11px] font-bold text-[#74796f] mb-1.5 uppercase">ÔN LUYỆN TỪ VỰNG</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => startPractice(0, passage.id)}
                          className="bg-[#faf2ec] hover:bg-[#f4ede6] p-2 rounded-xl flex flex-col items-center justify-center gap-0.5 border border-[#33302c] active:scale-95 transition-transform cursor-pointer"
                        >
                          <span className="text-base">⚡</span>
                          <span className="text-[11px] font-bold text-[#1e1b17]">Flashcard</span>
                        </button>
                        <button
                          onClick={() => startPractice(1, passage.id)}
                          className="bg-[#faf2ec] hover:bg-[#f4ede6] p-2 rounded-xl flex flex-col items-center justify-center gap-0.5 border border-[#33302c] active:scale-95 transition-transform cursor-pointer"
                        >
                          <span className="text-base">❓</span>
                          <span className="text-[11px] font-bold text-[#1e1b17]">Trắc nghiệm</span>
                        </button>
                        <button
                          onClick={() => startPractice(2, passage.id)}
                          className="bg-[#faf2ec] hover:bg-[#f4ede6] p-2 rounded-xl flex flex-col items-center justify-center gap-0.5 border border-[#33302c] active:scale-95 transition-transform cursor-pointer"
                        >
                          <span className="text-base">✏️</span>
                          <span className="text-[11px] font-bold text-[#1e1b17]">Điền từ</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              lessons.map((lesson, lIdx) => (
                <article
                  key={lesson.id || lIdx}
                  className="bg-white rounded-[24px] border-[2.5px] border-[#33302c] shadow-[3px_4px_0px_#33302c] p-4 flex flex-col gap-2 relative"
                >
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center gap-1 bg-[#f4ede6] px-2.5 py-0.5 rounded-full text-xs font-bold border border-[#33302c]/20">
                      Lesson {lIdx + 1}
                    </span>
                    <span className="text-xs font-bold bg-[#ffdbc9] text-[#70370f] px-2 py-0.5 rounded-full border border-[#33302c]/20">
                      {lesson.progress || 0}%
                    </span>
                  </div>
                  <div>
                    <h3
                      onClick={() => openLesson(lesson.id)}
                      className="text-base font-bold text-[#1e1b17] leading-snug cursor-pointer hover:text-[#4b6540]"
                    >
                      {lesson.name || lesson.title}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#eee7e1] text-xs">
                    <span className="font-semibold text-[#43483f]">📝 {lesson.totalWords || 0} từ vựng</span>
                    <button
                      onClick={() => openLesson(lesson.id)}
                      className="flex items-center gap-1 text-[#4b6540] font-bold hover:underline cursor-pointer"
                    >
                      <span>Vào học ➔</span>
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (hidden lg:flex) - 100% Verbatim Stitch Desktop Screen      */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-1 flex-col min-w-0 overflow-y-auto px-8 py-6 lg:pl-64 xl:pl-72 w-full max-w-[1440px] mx-auto min-h-screen">
        
        {/* TopBar & Breadcrumbs */}
        <header className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold">
              <button
                onClick={() => navigateTo('topics')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-[#302A24] hover:bg-[#EFE7DA] transition-colors cursor-pointer"
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
              <span className="text-[#C85A3F] font-bold">{topicName}</span>
            </div>

            {/* Quick Actions & Search */}
            <div className="flex items-center gap-3">
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

        {/* Mascot Speech Banner */}
        <section className="mb-6">
          <div className="p-4 rounded-2xl bg-[#EFF6EE] border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] flex items-center gap-4">
            <div className="relative w-12 h-12 shrink-0 bg-[#FFF7E8] rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center text-2xl">
              🐾
              <span className="absolute -top-1 -right-1 text-xs">✨</span>
            </div>
            <div className="flex-1 text-xs md:text-sm text-[#302A24]">
              <span className="font-bold text-[#4D6B53]">Bé Hổ HiVocab nhắn nhủ:</span>
              <p className="font-medium inline ml-1">
                "Hôm nay hãy cùng hoàn thành các bài đọc trong <strong>{topicName}</strong> nhé! Từ vựng chuyên sâu và ngữ cảnh thực tế sẽ giúp bạn nâng band điểm nhanh chóng!"
              </p>
            </div>
            <button
              onClick={() => {
                if (currentPassages[0]) startReading(currentPassages[0].id);
                else if (lessons[0]) openLesson(lessons[0].id);
              }}
              className="shrink-0 text-xs font-bold px-3.5 py-2 rounded-xl bg-[#4D6B53] text-white border border-[#3D352E] shadow-[2px_2px_0px_#3D352E] hover:bg-emerald-800 transition cursor-pointer"
              type="button"
            >
              Vào học ngay →
            </button>
          </div>
        </section>

        {/* Course Overview Card */}
        <section className="mb-6">
          <div className="p-6 relative overflow-hidden bg-gradient-to-r from-white via-white to-[#FDF8F3] rounded-[20px] border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E]">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#FDE8DF] rounded-full blur-2xl opacity-60 pointer-events-none"></div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              {/* Left Info Block */}
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-bold text-[#302A24] bg-[#EFE7DA] rounded-full border border-[#3D352E] flex items-center gap-1.5">
                    📖 {isCambridge ? 'Bộ đề Cambridge Official' : 'Chủ đề từ vựng'}
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-300">
                    {isCambridge ? 'IELTS Academic Reading' : 'Học tập & Ghi nhớ'}
                  </span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-[#3D352E] tracking-tight flex items-center gap-3">
                    {topicName}
                  </h2>
                  <p className="text-xs md:text-sm text-[#786F66] font-medium mt-1">
                    Tuyển tập từ vựng học thuật trọng điểm trích xuất trực tiếp kèm giải thích ngữ cảnh chi tiết.
                  </p>
                </div>
                {/* Metadata stats */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#786F66] pt-1">
                  {isCambridge ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#4D6B53]"></span>
                        <span><strong>{totalTests}</strong> bài Test đầy đủ</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span><strong>{totalPassages}</strong> bài đọc (Passages)</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#C85A3F]"></span>
                        <span><strong>{totalWords}</strong> từ vựng cốt lõi</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#4D6B53]"></span>
                        <span><strong>{lessons.length}</strong> bài học</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#C85A3F]"></span>
                        <span><strong>{totalWords}</strong> từ vựng</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Progress & Overall Metrics */}
              <div className="w-full lg:w-80 p-4 rounded-2xl bg-[#FFFDF9] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-[#302A24]">Tổng tiến độ ghi nhớ</span>
                  <span className="text-[#4D6B53] text-sm font-bold">{overallProgress}% hoàn thành</span>
                </div>
                <div className="w-full h-3.5 bg-[#EAE2D5] rounded-full border border-[#3D352E] overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#4D6B53] to-[#6AA173] rounded-full transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[11px] font-semibold text-[#786F66]">
                  <span>Tổng từ: <strong className="text-[#302A24]">{totalWords}</strong> từ</span>
                  <span>Tiến độ: <strong className="text-[#C85A3F]">{overallProgress}%</strong></span>
                </div>
              </div>
            </div>

            {/* Bottom Practice Mode Actions */}
            <div className="border-t-2 border-dashed border-[#E2D9CC] my-5 pt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#786F66] flex items-center gap-1.5">
                <span>🎯</span>
                <span>Chế độ ôn tập cấp tốc:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => startPractice(0)}
                  className="px-4 py-2 text-xs font-bold text-[#302A24] bg-[#FFF1EB] hover:bg-[#C85A3F] hover:text-white rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] transition-all flex items-center gap-2 cursor-pointer"
                  type="button"
                >
                  <span className="text-sm">⚡</span>
                  <span>Luyện Flashcard ({totalWords} từ)</span>
                </button>
                <button
                  onClick={() => startPractice(1)}
                  className="px-4 py-2 text-xs font-bold text-[#302A24] bg-[#EBF4FA] hover:bg-[#3273A8] hover:text-white rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] transition-all flex items-center gap-2 cursor-pointer"
                  type="button"
                >
                  <span className="text-sm">❓</span>
                  <span>Trắc nghiệm nhanh</span>
                </button>
                <button
                  onClick={() => startPractice(2)}
                  className="px-4 py-2 text-xs font-bold text-[#302A24] bg-[#EDF6EB] hover:bg-[#4D6B53] hover:text-white rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] transition-all flex items-center gap-2 cursor-pointer"
                  type="button"
                >
                  <span className="text-sm">✍️</span>
                  <span>Điền từ vào chỗ trống</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Test Selector Section (if Cambridge) */}
        {isCambridge && camHierarchy?.tests && camHierarchy.tests.length > 0 && (
          <section className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F6EBE5] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center text-sm font-bold">
                  📚
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#3D352E] tracking-wide uppercase">Chọn Bài Test Đọc</h3>
                  <p className="text-xs text-[#786F66]">Mỗi Test gồm các Passages chuẩn cấu trúc đề thi Academic</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#786F66] bg-white px-3 py-1 rounded-xl border border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
                Đang xem: <strong className="text-[#302A24]">{currentTest?.name || `Test ${currentTestIndex + 1}`} ({currentPassages.length} bài đọc)</strong>
              </span>
            </div>

            {/* Test Selector Pills */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {camHierarchy.tests.map((test, index) => {
                const isActive = index === currentTestIndex;
                const testWords = test.passages?.reduce((sum, p) => sum + (p.totalWords || p.wordsCount || 0), 0) || 0;
                return (
                  <button
                    key={test.id || index}
                    onClick={() => setCurrentTestIndex(index)}
                    className={`p-3 rounded-2xl border-2 border-[#3D352E] flex items-center justify-between text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#302A24] text-white shadow-[3px_4px_0px_#3D352E] scale-[1.01]'
                        : 'bg-white hover:bg-[#FAF4EC] text-[#302A24] shadow-[2px_2px_0px_#3D352E]'
                    }`}
                    type="button"
                  >
                    <div>
                      <div className={`text-xs uppercase tracking-wider font-bold ${isActive ? 'text-amber-300' : 'text-[#786F66]'}`}>
                        {isActive ? 'Đang học' : 'Bài Test'}
                      </div>
                      <div className="text-sm font-bold">{test.name || `Test ${index + 1}`}</div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        isActive
                          ? 'bg-[#473E36] text-white border-[#5C5147]'
                          : 'bg-[#EFE7DA] text-[#302A24] border-[#3D352E]/30'
                      }`}>
                        {testWords} từ
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 3-Column Passages Grid (or Lessons Grid) */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#C85A3F] border border-[#3D352E] inline-block"></span>
              <h4 className="font-bold text-[#3D352E] text-base">
                {isCambridge
                  ? `Danh Sách Bài Đọc Trong ${currentTest?.name || `Test ${currentTestIndex + 1}`}`
                  : 'Danh Sách Bài Học'}
              </h4>
            </div>
            <span className="text-xs font-semibold text-[#786F66]">
              Tip: Click vào thẻ để đọc bài song ngữ và tra từ bấm chọn trực tiếp
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isCambridge ? (
              currentPassages.map((passage, pIdx) => {
                const pNum = passage.passageNumber || pIdx + 1;
                const pTitle = passage.title || `Passage ${pNum}`;
                const pWords = passage.totalWords || passage.wordsCount || 0;
                const pProg = passage.progress || 0;

                return (
                  <article
                    key={passage.id || pIdx}
                    className="p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200 group bg-white border-2 border-[#3D352E] rounded-[20px] shadow-[3px_4px_0px_#3D352E]"
                  >
                    <div>
                      {/* Top Badge Row */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 text-xs font-bold text-[#302A24] bg-[#FFF5E6] rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center gap-1.5">
                          📑 Passage {pNum}
                        </span>
                        <span className="px-2.5 py-0.5 text-xs font-bold text-emerald-800 bg-[#E0F2E9] rounded-full border border-emerald-400">
                          {pProg}% hoàn thành
                        </span>
                      </div>

                      {/* Passage Title */}
                      <h5
                        onClick={() => openPassage(passage, currentTest?.name)}
                        className="font-serif font-bold text-xl text-[#302A24] tracking-tight leading-snug group-hover:text-[#C85A3F] transition-colors uppercase cursor-pointer"
                      >
                        {pTitle}
                      </h5>
                      <p className="text-xs font-semibold text-[#786F66] mt-1 line-clamp-1">
                        {passage.topicLabel || 'History, Architecture, Science'}
                      </p>

                      {/* Mini progress bar */}
                      <div className="mt-3 w-full h-2 bg-[#EFE8DD] rounded-full border border-[#3D352E] overflow-hidden">
                        <div
                          className="h-full bg-[#4D6B53] rounded-full transition-all duration-300"
                          style={{ width: `${pProg}%` }}
                        ></div>
                      </div>

                      {/* Passage Snippet Preview in Handcrafted Paper Box */}
                      <div className="mt-4 p-3.5 bg-[#FAF7F0] rounded-xl border border-dashed border-[#C4B9AA] text-xs text-[#302A24]/90 leading-relaxed font-serif italic relative">
                        <span className="text-lg font-serif text-[#C85A3F] font-bold absolute -top-1 left-2">“</span>
                        <p className="pl-3.5 line-clamp-3">
                          {passage.contentEn
                            ? passage.contentEn.slice(0, 150) + '...'
                            : 'During the sixth and seventh centuries, the inhabitants developed a method of gaining access to clean, fresh groundwater...'}
                        </p>
                      </div>

                      {/* Vocabulary Stats */}
                      <div className="mt-4 flex items-center justify-between text-xs py-2 border-y border-[#EBE4D8]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">📝</span>
                          <span className="font-bold text-[#3D352E]">{pWords} từ vựng</span>
                        </div>
                        <div className="text-[11px] text-[#786F66]">
                          Đã thuộc: <span className="font-bold text-[#4D6B53]">{Math.round((pProg * pWords) / 100)}/{pWords}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-5 space-y-2.5">
                      <button
                        onClick={() => startReading(passage.id)}
                        className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#4D6B53] hover:bg-[#3D5642] rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center gap-2 transition-all cursor-pointer"
                        type="button"
                      >
                        <span>📖</span>
                        <span>Đọc bài đọc &amp; Tra từ trực tiếp</span>
                      </button>

                      {/* 3 Mini Practice Buttons */}
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <button
                          onClick={() => startPractice(0, passage.id)}
                          className="py-1.5 px-1 text-[11px] font-bold text-[#302A24] bg-[#FFF1EB] hover:bg-[#C85A3F] hover:text-white rounded-lg border border-[#3D352E] transition-colors cursor-pointer"
                          title="Flashcard"
                          type="button"
                        >
                          ⚡ Flashcard
                        </button>
                        <button
                          onClick={() => startPractice(1, passage.id)}
                          className="py-1.5 px-1 text-[11px] font-bold text-[#302A24] bg-[#EBF4FA] hover:bg-[#3273A8] hover:text-white rounded-lg border border-[#3D352E] transition-colors cursor-pointer"
                          title="Trắc nghiệm"
                          type="button"
                        >
                          ❓ Trắc nghiệm
                        </button>
                        <button
                          onClick={() => startPractice(2, passage.id)}
                          className="py-1.5 px-1 text-[11px] font-bold text-[#302A24] bg-[#EDF6EB] hover:bg-[#4D6B53] hover:text-white rounded-lg border border-[#3D352E] transition-colors cursor-pointer"
                          title="Điền từ"
                          type="button"
                        >
                          ✍️ Điền từ
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              lessons.map((lesson, lIdx) => {
                const lWords = lesson.totalWords || lesson.wordsCount || 0;
                const lProg = lesson.progress || 0;
                return (
                  <article
                    key={lesson.id || lIdx}
                    className="p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200 group bg-white border-2 border-[#3D352E] rounded-[20px] shadow-[3px_4px_0px_#3D352E]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 text-xs font-bold text-[#302A24] bg-[#FFF5E6] rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center gap-1.5">
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
                        <span className="text-[#786F66]">Đã thuộc: {Math.round((lProg * lWords) / 100)}/{lWords}</span>
                      </div>
                    </div>
                    <div className="mt-5">
                      <button
                        onClick={() => openLesson(lesson.id)}
                        className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#4D6B53] hover:bg-[#3D5642] rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <span>Vào học bài này ➔</span>
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default PageTopicDetail;
