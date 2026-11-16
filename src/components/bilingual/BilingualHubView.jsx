// src/components/bilingual/BilingualHubView.jsx
// Hub chọn bài Đọc Song Ngữ IELTS & Đục Lỗ Ngữ Cảnh - Phong cách Cozy Crayon
import React from 'react';
import {
  BookOpen,
  BookOpenText,
  Crown,
  EyeOff,
  PenTool,
  Play,
  Search,
  Sparkles,
  Volume2,
  X,
  AlertTriangle,
} from 'lucide-react';

function getPassagePreview(contentEn) {
  if (!contentEn || typeof contentEn !== 'string') return '';
  const cleaned = contentEn
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned.length > 135 ? `${cleaned.slice(0, 132).trim()}…` : cleaned;
}

export function BilingualHubView({
  books,
  booksLoading,
  selectedBook,
  selectedBookId,
  onSelectBook,
  hierarchyLoading,
  hierarchyError,
  isUserPro,
  tests,
  filteredTests,
  selectedTestId,
  onSelectTest,
  searchQuery,
  onSearchChange,
  filterMode,
  onFilterModeChange,
  bookStats,
  lastReading,
  onResumeLastReading,
  onOpenPassage,
  onOpenProModal,
}) {
  return (
    <div
      id="page-bilingual-reading"
      className="page active min-h-screen bg-[#FAF5EB] font-sans antialiased text-[#382E2B] lg:pl-[var(--sidebar-w,244px)] pb-[calc(7rem+env(safe-area-inset-bottom,0px))] lg:pb-12"
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        {/* Top Hero Banner */}
        <section className="bg-[#FFFDF9] rounded-3xl p-5 sm:p-6 border-2 border-[#3D352E] shadow-[4px_5px_0px_#3D352E] relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF3C7] border border-[#3D352E] text-[11px] font-black uppercase tracking-wider text-[#382E2B]">
                <BookOpenText className="w-3.5 h-3.5 text-[#D96B43]" />
                <span>Không gian Đọc Song Ngữ IELTS</span>
              </div>

              <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#302A24] leading-tight">
                Đọc Anh–Việt đối chiếu &amp; Đục lỗ ngữ cảnh
              </h1>

              <p className="text-xs sm:text-sm font-medium text-[#6E6359] leading-relaxed">
                Chọn trực tiếp bất kỳ bài Reading nào trong kho IELTS Actual Tests để luyện đọc chủ động, bật rèm che nghĩa tiếng Việt (Curtain Mode), chạm vào từ khóa xem nghĩa và làm bài đục lỗ ngay tại chỗ.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#EEF5EB] border border-[#8FB383] text-xs font-bold text-[#3E6334]">
                  <EyeOff className="w-3.5 h-3.5 shrink-0" />
                  <span>Curtain Mode che dịch</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FFF3E8] border border-[#E6B89C] text-xs font-bold text-[#A54624]">
                  <Volume2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Chạm từ tra nghĩa + phát âm</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#EEF6FB] border border-[#96CBE4] text-xs font-bold text-[#25698A]">
                  <PenTool className="w-3.5 h-3.5 shrink-0" />
                  <span>Đục lỗ ghi nhớ ngữ cảnh</span>
                </span>
              </div>
            </div>

            {/* Resume Card or Quick Stats */}
            <div className="w-full lg:w-[310px] shrink-0">
              {lastReading?.passageId ? (
                <div className="bg-[#FAF3E7] rounded-2xl p-4 border-2 border-[#3D352E] shadow-[3px_3px_0px_#3D352E] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[#D96B43]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Vừa đọc gần đây</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#3D352E]/30 text-[#5C5248]">
                      {lastReading.topicName || 'IELTS'}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-heading font-black text-sm text-[#302A24] line-clamp-2">
                      {lastReading.title}
                    </h2>
                    <p className="text-[11px] font-semibold text-[#786F66] mt-0.5 truncate">
                      {lastReading.testName || 'Test'} · Passage {lastReading.passageNumber || ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onResumeLastReading}
                    className="w-full py-2 px-3 rounded-xl bg-[#4D6B53] hover:bg-[#3F5944] text-white font-black text-xs border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Đọc tiếp bài này</span>
                  </button>
                </div>
              ) : (
                <div className="bg-[#FAF3E7] rounded-2xl p-4 border-2 border-[#3D352E] shadow-[3px_3px_0px_#3D352E] space-y-2">
                  <div className="text-xs font-black uppercase tracking-wider text-[#6E6359]">
                    Tài nguyên đang xem
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading font-black text-2xl text-[#302A24]">
                      {selectedBook?.name || 'IELTS Actual Tests'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#786F66]">
                    {bookStats.totalPassages > 0
                      ? `${bookStats.totalPassages} bài đọc · ${bookStats.totalWords} từ học thuật`
                      : `${books.length || 10} tập sách IELTS Reading song ngữ`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Book Volume Selector (IELTS Vol 1 .. Vol 10) */}
        <section className="space-y-3" aria-label="Chọn tập sách đọc song ngữ">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading font-black text-base sm:text-lg text-[#302A24] flex items-center gap-2">
              <span>Chọn bộ sách Reading</span>
              {books.length > 0 && (
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#F4E3B4] border border-[#3D352E] text-[#3D352E]">
                  {books.length} tập
                </span>
              )}
            </h2>

            {bookStats.totalWords > 0 && (
              <span className="text-xs font-bold text-[#6E6359]">
                Đã học {bookStats.learnedWords}/{bookStats.totalWords} từ trong tập này
              </span>
            )}
          </div>

          {booksLoading && books.length === 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-10 w-28 rounded-2xl bg-[#EFE7D6] animate-pulse border border-[#3D352E]/20 shrink-0"
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {books.map((book) => {
                const isActive = book.id === selectedBookId;
                return (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => onSelectBook(book.id)}
                    className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap shrink-0 transition-all cursor-pointer border-2 ${
                      isActive
                        ? 'bg-[#4D6B53] text-white border-[#3D352E] shadow-[2px_3px_0px_#3D352E]'
                        : 'bg-[#FFFDF9] text-[#382E2B] border-[#3D352E]/60 hover:border-[#3D352E] hover:bg-[#F4EFE6]'
                    }`}
                  >
                    <span>{book.name}</span>
                    {book.is_pro && !isUserPro && (
                      <Crown className="inline w-3.5 h-3.5 ml-1.5 text-amber-400 fill-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Search + Filter Bar + Test Pills */}
        <section className="bg-[#FFFDF9] rounded-3xl p-4 border-2 border-[#3D352E] shadow-[3px_3px_0px_#3D352E] space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#786F66] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm bài đọc theo tên bài, chủ đề hoặc Test..."
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#FAF5EB] border-2 border-[#3D352E]/60 focus:border-[#3D352E] focus:outline-none text-xs sm:text-sm font-bold text-[#302A24] placeholder:text-[#8E8377]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Xóa tìm kiếm"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-[#3D352E]/40 flex items-center justify-center text-[#5C5248] hover:bg-[#EFE8D6] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'free', label: 'Miễn phí' },
                { id: 'with-vocab', label: 'Có bộ từ vựng' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => onFilterModeChange(chip.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                    filterMode === chip.id
                      ? 'bg-[#382E2B] text-white border-[#382E2B]'
                      : 'bg-[#FAF5EB] text-[#6E6359] border-[#3D352E]/30 hover:border-[#3D352E] hover:text-[#302A24]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Test switcher pills */}
          {tests.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
              <button
                type="button"
                onClick={() => onSelectTest('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap shrink-0 border transition-all cursor-pointer ${
                  selectedTestId === 'all'
                    ? 'bg-[#F4E3B4] text-[#302A24] border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E]'
                    : 'bg-white text-[#6E6359] border-[#E2D8C5] hover:border-[#3D352E]'
                }`}
              >
                Tất cả Test ({tests.length})
              </button>
              {tests.map((test) => (
                <button
                  key={test.id}
                  type="button"
                  onClick={() => onSelectTest(test.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap shrink-0 border transition-all cursor-pointer ${
                    selectedTestId === test.id
                      ? 'bg-[#F4E3B4] text-[#302A24] border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E]'
                      : 'bg-white text-[#6E6359] border-[#E2D8C5] hover:border-[#3D352E]'
                  }`}
                >
                  {test.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Passages List */}
        {hierarchyLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="h-52 rounded-3xl bg-[#FFFDF9] border-2 border-[#3D352E]/20 p-5 animate-pulse space-y-3"
              >
                <div className="h-4 w-28 bg-[#EFE7D6] rounded-full" />
                <div className="h-5 w-4/5 bg-[#EFE7D6] rounded-xl" />
                <div className="h-12 w-full bg-[#FAF5EB] rounded-xl" />
                <div className="h-9 w-full bg-[#EFE7D6] rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : hierarchyError ? (
          <div className="bg-[#FFFDF9] rounded-3xl p-8 border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] text-center max-w-md mx-auto space-y-3">
            <AlertTriangle className="w-10 h-10 text-[#C85A3F] mx-auto" />
            <h3 className="font-heading font-black text-lg text-[#302A24]">Chưa tải được danh sách bài đọc</h3>
            <p className="text-xs font-semibold text-[#786F66]">{hierarchyError}</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="bg-[#FFFDF9] rounded-3xl p-10 border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] text-center space-y-2">
            <BookOpen className="w-10 h-10 text-[#9B8E80] mx-auto" />
            <h3 className="font-heading font-black text-base text-[#302A24]">
              Không tìm thấy bài đọc phù hợp
            </h3>
            <p className="text-xs font-semibold text-[#786F66]">
              Thử đổi từ khóa tìm kiếm hoặc chọn tập sách khác nhé.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTests.map((test) => (
              <section key={test.id} className="space-y-3">
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-[#EFE8D6] border border-[#3D352E] text-xs font-black text-[#302A24]">
                      {test.name}
                    </span>
                    <span className="text-xs font-bold text-[#786F66]">
                      {test.passages.length} bài đọc
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {test.passages.map((passage) => {
                    const isLocked =
                      Boolean(passage.isPro || test.isPro || selectedBook?.is_pro) &&
                      !isUserPro &&
                      !passage.contentEn;
                    const preview = getPassagePreview(passage.contentEn);
                    const totalWords = passage.totalWords || 0;
                    const learnedWords = passage.learnedWords || 0;
                    const progress = passage.progress || 0;

                    return (
                      <article
                        key={passage.id}
                        className="bg-[#FFFDF9] rounded-3xl p-4 sm:p-5 border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] hover:-translate-y-0.5 hover:shadow-[4px_6px_0px_#3D352E] transition-all flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF3E7] border border-[#3D352E]/40 text-[#5C5248]">
                              Passage {passage.passageNumber || ''}
                            </span>

                            {isLocked ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#FEF3C7] border border-[#D97706] text-[#92400E]">
                                <Crown className="w-3 h-3 fill-amber-400 text-amber-600" />
                                <span>PRO</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#E5EFE2] border border-[#8FB383] text-[#456839]">
                                Song ngữ Anh–Việt
                              </span>
                            )}
                          </div>

                          <h3 className="font-heading font-black text-base text-[#302A24] leading-snug line-clamp-2">
                            {passage.title || `Passage ${passage.passageNumber || ''}`}
                          </h3>

                          {passage.topicLabel && (
                            <p className="text-[11px] font-bold text-[#D96B43] truncate">
                              Chủ đề: {passage.topicLabel}
                            </p>
                          )}

                          {preview ? (
                            <p className="text-xs font-medium text-[#6E6359] leading-relaxed line-clamp-3">
                              {preview}
                            </p>
                          ) : isLocked ? (
                            <p className="text-xs font-semibold text-[#8E8377] italic">
                              Bài đọc nằm trong bộ Cambridge / IELTS Actual Tests dành riêng cho thành viên PRO.
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-3 pt-1">
                          {totalWords > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-[#786F66]">
                                <span>Từ vựng trong bài</span>
                                <span className="text-[#302A24]">
                                  {learnedWords}/{totalWords} ({progress}%)
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-[#EFE7D6] overflow-hidden border border-[#3D352E]/20">
                                <div
                                  className="h-full bg-[#5a7d4d] transition-all"
                                  style={{ width: `${Math.min(100, progress)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {isLocked ? (
                            <button
                              type="button"
                              onClick={() => onOpenProModal(passage)}
                              className="w-full py-2.5 px-3 rounded-2xl bg-[#F4E3B4] hover:bg-[#ECD496] text-[#302A24] font-black text-xs border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Crown className="w-3.5 h-3.5 text-[#D97706]" />
                              <span>Mở khóa PRO</span>
                            </button>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => onOpenPassage(passage, test, 'reading')}
                                className="py-2 px-3 rounded-2xl bg-[#4D6B53] hover:bg-[#3F5944] text-white font-black text-xs border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                <span>Đọc song ngữ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenPassage(passage, test, 'gap-fill')}
                                className="py-2 px-3 rounded-2xl bg-white hover:bg-[#FAF3E7] text-[#302A24] font-black text-xs border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <PenTool className="w-3.5 h-3.5 shrink-0 text-[#D96B43]" />
                                <span>Đục lỗ</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BilingualHubView;
