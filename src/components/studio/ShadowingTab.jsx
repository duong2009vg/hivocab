// src/components/studio/ShadowingTab.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Repeat,
  Eye,
  EyeOff,
  Languages,
  Plus,
  Video,
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
  Info,
  AlertTriangle,
  LogIn,
} from 'lucide-react';
import {
  extractYoutubeVideoId,
  formatCueTime,
  resolveActiveCueIndex,
  compareShadowingWords,
} from '../../utils/studioCore.js';
import {
  MAX_USER_YOUTUBE_VIDEOS,
  clampYoutubeVideoLimit,
  fetchStudioVideoCues,
  fetchYoutubeCaptionsPreview,
  loadUserYoutubeVideos,
  deleteUserYoutubeVideo,
  updateUserYoutubeVideoCues,
  loadStudioProgress,
  saveShadowingCueScore,
  stopStudioAudio,
  translateShadowingTexts,
} from '../../services/studioService.js';
import { supabase } from '../../lib/supabaseClient.js';
import StudioVoiceRecorder from './StudioVoiceRecorder.jsx';
import ChannelVideoRow from './ChannelVideoRow.jsx';

function getClipChannelName(clip) {
  return (
    clip?.channel_name ||
    clip?.author ||
    clip?.origin ||
    (clip?.personal || clip?.guest ? 'Cá nhân' : 'YouTube')
  ).trim();
}

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

export function ShadowingTab({
  clips,
  voice,
  onOpenSetup,
  onVideoOpenChange,
  showAddForm: controlledShowAddForm,
  onShowAddFormChange,
  onQuotaChange,
}) {
  const [customClips, setCustomClips] = useState([]);
  const [videoLimit, setVideoLimit] = useState(MAX_USER_YOUTUBE_VIDEOS);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [loadingCustomClips, setLoadingCustomClips] = useState(true);
  const [deletingClipId, setDeletingClipId] = useState('');
  const allClips = useMemo(() => [...customClips, ...(clips || [])], [customClips, clips]);
  const [selectedClipId, setSelectedClipId] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'custom'
  const [channelFilter, setChannelFilter] = useState('all');
  const [loadedCuesById, setLoadedCuesById] = useState({});
  const [loadingCues, setLoadingCues] = useState(false);
  const [cuesLoadError, setCuesLoadError] = useState('');
  const [cuesLoadNonce, setCuesLoadNonce] = useState(0);

  useEffect(() => {
    let active = true;

    const syncUserVideos = async () => {
      setLoadingCustomClips(true);
      const res = await loadUserYoutubeVideos();
      if (!active) return;
      setIsUserAuthenticated(Boolean(res?.authenticated));
      setCustomClips(Array.isArray(res?.clips) ? res.clips : []);
      if (Number.isFinite(res?.limit) && res.limit >= 1) {
        setVideoLimit(res.limit);
      }
      setLoadingCustomClips(false);
    };

    syncUserVideos();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      syncUserVideos();
    });

    const settingsChannel = supabase
      .channel('studio_youtube_limit_settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings', filter: 'key=eq.user_youtube_video_limit' },
        (payload) => {
          if (payload?.new?.value != null && active) {
            setVideoLimit(clampYoutubeVideoLimit(payload.new.value, MAX_USER_YOUTUBE_VIDEOS));
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      authListener?.subscription?.unsubscribe();
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  const selectedClip = useMemo(
    () => (selectedClipId ? allClips.find((c) => c.id === selectedClipId) || null : null),
    [allClips, selectedClipId]
  );

  useEffect(() => {
    if (typeof onVideoOpenChange === 'function') {
      onVideoOpenChange(Boolean(selectedClip));
    }
  }, [selectedClip, onVideoOpenChange]);

  useEffect(() => {
    const clip = selectedClip;
    if (!clip) {
      setLoadingCues(false);
      setCuesLoadError('');
      return;
    }
    if ((Array.isArray(clip.cues) && clip.cues.length > 0) || Array.isArray(loadedCuesById[clip.id])) {
      setLoadingCues(false);
      setCuesLoadError('');
      return;
    }
    if (clip.guest) {
      setLoadingCues(false);
      return;
    }

    let active = true;
    setLoadingCues(true);
    setCuesLoadError('');
    fetchStudioVideoCues(clip.id)
      .then((fetchedCues) => {
        if (!active) return;
        setLoadedCuesById((prev) => ({
          ...prev,
          [clip.id]: Array.isArray(fetchedCues) ? fetchedCues : [],
        }));
        setLoadingCues(false);
      })
      .catch((err) => {
        if (!active) return;
        setCuesLoadError(err?.message || 'Không thể tải phụ đề cho video này.');
        setLoadingCues(false);
      });

    return () => {
      active = false;
    };
  }, [selectedClip, loadedCuesById, cuesLoadNonce]);

  const cues = useMemo(() => {
    if (Array.isArray(selectedClip?.cues) && selectedClip.cues.length > 0) {
      return selectedClip.cues;
    }
    if (selectedClip?.id && Array.isArray(loadedCuesById[selectedClip.id])) {
      return loadedCuesById[selectedClip.id];
    }
    return [];
  }, [selectedClip, loadedCuesById]);

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
  const [samplePlaying, setSamplePlaying] = useState(false);
  const [progress, setProgress] = useState(() => loadStudioProgress());

  // Add custom YouTube video state
  const [internalShowAddForm, setInternalShowAddForm] = useState(false);
  const showAddForm =
    typeof controlledShowAddForm === 'boolean' ? controlledShowAddForm : internalShowAddForm;
  const setShowAddForm = useCallback(
    (next) => {
      const resolved = typeof next === 'function' ? next(showAddForm) : next;
      if (typeof onShowAddFormChange === 'function') {
        onShowAddFormChange(resolved);
      } else {
        setInternalShowAddForm(resolved);
      }
    },
    [onShowAddFormChange, showAddForm]
  );
  const [ytUrlInput, setYtUrlInput] = useState('');
  const [importingYt, setImportingYt] = useState(false);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    if (showAddForm) {
      setImportError('');
    }
  }, [showAddForm]);

  useEffect(() => {
    if (typeof onQuotaChange === 'function') {
      onQuotaChange({
        used: customClips.length,
        limit: videoLimit,
        authenticated: isUserAuthenticated,
      });
    }
  }, [customClips.length, videoLimit, isUserAuthenticated, onQuotaChange]);

  // In-video dictation state per cue index
  const [dictInputs, setDictInputs] = useState({});
  const [dictChecked, setDictChecked] = useState({});
  const [dictHinted, setDictHinted] = useState({});

  const loopRef = useRef(loopActiveCue);
  const activeCueIdxRef = useRef(activeCueIdx);
  const cuesRef = useRef(cues);
  const clipRef = useRef(selectedClip);
  const sampleEndRef = useRef(null);
  const lastPolledTimeRef = useRef(0);

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
    sampleEndRef.current = null;
    lastPolledTimeRef.current = 0;
    setSamplePlaying(false);
    setDictHinted({});
  }, [selectedClip?.id]);

  // Always keep the active cue pinned at the top of the cue list and smoothly glide as video plays
  useEffect(() => {
    const container = cueListRef.current;
    const item = activeCueItemRef.current;
    if (!container || !item || container.clientHeight === 0) return undefined;

    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        const currentContainer = cueListRef.current;
        const currentItem = activeCueItemRef.current;
        if (!currentContainer || !currentItem || currentContainer.clientHeight === 0) return;

        const containerRect = currentContainer.getBoundingClientRect();
        const itemRect = currentItem.getBoundingClientRect();
        const delta = itemRect.top - containerRect.top;
        if (Math.abs(delta) < 3) return;

        const targetTop = Math.max(0, currentContainer.scrollTop + delta - 2);
        const isLargeJump = Math.abs(delta) > 420;
        currentContainer.scrollTo({
          top: targetTop,
          behavior: isLargeJump ? 'auto' : 'smooth',
        });
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, [activeCueIdx, cues.length, mobileCuesOpen, selectedClip?.id]);

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
            onStateChange: (e) => {
              if (cancelled) return;
              // 0 = ended, 2 = paused -> clear active single-cue video sample playback state
              if ((e.data === 0 || e.data === 2) && sampleEndRef.current !== null) {
                sampleEndRef.current = null;
                setSamplePlaying(false);
              }
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
            const playerState = player.getPlayerState?.();
            const scrubbedWhilePaused = playerState !== 1 && Math.abs(localTime - lastPolledTimeRef.current) > 0.35;
            lastPolledTimeRef.current = localTime;

            if (sampleEndRef.current !== null && playerState === 1) {
              if (localTime >= Number(sampleEndRef.current) - 0.06) {
                sampleEndRef.current = null;
                setSamplePlaying(false);
                player.pauseVideo?.();
              }
              return;
            }

            if (
              loopRef.current &&
              pinnedCue &&
              playerState === 1 &&
              localTime >= Number(pinnedCue.end) - 0.08
            ) {
              player.seekTo(Number(clip.start_seconds || 0) + Number(pinnedCue.start), true);
              return;
            }

            if (!loopRef.current && (playerState === 1 || scrubbedWhilePaused)) {
              const found = resolveActiveCueIndex(localTime, clip, currentCues);
              if (found >= 0 && found !== activeCueIdxRef.current) {
                setActiveCueIdx(found);
              }
            }
          } catch (_) {}
        }, 65);
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

  // Background-fill remaining untranslated cues on long guest videos so import stays fast
  useEffect(() => {
    if (!selectedClip?.guest || !Array.isArray(selectedClip.cues)) return;
    const missingIndices = selectedClip.cues
      .map((c, idx) => (!c.vietnamese_translation && c.text ? idx : -1))
      .filter((idx) => idx >= 0);
    if (!missingIndices.length) return;

    let cancelled = false;
    (async () => {
      let workingClip = selectedClip;
      for (let offset = 0; offset < missingIndices.length; offset += 20) {
        if (cancelled) return;
        const chunkIndices = missingIndices.slice(offset, offset + 20);
        const texts = chunkIndices.map((idx) => workingClip.cues[idx]?.text || '');
        try {
          const translated = await translateShadowingTexts(texts);
          if (cancelled || !translated.length) return;
          const updatedCues = [...workingClip.cues];
          let changed = false;
          chunkIndices.forEach((cueIdx, k) => {
            const viText = String(translated[k] || '').trim();
            if (viText && updatedCues[cueIdx] && !updatedCues[cueIdx].vietnamese_translation) {
              updatedCues[cueIdx] = { ...updatedCues[cueIdx], vietnamese_translation: viText };
              changed = true;
            }
          });
          if (changed) {
            workingClip = { ...workingClip, cues: updatedCues };
            setCustomClips((prev) => prev.map((c) => (c.id === workingClip.id ? workingClip : c)));
            void updateUserYoutubeVideoCues(workingClip);
          }
        } catch {
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedClip?.id]);

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
    sampleEndRef.current = null;
    lastPolledTimeRef.current = Number(cue.start || 0);
    setSamplePlaying(false);
    setActiveCueIdx(idx);
    try {
      const targetSec = Number(selectedClip.start_seconds || 0) + Number(cue.start || 0);
      ytPlayerRef.current?.seekTo?.(targetSec, true);
      if (autoPlay) ytPlayerRef.current?.playVideo?.();
    } catch (_) {}
  };

  const handleToggleCueVideoSample = () => {
    const cue = cues[activeCueIdx];
    if (!cue || !selectedClip || !ytPlayerRef.current) return;
    if (samplePlaying) {
      sampleEndRef.current = null;
      setSamplePlaying(false);
      try {
        ytPlayerRef.current.pauseVideo?.();
      } catch (_) {}
      return;
    }
    const startSec = Number(selectedClip.start_seconds || 0) + Number(cue.start || 0);
    const cueEnd = Math.max(Number(cue.start || 0) + 0.6, Number(cue.end || Number(cue.start || 0) + 4));
    sampleEndRef.current = cueEnd;
    setSamplePlaying(true);
    try {
      ytPlayerRef.current.seekTo?.(startSec, true);
      ytPlayerRef.current.playVideo?.();
    } catch (_) {
      sampleEndRef.current = null;
      setSamplePlaying(false);
    }
  };

  const usedVideoCount = customClips.length;
  const isQuotaFull = usedVideoCount >= videoLimit;

  const openLoginForVideoUpload = () => {
    if (typeof window !== 'undefined' && window.openRequireLoginModal) {
      window.openRequireLoginModal(
        `Đăng nhập tài khoản HiVocab để thêm video YouTube cá nhân (tối đa ${videoLimit} video/tài khoản) và đồng bộ trên mọi thiết bị.`,
        'Đăng nhập để thêm video YouTube 🎬',
        'thêm video YouTube cá nhân'
      );
    } else {
      window.showHiToast?.('Vui lòng đăng nhập để thêm video YouTube cá nhân!', 'error');
    }
  };

  const importYoutubeByUrl = async (rawUrl) => {
    if (importingYt) return;
    setImportError('');
    if (!isUserAuthenticated) {
      openLoginForVideoUpload();
      setImportError(
        `Vui lòng đăng nhập để thêm video YouTube cá nhân (mỗi tài khoản giới hạn ${videoLimit} video).`
      );
      return;
    }

    const trimmedUrl = String(rawUrl || '').trim();
    const videoId = extractYoutubeVideoId(trimmedUrl);
    if (!videoId) {
      setImportError('Link hoặc ID YouTube không hợp lệ (ví dụ: https://www.youtube.com/watch?v=...).');
      return;
    }

    const isAlreadySavedVideo = customClips.some((c) => c.youtube_video_id === videoId);
    if (!isAlreadySavedVideo && isQuotaFull) {
      setImportError(
        `Bạn đã đạt giới hạn ${videoLimit}/${videoLimit} video cá nhân. Hãy bấm biểu tượng thùng rác ở video cá nhân cũ để xóa bớt trước khi thêm mới.`
      );
      return;
    }

    setImportingYt(true);
    try {
      const res = await fetchYoutubeCaptionsPreview({
        youtubeUrl: trimmedUrl,
      });
      const fetchedClip = {
        ...res.clip,
        level: 'Custom',
        cues: res.cues_doc?.cues || [],
      };
      if (!fetchedClip.cues.length) {
        throw new Error('Video này không có phụ đề tiếng Anh trên YouTube.');
      }
      const synced = await loadUserYoutubeVideos();
      if (Number.isFinite(synced?.limit) && synced.limit >= 1) {
        setVideoLimit(synced.limit);
      }
      if (synced?.clips?.length) {
        setCustomClips(synced.clips);
      } else {
        setCustomClips((prev) => {
          const rest = prev.filter((x) => x.youtube_video_id !== fetchedClip.youtube_video_id);
          return [fetchedClip, ...rest].slice(0, videoLimit);
        });
      }
      setSelectedClipId(fetchedClip.id);
      setShowAddForm(false);
      setYtUrlInput('');
      window.showHiToast?.('Đã thêm video YouTube vào thư viện cá nhân!', 'success');
    } catch (err) {
      if (err?.status === 401) {
        openLoginForVideoUpload();
      }
      setImportError(err?.message || 'Không lấy được phụ đề tự động từ YouTube.');
      if (err?.code === 'VIDEO_QUOTA_EXCEEDED') {
        loadUserYoutubeVideos().then((synced) => {
          if (Number.isFinite(synced?.limit) && synced.limit >= 1) setVideoLimit(synced.limit);
          if (synced?.authenticated) setCustomClips(synced.clips);
        });
      }
    } finally {
      setImportingYt(false);
    }
  };

  const handleDeletePersonalClip = async (e, clip) => {
    e.stopPropagation();
    if (!clip || deletingClipId) return;
    setDeletingClipId(clip.id);
    try {
      const next = await deleteUserYoutubeVideo(clip);
      const nextClips = Array.isArray(next?.clips) ? next.clips : [];
      const activeLimit = Number.isFinite(next?.limit) && next.limit >= 1 ? next.limit : videoLimit;
      setVideoLimit(activeLimit);
      setCustomClips(nextClips);
      if (selectedClipId === clip.id) {
        setSelectedClipId('');
      }
      window.showHiToast?.(
        `Đã xóa video cá nhân (${nextClips.length}/${activeLimit} video đã dùng).`,
        'success'
      );
    } catch (err) {
      window.showHiToast?.(err?.message || 'Không thể xóa video cá nhân.', 'error');
    } finally {
      setDeletingClipId('');
    }
  };

  const handleImportYoutube = async (e) => {
    e.preventDefault();
    await importYoutubeByUrl(ytUrlInput);
  };

  const handleYoutubeUrlPaste = (e) => {
    const pasted = e.clipboardData?.getData('text')?.trim() || '';
    if (!pasted || !extractYoutubeVideoId(pasted) || importingYt) return;
    e.preventDefault();
    setYtUrlInput(pasted);
    void importYoutubeByUrl(pasted);
  };

  const sourceClips = useMemo(() => {
    if (sourceFilter === 'custom') {
      return allClips.filter((c) => Boolean(c.personal || c.guest || c.level === 'Custom'));
    }
    return allClips;
  }, [allClips, sourceFilter]);

  const availableChannels = useMemo(() => {
    const counts = new Map();
    for (const c of sourceClips) {
      const ch = getClipChannelName(c);
      if (!ch) continue;
      counts.set(ch, (counts.get(ch) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }, [sourceClips]);

  const filteredClips = useMemo(() => {
    if (channelFilter === 'all') return sourceClips;
    return sourceClips.filter((c) => getClipChannelName(c) === channelFilter);
  }, [sourceClips, channelFilter]);

  const channelGroups = useMemo(() => {
    const map = new Map();
    for (const clip of filteredClips) {
      const name = getClipChannelName(clip) || 'YouTube';
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(clip);
    }
    return Array.from(map.entries()).map(([name, groupClips]) => ({
      name,
      clips: groupClips,
    }));
  }, [filteredClips]);

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
          {/* Library Toolbar */}
          <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-[2.5px_2.5px_0px_#3D352E] space-y-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wide text-[#786F66] shrink-0 mr-1">
                Thư viện Video ({filteredClips.length}):
              </span>
              {['all', 'custom'].map((srcKey) => (
                <button
                  key={srcKey}
                  type="button"
                  onClick={() => {
                    setSourceFilter(srcKey);
                    setChannelFilter('all');
                  }}
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-extrabold border-2 transition-all cursor-pointer shrink-0 ${
                    sourceFilter === srcKey
                      ? 'bg-[#4D6B53] text-white border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E]'
                      : 'bg-white text-[#554D42] border-[#E8DEC8] hover:border-[#3D352E]'
                  }`}
                >
                  {srcKey === 'all' ? 'Tất cả' : `Cá nhân (${usedVideoCount}/${videoLimit})`}
                </button>
              ))}
            </div>

            {availableChannels.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 pt-0.5 border-t border-[#E8DEC8]">
                <span className="text-[11px] font-black uppercase tracking-wide text-[#786F66] shrink-0 mr-1">
                  Kênh:
                </span>
                <button
                  type="button"
                  onClick={() => setChannelFilter('all')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border-2 transition-all cursor-pointer shrink-0 ${
                    channelFilter === 'all'
                      ? 'bg-[#3D352E] text-white border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E]'
                      : 'bg-white text-[#554D42] border-[#E8DEC8] hover:border-[#3D352E]'
                  }`}
                >
                  Tất cả kênh ({sourceClips.length})
                </button>
                {availableChannels.map((ch) => (
                  <button
                    key={ch.name}
                    type="button"
                    onClick={() => setChannelFilter(ch.name)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border-2 transition-all cursor-pointer shrink-0 ${
                      channelFilter === ch.name
                        ? 'bg-[#D96B43] text-white border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E]'
                        : 'bg-white text-[#554D42] border-[#E8DEC8] hover:border-[#3D352E]'
                    }`}
                  >
                    {ch.name} ({ch.count})
                  </button>
                ))}
              </div>
            )}

            {/* Compact Quota & Usage Hint Always Visible */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#FAF5EB] border border-[#E8DEC8] text-[11px] font-bold text-[#554D42]">
              <div className="flex items-center gap-1.5 min-w-0">
                <Info className="w-3.5 h-3.5 text-[#4D6B53] shrink-0" />
                <span>
                  {isUserAuthenticated ? (
                    <>
                      Đã lưu <strong className="text-[#2E2823]">{usedVideoCount}/{videoLimit}</strong> video YouTube cá nhân (mỗi tài khoản tối đa {videoLimit} video; video mẫu có sẵn không tính vào giới hạn).
                    </>
                  ) : (
                    <>
                      Mỗi tài khoản được lưu tối đa <strong className="text-[#2E2823]">{videoLimit} video YouTube cá nhân</strong> (đồng bộ theo tài khoản, video mẫu hệ thống dùng miễn phí không giới hạn).
                    </>
                  )}
                </span>
              </div>
              {!showAddForm && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="text-[11px] font-black text-[#D96B43] hover:underline shrink-0 cursor-pointer"
                >
                  Xem hướng dẫn thêm video →
                </button>
              )}
            </div>

            {/* Add Custom YouTube Form + Step-by-step Guide */}
            {showAddForm && (
              <form
                onSubmit={handleImportYoutube}
                className="bg-[#FAF5EB] border-2 border-[#3D352E] rounded-2xl p-3 sm:p-4 space-y-3"
              >
                {/* Step-by-step user guide & dynamic video limit explanation */}
                <div className="bg-white border-2 border-[#3D352E]/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-black text-[#2E2823] flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-[#4D6B53] shrink-0" />
                      <span>Hướng dẫn thêm video YouTube cá nhân</span>
                    </span>
                    <span
                      className={`text-[10.5px] font-black px-2 py-0.5 rounded-full border ${
                        isQuotaFull && isUserAuthenticated
                          ? 'bg-[#FDECE8] text-[#B53D2A] border-[#D96B43]'
                          : 'bg-[#EEF5EC] text-[#355A3B] border-[#4D6B53]/40'
                      }`}
                    >
                      {loadingCustomClips
                        ? 'Đang kiểm tra...'
                        : isUserAuthenticated
                          ? `Hạn mức tài khoản: ${usedVideoCount}/${videoLimit} video`
                          : `Giới hạn: ${videoLimit} video / tài khoản`}
                    </span>
                  </div>
                  <ol className="text-[11.5px] font-semibold text-[#554D42] space-y-1 list-decimal list-inside leading-relaxed">
                    <li>
                      Chọn một video YouTube <strong className="text-[#2E2823]">có bật phụ đề tiếng Anh (CC)</strong> rồi sao chép link (<code className="text-[10.5px] bg-[#FAF5EB] px-1 rounded">youtube.com/watch?v=...</code>, <code className="text-[10.5px] bg-[#FAF5EB] px-1 rounded">youtu.be/...</code> hoặc Shorts).
                    </li>
                    <li>
                      Dán link vào ô nhập — hệ thống tự động tách phụ đề theo từng câu kèm dịch nghĩa tiếng Việt để bạn luyện Shadowing &amp; Chép chính tả.
                    </li>
                    <li>
                      Mỗi tài khoản lưu tối đa <strong className="text-[#2E2823]">{videoLimit} video cá nhân</strong>. Khi đã đủ {videoLimit}/{videoLimit}, hãy bấm nút <strong className="text-[#B53D2A]">Thùng rác (🗑)</strong> ở góc trên bên phải thẻ video cũ để xóa bớt rồi thêm video mới.
                    </li>
                  </ol>
                </div>

                {!isUserAuthenticated ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#FFF6DF] border-2 border-[#3D352E] rounded-xl p-3">
                    <p className="text-xs font-bold text-[#2E2823]">
                      Bạn cần đăng nhập để thêm video YouTube và lưu tối đa {videoLimit} video vào tài khoản của mình.
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={openLoginForVideoUpload}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D96B43] hover:bg-[#C85A3F] text-white text-xs font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Đăng nhập để thêm video</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-3 py-2 rounded-xl bg-white text-xs font-bold border-2 border-[#3D352E] cursor-pointer"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {isQuotaFull && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FDECE8] border-2 border-[#D96B43] rounded-xl p-3">
                        <div className="flex items-start gap-2 text-xs font-bold text-[#9C2F1E]">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>
                            Tài khoản của bạn đã đạt giới hạn <strong>{videoLimit}/{videoLimit} video</strong>. Vui lòng xóa bớt video cá nhân cũ để thêm video mới.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSourceFilter('custom')}
                          className="px-3 py-1.5 rounded-xl bg-white text-[11px] font-black text-[#B53D2A] border border-[#D96B43] hover:bg-[#FFF5F2] shrink-0 cursor-pointer"
                        >
                          Xem {usedVideoCount} video cá nhân
                        </button>
                      </div>
                    )}

                    <label className="block space-y-1">
                      <span className="text-xs font-extrabold text-[#2E2823]">
                        Dán link YouTube (tự động lấy tiêu đề, phụ đề Anh &amp; dịch tiếng Việt)
                      </span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          autoFocus={!isQuotaFull}
                          disabled={importingYt}
                          value={ytUrlInput}
                          onChange={(e) => setYtUrlInput(e.target.value)}
                          onPaste={handleYoutubeUrlPaste}
                          placeholder={
                            isQuotaFull
                              ? `Đã đủ ${videoLimit}/${videoLimit} video — hãy xóa bớt video cũ trước khi thêm mới`
                              : 'https://www.youtube.com/watch?v=... hoặc youtu.be/...'
                          }
                          className="flex-1 px-3 py-2 rounded-xl bg-white border-2 border-[#3D352E] text-xs font-bold focus:outline-none disabled:opacity-60"
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="submit"
                            disabled={importingYt || isQuotaFull}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#4D6B53] text-white text-xs font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {importingYt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                            <span>{importingYt ? 'Đang lấy phụ đề...' : isQuotaFull ? `Đã đủ ${videoLimit}/${videoLimit}` : 'Thêm video'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-3 py-2 rounded-xl bg-white text-xs font-bold border-2 border-[#3D352E] cursor-pointer"
                          >
                            Đóng
                          </button>
                        </div>
                      </div>
                    </label>
                  </>
                )}

                {importError && (
                  <p className="text-xs font-bold text-[#B53D2A] bg-[#FDECE8] border border-[#D96B43]/40 rounded-xl px-3 py-2">
                    {importError}
                  </p>
                )}
              </form>
            )}
          </div>

          {/* YouTube Thumbnail Video Cards Grid */}
          {filteredClips.length === 0 ? (
            <div className="bg-[#fffcf7] border-2 border-dashed border-[#3D352E]/40 rounded-2xl p-6 text-center space-y-2.5">
              <Video className="w-8 h-8 text-[#4D6B53]/60 mx-auto" />
              <p className="text-sm font-black text-[#2E2823]">
                {sourceFilter === 'custom'
                  ? 'Bạn chưa thêm video YouTube cá nhân nào'
                  : 'Không có video nào ở mục này'}
              </p>
              <p className="text-xs font-semibold text-[#68594D] max-w-md mx-auto">
                {sourceFilter === 'custom'
                  ? `Mỗi tài khoản được thêm tối đa ${videoLimit} video YouTube có phụ đề tiếng Anh để luyện Shadowing & Dictation.`
                  : 'Hãy chuyển sang mục Tất cả hoặc thêm video YouTube của riêng bạn.'}
              </p>
              {sourceFilter === 'custom' && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D96B43] hover:bg-[#C85A3F] text-white text-xs font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm video YouTube đầu tiên</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {channelGroups.map((group) => (
                <ChannelVideoRow
                  key={group.name}
                  channelName={group.name}
                  clips={group.clips}
                  progress={progress}
                  deletingClipId={deletingClipId}
                  onSelectClip={setSelectedClipId}
                  onDeleteClip={handleDeletePersonalClip}
                />
              ))}
            </div>
          )}
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
                {loadingCues ? (
                  <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4D6B53]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang tải phụ đề Anh – Việt...</span>
                  </p>
                ) : cuesLoadError ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#B53D2A]">
                    <span>{cuesLoadError}</span>
                    <button
                      type="button"
                      onClick={() => setCuesLoadNonce((n) => n + 1)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#3D352E] text-[11px] font-black text-[#2E2823] hover:bg-[#F4E3B4] cursor-pointer"
                    >
                      Thử tải lại
                    </button>
                  </div>
                ) : !showSubtitle ? (
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
                      onPlaySample={handleToggleCueVideoSample}
                      externalSamplePlaying={samplePlaying}
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
                className="relative max-h-[420px] lg:max-h-[min(540px,calc(100vh-220px))] xl:max-h-[min(620px,calc(100vh-210px))] overflow-y-auto space-y-2 pr-1 pb-32"
              >
                {loadingCues && cues.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-xs font-bold text-[#4D6B53]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tải danh sách câu thoại...</span>
                  </div>
                ) : cuesLoadError && cues.length === 0 ? (
                  <div className="p-3 rounded-xl bg-[#FDECE8] border border-[#D96B43] text-xs font-bold text-[#B53D2A] space-y-2">
                    <p>{cuesLoadError}</p>
                    <button
                      type="button"
                      onClick={() => setCuesLoadNonce((n) => n + 1)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#3D352E] text-[#2E2823] font-black cursor-pointer"
                    >
                      Tải lại phụ đề
                    </button>
                  </div>
                ) : cues.map((cue, idx) => {
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
