// src/components/pages/PageTopics.jsx
// 100% Pixel-Perfect match to Stitch Design (desktop_topics.html & mobile_topics.html)
import React, { useMemo } from 'react';
import { useTopics } from '../../hooks/useTopics.js';
import { useModal } from '../../context/ModalContext.jsx';
import { useRoute } from '../../router/RouteContext.jsx';

function getCategoryEmoji(catId) {
  const c = String(catId || '').toLowerCase();
  if (c.includes('cam')) return '📚';
  if (c.includes('dest')) return '🏛️';
  if (c.includes('actual') || c.includes('ielts')) return '🏆';
  if (c.includes('oxford') || c.includes('3000')) return '🗂️';
  if (c.includes('thpt') || c.includes('dgnl')) return '🎯';
  if (c.includes('tu vung cua toi') || c.includes('cua toi') || c.includes('personal')) return '📝';
  if (c.includes('sat')) return '🎓';
  if (c.includes('toeic')) return '💼';
  return '📁';
}

function getCategoryPillEmoji(catId) {
  const c = String(catId || '').toLowerCase();
  if (c === 'all') return '🗂️';
  if (c.includes('thpt') || c.includes('dgnl')) return '🎓';
  if (c.includes('ielts')) return '🏆';
  if (c.includes('oxford') || c.includes('can ban') || c.includes('3000')) return '📚';
  if (c.includes('tu vung cua toi') || c.includes('cua toi') || c.includes('personal')) return '📁';
  if (c.includes('dest')) return '🏛️';
  return '🏷️';
}

function getCategoryTagColor(catId) {
  const c = String(catId || '').toLowerCase();
  if (c.includes('cam') || c.includes('ielts')) {
    return 'bg-[#E8EFEA] text-[#5F7C66] border-[#5F7C66]';
  }
  if (c.includes('dest') || c.includes('c1')) {
    return 'bg-[#F0EBE1] text-[#3D352E] border-[#3D352E]';
  }
  if (c.includes('oxford') || c.includes('3000')) {
    return 'bg-[#FEF9EB] text-[#A67C00] border-[#D1A115]';
  }
  if (c.includes('thpt')) {
    return 'bg-[#E8EFEA] text-[#5F7C66] border-[#5F7C66]';
  }
  if (c.includes('cua toi') || c.includes('personal')) {
    return 'bg-[#FAECE6] text-[#D96B43] border-[#D96B43]';
  }
  return 'bg-[#F0EBE1] text-[#3D352E] border-[#3D352E]';
}

function getCategoryIconBg(catId) {
  const c = String(catId || '').toLowerCase();
  if (c.includes('cam')) return 'bg-amber-100';
  if (c.includes('dest')) return 'bg-[#E8EFEA]';
  if (c.includes('actual') || c.includes('ielts')) return 'bg-rose-100';
  if (c.includes('oxford')) return 'bg-amber-200';
  if (c.includes('thpt')) return 'bg-teal-100';
  if (c.includes('cua toi') || c.includes('personal')) return 'bg-orange-100';
  return 'bg-[#FAF7F0]';
}

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

  const { openModal } = useModal();
  const { navigateTo } = useRoute();

  // Active Category Label
  const activeLabel = useMemo(() => {
    if (activeCategory === 'all') return 'Tất cả chủ đề';
    const found = categories.find((c) => c.id === activeCategory);
    return found?.label || found?.name || activeCategory;
  }, [activeCategory, categories]);

  // Total topics count across all folders
  const totalTopicsCount = useMemo(() => {
    return folderList.reduce((sum, f) => sum + (f.count || 0), 0);
  }, [folderList]);

  return (
    <div id="page-topics" className="page active min-h-screen text-[#3D352E] font-['Quicksand',sans-serif] bg-[#F8F5EE]" style={{ backgroundImage: 'radial-gradient(#DDD5C7 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      
      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (block lg:hidden) - Verbatim Stitch Mobile Screen           */}
      {/* ========================================================================= */}
      <div className="block lg:hidden w-full max-w-md mx-auto min-h-screen relative flex flex-col pb-28 px-4 pt-3 pwa-safe-top">
        {/* Mobile Header */}
        <header className="flex items-center justify-between py-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-2xl font-bold text-[#1e1b17] flex items-center gap-1">
                Chủ đề <span className="text-xl">🎨</span>
              </h2>
              <span className="text-sm">🌿</span>
            </div>
            <p className="text-xs text-[#43483f] mt-0.5 max-w-[210px] leading-tight">
              Khám phá và lựa chọn thư mục từ vựng để bắt đầu học nhé!
            </p>
          </div>
          {/* Crayon "+ Tạo chủ đề" Button */}
          <button
            onClick={() => openModal('createTopic')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#86a378] text-[#203918] font-bold text-xs border-[2.5px] border-[#3d352e] shadow-[2px_2px_0px_#3d352e] active:scale-95 transition-transform shrink-0"
          >
            <span className="text-sm font-bold">+</span>
            <span>Tạo chủ đề</span>
          </button>
        </header>

        {/* Mobile Search Bar */}
        <div className="relative mt-2 mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm chủ đề, khóa học..."
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] placeholder-[#9C9286] focus:outline-none focus:ring-2 focus:ring-[#5F7C66]"
          />
          <svg className="w-4 h-4 text-[#827A73] absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        {/* Category Filter Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 border-2 border-[#3d352e] shadow-[2px_2px_0px_#3d352e] active:scale-95 transition-transform ${
              activeCategory === 'all'
                ? 'bg-[#33302c] text-white'
                : 'bg-white text-[#1e1b17]'
            }`}
          >
            <span>🗂️</span>
            <span>Tất cả</span>
          </button>
          {categories
            .filter((c) => c.id !== 'all')
            .map((cat) => {
              const isActive = activeCategory === cat.id;
              const catLabel = cat.label || cat.name || cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 border-2 border-[#3d352e] active:scale-95 transition-transform ${
                    isActive
                      ? 'bg-[#33302c] text-white shadow-[2px_2px_0px_#3d352e]'
                      : 'bg-white text-[#1e1b17] shadow-sm'
                  }`}
                >
                  <span>{getCategoryPillEmoji(cat.id)}</span>
                  <span>{catLabel}</span>
                </button>
              );
            })}
        </div>

        {/* Mobile Grid */}
        <div className="mt-3 flex-1">
          {loading ? (
            <div className="grid grid-cols-2 gap-3.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 rounded-2xl bg-white/70 border-2 border-[#3d352e] animate-pulse p-3.5"></div>
              ))}
            </div>
          ) : activeCategory === 'all' ? (
            /* Mode 1: Folder Cards */
            <div className="grid grid-cols-2 gap-3.5">
              {folderList.map((folder) => {
                const folderName = folder.label || folder.name || folder.id;
                const emoji = getCategoryEmoji(folder.id);
                return (
                  <div
                    key={folder.id}
                    onClick={() => setActiveCategory(folder.id)}
                    className="bg-white rounded-2xl p-3.5 border-[2.5px] border-[#3d352e] shadow-[3px_4px_0px_#3d352e] flex flex-col justify-between h-[168px] relative group hover:-translate-y-0.5 transition-transform cursor-pointer select-none"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-full bg-[#f4ede6] border border-[#3d352e] flex items-center justify-center text-lg">
                          {emoji}
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-[#eee7e1] text-[#1e1b17] text-[10px] font-bold border border-[#3d352e]/40">
                          {folder.count} chủ đề
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-[#1e1b17] leading-snug line-clamp-2">
                        {folderName}
                      </h3>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[#43483f] mb-1 font-medium">
                        <span>Tiến độ</span>
                        <span className="font-bold text-[#1e1b17]">{folder.avgProgress || 0}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#e8e1db] overflow-hidden border border-[#3d352e]/30">
                        <div
                          className="h-full bg-[#86a378] rounded-full transition-all duration-300"
                          style={{ width: `${folder.avgProgress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Mode 2: Topics in Specific Category */
            <div className="grid grid-cols-2 gap-3.5">
              {filteredTopics.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-[#827A73]">
                  <p className="text-base font-bold">Chưa có chủ đề nào</p>
                  <button
                    onClick={() => openModal('createTopic')}
                    className="mt-3 px-4 py-2 bg-[#D96B43] text-white text-xs font-bold rounded-xl border border-[#3d352e]"
                  >
                    + Tạo chủ đề ngay
                  </button>
                </div>
              ) : (
                filteredTopics.map((topic) => {
                  const pct = Math.round(topic.progress || 0);
                  const emoji = getCategoryEmoji(topic.category || topic.name);
                  return (
                    <div
                      key={topic.id}
                      onClick={() => openTopic(topic.id, topic.name, topic.category)}
                      className="bg-white rounded-2xl p-3.5 border-[2.5px] border-[#3d352e] shadow-[3px_4px_0px_#3d352e] flex flex-col justify-between h-[168px] relative group hover:-translate-y-0.5 transition-transform cursor-pointer select-none"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-9 h-9 rounded-full bg-[#f4ede6] border border-[#3d352e] flex items-center justify-center text-lg">
                            {emoji}
                          </div>
                          {topic.is_pro && !isUserPro && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-200 text-[#3d352e] text-[9px] font-black border border-[#3d352e]">
                              PRO
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-[#1e1b17] leading-snug line-clamp-2">
                          {topic.name}
                        </h3>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-[#43483f] mb-1 font-medium">
                          <span>Tiến độ</span>
                          <span className="font-bold text-[#1e1b17]">{pct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#e8e1db] overflow-hidden border border-[#3d352e]/30">
                          <div
                            className="h-full bg-[#D96B43] rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (hidden lg:flex) - 100% Verbatim Stitch Desktop Screen      */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-1 w-full max-w-[1536px] mx-auto min-h-screen lg:pl-64 xl:pl-72">
        <main className="flex-1 px-8 py-7 flex flex-col gap-6 overflow-x-hidden min-w-0">
          
          {/* Header and Action Row */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#827A73] mb-1">
                <span>HiVocab Desktop</span>
                <span>•</span>
                <span className="text-[#5F7C66]">Khóa học &amp; Thư mục</span>
              </div>
              <h2 className="text-3xl font-extrabold text-[#3D352E] flex items-center gap-2.5 tracking-tight font-['Quicksand',sans-serif]">
                Chủ đề &amp; Khóa học 📚
              </h2>
              <p className="text-sm text-[#73695F] font-semibold mt-1">
                Khám phá và lựa chọn thư mục từ vựng theo giáo trình, mục tiêu thi cử hoặc sở thích cá nhân.
              </p>
            </div>

            {/* Search Bar and Action Button */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative w-72 lg:w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm khóa học, sách (CAM, IELTS, THPT)..."
                  className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] placeholder-[#9C9286] focus:outline-none focus:ring-2 focus:ring-[#5F7C66]"
                />
                <svg className="w-4 h-4 text-[#827A73] absolute left-3 top-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>

              {/* Create Topic CTA */}
              <button
                onClick={() => openModal('createTopic')}
                className="flex items-center gap-2 bg-[#D96B43] hover:bg-[#c85e37] text-white font-bold text-xs px-4 py-2.5 rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] transition active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
                </svg>
                <span>Tạo chủ đề mới</span>
              </button>

              {/* Notification Bell */}
              <button
                aria-label="Thông báo"
                className="w-10 h-10 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center hover:bg-neutral-50 transition cursor-pointer"
              >
                <div className="relative">
                  <svg className="w-5 h-5 text-[#3D352E]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                  </svg>
                  <span className="w-2 h-2 bg-[#D96B43] rounded-full absolute top-0 right-0"></span>
                </div>
              </button>
            </div>
          </header>

          {/* Filter Pills and Progress Strip */}
          <section className="flex flex-col gap-3.5">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center gap-2 transition cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-[#3D352E] text-white'
                    : 'bg-white hover:bg-[#FDF9ED] text-[#3D352E]'
                }`}
              >
                <span>🗂️</span>
                <span>Tất cả chủ đề ({totalTopicsCount})</span>
              </button>

              {categories
                .filter((c) => c.id !== 'all')
                .map((cat) => {
                  const isActive = activeCategory === cat.id;
                  const catLabel = cat.label || cat.name || cat.id;
                  const folderMatch = folderList.find((f) => f.id === cat.id);
                  const count = folderMatch?.count || 0;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center gap-1.5 transition cursor-pointer ${
                        isActive
                          ? 'bg-[#3D352E] text-white'
                          : 'bg-white hover:bg-[#FDF9ED] text-[#3D352E]'
                      }`}
                    >
                      <span>{getCategoryPillEmoji(cat.id)}</span>
                      <span>{catLabel} ({count})</span>
                    </button>
                  );
                })}
            </div>

            {/* Progress Summary Strip Banner */}
            <div className="bg-[#FFFDF8] px-5 py-3 rounded-[20px] border-2 border-[#3D352E] shadow-[3px_3px_0px_#3D352E] flex flex-wrap items-center justify-between text-xs font-semibold gap-3">
              <div className="flex items-center gap-2">
                <span className="text-base">📌</span>
                <span className="text-[#3D352E]">
                  Bạn đang xem <b className="text-[#5F7C66]">{activeCategory === 'all' ? `${folderList.length} thư mục` : `${filteredTopics.length} chủ đề`}</b>
                  <span className="mx-1.5 text-gray-300">|</span>
                  Thư mục hiện tại: <b className="text-[#D96B43]">{activeLabel}</b>
                </span>
              </div>
              <div className="flex items-center gap-2 font-bold text-xs text-[#5F7C66]">
                <span>Mục tiêu học tuần: 5 chủ đề</span>
                <div className="w-24 bg-gray-200 h-2.5 rounded-full overflow-hidden border border-[#3D352E]">
                  <div className="bg-[#5F7C66] h-full rounded-full" style={{ width: '60%' }}></div>
                </div>
                <span className="text-xs text-[#3D352E]">3/5</span>
              </div>
            </div>
          </section>

          {/* Main Grid Area */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-[20px] bg-white border-2 border-[#3D352E] shadow-[3px_3px_0px_#3D352E] animate-pulse p-6"></div>
              ))}
            </div>
          ) : activeCategory === 'all' ? (
            /* Mode 1: Folder / Course Cards Grid (100% Stitch card-craft) */
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {folderList.map((folder) => {
                const folderName = folder.label || folder.name || folder.id;
                const emoji = getCategoryEmoji(folder.id);
                const tagColor = getCategoryTagColor(folder.id);
                const iconBg = getCategoryIconBg(folder.id);
                const isStarted = (folder.avgProgress || 0) > 0;
                const sampleTopics = (folder.topics || []).slice(0, 3).map((t) => t.name).join(', ');

                return (
                  <article
                    key={folder.id}
                    className="bg-white p-5 flex flex-col justify-between rounded-[20px] border-2 border-[#3D352E] shadow-[3px_3px_0px_#3D352E] hover:shadow-[4px_5px_0px_#3D352E] hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden"
                  >
                    {isStarted && (
                      <div className="absolute -right-12 top-6 bg-[#D96B43] text-white text-[10px] font-black tracking-wider uppercase py-1 px-12 rotate-45 border-y border-[#3D352E] shadow-sm">
                        Đang học
                      </div>
                    )}
                    <div>
                      {/* Top Tag & Meta */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${tagColor}`}>
                          <span>{getCategoryPillEmoji(folder.id)}</span> {folderName}
                        </span>
                        <span className="text-[11px] font-extrabold text-[#73695F] bg-[#EFE9DD] px-2 py-0.5 rounded-lg border border-[#3D352E]/30 mr-8">
                          {folder.count} chủ đề
                        </span>
                      </div>

                      {/* Card Header & Icon */}
                      <div className="flex items-start gap-3.5 mt-2">
                        <div className={`w-14 h-14 rounded-2xl ${iconBg} border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center text-2xl shrink-0`}>
                          {emoji}
                        </div>
                        <div>
                          <h3
                            onClick={() => setActiveCategory(folder.id)}
                            className="text-lg font-black text-[#3D352E] leading-tight hover:text-[#5F7C66] transition cursor-pointer"
                          >
                            {folderName}
                          </h3>
                          <p className="text-xs text-[#827A73] font-semibold mt-1">
                            Tuyển tập các bài học và từ vựng thuộc khóa học {folderName}.
                          </p>
                        </div>
                      </div>

                      {/* Topic Preview Snippet */}
                      <div className="mt-4 p-2.5 rounded-xl bg-[#FAF7F0] border border-[#3D352E]/30 text-[11px] text-[#5C534A] leading-relaxed">
                        <span className="font-bold text-[#D96B43]">Chủ đề tiêu biểu: </span>
                        {sampleTopics || 'Bao gồm các bài học trắc nghiệm & bài đọc chuyên sâu...'}
                      </div>
                    </div>

                    {/* Bottom: Progress Bar & Button */}
                    <div className="mt-5 pt-3 border-t border-[#E8E1D3]">
                      <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                        <span className="text-[#73695F]">Tiến độ học</span>
                        <span className={isStarted ? 'text-[#D96B43] font-black' : 'text-gray-500 font-extrabold'}>
                          {isStarted ? `${folder.avgProgress}%` : 'Chưa bắt đầu'}
                        </span>
                      </div>
                      <div className="w-full bg-[#E5DECF] h-3 rounded-full overflow-hidden border border-[#3D352E] p-0.5">
                        <div
                          className="bg-[#D96B43] h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(folder.avgProgress || 0, 100)}%` }}
                        ></div>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <button
                          onClick={() => setActiveCategory(folder.id)}
                          className={`flex-1 py-2.5 px-3 rounded-xl ${
                            isStarted ? 'bg-[#D96B43] hover:bg-[#c25933]' : 'bg-[#5F7C66] hover:bg-[#4d6653]'
                          } text-white text-xs font-extrabold border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] transition flex items-center justify-center gap-1.5 cursor-pointer`}
                        >
                          <span>{isStarted ? 'Tiếp tục học' : 'Bắt đầu học'}</span>
                          <span className="text-sm">{isStarted ? '➔' : '✨'}</span>
                        </button>
                        <button
                          onClick={() => setActiveCategory(folder.id)}
                          className="p-2.5 rounded-xl bg-white hover:bg-neutral-50 text-[#3D352E] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] transition cursor-pointer"
                          title="Xem chi tiết danh sách chủ đề"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : (
            /* Mode 2: Topics inside Specific Category */
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTopics.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-white rounded-[20px] border-2 border-[#3D352E] p-8">
                  <p className="text-base font-bold text-[#3D352E]">Chưa có chủ đề nào trong danh mục này</p>
                  <button
                    onClick={() => openModal('createTopic')}
                    className="mt-4 px-5 py-2.5 bg-[#D96B43] text-white text-xs font-bold rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer"
                  >
                    + Tạo chủ đề mới ngay
                  </button>
                </div>
              ) : (
                filteredTopics.map((topic) => {
                  const pct = Math.round(topic.progress || 0);
                  const isStarted = pct > 0;
                  const emoji = getCategoryEmoji(topic.category || topic.name);
                  const tagColor = getCategoryTagColor(topic.category);
                  const iconBg = getCategoryIconBg(topic.category);

                  return (
                    <article
                      key={topic.id}
                      className="bg-white p-5 flex flex-col justify-between rounded-[20px] border-2 border-[#3D352E] shadow-[3px_3px_0px_#3D352E] hover:shadow-[4px_5px_0px_#3D352E] hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden"
                    >
                      {isStarted && (
                        <div className="absolute -right-12 top-6 bg-[#D96B43] text-white text-[10px] font-black tracking-wider uppercase py-1 px-12 rotate-45 border-y border-[#3D352E] shadow-sm">
                          Đang học
                        </div>
                      )}
                      <div>
                        {/* Top Tag & Meta */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${tagColor}`}>
                            <span>{getCategoryPillEmoji(topic.category)}</span> {topic.category || 'Chủ đề'}
                          </span>
                          {topic.is_pro && !isUserPro && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-[#3D352E] text-[10px] font-black border border-[#3D352E]">
                              PRO
                            </span>
                          )}
                        </div>

                        {/* Card Header & Icon */}
                        <div className="flex items-start gap-3.5 mt-2">
                          <div className={`w-14 h-14 rounded-2xl ${iconBg} border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center text-2xl shrink-0`}>
                            {emoji}
                          </div>
                          <div>
                            <h3
                              onClick={() => openTopic(topic.id, topic.name, topic.category)}
                              className="text-lg font-black text-[#3D352E] leading-tight hover:text-[#5F7C66] transition cursor-pointer"
                            >
                              {topic.name}
                            </h3>
                            <p className="text-xs text-[#827A73] font-semibold mt-1">
                              {topic.description || 'Học và ghi nhớ từ vựng với phương pháp ngắt quãng.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Bottom: Progress Bar & Button */}
                      <div className="mt-5 pt-3 border-t border-[#E8E1D3]">
                        <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                          <span className="text-[#73695F]">Tiến độ học</span>
                          <span className={isStarted ? 'text-[#D96B43] font-black' : 'text-gray-500 font-extrabold'}>
                            {isStarted ? `${pct}%` : 'Chưa bắt đầu'}
                          </span>
                        </div>
                        <div className="w-full bg-[#E5DECF] h-3 rounded-full overflow-hidden border border-[#3D352E] p-0.5">
                          <div
                            className="bg-[#D96B43] h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          ></div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <button
                            onClick={() => openTopic(topic.id, topic.name, topic.category)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-[#5F7C66] hover:bg-[#4d6653] text-white text-xs font-extrabold border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Vào học ngay</span>
                            <span className="text-sm">➔</span>
                          </button>
                          <button
                            onClick={() => handleDeleteTopic(topic.id, topic.name)}
                            className="p-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-500 border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] transition cursor-pointer"
                            title="Xóa chủ đề"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          )}

          {/* Mascot Recommendation Banner */}
          <section className="mt-2 bg-[#FFFBF0] rounded-[20px] border-2 border-[#3D352E] shadow-[3px_3px_0px_#3D352E] p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-3xl bg-[#FFEBD0] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    alt="Bé Hổ Churbito học tập"
                    className="w-full h-full object-contain p-1"
                    src="/mascot/mascot_cozy.png"
                  />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8EFEA] text-[#5F7C66] text-xs font-black border border-[#5F7C66]">
                    <span>🐾</span> CHURBITO GỢI Ý ÔN TẬP
                  </div>
                  <h4 className="text-lg font-black text-[#3D352E]">
                    "Hôm nay bạn nên hoàn thành 1 bài đọc hoặc 1 bài học để duy trì chuỗi học tập nhé!"
                  </h4>
                  <p className="text-xs text-[#827A73] font-semibold">
                    Chỉ cần khoảng 10-15 phút ôn tập sẽ giúp bộ não khắc sâu từ vựng mới vào trí nhớ dài hạn.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-3">
                <button
                  onClick={() => {
                    const firstTopic = folderList[0];
                    if (firstTopic) setActiveCategory(firstTopic.id);
                  }}
                  className="py-3 px-6 rounded-2xl bg-[#5F7C66] hover:bg-[#4d6653] text-white font-extrabold text-sm border-2 border-[#3D352E] shadow-[3px_3px_0px_#3D352E] transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Bắt đầu học ngay</span>
                  <span className="text-base">🚀</span>
                </button>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-[#F4CA64]/20 pointer-events-none"></div>
          </section>

          {/* Page Footer */}
          <footer className="mt-4 pt-6 pb-2 border-t border-[#E5DECF] flex flex-wrap items-center justify-between text-xs text-[#827A73] font-medium">
            <p>© 2026 HiVocab! - Ứng dụng ghi nhớ từ vựng thông minh cho học sinh Việt Nam.</p>
            <div className="flex items-center gap-6">
              <a className="hover:text-[#3D352E] transition cursor-pointer">Điều khoản</a>
              <a className="hover:text-[#3D352E] transition cursor-pointer">Cẩm nang ôn thi</a>
              <a className="hover:text-[#3D352E] transition flex items-center gap-1 cursor-pointer">
                <span>Hỗ trợ bé Hổ</span>
                <span>🐯</span>
              </a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default PageTopics;
