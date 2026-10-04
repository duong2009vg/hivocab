// src/components/learning/ExerciseFlashcard.jsx
// 100% Pixel-Perfect match to Google Stitch design (both Desktop & Mobile)
import React, { useState, useEffect, useCallback } from 'react';

export default function ExerciseFlashcard({ item, onRate, onReport, sessionInfo }) {
  const [flipped, setFlipped] = useState(false);
  const d = item?.exerciseData || {};

  const currentNum = sessionInfo?.currentNum ?? 1;
  const totalNum = sessionInfo?.totalNum ?? 10;

  // Reset flip state when new card appears
  useEffect(() => {
    setFlipped(false);
  }, [item]);

  // Keyboard: Space/Enter = flip; 1 = Hard/Cần ôn lại; 2 = Easy/Đã nhớ kỹ
  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (flipped) {
        if (e.key === '1') {
          e.preventDefault();
          onRate('hard');
        }
        if (e.key === '2') {
          e.preventDefault();
          onRate('easy');
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flipped, onRate]);

  const flip = useCallback(() => {
    setFlipped((f) => !f);
  }, []);

  const playAudio = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      const word = d.backWord || d.frontWord;
      if (window.HiAudio?.playWord) {
        window.HiAudio.playWord(word, 0.9);
      } else if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(word);
        u.lang = 'en-US';
        window.speechSynthesis.speak(u);
      }
    },
    [d.backWord, d.frontWord]
  );

  return (
    <div className="w-full flex flex-col items-center select-none font-comfortaa">
      {/* Main Workspace (Row layout on desktop with Left Companion + Right Tips) */}
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10 py-2">
        {/* ── Left Companion Mascot Sidebar (Desktop xl:flex) ── */}
        <aside className="hidden xl:flex flex-col items-center w-72 shrink-0">
          <div className="relative bg-white border-2 border-[#2D2825] rounded-2xl p-4 shadow-[4px_4px_0px_#2D2825] text-xs font-semibold text-stone-700 leading-relaxed mb-4">
            <p className="font-bold text-[#264653] text-sm mb-1 flex items-center gap-1.5">
              <span>🐾</span> Bé Hổ Churbito
            </p>
            "Cố lên bạn nhé! Đã hoàn thành{' '}
            <strong className="text-[#e89868]">
              {currentNum}/{totalNum} từ
            </strong>{' '}
            rồi, lật thẻ và đọc to từ vựng là nhớ siêu lâu đó!"
            <div className="absolute -bottom-2.5 left-12 w-4 h-4 bg-white border-b-2 border-r-2 border-[#2D2825] transform rotate-45"></div>
          </div>

          <div className="relative w-48 h-48 flex items-center justify-center">
            <img
              alt="Bé hổ Churbito đồng hành cùng bạn"
              className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm select-none pointer-events-none transform hover:scale-105 transition-transform"
              src="/mascot/mascot_cozy.png"
              onError={(e) => {
                e.currentTarget.src =
                  'https://lh3.googleusercontent.com/aida/AEtjO1WhLdB59cxwqOugmyuan_YP_-qByGV59-nTiw2fcRTppnlmKwFY8CyUY3A0FKztN21eVPSSgsRaLdVu6ad_QcR6Ev8llHmy6VYJY0Px6ys8ENmMB5wpcrhDcFXKQuRX5c79HZecsOmdanQxxLirnu3eZ2vuPAdsCSdyPCNgllA2TSndkn-YTmLyXgBT029ah-2pOgpwJe68c6qed5T5h4YeWIR1EOhKTzuxU_BZb13bVMKFicCPACxDy27z';
              }}
            />
          </div>

          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 rounded-full border border-[#2D2825]/30 text-[11px] font-bold text-stone-600 shadow-xs">
            🌱 Người bạn học tập chăm chỉ
          </div>
        </aside>

        {/* ── Center Flashcard Card ── */}
        <section className="flex flex-col items-center w-full max-w-xl sm:max-w-2xl">
          <div
            onClick={flip}
            tabIndex={0}
            role="button"
            aria-label="Thẻ ghi nhớ - Chạm để lật thẻ"
            className="w-full cursor-pointer focus:outline-none"
          >
            {!flipped ? (
              /* ── FRONT FACE ── */
              <div className="relative w-full min-h-[460px] sm:min-h-[500px] bg-white rounded-[32px] sm:rounded-[36px] border-[3.5px] border-[#2D2825] shadow-[6px_8px_0px_#2D2825] sm:shadow-[8px_10px_0px_rgba(45,40,37,0.95)] p-6 sm:p-9 flex flex-col justify-between items-center text-center transition-transform hover:-translate-y-1 duration-200">
                {/* Header ribbon inside card */}
                <div className="w-full flex items-center justify-between pb-3 border-b-2 border-stone-200/70">
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#EDF6F9] border-2 border-[#2D2825] rounded-full shadow-[2px_2px_0px_#2D2825]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#264653]"></span>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-[#264653]">
                      {d.frontLabel || 'DỊCH SANG TIẾNG ANH'}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border-2 border-[#2D2825] rounded-full shadow-[2px_2px_0px_#2D2825] text-xs font-bold text-stone-700 transition-colors">
                    <span className="material-symbols-outlined text-[15px] text-[#e89868]">touch_app</span>
                    <span>Chạm để lật</span>
                  </div>
                </div>

                {/* Center Mascot / Word Art Illustration */}
                <div className="my-3 sm:my-5 relative flex items-center justify-center w-40 h-40 sm:w-48 sm:h-48">
                  <div className="absolute inset-0 bg-[#FFF5EB] rounded-full border-2 border-dashed border-[#E76F51]/30"></div>
                  {d.imageUrl ? (
                    <img
                      alt={d.frontWord}
                      className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-2xl select-none"
                      src={d.imageUrl}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <img
                      alt="Bé hổ học tập"
                      className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 object-contain mix-blend-multiply select-none"
                      src="/mascot/mascot_cozy.png"
                    />
                  )}
                  <span className="absolute -top-1 -right-2 text-[#feab79] text-xl animate-bounce">✨</span>
                </div>

                {/* Word Prompt Content */}
                <div className="space-y-2 max-w-lg my-auto">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2D2825] tracking-normal leading-snug">
                    {d.frontWord}
                  </h2>
                  {(d.exampleSentence || d.hint) && (
                    <p className="font-serif italic text-base sm:text-lg text-stone-600 px-4">
                      "{d.exampleSentence || d.hint}"
                    </p>
                  )}
                </div>

                {/* Primary Action Button: Reveal Answer */}
                <div className="w-full pt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      flip();
                    }}
                    className="w-full sm:w-4/5 mx-auto py-3.5 sm:py-4 px-6 bg-[#214b60] hover:bg-[#1B353F] active:translate-y-1 text-white font-bold text-base sm:text-lg rounded-full border-2 border-[#2D2825] shadow-[4px_4px_0px_#2D2825] flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      visibility
                    </span>
                    <span>Nhấn xem đáp án</span>
                    <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded font-mono">
                      Space
                    </kbd>
                  </button>
                </div>
              </div>
            ) : (
              /* ── BACK FACE (Revealed English Answer) ── */
              <div className="relative w-full min-h-[460px] sm:min-h-[500px] bg-[#f9fbf7] rounded-[32px] sm:rounded-[36px] border-[3.5px] border-[#4b6540] shadow-[6px_8px_0px_#2D2825] sm:shadow-[8px_10px_0px_rgba(45,40,37,0.95)] p-6 sm:p-9 flex flex-col justify-between items-center text-center transition-transform hover:-translate-y-1 duration-200">
                {/* Header ribbon back */}
                <div className="w-full flex items-center justify-between pb-3 border-b-2 border-[#4b6540]/20">
                  <span className="px-3.5 py-1.5 bg-[#ffdbc9] border-2 border-[#2D2825] rounded-full shadow-[2px_2px_0px_#2D2825] text-xs sm:text-sm font-extrabold uppercase text-[#8d4e24]">
                    {d.backLabel || 'ĐÁP ÁN TIẾNG ANH'}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      flip();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 border-2 border-[#2D2825] rounded-full shadow-[2px_2px_0px_#2D2825] text-xs font-bold text-stone-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px] text-[#4b6540]">sync</span>
                    <span>Quay lại</span>
                  </button>
                </div>

                {/* Revealed Word Content */}
                <div className="flex flex-col items-center justify-center text-center my-auto py-2 w-full">
                  <span className="text-xs sm:text-sm font-bold text-[#4b6540] tracking-widest uppercase mb-1">
                    {d.pos ? `${d.pos.toUpperCase()}` : 'TỪ VỰNG TIẾNG ANH'}
                  </span>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#203918] tracking-tight mt-0 mb-2">
                    {d.backWord}
                  </h1>

                  <div className="flex items-center gap-2 bg-[#eef4eb] px-4 py-1.5 rounded-full border-2 border-[#4b6540]/30 text-[#4b6540] font-bold text-sm sm:text-base mb-3">
                    <span>/{d.phonetic || ''}/</span>
                    <button
                      type="button"
                      aria-label="Nghe đọc từ"
                      onClick={playAudio}
                      className="p-1 rounded-full text-[#4b6540] hover:scale-110 active:scale-95 transition-transform"
                    >
                      <span className="material-symbols-outlined text-[20px]">volume_up</span>
                    </button>
                  </div>

                  {/* Example sentence slip */}
                  {(d.exampleSentence || d.frontWord) && (
                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-[#2D2825]/20 text-left w-full max-w-md shadow-xs">
                      <p className="font-bold text-stone-800 text-sm sm:text-base">
                        🧸 {d.exampleSentence || d.backWord}
                      </p>
                      <p className="text-xs sm:text-sm text-stone-600 italic mt-0.5">
                        {d.exampleMeaning || d.frontWord}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Evaluation Feedback */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full sm:w-5/6 pt-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRate('hard');
                    }}
                    className="h-12 sm:h-14 bg-white text-[#8d4e24] hover:bg-orange-50 rounded-full border-2 border-[#2D2825] shadow-[3px_3px_0px_#2D2825] flex items-center justify-center gap-1.5 sm:gap-2 font-bold text-xs sm:text-sm active:translate-y-1 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[19px]">sentiment_neutral</span>
                    <span>Cần ôn lại</span>
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-stone-100 border border-stone-300 rounded font-mono">
                      1
                    </kbd>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRate('easy');
                    }}
                    className="h-12 sm:h-14 bg-[#86a378] hover:bg-[#739464] text-white rounded-full border-2 border-[#2D2825] shadow-[3px_3px_0px_#2D2825] flex items-center justify-center gap-1.5 sm:gap-2 font-bold text-xs sm:text-sm active:translate-y-1 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    <span>Đã nhớ kỹ</span>
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-white/20 rounded font-mono">
                      2
                    </kbd>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Keyboard Shortcuts Hint */}
          <div className="mt-5 hidden sm:flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-stone-600">
            <span className="inline-flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-lg border border-[#2D2825]/20 shadow-xs">
              <kbd className="px-2 py-0.5 bg-stone-100 border border-[#2D2825]/40 rounded text-xs font-mono font-bold text-stone-800">
                [Space]
              </kbd>
              Lật thẻ
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-lg border border-[#2D2825]/20 shadow-xs">
              <kbd className="px-2 py-0.5 bg-stone-100 border border-[#2D2825]/40 rounded text-xs font-mono font-bold text-stone-800">
                [1]
              </kbd>
              Chưa thuộc
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-lg border border-[#2D2825]/20 shadow-xs">
              <kbd className="px-2 py-0.5 bg-stone-100 border border-[#2D2825]/40 rounded text-xs font-mono font-bold text-stone-800">
                [2]
              </kbd>
              Đã nhớ từ này
            </span>
          </div>
        </section>

        {/* ── Right Companion Study Tips Panel (Desktop xl:flex) ── */}
        <aside className="hidden xl:flex flex-col gap-4 w-72 shrink-0">
          <div className="bg-white border-2 border-[#2D2825] rounded-3xl p-5 shadow-[4px_4px_0px_#2D2825]">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-xl">💡</span>
              <h3 className="font-extrabold text-sm text-[#2D2825]">Mẹo Ghi Nhớ Sáp Màu</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-semibold">
              Hãy nhẩm to nghĩa tiếng Anh trước khi bấm lật thẻ. Việc kích hoạt phản xạ tự nhớ giúp não bộ lưu trữ từ mới sâu hơn 300% so với việc chỉ đọc lướt!
            </p>
          </div>

          <div className="bg-[#FFF5EB] border-2 border-[#2D2825] rounded-3xl p-4 shadow-[2px_2px_0px_#2D2825] flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#E76F51] uppercase">Chu kỳ lặp lại SRS</p>
              <p className="text-xs font-extrabold text-stone-700">Lần 2: Sau 12 giờ tới</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-white border border-[#2D2825] flex items-center justify-center font-bold text-xs shadow-xs">
              ⏳
            </div>
          </div>
        </aside>
      </div>

      {/* Encouragement Hint Footer Note */}
      <footer className="mt-4 flex items-center justify-between w-full max-w-xl px-2 text-xs font-bold text-stone-600">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border-2 border-[#2D2825] shadow-[2px_2px_0px_#2D2825]">
          <span className="text-sm">✏️</span>
          <span>Lật thẻ để ghi nhớ từ vựng lâu hơn nha!</span>
        </div>

        <button
          type="button"
          onClick={onReport}
          className="w-9 h-9 rounded-full bg-white border-2 border-[#2D2825] shadow-[2px_2px_0px_#2D2825] flex items-center justify-center text-red-500 hover:bg-red-50 active:translate-y-0.5 transition-all"
          title="Báo cáo câu hỏi này"
        >
          <span className="material-symbols-outlined text-[18px]">flag</span>
        </button>
      </footer>
    </div>
  );
}
