// src/components/bilingual/BilingualReadingView.jsx
// Chế độ Đọc Song Ngữ Biên Tập (Editorial Split-Column Paper Spread + Inline Green/Amber/Blue Highlights + Từ vựng trọng tâm)

import React from 'react';
import { EyeOff, BookOpen, Eye, Volume2, X } from 'lucide-react';
import { getVolBookMeta } from '../../data/bilingualVolMeta.js';

function translatePosLabel(rawPos) {
  const tag = String(rawPos || '').trim().toLowerCase();
  if (!tag) return '';
  if (tag === 'n' || tag === 'noun') return 'Danh từ';
  if (tag === 'v' || tag === 'verb') return 'Động từ';
  if (tag === 'adj' || tag === 'adjective') return 'Tính từ';
  if (tag === 'adv' || tag === 'adverb') return 'Trạng từ';
  if (tag === 'prep' || tag === 'preposition') return 'Giới từ';
  if (tag === 'conj' || tag === 'conjunction') return 'Liên từ';
  if (tag === 'phrase' || tag === 'idiom') return 'Cụm từ';
  return rawPos;
}

// Render English paragraph with clean editorial underline / soft marker highlights
function HighlightedEnglishText({
  text,
  vocabRegex,
  vocabMap,
  showHighlights,
  selectedVocabWord,
  onWordClick,
}) {
  if (!text) return null;
  if (!showHighlights || !vocabRegex || !vocabMap || vocabMap.size === 0) {
    return <span>{text}</span>;
  }

  vocabRegex.lastIndex = 0;
  const elements = [];
  let lastIdx = 0;
  let match;
  let key = 0;
  let safety = 0;

  while ((match = vocabRegex.exec(text)) !== null) {
    if (++safety > 1000) break;
    if (match.index === vocabRegex.lastIndex) {
      vocabRegex.lastIndex++;
    }

    if (match.index > lastIdx) {
      elements.push(<span key={key++}>{text.substring(lastIdx, match.index)}</span>);
    }

    const matchedWord = match[0];
    const baseKey = (match[1] || matchedWord).toLowerCase();
    const wordObj = vocabMap.get(baseKey) || { word: matchedWord };
    const isSelected = selectedVocabWord && selectedVocabWord === baseKey;
    const isPhrase = baseKey.includes(' ');

    let highlightCls =
      'underline decoration-[#2D7A55] decoration-[2px] underline-offset-[4px] font-medium text-[#1D3B2C] hover:bg-[#DCECE3] rounded-xs cursor-pointer transition-colors select-text';
    if (isSelected) {
      highlightCls =
        'bg-[#FDE6B0] text-[#2B2118] rounded px-1 -mx-0.5 underline decoration-[#C87A19] decoration-2 underline-offset-[4px] font-semibold cursor-pointer transition-colors select-text';
    } else if (isPhrase) {
      highlightCls =
        'bg-[#DCEBF7] hover:bg-[#C9E0F4] text-[#1E3A5F] rounded px-1 mx-0.5 border-b border-[#7FAFD4] font-medium cursor-pointer transition-colors select-text';
    }

    elements.push(
      <span
        key={key++}
        data-vocab-word={baseKey}
        onClick={(e) => {
          e.stopPropagation();
          onWordClick(wordObj, e.clientX, e.clientY);
        }}
        className={highlightCls}
        title="Nhấp để xem nghĩa & phát âm"
      >
        {matchedWord}
      </span>
    );

    lastIdx = vocabRegex.lastIndex;
  }

  if (lastIdx < text.length) {
    elements.push(<span key={key++}>{text.substring(lastIdx)}</span>);
  }

  return <>{elements}</>;
}

export function BilingualReadingView({
  passage,
  words,
  enParas,
  viParas,
  totalParas,
  viewMode,
  fontSize,
  vocabRegex,
  vocabMap,
  showHighlights = true,
  showVocabSidebar = true,
  onToggleVocabSidebar,
  curtainMode = false,
  revealedParas,
  selectedVocabWord,
  onToggleCurtain,
  onRevealAll,
  onHideAll,
  onWordClick,
}) {
  const fontClassMap = {
    sm: 'text-[14px] leading-[1.75]',
    base: 'text-[16px] leading-[1.8]',
    lg: 'text-[18px] leading-[1.85]',
    xl: 'text-[20px] leading-[1.9]',
  };
  const fontClass = fontClassMap[fontSize] || 'text-[16px] leading-[1.8]';

  const handleSidebarWordClick = (wordItem, event) => {
    if (!wordItem?.word) return;
    const key = wordItem.word.trim().toLowerCase();
    const targetEl =
      typeof document !== 'undefined'
        ? document.querySelector(`[data-vocab-word="${CSS.escape(key)}"]`)
        : null;
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const rect = targetEl ? targetEl.getBoundingClientRect() : event?.currentTarget?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : event?.clientX || 200;
    const cy = rect ? rect.bottom : event?.clientY || 200;
    onWordClick(wordItem, cx, cy);
  };

  return (
    <div
      className={`mx-auto w-full pb-20 ${
        showVocabSidebar
          ? 'max-w-[1360px] grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_290px] xl:grid-cols-[minmax(0,1fr)_310px] gap-6 items-start'
          : 'max-w-5xl'
      }`}
    >
      {/* Left / Main Column: Editorial Bilingual Paper Card */}
      <article className="bg-[#FFFDF9] rounded-[24px] border-2 border-[#382E2B] shadow-[4px_5px_0px_#382E2B] p-5 sm:p-8 lg:p-10 min-w-0">
        {/* Top Metadata Row above solid rule */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b-2 border-[#382E2B]">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-black text-[#382E2B] tracking-tight">
              {passage?.isNewsArticle
                ? passage?.topicName || 'Báo Song Ngữ Chọn Lọc'
                : passage?.topicName
                  ? getVolBookMeta(passage.topicName).titleVi
                  : 'Đọc Song Ngữ IELTS'}
            </span>
            {passage?.topicLabel && (
              <span className="bg-[#EFEBE2] text-[#4E453D] px-2.5 py-0.5 rounded-md font-bold">
                {passage.topicLabel}
              </span>
            )}
            <span className="text-[#766C5F] font-semibold">
              {passage?.isNewsArticle
                ? `Bài báo #${passage?.passageNumber || ''}`
                : `${passage?.testName ? `${passage.testName} · ` : ''}Passage ${passage?.passageNumber || ''}`}
            </span>
            <span className="text-[#9A8E82]">·</span>
            <span className="text-[#766C5F] font-semibold">
              {totalParas} đoạn
              {!passage?.isNewsArticle || words.length > 0 ? ` · ${words.length} từ trọng tâm` : ''}
            </span>
          </div>

          {/* Curtain Mode Controls (subtle inline pills >= 38px) */}
          {viewMode === 'bilingual' && (
            <div className="flex items-center gap-2 shrink-0 select-none">
              <button
                type="button"
                onClick={curtainMode ? onRevealAll : onHideAll}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-black border border-[#382E2B] flex items-center gap-1.5 transition-all cursor-pointer active:translate-y-0.5 ${
                  curtainMode
                    ? 'bg-[#382E2B] text-white'
                    : 'bg-[#FAF6EE] hover:bg-[#F1EAE0] text-[#382E2B]'
                }`}
                title={curtainMode ? 'Hiện toàn bộ bản dịch đối chiếu' : 'Bật chế độ che bản dịch tiếng Việt'}
              >
                {curtainMode ? (
                  <>
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span>Hiện tất cả dịch</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 shrink-0" />
                    <span>Che dịch</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Big Side-by-Side Serif Article Titles */}
        <div
          className={`py-5 sm:py-6 ${
            viewMode !== 'en'
              ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-start'
              : ''
          }`}
        >
          <h2 className="font-['Playfair_Display',Georgia,serif] text-2xl sm:text-[28px] lg:text-[32px] font-black text-[#1E1A16] leading-[1.2] tracking-tight">
            {passage?.title || `Reading Passage ${passage?.passageNumber || ''}`}
          </h2>
          {viewMode !== 'en' && (
            <h3 className="font-['Playfair_Display',Georgia,serif] text-xl sm:text-[24px] lg:text-[28px] font-bold text-[#382E2B] leading-[1.25]">
              {passage?.titleVi || `Bản dịch tiếng Việt · Passage ${passage?.passageNumber || ''}`}
            </h3>
          )}
        </div>

        {/* Paragraph Pairs: Soft Stone Editorial Cards */}
        <div className="space-y-4 sm:space-y-5">
          {Array.from({ length: totalParas }).map((_, i) => {
            const enP = enParas[i] || '';
            const viP = viParas[i] || '';
            const isHiddenUnderCurtain = curtainMode && !revealedParas.has(i);

            if (viewMode === 'en') {
              return (
                <div
                  key={i}
                  className="bg-[#F4F0E7]/85 rounded-2xl p-4 sm:p-5 lg:p-6 border border-[#E5DEC9]"
                >
                  <div className={`text-[#2A241E] font-normal text-left ${fontClass}`}>
                    <HighlightedEnglishText
                      text={enP}
                      vocabRegex={vocabRegex}
                      vocabMap={vocabMap}
                      showHighlights={showHighlights}
                      selectedVocabWord={selectedVocabWord}
                      onWordClick={onWordClick}
                    />
                  </div>
                </div>
              );
            }

            // Bilingual Side-by-Side Row
            return (
              <div
                key={i}
                className="bg-[#F4F0E7]/85 rounded-2xl p-4 sm:p-5 lg:p-6 border border-[#E5DEC9] hover:border-[#D4CBB8] transition-colors"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8 items-start">
                  {/* Left: English Paragraph */}
                  <div className={`text-[#2A241E] font-normal text-left ${fontClass}`}>
                    <HighlightedEnglishText
                      text={enP}
                      vocabRegex={vocabRegex}
                      vocabMap={vocabMap}
                      showHighlights={showHighlights}
                      selectedVocabWord={selectedVocabWord}
                      onWordClick={onWordClick}
                    />
                  </div>

                  {/* Right: Vietnamese Translation (with clean in-place Curtain support) */}
                  <div className="relative lg:border-l lg:border-[#E2DAC9] lg:pl-7 min-h-[3.5rem]">
                    <div
                      className={`transition-opacity duration-200 ${
                        isHiddenUnderCurtain
                          ? 'opacity-0 select-none pointer-events-none'
                          : 'opacity-100 select-text'
                      }`}
                    >
                      <div className={`text-[#3A322C] font-normal text-left ${fontClass}`}>
                        {viP || (
                          <span className="italic text-[#9C8F85]">Đang cập nhật bản dịch...</span>
                        )}
                      </div>
                    </div>

                    {curtainMode && !isHiddenUnderCurtain && (
                      <div className="mt-2 flex justify-end select-none">
                        <button
                          type="button"
                          onClick={() => onToggleCurtain(i)}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white border border-[#D4CBB8] text-[11px] font-bold text-[#6E6358] flex items-center gap-1 cursor-pointer"
                          title="Che lại bản dịch đoạn này"
                        >
                          <EyeOff className="w-3.5 h-3.5 shrink-0" />
                          <span>Che lại</span>
                        </button>
                      </div>
                    )}

                    {isHiddenUnderCurtain && (
                      <button
                        type="button"
                        onClick={() => onToggleCurtain(i)}
                        className="absolute inset-0 w-full h-full min-h-[56px] rounded-xl bg-[#EAE4D7]/95 hover:bg-[#E3DCCB] border border-dashed border-[#BBAE99] flex items-center justify-center gap-2 text-xs font-bold text-[#382E2B] cursor-pointer transition-colors select-none"
                      >
                        <BookOpen className="w-4 h-4 text-[#2D7A55] shrink-0" />
                        <span>Chạm để xem bản dịch tiếng Việt</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </article>

      {/* Right Column: Sticky "Từ vựng trọng tâm" Sidebar Panel (Toggleable from Taskbar) */}
      {showVocabSidebar && (
        <aside className="bg-[#FFFDF9] rounded-[24px] border-2 border-[#382E2B] shadow-[4px_5px_0px_#382E2B] p-4 lg:sticky lg:top-20 max-h-[520px] lg:max-h-[calc(100vh-105px)] flex flex-col">
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[#E5DEC9] shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-0.5 bg-[#2D7A55] rounded-full shrink-0" />
              <h3 className="font-heading font-black text-sm text-[#382E2B] truncate">
                Từ vựng trọng tâm
              </h3>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 rounded-full bg-[#EFEBE2] text-[#382E2B] text-xs font-black">
                {words.length}
              </span>
              {typeof onToggleVocabSidebar === 'function' && (
                <button
                  type="button"
                  onClick={onToggleVocabSidebar}
                  className="lg:hidden w-8 h-8 rounded-lg hover:bg-[#FAF5EB] flex items-center justify-center text-[#766C5F] cursor-pointer"
                  aria-label="Đóng danh sách từ vựng"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {words.length === 0 ? (
            <p className="text-xs text-[#766C5F] py-6 text-center">
              Chưa có danh sách từ vựng trọng tâm cho bài đọc này.
            </p>
          ) : (
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {words.map((w, idx) => {
                const key = (w.word || '').trim().toLowerCase();
                const isSelected = selectedVocabWord && selectedVocabWord === key;
                const posLabel = translatePosLabel(w.pos);

                return (
                  <button
                    key={w.id || `${key}-${idx}`}
                    type="button"
                    onClick={(e) => handleSidebarWordClick(w, e)}
                    className={`w-full text-left rounded-xl p-3 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FEF3D6] border-[#D97706] shadow-2xs'
                        : 'bg-[#F4F0E7]/85 hover:bg-white border-[#E5DEC9] hover:border-[#C9BFA9]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#1E1A16] break-words">
                        {w.word}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {posLabel && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#2D7A55] border border-[#8BB59E]">
                            {posLabel}
                          </span>
                        )}
                        <Volume2 className="w-3.5 h-3.5 text-[#766C5F]" />
                      </div>
                    </div>
                    {w.meaning && (
                      <p className="text-xs text-[#655C52] leading-snug mt-1 line-clamp-2">
                        {w.meaning}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

export default BilingualReadingView;
