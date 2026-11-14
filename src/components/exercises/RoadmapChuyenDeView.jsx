// src/components/exercises/RoadmapChuyenDeView.jsx
// Quyển 2: Lộ trình Chinh phục 9+ THPT Quốc Gia (29 Chuyên đề với animated winding S-curve path)
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import {
  getExercises,
  getExerciseScores,
  getExerciseTheoryMetaMap,
} from '../../services/exercisesService.js';
import ChapterStudyView from './ChapterStudyView.jsx';

const TOPIC_FILTERS = [
  { id: 'all', label: 'Tất cả (29 chuyên đề)' },
  { id: 'g1', label: 'Chuyên đề I: Đục lỗ 6 câu', match: 'Chuyên đề I:' },
  { id: 'g2', label: 'Chuyên đề II: Đục lỗ 5 câu', match: 'Chuyên đề II:' },
  { id: 'g3', label: 'Chuyên đề III: Sắp xếp', match: 'Chuyên đề III:' },
  { id: 'g4', label: 'Chuyên đề IV: Đọc hiểu', match: 'Chuyên đề IV:' },
];

const GROUP_SECTIONS = [
  {
    key: 'Chuyên đề I:',
    heading: 'Chuyên đề I: Đục lỗ 6 câu (Quảng cáo & Tờ rơi)',
    badgeBg: '#FEF3C7',
    badgeText: '#78350F',
    pathTrack: '#F5E1A4',
    pathDash: '#B45309',
  },
  {
    key: 'Chuyên đề II:',
    heading: 'Chuyên đề II: Đục lỗ 5 câu (Hoàn thành câu trong đoạn văn)',
    badgeBg: '#EAF5E4',
    badgeText: '#2D5A3D',
    pathTrack: '#CFE6C4',
    pathDash: '#557A46',
  },
  {
    key: 'Chuyên đề III:',
    heading: 'Chuyên đề III: Sắp xếp Hội thoại, Lá thư & Đoạn văn',
    badgeBg: '#FDECE6',
    badgeText: '#7F1D1D',
    pathTrack: '#F5CBBF',
    pathDash: '#C85A3F',
  },
  {
    key: 'Chuyên đề IV:',
    heading: 'Chuyên đề IV: Đọc hiểu (Reading Comprehension)',
    badgeBg: '#E0F2FE',
    badgeText: '#1E3A8A',
    pathTrack: '#BFE0FA',
    pathDash: '#1D4ED8',
  },
];

// 6-color pastel crayon palette cycling along chapter nodes on warm paper
const CRAYON_NODE_PALETTES = [
  {
    cardBg: 'linear-gradient(180deg, #FFFDF2 0%, #FEF3C7 100%)',
    ringBg: '#FDE68A',
    ringBorder: '#B45309',
    ringText: '#78350F',
    chipBg: '#FDE68A',
  },
  {
    cardBg: 'linear-gradient(180deg, #F7FCF4 0%, #E3F2DB 100%)',
    ringBg: '#C6E6BC',
    ringBorder: '#3F6232',
    ringText: '#1E3E2A',
    chipBg: '#D4E9C9',
  },
  {
    cardBg: 'linear-gradient(180deg, #FFF8F5 0%, #FDE4D8 100%)',
    ringBg: '#FECDD3',
    ringBorder: '#B85135',
    ringText: '#7F1D1D',
    chipBg: '#FBD5C8',
  },
  {
    cardBg: 'linear-gradient(180deg, #F5FAFF 0%, #E0F2FE 100%)',
    ringBg: '#BAE6FD',
    ringBorder: '#0369A1',
    ringText: '#1E3A8A',
    chipBg: '#CBEAFB',
  },
  {
    cardBg: 'linear-gradient(180deg, #FAF7FF 0%, #EDE9FE 100%)',
    ringBg: '#DDD6FE',
    ringBorder: '#6D28D9',
    ringText: '#4C1D95',
    chipBg: '#E4DDFD',
  },
  {
    cardBg: 'linear-gradient(180deg, #FFFBF2 0%, #FDE8C8 100%)',
    ringBg: '#FED7AA',
    ringBorder: '#C2410C',
    ringText: '#7C2D12',
    chipBg: '#FCE0B8',
  },
];

const COMPLETED_NODE_PALETTE = {
  cardBg: 'linear-gradient(180deg, #ECFDF5 0%, #D1FAE5 100%)',
  ringBg: '#A7F3D0',
  ringBorder: '#15803D',
  ringText: '#14532D',
  chipBg: '#A7F3D0',
};

// Alternating winding S-curve offsets matching openquiz.ai/courses visual curve
const DESKTOP_WAVE_X = [-56, -16, 38, 68, 18, -44, -66, -10, 44, 62, 0];
const MOBILE_WAVE_X = [-14, 0, 14, 10, -10, -14, 0, 14, 8, -12, 0];
const NODE_STEP_Y = 116;
const SVG_WIDTH = 720;
const SVG_CENTER_X = SVG_WIDTH / 2;

function getShortCode(title, fallbackIndex) {
  const m = (title || '').match(/^\[([^\]]+)\]/);
  if (!m) return String(fallbackIndex + 1);
  const raw = m[1];
  if (raw.startsWith('ON_TAP_')) {
    return `ÔT ${raw.replace('ON_TAP_', '')}`;
  }
  return raw;
}

function getCleanTitle(title) {
  return (title || '')
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(/^(?:\d+\.\d+(?:\.\d+)?\.?\s*)/, '')
    .trim();
}

export function RoadmapChuyenDeView() {
  const [exercises, setExercises] = useState([]);
  const [metaMap, setMetaMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectingId, setSelectingId] = useState(null);
  const [scores, setScores] = useState({});
  const selectTimerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    return () => {
      if (selectTimerRef.current) {
        clearTimeout(selectTimerRef.current);
      }
    };
  }, []);

  const handleSelectNode = useCallback((ex) => {
    if (selectTimerRef.current) {
      clearTimeout(selectTimerRef.current);
    }
    setSelectingId(ex.id);
    selectTimerRef.current = setTimeout(() => {
      setSelectingId(null);
      setSelectedExercise(ex);
    }, 180);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [list, tMeta] = await Promise.all([
          getExercises(),
          getExerciseTheoryMetaMap(),
        ]);
        if (!cancelled) {
          setExercises(list);
          setMetaMap(tMeta || {});
          setScores(getExerciseScores());

          const resumeId = sessionStorage.getItem('hv_chuyende_active_id');
          if (resumeId) {
            const match = list.find((e) => e.id === resumeId);
            if (match) {
              setSelectedExercise(match);
            }
          }
        }
      } catch (err) {
        console.error('Error loading exercises:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredExercises = useMemo(() => {
    let list = exercises || [];
    if (activeGroup !== 'all') {
      const g = TOPIC_FILTERS.find((tg) => tg.id === activeGroup);
      if (g?.match) {
        list = list.filter((e) => (e.topic_group || '').includes(g.match));
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (e) =>
          (e.title || '').toLowerCase().includes(q) ||
          (e.topic_group || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [exercises, activeGroup, searchQuery]);

  // Group filtered exercises by the 4 main TOPIC_GROUPS
  const groupedSections = useMemo(() => {
    const result = [];
    for (const sec of GROUP_SECTIONS) {
      const items = filteredExercises.filter((e) => (e.topic_group || '').includes(sec.key));
      if (items.length > 0) {
        const totalQuestions = items.reduce(
          (sum, ex) => sum + (metaMap[ex.id]?.questions_count || ex.total_questions || 0),
          0
        );
        result.push({
          ...sec,
          items,
          totalQuestions,
        });
      }
    }
    return result;
  }, [filteredExercises, metaMap]);

  if (selectedExercise) {
    const enrichEx = {
      ...selectedExercise,
      total_questions:
        metaMap[selectedExercise.id]?.questions_count || selectedExercise.total_questions || 0,
    };
    return (
      <ChapterStudyView
        exercise={enrichEx}
        onBack={() => {
          sessionStorage.removeItem('hv_chuyende_active_id');
          setSelectedExercise(null);
          setScores(getExerciseScores());
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Inline keyframes for crayon winding SVG path, floating active node, sticker & click spring */}
      <style>{`
        @keyframes hvRoadmapDashFlow {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -32; }
        }
        @keyframes hvRoadmapNodeFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(-0.5deg); }
        }
        @keyframes hvSideBadgeBob {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-5px) rotate(2deg); }
        }
        @keyframes hvCrayonSelecting {
          0% { transform: scale(1); }
          45% { transform: scale(0.95) translateY(3px) rotate(-0.8deg); }
          100% { transform: scale(1.03) translateY(-2px) rotate(0.4deg); }
        }
        @keyframes hvStickerPop {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-2px) rotate(1.5deg); }
        }
        .hv-path-animated {
          animation: hvRoadmapDashFlow 1.6s linear infinite;
        }
        .hv-node-active {
          animation: hvRoadmapNodeFloat 3.4s ease-in-out infinite;
        }
        .hv-side-bob {
          animation: hvSideBadgeBob 4.2s ease-in-out infinite;
        }
        .hv-crayon-selecting {
          animation: hvCrayonSelecting 180ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .hv-sticker-pop {
          animation: hvStickerPop 2.8s ease-in-out infinite;
        }
      `}</style>

      {/* Compact Control & Search Header */}
      <div className="rounded-3xl bg-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-heading font-black text-[#302A24]">
              Lộ trình Chinh Phục 9+ THPT Quốc Gia
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#786F66] mt-0.5">
              Chọn từng chuyên đề theo lộ trình để học lý thuyết chuẩn, luyện thử ví dụ và làm bài tại Phòng luyện thi THPT.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-xl bg-[#FEF3C7] text-[#78350F] font-black text-xs border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
              29 Chuyên đề
            </span>
            <span className="px-3 py-1 rounded-xl bg-[#EAF5E4] text-[#2D5A3D] font-black text-xs border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
              1.004 Câu hỏi
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm chuyên đề (vd: Từ loại, OSASCOMP, Lượng từ, Đọc hiểu...)"
            className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm bg-white rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] focus:ring-0 focus:outline-none placeholder:text-[#9C8F85] font-semibold text-[#302A24]"
          />
          <Search className="w-4 h-4 text-[#9C8F85] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Xóa tìm kiếm"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#786F66] hover:text-[#302A24] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Group Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {TOPIC_FILTERS.map((group) => {
            const isActive = activeGroup === group.id;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroup(group.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black border-2 border-[#3D352E] whitespace-nowrap transition-all cursor-pointer active:translate-y-0.5 ${
                  isActive
                    ? 'bg-[#3D352E] text-[#FFFDF9] shadow-[2px_2px_0px_#8A5B2E]'
                    : 'bg-[#FFFDF9] text-[#4A4036] hover:bg-[#FEF3C7] shadow-[2px_2px_0px_#3D352E]'
                }`}
              >
                {group.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Animated Crayon Winding Path Sections */}
      {loading ? (
        <div className="py-20 text-center rounded-3xl crayon-paper-bg border-[3px] border-[#3D352E] shadow-[4px_6px_0px_#3D352E]">
          <div className="w-10 h-10 border-4 border-[#557A46] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[#786F66]">Đang tải lộ trình 29 chuyên đề...</p>
        </div>
      ) : groupedSections.length === 0 ? (
        <div className="text-center py-12 px-6 rounded-3xl bg-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E]">
          <p className="font-heading font-black text-base text-[#302A24]">
            Không tìm thấy chuyên đề nào phù hợp
          </p>
        </div>
      ) : (
        <div className="rounded-3xl crayon-paper-bg border-[3px] border-[#3D352E] shadow-[4px_6px_0px_#3D352E] px-3 sm:px-8 py-6 sm:py-10 overflow-hidden space-y-12">
          {groupedSections.map((group) => {
            const items = group.items;
            const waveOffsets = isMobile ? MOBILE_WAVE_X : DESKTOP_WAVE_X;
            const totalHeight = items.length * NODE_STEP_Y;
            const nodePositions = items.map((ex, idx) => {
              const dx = waveOffsets[idx % waveOffsets.length];
              const cy = idx * NODE_STEP_Y + NODE_STEP_Y / 2;
              return {
                ex,
                idx,
                dx,
                x: SVG_CENTER_X + dx,
                y: cy,
              };
            });

            // Place a circular dashed crayon stamp opposite the curve bend near the middle
            const sideAnchorIdx = Math.min(2, Math.max(0, items.length - 1));
            const anchorPos = nodePositions[sideAnchorIdx];
            const sideIsLeft = (anchorPos?.dx || 0) >= 0;
            const sideBadgeOffsetX = sideIsLeft ? -235 : 235;

            // Identify first unattempted chapter as focal floating crayon node
            const nextActiveIndex = items.findIndex((item) => !scores[item.id]);

            return (
              <div key={group.key} className="space-y-6">
                {/* Centered Crayon Divider Banner */}
                <div className="flex items-center gap-3 sm:gap-4 max-w-2xl mx-auto">
                  <div className="flex-1 border-t-2 border-dashed border-[#8C7A6B]/60" />
                  <h3
                    className="text-xs sm:text-sm font-heading font-black text-center px-4 py-1.5 rounded-2xl border-[2.5px] border-[#3D352E] shadow-[3px_3px_0px_#3D352E]"
                    style={{
                      backgroundColor: group.badgeBg,
                      color: group.badgeText,
                    }}
                  >
                    {group.heading}
                  </h3>
                  <div className="flex-1 border-t-2 border-dashed border-[#8C7A6B]/60" />
                </div>

                {/* Winding S-Curve Canvas */}
                <div
                  className="relative mx-auto max-w-3xl"
                  style={{ height: `${totalHeight}px` }}
                >
                  {/* Animated Dashed Crayon SVG Path Overlay */}
                  <svg
                    viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="absolute left-1/2 -translate-x-1/2 top-0 h-full pointer-events-none select-none"
                    style={{ width: `${SVG_WIDTH}px` }}
                    aria-hidden="true"
                  >
                    {nodePositions.map((pos, idx) => {
                      if (idx >= nodePositions.length - 1) return null;
                      const nextPos = nodePositions[idx + 1];
                      const yMid = (pos.y + nextPos.y) / 2;
                      const d = `M ${pos.x} ${pos.y} C ${pos.x} ${yMid}, ${nextPos.x} ${yMid}, ${nextPos.x} ${nextPos.y}`;
                      return (
                        <g key={`${pos.ex.id}-edge`}>
                          <path
                            d={d}
                            fill="none"
                            stroke={group.pathTrack}
                            strokeWidth="8"
                            strokeLinecap="round"
                          />
                          <path
                            d={d}
                            fill="none"
                            stroke={group.pathDash}
                            strokeWidth="3"
                            strokeDasharray="8 8"
                            strokeLinecap="round"
                            className="hv-path-animated"
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Floating Crayon Circular Dashed Group Counter (Desktop) */}
                  {!isMobile && items.length >= 3 && anchorPos && (
                    <div
                      className="absolute left-1/2 top-0 pointer-events-none select-none"
                      style={{
                        transform: `translate(calc(-50% + ${sideBadgeOffsetX}px), ${anchorPos.y - 42}px)`,
                      }}
                    >
                      <div className="flex flex-col items-center hv-side-bob">
                        <div
                          className="w-[70px] h-[70px] rounded-full border-[2.5px] border-dashed border-[#3D352E] shadow-[3px_4px_0px_#3D352E] flex flex-col items-center justify-center"
                          style={{ backgroundColor: group.badgeBg }}
                        >
                          <span
                            className="text-base font-heading font-black leading-none"
                            style={{ color: group.badgeText }}
                          >
                            {group.totalQuestions}
                          </span>
                          <span className="text-[9px] font-black text-[#4A4036] uppercase mt-0.5">
                            câu
                          </span>
                        </div>
                        <span className="mt-2 px-2.5 py-0.5 rounded-full bg-[#FFFDF9] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-[11px] font-black text-[#302A24] whitespace-nowrap">
                          Số câu hỏi
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Winding Tactile Crayon Chapter Pill Nodes */}
                  {nodePositions.map(({ ex, idx, dx, y }) => {
                    const code = getShortCode(ex.title, idx);
                    const cleanTitle = getCleanTitle(ex.title);
                    const scoreData = scores[ex.id];
                    const qCount = metaMap[ex.id]?.questions_count || ex.total_questions || 0;
                    const exCount = metaMap[ex.id]?.examples_count || 0;
                    const isNextActive = idx === nextActiveIndex;
                    const isCompleted = Boolean(scoreData);
                    const isSelecting = selectingId === ex.id;
                    const palette = isCompleted
                      ? COMPLETED_NODE_PALETTE
                      : CRAYON_NODE_PALETTES[idx % CRAYON_NODE_PALETTES.length];

                    return (
                      <div
                        key={ex.id}
                        className="absolute left-1/2 top-0 flex justify-center items-center"
                        style={{
                          transform: `translate(calc(-50% + ${dx}px), ${y - 41}px)`,
                          height: '82px',
                        }}
                      >
                        <div className={`relative ${isNextActive && !isSelecting ? 'hv-node-active' : ''}`}>
                          {isNextActive && (
                            <span className="hv-sticker-pop pointer-events-none absolute -top-3 right-4 z-10 px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#302A24] text-[10px] font-black tracking-wide border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
                              Học tiếp
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSelectNode(ex)}
                            className={`group text-left w-[275px] sm:w-[340px] rounded-[26px] border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] hover:-translate-y-1 hover:rotate-[-0.5deg] hover:shadow-[6px_8px_0px_#3D352E] active:translate-y-0.5 active:shadow-[2px_2px_0px_#3D352E] transition-all duration-200 cursor-pointer focus:outline-none overflow-hidden ${
                              isSelecting ? 'hv-crayon-selecting' : ''
                            }`}
                            style={{ background: palette.cardBg }}
                          >
                            <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3.5 min-h-[74px] shadow-[inset_0_2px_0_rgba(255,255,255,0.8)]">
                              {/* Left Crayon Dashed Medallion */}
                              <div
                                className="w-12 h-12 rounded-full border-2 border-dashed flex flex-col items-center justify-center shrink-0 transition-transform duration-200 group-hover:rotate-[-8deg] group-hover:scale-105 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                                style={{
                                  backgroundColor: palette.ringBg,
                                  borderColor: palette.ringBorder,
                                  color: palette.ringText,
                                }}
                              >
                                <span className="font-heading font-black text-xs leading-none tracking-tight">
                                  {code}
                                </span>
                              </div>

                              {/* Title & Crayon Chip Metadata */}
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="font-heading font-black text-[#302A24] group-hover:text-[#1E3E2A] text-[13px] sm:text-[14px] leading-snug line-clamp-2 transition-colors">
                                  {cleanTitle}
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-bold text-[#4A4036]">
                                  <span
                                    className="px-2 py-0.5 rounded-lg border border-[#3D352E]/25"
                                    style={{ backgroundColor: palette.chipBg }}
                                  >
                                    {qCount} câu THPT
                                  </span>
                                  {exCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-lg bg-[#FFFDF9]/85 border border-[#3D352E]/20 text-[#5D4E41]">
                                      {exCount} ví dụ thử
                                    </span>
                                  )}
                                  {scoreData && (
                                    <span className="px-2 py-0.5 rounded-lg bg-[#DCFCE7] border border-[#15803D]/35 text-[#14532D] font-black">
                                      Đạt {scoreData.score}/{scoreData.total} ({scoreData.percentage}%)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RoadmapChuyenDeView;
