import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Video,
  ListVideo,
  Link2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Search,
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext.jsx';
import {
  adminDeleteStudioVideo,
  adminImportStudioYoutubeVideo,
  adminListStudioVideos,
  adminResolveYoutubeChannel,
  adminUpdateStudioVideo,
} from '../../../services/studioService.js';

const LEVELS = ['A2', 'B1', 'B2', 'C1'];

function parseYoutubeUrlLines(rawText) {
  const tokens = String(rawText || '')
    .split(/[\n,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set();
  const items = [];

  for (const token of tokens) {
    let vid = '';
    if (/^[A-Za-z0-9_-]{11}$/.test(token)) {
      vid = token;
    } else {
      try {
        const u = new URL(token.startsWith('http') ? token : `https://${token}`);
        const host = u.hostname.replace(/^www\./, '').toLowerCase();
        if (host === 'youtu.be') {
          vid = u.pathname.replace(/^\/+/, '').split('/')[0] || '';
        } else if (host.endsWith('youtube.com')) {
          vid = u.searchParams.get('v') || '';
          if (!vid) {
            const parts = u.pathname.split('/').filter(Boolean);
            if (parts.length >= 2 && ['shorts', 'embed', 'live', 'v'].includes(parts[0])) {
              vid = parts[1];
            }
          }
        }
      } catch (_) {}
    }

    if (/^[A-Za-z0-9_-]{11}$/.test(vid) && !seen.has(vid)) {
      seen.add(vid);
      items.push({
        youtube_video_id: vid,
        url: `https://www.youtube.com/watch?v=${vid}`,
        title: '',
      });
    }
  }

  return items;
}

export function AdminStudioVideosManager() {
  const { showToast } = useToast();
  const [importMode, setImportMode] = useState('channel'); // 'channel' | 'urls'

  // Channel resolver state
  const [channelUrlInput, setChannelUrlInput] = useState('');
  const [channelLimit, setChannelLimit] = useState(20);
  const [resolvingChannel, setResolvingChannel] = useState(false);
  const [channelResult, setChannelResult] = useState(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState(() => new Set());
  const [channelNameOverride, setChannelNameOverride] = useState('');
  const [defaultLevel, setDefaultLevel] = useState('B1');

  // Batch URLs state
  const [batchUrlsText, setBatchUrlsText] = useState('');
  const [batchChannelName, setBatchChannelName] = useState('');
  const [batchLevel, setBatchLevel] = useState('B1');
  const parsedBatchItems = useMemo(() => parseYoutubeUrlLines(batchUrlsText), [batchUrlsText]);

  // Queue state
  const [queueJobs, setQueueJobs] = useState([]);
  const [runningQueue, setRunningQueue] = useState(false);

  // Catalog table state
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftEdits, setDraftEdits] = useState({});
  const [busyVideoId, setBusyVideoId] = useState('');

  const refreshCatalog = useCallback(async () => {
    setLoadingVideos(true);
    try {
      const list = await adminListStudioVideos();
      setVideos(list);
      setDraftEdits({});
    } catch (err) {
      showToast(err?.message || 'Không tải được kho video hệ thống.', 'error');
    } finally {
      setLoadingVideos(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  const handleResolveChannel = async (e) => {
    e.preventDefault();
    const trimmed = channelUrlInput.trim();
    if (!trimmed) {
      showToast('Vui lòng nhập link kênh YouTube (ví dụ: https://www.youtube.com/@TEDEd).', 'error');
      return;
    }

    setResolvingChannel(true);
    setChannelResult(null);
    setSelectedVideoIds(new Set());
    try {
      const res = await adminResolveYoutubeChannel({
        channelUrl: trimmed,
        limit: channelLimit,
      });
      setChannelResult(res);
      setChannelNameOverride(res.channel_name || '');
      const initialSelect = new Set(
        (res.videos || []).filter((v) => !v.already_imported).map((v) => v.youtube_video_id)
      );
      setSelectedVideoIds(initialSelect);
      showToast(
        `Đã tìm thấy ${res.videos?.length || 0} video từ kênh "${res.channel_name || 'YouTube'}".`,
        'success'
      );
    } catch (err) {
      showToast(err?.message || 'Không đọc được danh sách video từ kênh YouTube này.', 'error');
    } finally {
      setResolvingChannel(false);
    }
  };

  const toggleVideoSelection = (vid) => {
    setSelectedVideoIds((prev) => {
      const next = new Set(prev);
      if (next.has(vid)) {
        next.delete(vid);
      } else {
        next.add(vid);
      }
      return next;
    });
  };

  const runImportJobs = async (initialJobs) => {
    if (!initialJobs.length || runningQueue) return;
    setRunningQueue(true);
    setQueueJobs(initialJobs);

    const queue = initialJobs.map((job, idx) => ({ ...job, idx }));
    let cursor = 0;
    let successCount = 0;
    let errorCount = 0;

    const worker = async () => {
      while (cursor < queue.length) {
        const myPos = cursor;
        cursor += 1;
        const job = queue[myPos];

        setQueueJobs((prev) =>
          prev.map((item, i) => (i === job.idx ? { ...item, status: 'processing', error: '' } : item))
        );

        try {
          const imported = await adminImportStudioYoutubeVideo({
            youtubeUrl: job.url,
            title: job.title,
            channelName: job.channelName,
            level: job.level,
            isPublished: true,
          });
          successCount += 1;
          setQueueJobs((prev) =>
            prev.map((item, i) =>
              i === job.idx
                ? {
                    ...item,
                    status: 'done',
                    title: imported?.title || item.title || item.youtube_video_id,
                    cueCount: imported?.cue_count || 0,
                    translatedCues: imported?.translated_cues || 0,
                  }
                : item
            )
          );
        } catch (err) {
          errorCount += 1;
          setQueueJobs((prev) =>
            prev.map((item, i) =>
              i === job.idx
                ? {
                    ...item,
                    status: 'error',
                    error: err?.message || 'Lỗi trích xuất/dịch phụ đề',
                  }
                : item
            )
          );
        }
      }
    };

    const concurrency = Math.min(2, queue.length);
    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    setRunningQueue(false);
    await refreshCatalog();

    if (successCount > 0 && errorCount === 0) {
      showToast(`Đã nạp thành công ${successCount} video vào kho Shadowing (Free)!`, 'success');
    } else if (successCount > 0) {
      showToast(`Hoàn tất: ${successCount} thành công, ${errorCount} lỗi.`, 'warning');
    } else if (errorCount > 0) {
      showToast(`Không nạp được video nào (${errorCount} lỗi).`, 'error');
    }
  };

  const handleStartChannelImport = () => {
    if (!channelResult?.videos?.length) return;
    const selected = channelResult.videos.filter((v) => selectedVideoIds.has(v.youtube_video_id));
    if (!selected.length) {
      showToast('Vui lòng chọn ít nhất 1 video để nạp.', 'error');
      return;
    }

    const jobs = selected.map((v) => ({
      youtube_video_id: v.youtube_video_id,
      url: v.url,
      title: v.title || '',
      channelName: (channelNameOverride || channelResult.channel_name || '').trim(),
      level: defaultLevel,
      status: 'pending',
      error: '',
      cueCount: 0,
    }));
    void runImportJobs(jobs);
  };

  const handleStartBatchUrlImport = () => {
    if (!parsedBatchItems.length) {
      showToast('Chưa tìm thấy link YouTube hợp lệ nào.', 'error');
      return;
    }

    const jobs = parsedBatchItems.map((item) => ({
      youtube_video_id: item.youtube_video_id,
      url: item.url,
      title: '',
      channelName: batchChannelName.trim(),
      level: batchLevel,
      status: 'pending',
      error: '',
      cueCount: 0,
    }));
    void runImportJobs(jobs);
  };

  const handleRetryFailedJobs = () => {
    const failed = queueJobs.filter((j) => j.status === 'error');
    if (!failed.length) return;
    void runImportJobs(
      failed.map((j) => ({
        ...j,
        status: 'pending',
        error: '',
      }))
    );
  };

  const availableChannels = useMemo(() => {
    const map = new Map();
    for (const v of videos) {
      const ch = (v.channel_name || v.author || 'YouTube').trim();
      map.set(ch, (map.get(ch) || 0) + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [videos]);

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return videos.filter((v) => {
      const ch = (v.channel_name || v.author || 'YouTube').trim();
      if (filterChannel !== 'all' && ch !== filterChannel) return false;
      if (filterLevel !== 'all' && (v.level || 'B1') !== filterLevel) return false;
      if (q) {
        const hay = `${v.title || ''} ${v.youtube_video_id || ''} ${ch}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [videos, filterChannel, filterLevel, searchQuery]);

  const setDraftField = (id, field, value) => {
    setDraftEdits((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  };

  const handleSaveVideoRow = async (video) => {
    const draft = draftEdits[video.id];
    if (!draft) return;
    setBusyVideoId(video.id);
    try {
      const patch = {};
      if (draft.title !== undefined) patch.title = draft.title.trim() || video.title;
      if (draft.channel_name !== undefined) {
        const nextCh = draft.channel_name.trim() || 'YouTube';
        patch.channel_name = nextCh;
        patch.author = nextCh;
      }
      if (draft.level !== undefined) patch.level = draft.level;

      await adminUpdateStudioVideo(video.id, patch);
      setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, ...patch } : v)));
      setDraftEdits((prev) => {
        const next = { ...prev };
        delete next[video.id];
        return next;
      });
      showToast('Đã cập nhật thông tin video.', 'success');
    } catch (err) {
      showToast(err?.message || 'Không lưu được thay đổi.', 'error');
    } finally {
      setBusyVideoId('');
    }
  };

  const handleTogglePublished = async (video) => {
    setBusyVideoId(video.id);
    const nextPublished = !video.is_published;
    try {
      await adminUpdateStudioVideo(video.id, { is_published: nextPublished });
      setVideos((prev) =>
        prev.map((v) => (v.id === video.id ? { ...v, is_published: nextPublished } : v))
      );
      showToast(nextPublished ? 'Đã hiển thị video cho học viên.' : 'Đã ẩn video khỏi thư viện.', 'success');
    } catch (err) {
      showToast(err?.message || 'Không đổi được trạng thái hiển thị.', 'error');
    } finally {
      setBusyVideoId('');
    }
  };

  const handleDeleteVideo = async (video) => {
    if (!window.confirm(`Xóa video "${video.title}" khỏi kho Shadowing hệ thống?`)) return;
    setBusyVideoId(video.id);
    try {
      await adminDeleteStudioVideo(video.id);
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
      showToast('Đã xóa video khỏi kho hệ thống.', 'success');
    } catch (err) {
      showToast(err?.message || 'Không thể xóa video.', 'error');
    } finally {
      setBusyVideoId('');
    }
  };

  const queueDoneCount = queueJobs.filter((j) => j.status === 'done').length;
  const queueErrorCount = queueJobs.filter((j) => j.status === 'error').length;
  const queueFinishedCount = queueDoneCount + queueErrorCount;

  return (
    <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-3xl p-5 sm:p-6 shadow-[4px_4px_0px_#3D352E] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#D96B43] border-2 border-[#3D352E] flex items-center justify-center shrink-0">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#2E2823]">
              Kho Video Shadowing (Upload Hàng Loạt &amp; Phân Loại Kênh)
            </h2>
            <p className="text-xs font-semibold text-[#786F66] mt-0.5">
              Nạp hàng loạt video YouTube từ link kênh (tự lấy 20 video mới nhất) hoặc danh sách URL. Tự động lấy phụ đề Anh – Việt, mặc định Free cho mọi tài khoản.
            </p>
          </div>
        </div>
        <span className="self-start px-3 py-1 rounded-full bg-[#EEF5EC] border border-[#4D6B53] text-xs font-black text-[#355A3B] shrink-0">
          {videos.length} video trong kho
        </span>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setImportMode('channel')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-xs font-black transition-all cursor-pointer ${
            importMode === 'channel'
              ? 'bg-[#D96B43] text-white border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
              : 'bg-white text-[#554D42] border-[#E8DEC8] hover:border-[#3D352E]'
          }`}
        >
          <ListVideo className="w-4 h-4" />
          <span>1. Từ Link Kênh YouTube (Auto 20 video mới nhất)</span>
        </button>
        <button
          type="button"
          onClick={() => setImportMode('urls')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-xs font-black transition-all cursor-pointer ${
            importMode === 'urls'
              ? 'bg-[#D96B43] text-white border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
              : 'bg-white text-[#554D42] border-[#E8DEC8] hover:border-[#3D352E]'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>2. Dán Danh Sách Link YouTube</span>
        </button>
      </div>

      {/* Mode 1: YouTube Channel Resolver */}
      {importMode === 'channel' && (
        <div className="bg-[#FAF5EB] border-2 border-[#3D352E] rounded-2xl p-4 space-y-4">
          <form onSubmit={handleResolveChannel} className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
            <div className="md:col-span-7 space-y-1">
              <label className="text-[11px] font-black uppercase text-[#554D42]">
                Link Kênh YouTube (@handle, /channel/UC..., /c/...)
              </label>
              <input
                type="url"
                value={channelUrlInput}
                onChange={(e) => setChannelUrlInput(e.target.value)}
                placeholder="https://www.youtube.com/@TEDEd"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#3D352E] bg-white text-sm font-semibold text-[#2E2823] focus:outline-none focus:ring-2 focus:ring-[#D96B43]/40"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-black uppercase text-[#554D42]">Số video mới</label>
              <select
                value={channelLimit}
                onChange={(e) => setChannelLimit(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-[#3D352E] bg-white text-sm font-bold text-[#2E2823]"
              >
                <option value={10}>10 video</option>
                <option value={20}>20 video</option>
                <option value={30}>30 video</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={resolvingChannel || runningQueue}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4D6B53] hover:bg-[#3E5843] text-white text-xs font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] disabled:opacity-60 cursor-pointer"
              >
                {resolvingChannel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>{resolvingChannel ? 'Đang quét kênh...' : 'Quét video mới nhất'}</span>
              </button>
            </div>
          </form>

          {channelResult && (
            <div className="space-y-3 pt-2 border-t border-[#E8DEC8]">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                <div className="md:col-span-5 space-y-1">
                  <label className="text-[11px] font-black uppercase text-[#554D42]">
                    Tên Kênh hiển thị trong bộ lọc Shadowing
                  </label>
                  <input
                    type="text"
                    value={channelNameOverride}
                    onChange={(e) => setChannelNameOverride(e.target.value)}
                    placeholder="Ví dụ: TED-Ed, Friends, BBC Learning English..."
                    className="w-full px-3 py-2 rounded-xl border-2 border-[#3D352E] bg-white text-xs font-bold text-[#2E2823]"
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[11px] font-black uppercase text-[#554D42]">Trình độ mặc định</label>
                  <select
                    value={defaultLevel}
                    onChange={(e) => setDefaultLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-[#3D352E] bg-white text-xs font-bold text-[#2E2823]"
                  >
                    {LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedVideoIds(
                        new Set(
                          (channelResult.videos || [])
                            .filter((v) => !v.already_imported)
                            .map((v) => v.youtube_video_id)
                        )
                      )
                    }
                    className="px-2.5 py-2 rounded-xl bg-white border border-[#3D352E] text-[11px] font-extrabold hover:bg-[#F4E3B4] cursor-pointer"
                  >
                    Chọn video mới
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVideoIds(new Set())}
                    className="px-2.5 py-2 rounded-xl bg-white border border-[#3D352E] text-[11px] font-extrabold hover:bg-[#FDECE8] cursor-pointer"
                  >
                    Bỏ chọn hết
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {(channelResult.videos || []).map((v) => {
                  const checked = selectedVideoIds.has(v.youtube_video_id);
                  return (
                    <label
                      key={v.youtube_video_id}
                      className={`flex items-center gap-3 p-2 rounded-xl border-2 transition-colors cursor-pointer ${
                        checked
                          ? 'bg-[#EEF5EC] border-[#4D6B53]'
                          : 'bg-white border-[#E8DEC8] hover:border-[#3D352E]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleVideoSelection(v.youtube_video_id)}
                        className="w-4 h-4 accent-[#4D6B53] shrink-0"
                      />
                      <img
                        src={`https://i.ytimg.com/vi/${v.youtube_video_id}/mqdefault.jpg`}
                        alt={v.title}
                        className="w-16 h-9 object-cover rounded-lg border border-[#3D352E] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold text-[#2E2823] truncate">
                          {v.title || v.youtube_video_id}
                        </div>
                        <div className="text-[10px] font-bold text-[#786F66] flex items-center gap-2">
                          <span>ID: {v.youtube_video_id}</span>
                          {v.duration_text && <span>· {v.duration_text}</span>}
                          {v.published_text && <span>· {v.published_text}</span>}
                        </div>
                      </div>
                      {v.already_imported && (
                        <span className="px-2 py-0.5 rounded-full bg-[#F4E3B4] border border-[#3D352E] text-[10px] font-black text-[#3D352E] shrink-0">
                          Đã có trong kho
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-xs font-bold text-[#554D42]">
                  Đã chọn <strong className="text-[#2E2823]">{selectedVideoIds.size}</strong> /{' '}
                  {channelResult.videos?.length || 0} video (mặc định Free, tự trích xuất sub Anh &amp; dịch 100% sang Tiếng Việt)
                </span>
                <button
                  type="button"
                  disabled={runningQueue || selectedVideoIds.size === 0}
                  onClick={handleStartChannelImport}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D96B43] hover:bg-[#C85A3F] text-white text-xs font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] disabled:opacity-50 cursor-pointer"
                >
                  {runningQueue ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  <span>Nạp {selectedVideoIds.size} video đã chọn</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Batch YouTube URLs */}
      {importMode === 'urls' && (
        <div className="bg-[#FAF5EB] border-2 border-[#3D352E] rounded-2xl p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-[#554D42]">
              Dán danh sách link YouTube (mỗi dòng 1 link hoặc cách nhau bởi dấu phẩy)
            </label>
            <textarea
              rows={5}
              value={batchUrlsText}
              onChange={(e) => setBatchUrlsText(e.target.value)}
              placeholder={`https://www.youtube.com/watch?v=dQw4w9WgXcQ\nhttps://youtu.be/ki_DGMh2r0c`}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#3D352E] bg-white text-xs font-mono text-[#2E2823] focus:outline-none focus:ring-2 focus:ring-[#D96B43]/40"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
            <div className="md:col-span-6 space-y-1">
              <label className="text-[11px] font-black uppercase text-[#554D42]">
                Tên Kênh phân loại (bỏ trống sẽ tự lấy tên kênh trên YouTube)
              </label>
              <input
                type="text"
                value={batchChannelName}
                onChange={(e) => setBatchChannelName(e.target.value)}
                placeholder="Ví dụ: BBC Learning English, Suits, Friends..."
                className="w-full px-3 py-2 rounded-xl border-2 border-[#3D352E] bg-white text-xs font-bold text-[#2E2823]"
              />
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-black uppercase text-[#554D42]">Trình độ mặc định</label>
              <select
                value={batchLevel}
                onChange={(e) => setBatchLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-[#3D352E] bg-white text-xs font-bold text-[#2E2823]"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <button
                type="button"
                disabled={runningQueue || parsedBatchItems.length === 0}
                onClick={handleStartBatchUrlImport}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#D96B43] hover:bg-[#C85A3F] text-white text-xs font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] disabled:opacity-50 cursor-pointer"
              >
                {runningQueue ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>Nạp {parsedBatchItems.length} link vào kho</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Queue Progress Drawer */}
      {queueJobs.length > 0 && (
        <div className="bg-white border-2 border-[#3D352E] rounded-2xl p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-black text-[#2E2823]">
              Tiến độ nạp hàng loạt: {queueFinishedCount}/{queueJobs.length} video ({queueDoneCount} thành công
              {queueErrorCount > 0 ? `, ${queueErrorCount} lỗi` : ''})
            </div>
            {!runningQueue && queueErrorCount > 0 && (
              <button
                type="button"
                onClick={handleRetryFailedJobs}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#F4E3B4] border border-[#3D352E] text-[11px] font-black cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Thử lại {queueErrorCount} video lỗi</span>
              </button>
            )}
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#FAF5EB] border border-[#3D352E]/40 overflow-hidden">
            <div
              className="h-full bg-[#4D6B53] transition-all duration-300"
              style={{ width: `${Math.round((queueFinishedCount / queueJobs.length) * 100)}%` }}
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {queueJobs.map((job) => (
              <div
                key={job.youtube_video_id}
                className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#FAF5EB] border border-[#E8DEC8] text-xs"
              >
                <span className="font-bold text-[#2E2823] truncate">
                  {job.title || job.youtube_video_id}
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-black">
                  {job.status === 'pending' && <span className="text-[#786F66]">Đang chờ</span>}
                  {job.status === 'processing' && (
                    <span className="inline-flex items-center gap-1 text-[#D96B43]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang lấy sub &amp; dịch...
                    </span>
                  )}
                  {job.status === 'done' && (
                    <span className="inline-flex items-center gap-1 text-[#355A3B]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {job.cueCount} câu
                    </span>
                  )}
                  {job.status === 'error' && (
                    <span className="inline-flex items-center gap-1 text-[#B53D2A]" title={job.error}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {job.error}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing System Catalog Table */}
      <div className="space-y-3 pt-2 border-t-2 border-[#E8DEC8]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-black text-[#2E2823]">
            Danh sách Video Hệ thống ({filteredVideos.length}/{videos.length})
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border-2 border-[#3D352E] bg-white text-xs font-bold text-[#2E2823]"
            >
              <option value="all">Tất cả kênh ({videos.length})</option>
              {availableChannels.map((ch) => (
                <option key={ch.name} value={ch.name}>
                  {ch.name} ({ch.count})
                </option>
              ))}
            </select>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border-2 border-[#3D352E] bg-white text-xs font-bold text-[#2E2823]"
            >
              <option value="all">Mọi trình độ</option>
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tiêu đề / ID..."
              className="px-3 py-1.5 rounded-xl border-2 border-[#3D352E] bg-white text-xs font-semibold text-[#2E2823] w-44"
            />
            <button
              type="button"
              onClick={refreshCatalog}
              disabled={loadingVideos}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border-2 border-[#3D352E] bg-white text-xs font-black hover:bg-[#FAF5EB] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingVideos ? 'animate-spin' : ''}`} />
              <span>Tải lại</span>
            </button>
          </div>
        </div>

        {loadingVideos ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs font-bold text-[#786F66]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang tải danh sách video từ Supabase...</span>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-8 text-xs font-bold text-[#786F66] bg-[#FAF5EB] rounded-2xl border border-[#E8DEC8]">
            Chưa có video nào khớp bộ lọc hiện tại.
          </div>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredVideos.map((video) => {
              const draft = draftEdits[video.id] || {};
              const titleVal = draft.title !== undefined ? draft.title : video.title;
              const channelVal =
                draft.channel_name !== undefined ? draft.channel_name : video.channel_name || video.author || '';
              const levelVal = draft.level !== undefined ? draft.level : video.level || 'B1';
              const hasChanges = Boolean(draftEdits[video.id]);
              const isBusy = busyVideoId === video.id;

              return (
                <div
                  key={video.id}
                  className="flex flex-col lg:flex-row lg:items-center gap-2.5 p-3 rounded-2xl bg-[#FAF5EB] border border-[#E8DEC8]"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <img
                      src={`https://i.ytimg.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-16 h-9 object-cover rounded-lg border border-[#3D352E] shrink-0"
                    />
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        value={titleVal}
                        onChange={(e) => setDraftField(video.id, 'title', e.target.value)}
                        className="sm:col-span-6 px-2.5 py-1.5 rounded-lg border border-[#3D352E]/50 bg-white text-xs font-bold text-[#2E2823]"
                        title="Tiêu đề video"
                      />
                      <input
                        type="text"
                        value={channelVal}
                        onChange={(e) => setDraftField(video.id, 'channel_name', e.target.value)}
                        className="sm:col-span-4 px-2.5 py-1.5 rounded-lg border border-[#3D352E]/50 bg-white text-xs font-semibold text-[#554D42]"
                        placeholder="Tên kênh"
                        title="Kênh phân loại"
                      />
                      <select
                        value={levelVal}
                        onChange={(e) => setDraftField(video.id, 'level', e.target.value)}
                        className="sm:col-span-2 px-2 py-1.5 rounded-lg border border-[#3D352E]/50 bg-white text-xs font-black text-[#2E2823]"
                      >
                        {LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                    <span className="px-2 py-1 rounded-lg bg-white border border-[#E8DEC8] text-[10px] font-black text-[#554D42]">
                      {video.cue_count || 0} câu
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-[#EEF5EC] border border-[#4D6B53]/40 text-[10px] font-black text-[#355A3B]">
                      {video.is_pro ? 'Pro' : 'Free'}
                    </span>
                    {hasChanges && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleSaveVideoRow(video)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4D6B53] text-white border border-[#3D352E] text-[11px] font-black cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3 h-3" />
                        <span>Lưu</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleTogglePublished(video)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#3D352E] text-[11px] font-black cursor-pointer disabled:opacity-50 ${
                        video.is_published
                          ? 'bg-white text-[#355A3B]'
                          : 'bg-[#F4E3B4] text-[#786F66]'
                      }`}
                      title={video.is_published ? 'Đang hiển thị cho học viên' : 'Đang ẩn'}
                    >
                      {video.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{video.is_published ? 'Hiện' : 'Ẩn'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDeleteVideo(video)}
                      className="p-1.5 rounded-lg bg-white hover:bg-[#FDECE8] text-[#B53D2A] border border-[#3D352E] cursor-pointer disabled:opacity-50"
                      title="Xóa video khỏi kho"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminStudioVideosManager;
