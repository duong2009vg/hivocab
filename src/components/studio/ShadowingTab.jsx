// src/components/studio/ShadowingTab.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Repeat,
  Eye,
  EyeOff,
  Languages,
  Plus,
  Video,
  Trash2,
  Mic,
  Keyboard,
  CheckCircle2,
  Loader2,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react';
import {
  extractYoutubeVideoId,
  formatCueTime,
  resolveActiveCueIndex,
  compareShadowingWords,
} from '../../utils/studioCore.js';
import {
  fetchYoutubeCaptionsPreview,
  getCustomGuestClips,
  saveCustomGuestClip,
  removeCustomGuestClip,
  loadStudioProgress,
  saveShadowingCueScore,
  stopStudioAudio,
  getStudioApiUrl,
} from '../../services/studioService.js';
import StudioVoiceRecorder from './StudioVoiceRecorder.jsx';

function loadYouTubeIframeAPI() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.YT?.Player) return Promise.resolve();
  if (window.__hiYtLoaderPromise) return window.__hiYtLoaderPromise;

  window.__hiYtLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-hi-youtube="1"]');
    if (!existing) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.dataset.hiYoutube = '1';
      tag.onerror = () => reject(new Error('Không tải được YouTube IFrame API.'));
      document.head.appendChild(tag);
    }
    const started = Date.now();
    const timer = setInterval(() => {
      if (window.YT?.Player) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - started > 12000) {
        clearInterval(timer);
        reject(new Error('YouTube IFrame API phản hồi quá lâu.'));
      }
    }, 120);
  }).catch((err) => {
    window.__hiYtLoaderPromise = null;
    throw err;
  });

  return window.__hiYtLoaderPromise;
}

function parseManualTranscript(rawText) {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const cues = [];
  let cursor = 0;

  for (const line of lines) {
    const tsMatch = line.match(/^\[?(\d{1,2}):(\d{2})(?:\.\d+)?\]?\s+(.+)$/);
    if (tsMatch) {
      const start = Number(tsMatch[1]) * 60 + Number(tsMatch[2]);
      const text = tsMatch[3].trim();
      if (cues.length && cues[cues.length - 1].end <= cues[cues.length - 1].start) {
        cues[cues.length - 1].end = Math.max(cues[cues.length - 1].start + 2, start);
      }
      if (cues.length && cues[cues.length - 1].end > start) {
        cues[cues.length - 1].end = Math.max(cues[cues.length - 1].start + 0.5, start);
      }
      cues.push({ start, end: start + 5, speaker: 'YouTube', text, vietnamese_translation: '' });
      cursor = start + 5;
    } else {
      const start = cursor;
      const dur = Math.max(3, Math.min(8, Math.ceil(line.split(/\s+/).length * 0.55)));
      cues.push({
        start,
        end: start + dur,
        speaker: 'YouTube',
        text: line,
        vietnamese_translation: '',
      });
      cursor += dur;
    }
  }
  return cues;
}

export function ShadowingTab({ clips, voice, onOpenSetup, onVideoOpenChange }) {
  const [customClips, setCustomClips] = useState(() => getCustomGuestClips());
  const allClips = useMemo(() => [...customClips, ...(clips || [])], [customClips, clips]);
  const [selectedClipId, setSelectedClipId] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const selectedClip = useMemo(
    () => (selectedClipId ? allClips.find((c) => c.id === selectedClipId) || null : null),
    [allClips, selectedClipId]
  );

  useEffect(() => {
    if (typeof onVideoOpenChange === 'function') {
      onVideoOpenChange(Boolean(selectedClip));
    }
  }, [selectedClip, onVideoOpenChange]);

  const cues = useMemo(() => (Array.isArray(selectedClip?.cues) ? selectedClip.cues : []), [selectedClip]);

  // Player state
  const playerContainerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const cueListRef = useRef(null);
  const activeCueItemRef = useRef(null);

  const [ytError, setYtError] = useState('');
  const [activeCueIdx, setActiveCueIdx] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loopActiveCue, setLoopActiveCue] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [practiceMode, setPracticeMode] = useState('shadowing'); // 'shadowing' | 'dictation'
  const [mobileCuesOpen, setMobileCuesOpen] = useState(false);
  const [progress, setProgress] = useState(() => loadStudioProgress());

  // Add custom YouTube video state
  const [showAddForm, setShowAddForm] = useState(false);
  const [ytUrlInput, setYtUrlInput] = useState('');
  const [ytTitleInput, setYtTitleInput] = useState('');
  const [manualScriptInput, setManualScriptInput] = useState('');
  const [importingYt, setImportingYt] = useState(false);
  const [importError, setImportError] = useState('');

  // In-video dictation state per cue index
  const [dictInputs, setDictInputs] = useState({});
  const [dictChecked, setDictChecked] = useState({});
  const [dictHinted, setDictHinted] = useState({});

  const loopRef = useRef(loopActiveCue);
  const activeCueIdxRef = useRef(activeCueIdx);
  const cuesRef = useRef(cues);
  const clipRef = useRef(selectedClip);

  useEffect(() => {
    loopRef.current = loopActiveCue;
  }, [loopActiveCue]);

  useEffect(() => {
    activeCueIdxRef.current = activeCueIdx;
  }, [activeCueIdx]);

  useEffect(() => {
    cuesRef.current = cues;
  }, [cues]);

  useEffect(() => {
    clipRef.current = selectedClip;
  }, [selectedClip]);

  // Reset per-clip UI state when switching clip
  useEffect(() => {
    setActiveCueIdx(0);
    setYtError('');
    setDictInputs({});
    setDictChecked({});
    setDictHinted({});
  }, [selectedClip?.id]);

  // Scroll only the cue list container (never the page window) when active cue changes
  useEffect(() => {
    const container = cueListRef.current;
    const item = activeCueItemRef.current;
    if (!container || !item) return;
    const itemTop = item.offsetTop;
    const itemBottom = itemTop + item.offsetHeight;
    if (itemTop < container.scrollTop || itemBottom > container.scrollTop + container.clientHeight) {
      container.scrollTo({
        top: Math.max(0, itemTop - container.clientHeight / 3),
        behavior: 'smooth',
      });
    }
  }, [activeCueIdx]);

  // Initialize & clean up YouTube IFrame Player
  useEffect(() => {
    const videoId = selectedClip?.youtube_video_id;
    if (!videoId) {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (_) {}
        ytPlayerRef.current = null;
      }
      return;
    }

    let cancelled = false;
    let pollTimer = null;

    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.destroy();
      } catch (_) {}
      ytPlayerRef.current = null;
    }

    loadYouTubeIframeAPI()
      .then(() => {
        if (cancelled || !playerContainerRef.current) return;
        playerContainerRef.current.replaceChildren();
        const mountDiv = document.createElement('div');
        mountDiv.className = 'w-full h-full';
        playerContainerRef.current.appendChild(mountDiv);

        const startSec = Math.floor(Number(selectedClip.start_seconds || 0));
        const endSec = Math.ceil(Number(selectedClip.end_seconds || 0));

        ytPlayerRef.current = new window.YT.Player(mountDiv, {
          width: '100%',
          height: '100%',
          videoId,
          playerVars: {
            start: startSec,
            ...(endSec > startSec ? { end: endSec } : {}),
            playsinline: 1,
            controls: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              if (cancelled) return;
              try {
                e.target.setPlaybackRate(playbackRate);
              } catch (_) {}
            },
            onError: () => {
              if (!cancelled) {
                setYtError('Video YouTube này không cho phép nhúng hoặc tạm thời không phát được.');
              }
            },
          },
        });

        pollTimer = setInterval(() => {
          const player = ytPlayerRef.current;
          const clip = clipRef.current;
          const currentCues = cuesRef.current;
          if (!player || typeof player.getCurrentTime !== 'function' || !clip) return;
          try {
            const absTime = player.getCurrentTime();
            const localTime = Math.max(0, absTime - Number(clip.start_seconds || 0));
            const pinnedCue = currentCues[activeCueIdxRef.current];

            if (
              loopRef.current &&
              pinnedCue &&
              player.getPlayerState?.() === 1 &&
              localTime >= Number(pinnedCue.end) - 0.08
            ) {
              player.seekTo(Number(clip.start_seconds || 0) + Number(pinnedCue.start), true);
              return;
            }

            if (!loopRef.current && player.getPlayerState?.() === 1) {
              const found = resolveActiveCueIndex(localTime, clip, currentCues);
              if (found >= 0 && found !== activeCueIdxRef.current) {
                setActiveCueIdx(found);
              }
            }
          } catch (_) {}
        }, 180);
      })
      .catch((err) => {
        if (!cancelled) setYtError(err?.message || 'Không tải được trình phát YouTube.');
      });

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (_) {}
        ytPlayerRef.current = null;
      }
    };
  }, [selectedClip?.id, selectedClip?.youtube_video_id]);

  const handleRateChange = (rate) => {
    setPlaybackRate(rate);
    try {
      ytPlayerRef.current?.setPlaybackRate?.(rate);
    } catch (_) {}
  };

  const seekToCue = (idx, autoPlay = true) => {
    if (idx < 0 || idx >= cues.length) return;
    const cue = cues[idx];
    if (!cue || !selectedClip) return;
    setActiveCueIdx(idx);
    try {
      const targetSec = Number(selectedClip.start_seconds || 0) + Number(cue.start || 0);
      ytPlayerRef.current?.seekTo?.(targetSec, true);
      if (autoPlay) ytPlayerRef.current?.playVideo?.();
    } catch (_) {}
  };

  const handleImportYoutube = async (e) => {
    e.preventDefault();
    setImportError('');
    const videoId = extractYoutubeVideoId(ytUrlInput);
    if (!videoId) {
      setImportError('Link hoặc ID YouTube không hợp lệ (ví dụ: https://www.youtube.com/watch?v=...).');
      return;
    }

    if (manualScriptInput.trim()) {
      const parsedCues = parseManualTranscript(manualScriptInput);
      if (!parsedCues.length) {
        setImportError('Vui lòng nhập ít nhất 1 dòng transcript.');
        return;
      }
      const lastEnd = parsedCues[parsedCues.length - 1].end;
      const newClip = {
        id: `custom-${videoId}-${Date.now()}`,
        title: ytTitleInput.trim() || `YouTube · ${videoId}`,
        genre: 'Video cá nhân (Tự nhập)',
        origin: 'YouTube · Tùy chỉnh',
        youtube_video_id: videoId,
        provider: 'youtube',
        start_seconds: 0,
        end_seconds: Math.max(10, Math.ceil(lastEnd + 2)),
        level: 'Custom',
        tags: ['custom', 'youtube'],
        status: 'published',
        guest: true,
        cues: parsedCues,
      };
      setCustomClips(saveCustomGuestClip(newClip));
      setSelectedClipId(newClip.id);
      setShowAddForm(false);
      setYtUrlInput('');
      setYtTitleInput('');
      setManualScriptInput('');
      return;
    }

    if (!getStudioApiUrl()) {
      setImportError(
        'Chưa gắn AI Server Modal.com để tự tách phụ đề YouTube. Bạn có thể dán transcript vào ô dưới để học ngay ($0), hoặc bấm "Gắn AI Server".'
      );
      return;
    }

    setImportingYt(true);
    try {
      const res = await fetchYoutubeCaptionsPreview({
        youtubeUrl: ytUrlInput.trim(),
        title: ytTitleInput.trim(),
      });
      const fetchedClip = {
        ...res.clip,
        cues: res.cues_doc?.cues || [],
      };
      if (!fetchedClip.cues.length) {
        throw new Error('Video này không có phụ đề tiếng Anh trên YouTube.');
      }
      setCustomClips(saveCustomGuestClip(fetchedClip));
      setSelectedClipId(fetchedClip.id);
      setShowAddForm(false);
      setYtUrlInput('');
      setYtTitleInput('');
    } catch (err) {
      setImportError(err?.message || 'Không lấy được phụ đề tự động từ YouTube.');
    } finally {
      setImportingYt(false);
    }
  };

  const filteredClips = useMemo(() => {
    if (levelFilter === 'all') return allClips;
    return allClips.filter((c) => (c.level || 'General') === levelFilter);
  }, [allClips, levelFilter]);

  const activeCue = cues[activeCueIdx] || cues[0] || null;
  const activeDictValue = dictInputs[activeCueIdx] || '';
  const activeDictReport = dictChecked[activeCueIdx] || null;

  const clipScores = useMemo(
    () => (selectedClip ? progress.shadowingChecked?.[selectedClip.id] || {} : {}),
    [progress, selectedClip]
  );
  const practicedCount = Object.keys(clipScores).length;
  const progressPct = cues.length > 0 ? Math.min(100, Math.round((practicedCount / cues.length) * 100)) : 0;

  const handleClosePlayer = () => {
    stopStudioAudio();
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.stopVideo?.();
      } catch (_) {}
    }
    setSelectedClipId('');
  };

  return (
    <div className="space-y-4">
      {/* STEP 1: YouTube Thumbnail Video Library Grid (shown when no video is opened) */}
      {!selectedClip ? (
        <div className="space-y-4">
          {/* Library Toolbar & Add YouTube Button */}
          <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-[2.5px_2.5px_0px_#3D352E] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wide text-[#786F66] shrink-0 mr-1">
                  Thư viện Video ({filteredClips.length}):
                </span>
                {['all', 'A2', 'B1', 'B2', 'Custom'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevelFilter(lvl)}
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-extrabold border-2 transition-all cursor-pointer shrink-0 ${
                      levelFilter === lvl
                        ? 'bg-[#4D6B53] text-white border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E]'
                        : 'bg-white text-[#554D42] border-[#E8DEC8] hover:border-[#3D352E]'
                    }`}
                  >
                    {lvl === 'all' ? 'Tất cả' : lvl}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAddForm((prev) => !prev)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl bg-[#D96B43] hover:bg-[#C85A3F] text-white text-xs font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm video YouTube bất kỳ</span>
              </button>
            </div>

            {/* Add Custom YouTube Form */}
            {showAddForm && (
              <form
                onSubmit={handleImportYoutube}
                className="bg-[#FAF5EB] border-2 border-[#3D352E] rounded-2xl p-3 sm:p-4 space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-xs font-extrabold text-[#2E2823]">Link YouTube *</span>
                    <input
                      type="text"
                      value={ytUrlInput}
                      onChange={(e) => setYtUrlInput(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#3D352E] text-xs font-bold focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-extrabold text-[#2E2823]">Tên bài học (tùy chọn)</span>
                    <input
                      type="text"
                      value={ytTitleInput}
                      onChange={(e) => setYtTitleInput(e.target.value)}
                      placeholder="Ví dụ: TED Talk - Habit Building"
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#3D352E] text-xs font-bold focus:outline-none"
                    />
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-xs font-extrabold text-[#2E2823]">
                    Transcript tự nhập (tùy chọn — bỏ trống nếu muốn lấy phụ đề tự động qua Modal.com)
                  </span>
                  <textarea
                    rows={3}
                    value={manualScriptInput}
                    onChange={(e) => setManualScriptInput(e.target.value)}
                    placeholder={'Dán từng câu mỗi dòng, hoặc kèm mốc thời gian:\n00:05 Hello everyone, welcome back.\n00:10 Today we are going to talk about English pronunciation.'}
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#3D352E] text-xs font-semibold focus:outline-none"
                  />
                </label>

                {importError && (
                  <p className="text-xs font-bold text-[#B53D2A] bg-[#FDECE8] border border-[#D96B43]/40 rounded-xl px-3 py-2">
                    {importError}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={importingYt}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4D6B53] text-white text-xs font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer disabled:opacity-60"
                  >
                    {importingYt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                    <span>{manualScriptInput.trim() ? 'Lưu bài YouTube' : 'Lấy phụ đề YouTube tự động'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-2 rounded-xl bg-white text-xs font-bold border-2 border-[#3D352E] cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* YouTube Thumbnail Video Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClips.map((clip) => {
              const clipScoreCount = Object.keys(progress.shadowingChecked?.[clip.id] || {}).length;
              const totalClipCues = clip.cues?.length || 0;
              const thumbUrl = clip.youtube_video_id
                ? `https://i.ytimg.com/vi/${clip.youtube_video_id}/hqdefault.jpg`
                : '';

              return (
                <div
                  key={clip.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedClipId(clip.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedClipId(clip.id);
                    }
                  }}
                  className="group bg-[#fffcf7] border-2 border-[#3D352E] rounded-2xl overflow-hidden shadow-[3px_3px_0px_#3D352E] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#3D352E] transition-all cursor-pointer flex flex-col text-left focus:outline-none focus:ring-2 focus:ring-[#4D6B53]"
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

                    {/* Top-left Level badge */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#F4E3B4] text-[#3D352E] border border-[#3D352E] shadow-[1px_1px_0px_#3D352E]">
                      {clip.level || 'Story'}
                    </span>

                    {/* Top-right Remove button for user clips */}
                    {clip.guest && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomClips(removeCustomGuestClip(clip.id));
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-xl bg-white/95 hover:bg-[#FDECE8] text-[#B53D2A] border border-[#3D352E] cursor-pointer"
                        title="Xóa video cá nhân"
                        aria-label="Xóa video cá nhân"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Bottom-right cue & progress pill */}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-black bg-[#2E2823]/90 text-white border border-white/20">
                      {clipScoreCount > 0 ? `${clipScoreCount}/${totalClipCues} câu` : `${totalClipCues} câu`}
                    </span>
                  </div>

                  {/* Title & Meta Below Thumbnail */}
                  <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between gap-2">
                    <h3 className="text-sm font-black text-[#2E2823] leading-snug line-clamp-2 group-hover:text-[#4D6B53] transition-colors">
                      {clip.title}
                    </h3>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-[#786F66]">
                      <span className="truncate">{clip.genre || clip.origin || 'YouTube'}</span>
                      <span className="shrink-0 px-2 py-0.5 rounded-lg bg-[#EEF5EC] text-[#355A3B] font-black border border-[#4D6B53]/30">
                        Luyện ngay
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* STEP 2: Full-width Shadowing & Dictation Workspace (Left MainSidebar hidden) */
        <div className="space-y-3">
          {/* Compact Top Return-to-Library Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#fffcf7] border-2 border-[#3D352E] rounded-2xl px-3 py-2 shadow-[2px_2px_0px_#3D352E]">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={handleClosePlayer}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F4E3B4] text-[#2E2823] text-xs font-black border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] cursor-pointer shrink-0 active:translate-y-0.5 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Thư viện Video</span>
              </button>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-[#F4E3B4] text-[#3D352E] border border-[#3D352E] shrink-0">
                {selectedClip.level || 'Story'}
              </span>
              <h2 className="text-xs sm:text-sm font-black text-[#2E2823] truncate">
                {selectedClip.title}
              </h2>
            </div>

            {selectedClip.genre && (
              <span className="hidden md:inline-block text-[11px] font-bold text-[#786F66] shrink-0">
                {selectedClip.genre}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
          {/* LEFT MAIN COLUMN: Top Taskbar + YouTube Player + Subtitle + Shadowing/Dictation All On One Screen */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-2xl sm:rounded-3xl overflow-hidden shadow-[3px_3px_0px_#3D352E]">
              {/* Single Compact Horizontal Taskbar Above Video (Full Controls) */}
              <div className="px-2.5 sm:px-3 py-1.5 bg-[#FAF5EB] border-b-2 border-[#3D352E] flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
                {/* Cue Meta + Prev / Play / Next */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 rounded-lg bg-white border border-[#3D352E]/40 text-[11px] font-black text-[#2E2823] whitespace-nowrap">
                    {activeCueIdx + 1}/{cues.length}
                    {activeCue ? ` · ${formatCueTime(activeCue.start)}` : ''}
                  </span>
                  {activeCue?.speaker && (
                    <span className="hidden xl:inline text-[11px] font-black text-[#4D6B53] truncate max-w-[96px]">
                      {activeCue.speaker}
                    </span>
                  )}

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={activeCueIdx <= 0}
                      onClick={() => seekToCue(activeCueIdx - 1, true)}
                      title="Câu trước"
                      aria-label="Câu trước"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-[#3D352E] text-[#2E2823] hover:bg-[#F4E3B4] disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => seekToCue(activeCueIdx, true)}
                      title="Phát câu hiện tại trên video"
                      className="inline-flex items-center gap-1 px-2 h-7 rounded-lg bg-[#F4E3B4] hover:bg-[#edd79d] text-[#3D352E] text-[11px] font-black border border-[#3D352E] cursor-pointer whitespace-nowrap"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Phát</span>
                    </button>
                    <button
                      type="button"
                      disabled={activeCueIdx >= cues.length - 1}
                      onClick={() => seekToCue(activeCueIdx + 1, true)}
                      title="Câu sau"
                      aria-label="Câu sau"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-[#3D352E] text-[#2E2823] hover:bg-[#F4E3B4] disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Playback Speed + Loop + Subtitle + Translation */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-[#3D352E]/40">
                    {[0.75, 1, 1.25].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => handleRateChange(rate)}
                        title={`Tốc độ ${rate}x`}
                        className={`px-1.5 h-6 rounded-md text-[10px] font-black cursor-pointer whitespace-nowrap ${
                          playbackRate === rate
                            ? 'bg-[#2E2823] text-white'
                            : 'text-[#554D42] hover:bg-[#FAF5EB]'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setLoopActiveCue((v) => !v)}
                    title={loopActiveCue ? 'Tắt lặp câu' : 'Bật lặp lại câu hiện tại'}
                    className={`inline-flex items-center gap-1 px-2 h-7 rounded-lg text-[11px] font-extrabold border cursor-pointer transition-all whitespace-nowrap ${
                      loopActiveCue
                        ? 'bg-[#D96B43] text-white border-[#3D352E]'
                        : 'bg-white text-[#3D352E] border-[#3D352E] hover:bg-[#FAF5EB]'
                    }`}
                  >
                    <Repeat className="w-3 h-3 shrink-0" />
                    <span>{loopActiveCue ? 'Đang lặp' : 'Lặp'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSubtitle((v) => !v)}
                    title={showSubtitle ? 'Ẩn lời thoại tiếng Anh' : 'Hiện lời thoại tiếng Anh'}
                    className={`inline-flex items-center gap-1 px-2 h-7 rounded-lg text-[11px] font-extrabold border border-[#3D352E] cursor-pointer whitespace-nowrap ${
                      showSubtitle ? 'bg-[#EEF5EC] text-[#355A3B]' : 'bg-white text-[#786F66]'
                    }`}
                  >
                    {showSubtitle ? <Eye className="w-3 h-3 shrink-0" /> : <EyeOff className="w-3 h-3 shrink-0" />}
                    <span>Thoại</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTranslation((v) => !v)}
                    title={showTranslation ? 'Ẩn dịch tiếng Việt' : 'Hiện dịch tiếng Việt'}
                    className={`inline-flex items-center gap-1 px-2 h-7 rounded-lg text-[11px] font-extrabold border border-[#3D352E] cursor-pointer whitespace-nowrap ${
                      showTranslation ? 'bg-[#EEF5EC] text-[#355A3B]' : 'bg-white text-[#786F66]'
                    }`}
                  >
                    <Languages className="w-3 h-3 shrink-0" />
                    <span>Dịch VI</span>
                  </button>
                </div>
              </div>

              {/* Video Player Frame (bounded max-height on huge screens so practice popup stays visible together) */}
              <div className="w-full bg-[#1E1B17]">
                <div className="aspect-video w-full max-h-[360px] xl:max-h-[385px] mx-auto relative">
                  <div ref={playerContainerRef} className="w-full h-full" />
                  {ytError && (
                    <div className="absolute inset-0 flex items-center justify-center p-4 bg-[#1E1B17]/90 text-white text-xs sm:text-sm font-bold text-center">
                      {ytError}
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Active Subtitle Strip Below Video */}
              <div className="px-3 py-2 sm:px-4 bg-[#FAF5EB] border-t-2 border-[#3D352E]">
                {!showSubtitle ? (
                  <p className="text-xs font-bold italic text-[#786F66]">
                    Phụ đề đang ẩn để luyện nghe chủ động. Bấm &ldquo;Thoại&rdquo; trên thanh tác vụ khi cần đối chiếu.
                  </p>
                ) : activeCue ? (
                  <div className="space-y-0.5">
                    <p className="text-xs sm:text-sm font-black text-[#2E2823] leading-snug">
                      {activeCue.text}
                    </p>
                    {showTranslation && activeCue.vietnamese_translation && (
                      <p className="text-[11px] sm:text-xs font-semibold text-[#4D6B53] leading-snug">
                        {activeCue.vietnamese_translation}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-[#786F66]">Chưa có lời thoại cho video này.</p>
                )}
              </div>

              {/* Unified Shadowing & Dictation Workspace Directly Visible With Video */}
              <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-[#fffcf7] border-t border-[#E8DEC8] space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPracticeMode('shadowing')}
                    className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-black border-2 border-[#3D352E] cursor-pointer transition-all ${
                      practiceMode === 'shadowing'
                        ? 'bg-[#4D6B53] text-white shadow-[1.5px_1.5px_0px_#3D352E]'
                        : 'bg-white text-[#554D42] hover:bg-[#FAF5EB]'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Shadowing &amp; Chấm bài</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPracticeMode('dictation')}
                    className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-black border-2 border-[#3D352E] cursor-pointer transition-all ${
                      practiceMode === 'dictation'
                        ? 'bg-[#4D6B53] text-white shadow-[1.5px_1.5px_0px_#3D352E]'
                        : 'bg-white text-[#554D42] hover:bg-[#FAF5EB]'
                    }`}
                  >
                    <Keyboard className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Chép chính tả câu</span>
                  </button>
                </div>

                {practiceMode === 'shadowing' ? (
                  activeCue ? (
                    <StudioVoiceRecorder
                      expectedText={activeCue.text}
                      voice={voice}
                      compact
                      showSampleButton
                      onBeforePlaySample={() => {
                        try {
                          ytPlayerRef.current?.pauseVideo?.();
                        } catch (_) {}
                      }}
                      onOpenSetup={onOpenSetup}
                      onScored={(data) => {
                        const updated = saveShadowingCueScore(selectedClip.id, activeCueIdx, Math.round(data.score));
                        setProgress({ ...updated });
                      }}
                    />
                  ) : null
                ) : activeCue ? (
                  <div className="space-y-2">
                    {dictHinted[activeCueIdx] && (
                      <p className="text-xs font-bold text-[#8C5311] bg-[#FFF3D1] rounded-xl px-3 py-1 border border-[#D9822B]/30">
                        Từ đầu tiên: <span className="font-black">{activeCue.text.split(/\s+/)[0]}…</span>
                      </p>
                    )}

                    <textarea
                      rows={2}
                      value={activeDictValue}
                      onChange={(e) =>
                        setDictInputs((prev) => ({ ...prev, [activeCueIdx]: e.target.value }))
                      }
                      placeholder="Vừa xem video vừa gõ chính xác câu bạn nghe được..."
                      className="w-full px-3 py-2 rounded-2xl bg-white border-2 border-[#3D352E] text-xs sm:text-sm font-bold text-[#2E2823] focus:outline-none focus:ring-2 focus:ring-[#4D6B53]/40"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const rep = compareShadowingWords(activeCue.text, activeDictValue);
                            setDictChecked((prev) => ({ ...prev, [activeCueIdx]: rep }));
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4D6B53] text-white text-xs font-black border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] cursor-pointer min-h-[34px]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Kiểm tra</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDictHinted((prev) => ({ ...prev, [activeCueIdx]: true }))
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white text-xs font-extrabold border border-[#3D352E] cursor-pointer min-h-[34px]"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Gợi ý</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={activeCueIdx <= 0}
                          onClick={() => seekToCue(activeCueIdx - 1, true)}
                          className="px-2.5 py-1 rounded-xl bg-white border border-[#3D352E] text-xs font-bold disabled:opacity-40 cursor-pointer min-h-[32px]"
                        >
                          ← Câu trước
                        </button>
                        <button
                          type="button"
                          disabled={activeCueIdx >= cues.length - 1}
                          onClick={() => seekToCue(activeCueIdx + 1, true)}
                          className="px-2.5 py-1 rounded-xl bg-white border border-[#3D352E] text-xs font-bold disabled:opacity-40 cursor-pointer min-h-[32px]"
                        >
                          Câu sau →
                        </button>
                      </div>
                    </div>

                    {activeDictReport && (
                      <div className="bg-[#FAF5EB] border border-[#E8DEC8] rounded-2xl p-2.5 space-y-1.5">
                        <div className="text-xs font-black text-[#2E2823]">
                          {activeDictReport.correct
                            ? 'Chính xác hoàn toàn!'
                            : `Khớp ${activeDictReport.matched.size}/${activeDictReport.expected.length} từ (${activeDictReport.score}%)`}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {activeDictReport.expected.map((w, wi) => {
                            const hit = activeDictReport.matched.has(wi);
                            return (
                              <span
                                key={wi}
                                className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                                  hit
                                    ? 'bg-[#E8F4E5] text-[#355A3B]'
                                    : 'bg-[#FDECE8] text-[#B53D2A]'
                                }`}
                              >
                                {hit ? w : '•••'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR COLUMN: Compact Progress Bar + Synchronized Transcript Beside Video */}
          <aside className="lg:col-span-5 xl:col-span-4 space-y-3 lg:sticky lg:top-4">
            {/* Compact Progress Card */}
            <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-2xl sm:rounded-3xl p-3.5 shadow-[2.5px_2.5px_0px_#3D352E] space-y-1.5">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-extrabold">
                <span className="text-[#786F66]">Tiến độ đã chấm phát âm</span>
                <span className="text-[#4D6B53]">
                  {practicedCount}/{cues.length} câu ({progressPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#FAF5EB] border border-[#3D352E]/40 overflow-hidden">
                <div
                  className="h-full bg-[#4D6B53] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Mobile Toggle Button for Transcript List */}
            <button
              type="button"
              onClick={() => setMobileCuesOpen((v) => !v)}
              className="lg:hidden w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#fffcf7] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-black text-[#2E2823] cursor-pointer"
            >
              <span>Danh sách lời thoại ({cues.length} câu)</span>
              <span className="inline-flex items-center gap-1 text-[#4D6B53]">
                <span>{mobileCuesOpen ? 'Thu gọn' : 'Mở xem'}</span>
                {mobileCuesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            {/* Synchronized Scrollable Cue List Beside Video */}
            <div
              className={`bg-[#fffcf7] border-2 border-[#3D352E] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-[2.5px_2.5px_0px_#3D352E] space-y-2.5 ${
                mobileCuesOpen ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-black text-[#786F66]">
                <span>DANH SÁCH CÂU THOẠI ({cues.length})</span>
                <span className="hidden sm:inline">Bấm câu để nhảy video</span>
              </div>
              <div
                ref={cueListRef}
                className="relative max-h-[420px] lg:max-h-[780px] overflow-y-auto space-y-2 pr-1"
              >
                {cues.map((cue, idx) => {
                  const isActive = idx === activeCueIdx;
                  const cueScore = clipScores[String(idx)];
                  return (
                    <button
                      key={idx}
                      ref={isActive ? activeCueItemRef : null}
                      type="button"
                      onClick={() => seekToCue(idx, true)}
                      className={`w-full text-left rounded-2xl p-3 border-2 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#EEF5EC] border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                          : 'bg-white border-[#E8DEC8] hover:border-[#3D352E]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold text-[#786F66] mb-1">
                        <span>
                          #{idx + 1} · {formatCueTime(cue.start)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {typeof cueScore === 'number' && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#E8F4E5] text-[#355A3B] border border-[#4D6B53]/30">
                              {cueScore}%
                            </span>
                          )}
                          <span>{cue.speaker || 'Speaker'}</span>
                        </div>
                      </div>
                      {showSubtitle ? (
                        <>
                          <p className="text-xs sm:text-sm font-bold text-[#2E2823] leading-snug">
                            {cue.text}
                          </p>
                          {showTranslation && cue.vietnamese_translation && (
                            <p className="text-xs font-semibold text-[#786F66] mt-0.5">
                              {cue.vietnamese_translation}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs italic text-[#786F66]">[Đang ẩn lời thoại — bấm "Hiện lời thoại" để xem]</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShadowingTab;
