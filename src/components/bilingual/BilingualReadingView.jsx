// src/components/bilingual/BilingualReadingView.jsx
// Chế độ Đọc Chủ Động Song Ngữ - Phong cách Cozy Crayon ấm áp

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
        className="inline-flex items-baseline px-2 py-0.5 mx-0.5 rounded-lg bg-[#FFF2D6] hover:bg-[#FFE6B3] text-[#B85D19] font-black border border-[#D36135]/40 border-b-2 border-b-[#D36135] cursor-pointer transition-all active:scale-95 shadow-2xs select-text"
        title="Nhấp để xem nghĩa & phát âm 🐾"
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
    <div className="max-w-6xl mx-auto w-full pb-20 select-none">
      {/* Thông tin tiêu đề bài đọc */}
      <div className="bg-[#FFFDF9] rounded-3xl border-2 border-[#382E2B] shadow-[3px_4px_0px_#382E2B] p-5 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase bg-[#E5EFE2] text-[#557A46] border border-[#8FB383]">
                IELTS Reading Passage {passage?.passageNumber || ''}
              </span>
              {passage?.topicLabel && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#FAF5EB] text-[#766C5F] border border-[#382E2B]/30">
                  {passage.topicLabel}
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-heading font-black text-[#382E2B] leading-tight">
              {passage?.title || `Passage ${passage?.passageNumber || ''}`}
            </h2>
            <p className="text-xs font-semibold text-[#766C5F] mt-1">
              {totalParas} đoạn văn · {words.length} từ vựng trọng tâm trong bài 🐾
            </p>
          </div>

          {/* Nút thao tác nhanh toàn bài */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onRevealAll}
              className="px-3.5 py-2 rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#382E2B] text-xs font-black border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center gap-1.5 transition-all active:translate-y-0.5 cursor-pointer"
              title="Mở toàn bộ bản dịch tiếng Việt"
            >
              <span>👁️</span>
              <span>Hiện tất cả</span>
            </button>
            <button
              type="button"
              onClick={onHideAll}
              className="px-3.5 py-2 rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#382E2B] text-xs font-black border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center gap-1.5 transition-all active:translate-y-0.5 cursor-pointer"
              title="Che toàn bộ bản dịch tiếng Việt"
            >
              <span>🙈</span>
              <span>Che tất cả</span>
            </button>
          </div>
        </div>

        {/* Hướng dẫn chế độ Curtain Mode */}
        <div className="mt-4 pt-3 border-t-2 border-dashed border-[#EFE8D6] flex items-center gap-2 text-xs font-semibold text-[#766C5F]">
          <span className="text-base select-none">💡</span>
          <span>
            <strong className="text-[#382E2B]">Mẹo học chủ động:</strong> Cột tiếng Việt mặc định được che rèm. Hãy đọc đoạn văn tiếng Anh trước và tự dịch trong đầu, sau đó chạm vào bản dịch để đối chiếu.
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
                className="bg-[#FFFDF9] rounded-3xl border-2 border-[#382E2B] shadow-[3px_4px_0px_#382E2B] p-5 md:p-6"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-dashed border-[#EFE8D6]">
                  <span className="text-xs font-black text-[#5a7d4d] uppercase tracking-wider">
                    {paraLabel}
                  </span>
                </div>
                <div className={`text-[#382E2B] font-medium text-justify ${fontClass}`}>
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
                className="bg-[#FFFDF9] rounded-3xl border-2 border-[#382E2B] shadow-[3px_4px_0px_#382E2B] p-5 md:p-6"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-dashed border-[#EFE8D6]">
                  <span className="text-xs font-black text-[#D36135] uppercase tracking-wider">
                    {paraLabel} · Bản dịch đối ứng
                  </span>
                </div>
                <div className={`text-[#382E2B] font-medium text-justify ${fontClass}`}>
                  {viP || <span className="italic text-[#9C8F85]">Đang cập nhật bản dịch...</span>}
                </div>
              </div>
            );
          }

          // Chế độ Song Ngữ: Parallel Columns (Desktop) & Stacked (Mobile) với Curtain Mode
          return (
            <div
              key={i}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-[#FFFDF9] rounded-3xl border-2 border-[#382E2B] shadow-[3px_4px_0px_#382E2B] p-5 md:p-6 hover:shadow-[5px_6px_0px_#382E2B] transition-all"
            >
              {/* Cột tiếng Anh */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-dashed border-[#EFE8D6]">
                    <span className="text-xs font-black text-[#5a7d4d] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#5a7d4d]" />
                      {paraLabel} · English
                    </span>
                  </div>
                  <div className={`text-[#382E2B] font-medium text-justify ${fontClass}`}>
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
              <div className="relative overflow-hidden rounded-2xl border-2 border-[#382E2B] bg-[#FFF8EE] p-4 transition-all flex flex-col justify-between min-h-[7rem]">
                <div>
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#382E2B]/20">
                    <span className="text-xs font-black text-[#D36135] uppercase tracking-wider flex items-center gap-1.5">
                      <span>📖</span>
                      Bản dịch đối ứng
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleCurtain(i)}
                      className="text-xs font-black px-2.5 py-1 rounded-xl bg-white border border-[#382E2B] text-[#382E2B] shadow-2xs hover:bg-[#FAF5EB] cursor-pointer"
                    >
                      {isRevealed ? '🙈 Che lại' : '👁️ Hiện dịch'}
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
                    <div className={`text-[#382E2B] font-medium text-justify ${fontClass}`}>
                      {viP || (
                        <span className="italic text-[#9C8F85]">Đang cập nhật bản dịch...</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Overlay rèm che khi chưa mở */}
                {!isRevealed && (
                  <div
                    onClick={() => onToggleCurtain(i)}
                    className="absolute inset-0 z-10 bg-[#FAF5EB]/95 backdrop-blur-[2px] flex items-center justify-center cursor-pointer hover:bg-[#F3E7D5]/90 transition-all select-none"
                  >
                    <div className="bg-white text-[#382E2B] px-4 py-2 rounded-2xl shadow-[2px_3px_0px_#382E2B] border-2 border-[#382E2B] flex items-center gap-2 text-xs font-black active:translate-y-0.5">
                      <span>📖</span>
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
