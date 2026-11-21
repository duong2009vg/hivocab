// src/components/modals/ReviewLauncherModal.jsx
// Cozy Crayon SRS Review Launcher Modal — breaks down large due backlogs into quick focused sessions
import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Flame,
  Zap,
  Layers,
  Shuffle,
  Clock,
  Loader2,
  Sparkles,
  Check,
} from 'lucide-react';
import { useModal } from '../../context/ModalContext.jsx';
import { useRoute } from '../../router/RouteContext.jsx';
import { getWordsDueForReview } from '../../services/db.js';
import { getWordRetrievability } from '../../utils/fsrs.js';

const PRESET_SIZES = [
  { count: 15, label: 'Ôn nhanh', estPerWordMin: 0.33 },
  { count: 30, label: 'Vừa sức', estPerWordMin: 0.33 },
  { count: 50, label: 'Xả dồn', estPerWordMin: 0.33 },
];

const PRACTICE_MODES = [
  { id: 'mix', modeIndex: null, title: 'SRS Hỗn hợp', desc: 'Tự động kết hợp nhiều dạng bài', icon: Sparkles },
  { id: 'flashcard', modeIndex: 0, title: 'Flashcard siêu tốc', desc: '1 chạm Nhớ / Quên', icon: Zap },
  { id: 'mcq', modeIndex: 1, title: 'Trắc nghiệm', desc: 'Chọn đáp án nhanh', icon: Layers },
  { id: 'fill', modeIndex: 2, title: 'Điền & Gõ từ', desc: 'Nhớ sâu mặt chữ', icon: Clock },
];

const PRIORITY_FILTERS = [
  { id: 'urgent', label: 'Dễ quên nhất', icon: Flame },
  { id: 'overdue', label: 'Quá hạn lâu nhất', icon: Clock },
  { id: 'mixed', label: 'Trộn ngẫu nhiên', icon: Shuffle },
];

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function ReviewLauncherModal() {
  const { modals, closeModal } = useModal();
  const { navigateTo } = useRoute();
  const modalData = modals?.reviewLauncher || {};
  const isOpen = Boolean(modalData.open);
  const heroDueCount = Number(modalData.wordsDueCount || 0);

  const [loading, setLoading] = useState(false);
  const [dueWords, setDueWords] = useState([]);
  const [loadError, setLoadError] = useState('');

  const [sessionLimit, setSessionLimit] = useState(15);
  const [priorityMode, setPriorityMode] = useState('urgent');
  const [selectedTopicId, setSelectedTopicId] = useState('all');
  const [practiceMode, setPracticeMode] = useState(null);
  const [flashcardDirection, setFlashcardDirection] = useState(() => {
    try {
      const saved = localStorage.getItem('hivocab_flashcard_mode');
      return saved === 'vi_en' || saved === 'en_vi' ? saved : 'en_vi';
    } catch (_) {
      return 'en_vi';
    }
  });
  const [shuffleSeed, setShuffleSeed] = useState(0);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    setSelectedTopicId('all');
    setPriorityMode('urgent');
    setSessionLimit(heroDueCount > 0 && heroDueCount < 15 ? heroDueCount : 15);
    setPracticeMode(null);

    getWordsDueForReview(250)
      .then((rows) => {
        if (cancelled) return;
        const safeRows = Array.isArray(rows) ? rows : [];
        setDueWords(safeRows);
        if (safeRows.length > 0 && safeRows.length < 15) {
          setSessionLimit(safeRows.length);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err?.message || 'Không tải được danh sách từ đến hạn.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, heroDueCount]);

  const totalDueDisplay = Math.max(heroDueCount, dueWords.length);

  const topicBreakdown = useMemo(() => {
    const map = new Map();
    for (const w of dueWords) {
      const tid = w.topic?.id ? String(w.topic.id) : '__unassigned__';
      const existing = map.get(tid);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(tid, {
          id: tid,
          name: w.topic?.name || 'Chủ đề khác',
          count: 1,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [dueWords]);

  const filteredWords = useMemo(() => {
    const byTopic =
      selectedTopicId === 'all'
        ? dueWords
        : dueWords.filter((w) => String(w.topic?.id || '__unassigned__') === selectedTopicId);

    if (priorityMode === 'mixed') {
      return shuffleArray(byTopic);
    }
    if (priorityMode === 'urgent') {
      const now = new Date();
      return [...byTopic].sort((a, b) => {
        const retA = getWordRetrievability(a, now);
        const retB = getWordRetrievability(b, now);
        if (Math.abs(retA - retB) > 0.0001) return retA - retB;
        const lvDiff = Number(a.level ?? 0) - Number(b.level ?? 0);
        if (lvDiff !== 0) return lvDiff;
        return new Date(a.nextReviewAt || 0).getTime() - new Date(b.nextReviewAt || 0).getTime();
      });
    }
    return [...byTopic].sort(
      (a, b) => new Date(a.nextReviewAt || 0).getTime() - new Date(b.nextReviewAt || 0).getTime()
    );
    // shuffleSeed intentionally forces a fresh order when re-selecting 'Trộn ngẫu nhiên'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueWords, selectedTopicId, priorityMode, shuffleSeed]);

  const effectiveCount = Math.min(sessionLimit, filteredWords.length);
  const plannedWords = useMemo(() => filteredWords.slice(0, effectiveCount), [filteredWords, effectiveCount]);
  const remainingAfterSession = Math.max(0, totalDueDisplay - effectiveCount);
  const estMinutes = Math.max(1, Math.round(effectiveCount * (practiceMode === 0 ? 0.25 : 0.35)));

  if (!isOpen) return null;

  const handleClose = () => closeModal('reviewLauncher');

  const handleApplyQuickDrain = () => {
    setPracticeMode(0);
    const target = filteredWords.length >= 30 ? 30 : Math.max(1, filteredWords.length || 30);
    setSessionLimit(target);
  };

  const handleStartSession = () => {
    if (!plannedWords.length) return;
    try {
      localStorage.setItem('hivocab_flashcard_mode', flashcardDirection);
      sessionStorage.removeItem('hivocab_study_session_config');
    } catch (_) {
      // Ignore storage failures
    }

    if (typeof window !== 'undefined') {
      window._currentLessonWords = plannedWords;
      window._currentSessionWords = plannedWords;
      window._currentTopicId = null;
      window._currentPassageId = null;
      window._currentLessonIndex = null;
      window._practiceMode = practiceMode;
      window._flashcardMode = flashcardDirection;
    }

    handleClose();
    navigateTo('learning');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2D2825]/60 backdrop-blur-xs select-none"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-[#FBF8F1] rounded-[26px] border-[3px] border-[#3D352E] shadow-[6px_8px_0px_#3D352E] p-4 sm:p-5 text-[#302A24] font-comfortaa relative"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage: 'radial-gradient(#D6CEC2 1.2px, transparent 1.2px)',
          backgroundSize: '18px 18px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b-2 border-[#E5DAC6]">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-[#302A24] tracking-tight flex items-center gap-2">
              <span className="inline-flex w-7 h-7 rounded-xl bg-[#FBECE7] border-2 border-[#3D352E] items-center justify-center shrink-0">
                <Play className="w-3.5 h-3.5 text-[#D96B43] fill-[#D96B43]" />
              </span>
              <span>Chọn phiên ôn tập SRS</span>
            </h2>
            <p className="text-[11px] text-[#786F66] font-semibold mt-0.5">
              Đang có <strong className="text-[#D96B43]">{totalDueDisplay} từ</strong> đến hạn
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-white hover:bg-stone-100 border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] flex items-center justify-center text-[#302A24] active:scale-90 transition-transform cursor-pointer shrink-0"
            aria-label="Đóng"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-2 text-[#786F66]">
            <Loader2 className="w-6 h-6 animate-spin text-[#D96B43]" />
            <span className="text-xs font-bold">Đang tải danh sách từ...</span>
          </div>
        ) : loadError ? (
          <div className="p-3.5 rounded-2xl bg-[#FDECE8] border-2 border-[#D96B43]/50 text-xs font-bold text-[#B53D2A]">
            {loadError}
          </div>
        ) : dueWords.length === 0 ? (
          <div className="py-6 text-center space-y-2.5">
            <p className="text-sm font-bold text-[#4D6B53]">Tuyệt vời! Hôm nay bạn không còn từ nào đến hạn ôn.</p>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-1.5 rounded-xl bg-white border-2 border-[#3D352E] text-xs font-black cursor-pointer"
            >
              Đóng
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Backlog > 100 quick-drain tip */}
            {totalDueDisplay > 100 && (
              <div className="bg-[#FFF4DC] border-2 border-[#3D352E] rounded-2xl px-3 py-2 flex items-center justify-between gap-2 shadow-[2px_2px_0px_#3D352E]">
                <p className="text-[11px] font-bold text-[#6A5A50] leading-snug">
                  <span className="font-black text-[#8C5311]">Xả nhanh &gt;100 từ:</span> Flashcard siêu tốc (30 từ)
                </p>
                <button
                  type="button"
                  onClick={handleApplyQuickDrain}
                  className="px-2.5 py-1 rounded-xl bg-[#D96B43] hover:bg-[#C85A3F] text-white text-[11px] font-black border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Bật ngay
                </button>
              </div>
            )}

            {/* 1. Session Size Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black text-[#302A24] uppercase tracking-wide">
                  1. Số lượng từ
                </span>
                <span className="text-[11px] font-bold text-[#786F66]">
                  Xong phiên còn ~{remainingAfterSession} từ
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_SIZES.map((preset) => {
                  const isDisabled = filteredWords.length === 0;
                  const isSelected = sessionLimit === preset.count;
                  const countDisplay = Math.min(preset.count, filteredWords.length);
                  const mins = Math.max(1, Math.round(countDisplay * preset.estPerWordMin));
                  return (
                    <button
                      key={preset.count}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setSessionLimit(preset.count)}
                      className={`p-2 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#EFF6EE] border-[#4D6B53] shadow-[2px_2px_0px_#3D352E]'
                          : 'bg-white border-[#3D352E]/80 hover:bg-[#FFFBF3]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-[#302A24]">{preset.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#4D6B53] shrink-0" />}
                      </div>
                      <div className="text-[11px] font-bold text-[#6A5A50] mt-0.5">
                        {countDisplay} từ · ~{mins}p
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Priority & Topic Filter */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-black text-[#302A24] uppercase tracking-wide block">
                2. Ưu tiên &amp; Chủ đề
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITY_FILTERS.map((opt) => {
                  const Icon = opt.icon;
                  const active = priorityMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setPriorityMode(opt.id);
                        if (opt.id === 'mixed') setShuffleSeed((s) => s + 1);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border-2 cursor-pointer transition-all ${
                        active
                          ? 'bg-[#4D6B53] text-white border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E]'
                          : 'bg-white text-[#574E45] border-[#3D352E]/70 hover:bg-[#FFFBF3]'
                      }`}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {topicBreakdown.length > 1 && (
                <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pt-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTopicId('all')}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border cursor-pointer transition-colors ${
                      selectedTopicId === 'all'
                        ? 'bg-[#F4E3B4] text-[#3D352E] border-[#3D352E]'
                        : 'bg-white text-[#786F66] border-[#D8CBB8] hover:border-[#3D352E]'
                    }`}
                  >
                    Tất cả ({dueWords.length})
                  </button>
                  {topicBreakdown.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTopicId(t.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border cursor-pointer transition-colors ${
                        selectedTopicId === t.id
                          ? 'bg-[#F4E3B4] text-[#3D352E] border-[#3D352E]'
                          : 'bg-white text-[#786F66] border-[#D8CBB8] hover:border-[#3D352E]'
                      }`}
                    >
                      {t.name} ({t.count})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Practice Mode */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black text-[#302A24] uppercase tracking-wide">
                  3. Kiểu ôn tập
                </span>
                {practiceMode === 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setFlashcardDirection((d) => (d === 'en_vi' ? 'vi_en' : 'en_vi'))
                    }
                    className="px-2 py-0.5 rounded-full bg-[#FFE8C2] text-[#8C5311] text-[10px] font-black border border-[#3D352E] cursor-pointer"
                  >
                    Chiều: {flashcardDirection === 'en_vi' ? 'Anh → Việt' : 'Việt → Anh'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {PRACTICE_MODES.map((m) => {
                  const Icon = m.icon;
                  const active = practiceMode === m.modeIndex;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPracticeMode(m.modeIndex)}
                      className={`px-2.5 py-2 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-2 ${
                        active
                          ? 'bg-[#EFF6EE] border-[#4D6B53] shadow-[2px_2px_0px_#3D352E]'
                          : 'bg-white border-[#3D352E]/80 hover:bg-[#FFFBF3]'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          active ? 'text-[#4D6B53]' : 'text-[#D96B43]'
                        }`}
                      />
                      <span className="text-xs font-black text-[#302A24] truncate">{m.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer CTA */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-2 rounded-2xl bg-white hover:bg-stone-100 border-2 border-[#3D352E] text-xs font-black text-[#302A24] cursor-pointer"
              >
                Để sau
              </button>
              <button
                type="button"
                disabled={effectiveCount === 0}
                onClick={handleStartSession}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-[#D96B43] hover:bg-[#C85A3F] text-white text-xs sm:text-sm font-black border-2 border-[#3D352E] shadow-[2px_3px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                <span>
                  Bắt đầu ôn ({effectiveCount} từ · ~{estMinutes}p)
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewLauncherModal;
