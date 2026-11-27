// src/components/pages/PageVocabulary.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  RotateCcw,
  Volume2,
  Trash2,
  Search,
  Folder,
  BookOpen,
  Plus,
  Clock,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useVocabulary } from '../../hooks/useVocabulary.js';
import { useModal } from '../../context/ModalContext.jsx';
import { useRoute } from '../../router/RouteContext.jsx';
import { useAuth } from '../../providers/AuthProvider.jsx';

const LEVEL_INTERVALS = {
  0: 'Mới thêm',
  1: '< 2.5 ngày',
  2: '2.5–6 ngày',
  3: '6–15 ngày',
  4: '15–30 ngày',
  5: '≥ 30 ngày',
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
  const { user } = useAuth();
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

  const handleOpenAddWord = () => {
    if (!user) {
      openModal('requireLogin', {
        title: 'Đăng nhập để thêm từ vựng',
        message: 'Bạn cần đăng nhập tài khoản để thêm và lưu từ vựng vào sổ từ cá nhân nhé!',
        actionName: 'thêm từ vựng',
      });
      return;
    }
    openModal('addWord');
  };

  const handleOpenBulkAdd = () => {
    if (!user) {
      openModal('requireLogin', {
        title: 'Đăng nhập để thêm từ hàng loạt',
        message: 'Bạn cần đăng nhập tài khoản để nhập danh sách nhiều từ vựng cùng lúc nhé!',
        actionName: 'thêm từ hàng loạt',
      });
      return;
    }
    openModal('bulkAdd');
  };

  const handleStartReview = () => {
    if (!user) {
      openModal('requireLogin', {
        title: 'Đăng nhập để ôn tập SRS',
        message: 'Bạn cần đăng nhập tài khoản để ôn tập từ vựng theo chu kỳ ngắt quãng và ghi nhận điểm số nhé!',
        actionName: 'ôn tập SRS',
      });
      return;
    }
    if (typeof window !== 'undefined') {
      window._currentLessonWords = null;
      window._currentSessionWords = null;
      window._currentTopicId = null;
      window._currentPassageId = null;
      window._currentLessonIndex = null;
      window._practiceMode = null;
      try {
        sessionStorage.removeItem('hivocab_study_session_config');
      } catch (_) {}
    }
    openModal('reviewLauncher', { wordsDueCount: srsStats?.due || 0 });
  };

  const [selectedWordId, setSelectedWordId] = useState(null);
  const [showSrsStrip, setShowSrsStrip] = useState(true);
  const desktopSearchRef = useRef(null);

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

  // Operate-mode keyboard shortcuts: ↑/↓ to browse words, P to pronounce, / to focus search
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '/' && desktopSearchRef.current) {
        e.preventDefault();
        desktopSearchRef.current.focus();
        return;
      }

      if (!words || words.length === 0) return;
      const currentIdx = words.findIndex((w) => w.id === selectedWord?.id);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextWord = words[Math.min(words.length - 1, currentIdx + 1)];
        if (nextWord) setSelectedWordId(nextWord.id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevWord = words[Math.max(0, currentIdx - 1)];
        if (prevWord) setSelectedWordId(prevWord.id);
      } else if ((e.key === 'p' || e.key === 'P') && selectedWord?.word) {
        e.preventDefault();
        playWord(selectedWord.word);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [words, selectedWord, playWord]);

  const memoryLevels = srsStats?.memoryLevels || { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 };
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const hasActiveFilters = Boolean(search || levelFilter !== null || topicId);

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

  const handleResetFilters = () => {
    if (search) clearSearch();
    if (levelFilter !== null) handleLevelFilterChange(null);
    if (topicId) handleTopicFilterChange('');
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-2xl font-black tracking-tight text-[#382E2B] font-['Quicksand',sans-serif] truncate">
                Sổ từ cá nhân
              </h1>
              <span className="inline-block px-2.5 py-0.5 text-[11px] font-extrabold text-[#35523B] bg-[#EAF3EB] border border-[#4D6B53]/50 rounded-full tabular-nums shrink-0">
                {total} từ
              </span>
            </div>
            <button
              type="button"
              onClick={handleStartReview}
              className="px-3 py-1.5 rounded-xl bg-[#4D6B53] hover:bg-[#3F5944] text-white text-xs font-extrabold border-2 border-[#382E2B] shadow-[1.5px_2px_0px_#382E2B] active:scale-95 transition-all cursor-pointer shrink-0 whitespace-nowrap"
            >
              Ôn tập ({srsStats.due || 0})
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={handleOpenAddWord}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#D95D39] hover:bg-[#BF4D2C] text-white rounded-2xl border-2 border-[#382E2B] shadow-[2px_2.5px_0px_#382E2B] active:scale-95 transition-transform text-sm font-extrabold cursor-pointer"
              type="button"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Thêm từ mới</span>
            </button>
            <button
              onClick={handleOpenBulkAdd}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#FFFDF9] text-[#382E2B] border-2 border-[#382E2B] rounded-2xl shadow-[2px_2.5px_0px_#382E2B] active:scale-95 transition-transform text-sm font-extrabold cursor-pointer"
              type="button"
            >
              <Layers className="w-4 h-4 text-[#382E2B] shrink-0" />
              <span>Thêm hàng loạt</span>
            </button>
            <button
              aria-label="Cài đặt"
              onClick={() => navigateTo('settings')}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-[#FAF5EB] border-2 border-[#382E2B] text-[#382E2B] rounded-2xl shadow-[1.5px_2px_0px_#382E2B] active:scale-90 transition-transform cursor-pointer"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4"></circle>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 20v-1a6 6 0 0 1 12 0v1"></path>
              </svg>
            </button>
          </div>
        </section>

        {/* SRS Overview Card (Unified FSRS-6 SrsLevelChart — zero bounce) */}
        <section className="bg-[#FFFDF9] p-4 border-2 border-[#382E2B] rounded-[24px] shadow-[3px_4px_0px_#382E2B] relative overflow-hidden mt-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-dashed border-[#E3D7C5]">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#4D6B53] shrink-0" />
              <h2 className="text-base font-extrabold text-[#382E2B] tracking-tight">
                Phân bổ FSRS-6
              </h2>
              <button
                type="button"
                onClick={() => openModal('srsExplainer')}
                aria-label="Tìm hiểu thuật toán FSRS-6"
                className="w-5 h-5 rounded-full border border-[#6E6259] text-[#6E6259] text-xs flex items-center justify-center font-bold cursor-pointer"
              >
                ?
              </button>
            </div>
            <button
              aria-label="Làm mới trạng thái"
              onClick={refresh}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-[#6E6259] hover:text-[#382E2B] hover:bg-[#FAF5EB] transition-colors cursor-pointer"
              type="button"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* 6 Crayon Bars (Classic Design) */}
          <div className="pt-3 pb-1 flex items-end justify-between px-1 text-center">
            {[0, 1, 2, 3, 4, 5].map((lvl) => {
              const count = memoryLevels[`lv${lvl}`] || 0;
              const isSelected = levelFilter === lvl;
              const theme = LEVEL_COLORS[lvl];

              return (
                <div
                  key={lvl}
                  onClick={() => handleLevelFilterChange(isSelected ? null : lvl)}
                  className={`flex flex-col items-center flex-1 cursor-pointer transition-transform active:scale-95 ${
                    isSelected ? 'scale-105' : 'hover:scale-102'
                  }`}
                >
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      isSelected ? 'text-[#D95D39]' : 'text-[#382E2B]'
                    }`}
                  >
                    {count}
                  </span>
                  <div className="h-24 flex items-end justify-center w-full py-1">
                    <div
                      className={`w-5 rounded-full border-2 border-[#382E2B] ${theme.fill} shadow-xs transition-all`}
                      style={{ height: getBarHeight(count) }}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-bold mt-1 ${
                      isSelected ? 'text-[#D95D39] underline' : 'text-[#6E6259]'
                    }`}
                  >
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
                <X className="w-3.5 h-3.5" />
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
              <option value="">Tất cả chủ đề ({total} từ)</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
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
              <Clock className="w-3 h-3 text-[#DF5C58]" />
              <span>Cần ôn</span>
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
              <RotateCcw className="w-8 h-8 text-[#5b8fb9] animate-spin mb-2 mx-auto" />
              <p className="text-sm font-bold">Đang tải danh sách từ vựng...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-center text-red-700 text-xs font-bold">
              {error}
            </div>
          ) : !user && words.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-[#4A3E39] p-6 text-center shadow-xs space-y-3">
              <BookOpen className="w-12 h-12 text-[#4A3E39] mx-auto mb-2" />
              <h3 className="font-bold text-base text-[#4A3E39]">Chào mừng bạn đến với Sổ từ cá nhân!</h3>
              <p className="text-xs text-[#7D716A] leading-relaxed">
                Bạn đang xem ở chế độ Khách. Hãy đăng nhập hoặc tạo tài khoản miễn phí để bắt đầu lưu từ, theo dõi các cấp độ ghi nhớ SRS và không bao giờ quên từ vựng!
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => navigateTo('login')}
                  className="w-full py-2.5 px-4 bg-[#382E2B] text-white text-xs font-black rounded-xl border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') window._initialAuthMode = 'signup';
                    navigateTo('login');
                  }}
                  className="w-full py-2.5 px-4 bg-[#D36135] text-white text-xs font-black rounded-xl border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer"
                >
                  Đăng ký tài khoản (Miễn phí)
                </button>
              </div>
            </div>
          ) : words.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-[#4A3E39] p-8 text-center shadow-xs">
              <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-2" />
              <h3 className="font-bold text-base text-[#4A3E39]">Chưa có từ vựng nào</h3>
              <p className="text-xs text-[#7D716A] mt-1 mb-4">
                Hãy thêm từ vựng mới hoặc chuyển sang chủ đề khác để học.
              </p>
              <button
                onClick={handleOpenAddWord}
                className="px-4 py-2 bg-[#F07D43] text-white font-bold text-xs rounded-xl border border-[#4A3E39] shadow-xs active:scale-95 cursor-pointer"
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

                    <div className="flex items-center gap-2 shrink-0 text-[#4A3E39]">
                      <button
                        onClick={() => playWord(w.word)}
                        aria-label={`Phát âm từ ${w.word}`}
                        className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#F6EFE3] hover:bg-[#EFE5D5] border border-[#4A3E39]/20 text-[#4A3E39] hover:text-[#F07D43] flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-xs"
                        type="button"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                          <path strokeLinecap="round" d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteWord(w.id, w.word)}
                        aria-label={`Xóa từ ${w.word}`}
                        className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl text-[#9C8F85] hover:text-red-500 hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center cursor-pointer ml-1"
                        type="button"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-1 ml-8 space-y-1">
                    <p className="text-sm font-bold text-[#4A3E39]">
                      {w.meaning}
                    </p>
                    {(w.englishMeaning || w.english_meaning) && (
                      <div className="flex items-start gap-1.5 text-xs text-[#68594D] font-medium leading-relaxed">
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-[#eaf4e8] border border-[#6e9b6a]/50 text-[#558451] font-black text-[10px] shrink-0 mt-0.5">
                          EN
                        </span>
                        <span>{w.englishMeaning || w.english_meaning}</span>
                      </div>
                    )}
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
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border-2 border-[#4A3E39] font-bold text-xs shadow-xs disabled:opacity-40 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
              >
                ← Trước
              </button>
              <span className="text-xs font-bold text-[#4A3E39]">
                Trang {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F07D43] text-white border-2 border-[#4A3E39] font-bold text-xs shadow-xs disabled:opacity-40 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
              >
                Sau →
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (hidden lg:flex) — Compact Above-the-Fold Operate Workspace */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-col min-w-0 flex-1 lg:pl-[var(--sidebar-w,244px)]">
        {/* Content Container */}
        <div className="p-5 xl:p-6 space-y-4 max-w-[1440px] w-full mx-auto">
          {/* Unified Top Command Bar */}
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <h1 className="text-xl xl:text-2xl font-black text-[#382E2B] tracking-tight">
                Sổ từ cá nhân
              </h1>
              <span className="text-xs font-extrabold px-2.5 py-0.5 bg-[#EAF3EB] text-[#35523B] rounded-full border border-[#4D6B53]/50 tabular-nums">
                FSRS-6 · {total.toLocaleString('vi-VN')} từ
              </span>
              <button
                type="button"
                onClick={() => setShowSrsStrip((prev) => !prev)}
                className="text-xs font-bold text-[#6E6259] hover:text-[#382E2B] inline-flex items-center gap-1 px-2.5 py-1 rounded-xl hover:bg-[#F2E9DA] transition-colors cursor-pointer"
              >
                <span>{showSrsStrip ? 'Thu gọn biểu đồ' : 'Hiện biểu đồ FSRS-6'}</span>
                {showSrsStrip ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigateTo('topics')}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#FFFDF9] hover:bg-[#FAF5EB] text-[#382E2B] text-xs font-extrabold rounded-xl border-2 border-[#382E2B] shadow-[1.5px_2px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Chủ đề</span>
              </button>
              <button
                type="button"
                onClick={handleOpenBulkAdd}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#FFFDF9] hover:bg-[#FAF5EB] text-[#382E2B] text-xs font-extrabold rounded-xl border-2 border-[#382E2B] shadow-[1.5px_2px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Thêm hàng loạt</span>
              </button>
              <button
                type="button"
                onClick={handleStartReview}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#4D6B53] hover:bg-[#3F5944] text-white text-xs font-extrabold rounded-xl border-2 border-[#382E2B] shadow-[2px_2.5px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap tabular-nums"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ôn tập ({srsStats.due || 0})</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddWord}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D95D39] hover:bg-[#BF4D2C] text-white text-xs font-extrabold rounded-xl border-2 border-[#382E2B] shadow-[2px_2.5px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm từ mới</span>
              </button>
            </div>
          </header>

          {/* Compact Collapsible FSRS-6 Strip (Classic Bar Design) */}
          {showSrsStrip && (
            <section className="bg-[#FFFDF9] rounded-2xl border-2 border-[#382E2B] p-4 shadow-[2px_3px_0px_#382E2B]">
              <div className="flex flex-col xl:flex-row items-stretch justify-between gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-dashed border-[#E3D7C5]">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 text-[#5b8fb9] shrink-0" />
                      <div>
                        <h2 className="text-base font-black text-[#382E2B]">
                          Tổng quan phân bổ trí nhớ FSRS-6
                        </h2>
                        <p className="text-xs text-[#6E6259] font-semibold">
                          Nhấn vào từng cột để lọc nhanh theo cấp độ ghi nhớ
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={refresh}
                        className="p-1.5 rounded-lg text-[#6E6259] hover:bg-[#FAF5EB] hover:text-[#382E2B] transition-colors cursor-pointer"
                        title="Làm mới dữ liệu"
                        aria-label="Làm mới dữ liệu"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal('srsExplainer')}
                        className="w-6 h-6 rounded-full border border-[#6E6259] text-[#6E6259] hover:bg-[#FAF5EB] hover:text-[#382E2B] text-xs font-bold flex items-center justify-center cursor-pointer"
                        title="Giải thích thuật toán FSRS-6"
                        aria-label="Giải thích thuật toán FSRS-6"
                      >
                        ?
                      </button>
                    </div>
                  </div>

                  {/* 6 Classic Crayon Bars Grid */}
                  <div className="grid grid-cols-6 gap-3 items-end pt-1 text-center select-none">
                    {[0, 1, 2, 3, 4, 5].map((lvl) => {
                      const count = memoryLevels[`lv${lvl}`] || 0;
                      const isSelected = levelFilter === lvl;
                      const theme = LEVEL_COLORS[lvl];

                      return (
                        <div
                          key={lvl}
                          onClick={() => handleLevelFilterChange(isSelected ? null : lvl)}
                          className={`flex flex-col items-center gap-1.5 cursor-pointer transition-transform active:scale-95 ${
                            isSelected ? 'scale-105' : 'hover:scale-102'
                          }`}
                          title={`Lọc từ vựng cấp độ ${lvl}`}
                        >
                          <span
                            className={`text-sm font-black tabular-nums ${
                              isSelected ? 'text-[#D95D39]' : 'text-[#6E6259]'
                            }`}
                          >
                            {count}
                          </span>
                          <div
                            className={`w-full max-w-[54px] h-24 rounded-2xl border-2 p-1.5 flex flex-col justify-end ${
                              isSelected
                                ? 'bg-[#FCECE7] border-[#382E2B] shadow-[2px_2px_0px_#382E2B]'
                                : 'bg-[#F5EDE2] border-dashed border-[#D8C8B4]'
                            }`}
                          >
                            <div
                              className={`w-full rounded-xl transition-all duration-300 ${theme.fill}`}
                              style={{ height: getBarHeight(count) }}
                            />
                          </div>
                          <div className="text-xs font-black text-[#382E2B]">
                            <span
                              className={`block ${
                                isSelected ? 'text-[#D95D39] font-black underline' : ''
                              }`}
                            >
                              Lvl {lvl}
                            </span>
                            <span className="text-[10px] text-[#6E6259] font-semibold">
                              {LEVEL_INTERVALS[lvl]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Compact Mascot Review Card */}
                <div className="xl:w-[320px] bg-[#FAF5EB] border border-[#E3D7C5] rounded-xl p-3.5 flex items-center gap-3 shrink-0">
                  <img
                    alt="Bé Hổ Churbito"
                    src="/mascot/mascot_cozy.png"
                    className="w-16 h-16 object-contain shrink-0 mix-blend-multiply"
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <h3 className="font-extrabold text-sm text-[#382E2B] leading-snug tabular-nums">
                      {srsStats.due > 0
                        ? `Có ${srsStats.due} từ đến hạn ôn`
                        : 'Bạn đã ôn hết từ hôm nay!'}
                    </h3>
                    <p className="text-[11px] text-[#6E6259] font-semibold leading-snug">
                      Ôn ngắn 5 phút mỗi ngày giúp ổn định trí nhớ dài hạn.
                    </p>
                    <button
                      type="button"
                      onClick={handleStartReview}
                      className="px-3 py-1.5 bg-[#4D6B53] hover:bg-[#3F5944] text-white text-xs font-extrabold rounded-lg border border-[#382E2B] transition-colors cursor-pointer"
                    >
                      Bắt đầu ôn tập
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Filter & Search Bar */}
          <section className="space-y-2.5">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              {/* Search Box */}
              <div className="relative flex-1 w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Search className="w-4 h-4 text-[#6E6259]" />
                </span>
                <input
                  ref={desktopSearchRef}
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Tìm từ vựng, IPA, nghĩa tiếng Việt... (nhấn / để tìm nhanh)"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#FFFDF9] rounded-xl border-2 border-[#382E2B] text-sm font-bold text-[#382E2B] placeholder-[#8E8176] focus:outline-none focus:ring-2 focus:ring-[#4D6B53] shadow-[1.5px_2px_0px_#382E2B]"
                  type="text"
                />
                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Xóa từ khóa"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#6E6259] hover:text-[#382E2B] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Topic Filter Dropdown */}
              <div className="relative w-full sm:w-auto min-w-[240px]">
                <select
                  value={topicId}
                  onChange={(e) => handleTopicFilterChange(e.target.value)}
                  className="w-full appearance-none bg-none bg-[#FFFDF9] border-2 border-[#382E2B] rounded-xl px-3.5 py-2.5 pr-9 text-sm font-extrabold text-[#382E2B] shadow-[1.5px_2px_0px_#382E2B] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4D6B53]"
                >
                  <option value="">Tất cả chủ đề ({total} từ)</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#382E2B]">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Filter Badges Row */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs select-none tabular-nums">
              <button
                type="button"
                onClick={() => handleLevelFilterChange(null)}
                className={`px-3 py-1.5 rounded-xl font-extrabold border-2 cursor-pointer transition-all whitespace-nowrap ${
                  levelFilter === null
                    ? 'border-[#382E2B] bg-[#382E2B] text-white shadow-[1.5px_2px_0px_#382E2B]'
                    : 'border-[#E3D7C5] bg-[#FFFDF9] text-[#382E2B] hover:border-[#382E2B]'
                }`}
              >
                Tất cả ({total})
              </button>
              <button
                type="button"
                onClick={() => handleLevelFilterChange(levelFilter === -1 ? null : -1)}
                className={`px-3 py-1.5 rounded-xl font-extrabold border-2 flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                  levelFilter === -1
                    ? 'border-[#382E2B] bg-[#D95D39] text-white shadow-[1.5px_2px_0px_#382E2B]'
                    : 'border-[#E5B49A] bg-[#FCECE7] text-[#B8452A] hover:border-[#D95D39]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Cần ôn gấp</span>
                <span className="bg-[#D95D39] text-white px-1.5 py-0.2 rounded-full text-[10px]">
                  {srsStats.due || 0}
                </span>
              </button>
              {[0, 1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleLevelFilterChange(levelFilter === lvl ? null : lvl)}
                  className={`px-3 py-1.5 rounded-xl font-extrabold border-2 cursor-pointer transition-all whitespace-nowrap ${
                    levelFilter === lvl
                      ? 'border-[#382E2B] bg-[#382E2B] text-white shadow-[1.5px_2px_0px_#382E2B]'
                      : 'border-[#E3D7C5] bg-[#FFFDF9] text-[#5C524B] hover:border-[#382E2B]'
                  }`}
                >
                  L{lvl} ({memoryLevels[`lv${lvl}`] || 0})
                </button>
              ))}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="ml-auto px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-[#D95D39] hover:bg-[#FCECE7] transition-colors cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </section>

          {/* Master-Detail 12-Column Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pb-12">
            {/* Left Column: Words List (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between px-1 gap-2">
                <h2 className="text-sm font-black text-[#382E2B] flex items-center gap-2">
                  <span>Danh sách từ đang học</span>
                  <span className="text-[11px] font-bold text-[#6E6259] hidden xl:inline">
                    · ↑↓ chọn · P nghe
                  </span>
                </h2>
                <span className="text-xs text-[#6E6259] font-bold tabular-nums">
                  {words.length > 0 ? startIndex + 1 : 0}–{Math.min(total, startIndex + pageSize)} / {total} từ
                </span>
              </div>

              {loading ? (
                <div className="py-16 text-center text-[#7a7267] bg-white rounded-3xl border-2 border-[#443c35]">
                  <RotateCcw className="w-8 h-8 text-[#5b8fb9] animate-spin mb-2 mx-auto" />
                  <p className="text-sm font-bold">Đang tải danh sách từ vựng...</p>
                </div>
              ) : !user && words.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border-2 border-[#443c35] shadow-[3px_4px_0px_#443c35] max-w-lg mx-auto space-y-4">
                  <BookOpen className="w-12 h-12 text-[#443c35] mx-auto mb-2" />
                  <h4 className="text-xl font-black text-[#37322f]">Sổ từ vựng thông minh cho riêng bạn</h4>
                  <p className="text-xs text-[#766c5f] leading-relaxed">
                    Bạn đang trải nghiệm HiVocab ở chế độ Khách. Đăng nhập hoặc tạo tài khoản miễn phí để lưu trữ không giới hạn từ vựng, kích hoạt thuật toán lặp lại ngắt quãng SRS và theo dõi chuỗi ngày giữ lửa!
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('login')}
                      className="px-5 py-2.5 bg-[#382E2B] text-white font-bold text-xs rounded-xl border-2 border-[#443c35] shadow-[2px_2px_0px_#443c35] active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      Đăng nhập ngay
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') window._initialAuthMode = 'signup';
                        navigateTo('login');
                      }}
                      className="px-5 py-2.5 bg-[#D36135] text-white font-bold text-xs rounded-xl border-2 border-[#443c35] shadow-[2px_2px_0px_#443c35] active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      Tạo tài khoản miễn phí
                    </button>
                  </div>
                </div>
              ) : words.length === 0 ? (
                <div className="p-10 text-center bg-[#FFFDF9] rounded-3xl border-2 border-[#382E2B] shadow-[3px_4px_0px_#382E2B]">
                  <BookOpen className="w-10 h-10 text-[#A89C92] mx-auto mb-3" />
                  <h4 className="text-lg font-black text-[#382E2B]">Không tìm thấy từ vựng nào</h4>
                  <p className="text-xs text-[#6E6259] mt-1 mb-4">
                    Thử thay đổi từ khóa tìm kiếm hoặc lọc theo cấp độ khác nhé.
                  </p>
                  <div className="flex items-center justify-center gap-2.5">
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="px-4 py-2.5 bg-[#FAF5EB] hover:bg-[#F0E6D6] text-[#382E2B] font-extrabold text-xs rounded-xl border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] cursor-pointer"
                      >
                        Xóa bộ lọc
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleOpenAddWord}
                      className="px-5 py-2.5 bg-[#D95D39] hover:bg-[#BF4D2C] text-white font-extrabold text-xs rounded-xl border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] cursor-pointer"
                    >
                      + Thêm từ mới ngay
                    </button>
                  </div>
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
                            {(w.englishMeaning || w.english_meaning) && (
                              <div className="mt-1 flex items-start gap-1.5 text-xs font-semibold text-[#64594d] leading-snug">
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-[#eaf4e8] border border-[#6e9b6a]/50 text-[#558451] font-black text-[10px] shrink-0 mt-0.5">
                                  EN
                                </span>
                                <span>{w.englishMeaning || w.english_meaning}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 ${lvlTheme.badgeBg}`}>
                            <Clock className="w-3 h-3" /> {intervalText}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playWord(w.word);
                            }}
                            className="p-2 rounded-xl bg-[#f7efe3] hover:bg-[#eee2d1] border border-[#443c35] text-[#37322f] transition-colors cursor-pointer"
                            title="Phát âm"
                          >
                            <Volume2 className="w-4 h-4 text-[#37322f]" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWord(w.id, w.word);
                            }}
                            className="p-2 rounded-xl text-[#a89b8c] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa từ"
                          >
                            <Trash2 className="w-4 h-4" />
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
            <aside className="lg:col-span-5 sticky top-24 space-y-5">
              {selectedWord ? (
                <div className="bg-[#fffdf9] rounded-3xl border-2 border-[#443c35] p-6 shadow-[3px_4px_0px_#443c35] relative overflow-hidden">
                  <div className="flex items-center justify-between pb-4 border-b-2 border-dashed border-[#e6decb]">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#73685a]" />
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
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#ea7349] hover:text-white border-2 border-[#443c35] text-xs font-black transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Phát âm</span>
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

                    {/* English Definition */}
                    {(selectedWord.englishMeaning || selectedWord.english_meaning) && (
                      <div className="mt-3 p-4 bg-[#f3f8f1] rounded-2xl border-2 border-[#cbe0c5]">
                        <div className="text-xs font-black uppercase text-[#558451] tracking-wider mb-1">
                          Định nghĩa tiếng Anh (English Meaning)
                        </div>
                        <p className="text-sm font-bold text-[#37322f] leading-relaxed">
                          {selectedWord.englishMeaning || selectedWord.english_meaning}
                        </p>
                      </div>
                    )}

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

                    {/* FSRS-6 DSR Memory Metrics */}
                    {selectedWord.level > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="p-2.5 rounded-xl bg-[#f8f1e7] border border-[#d8c8b4] text-center">
                          <div className="text-[10px] font-black uppercase text-[#807669]">Độ bền (S)</div>
                          <div className="text-sm font-black text-[#37322f] font-mono mt-0.5">
                            {Number(selectedWord.stability || 0).toFixed(1)}d
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#f8f1e7] border border-[#d8c8b4] text-center">
                          <div className="text-[10px] font-black uppercase text-[#807669]">Độ khó (D)</div>
                          <div className="text-sm font-black text-[#37322f] font-mono mt-0.5">
                            {Number(selectedWord.difficulty || 0).toFixed(1)}/10
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#eaf4e8] border border-[#6e9b6a]/40 text-center">
                          <div className="text-[10px] font-black uppercase text-[#4f7d4b]">Khả năng nhớ</div>
                          <div className="text-sm font-black text-[#4f7d4b] font-mono mt-0.5">
                            {Math.round((Number(selectedWord.retrievability) || 0.9) * 100)}%
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-[#E3D7C5] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => deleteWord(selectedWord.id, selectedWord.word)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-300 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa từ này</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleStartReview}
                        className="px-5 py-2.5 bg-[#D95D39] hover:bg-[#BF4D2C] text-white font-extrabold text-xs rounded-xl border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 cursor-pointer"
                      >
                        Ôn tập FSRS-6 ngay
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
