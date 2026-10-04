// src/components/pages/PageDictionary.jsx
// 100% Pixel-Perfect match to Stitch Design (desktop_dictionary.html & mobile_dictionary.html)
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

  const suggestedWords = ['resilient', 'abandon', 'make sense', 'meticulous', 'serendipity'];

  return (
    <div id="page-dictionary" className="page active min-h-screen text-[#2e2823] bg-[#fff9f0] font-['Quicksand',sans-serif]">

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (block lg:hidden) - 100% Match to mobile_dictionary.html    */}
      {/* ========================================================================= */}
      <div className="block lg:hidden w-full max-w-md mx-auto min-h-screen px-4 pt-3 pb-28 pwa-safe-top">
        {/* Mobile Header Bar */}
        <header className="flex justify-between items-center w-full py-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📖</span>
            <h1 className="text-2xl font-bold text-[#4b6540] tracking-tight">Từ điển</h1>
          </div>
          <span className="text-xs font-bold text-[#4b6540] bg-[#eef5ec] px-2.5 py-1 rounded-full border border-[#86a378]">
            HiVocab
          </span>
        </header>

        {/* Search Box */}
        <section className="w-full mb-4">
          <div
            ref={inputRef}
            className="border-[2.5px] border-[#3d352e] bg-white rounded-full p-1.5 pl-4 flex items-center justify-between shadow-[2px_3px_0px_rgba(61,53,46,0.15)] focus-within:ring-2 focus-within:ring-[#4b6540]/40 relative"
          >
            <div className="flex items-center space-x-2.5 flex-1 min-w-0 pr-2">
              <span className="text-lg text-[#74796f] flex-shrink-0">🔍</span>
              <input
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập từ, cụm từ hoặc thành ngữ..."
                className="w-full bg-transparent border-none p-0 text-sm font-bold text-[#1e1b17] placeholder-[#74796f] focus:outline-none"
                type="text"
              />
              {query && (
                <button onClick={clearInput} className="text-xs text-[#74796f] font-bold px-1.5">
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => searchWord()}
              className="bg-[#33302c] text-white text-xs px-5 py-2 rounded-full font-bold shadow-sm active:scale-95 transition-transform cursor-pointer"
              type="button"
            >
              Tra
            </button>

            {/* Mobile Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#3d352e] rounded-2xl shadow-[3px_4px_0px_#3d352e] overflow-hidden z-30">
                {suggestions.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    onClick={() => searchWord(s.word)}
                    className={`px-4 py-2.5 text-xs flex items-center justify-between cursor-pointer border-b border-gray-100 last:border-0 ${
                      activeSuggestIdx === idx ? 'bg-[#f4ede6] font-bold' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-bold text-[#1e1b17]">{s.word}</span>
                    <span className="text-[11px] text-[#74796f] truncate max-w-[180px]">{s.meaning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recent Searches Section */}
        {recentSearches.length > 0 && (
          <section className="w-full mb-5">
            <div className="flex justify-between items-center mb-2 px-1">
              <div className="flex items-center space-x-1 text-xs text-[#74796f] font-bold">
                <span>🕒</span>
                <span>TỪ VỪA TRA GẦN ĐÂY</span>
              </div>
              <button onClick={clearRecent} className="text-[11px] font-bold text-[#4b6540] hover:underline">
                Xóa tất cả
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentSearches.map((term, i) => (
                <div
                  key={i}
                  className="bg-white border-2 border-[#3d352e] px-3 py-1 rounded-full text-xs font-bold shadow-[1.5px_2px_0px_rgba(61,53,46,0.12)] flex items-center space-x-1.5"
                >
                  <span onClick={() => searchWord(term)} className="cursor-pointer">
                    {term}
                  </span>
                  <button onClick={() => removeRecent(term)} className="text-gray-400 hover:text-gray-700 ml-1 text-xs">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mobile Result State */}
        {status === 'loading' ? (
          <div className="py-16 text-center text-[#74796f]">
            <span className="inline-block text-3xl animate-spin mb-2">🔄</span>
            <p className="text-sm font-bold">Đang tra cứu từ điển...</p>
          </div>
        ) : status === 'error' ? (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-center text-red-700 text-xs font-bold">
            {errorMessage || 'Không tìm thấy từ vựng này. Vui lòng thử lại.'}
          </div>
        ) : result ? (
          <section className="bg-white border-[2.5px] border-[#3d352e] rounded-[24px] p-5 shadow-[3px_4px_0px_#3d352e] space-y-4">
            <div className="flex items-start justify-between pb-3 border-b-2 border-dashed border-[#e8e1db]">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-black text-[#1e1b17]">{result.word}</h2>
                  {result.cefr && (
                    <span className="bg-[#f5b745] text-xs font-black px-2 py-0.5 rounded-full border border-[#3d352e]">
                      {result.cefr}
                    </span>
                  )}
                  {result.pos && (
                    <span className="bg-[#e9f1e6] text-[#658a5c] text-xs font-bold px-2 py-0.5 rounded-md border border-[#658a5c]/30">
                      {result.pos}
                    </span>
                  )}
                </div>
                {formattedPhonetic && (
                  <div className="flex items-center space-x-2 mt-1 text-xs font-mono text-[#74796f]">
                    <span>{formattedPhonetic}</span>
                    <button
                      onClick={() => playAudio(result.word)}
                      className="px-2 py-0.5 rounded-md bg-[#FAF5EB] border border-[#3d352e] text-[10px] font-bold active:scale-95"
                    >
                      🔊 Nghe
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={openSaveModal}
                className="bg-[#e87248] text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-[#3d352e] shadow-xs active:scale-95"
              >
                + Thêm
              </button>
            </div>

            {/* Definitions */}
            {entriesToRender.map((entry, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-xs font-bold uppercase text-[#e87248] flex items-center gap-1">
                  <span>🏷️</span>
                  <span>NGHĨA TIẾNG VIỆT {entriesToRender.length > 1 ? `#${idx + 1}` : ''}</span>
                </div>
                <p className="text-base font-bold text-[#1e1b17] leading-snug">
                  {entry.meaning}
                </p>

                {entry.example && (
                  <div className="p-3 bg-[#FAF5EB] rounded-xl border border-dashed border-[#d8c8b4] text-xs text-[#594B43]">
                    <span className="font-bold text-[#e87248] block mb-0.5">Ví dụ:</span>
                    <p className="italic font-medium">"{entry.example}"</p>
                    {entry.example_vi && <p className="text-[11px] text-[#74796f] mt-1">→ {entry.example_vi}</p>}
                  </div>
                )}
              </div>
            ))}
          </section>
        ) : (
          <div className="bg-white border-2 border-[#3d352e] rounded-3xl p-6 text-center shadow-xs">
            <span className="text-4xl block mb-2">🔍</span>
            <h3 className="font-bold text-base text-[#1e1b17]">Tra cứu từ vựng tức thì</h3>
            <p className="text-xs text-[#74796f] mt-1 mb-4 leading-relaxed">
              Nhập từ vựng, thành ngữ hoặc cụm từ bất kỳ vào ô tìm kiếm bên trên để tra cứu nghĩa đầy đủ.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {suggestedWords.map((word) => (
                <button
                  key={word}
                  onClick={() => searchWord(word)}
                  className="px-3 py-1 rounded-full bg-[#fcf3e8] border border-[#3d352e] text-xs font-bold hover:bg-[#FAF5EB]"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (hidden lg:flex) - 100% Match to desktop_dictionary.html   */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-col min-w-0 flex-1 lg:pl-64 xl:pl-72">
        {/* Header Section */}
        <header className="p-8 pb-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-14 h-14 rounded-2xl bg-[#e9f1e6] border-2 border-[#3a342e] shadow-[2px_2px_0px_#3a342e] flex items-center justify-center text-3xl">
                📖
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-3xl font-extrabold text-[#2e2823] tracking-tight">Tra Cứu Từ Điển</h2>
                  <span className="text-xs font-bold bg-[#f5b745] border border-[#3a342e] px-2 py-0.5 rounded-full shadow-[2px_2px_0px_#3a342e]">
                    Song ngữ Anh - Việt
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#787067] mt-1">
                  Gõ bất kỳ từ vựng, cụm từ (phrasal verb) hoặc thành ngữ nào để tra đầy đủ phát âm, CEFR, nét nghĩa và ví dụ tranh vẽ.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-[#fffcf7] border-2 border-[#3a342e] px-3.5 py-1.5 rounded-2xl shadow-[2px_2px_0px_#3a342e] flex items-center space-x-2 text-xs font-bold">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                <span>Kho từ: 150.000+ từ sáp</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Search & Results */}
        <div className="max-w-6xl mx-auto px-8 w-full pb-12 space-y-7">
          {/* Big Search Bar Container */}
          <section className="space-y-4">
            <div
              ref={inputRef}
              className="relative bg-[#fffcf7] border-2 border-[#3a342e] rounded-full p-2 pl-6 shadow-[3px_3px_0px_#3a342e] flex items-center"
            >
              <span className="text-xl text-[#787067] mr-3">🔍</span>
              <input
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập từ, cụm từ hoặc thành ngữ..."
                className="w-full bg-transparent border-none text-base md:text-lg font-bold text-[#2e2823] placeholder:text-stone-400 focus:outline-none"
                type="text"
              />
              {query && (
                <button onClick={clearInput} className="text-sm text-stone-400 hover:text-stone-700 font-bold px-3">
                  ✕
                </button>
              )}
              <button
                onClick={() => searchWord()}
                className="bg-[#2e2823] hover:bg-stone-800 text-white font-bold text-sm md:text-base px-7 py-3 rounded-full border-2 border-[#3a342e] transition-transform active:scale-95 shadow-[2px_2px_0px_#3a342e] flex items-center space-x-2 cursor-pointer shrink-0"
              >
                <span>Tra từ</span>
              </button>

              {/* Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#fffcf7] border-2 border-[#3a342e] rounded-3xl shadow-[4px_4px_0px_#3a342e] overflow-hidden z-30">
                  {suggestions.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      onClick={() => searchWord(s.word)}
                      className={`px-6 py-3 text-sm flex items-center justify-between cursor-pointer border-b border-[#3a342e]/10 last:border-0 ${
                        activeSuggestIdx === idx ? 'bg-[#fdf0ea] font-bold' : 'hover:bg-[#faf6ee]'
                      }`}
                    >
                      <span className="font-bold text-[#2e2823]">{s.word}</span>
                      <span className="text-xs text-[#787067] truncate max-w-md">{s.meaning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Searches Row */}
            {recentSearches.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="flex items-center text-xs font-bold uppercase tracking-wider text-[#787067] mr-1">
                    <span className="mr-1">🕒</span> TỪ VỪA TRA GẦN ĐÂY:
                  </span>
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      className="bg-white border-2 border-[#3a342e] px-3 py-1 rounded-full text-xs font-bold shadow-[2px_2px_0px_#3a342e] hover:bg-stone-50 flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <span onClick={() => searchWord(term)}>{term}</span>
                      <span onClick={() => removeRecent(term)} className="text-stone-400 hover:text-stone-700 ml-1">
                        ✕
                      </span>
                    </button>
                  ))}
                </div>
                <button onClick={clearRecent} className="text-xs font-bold text-[#658a5c] hover:underline shrink-0 cursor-pointer">
                  Xóa tất cả
                </button>
              </div>
            )}

            {/* Suggested Words Row */}
            <div className="flex items-center flex-wrap gap-2 pt-1 text-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-[#787067] mr-1">
                ✨ TỪ KHÓA HAY GẶP:
              </span>
              {suggestedWords.map((word) => (
                <button
                  key={word}
                  onClick={() => searchWord(word)}
                  className="bg-[#fcf3e8] border border-[#3a342e] px-3 py-1 rounded-full text-xs font-bold hover:bg-[#fdf0ea] text-[#2e2823] cursor-pointer"
                >
                  {word}
                </button>
              ))}
            </div>
          </section>

          {/* Result Master-Detail Grid (12 cols) */}
          {status === 'loading' ? (
            <div className="py-24 text-center text-[#787067] bg-[#fffcf7] rounded-3xl border-2 border-[#3a342e]">
              <span className="inline-block text-4xl animate-spin mb-3">🔄</span>
              <p className="text-base font-bold">Đang tra cứu từ điển...</p>
            </div>
          ) : status === 'error' ? (
            <div className="p-8 bg-red-50 border-2 border-red-300 rounded-3xl text-center text-red-700 font-bold">
              {errorMessage || 'Không tìm thấy từ vựng này trong kho từ điển.'}
            </div>
          ) : result ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
              {/* Left Column: Word Details (7 cols) */}
              <section className="lg:col-span-7 space-y-6">
                <div className="bg-[#fffcf7] border-2 border-[#3a342e] rounded-3xl p-6 sm:p-7 shadow-[3px_3px_0px_#3a342e] space-y-6">
                  {/* Word Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b-2 border-[#3a342e]/30">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-4xl font-extrabold text-[#2e2823] tracking-tight">{result.word}</h3>
                        {result.cefr && (
                          <span className="bg-[#f5b745] border-2 border-[#3a342e] text-[#2e2823] text-xs font-black px-2.5 py-0.5 rounded-full shadow-[2px_2px_0px_#3a342e]">
                            {result.cefr}
                          </span>
                        )}
                        {result.pos && (
                          <span className="bg-[#e9f1e6] border border-[#3a342e] text-[#658a5c] text-xs font-bold px-2 py-0.5 rounded-md">
                            {result.pos}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 mt-2 text-sm font-semibold text-[#787067]">
                        {formattedPhonetic && <span className="font-mono text-base text-stone-700">{formattedPhonetic}</span>}
                        <button
                          onClick={() => playAudio(result.word)}
                          className="bg-white hover:bg-stone-100 border border-[#3a342e] px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-[2px_2px_0px_#3a342e] cursor-pointer"
                        >
                          <span>🔊 Phát âm</span>
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={openSaveModal}
                      className="bg-[#e87248] hover:bg-[#d96339] text-white border-2 border-[#3a342e] rounded-2xl px-4 py-2.5 text-sm font-extrabold shadow-[3px_3px_0px_#3a342e] flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
                    >
                      <span className="text-base leading-none">+</span>
                      <span>Thêm vào Sổ từ</span>
                    </button>
                  </div>

                  {/* Vietnamese Definition */}
                  {entriesToRender.map((entry, idx) => (
                    <div key={idx} className="space-y-3 pt-1 border-b border-[#3a342e]/10 pb-5 last:border-0 last:pb-0">
                      <div className="space-y-1.5">
                        <div className="text-xs font-extrabold tracking-wider uppercase text-[#e87248] flex items-center space-x-1.5">
                          <span>🏷️</span>
                          <span>NGHĨA TIẾNG VIỆT {entriesToRender.length > 1 ? `#${idx + 1}` : ''}</span>
                        </div>
                        <p className="text-xl font-bold text-[#2e2823] leading-snug">
                          {entry.meaning}
                        </p>
                      </div>

                      {entry.example && (
                        <div className="space-y-2">
                          <div className="text-xs font-extrabold tracking-wider uppercase text-[#2e2823] flex items-center space-x-1.5">
                            <span>💬</span>
                            <span>VÍ DỤ NGỮ CẢNH THỰC TẾ</span>
                          </div>
                          <div className="bg-[#fdf0ea]/60 border-2 border-dashed border-[#3a342e] p-4 rounded-2xl space-y-1.5">
                            <p className="text-sm font-bold text-[#2e2823] leading-relaxed">
                              "{entry.example}"
                            </p>
                            {entry.example_vi && (
                              <p className="text-xs font-semibold text-[#787067]">
                                → {entry.example_vi}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Right Column: Mascot Co-learner & Memory Tip (5 cols) */}
              <section className="lg:col-span-5 space-y-6">
                <div className="bg-[#fffcf7] border-2 border-[#3a342e] rounded-3xl p-6 shadow-[3px_3px_0px_#3a342e] relative overflow-hidden">
                  <div className="text-center space-y-3">
                    <div className="inline-block bg-[#e9f1e6] text-[#658a5c] border border-[#3a342e] px-3 py-1 rounded-full text-xs font-bold">
                      🐾 Bạn đồng hành học từ vựng
                    </div>
                    <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                      <img
                        alt="Bé Hổ Mascot"
                        src="/mascot/mascot_cozy.png"
                        className="w-full h-full object-contain filter drop-shadow-sm transition-transform hover:scale-105 duration-300 mix-blend-multiply"
                      />
                    </div>
                    <div className="relative bg-white border-2 border-[#3a342e] rounded-2xl p-3.5 shadow-[2px_2px_0px_#3a342e] text-left">
                      <div className="text-xs font-extrabold text-[#e87248]">Bé Hổ Churbito gợi ý:</div>
                      <p className="text-xs font-bold text-[#2e2823] mt-1 leading-relaxed">
                        "Lưu từ <strong className="text-[#e87248] underline">{result.word}</strong> vào Sổ từ cá nhân ngay để thuật toán SRS nhắc bạn ôn lại sau 1 giờ nhé!"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-[#3a342e] rounded-3xl p-5 shadow-[2px_2px_0px_#3a342e] space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">⚡</span>
                    <h4 className="font-bold text-sm text-[#2e2823]">Thao tác nhanh</h4>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => copyWord(result.word)}
                      className="w-full text-left p-2.5 rounded-xl border border-[#3a342e] text-xs font-bold hover:bg-[#fdf0ea] transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>📋 Sao chép từ vựng</span>
                      <span className="text-xs">→</span>
                    </button>
                    <button
                      onClick={openSaveModal}
                      className="w-full text-left p-2.5 rounded-xl bg-[#e87248] text-white text-xs font-bold hover:bg-[#d96339] transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>💾 Lưu vào Sổ từ</span>
                      <span className="text-xs">→</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="bg-[#fffcf7] border-2 border-[#3a342e] rounded-3xl p-12 text-center shadow-[3px_3px_0px_#3a342e]">
              <span className="text-5xl block mb-3">📖</span>
              <h3 className="text-xl font-black text-[#2e2823]">Tra cứu từ vựng cùng HiVocab</h3>
              <p className="text-sm font-semibold text-[#787067] mt-1 max-w-md mx-auto">
                Nhập từ tiếng Anh để khám phá phiên âm, nghĩa tiếng Việt chuẩn xác và ví dụ ngữ cảnh sinh động.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default PageDictionary;
