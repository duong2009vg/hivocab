// src/components/exercises/RoadmapChuyenDeView.jsx
// Quyển 2: Lộ trình Chinh phục 9+ THPT Quốc Gia (29 Chuyên đề với animated winding S-curve path)
import React, { useState, useEffect, useMemo } from 'react';
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
  },
  {
    key: 'Chuyên đề II:',
    heading: 'Chuyên đề II: Đục lỗ 5 câu (Hoàn thành câu trong đoạn văn)',
  },
  {
    key: 'Chuyên đề III:',
    heading: 'Chuyên đề III: Sắp xếp Hội thoại, Lá thư & Đoạn văn',
  },
  {
    key: 'Chuyên đề IV:',
    heading: 'Chuyên đề IV: Đọc hiểu (Reading Comprehension)',
  },
];

// Alternating winding S-curve offsets matching openquiz.ai/courses visual curve
const DESKTOP_WAVE_X = [-56, -16, 38, 68, 18, -44, -66, -10, 44, 62, 0];
const MOBILE_WAVE_X = [-14, 0, 14, 10, -10, -14, 0, 14, 8, -12, 0];
const NODE_STEP_Y = 112;
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
  const [scores, setScores] = useState({});
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

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
      {/* Inline keyframes for winding SVG path & floating pill animations */}
      <style>{`
        @keyframes hvRoadmapDashFlow {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -28; }
        }
        @keyframes hvRoadmapNodeFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes hvSideBadgeBob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1.5deg); }
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
            <span className="px-3 py-1 rounded-xl bg-[#FAF5EB] text-[#302A24] font-black text-xs border border-[#C9B9A6]">
              29 Chuyên đề
            </span>
            <span className="px-3 py-1 rounded-xl bg-[#EAF5E4] text-[#557A46] font-black text-xs border border-[#557A46]/40">
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
            className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm bg-white rounded-2xl border-2 border-[#3D352E] focus:ring-0 focus:outline-none placeholder:text-[#9C8F85] font-semibold text-[#302A24]"
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
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {TOPIC_FILTERS.map((group) => {
            const isActive = activeGroup === group.id;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroup(group.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-black border-2 border-[#3D352E] whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#3D352E] text-white'
                    : 'bg-white text-[#4A4036] hover:bg-[#FAF5EB]'
                }`}
              >
                {group.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Animated Winding Path Sections */}
      {loading ? (
        <div className="py-20 text-center">
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
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs px-3 sm:px-8 py-6 sm:py-10 overflow-hidden space-y-10">
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

            // Place a circular dashed summary badge opposite the curve bend near the middle
            const sideAnchorIdx = Math.min(2, Math.max(0, items.length - 1));
            const anchorPos = nodePositions[sideAnchorIdx];
            const sideIsLeft = (anchorPos?.dx || 0) >= 0;
            const sideBadgeOffsetX = sideIsLeft ? -225 : 225;

            // Identify first unattempted chapter as focal pulsing node
            const nextActiveIndex = items.findIndex((item) => !scores[item.id]);

            return (
              <div key={group.key} className="space-y-6">
                {/* Centered section divider heading */}
                <div className="flex items-center gap-4 max-w-2xl mx-auto">
                  <div className="h-px flex-1 bg-slate-200" />
                  <h3 className="text-sm sm:text-base font-heading font-bold text-slate-700 text-center px-2">
                    {group.heading}
                  </h3>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {/* Winding S-Curve Canvas */}
                <div
                  className="relative mx-auto max-w-3xl"
                  style={{ height: `${totalHeight}px` }}
                >
                  {/* Animated Dashed SVG Path Overlay */}
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
                            stroke="#e2e8f0"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <path
                            d={d}
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth="2.5"
                            strokeDasharray="7 7"
                            strokeLinecap="round"
                            className="hv-path-animated"
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Floating Circular Dashed Group Counter (Desktop, matches reference screenshot) */}
                  {!isMobile && items.length >= 3 && anchorPos && (
                    <div
                      className="absolute left-1/2 top-0 flex flex-col items-center pointer-events-none select-none hv-side-bob"
                      style={{
                        transform: `translate(calc(-50% + ${sideBadgeOffsetX}px), ${anchorPos.y - 38}px)`,
                      }}
                    >
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 bg-white/95 flex flex-col items-center justify-center shadow-xs">
                        <span className="text-sm font-heading font-black text-slate-700 leading-none">
                          {group.totalQuestions}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                          câu
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 mt-1.5 whitespace-nowrap">
                        Số câu hỏi
                      </span>
                    </div>
                  )}

                  {/* Winding Pill Nodes */}
                  {nodePositions.map(({ ex, idx, dx, y }) => {
                    const code = getShortCode(ex.title, idx);
                    const cleanTitle = getCleanTitle(ex.title);
                    const scoreData = scores[ex.id];
                    const qCount = metaMap[ex.id]?.questions_count || ex.total_questions || 0;
                    const exCount = metaMap[ex.id]?.examples_count || 0;
                    const isNextActive = idx === nextActiveIndex;
                    const isCompleted = Boolean(scoreData);

                    return (
                      <div
                        key={ex.id}
                        className="absolute left-1/2 top-0 flex justify-center items-center"
                        style={{
                          transform: `translate(calc(-50% + ${dx}px), ${y - 40}px)`,
                          height: '80px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedExercise(ex)}
                          className={`group text-left w-[275px] sm:w-[335px] rounded-[28px] p-[3px] transition-all duration-300 cursor-pointer focus:outline-none hover:-translate-y-1 active:scale-[0.99] ${
                            isCompleted
                              ? 'bg-gradient-to-b from-emerald-200 via-emerald-300/90 to-emerald-200 shadow-[0_6px_18px_rgba(16,185,129,0.14)]'
                              : isNextActive
                              ? 'hv-node-active bg-gradient-to-b from-slate-300 via-slate-400/80 to-slate-300 shadow-[0_8px_22px_rgba(15,23,42,0.12)]'
                              : 'bg-gradient-to-b from-slate-200 via-slate-300/90 to-slate-200 shadow-[0_5px_14px_rgba(15,23,42,0.06)] hover:shadow-[0_10px_22px_rgba(15,23,42,0.11)]'
                          }`}
                        >
                          <div className="rounded-[25px] bg-gradient-to-b from-[#fafbfc] to-[#eef1f5] group-hover:from-white group-hover:to-[#f3f6fa] px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3.5 border border-white/90 min-h-[72px]">
                            {/* Left Circular Dashed Badge */}
                            <div
                              className={`w-12 h-12 rounded-full border-2 border-dashed flex flex-col items-center justify-center shrink-0 transition-colors ${
                                isCompleted
                                  ? 'border-emerald-500/80 bg-emerald-50 text-emerald-700'
                                  : isNextActive
                                  ? 'border-slate-500 bg-white text-slate-800'
                                  : 'border-slate-400/80 bg-white/85 text-slate-700 group-hover:border-slate-600'
                              }`}
                            >
                              <span className="font-heading font-black text-xs leading-none tracking-tight">
                                {code}
                              </span>
                            </div>

                            {/* Title & Metadata */}
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="font-heading font-bold text-slate-800 group-hover:text-[#557A46] text-[13px] sm:text-[14px] leading-snug line-clamp-2 transition-colors">
                                {cleanTitle}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-slate-500">
                                <span>{qCount} câu THPT</span>
                                {exCount > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{exCount} ví dụ thử</span>
                                  </>
                                )}
                                {scoreData && (
                                  <span className="text-emerald-700 font-bold">
                                    • Đạt {scoreData.score}/{scoreData.total} ({scoreData.percentage}%)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
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
