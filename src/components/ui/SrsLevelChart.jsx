// src/components/ui/SrsLevelChart.jsx
// Unified 6-level FSRS-6 memory chart shared between PageDashboard and PageVocabulary.
import React from 'react';
import { BarChart3 } from 'lucide-react';

export const SRS_LEVEL_META = [
  {
    level: 0,
    key: 'lv0',
    shortLabel: 'L0',
    label: 'Chưa học',
    fillBg: 'bg-[#D6CFC5]',
    fillBorder: 'border-[#7E7368]',
    activeRing: 'ring-[#7E7368]/35',
    badgeClass: 'bg-[#F3EFE9] text-[#5B524A] border-[#C9BFB2]',
  },
  {
    level: 1,
    key: 'lv1',
    shortLabel: 'L1',
    label: 'Mới quen',
    fillBg: 'bg-[#E56B4E]',
    fillBorder: 'border-[#382E2B]',
    activeRing: 'ring-[#E56B4E]/35',
    badgeClass: 'bg-[#FCECE7] text-[#B8452A] border-[#E56B4E]',
  },
  {
    level: 2,
    key: 'lv2',
    shortLabel: 'L2',
    label: 'Đang nhớ',
    fillBg: 'bg-[#ECA43B]',
    fillBorder: 'border-[#382E2B]',
    activeRing: 'ring-[#ECA43B]/35',
    badgeClass: 'bg-[#FEF6E4] text-[#9A6010] border-[#ECA43B]',
  },
  {
    level: 3,
    key: 'lv3',
    shortLabel: 'L3',
    label: 'Khá vững',
    fillBg: 'bg-[#589ED0]',
    fillBorder: 'border-[#382E2B]',
    activeRing: 'ring-[#589ED0]/35',
    badgeClass: 'bg-[#EAF4FB] text-[#226493] border-[#589ED0]',
  },
  {
    level: 4,
    key: 'lv4',
    shortLabel: 'L4',
    label: 'Nhớ sâu',
    fillBg: 'bg-[#8F76B8]',
    fillBorder: 'border-[#382E2B]',
    activeRing: 'ring-[#8F76B8]/35',
    badgeClass: 'bg-[#F3EFFA] text-[#5D4489] border-[#8F76B8]',
  },
  {
    level: 5,
    key: 'lv5',
    shortLabel: 'L5',
    label: 'Thành thạo',
    fillBg: 'bg-[#4D6B53]',
    fillBorder: 'border-[#382E2B]',
    activeRing: 'ring-[#4D6B53]/35',
    badgeClass: 'bg-[#EAF3EB] text-[#35523B] border-[#4D6B53]',
  },
];

/**
 * Shared 6-level FSRS-6 bar chart.
 * Supports both:
 *  - `counts` as array `[lv0, lv1, lv2, lv3, lv4, lv5]` OR object `{ lv0, lv1, lv2, lv3, lv4, lv5 }`
 *  - `selectedLevel` (`'all' | number`) for interactive filtering
 *  - `compact` mode for tight above-the-fold toolbars (PageVocabulary)
 */
export function SrsLevelChart({
  counts = [0, 0, 0, 0, 0, 0],
  selectedLevel = 'all',
  onSelectLevel,
  compact = false,
  title = 'Phân bổ trí nhớ FSRS-6',
  subtitle = 'Nhấn vào từng cột để lọc từ vựng theo mức độ ghi nhớ',
  headerRight = null,
  showHeader = true,
  className = '',
}) {
  const values = Array.isArray(counts)
    ? SRS_LEVEL_META.map((_, idx) => Number(counts[idx]) || 0)
    : SRS_LEVEL_META.map((meta) => Number(counts?.[meta.key]) || 0);

  const totalWords = values.reduce((sum, v) => sum + v, 0);
  const maxCount = Math.max(...values, 1);

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-[#382E2B] font-quicksand flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#4D6B53] shrink-0" />
              <span className="truncate">{title}</span>
            </h3>
            {subtitle && (
              <p className="text-xs font-medium text-[#6E6259] mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          {headerRight || (
            <span className="text-xs font-extrabold text-[#382E2B] bg-[#FAF5EB] border border-[#E3D7C5] px-2.5 py-1 rounded-full tabular-nums shrink-0">
              {totalWords.toLocaleString('vi-VN')} từ
            </span>
          )}
        </div>
      )}

      <div
        className={`grid grid-cols-6 ${compact ? 'gap-1.5 sm:gap-2.5' : 'gap-2 sm:gap-3'}`}
        role="group"
        aria-label="Cấp độ ghi nhớ FSRS-6"
      >
        {SRS_LEVEL_META.map((meta, idx) => {
          const count = values[idx];
          const isSelected = selectedLevel === meta.level;
          const pct = count > 0 ? Math.max(14, Math.round((count / maxCount) * 100)) : 0;
          const sharePct = totalWords > 0 ? Math.round((count / totalWords) * 100) : 0;

          return (
            <button
              key={meta.level}
              type="button"
              onClick={() => onSelectLevel?.(meta.level)}
              aria-pressed={isSelected}
              title={`Cấp ${meta.level} (${meta.label}): ${count} từ (${sharePct}%)`}
              className={`group flex flex-col items-center rounded-2xl transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D6B53] ${
                compact ? 'py-1.5 px-1' : 'py-2 px-1.5'
              } ${
                isSelected
                  ? `bg-[#FAF5EB] ring-2 ${meta.activeRing} border border-[#382E2B]`
                  : 'hover:bg-[#FAF5EB]/80 border border-transparent'
              }`}
            >
              <span
                className={`tabular-nums font-extrabold transition-colors ${
                  compact ? 'text-[11px] mb-1' : 'text-xs mb-1.5'
                } ${
                  isSelected
                    ? 'text-[#D95D39]'
                    : count > 0
                    ? 'text-[#382E2B]'
                    : 'text-[#9A8E83]'
                }`}
              >
                {count}
              </span>

              <div
                className={`w-full ${
                  compact ? 'max-w-[34px] h-[52px]' : 'max-w-[44px] h-[88px] sm:h-[104px]'
                } rounded-xl bg-[#F3ECE0] border border-[#E3D7C5] flex items-end p-1 overflow-hidden`}
              >
                <div
                  className={`w-full rounded-lg transition-all duration-300 ease-out ${
                    count > 0
                      ? `${meta.fillBg} border-[1.5px] ${meta.fillBorder}`
                      : 'bg-[#E3D7C5]/70 h-[5px]'
                  } group-hover:brightness-95`}
                  style={{ height: count > 0 ? `${pct}%` : '5px' }}
                />
              </div>

              <span
                className={`mt-1.5 font-extrabold leading-tight ${
                  compact ? 'text-[10.5px]' : 'text-[11px]'
                } ${isSelected ? 'text-[#D95D39]' : 'text-[#382E2B]'}`}
              >
                {meta.shortLabel}
              </span>
              {!compact && (
                <span className="text-[10px] font-semibold text-[#6E6259] leading-tight truncate max-w-full hidden sm:block">
                  {meta.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SrsLevelChart;
