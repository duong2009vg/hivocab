// src/components/pages/PageVocabulary.jsx
// 100% Pixel-Perfect match to Stitch Design (desktop_vocabulary.html & mobile_vocabulary.html)
import React, { useState, useEffect, useMemo } from 'react';
import { useVocabulary } from '../../hooks/useVocabulary.js';
import { useModal } from '../../context/ModalContext.jsx';
import { useRoute } from '../../router/RouteContext.jsx';

const LEVEL_INTERVALS = {
  0: 'Mới thêm',
  1: '1h',
  2: '3 Ngày',
  3: '1 Tuần',
  4: '2 Tuần',
  5: 'Ghi nhớ sâu',
};

const LEVEL_COLORS = {
  0: { bg: 'bg-[#f5ede2]', text: 'text-[#7a7267]', border: 'border-[#d8c8b4]', fill: 'bg-[#8fa4b8]', badgeBg: 'bg-gray-100 text-gray-700' },
  1: { bg: 'bg-[#ffece4]', text: 'text-[#ea7349]', border: 'border-[#ea7349]', fill: 'bg-[#ea7349]', badgeBg: 'bg-[#ffece4] text-[#cf4f23] border border-[#ea7349]/40' },
  2: { bg: 'bg-[#fff6e6]', text: 'text-[#e5a13c]', border: 'border-[#e5a13c]', fill: 'bg-[#e5a13c]', badgeBg: 'bg-[#fff6e6] text-[#b87c24] border border-[#e5a13c]/40' },
  3: { bg: 'bg-[#eef6fc]', text: 'text-[#5b8fb9]', border: 'border-[#5b8fb9]', fill: 'bg-[#5b8fb9]', badgeBg: 'bg-[#eef6fc] text-[#3d759e] border border-[#5b8fb9]/40' },
  4: { bg: 'bg-[#f4efff]', text: 'text-[#8f7fb2]', border: 'border-[#8f7fb2]', fill: 'bg-[#8f7fb2]', badgeBg: 'bg-[#f4efff] text-[#715f94] border border-[#8f7fb2]/40' },
  5: { bg: 'bg-[#eaf4e8]', text: 'text-[#6e9b6a]', border: 'border-[#6e9b6a]', fill: 'bg-[#6e9b6a]', badgeBg: 'bg-[#eaf4e8] text-[#4f7d4b] border border-[#6e9b6a]/40' },
};

export function PageVocabulary() {
  const { openModal } = useModal();
  const { navigateTo } = useRoute();
  const {
    words,
    total,
    page,
    setPage,
    pageSize,
    search,
    handleSearchChange,
    clearSearch,
    levelFilter,
    handleLevelFilterChange,
    topicId,
    handleTopicFilterChange,
    topics,
    srsStats,
    loading,
    error,
    deleteWord,
    playWord,
    refresh,
  } = useVocabulary();

  const [selectedWordId, setSelectedWordId] = useState(null);

  // Sync selected word
  useEffect(() => {
    if (words && words.length > 0) {
      if (!selectedWordId || !words.some((w) => w.id === selectedWordId)) {
        setSelectedWordId(words[0].id);
      }
    } else {
      setSelectedWordId(null);
    }
  }, [words, selectedWordId]);

  const selectedWord = useMemo(() => {
    return words.find((w) => w.id === selectedWordId) || words[0] || null;
  }, [words, selectedWordId]);

  const memoryLevels = srsStats?.memoryLevels || { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 };
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;

  const maxLevelCount = Math.max(
    memoryLevels.lv0 || 0,
    memoryLevels.lv1 || 0,
    memoryLevels.lv2 || 0,
    memoryLevels.lv3 || 0,
    memoryLevels.lv4 || 0,
    memoryLevels.lv5 || 0,
    1
  );

  const getBarHeight = (count) => {
    if (!count || count === 0) return '8px';
    const percent = Math.min(100, Math.max(16, Math.round((count / maxLevelCount) * 100)));
    return `${percent}%`;
  };

  const getPagesToShow = () => {
    const pages = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)) {
        pages.push(p);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const formatExample = (sentence, targetWord) => {
    if (!sentence) return null;
    if (!targetWord) return sentence;
    const parts = sentence.split(new RegExp(`(${targetWord})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === targetWord.toLowerCase() ? (
        <strong key={i} className="text-[#ea7349] font-black underline decoration-wavy decoration-[#ea7349] not-italic">
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  return (
    <div id="page-vocabulary" className="page active min-h-screen text-[#37322f] bg-[#FAF5EB] font-['Quicksand',sans-serif]">

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (block lg:hidden) - 100% Match to mobile_vocabulary.html   */}
      {/* ========================================================================= */}
      <div className="block lg:hidden w-full max-w-[430px] mx-auto min-h-screen pb-28 px-4 pt-2 pwa-safe-top">
        {/* Title & Header Section */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-black tracking-tight text-[#4A3E39] font-['Quicksand',sans-serif]">
                Sổ từ cá nhân
              </h1>
              <span className="inline-block px-3 py-0.5 text-xs font-bold text-[#4A3E39] bg-[#E1EDDB] border border-[#8DAA68] rounded-full rotate-[-2deg] shadow-xs">
                Đã học
              </span>
            </div>
            <span className="text-2xl text-[#DF5C58] select-none rotate-12">❤️</span>
          </div>

          <p className="text-sm text-[#7D716A] font-medium leading-relaxed -mt-1">
            Sổ tay nhỏ xinh 🖍️ Tổng cộng <strong className="text-[#4A3E39] font-black text-base">{total}</strong> từ vựng bạn đã lưu trữ.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => openModal('addWord')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#443833] text-[#FAF5EB] rounded-2xl shadow-md active:scale-95 transition-transform text-sm font-bold cursor-pointer"
              type="button"
            >
              <span className="text-xl leading-none font-bold text-[#F7A738]">+</span>
              <span>Thêm từ vựng</span>
            </button>
            <button
              onClick={() => openModal('bulkAdd')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#EFE8D6] text-[#4A3E39] border-2 border-dashed border-[#8A796F] rounded-2xl shadow-xs active:scale-95 transition-transform text-sm font-bold cursor-pointer"
              type="button"
            >
              <svg className="w-4 h-4 text-[#4A3E39]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h16M18 9v6M15 12h6" />
              </svg>
              <span>Thêm hàng loạt</span>
            </button>
            <button
              aria-label="Cài đặt"
              onClick={() => navigateTo('settings')}
              className="w-10 h-10 flex items-center justify-center bg-[#E5DFCC] border-2 border-[#4A3E39] text-[#4A3E39] rounded-2xl shadow-xs active:scale-90 transition-transform cursor-pointer"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4"></circle>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 20v-1a6 6 0 0 1 12 0v1"></path>
              </svg>
            </button>
          </div>
        </section>

        {/* SRS Overview Card */}
        <section className="bg-[#FFFDF7] p-4 border-2 border-[#5B4C44] rounded-[24px] shadow-[3px_4px_0px_#443833] relative overflow-hidden mt-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#DECDBB]">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔄</span>
              <h2 className="text-xl font-bold text-[#4A3E39] tracking-wide">
                Tổng quan SRS
              </h2>
              <button
                onClick={() => openModal('srsExplainer')}
                className="w-5 h-5 rounded-full border border-[#7D716A] text-[#7D716A] text-xs flex items-center justify-center font-bold"
              >
                ?
              </button>
            </div>
            <button
              aria-label="Làm mới"
              onClick={refresh}
              className="text-[#7D716A] hover:text-[#4A3E39] transition-colors active:rotate-45"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v5h5"></path>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21v-5h-5"></path>
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between mt-3 mb-2">
            <span className="text-xs font-bold tracking-wider text-[#7D716A] uppercase">
              Phân bố từ vựng theo cấp độ
            </span>
            <span className="px-2.5 py-0.5 text-xs font-bold text-[#4A3E39] bg-[#EADDC7] rounded-full border border-dashed border-[#4A3E39]">
              {total} từ
            </span>
          </div>

          {/* 6 Crayon Bars */}
          <div className="pt-3 pb-1 flex items-end justify-between px-1 text-center">
            {[0, 1, 2, 3, 4, 5].map((lvl) => {
              const count = memoryLevels[`lv${lvl}`] || 0;
              const isSelected = levelFilter === lvl;
              const theme = LEVEL_COLORS[lvl];

              return (
                <div
                  key={lvl}
                  onClick={() => handleLevelFilterChange(isSelected ? null : lvl)}
                  className={`flex flex-col items-center flex-1 cursor-pointer transition-transform ${isSelected ? 'scale-105' : 'hover:scale-102'}`}
                >
                  <span className={`text-sm font-bold ${lvl === 1 ? 'text-[#F07D43]' : 'text-[#4A3E39]'}`}>
                    {count}
                  </span>
                  <div className="h-24 flex items-end justify-center w-full py-1">
                    <div
                      className={`w-5 rounded-full border-2 border-[#4A3E39] ${theme.fill} shadow-xs transition-all`}
                      style={{ height: getBarHeight(count) }}
                    />
                  </div>
                  <span className={`text-[11px] font-bold mt-1 ${isSelected ? 'text-[#F07D43] underline' : 'text-[#7D716A]'}`}>
                    Lvl {lvl}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Search & Filters Section */}
        <section className="space-y-3 pt-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-[#4A3E39]">
              Danh sách từ đang học <span className="text-sm font-medium text-[#7D716A]">({total} từ)</span>
            </h2>
            <span className="text-xs text-[#8DAA68] font-bold uppercase tracking-wider bg-[#E7F0DC] px-2.5 py-0.5 rounded-full border border-[#8DAA68]">
              Ôn tập hôm nay
            </span>
          </div>

          {/* Search Input */}
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-[#7D716A] pointer-events-none">
              <svg className="w-5 h-5 text-[#7D716A]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-[#FFFDF7] pl-10 pr-9 py-2.5 text-sm font-medium text-[#4A3E39] placeholder-[#9C8F85] border-2 border-[#4A3E39]/70 rounded-full focus:outline-none focus:border-[#4A3E39] shadow-inner"
              placeholder="Tìm kiếm từ vựng, nghĩa tiếng Việt..."
              type="text"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-3 text-xs text-[#7D716A] hover:text-[#4A3E39] font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Topic Selector Dropdown */}
          <div className="relative">
            <select
              value={topicId}
              onChange={(e) => handleTopicFilterChange(e.target.value)}
              className="w-full appearance-none bg-[#EFE9DA] border-2 border-[#7A6B63] px-3.5 py-2 rounded-2xl text-xs font-bold text-[#4A3E39] shadow-xs focus:outline-none cursor-pointer"
            >
              <option value="">📁 Tất cả chủ đề ({total} từ)</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon || '📁'} {t.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs text-[#4A3E39]">
              ▼
            </div>
          </div>

          {/* Filter Pills Scrollable */}
          <div className="flex items-center space-x-2 overflow-x-auto py-1 text-xs font-bold scrollbar-none">
            <button
              onClick={() => handleLevelFilterChange(null)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full border-2 border-[#443833] transition-all cursor-pointer ${
                levelFilter === null ? 'bg-[#443833] text-[#FAF5EB] shadow-xs' : 'bg-white text-[#4A3E39]'
              }`}
            >
              Tất cả ({total})
            </button>
            <button
              onClick={() => handleLevelFilterChange(levelFilter === -1 ? null : -1)}
              className={`shrink-0 px-3 py-1.5 rounded-full border-2 border-[#DF5C58] flex items-center gap-1 transition-all cursor-pointer ${
                levelFilter === -1 ? 'bg-[#DF5C58] text-white shadow-xs' : 'bg-[#F8E2DA] text-[#932C28]'
              }`}
            >
              <span>⏰ Cần ôn</span>
              <span className="bg-[#DF5C58] text-white px-1.5 py-0.2 rounded-full text-[10px]">
                {srsStats.due || 0}
              </span>
            </button>
            {[0, 1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleLevelFilterChange(levelFilter === lvl ? null : lvl)}
                className={`shrink-0 px-3 py-1.5 rounded-full border-2 transition-all cursor-pointer ${
                  levelFilter === lvl
                    ? 'border-[#443833] bg-[#443833] text-white shadow-xs'
                    : 'border-[#443833]/40 bg-white text-[#4A3E39]'
                }`}
              >
                Lvl {lvl} ({memoryLevels[`lv${lvl}`] || 0})
              </button>
            ))}
          </div>
        </section>

        {/* Word Cards List */}
        <section className="space-y-3.5 mt-4">
          {loading ? (
            <div className="py-12 text-center text-[#7D716A]">
              <span className="inline-block text-3xl animate-spin mb-2">🔄</span>
              <p className="text-sm font-bold">Đang tải danh sách từ vựng...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-center text-red-700 text-xs font-bold">
              {error}
            </div>
          ) : words.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-[#4A3E39] p-8 text-center shadow-xs">
              <span className="text-4xl block mb-2">📖</span>
              <h3 className="font-bold text-base text-[#4A3E39]">Chưa có từ vựng nào</h3>
              <p className="text-xs text-[#7D716A] mt-1 mb-4">
                Hãy thêm từ vựng mới hoặc chuyển sang chủ đề khác để học.
              </p>
              <button
                onClick={() => openModal('addWord')}
                className="px-4 py-2 bg-[#F07D43] text-white font-bold text-xs rounded-xl border border-[#4A3E39] shadow-xs active:scale-95"
              >
                + Thêm từ mới ngay
              </button>
            </div>
          ) : (
            words.map((w, index) => {
              const itemNum = startIndex + index + 1;
              const lvl = w.level || 0;
              const lvlTheme = LEVEL_COLORS[lvl] || LEVEL_COLORS[0];
              const intervalText = LEVEL_INTERVALS[lvl] || '1h';

              return (
                <article
                  key={w.id || index}
                  className="bg-[#FFFDF8] border-2 border-[#4A3E39] p-4 rounded-[22px] shadow-[2px_3px_0px_#443833] relative transition-transform"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#EFE8D6] border border-dashed border-[#4A3E39] text-[#4A3E39] font-bold text-xs">
                        {itemNum}
                      </span>
                      <h3 className="text-xl font-black text-[#4A3E39] tracking-wide">
                        {w.word}
                      </h3>
                      {w.phonetic && (
                        <span className="text-xs font-semibold text-[#7D716A]">
                          {w.phonetic}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${lvlTheme.badgeBg}`}>
                        {intervalText}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-[#4A3E39]">
                      <button
                        onClick={() => playWord(w.word)}
                        aria-label="Phát âm"
                        className="p-1 hover:text-[#F07D43] transition-colors cursor-pointer"
                        type="button"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                          <path strokeLinecap="round" d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteWord(w.id, w.word)}
                        aria-label="Xóa"
                        className="p-1 text-[#7D716A] hover:text-red-500 transition-colors cursor-pointer"
                        type="button"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-1 ml-8">
                    <p className="text-sm font-bold text-[#4A3E39]">
                      {w.meaning}
                    </p>
                  </div>

                  {w.exampleSentence && (
                    <div className="mt-2.5 ml-8 p-2.5 bg-[#F6F1E5] border border-dashed border-[#BDB0A3] rounded-xl text-xs relative">
                      <span className="text-[10px] font-bold text-[#F7A738] absolute -top-2 left-2.5 px-1 bg-[#FFFDF8] border border-[#DECDBB] rounded">
                        Ví dụ
                      </span>
                      <p className="italic text-[#594B43] leading-snug pt-0.5">
                        "{formatExample(w.exampleSentence, w.word)}"
                      </p>
                    </div>
                  )}
                </article>
              );
            })
          )}

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="pt-3 pb-6 flex items-center justify-between">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-2 rounded-xl bg-white border-2 border-[#4A3E39] font-bold text-xs shadow-xs disabled:opacity-40"
              >
                ← Trước
              </button>
              <span className="text-xs font-bold text-[#4A3E39]">
                Trang {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-2 rounded-xl bg-[#F07D43] text-white border-2 border-[#4A3E39] font-bold text-xs shadow-xs disabled:opacity-40"
              >
                Sau →
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (hidden lg:flex) - 100% Match to desktop_vocabulary.html  */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-col min-w-0 flex-1 lg:pl-64 xl:pl-72">
        {/* Top Header Bar */}
        <header className="px-8 pt-7 pb-4 bg-[#fffdf9] border-b-2 border-[#443c35] flex items-center justify-between sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-[#37322f] tracking-tight">Sổ từ cá nhân</h1>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-[#eaf4e8] text-[#4f7d4b] border-2 border-[#6e9b6a] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#6e9b6a]"></span>
                Đang hoạt động ({total} từ)
              </span>
              <span className="text-xs text-[#9c9182] font-bold">Lặp lại ngắt quãng SRS v2.4</span>
            </div>
            <p className="text-sm font-semibold text-[#766c5f] mt-1">
              Học bạ thông minh: Hệ thống tự động tính toán chu kỳ quên để nhắc bạn ôn tập đúng thời điểm vàng.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('topics')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#fff8ef] hover:bg-[#faebd7] text-[#37322f] text-sm font-black rounded-2xl border-2 border-[#443c35] shadow-[2px_2px_0px_#443c35] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              <span>📁</span>
              <span>Quản lý chủ đề</span>
            </button>
            <button
              onClick={() => openModal('bulkAdd')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#fff8ef] hover:bg-[#faebd7] text-[#37322f] text-sm font-black rounded-2xl border-2 border-[#443c35] shadow-[2px_2px_0px_#443c35] active:scale-95 transition-all cursor-pointer"
            >
              <span>📋</span>
              <span>Thêm hàng loạt</span>
            </button>
            <button
              onClick={() => openModal('addWord')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#ea7349] hover:bg-[#d96237] text-white text-sm font-black rounded-2xl border-2 border-[#443c35] shadow-[3px_4px_0px_#443c35] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              <span className="text-lg leading-none">+</span>
              <span>Thêm từ mới</span>
            </button>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-8 space-y-6 max-w-[1440px] w-full mx-auto">
          {/* SRS Stats Banner */}
          <section className="bg-[#fffcf7] rounded-3xl border-2 border-[#443c35] p-6 shadow-[3px_4px_0px_#443c35]">
            <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
              {/* Left: SRS Level Distribution Chart */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-dashed border-[#e6decb]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#5b8fb9] text-white flex items-center justify-center font-black text-sm border-2 border-[#443c35]">
                      🔄
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#37322f]">Tổng quan phân bổ trí nhớ SRS</h2>
                      <p className="text-xs text-[#807669] font-bold">6 cấp độ trí nhớ từ ngắn hạn đến ghi nhớ vĩnh viễn</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={refresh}
                      className="p-2 rounded-xl text-[#7c7264] hover:bg-[#faefe0] border border-transparent hover:border-[#443c35] transition-all cursor-pointer"
                      title="Làm mới trạng thái"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => openModal('srsExplainer')}
                      className="p-2 rounded-xl text-[#7c7264] hover:bg-[#faefe0] border border-transparent hover:border-[#443c35] transition-all cursor-pointer"
                      title="Xem giải thích thuật toán"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"></circle>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 6 Crayon Bars Grid */}
                <div className="grid grid-cols-6 gap-3 items-end pt-2 text-center select-none">
                  {[0, 1, 2, 3, 4, 5].map((lvl) => {
                    const count = memoryLevels[`lv${lvl}`] || 0;
                    const isSelected = levelFilter === lvl;
                    const theme = LEVEL_COLORS[lvl];
                    const isDominant = count > 0 && count === maxLevelCount;

                    return (
                      <div
                        key={lvl}
                        onClick={() => handleLevelFilterChange(isSelected ? null : lvl)}
                        className={`flex flex-col items-center gap-2 cursor-pointer transition-transform ${isSelected ? 'scale-105' : 'hover:scale-102'}`}
                      >
                        <span className={`text-base font-black ${isDominant ? 'text-[#ea7349] animate-bounce' : 'text-[#7a7267]'}`}>
                          {count}
                        </span>
                        <div className={`w-full max-w-[54px] h-28 rounded-2xl border-2 p-1.5 flex flex-col justify-end ${
                          isSelected || isDominant ? 'bg-[#ffece4] border-[#443c35] shadow-[2px_2px_0px_#443c35]' : 'bg-[#f5ede2] border-dashed border-[#d8c8b4]'
                        }`}>
                          <div
                            className={`w-full rounded-xl transition-all duration-500 ${theme.fill}`}
                            style={{ height: getBarHeight(count) }}
                          />
                        </div>
                        <div className="text-xs font-black text-[#443c35]">
                          <span className={`block ${isSelected ? 'text-[#ea7349] font-black underline' : ''}`}>Lvl {lvl}</span>
                          <span className="text-[10px] text-[#938777] font-semibold">{LEVEL_INTERVALS[lvl]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Mascot Reminder Box */}
              <div className="lg:w-[380px] bg-[#faf3e8] border-2 border-[#443c35] rounded-2xl p-4 flex flex-col justify-between shadow-[2px_2px_0px_#443c35] relative overflow-hidden">
                <div className="flex items-start gap-4">
                  <img
                    alt="Churbito Mascot"
                    src="/mascot/mascot_cozy.png"
                    className="w-24 h-24 object-contain shrink-0 mix-blend-multiply drop-shadow-xs -mt-1"
                  />
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#ffefe8] text-[#d6572a] border border-[#ea7349]/40 text-[10px] font-black uppercase tracking-wider mb-1">
                      Bé Hổ Đồng Hành
                    </span>
                    <h3 className="font-black text-sm text-[#37322f] leading-snug">
                      {srsStats.due > 0 ? `Có ${srsStats.due} từ đến hạn ôn tập!` : 'Hôm nay bạn học rất chăm chỉ! 🐾'}
                    </h3>
                    <p className="text-xs text-[#6e6354] mt-1 font-semibold leading-relaxed">
                      Luyện tập 10 phút ngắt quãng mỗi ngày sẽ giúp từ vựng khắc sâu vào trí nhớ dài hạn vĩnh viễn.
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#e2d5c3] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#857766]">Ước tính: ~5 phút</span>
                  <button
                    onClick={() => navigateTo('learning')}
                    className="px-4 py-2 bg-[#6e9b6a] hover:bg-[#5f875b] text-white text-xs font-black rounded-xl border-2 border-[#443c35] shadow-[2px_2px_0px_#443c35] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                  >
                    Ôn tập ngay ⚡
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Filter & Search Bar */}
          <section className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1 w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-base pointer-events-none">
                  🔍
                </span>
                <input
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Tìm kiếm từ vựng, phiên âm IPA, nghĩa tiếng Việt..."
                  className="w-full pl-11 pr-10 py-3 bg-[#fffcf7] rounded-2xl border-2 border-[#443c35] text-sm font-bold text-[#37322f] placeholder-[#a69c8f] focus:outline-none focus:ring-2 focus:ring-[#ea7349] shadow-[2px_2px_0px_#443c35]"
                  type="text"
                />
                {search && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs text-[#7a7267] hover:text-[#37322f] font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Topic Filter Dropdown */}
              <div className="relative w-full sm:w-auto min-w-[260px]">
                <select
                  value={topicId}
                  onChange={(e) => handleTopicFilterChange(e.target.value)}
                  className="w-full appearance-none bg-[#fffcf7] border-2 border-[#443c35] rounded-2xl px-4 py-3 pr-10 text-sm font-black text-[#37322f] shadow-[2px_2px_0px_#443c35] cursor-pointer focus:outline-none"
                >
                  <option value="">📁 Tất cả chủ đề ({total} từ)</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.icon || '📁'} {t.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-xs font-black">
                  ▼
                </div>
              </div>
            </div>

            {/* Filter Badges Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs select-none">
              <button
                onClick={() => handleLevelFilterChange(null)}
                className={`px-4 py-2 rounded-xl font-black border-2 border-[#443c35] shadow-[2px_2px_0px_#443c35] cursor-pointer transition-all ${
                  levelFilter === null ? 'bg-[#443833] text-white' : 'bg-white text-[#37322f] hover:bg-[#fff9f0]'
                }`}
              >
                Tất cả ({total})
              </button>
              <button
                onClick={() => handleLevelFilterChange(levelFilter === -1 ? null : -1)}
                className={`px-4 py-2 rounded-xl font-black border-2 border-[#ea7349] flex items-center gap-1.5 shadow-[2px_2px_0px_#443c35] cursor-pointer transition-all ${
                  levelFilter === -1 ? 'bg-[#ea7349] text-white' : 'bg-[#ffede5] text-[#d6572a] hover:bg-[#ffd9cb]'
                }`}
              >
                <span>⏰ Cần ôn gấp</span>
                <span className="bg-[#ea7349] text-white px-1.5 py-0.2 rounded-full text-[10px]">
                  {srsStats.due || 0}
                </span>
              </button>
              {[0, 1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => handleLevelFilterChange(levelFilter === lvl ? null : lvl)}
                  className={`px-3.5 py-2 rounded-xl font-black border-2 cursor-pointer transition-all ${
                    levelFilter === lvl
                      ? 'border-[#443c35] bg-[#443c35] text-white shadow-[2px_2px_0px_#443c35]'
                      : 'border-[#d9ccbe] bg-[#fffdf9] text-[#695f52] hover:bg-[#faefe2]'
                  }`}
                >
                  Lvl {lvl} ({memoryLevels[`lv${lvl}`] || 0})
                </button>
              ))}
            </div>
          </section>

          {/* Master-Detail 12-Column Grid */}
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start pb-12">
            {/* Left Column: Words List (7 cols) */}
            <div className="xl:col-span-7 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-base font-black text-[#443c35] flex items-center gap-2">
                  <span>Danh sách từ đang học</span>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 bg-[#eaf4e8] text-[#558451] rounded-full border border-[#6e9b6a]">
                    SRS V2.4
                  </span>
                </h3>
                <span className="text-xs text-[#8a7f71] font-bold">
                  Hiển thị {words.length > 0 ? startIndex + 1 : 0} - {Math.min(total, startIndex + pageSize)} trong {total} từ
                </span>
              </div>

              {loading ? (
                <div className="py-16 text-center text-[#7a7267] bg-white rounded-3xl border-2 border-[#443c35]">
                  <span className="inline-block text-3xl animate-spin mb-2">🔄</span>
                  <p className="text-sm font-bold">Đang tải danh sách từ vựng...</p>
                </div>
              ) : words.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border-2 border-[#443c35] shadow-[3px_4px_0px_#443c35]">
                  <span className="text-5xl block mb-3">📖</span>
                  <h4 className="text-lg font-black text-[#37322f]">Không tìm thấy từ vựng nào</h4>
                  <p className="text-xs text-[#766c5f] mt-1 mb-4">
                    Thử thay đổi từ khóa tìm kiếm hoặc lọc theo cấp độ khác nhé.
                  </p>
                  <button
                    onClick={() => openModal('addWord')}
                    className="px-5 py-2.5 bg-[#ea7349] text-white font-bold text-sm rounded-xl border-2 border-[#443c35] shadow-[2px_2px_0px_#443c35]"
                  >
                    + Thêm từ mới ngay
                  </button>
                </div>
              ) : (
                words.map((w, index) => {
                  const itemNum = startIndex + index + 1;
                  const isSelected = selectedWord?.id === w.id;
                  const lvl = w.level || 0;
                  const lvlTheme = LEVEL_COLORS[lvl] || LEVEL_COLORS[0];
                  const intervalText = LEVEL_INTERVALS[lvl] || '1h';

                  return (
                    <article
                      key={w.id || index}
                      onClick={() => setSelectedWordId(w.id)}
                      className={`p-5 rounded-3xl border-2 border-[#443c35] relative transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#fffdfa] shadow-[4px_6px_0px_#443c35] ring-2 ring-[#ea7349]'
                          : 'bg-[#fffdfa] hover:bg-[#fff9f1] shadow-[2px_2px_0px_#443c35] hover:shadow-[3px_4px_0px_#443c35]'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-3 right-6 bg-[#ea7349] text-white text-[11px] font-black px-3 py-0.5 rounded-full border-2 border-[#443c35] shadow-xs">
                          Đang chọn xem
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5">
                          <div className={`w-9 h-9 rounded-2xl border-2 border-dashed flex items-center justify-center font-black text-sm shrink-0 mt-0.5 ${
                            isSelected ? 'bg-[#fff4eb] border-[#ea7349] text-[#ea7349]' : 'bg-[#f8f1e7] border-[#b8ab9a] text-[#665b4f]'
                          }`}>
                            {itemNum}
                          </div>
                          <div>
                            <div className="flex items-baseline gap-2.5 flex-wrap">
                              <h4 className="text-2xl font-black text-[#37322f] tracking-tight">{w.word}</h4>
                              {w.phonetic && (
                                <span className="text-sm font-bold text-[#71695d] font-mono">{w.phonetic}</span>
                              )}
                              {w.pos && (
                                <span className="text-xs font-black text-[#6e9b6a] bg-[#eaf4e8] px-2 py-0.5 rounded-md">
                                  {w.pos}
                                </span>
                              )}
                            </div>
                            <div className="text-base font-extrabold text-[#3a342c] mt-1">
                              {w.meaning}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 ${lvlTheme.badgeBg}`}>
                            <span>⏰</span> {intervalText}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playWord(w.word);
                            }}
                            className="p-2 rounded-xl bg-[#f7efe3] hover:bg-[#eee2d1] border border-[#443c35] text-[#37322f] transition-colors cursor-pointer"
                            title="Phát âm"
                          >
                            🔊
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWord(w.id, w.word);
                            }}
                            className="p-2 rounded-xl text-[#a89b8c] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa từ"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {w.exampleSentence && (
                        <div className="mt-4 p-3.5 bg-[#fbf5ec] rounded-2xl border-2 border-dashed border-[#d8c8b4] relative">
                          <span className="absolute -top-2.5 left-4 bg-[#edd8be] text-[#695642] text-[10px] font-black px-2 py-0.2 rounded border border-[#cbbb9f]">
                            Ví dụ
                          </span>
                          <p className="text-sm font-semibold text-[#4f473c] italic leading-relaxed pt-0.5">
                            "{formatExample(w.exampleSentence, w.word)}"
                          </p>
                        </div>
                      )}
                    </article>
                  );
                })
              )}

              {/* Desktop Pagination */}
              {totalPages > 1 && (
                <div className="pt-4 flex items-center justify-between">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 rounded-xl bg-[#f8f2e7] hover:bg-[#efe5d5] border-2 border-[#443c35] font-black text-xs shadow-[2px_2px_0px_#443c35] disabled:opacity-40 cursor-pointer"
                  >
                    ← Trang trước
                  </button>
                  <div className="flex items-center gap-1 text-xs font-black">
                    {getPagesToShow().map((pNum, idx) =>
                      pNum === '...' ? (
                        <span key={idx} className="px-2 text-[#766c5f]">...</span>
                      ) : (
                        <button
                          key={idx}
                          onClick={() => setPage(pNum)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                            page === pNum
                              ? 'bg-[#443c35] text-white shadow-xs'
                              : 'bg-[#fffdfa] hover:bg-[#f6ede0] border border-[#443c35]'
                          }`}
                        >
                          {pNum}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 rounded-xl bg-[#ea7349] hover:bg-[#d96237] text-white border-2 border-[#443c35] font-black text-xs shadow-[2px_2px_0px_#443c35] disabled:opacity-40 cursor-pointer"
                  >
                    Trang tiếp theo →
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Detailed Flashcard Inspector (5 cols) */}
            <aside className="xl:col-span-5 sticky top-28 space-y-5">
              {selectedWord ? (
                <div className="bg-[#fffdf9] rounded-3xl border-2 border-[#443c35] p-6 shadow-[3px_4px_0px_#443c35] relative overflow-hidden">
                  <div className="flex items-center justify-between pb-4 border-b-2 border-dashed border-[#e6decb]">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔍</span>
                      <span className="text-xs font-black uppercase text-[#73685a] tracking-wider">
                        Chi Tiết Từ Vựng &amp; Flashcard
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#fdecd2] text-[#b35e00] text-xs font-extrabold border border-[#d97706]/30">
                      Cấp độ SRS: Lvl {selectedWord.level || 0}
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-4xl font-black text-[#37322f] tracking-tight">
                          {selectedWord.word}
                        </h3>
                        <div className="text-sm font-bold text-[#6d6458] mt-1 flex items-center gap-2 font-mono">
                          {selectedWord.phonetic && <span>{selectedWord.phonetic}</span>}
                          {selectedWord.pos && (
                            <span className="text-xs font-black font-sans px-2 py-0.5 rounded bg-[#eaf4e8] text-[#558451]">
                              {selectedWord.pos}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => playWord(selectedWord.word)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#ea7349] hover:text-white border-2 border-[#443c35] text-xs font-black transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <span>🔊 Phát âm</span>
                      </button>
                    </div>

                    {/* Vietnamese Definition */}
                    <div className="mt-4 p-4 bg-[#fff8ef] rounded-2xl border-2 border-[#eedac3]">
                      <div className="text-xs font-black uppercase text-[#ea7349] tracking-wider mb-1">
                        Nghĩa tiếng Việt
                      </div>
                      <p className="text-lg font-black text-[#37322f] leading-snug">
                        {selectedWord.meaning}
                      </p>
                    </div>

                    {/* Example Sentence */}
                    {selectedWord.exampleSentence && (
                      <div className="mt-4 p-4 bg-[#fbf5ec] rounded-2xl border-2 border-dashed border-[#d8c8b4]">
                        <div className="text-xs font-black uppercase text-[#73685a] tracking-wider mb-1">
                          Ví dụ ngữ cảnh
                        </div>
                        <p className="text-sm font-semibold text-[#4f473c] italic leading-relaxed">
                          "{formatExample(selectedWord.exampleSentence, selectedWord.word)}"
                        </p>
                      </div>
                    )}

                    {/* Topic metadata */}
                    {selectedWord.topicName && (
                      <div className="mt-4 flex items-center justify-between text-xs text-[#766c5f] font-bold">
                        <span>Chủ đề thuộc về:</span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#EFE9DA] border border-[#7A6B63]/40 text-[#4A3E39]">
                          {selectedWord.topicName}
                        </span>
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-[#e6decb] flex items-center justify-between">
                      <button
                        onClick={() => deleteWord(selectedWord.id, selectedWord.word)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-300 transition-all cursor-pointer"
                      >
                        🗑️ Xóa từ này
                      </button>
                      <button
                        onClick={() => navigateTo('learning')}
                        className="px-5 py-2.5 bg-[#ea7349] hover:bg-[#d96237] text-white font-bold text-xs rounded-xl border-2 border-[#443c35] shadow-[2px_2px_0px_#443c35] active:translate-y-0.5 cursor-pointer"
                      >
                        Luyện tập ngay ⚡
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#fffdf9] rounded-3xl border-2 border-[#443c35] p-6 shadow-[3px_4px_0px_#443c35] text-center text-[#766c5f]">
                  <p className="text-sm font-bold">Chọn một từ bên danh sách để xem chi tiết.</p>
                </div>
              )}
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
}
export default PageVocabulary;
