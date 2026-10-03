// src/components/pages/PageLessonDetail.jsx
// 100% Pixel-Perfect match to Stitch Design (desktop_lesson_detail.html & mobile_lesson_detail.html)
import React, { useMemo } from 'react';
import { useLessonDetail } from '../../hooks/useLessonDetail.js';
import { useModal } from '../../context/ModalContext.jsx';

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

  const { openModal } = useModal();

  const isPassage = Boolean(passageId && passageId !== '__unlinked__');

  // Stats calculation
  const newCount = useMemo(() => words.filter((w) => (w.level || 0) === 0).length, [words]);
  const learningCount = useMemo(() => words.filter((w) => (w.level || 0) >= 1 && (w.level || 0) <= 3).length, [words]);
  const masteredCount = useMemo(() => words.filter((w) => (w.level || 0) >= 4).length, [words]);

  const handleAddWord = () => {
    openModal('addWord', { topicId, passageId: isPassage ? passageId : null });
  };

  return (
    <div id="page-lesson-detail" className="page active min-h-screen text-[#322e2b] font-['Quicksand',sans-serif] bg-[#faf7f2]" style={{ backgroundImage: 'radial-gradient(#e2d9cd 1px, transparent 1px), radial-gradient(#eedecb 0.7px, transparent 0.7px)', backgroundSize: '24px 24px, 12px 12px', backgroundPosition: '0 0, 6px 6px' }}>

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (block lg:hidden) - Verbatim Stitch Mobile Screen           */}
      {/* ========================================================================= */}
      <div className="block lg:hidden w-full max-w-md mx-auto min-h-screen relative flex flex-col px-4 pt-3 pb-28">
        {/* Top Header */}
        <header className="flex items-center justify-between py-2 mb-2">
          <div className="flex items-center gap-2.5">
            <button
              onClick={goBack}
              aria-label="Quay lại"
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1e1b17] border-2 border-[#3d352e] shadow-[1.5px_2px_0px_#3d352e] active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
            </button>
            <h1 className="font-bold text-lg text-[#1e1b17] truncate max-w-[200px]">
              {lessonName || 'Bài học'}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 bg-[#ccecbc] px-3 py-1 rounded-full border-2 border-[#3d352e] shadow-xs">
            <span className="text-xs">🌱</span>
            <span className="text-xs font-bold text-[#092104]">Churbito</span>
          </div>
        </header>

        {/* Lesson Overview Card */}
        <section className="bg-white rounded-[24px] border-[2.5px] border-[#3d352e] shadow-[3px_4px_0px_rgba(61,53,46,0.15)] p-4 mb-4 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="inline-block bg-[#f4ede6] px-3 py-0.5 rounded-full text-[11px] font-bold text-[#43483f] border border-[#c4c8bc] mb-1">
                {isPassage ? 'Reading Passage' : 'Lesson'}
              </span>
              <h2 className="text-xl font-bold text-[#1e1b17] leading-tight">{lessonName}</h2>
              <p className="text-xs text-[#43483f] mt-0.5 font-medium">{words.length} từ vựng</p>
            </div>
            <button
              onClick={handleAddWord}
              className="flex items-center gap-1 bg-[#33302c] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform"
            >
              <span>+ Thêm từ</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 pt-2.5 border-t border-dashed border-[#e8e1db]">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-[#43483f]">Tiến độ ghi nhớ</span>
              <span className="font-bold text-[#1e1b17]">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-[#f4ede6] rounded-full p-0.5 border border-[#3d352e]/30 overflow-hidden">
              <div
                className="h-full bg-[#86a378] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* Study Modes: 3 Buttons */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <h3 className="text-xs font-bold text-[#1e1b17] uppercase tracking-wide">CHẾ ĐỘ HỌC</h3>
            <span className="text-xs text-[#4b6540] font-bold">3 bài tập</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => startPractice(0)}
              className="bg-white rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 border-2 border-[#3d352e] shadow-[2px_2px_0px_#3d352e] active:scale-95 transition-all text-center cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#feab79]/30 flex items-center justify-center text-sm">
                ⚡
              </div>
              <span className="text-xs font-bold text-[#1e1b17]">Flashcard</span>
            </button>
            <button
              onClick={() => startPractice(1)}
              className="bg-white rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 border-2 border-[#3d352e] shadow-[2px_2px_0px_#3d352e] active:scale-95 transition-all text-center cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#c3e8ff] flex items-center justify-center text-sm">
                ❓
              </div>
              <span className="text-xs font-bold text-[#1e1b17]">Trắc nghiệm</span>
            </button>
            <button
              onClick={() => startPractice(2)}
              className="bg-white rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 border-2 border-[#3d352e] shadow-[2px_2px_0px_#3d352e] active:scale-95 transition-all text-center cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#ccecbc] flex items-center justify-center text-sm">
                ✏️
              </div>
              <span className="text-xs font-bold text-[#1e1b17]">Điền từ</span>
            </button>
          </div>
        </section>

        {/* Search & Status Filters */}
        <section className="space-y-2.5 mb-4">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm từ, phát âm, nghĩa..."
              className="w-full pl-9 pr-4 py-2 bg-white rounded-full border-2 border-[#3d352e] shadow-[1.5px_2px_0px_rgba(61,53,46,0.12)] text-xs text-[#1e1b17] placeholder-[#74796f] focus:outline-none"
            />
            <svg className="w-4 h-4 text-[#74796f] absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: `Tất cả (${words.length})` },
              { id: 'new', label: `Từ mới (${newCount})` },
              { id: 'learning', label: `Đang ôn (${learningCount})` },
              { id: 'mastered', label: `Đã thuộc (${masteredCount})` },
            ].map((chip) => {
              const isActive = statusFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setStatusFilter(chip.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border-2 border-[#3d352e] whitespace-nowrap active:scale-95 transition-transform ${
                    isActive
                      ? 'bg-[#33302c] text-white shadow-[1.5px_2px_0px_#3d352e]'
                      : 'bg-white text-[#43483f]'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Word Cards List */}
        <section className="space-y-3 flex-1">
          {filteredWords.length === 0 ? (
            <div className="text-center py-12 text-[#74796f]">
              <p className="font-bold">Không tìm thấy từ vựng nào</p>
            </div>
          ) : (
            filteredWords.map((word, index) => {
              const status = (word.level || 0) >= 4 ? 'mastered' : (word.level || 0) >= 1 ? 'learning' : 'new';
              const statusLabel = status === 'mastered' ? 'Đã thuộc' : status === 'learning' ? 'Đang ôn' : 'Mới';
              const statusClass =
                status === 'mastered'
                  ? 'bg-[#ccecbc] text-[#092104]'
                  : status === 'learning'
                  ? 'bg-[#ffdbc9] text-[#70370f]'
                  : 'bg-[#c3e8ff] text-[#3b6379]';

              return (
                <article
                  key={word.id || index}
                  className="bg-white rounded-[24px] border-[2.5px] border-[#3d352e] shadow-[3px_4px_0px_rgba(61,53,46,0.15)] p-4 relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-[#f4ede6] flex items-center justify-center font-bold text-sm text-[#1e1b17] border border-[#3d352e]/30">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg font-bold text-[#1e1b17]">{word.word}</span>
                          {word.phonetic && (
                            <span className="text-xs text-[#74796f]">{word.phonetic}</span>
                          )}
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePlayWord(word.word)}
                      aria-label="Phát âm từ"
                      className="p-1.5 text-[#1e1b17] hover:text-[#4b6540] active:scale-90 transition-transform cursor-pointer"
                    >
                      <span className="text-lg">🔊</span>
                    </button>
                  </div>

                  {/* Meaning & Definition */}
                  <div className="mt-2.5 pl-10">
                    {word.pos && (
                      <div className="text-[11px] text-[#74796f] font-semibold mb-0.5">
                        {word.pos}
                      </div>
                    )}
                    <p className="text-sm font-bold text-[#1e1b17]">{word.meaning}</p>

                    {/* Example Sentence in Sketch Quote */}
                    {(word.exampleSentence || word.example_sentence) && (
                      <div className="mt-2 p-2.5 bg-[#faf2ec] rounded-r-2xl border-l-[3px] border-[#feab79]">
                        <p className="text-xs text-[#1e1b17] italic leading-relaxed">
                          "{word.exampleSentence || word.example_sentence}"
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (hidden lg:flex) - 100% Verbatim Stitch Desktop Screen      */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-1 flex-col min-w-0 overflow-y-auto px-8 py-7 lg:pl-64 xl:pl-72 w-full max-w-[1536px] mx-auto min-h-screen">
        
        {/* Breadcrumbs & Top Quick Actions */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-dashed border-[#b8ae9f]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#78726b]">
            <button
              onClick={goBack}
              className="hover:text-[#322e2b] flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <span>←</span>
              <span>Quay lại</span>
            </button>
            <span>/</span>
            <span onClick={goBack} className="hover:text-[#322e2b] cursor-pointer">
              {topicName || 'Chủ đề'}
            </span>
            <span>/</span>
            <span className="text-[#322e2b] font-bold bg-white px-2.5 py-0.5 rounded-full border border-[#322e2b] text-xs">
              {lessonName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isPassage && (
              <button
                onClick={startReading}
                className="px-3.5 py-1.5 text-xs font-bold bg-white rounded-full border-2 border-[#322e2b] shadow-[2px_2px_0px_#322e2b] hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
              >
                <span>📖</span>
                <span>Đọc bài song ngữ</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#eef5ec] rounded-full border border-[#799b6e] text-xs font-bold text-[#799b6e]">
              <span>🌱</span>
              <span>Churbito Level 1</span>
            </div>
          </div>
        </div>

        {/* Hero Header: Lesson Overview Banner */}
        <section className="bg-white rounded-[22px] border-2 border-[#322e2b] shadow-[3px_4px_0px_#322e2b] p-6 mb-7 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="px-3 py-0.5 text-xs font-bold bg-[#f4ede4] text-[#322e2b] border border-[#322e2b] rounded-full">
                  {isPassage ? 'Reading Passage' : 'Lesson'}
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-[#fff9e6] text-[#322e2b] border border-[#322e2b] rounded-full">
                  IELTS Academic Reading
                </span>
                <span className="text-xs text-[#78726b] font-medium">Ước tính học: ~25 phút</span>
              </div>
              <h1 className="text-3xl font-bold text-[#322e2b] tracking-tight mb-2">
                {lessonName}
              </h1>
              <p className="text-sm text-[#78726b] font-medium leading-relaxed">
                Tổng hợp {words.length} từ vựng học thuật cao cấp, cụm collocations và ngữ cảnh trích xuất từ bài học này.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row md:flex-col lg:flex-row items-center gap-3 shrink-0">
              <button
                onClick={handleAddWord}
                className="px-4 py-2.5 bg-[#322e2b] hover:bg-black text-white font-bold text-sm rounded-[16px] border-2 border-[#322e2b] shadow-[2px_2px_0px_#322e2b] flex items-center gap-2 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
              >
                <span>+</span>
                <span>Thêm từ vào bài</span>
              </button>
              <button
                onClick={() => startPractice(0)}
                className="px-5 py-2.5 bg-[#799b6e] hover:bg-[#688a5d] text-white font-bold text-sm rounded-[16px] border-2 border-[#322e2b] shadow-[3px_4px_0px_#322e2b] flex items-center gap-2 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
              >
                <span>🚀</span>
                <span>Bắt đầu học ngay</span>
              </button>
            </div>
          </div>

          {/* Memorization Progress Bar */}
          <div className="mt-6 pt-5 border-t border-dashed border-[#dcd4c7]">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-[#322e2b] flex items-center gap-1.5">
                <span>📊</span> Tiến độ ghi nhớ bài học
              </span>
              <span className="text-[#322e2b] font-bold">
                {progressPercent}% <span className="font-normal text-[#78726b]">({masteredCount} / {words.length} từ)</span>
              </span>
            </div>
            <div className="w-full h-4 bg-[#f4ede4] rounded-full border-2 border-[#322e2b] p-0.5 overflow-hidden">
              <div
                className="h-full bg-[#799b6e] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* Learning Modes Section (4 Cards Grid) */}
        <section className="mb-7">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#322e2b] flex items-center gap-2">
              <span>✏️</span> Chế Độ Học Tập
            </h2>
            <span className="text-xs font-bold text-[#78726b] bg-[#f4ede4] px-2.5 py-1 rounded-full border border-[#322e2b]/30">
              4 dạng bài tập rèn luyện
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Flashcard */}
            <button
              onClick={() => startPractice(0)}
              className="group p-4 bg-white hover:bg-[#fff2ec] rounded-[16px] border-2 border-[#322e2b] shadow-[3px_4px_0px_#322e2b] text-left transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#fff2ec] border-2 border-[#322e2b] flex items-center justify-center text-[#e87248] text-lg group-hover:scale-105 transition-transform">
                  ⚡
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#e87248] text-white rounded-full">
                  Phổ biến
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#322e2b] mb-1">Flashcard</h3>
              <p className="text-xs text-[#78726b] font-medium leading-snug">
                Lật thẻ ghi nhớ hai mặt &amp; phản xạ từ vựng tức thì.
              </p>
            </button>

            {/* Trắc nghiệm */}
            <button
              onClick={() => startPractice(1)}
              className="group p-4 bg-white hover:bg-[#fff9e6] rounded-[16px] border-2 border-[#322e2b] shadow-[3px_4px_0px_#322e2b] text-left transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#fff9e6] border-2 border-[#322e2b] flex items-center justify-center text-[#d49817] text-lg group-hover:scale-105 transition-transform">
                  ❔
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#f5c35b] text-[#322e2b] rounded-full border border-[#322e2b]">
                  SRS v2
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#322e2b] mb-1">Trắc Nghiệm</h3>
              <p className="text-xs text-[#78726b] font-medium leading-snug">
                Chọn nghĩa tiếng Việt &amp; ngữ cảnh câu chính xác.
              </p>
            </button>

            {/* Điền từ */}
            <button
              onClick={() => startPractice(2)}
              className="group p-4 bg-white hover:bg-[#eef5ec] rounded-[16px] border-2 border-[#322e2b] shadow-[3px_4px_0px_#322e2b] text-left transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#eef5ec] border-2 border-[#322e2b] flex items-center justify-center text-[#799b6e] text-lg group-hover:scale-105 transition-transform">
                  ✏️
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#799b6e] text-white rounded-full">
                  Ghi nhớ
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#322e2b] mb-1">Điền Từ Khuyết</h3>
              <p className="text-xs text-[#78726b] font-medium leading-snug">
                Nhập chữ cái đúng chuẩn ngữ pháp &amp; phát âm.
              </p>
            </button>

            {/* Nghe chép chính tả */}
            <button
              onClick={() => startPractice(3)}
              className="group p-4 bg-white hover:bg-[#f3e8ff] rounded-[16px] border-2 border-[#322e2b] shadow-[3px_4px_0px_#322e2b] text-left transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#f3e8ff] border-2 border-[#322e2b] flex items-center justify-center text-[#b39ddb] text-lg group-hover:scale-105 transition-transform">
                  🎧
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#b39ddb] text-white rounded-full">
                  Nghe hiểu
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#322e2b] mb-1">Nghe Chính Tả</h3>
              <p className="text-xs text-[#78726b] font-medium leading-snug">
                Luyện tai nghe phát âm chuẩn giọng Anh - Mỹ.
              </p>
            </button>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="bg-white p-4 rounded-[16px] border-2 border-[#322e2b] shadow-[2px_2px_0px_#322e2b] mb-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="relative w-full lg:w-96">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm từ, phát âm, nghĩa tiếng Việt..."
                className="w-full pl-10 pr-4 py-2 bg-[#faf7f2] rounded-xl border-2 border-[#322e2b] text-sm font-medium focus:ring-0 focus:border-[#799b6e] focus:bg-white placeholder-[#78726b]"
              />
              <span className="absolute left-3.5 top-2.5 text-[#78726b] text-sm">🔍</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {[
                { id: 'all', label: `Tất cả (${words.length})` },
                { id: 'new', label: `Từ mới (${newCount})` },
                { id: 'learning', label: `Đang ôn (${learningCount})` },
                { id: 'mastered', label: `Đã thuộc (${masteredCount})` },
              ].map((btn) => {
                const isActive = statusFilter === btn.id;
                return (
                  <button
                    key={btn.id}
                    onClick={() => setStatusFilter(btn.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 border-[#322e2b] transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#322e2b] text-white shadow-[2px_2px_0px_#322e2b]'
                        : 'bg-white text-[#322e2b] hover:bg-[#faf7f2]'
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left Column: Word Cards List (Span 8) */}
          <div className="lg:col-span-8 space-y-4">
            {filteredWords.length === 0 ? (
              <div className="bg-white rounded-[22px] border-2 border-[#322e2b] p-12 text-center text-[#78726b]">
                <p className="font-bold text-base">Không có từ vựng nào phù hợp bộ lọc.</p>
              </div>
            ) : (
              filteredWords.map((word, index) => {
                const status = (word.level || 0) >= 4 ? 'mastered' : (word.level || 0) >= 1 ? 'learning' : 'new';
                const statusLabel = status === 'mastered' ? 'Đã thuộc' : status === 'learning' ? 'Đang ôn' : 'Mới';
                const statusClass =
                  status === 'mastered'
                    ? 'bg-[#eef5ec] text-[#799b6e] border-[#799b6e]'
                    : status === 'learning'
                    ? 'bg-[#fff9e6] text-[#d49817] border-[#d49817]'
                    : 'bg-[#fff2ec] text-[#e87248] border-[#e87248]';

                return (
                  <article
                    key={word.id || index}
                    className="bg-white rounded-[22px] border-2 border-[#322e2b] shadow-[3px_4px_0px_#322e2b] p-5 transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-[#322e2b] flex items-center justify-center font-bold text-sm bg-[#f4ede4]">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-xl font-bold text-[#322e2b]">{word.word}</h3>
                            {word.phonetic && (
                              <span className="text-sm font-semibold text-[#78726b] tracking-wide">
                                {word.phonetic}
                              </span>
                            )}
                            <span className={`text-[11px] font-bold px-2 py-0.5 border rounded-md ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </div>
                          {word.pos && (
                            <div className="text-xs text-[#78726b] font-semibold mt-0.5 flex items-center gap-1">
                              <span>✕</span> {word.pos}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Audio & Delete Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePlayWord(word.word)}
                          className="w-8 h-8 rounded-xl border-2 border-[#322e2b] flex items-center justify-center hover:bg-[#f4ede4] transition-colors cursor-pointer text-sm"
                          title="Phát âm"
                        >
                          🔊
                        </button>
                        <button
                          onClick={() => handleDeleteWord(word.id, word.word)}
                          className="w-8 h-8 rounded-xl border-2 border-[#322e2b] flex items-center justify-center hover:bg-rose-50 text-rose-500 transition-colors cursor-pointer text-sm"
                          title="Xóa từ"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Meaning */}
                    <div className="mb-3 pl-11">
                      <p className="text-base font-bold text-[#322e2b]">{word.meaning}</p>
                      {word.notes && (
                        <p className="text-xs text-[#78726b] font-medium mt-0.5">{word.notes}</p>
                      )}
                    </div>

                    {/* Example Sentence Context Box */}
                    {(word.exampleSentence || word.example_sentence) && (
                      <div className="ml-11 p-3.5 bg-[#fff2ec]/50 rounded-[14px] border-l-4 border-[#e87248] border-t border-r border-b border-[#e87248]/30">
                        <p className="text-sm italic font-medium text-[#322e2b] mb-1">
                          "{word.exampleSentence || word.example_sentence}"
                        </p>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          {/* Right Column: Mini Mascot & Lesson Stats (Span 4) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Mascot Companion Box */}
            <div className="p-4 bg-[#fff9e6]/60 rounded-[16px] border-2 border-[#322e2b] shadow-[2px_2px_0px_#322e2b] flex items-center gap-3">
              <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-white border border-[#322e2b] p-1 flex items-center justify-center">
                <img
                  alt="Bé Hổ Mascot"
                  className="w-full h-full object-contain"
                  src="/mascot/mascot_cozy.png"
                />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#e87248] uppercase tracking-wide block">
                  Bé Hổ Đồng Hành
                </span>
                <p className="text-xs font-semibold text-[#322e2b] leading-snug">
                  "Ôn tập 10 phút hôm nay để giữ chuỗi nha bạn ơi!"
                </p>
              </div>
            </div>

            {/* Lesson Quick Stats Box */}
            <div className="p-4 bg-white rounded-[16px] border-2 border-[#322e2b] shadow-[2px_2px_0px_#322e2b] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#78726b]">
                Phân bố ghi nhớ bài học
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-[#e87248]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e87248]"></span> Từ mới (Lvl 0)
                  </span>
                  <span className="font-bold">{newCount} từ</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-[#d49817]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f5c35b]"></span> Đang ôn (Lvl 1-3)
                  </span>
                  <span className="font-bold">{learningCount} từ</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-[#799b6e]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#799b6e]"></span> Đã thuộc (Lvl 4-5)
                  </span>
                  <span className="font-bold">{masteredCount} từ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageLessonDetail;
