// src/components/pages/PageDictionary.jsx
// Pixel-Perfect React Component with Reactive State, Autocomplete & Instant Audio
import React, { useRef, useEffect } from 'react';
import { useDictionary } from '../../hooks/useDictionary.js';

export function PageDictionary() {
  const {
    query,
    status,
    result,
    errorMessage,
    recentSearches,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    activeSuggestIdx,
    setActiveSuggestIdx,
    handleInputChange,
    searchWord,
    clearInput,
    removeRecent,
    clearRecent,
    playAudio,
    copyWord,
    openSaveModal,
  } = useDictionary();

  const inputRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [setShowSuggestions]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (showSuggestions && activeSuggestIdx >= 0 && suggestions[activeSuggestIdx]) {
        searchWord(suggestions[activeSuggestIdx].word);
      } else {
        searchWord();
      }
    } else if (e.key === 'ArrowDown') {
      if (showSuggestions && suggestions.length > 0) {
        e.preventDefault();
        setActiveSuggestIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      if (showSuggestions && suggestions.length > 0) {
        e.preventDefault();
        setActiveSuggestIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const highlightMatch = (text, matchWord) => {
    if (!text || !matchWord) return text;
    const regex = new RegExp(`(${matchWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === matchWord.toLowerCase() ? (
        <strong key={i} className="text-primary font-bold">
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  const formattedPhonetic = result
    ? result.phonetic || result.phonetics?.us || result.phonetics?.uk || ''
    : '';

  const entriesToRender = result
    ? Array.isArray(result.entries) && result.entries.length > 0
      ? result.entries
      : Array.isArray(result.senses) && result.senses.length > 0
      ? result.senses.map((s) => ({
          meaning: s.definition_vi || s.definition_en || '',
          pos: s.grammar ? s.grammar.replace(/[\[\]]/g, '').trim() : result.pos || '',
          example: s.examples?.[0]?.en || '',
          example_vi: s.examples?.[0]?.vi || '',
        }))
      : [
          {
            meaning: result.meaning || result.viSummary || '',
            pos: result.pos || '',
            example: result.example || '',
            example_vi: result.example_vi || '',
          },
        ]
    : [];

  const viSummary = result ? result.meaning || result.viSummary || result.senses?.[0]?.definition_vi || '' : '';

  const sampleWords = ['abandon', 'resilient', 'make sense', 'meticulous'];

  return (
    <div id="page-dictionary" className="page active">
      <main className="lg:ml-64 min-h-screen mobile-page-top lg:pt-8 pb-28 lg:pb-12 px-4 sm:px-6 lg:px-12 flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col gap-6 fade-in">
          {/* Header */}
          <header className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">menu_book</span>
              <h1 className="text-2xl lg:text-headline-lg font-bold text-on-surface">Từ điển</h1>
            </div>
          </header>

          {/* Search bar */}
          <div ref={inputRef} className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[22px]">
              search
            </span>
            <input
              id="dict-input"
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Nhập từ hoặc cụm từ tiếng Anh để tra từ điển"
              placeholder="Nhập từ, cụm từ hoặc thành ngữ tiếng Anh..."
              autoComplete="off"
              spellCheck="false"
              className="w-full pl-12 pr-28 py-4 bg-surface-container-lowest/80 backdrop-blur-[24px] border border-outline-variant/30 rounded-2xl text-on-surface placeholder:text-outline focus:border-primary focus:outline-none text-base md:text-lg transition-colors shadow-sm"
            />

            {query && (
              <button
                id="dict-clear-btn"
                type="button"
                onClick={clearInput}
                title="Xóa tìm kiếm"
                className="absolute right-20 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => searchWord()}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-surface-tint active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              Tra
            </button>

            {/* Autocomplete suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                id="dict-suggestions-dropdown"
                className="absolute left-0 right-0 top-full mt-2 bg-surface-container-lowest/95 backdrop-blur-[24px] border border-outline-variant/30 rounded-2xl soft-shadow overflow-hidden z-50 divide-y divide-outline-variant/15 max-h-80 overflow-y-auto"
              >
                {suggestions.map((item, idx) => {
                  const isMatch = item.word.toLowerCase().startsWith(query.toLowerCase());
                  const matchPart = isMatch ? item.word.slice(0, query.length) : '';
                  const restPart = isMatch ? item.word.slice(query.length) : item.word;

                  return (
                    <div
                      key={idx}
                      onClick={() => searchWord(item.word)}
                      className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                        activeSuggestIdx === idx
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-surface-container-high/60 text-on-surface'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-outline text-[18px]">search</span>
                        <span className="font-semibold text-sm">
                          {isMatch ? (
                            <>
                              <strong className="text-primary font-black underline decoration-primary/40">
                                {matchPart}
                              </strong>
                              {restPart}
                            </>
                          ) : (
                            item.word
                          )}
                        </span>
                        {item.pos && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                            {item.pos}
                          </span>
                        )}
                      </div>
                      {item.meaning && (
                        <span className="text-xs text-on-surface-variant truncate max-w-xs">{item.meaning}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent searches chips */}
          {recentSearches.length > 0 && (
            <div id="dict-recent-wrap" className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">history</span>
                  Từ vừa tra gần đây
                </span>
                <button
                  type="button"
                  onClick={clearRecent}
                  className="text-xs text-primary/80 hover:text-primary hover:underline cursor-pointer"
                >
                  Xóa tất cả
                </button>
              </div>
              <div id="dict-recent-chips" className="flex flex-wrap gap-2">
                {recentSearches.map((w, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/30 cursor-pointer transition-colors"
                  >
                    <span onClick={() => searchWord(w)}>{w}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecent(w);
                      }}
                      className="text-outline hover:text-red-500 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading state */}
          {status === 'loading' && (
            <div id="dict-loading" className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative w-14 h-14">
                <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                <span className="material-symbols-outlined text-primary text-[22px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  menu_book
                </span>
              </div>
              <p id="dict-loading-title" className="text-on-surface font-semibold text-base">
                Đang tra cứu từ điển...
              </p>
              <p id="dict-loading-desc" className="text-on-surface-variant text-xs">
                Tra cứu định nghĩa song ngữ và ví dụ thực tế
              </p>
            </div>
          )}

          {/* Error / Not found state */}
          {status === 'error' && (
            <div id="dict-error" className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <span className="material-symbols-outlined text-[56px] text-outline">search_off</span>
              <h3 className="font-bold text-on-surface text-xl">Không tìm thấy từ này</h3>
              <p id="dict-error-desc" className="text-on-surface-variant text-sm max-w-sm">
                {errorMessage || 'Kiểm tra lại chính tả hoặc thử các từ thông dụng khác.'}
              </p>
            </div>
          )}

          {/* Result container */}
          {status === 'result' && result && (
            <div id="dict-result" className="flex flex-col gap-6">
              {/* Word Header Card */}
              <div className="glass-card soft-shadow rounded-2xl p-6 md:p-8">
                {/* Row 1: Word + Badges + Actions */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 id="dict-word" className="text-3xl md:text-5xl font-black text-on-surface tracking-tight">
                        {result.word}
                      </h2>
                      {result.cefr && (
                        <span
                          id="dict-cefr-badge"
                          className="px-2.5 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-primary text-on-primary"
                        >
                          {result.cefr}
                        </span>
                      )}
                      <span
                        id="dict-pos-badge"
                        className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-surface-container text-on-surface-variant"
                      >
                        {result.pos || 'từ vựng'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id="dict-copy-btn"
                      type="button"
                      onClick={() => copyWord(result.word)}
                      title="Sao chép từ"
                      className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">content_copy</span>
                    </button>
                    <button
                      id="dict-save-btn"
                      type="button"
                      onClick={openSaveModal}
                      title="Lưu vào Sổ từ vựng"
                      className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center gap-2 shadow hover:bg-surface-tint active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
                      <span>Lưu từ</span>
                    </button>
                  </div>
                </div>

                {/* Pronunciation Row */}
                <div className="flex items-center gap-3.5 mt-5 pt-5 border-t border-outline-variant/20">
                  <span id="dict-phonetic" className="font-mono text-base md:text-xl text-primary font-bold tracking-wide">
                    {formattedPhonetic ? (formattedPhonetic.startsWith('/') ? formattedPhonetic : `/${formattedPhonetic}/`) : ''}
                  </span>
                  <button
                    id="dict-audio-btn"
                    type="button"
                    onClick={() => playAudio(result.word)}
                    title="Nghe phát âm"
                    className="w-10 h-10 rounded-full bg-primary text-on-primary hover:bg-surface-tint active:scale-95 flex items-center justify-center shadow transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[22px]">volume_up</span>
                  </button>
                </div>

                {/* Row 3: Quick Vietnamese Summary Banner */}
                {viSummary && (
                  <div
                    id="dict-summary-wrap"
                    className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3"
                  >
                    <span className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5">translate</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">Nghĩa tiếng Việt</p>
                      <p id="dict-vi-summary" className="text-base md:text-lg font-bold text-on-surface leading-snug">
                        {viSummary}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Senses & Definitions Section */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-outline uppercase tracking-widest flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">format_quote</span>
                    Chi tiết nghĩa &amp; Ví dụ
                  </h3>
                </div>
                <div id="dict-meanings" className="flex flex-col gap-4">
                  {entriesToRender.map((entry, idx) => (
                    <div
                      key={idx}
                      className="glass-card soft-shadow rounded-2xl p-5 md:p-6 border border-outline-variant/20 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {entriesToRender.length > 1 && (
                            <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-black flex items-center justify-center shrink-0 shadow-xs">
                              {idx + 1}
                            </span>
                          )}
                          {entry.pos && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
                              {entry.pos}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== 'undefined' && typeof window.dictOpenSaveModal === 'function') {
                              window.dictOpenSaveModal(idx);
                            } else {
                              openSaveModal();
                            }
                          }}
                          title="Lưu nét nghĩa này vào Sổ từ"
                          className="text-xs font-bold text-primary hover:text-surface-tint flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">bookmark_add</span>
                          <span>Lưu nghĩa này</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-1">
                        <p className="text-base md:text-lg font-bold text-on-surface leading-snug">{entry.meaning}</p>
                      </div>

                      {entry.example && (
                        <div className="mt-3 pl-3.5 border-l-2 border-primary/60">
                          <p className="text-sm md:text-base text-on-surface leading-relaxed">
                            {highlightMatch(entry.example, result.word)}
                          </p>
                          {entry.example_vi && (
                            <p className="text-xs md:text-sm text-on-surface-variant italic mt-1">
                              {entry.example_vi}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Collocations & Idioms Card */}
              {result.collocations && result.collocations.length > 0 && (
                <div id="dict-collocations-wrap" className="glass-card soft-shadow rounded-2xl p-6">
                  <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">link</span>
                    Cụm từ &amp; Thành ngữ thường gặp (Collocations &amp; Idioms)
                  </h4>
                  <div id="dict-collocations-list" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.collocations.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-surface-container/60 hover:bg-surface-container border border-outline-variant/20 transition-colors flex flex-col gap-0.5"
                      >
                        <span
                          onClick={() => searchWord(c.phrase)}
                          className="font-bold text-sm text-primary cursor-pointer hover:underline"
                        >
                          {c.phrase}
                        </span>
                        <span className="text-xs text-on-surface-variant">{c.meaning || ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Word Family & Synonyms Card */}
              {((result.word_family && Object.keys(result.word_family).length > 0) ||
                (result.synonyms && result.synonyms.length > 0)) && (
                <div id="dict-extras-wrap" className="glass-card soft-shadow rounded-2xl p-6 flex flex-col gap-5">
                  {result.word_family && Object.keys(result.word_family).length > 0 && (
                    <div id="dict-family-wrap" className="flex flex-col gap-2.5">
                      <h4 className="text-xs font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-primary">family_restroom</span>
                        Gia đình từ vựng (Word Family)
                      </h4>
                      <div id="dict-family-list" className="flex flex-wrap gap-2">
                        {Object.entries(result.word_family).map(([k, v], idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/25 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <span className="text-outline uppercase text-[10px]">{k}:</span>
                            <span
                              onClick={() => searchWord(v)}
                              className="text-on-surface font-bold cursor-pointer hover:text-primary hover:underline"
                            >
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.synonyms && result.synonyms.length > 0 && (
                    <div
                      id="dict-synonyms-wrap"
                      className="flex flex-col gap-2.5 pt-4 border-t border-outline-variant/20"
                    >
                      <h4 className="text-xs font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-primary">sync_alt</span>
                        Từ đồng nghĩa (Synonyms)
                      </h4>
                      <div id="dict-synonyms" className="flex flex-wrap gap-2">
                        {result.synonyms.map((s, idx) => (
                          <span
                            key={idx}
                            onClick={() => searchWord(s)}
                            className="px-3 py-1.5 rounded-full bg-secondary-container/60 hover:bg-secondary-container text-on-secondary-container text-xs font-semibold cursor-pointer transition-colors"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Empty state (initial) */}
          {status === 'empty' && (
            <div id="dict-empty" className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                <span className="material-symbols-outlined text-[44px]">menu_book</span>
              </div>
              <h3 className="font-bold text-on-surface text-xl">Tra cứu từ điển</h3>
              <p className="text-on-surface-variant text-sm max-w-sm">
                Gõ bất kỳ từ vựng, cụm từ (phrasal verb) hoặc thành ngữ nào để xem đầy đủ phát âm, cấp độ CEFR, các nét
                nghĩa và ví dụ thực tế.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {sampleWords.map((w, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => searchWord(w)}
                    className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/30 transition-colors cursor-pointer"
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default PageDictionary;
