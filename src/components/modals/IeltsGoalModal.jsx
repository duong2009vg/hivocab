// src/components/modals/IeltsGoalModal.jsx
// Modal Thiết Lập Lộ Trình Rèn Luyện IELTS - Phong cách Cozy Crayon ấm áp
import React, { useState, useEffect, useMemo } from 'react';
import { saveIELTSGoal } from '../../services/db.js';

export const IELTS_BANDS = ['4.0', '4.5', '5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'];

/**
 * Tính Overall Band theo chuẩn chính thức của IELTS (làm tròn .0 / .5 theo remainder)
 */
export function calculateIeltsOverall(l, r, w, s) {
  const avg = (parseFloat(l) + parseFloat(r) + parseFloat(w) + parseFloat(s)) / 4;
  const intPart = Math.floor(avg);
  const frac = avg - intPart;
  if (frac < 0.25) return intPart.toFixed(1);
  if (frac < 0.75) return (intPart + 0.5).toFixed(1);
  return (intPart + 1).toFixed(1);
}

/**
 * Chuẩn từ vựng cốt lõi theo từng mức band IELTS
 */
export function getIeltsVocabStandard(band) {
  const b = parseFloat(band) || 7.0;
  if (b <= 5.0) {
    return {
      bandRange: 'IELTS 4.0 – 5.0',
      min: 2000,
      max: 3000,
      target: 2500,
      description: 'Khoảng 2.000 – 3.000 từ vựng cơ bản và thông dụng.',
    };
  }
  if (b <= 6.0) {
    return {
      bandRange: 'IELTS 6.0',
      min: 3000,
      max: 4000,
      target: 3500,
      description: 'Khoảng 3.000 – 4.000 từ (trong đó có khoảng 1.500 từ vựng thuộc chủ đề học thuật).',
    };
  }
  if (b <= 6.5) {
    return {
      bandRange: 'IELTS 6.5',
      min: 4000,
      max: 6000,
      target: 5000,
      description: 'Khoảng 4.000 – 6.000 từ vựng kết hợp collocations và từ đồng nghĩa.',
    };
  }
  if (b <= 7.0) {
    return {
      bandRange: 'IELTS 7.0',
      min: 5000,
      max: 8000,
      target: 6500,
      description: 'Khoảng 5.000 – 8.000 từ (bao gồm cả từ vựng phổ thông và nâng cao).',
    };
  }
  if (b <= 8.0) {
    return {
      bandRange: 'IELTS 7.5 – 8.0',
      min: 6000,
      max: 9000,
      target: 8000,
      description: 'Khoảng 6.000 – 9.000 từ (yêu cầu cao về active vocabulary - từ vựng chủ động có thể dùng ngay trong Nói và Viết).',
    };
  }
  return {
    bandRange: 'IELTS 8.5 – 9.0',
    min: 10000,
    max: 15000,
    target: 12000,
    description: 'Khoảng 10.000 – 15.000 từ trở lên, bao gồm lượng lớn từ vựng chuyên sâu và học thuật.',
  };
}

export function IeltsGoalModal({ isOpen, onClose, currentGoal, currentWords = 0, onSaveSuccess }) {
  const [listening, setListening] = useState('7.0');
  const [reading, setReading] = useState('7.0');
  const [writing, setWriting] = useState('6.5');
  const [speaking, setSpeaking] = useState('6.5');
  const [examDate, setExamDate] = useState('');
  const [motto, setMotto] = useState('Học tập kiên trì, tự tin chinh phục mục tiêu IELTS!');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && currentGoal) {
      setListening(currentGoal.listening || '7.0');
      setReading(currentGoal.reading || '7.0');
      setWriting(currentGoal.writing || '6.5');
      setSpeaking(currentGoal.speaking || '6.5');
      setExamDate(currentGoal.examDate || '');
      if (currentGoal.motto) setMotto(currentGoal.motto);
    }
  }, [isOpen, currentGoal]);

  const overall = useMemo(() => {
    return calculateIeltsOverall(listening, reading, writing, speaking);
  }, [listening, reading, writing, speaking]);

  const vocabStandard = useMemo(() => {
    return getIeltsVocabStandard(overall);
  }, [overall]);

  const percentProgress = useMemo(() => {
    if (!vocabStandard.target) return 0;
    return Math.min(100, Math.round((currentWords / vocabStandard.target) * 100));
  }, [currentWords, vocabStandard]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const goalData = {
        overall,
        listening,
        reading,
        writing,
        speaking,
        examDate,
        motto: motto.trim(),
      };
      await saveIELTSGoal(goalData);
      if (typeof window !== 'undefined' && typeof window.showHiToast === 'function') {
        window.showHiToast(`Đã lưu mục tiêu IELTS ${overall}! Chúc bạn rèn luyện bứt phá! 🎯`, 'success');
      }
      if (onSaveSuccess) onSaveSuccess(goalData);
      onClose();
    } catch (err) {
      console.error('[IeltsGoalModal] save error:', err);
      if (typeof window !== 'undefined' && typeof window.showHiToast === 'function') {
        window.showHiToast('Có lỗi xảy ra khi lưu mục tiêu. Vui lòng thử lại.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const skillFields = [
    { id: 'listening', label: 'Nghe (Listening)', emoji: '🎧', val: listening, set: setListening },
    { id: 'reading', label: 'Đọc (Reading)', emoji: '📖', val: reading, set: setReading },
    { id: 'writing', label: 'Viết (Writing)', emoji: '✍️', val: writing, set: setWriting },
    { id: 'speaking', label: 'Nói (Speaking)', emoji: '🗣️', val: speaking, set: setSpeaking },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#FFFDF9] rounded-3xl border-[2.5px] border-[#3D352E] shadow-[5px_6px_0px_#3D352E] p-5 sm:p-7 max-h-[92vh] overflow-y-auto select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng modal */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] text-[#3D352E] font-black hover:bg-[#FAF5EB] active:translate-y-0.5 transition-all flex items-center justify-center text-sm cursor-pointer"
          title="Đóng"
        >
          ✕
        </button>

        {/* Header Modal */}
        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-[#FEEFEA] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center text-2xl shrink-0">
            🚩
          </div>
          <div>
            <span className="text-[11px] font-black uppercase text-[#DE5D53] tracking-wider block">
              Lộ trình rèn luyện cá nhân
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#302A24] font-quicksand leading-tight">
              Mục Tiêu Band IELTS 🎯
            </h2>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
          {/* Card Overall Band Preview */}
          <div className="bg-[#FAF5EB] p-4 rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#786F66] uppercase tracking-wider">
                Ước tính Overall Band
              </span>
              <p className="text-xs text-[#554A41] font-medium leading-relaxed">
                Tự động tính từ trung bình 4 kỹ năng theo quy chế làm tròn chuẩn IELTS.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="px-4 py-2 bg-[#DE5D53] text-white font-black text-2xl sm:text-3xl rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
                {overall}
              </div>
              <span className="text-[10px] font-extrabold text-[#DE5D53] uppercase mt-1">Band Overall</span>
            </div>
          </div>

          {/* Chọn Band 4 Kỹ Năng */}
          <div className="space-y-2.5">
            <label className="text-xs font-black text-[#302A24] uppercase tracking-wider flex items-center gap-1.5">
              <span>🎯 Chọn band điểm mục tiêu cho từng kỹ năng:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {skillFields.map((skill) => (
                <div 
                  key={skill.id}
                  className="bg-white p-3 rounded-2xl border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{skill.emoji}</span>
                    <span className="text-xs font-bold text-[#302A24]">{skill.label}</span>
                  </div>
                  <select
                    value={skill.val}
                    onChange={(e) => skill.set(e.target.value)}
                    className="px-2.5 py-1.5 bg-[#FAF5EB] text-xs font-black text-[#302A24] rounded-xl border-2 border-[#3D352E] focus:outline-none focus:ring-2 focus:ring-[#DE5D53] cursor-pointer"
                  >
                    {IELTS_BANDS.map((b) => (
                      <option key={b} value={b}>
                        Band {b}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Card Chuẩn Từ Vựng Cốt Lõi Tương Ứng */}
          <div className="bg-[#FFF8EA] p-4 rounded-2xl border-2 border-[#E5A83B] relative overflow-hidden space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#B4741E] uppercase tracking-wider flex items-center gap-1">
                📚 Chuẩn từ vựng cốt lõi ({vocabStandard.bandRange})
              </span>
              <span className="text-xs font-black text-[#302A24] bg-white px-2.5 py-0.5 rounded-full border border-[#3D352E]">
                {currentWords} / ~{vocabStandard.target.toLocaleString()} từ
              </span>
            </div>
            <p className="text-xs text-[#5C461F] font-semibold leading-relaxed">
              {vocabStandard.description}
            </p>
            {/* Progress Bar */}
            <div className="pt-1 space-y-1">
              <div className="w-full bg-[#EAD8B3] rounded-full h-3 p-0.5 border border-[#3D352E]">
                <div 
                  className="bg-[#DE5D53] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${percentProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-[#7A643E]">
                <span>Tiến độ hiện tại: <strong className="text-[#DE5D53] font-black">{percentProgress}%</strong></span>
                <span>Cần thêm: ~{Math.max(0, vocabStandard.target - currentWords).toLocaleString()} từ</span>
              </div>
            </div>
          </div>

          {/* Ngày Thi Dự Kiến & Quyết Tâm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#302A24] uppercase tracking-wider mb-1">
                📅 Ngày thi dự kiến (nếu có)
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 bg-white text-xs font-bold text-[#302A24] rounded-xl border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] focus:outline-none focus:ring-2 focus:ring-[#DE5D53]"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-[#302A24] uppercase tracking-wider mb-1">
                💬 Lời nhắc quyết tâm
              </label>
              <input
                type="text"
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                placeholder="VD: Quyết tâm 7.0 IELTS năm nay!"
                className="w-full px-3 py-2 bg-white text-xs font-bold text-[#302A24] rounded-xl border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] focus:outline-none focus:ring-2 focus:ring-[#DE5D53]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] text-xs font-bold text-[#302A24] hover:bg-[#FAF5EB] active:translate-y-0.5 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-2xl bg-[#DE5D53] hover:bg-[#C84F45] text-white font-black text-xs sm:text-sm border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSaving ? 'Đang lưu...' : 'Lưu Mục Tiêu 🎯'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default IeltsGoalModal;
