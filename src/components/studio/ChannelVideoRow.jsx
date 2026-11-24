// src/components/studio/ChannelVideoRow.jsx
// Horizontal single-row channel carousel with top-left channel title and navigation controls.
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Trash2, Loader2, ChevronLeft, ChevronRight, Tv } from 'lucide-react';

export function ChannelVideoRow({
  channelName,
  clips,
  progress,
  deletingClipId,
  onSelectClip,
  onDeleteClip,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return undefined;

    const handleScroll = () => updateScrollButtons();
    el.addEventListener('scroll', handleScroll, { passive: true });

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateScrollButtons());
      resizeObserver.observe(el);
    } else {
      window.addEventListener('resize', updateScrollButtons);
    }

    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', updateScrollButtons);
      }
    };
  }, [clips.length, updateScrollButtons]);

  const handleScrollBy = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(260, Math.round(el.clientWidth * 0.78));
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section
      aria-label={`Kênh ${channelName}`}
      className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-[2.5px_2.5px_0px_#3D352E] space-y-3"
    >
      {/* Top Row: Channel Title (left) + Horizontal Scroll Navigation Bar (right) */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#F4E3B4] border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] flex items-center justify-center shrink-0">
            <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D96B43]" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-[#2E2823] truncate">
            {channelName}
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-[#FAF5EB] text-[#554D42] border border-[#3D352E]/30 shrink-0">
            {clips.length} video
          </span>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleScrollBy(-1)}
            disabled={!canScrollLeft}
            aria-label={`Cuộn trái kênh ${channelName}`}
            title="Video trước"
            className="w-8 h-8 rounded-xl bg-white hover:bg-[#F4E3B4] text-[#2E2823] border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] flex items-center justify-center transition-all cursor-pointer active:translate-y-0.5 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:translate-y-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScrollBy(1)}
            disabled={!canScrollRight}
            aria-label={`Cuộn phải kênh ${channelName}`}
            title="Video tiếp theo"
            className="w-8 h-8 rounded-xl bg-white hover:bg-[#F4E3B4] text-[#2E2823] border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] flex items-center justify-center transition-all cursor-pointer active:translate-y-0.5 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:translate-y-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Single-Row Horizontal Scrollable Video List */}
      <div
        ref={scrollRef}
        className="flex flex-nowrap items-stretch gap-3.5 sm:gap-4 overflow-x-auto pb-2.5 pt-0.5 px-0.5 studio-row-scrollbar scroll-smooth snap-x snap-mandatory"
      >
        {clips.map((clip) => {
          const clipScoreCount = Object.keys(progress.shadowingChecked?.[clip.id] || {}).length;
          const totalClipCues = clip.cue_count || clip.cues?.length || 0;
          const thumbUrl = clip.youtube_video_id
            ? `https://i.ytimg.com/vi/${clip.youtube_video_id}/hqdefault.jpg`
            : '';

          return (
            <div
              key={clip.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectClip(clip.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectClip(clip.id);
                }
              }}
              className="group shrink-0 w-[245px] sm:w-[270px] lg:w-[285px] snap-start bg-white border-2 border-[#3D352E] rounded-2xl overflow-hidden shadow-[3px_3px_0px_#3D352E] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#3D352E] transition-all cursor-pointer flex flex-col text-left focus:outline-none focus:ring-2 focus:ring-[#4D6B53]"
            >
              {/* YouTube Thumbnail */}
              <div className="aspect-video w-full bg-[#1E1B17] relative overflow-hidden border-b-2 border-[#3D352E]">
                {thumbUrl && (
                  <img
                    src={thumbUrl}
                    alt={clip.title}
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.fallback && clip.youtube_video_id) {
                        img.dataset.fallback = '1';
                        img.src = `https://i.ytimg.com/vi/${clip.youtube_video_id}/mqdefault.jpg`;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                )}
                <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-[#D96B43]/95 border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Top-right Remove button for user clips */}
                {(clip.personal || clip.guest) && (
                  <button
                    type="button"
                    disabled={deletingClipId === clip.id}
                    onClick={(e) => onDeleteClip(e, clip)}
                    className="absolute top-2 right-2 p-1.5 rounded-xl bg-white/95 hover:bg-[#FDECE8] text-[#B53D2A] border border-[#3D352E] cursor-pointer disabled:opacity-50"
                    title="Xóa video cá nhân"
                    aria-label="Xóa video cá nhân"
                  >
                    {deletingClipId === clip.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {/* Bottom-right cue & progress pill */}
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-black bg-[#2E2823]/90 text-white border border-white/20">
                  {clipScoreCount > 0 ? `${clipScoreCount}/${totalClipCues} câu` : `${totalClipCues} câu`}
                </span>
              </div>

              {/* Title & Meta Below Thumbnail */}
              <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between gap-2">
                <h4 className="text-sm font-black text-[#2E2823] leading-snug line-clamp-2 group-hover:text-[#4D6B53] transition-colors">
                  {clip.title}
                </h4>
                <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-[#786F66]">
                  <span className="truncate">{clip.genre || channelName || 'YouTube'}</span>
                  <span className="shrink-0 px-2 py-0.5 rounded-lg bg-[#EEF5EC] text-[#355A3B] font-black border border-[#4D6B53]/30">
                    Luyện ngay
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ChannelVideoRow;
