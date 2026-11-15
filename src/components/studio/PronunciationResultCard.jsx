// src/components/studio/PronunciationResultCard.jsx
import React, { useMemo, useState } from 'react';
import { Volume2, X, ChevronLeft, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import { buildSentencePronunciationView } from '../../utils/studioCore.js';
import { playStudioTts } from '../../services/studioService.js';

const SEGMENT_STYLE = {
  good: 'text-[#3B6E44] bg-[#E8F4E5] border-b-2 border-[#4D6B53] rounded px-0.5',
  near: 'text-[#9A5B13] bg-[#FFF2D6] border-b-2 border-[#D9822B] rounded px-0.5',
  bad: 'text-[#B53D2A] bg-[#FDECE8] border-b-2 border-[#D96B43] rounded px-0.5',
  neutral: 'text-[#2E2823]',
};

export function PronunciationResultCard({ data, targetText, voice = 'af_heart', threshold = 75 }) {
  const [selectedWordIdx, setSelectedWordIdx] = useState(null);

  const view = useMemo(() => {
    if (!data || !targetText) return null;
    return buildSentencePronunciationView(data, targetText);
  }, [data, targetText]);

  if (!view) return null;

  const scoreRounded = Number.isInteger(view.score)
    ? view.score
    : Math.round(view.score * 10) / 10;

  const scoreBadgeClass = !view.hasVoice
    ? 'bg-[#EFEAE0] text-[#786F66] border-[#3D352E]'
    : view.score >= threshold
    ? 'bg-[#E5F2E3] text-[#355A3B] border-[#3D352E]'
    : view.score >= 50
    ? 'bg-[#FFF3D1] text-[#8C5311] border-[#3D352E]'
    : 'bg-[#FBECE7] text-[#B53D2A] border-[#3D352E]';

  const selectedWord =
    selectedWordIdx !== null && view.wordViews[selectedWordIdx]
      ? view.wordViews[selectedWordIdx]
      : null;

  return (
    <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-2xl p-4 shadow-[2.5px_2.5px_0px_#3D352E] space-y-3">
      {/* Top Score & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center shadow-[2px_2px_0px_#3D352E] shrink-0 ${scoreBadgeClass}`}
          >
            <span className="text-xl font-black leading-none">
              {view.hasVoice ? scoreRounded : '—'}
            </span>
            <span className="text-[10px] font-bold opacity-80">/ 100</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#786F66]">
              <Sparkles className="w-3.5 h-3.5 text-[#D96B43]" />
              <span>OpenPronounce · Phân tích âm vị IPA</span>
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-[#2E2823]">
              {!view.hasVoice
                ? 'Chưa nhận diện được giọng nói rõ ràng'
                : view.mismatchedCount > 0
                ? `${view.mismatchedCount}/${view.wordViews.length} từ có âm cần đối chiếu`
                : view.score >= threshold
                ? 'Phát âm rõ ràng & khớp âm tốt!'
                : 'Độ rõ đạt mức khá — nhấn vào từng từ để xem chi tiết'}
            </h4>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="px-2 py-0.5 rounded-full bg-[#E8F4E5] text-[#3B6E44] border border-[#4D6B53]/30">
            ✓ Khớp âm
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#FFF2D6] text-[#9A5B13] border border-[#D9822B]/30">
            ≈ Gần đúng
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#FDECE8] text-[#B53D2A] border border-[#D96B43]/30">
            ! Lệch rõ
          </span>
        </div>
      </div>

      {!view.hasVoice && (
        <div className="flex items-center gap-2 text-xs font-semibold text-[#9A5B13] bg-[#FFF4DE] border border-[#D9822B]/40 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Hãy nói gần micro hơn một chút rồi bấm ghi âm lại nhé.</span>
        </div>
      )}

      {/* Interactive Word Tokens */}
      <div className="flex flex-wrap gap-2 pt-1">
        {view.wordViews.map((wv) => {
          const isSelected = selectedWordIdx === wv.index;
          return (
            <button
              key={`${wv.word}-${wv.index}`}
              type="button"
              onClick={() => setSelectedWordIdx(isSelected ? null : wv.index)}
              className={`px-2.5 py-1.5 rounded-xl border-2 text-sm sm:text-base font-bold transition-all cursor-pointer active:translate-y-0.5 ${
                isSelected
                  ? 'border-[#3D352E] bg-[#F4E3B4] shadow-[2px_2px_0px_#3D352E]'
                  : wv.hasIssue
                  ? 'border-[#D96B43]/60 bg-white hover:border-[#3D352E]'
                  : 'border-[#E8DEC8] bg-white hover:border-[#3D352E]'
              }`}
              title="Nhấn để xem phân tích âm vị IPA của từ này"
            >
              {wv.segments.map((seg, sIdx) => (
                <span key={sIdx} className={SEGMENT_STYLE[seg.level] || SEGMENT_STYLE.neutral}>
                  {seg.text}
                </span>
              ))}
              {wv.unknown.length > 0 && (
                <span className="ml-1 text-[11px] font-mono text-[#9A5B13]">
                  {wv.unknown.map((u) => (u.phone ? `/${u.phone}/` : '')).join(' ')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ASR Transcription note */}
      {view.transcription && (
        <p className="text-xs font-semibold text-[#786F66] bg-[#FAF5EB] rounded-xl px-3 py-2 border border-[#E8DEC8]">
          <span className="font-extrabold text-[#3D352E]">AI nghe được:</span>{' '}
          <span className="italic">"{view.transcription}"</span>
        </p>
      )}

      {/* Selected Word Phoneme Inspector Drawer */}
      {selectedWord && (
        <div className="mt-2 bg-white border-2 border-[#3D352E] rounded-2xl p-3.5 shadow-[2px_2px_0px_#3D352E] space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-[#2E2823]">{selectedWord.word}</span>
              {selectedWord.expectedPhones.length > 0 && (
                <span className="text-xs font-mono font-bold bg-[#EEF5EC] text-[#4D6B53] px-2 py-0.5 rounded-lg border border-[#4D6B53]/30">
                  /{selectedWord.expectedPhones.join(' ')}/
                </span>
              )}
              <button
                type="button"
                onClick={() => playStudioTts({ text: selectedWord.word, voice, speed: 0.9 })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#4D6B53] text-white text-xs font-bold border border-[#3D352E] hover:bg-[#3e5843] cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Nghe mẫu</span>
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={selectedWord.index <= 0}
                onClick={() => setSelectedWordIdx((prev) => Math.max(0, (prev ?? 0) - 1))}
                className="p-1 rounded-lg border border-[#3D352E]/30 disabled:opacity-40 hover:bg-[#FAF5EB] cursor-pointer"
                aria-label="Từ trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={selectedWord.index >= view.wordViews.length - 1}
                onClick={() =>
                  setSelectedWordIdx((prev) => Math.min(view.wordViews.length - 1, (prev ?? 0) + 1))
                }
                className="p-1 rounded-lg border border-[#3D352E]/30 disabled:opacity-40 hover:bg-[#FAF5EB] cursor-pointer"
                aria-label="Từ tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedWordIdx(null)}
                className="p-1 rounded-lg border border-[#3D352E]/30 hover:bg-[#FAF5EB] cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {selectedWord.phones.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {selectedWord.phones.map((p, idx) => {
                const match =
                  p.heard &&
                  String(p.expected).normalize('NFC').trim() ===
                    String(p.heard).normalize('NFC').trim();
                return (
                  <div
                    key={idx}
                    className={`rounded-xl px-2.5 py-1.5 border text-xs ${
                      match
                        ? 'bg-[#F0F8EE] border-[#4D6B53]/40 text-[#355A3B]'
                        : 'bg-[#FDECE8] border-[#D96B43]/50 text-[#B53D2A]'
                    }`}
                  >
                    <div className="font-mono font-black">
                      /{p.expected}/ → {p.heard ? `/${p.heard}/` : '∅'}
                    </div>
                    <div className="text-[10px] font-bold opacity-80">
                      {match ? 'Khớp âm' : 'Lệch âm'}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs font-semibold text-[#786F66]">
              {selectedWord.acceptedVariant
                ? 'Biến thể phát âm được chấp nhận cho từ chức năng.'
                : 'Từ này chưa có bảng căn chỉnh âm vị chi tiết.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default PronunciationResultCard;
