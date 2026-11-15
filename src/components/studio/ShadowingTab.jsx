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
  Volume2,
  CheckCircle2,
  Loader2,
  HelpCircle,
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
  saveShadowingCueScore,
  playStudioTts,
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
    // Support optional leading timestamp like [00:15] or 00:15 text
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

export function ShadowingTab({ clips, voice, onOpenSetup }) {
  const [customClips, setCustomClips] = useState(() => getCustomGuestClips());
  const allClips = useMemo(() => [...customClips, ...(clips || [])], [customClips, clips]);
  const [selectedClipId, setSelectedClipId] = useState(() => allClips[0]?.id || '');
  const [levelFilter, setLevelFilter] = useState('all');

  const selectedClip = useMemo(
    () => allClips.find((c) => c.id === selectedClipId) || allClips[0] || null,
    [allClips, selectedClipId]
  );

  // Sync default selection once catalog arrives
  useEffect(() => {
    if (!selectedClipId && allClips.length > 0) {
      setSelectedClipId(allClips[0].id);
    }
  }, [allClips, selectedClipId]);

  const cues = useMemo(() => (Array.isArray(selectedClip?.cues) ? selectedClip.cues : []), [selectedClip]);

  // Player state
  const playerContainerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const [ytError, setYtError] = useState('');
  const [activeCueIdx, setActiveCueIdx] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loopActiveCue, setLoopActiveCue] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [rightTab, setRightTab] = useState('shadowing'); // 'shadowing' | 'dictation'

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

  // Initialize & clean up YouTube IFrame Player
  useEffect(() => {
    const videoId = selectedClip?.youtube_video_id;
    if (!videoId) return;

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

            // Handle single-cue A-B looping during playback
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

    // Option A: Manual transcript provided ($0 local, works immediately without backend)
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

    // Option B: Auto-fetch captions from Modal.com backend
    if (!getStudioApiUrl()) {
      setImportError(
        'Chưa gắn AI Server Modal.com để tự tách phụ đề YouTube. Bạn có thể dán transcript vào ô dưới để học ngay ($0), hoặc bấm "Cài đặt AI Server".'
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

  return (
    <div className="space-y-5">
      {/* Catalog Strip & Add YouTube Button */}
      <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-3xl p-4 shadow-[2.5px_2.5px_0px_#3D352E] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wide text-[#786F66]">
              Kho video Shadowing ({filteredClips.length}):
            </span>
            {['all', 'A2', 'B1', 'B2', 'Custom'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`px-3 py-1 rounded-full text-xs font-extrabold border-2 transition-all cursor-pointer ${
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
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#D96B43] hover:bg-[#C85A3F] text-white text-xs font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm video YouTube bất kỳ</span>
          </button>
        </div>

        {/* Add Custom YouTube Form */}
        {showAddForm && (
          <form
            onSubmit={handleImportYoutube}
            className="bg-[#FAF5EB] border-2 border-[#3D352E] rounded-2xl p-4 space-y-3"
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

        {/* Horizontal Clip Cards */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {filteredClips.map((clip) => {
            const isSelected = selectedClip?.id === clip.id;
            return (
              <div
                key={clip.id}
                onClick={() => setSelectedClipId(clip.id)}
                className={`min-w-[230px] max-w-[260px] shrink-0 rounded-2xl p-3 border-2 cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-[#EEF5EC] border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                    : 'bg-white border-[#E8DEC8] hover:border-[#3D352E]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#F4E3B4] text-[#3D352E] border border-[#3D352E]">
                    {clip.level || 'Story'}
                  </span>
                  {clip.guest && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomClips(removeCustomGuestClip(clip.id));
                      }}
                      className="text-[#786F66] hover:text-[#B53D2A]"
                      title="Xóa video cá nhân"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-black text-[#2E2823] line-clamp-2">
                  {clip.title}
                </div>
                <div className="text-[11px] font-semibold text-[#786F66] truncate">
                  {clip.genre || clip.origin} · {clip.cues?.length || 0} câu
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Workspace: Video Player (Left) + Active Cue & Transcript (Right) */}
      {selectedClip && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: YouTube Video + Live Subtitle + Player Controls */}
          <div className="lg:col-span-6 space-y-3">
            <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-3xl overflow-hidden shadow-[3px_3px_0px_#3D352E]">
              <div className="aspect-video w-full bg-[#1E1B17] relative">
                <div ref={playerContainerRef} className="w-full h-full" />
                {ytError && (
                  <div className="absolute inset-0 flex items-center justify-center p-4 bg-[#1E1B17]/90 text-white text-xs font-bold text-center">
                    {ytError}
                  </div>
                )}
              </div>

              {/* Synced Subtitle Box */}
              <div className="p-4 bg-[#FAF5EB] border-t-2 border-[#3D352E] min-h-[104px] space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold text-[#786F66]">
                  <span>
                    Câu {activeCueIdx + 1} / {cues.length}{' '}
                    {activeCue ? `· ${formatCueTime(activeCue.start)}` : ''}
                  </span>
                  <span>{activeCue?.speaker || 'Speaker'}</span>
                </div>

                {!showSubtitle ? (
                  <p className="text-xs font-bold italic text-[#786F66] py-2">
                    Phụ đề đang ẩn để luyện nghe chủ động (Blind Listening). Bấm "Hiện lời thoại" khi cần đối chiếu.
                  </p>
                ) : activeCue ? (
                  <>
                    <p className="text-sm sm:text-base font-black text-[#2E2823] leading-snug">
                      {activeCue.text}
                    </p>
                    {showTranslation && activeCue.vietnamese_translation && (
                      <p className="text-xs sm:text-sm font-semibold text-[#4D6B53]">
                        {activeCue.vietnamese_translation}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs font-semibold text-[#786F66]">Chưa có lời thoại cho video này.</p>
                )}
              </div>
            </div>

            {/* Playback & Display Toolbar */}
            <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-2xl p-3 shadow-[2px_2px_0px_#3D352E] flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-[#FAF5EB] p-1 rounded-xl border border-[#3D352E]/30">
                {[0.75, 1, 1.25].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleRateChange(rate)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer ${
                      playbackRate === rate
                        ? 'bg-[#2E2823] text-white'
                        : 'text-[#554D42] hover:bg-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setLoopActiveCue((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 cursor-pointer transition-all ${
                  loopActiveCue
                    ? 'bg-[#D96B43] text-white border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E]'
                    : 'bg-white text-[#3D352E] border-[#3D352E]'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Lặp câu đang chọn</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSubtitle((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-white text-[#3D352E] border-2 border-[#3D352E] cursor-pointer"
              >
                {showSubtitle ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showSubtitle ? 'Ẩn lời thoại' : 'Hiện lời thoại'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTranslation((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-white text-[#3D352E] border-2 border-[#3D352E] cursor-pointer"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{showTranslation ? 'Ẩn dịch VI' : 'Hiện dịch VI'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Practice Card + Synchronized Cue List */}
          <div className="lg:col-span-6 space-y-4">
            {/* Sub-tab Switcher */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRightTab('shadowing')}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-black border-2 border-[#3D352E] cursor-pointer transition-all ${
                  rightTab === 'shadowing'
                    ? 'bg-[#4D6B53] text-white shadow-[2.5px_2.5px_0px_#3D352E]'
                    : 'bg-white text-[#554D42] hover:bg-[#FAF5EB]'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>Shadowing & Chấm AI</span>
              </button>
              <button
                type="button"
                onClick={() => setRightTab('dictation')}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-black border-2 border-[#3D352E] cursor-pointer transition-all ${
                  rightTab === 'dictation'
                    ? 'bg-[#4D6B53] text-white shadow-[2.5px_2.5px_0px_#3D352E]'
                    : 'bg-white text-[#554D42] hover:bg-[#FAF5EB]'
                }`}
              >
                <Keyboard className="w-4 h-4" />
                <span>Chép chính tả câu</span>
              </button>
            </div>

            {rightTab === 'shadowing' ? (
              <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-3xl p-4 shadow-[2.5px_2.5px_0px_#3D352E] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black text-[#4D6B53] uppercase tracking-wide">
                    Đang luyện câu #{activeCueIdx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => seekToCue(activeCueIdx, true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F4E3B4] text-[#3D352E] text-xs font-extrabold border border-[#3D352E] cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Phát trên video</span>
                    </button>
                    {activeCue?.text && (
                      <button
                        type="button"
                        onClick={() => playStudioTts({ text: activeCue.text, voice, speed: 0.9 })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white text-[#3D352E] text-xs font-extrabold border border-[#3D352E] cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Đọc mẫu Kokoro</span>
                      </button>
                    )}
                  </div>
                </div>

                {activeCue && (
                  <>
                    <div className="bg-[#FAF5EB] rounded-2xl p-3 border border-[#E8DEC8]">
                      <p className="text-sm font-black text-[#2E2823]">{activeCue.text}</p>
                      {showTranslation && activeCue.vietnamese_translation && (
                        <p className="text-xs font-semibold text-[#786F66] mt-1">
                          {activeCue.vietnamese_translation}
                        </p>
                      )}
                    </div>

                    <StudioVoiceRecorder
                      expectedText={activeCue.text}
                      voice={voice}
                      compact
                      onOpenSetup={onOpenSetup}
                      onScored={(data) => {
                        saveShadowingCueScore(selectedClip.id, activeCueIdx, Math.round(data.score));
                      }}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-3xl p-4 shadow-[2.5px_2.5px_0px_#3D352E] space-y-3">
                {activeCue ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-[#4D6B53]">
                        Nghe câu #{activeCueIdx + 1} ({formatCueTime(activeCue.start)}) & gõ lại:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => seekToCue(activeCueIdx, true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F4E3B4] text-xs font-extrabold border border-[#3D352E] cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Nghe câu</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDictHinted((prev) => ({ ...prev, [activeCueIdx]: true }))
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white text-xs font-extrabold border border-[#3D352E] cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Gợi ý</span>
                        </button>
                      </div>
                    </div>

                    {dictHinted[activeCueIdx] && (
                      <p className="text-xs font-bold text-[#8C5311] bg-[#FFF3D1] rounded-xl px-3 py-1.5 border border-[#D9822B]/30">
                        Từ đầu tiên: <span className="font-black">{activeCue.text.split(/\s+/)[0]}…</span>
                      </p>
                    )}

                    <textarea
                      rows={3}
                      value={activeDictValue}
                      onChange={(e) =>
                        setDictInputs((prev) => ({ ...prev, [activeCueIdx]: e.target.value }))
                      }
                      placeholder="Gõ chính xác những gì bạn nghe được..."
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] text-sm font-bold text-[#2E2823] focus:outline-none focus:ring-2 focus:ring-[#4D6B53]/40"
                    />

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const rep = compareShadowingWords(activeCue.text, activeDictValue);
                          setDictChecked((prev) => ({ ...prev, [activeCueIdx]: rep }));
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4D6B53] text-white text-xs font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Kiểm tra</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={activeCueIdx <= 0}
                          onClick={() => seekToCue(activeCueIdx - 1, true)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#3D352E] text-xs font-bold disabled:opacity-40 cursor-pointer"
                        >
                          ← Câu trước
                        </button>
                        <button
                          type="button"
                          disabled={activeCueIdx >= cues.length - 1}
                          onClick={() => seekToCue(activeCueIdx + 1, true)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#3D352E] text-xs font-bold disabled:opacity-40 cursor-pointer"
                        >
                          Câu sau →
                        </button>
                      </div>
                    </div>

                    {activeDictReport && (
                      <div className="bg-[#FAF5EB] border border-[#E8DEC8] rounded-2xl p-3 space-y-2">
                        <div className="text-xs font-black text-[#2E2823]">
                          {activeDictReport.correct
                            ? 'Chính xác hoàn toàn!'
                            : `Khớp ${activeDictReport.matched.size}/${activeDictReport.expected.length} từ (${activeDictReport.score}%)`}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
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
                  </>
                ) : null}
              </div>
            )}

            {/* Synchronized Scrollable Cue List */}
            <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-3xl p-4 shadow-[2.5px_2.5px_0px_#3D352E] space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-[#786F66]">
                <span>DANH SÁCH CÂU THOẠI ({cues.length})</span>
                <span>Bấm vào câu để nhảy đến đoạn video</span>
              </div>
              <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1">
                {cues.map((cue, idx) => {
                  const isActive = idx === activeCueIdx;
                  return (
                    <button
                      key={idx}
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
                        <span>{cue.speaker || 'Speaker'}</span>
                      </div>
                      {showSubtitle ? (
                        <>
                          <p className="text-xs sm:text-sm font-bold text-[#2E2823]">{cue.text}</p>
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
          </div>
        </div>
      )}
    </div>
  );
}

export default ShadowingTab;
