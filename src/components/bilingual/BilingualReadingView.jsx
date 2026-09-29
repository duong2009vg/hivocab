// src/components/bilingual/BilingualReadingView.jsx
// Active Reading View with Parallel Columns & Curtain (Blur/Privacy) Mode

import React from 'react';

// Extract paragraph label (e.g. Paragraph A, Section 1...)
function getParagraphLabel(paraText, index) {
  const match = (paraText || '').match(/^(Paragraph\s+[A-Z0-9]+|Section\s+[A-Z0-9]+|[A-Z]\.\s+)/i);
  if (match) return match[1].replace(/\.$/, '').trim();
  return `Đoạn ${String.fromCharCode(65 + index) || index + 1}`;
}

// Render English paragraph with interactive highlighted vocab spans
function HighlightedEnglishText({ text, vocabRegex, vocabMap, onWordClick }) {
  if (!text) return null;
  if (!vocabRegex || !vocabMap || vocabMap.size === 0) {
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

    elements.push(
      <span
        key={key++}
        onClick={(e) => {
          e.stopPropagation();
          onWordClick(wordObj, e.clientX, e.clientY);
        }}
        className="inline-flex items-baseline px-1.5 py-0.5 mx-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-bold border-b-2 border-primary/40 cursor-pointer transition-all active:scale-95 select-text"
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
  revealedParas,
  onToggleCurtain,
  onRevealAll,
  onHideAll,
  onWordClick,
}) {
  const fontClassMap = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-relaxed',
    lg: 'text-lg leading-loose',
    xl: 'text-xl leading-loose',
  };
  const fontClass = fontClassMap[fontSize] || 'text-base leading-relaxed';

  return (
    <div className="max-w-6xl mx-auto w-full pb-20">
      {/* Thông tin tiêu đề bài đọc */}
      <div className="bg-surface-container-lowest/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-outline-variant/20 rounded-2xl p-5 md:p-6 mb-6 soft-shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-primary/10 text-primary">
                IELTS Reading Passage {passage?.passageNumber || ''}
              </span>
              {passage?.topicLabel && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container text-on-surface-variant">
                  {passage.topicLabel}
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-on-surface leading-tight">
              {passage?.title || `Passage ${passage?.passageNumber || ''}`}
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              {totalParas} đoạn văn · {words.length} từ vựng trọng tâm trong bài
            </p>
          </div>

          {/* Nút thao tác nhanh toàn bài */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onRevealAll}
              className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-primary/10 text-on-surface-variant hover:text-primary text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Mở toàn bộ bản dịch tiếng Việt"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>Hiện tất cả</span>
            </button>
            <button
              type="button"
              onClick={onHideAll}
              className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-secondary/10 text-on-surface-variant hover:text-secondary text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Che toàn bộ bản dịch tiếng Việt"
            >
              <span className="material-symbols-outlined text-[16px]">visibility_off</span>
              <span>Che tất cả</span>
            </button>
          </div>
        </div>

        {/* Hướng dẫn chế độ Curtain Mode */}
        <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] text-primary shrink-0">info</span>
          <span>
            <strong>Mẹo học chủ động:</strong> Cột tiếng Việt mặc định được che mờ. Hãy đọc đoạn
            văn tiếng Anh trước và tự dịch trong đầu, sau đó chạm vào bản dịch để đối chiếu.
          </span>
        </div>
      </div>

      {/* Danh sách các đoạn văn */}
      <div className="flex flex-col gap-5">
        {Array.from({ length: totalParas }).map((_, i) => {
          const enP = enParas[i] || '';
          const viP = viParas[i] || '';
          const isRevealed = revealedParas.has(i);
          const paraLabel = getParagraphLabel(enP, i);

          if (viewMode === 'en') {
            return (
              <div
                key={i}
                className="bg-surface-container-lowest/90 dark:bg-neutral-900/90 backdrop-blur-sm border border-outline-variant/20 rounded-2xl p-5 md:p-6 soft-shadow"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    {paraLabel}
                  </span>
                </div>
                <div className={`text-on-surface font-normal text-justify ${fontClass}`}>
                  <HighlightedEnglishText
                    text={enP}
                    vocabRegex={vocabRegex}
                    vocabMap={vocabMap}
                    onWordClick={onWordClick}
                  />
                </div>
              </div>
            );
          }

          if (viewMode === 'vi') {
            return (
              <div
                key={i}
                className="bg-surface-container-lowest/90 dark:bg-neutral-900/90 backdrop-blur-sm border border-outline-variant/20 rounded-2xl p-5 md:p-6 soft-shadow"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                    {paraLabel} · Bản dịch
                  </span>
                </div>
                <div className={`text-on-surface font-normal text-justify ${fontClass}`}>
                  {viP || <span className="italic text-outline">Đang cập nhật bản dịch...</span>}
                </div>
              </div>
            );
          }

          // Chế độ Song Ngữ: Parallel Columns (Desktop) & Stacked (Mobile) với Curtain Mode
          return (
            <div
              key={i}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-surface-container-lowest/90 dark:bg-neutral-900/90 backdrop-blur-sm border border-outline-variant/20 rounded-2xl p-4 md:p-6 soft-shadow hover:border-primary/30 transition-all"
            >
              {/* Cột tiếng Anh */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-outline-variant/15">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      {paraLabel} · English
                    </span>
                  </div>
                  <div className={`text-on-surface font-normal text-justify ${fontClass}`}>
                    <HighlightedEnglishText
                      text={enP}
                      vocabRegex={vocabRegex}
                      vocabMap={vocabMap}
                      onWordClick={onWordClick}
                    />
                  </div>
                </div>
              </div>

              {/* Cột tiếng Việt: CURTAIN MODE */}
              <div className="relative overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-4 transition-all flex flex-col justify-between group/card min-h-[6rem]">
                <div>
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-outline-variant/15">
                    <span className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px]">translate</span>
                      Bản dịch đối ứng
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleCurtain(i)}
                      className="text-xs font-bold px-2 py-0.5 rounded-lg text-primary hover:bg-primary/10 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {isRevealed ? 'visibility_off' : 'visibility'}
                      </span>
                      <span>{isRevealed ? 'Che lại' : 'Hiện dịch'}</span>
                    </button>
                  </div>

                  {/* Nội dung bản dịch */}
                  <div
                    className={`transition-opacity duration-200 ${
                      isRevealed
                        ? 'opacity-100 select-text'
                        : 'opacity-0 select-none pointer-events-none min-h-[4rem]'
                    }`}
                  >
                    <div className={`text-on-surface font-normal text-justify ${fontClass}`}>
                      {viP || (
                        <span className="italic text-outline">Đang cập nhật bản dịch...</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Overlay rèm che khi chưa mở */}
                {!isRevealed && (
                  <div
                    onClick={() => onToggleCurtain(i)}
                    className="absolute inset-0 z-10 bg-surface-container-low/95 dark:bg-neutral-900/95 flex items-center justify-center cursor-pointer hover:bg-surface-container transition-all"
                  >
                    <div className="bg-surface-container-highest text-on-surface px-4 py-2 rounded-full shadow-md border border-outline-variant/30 flex items-center gap-2 text-xs font-bold active:scale-95 transition-transform">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        visibility
                      </span>
                      <span>Chạm để lật mở bản dịch</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BilingualReadingView;
