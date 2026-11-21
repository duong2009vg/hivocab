// src/components/modals/SrsExplainerModal.jsx
// Pure React FSRS-6 DSR Explainer Modal with Desired Retention Control
import React, { useState, useEffect } from 'react';
import { useModal } from '../../context/ModalContext.jsx';
import { getFSRSDesiredRetention, setFSRSDesiredRetention } from '../../services/db.js';

const RETENTION_PRESETS = [
  { value: 0.85, label: '85% · Tiết kiệm thời gian', desc: 'Ôn ít hơn ~25%, phù hợp duy trì dài hạn' },
  { value: 0.90, label: '90% · Chuẩn FSRS (Khuyên dùng)', desc: 'Cân bằng tối ưu giữa số lượt ôn & tỷ lệ nhớ' },
  { value: 0.95, label: '95% · Ghi nhớ cao độ', desc: 'Ôn dày hơn, phù hợp nước rút trước kỳ thi' },
];

export function SrsExplainerModal() {
  const { modals, closeModal } = useModal();
  const isOpen = modals.srsExplainer?.open;
  const [desiredRetention, setDesiredRetentionState] = useState(() => getFSRSDesiredRetention());

  useEffect(() => {
    if (isOpen) {
      setDesiredRetentionState(getFSRSDesiredRetention());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectRetention = (val) => {
    const saved = setFSRSDesiredRetention(val);
    setDesiredRetentionState(saved);
  };

  return (
    <div
      id="modal-srs-explainer"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal('srsExplainer'); }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg bg-surface rounded-3xl p-6 md:p-8 shadow-2xl fade-in max-h-[90vh] overflow-y-auto border border-outline-variant/20">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px] icon-fill">published_with_changes</span>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-on-surface">Thuật toán ghi nhớ FSRS-6</h2>
              <p className="text-xs text-on-surface-variant">Mô hình trí nhớ DSR thế hệ mới (chuẩn Anki FSRS)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => closeModal('srsExplainer')}
            className="p-2 rounded-full text-outline hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex flex-col gap-3.5 text-xs sm:text-sm text-on-surface-variant">
          <p className="leading-relaxed">
            HiVocab sử dụng <strong>FSRS-6 (Free Spaced Repetition Scheduler)</strong> — mô hình 21 tham số dựa trên{' '}
            <strong>DSR (Difficulty – Stability – Retrievability)</strong> để dự đoán chính xác thời điểm bạn sắp quên từng từ, giúp giảm 20–30% số lượt ôn mà vẫn đạt tỷ lệ ghi nhớ mục tiêu.
          </p>

          {/* 3 DSR Variables */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/15">
              <div className="font-bold text-on-surface text-xs">Độ khó (D · 1–10)</div>
              <p className="text-[11px] text-on-surface-variant/80 mt-0.5">Mức độ khó tự nhiên của từ; tự động cân bằng chống &quot;Ease Hell&quot;.</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/15">
              <div className="font-bold text-on-surface text-xs">Độ bền (S · Ngày)</div>
              <p className="text-[11px] text-on-surface-variant/80 mt-0.5">Số ngày để xác suất nhớ giảm từ 100% xuống 90%.</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/15">
              <div className="font-bold text-on-surface text-xs">Xác suất nhớ (R%)</div>
              <p className="text-[11px] text-on-surface-variant/80 mt-0.5">Khả năng nhớ lại từ ở thời điểm hiện tại theo đường cong quên.</p>
            </div>
          </div>

          {/* Desired Retention Selector */}
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="font-bold text-primary text-xs mb-2">Tỷ lệ ghi nhớ mục tiêu (Desired Retention):</div>
            <div className="flex flex-col gap-1.5">
              {RETENTION_PRESETS.map((preset) => {
                const active = Math.abs(desiredRetention - preset.value) < 0.015;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleSelectRetention(preset.value)}
                    className={`w-full text-left px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? 'bg-primary text-on-primary border-primary shadow-xs'
                        : 'bg-surface border-outline-variant/25 text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="font-bold text-xs">{preset.label}</div>
                    <div className={`text-[11px] ${active ? 'text-on-primary/85' : 'text-on-surface-variant/80'}`}>
                      {preset.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6 Memory Level Mapping */}
          <div className="flex flex-col gap-2 mt-1">
            <div className="text-xs font-bold text-on-surface">Ánh xạ Độ bền trí nhớ (S) sang 6 cấp độ hiển thị:</div>

            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/15">
              <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: '#94a3b8' }}></span>
              <div className="flex-1 flex items-center justify-between gap-2">
                <span className="font-bold text-on-surface text-xs">Lvl 0 · Chưa học</span>
                <span className="text-[11px] font-semibold text-outline">Từ mới (S = 0)</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/15">
              <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: '#f97316' }}></span>
              <div className="flex-1 flex items-center justify-between gap-2">
                <span className="font-bold text-on-surface text-xs">Lvl 1 · Vừa tiếp xúc / Cần ôn lại</span>
                <span className="text-[11px] font-bold text-amber-600">S &lt; 2.5 ngày</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/15">
              <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: '#f59e0b' }}></span>
              <div className="flex-1 flex items-center justify-between gap-2">
                <span className="font-bold text-on-surface text-xs">Lvl 2 · Bắt đầu quen</span>
                <span className="text-[11px] font-bold text-amber-500">S: 2.5 – 6 ngày</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/15">
              <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: '#0ea5e9' }}></span>
              <div className="flex-1 flex items-center justify-between gap-2">
                <span className="font-bold text-on-surface text-xs">Lvl 3 · Đang củng cố</span>
                <span className="text-[11px] font-bold text-blue-500">S: 6 – 15 ngày</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/15">
              <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: '#a855f7' }}></span>
              <div className="flex-1 flex items-center justify-between gap-2">
                <span className="font-bold text-on-surface text-xs">Lvl 4 · Ghi nhớ tốt</span>
                <span className="text-[11px] font-bold text-purple-500">S: 15 – 30 ngày</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/15">
              <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: '#10b981' }}></span>
              <div className="flex-1 flex items-center justify-between gap-2">
                <span className="font-bold text-on-surface text-xs">Lvl 5 · Trí nhớ sâu (Mastered)</span>
                <span className="text-[11px] font-bold text-emerald-600">S ≥ 30 ngày (tới 1 năm)</span>
              </div>
            </div>
          </div>

          <div className="mt-1 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface-variant leading-relaxed">
            <span className="font-bold text-on-surface block mb-1">4 mức đánh giá chuẩn FSRS:</span>
            <strong>Quên (1)</strong>: Giảm độ bền S và ôn lại ngay · <strong>Khó (2)</strong>: Giữ nhịp an toàn ·{' '}
            <strong>Tốt (3)</strong>: Tăng độ bền chuẩn · <strong>Dễ (4)</strong>: Giảm độ khó D và giãn cách dài hơn.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => closeModal('srsExplainer')}
            className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs sm:text-sm shadow-xs hover:bg-surface-tint active:scale-95 transition-all cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}

export default SrsExplainerModal;
