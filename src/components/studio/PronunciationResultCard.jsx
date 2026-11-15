// src/components/studio/PronunciationResultCard.jsx
import React, { useMemo, useState } from 'react';
import { Volume2, X, ChevronLeft, ChevronRight, Sparkles, AlertCircle, Check, AlertTriangle } from 'lucide-react';
import { buildSentencePronunciationView, getPhonemeSeverity } from '../../utils/studioCore.js';
import { playStudioTts } from '../../services/studioService.js';

const WORD_CARD_STYLE = {
  good: {
    base: 'bg-[#E9F6E6] text-[#28532F] border-[#4D6B53] hover:bg-[#dff0dc]',
    selected: 'bg-[#DFF0DC] text-[#1F4425] border-[#3D352E] ring-2 ring-[#4D6B53]/35 shadow-[2px_2px_0px_#3D352E]',
    badgeClass: 'bg-[#4D6B53] text-white',
    label: 'Khớp âm',
    symbol: '✓',
  },
  near: {
    base: 'bg-[#FFF3D6] text-[#8A4F0B] border-[#D9822B] hover:bg-[#ffe9b8]',
    selected: 'bg-[#FFEBBF] text-[#733F04] border-[#3D352E] ring-2 ring-[#D9822B]/35 shadow-[2px_2px_0px_#3D352E]',
    badgeClass: 'bg-[#D9822B] text-white',
    label: 'Gần đúng',
    symbol: '≈',
  },
  bad: {
    base: 'bg-[#FDECE8] text-[#A8321F] border-[#D96B43] hover:bg-[#fbdad2]',
    selected: 'bg-[#FADAD2] text-[#8F2413] border-[#3D352E] ring-2 ring-[#D96B43]/35 shadow-[2px_2px_0px_#3D352E]',
    badgeClass: 'bg-[#D96B43] text-white',
    label: 'Lệch rõ',
    symbol: '!',
  },
  neutral: {
    base: 'bg-[#F6F1E6] text-[#6B6259] border-[#D7CEC0] hover:border-[#3D352E]',
    selected: 'bg-[#EFE7D6] text-[#3D352E] border-[#3D352E] shadow-[2px_2px_0px_#3D352E]',
    badgeClass: 'bg-[#786F66] text-white',
    label: 'Chưa rõ',
    symbol: '·',
  },
};

const SEGMENT_UNDERLINE = {
  good: '',
  near: 'underline decoration-[#D9822B] decoration-2 underline-offset-4',
  bad: 'underline decoration-[#D96B43] decoration-2 underline-offset-4 font-black',
  neutral: '',
};

const PHONEME_CARD_STYLE = {
  good: {
    card: 'bg-[#F0F8EE] border-[#4D6B53]/50 text-[#28532F]',
    label: 'Khớp âm',
  },
  near: {
    card: 'bg-[#FFF5DC] border-[#D9822B]/60 text-[#8A4F0B]',
    label: 'Gần đúng',
  },
  bad: {
    card: 'bg-[#FDECE8] border-[#D96B43]/60 text-[#A8321F]',
    label: 'Lệch rõ',
  },
};

export function PronunciationResultCard({
  data,
  targetText,
  voice = 'af_heart',
  threshold = 75,
  onPlaySample,
  samplePlaying = false,
}) {
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

  const selectedStyle = selectedWord
    ? WORD_CARD_STYLE[selectedWord.wordLevel] || WORD_CARD_STYLE.neutral
    : null;

  const issueCount = view.nearCount + view.badCount;

  const handlePlaySampleInDrawer = () => {
    if (!selectedWord) return;
    if (typeof onPlaySample === 'function') {
      onPlaySample();
      return;
    }
    playStudioTts({ text: selectedWord.word, voice, speed: 0.9 });
  };

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
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#786F66]">
              <Sparkles className="w-3.5 h-3.5 text-[#D96B43] shrink-0" />
              {view.engine === 'local-browser' ? (
                <span className="px-2 py-0.5 rounded-full bg-[#EEF5EC] text-[#355A3B] border border-[#4D6B53]/30">
                  Chấm Nhanh (0s · Free)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-[#F4E3B4] text-[#3D352E] border border-[#3D352E]/30">
                  OpenPronounce AI (IPA)
                </span>
              )}
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-[#2E2823] mt-0.5">
              {!view.hasVoice
                ? 'Chưa nhận diện được giọng nói rõ ràng'
                : issueCount > 0
                ? `${view.goodCount}/${view.wordViews.length} từ khớp chuẩn · ${view.nearCount} gần đúng · ${view.badCount} lệch/thiếu`
                : 'Phát âm chuẩn 100% các từ trong câu!'}
            </h4>
          </div>
        </div>

        {/* 3-Color Legend with live counts */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-extrabold">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E9F6E6] text-[#28532F] border border-[#4D6B53]">
            <span>✓</span>
            <span>Khớp âm ({view.goodCount})</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF3D6] text-[#8A4F0B] border border-[#D9822B]">
            <span>≈</span>
            <span>Gần đúng ({view.nearCount})</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FDECE8] text-[#A8321F] border border-[#D96B43]">
            <span>!</span>
            <span>Lệch rõ ({view.badCount})</span>
          </span>
        </div>
      </div>

      {!view.hasVoice && (
        <div className="flex items-center gap-2 text-xs font-semibold text-[#9A5B13] bg-[#FFF4DE] border border-[#D9822B]/40 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Chế độ chấm Free chưa nhận diện được giọng nói rõ ràng — bạn có thể bấm{' '}
            <strong className="font-black">Chấm sâu AI</strong> để phân tích trực tiếp từ file ghi âm hoặc nói gần micro hơn.
          </span>
        </div>
      )}

      {/* Interactive Word Tokens: every single word clearly color-coded */}
      <div className="flex flex-wrap gap-2 pt-1">
        {view.wordViews.map((wv) => {
          const isSelected = selectedWordIdx === wv.index;
          const level = wv.wordLevel || 'neutral';
          const palette = WORD_CARD_STYLE[level] || WORD_CARD_STYLE.neutral;
          const spokenHint =
            wv.actualWord && wv.actualWord.toLowerCase() !== wv.word.replace(/[^\p{L}\p{N}'’-]/gu, '').toLowerCase()
              ? wv.actualWord
              : '';
          return (
            <button
              key={`${wv.word}-${wv.index}`}
              type="button"
              onClick={() => setSelectedWordIdx(isSelected ? null : wv.index)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-2 text-sm sm:text-base font-bold transition-all cursor-pointer active:translate-y-0.5 ${
                isSelected ? palette.selected : palette.base
              }`}
              title={`${palette.label}${spokenHint ? ` · Nghe được: "${spokenHint}"` : ''} (Nhấn để xem chi tiết IPA)`}
            >
              <span
                className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black leading-none shrink-0 ${palette.badgeClass}`}
                aria-hidden="true"
              >
                {palette.symbol}
              </span>
              <span>
                {wv.segments.map((seg, sIdx) => (
                  <span
                    key={sIdx}
                    className={
                      level === 'good'
                        ? ''
                        : SEGMENT_UNDERLINE[seg.level] || ''
                    }
                  >
                    {seg.text}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* ASR Transcription note */}
      {view.transcription && (
        <p className="text-xs font-semibold text-[#786F66] bg-[#FAF5EB] rounded-xl px-3 py-2 border border-[#E8DEC8]">
          <span className="font-extrabold text-[#3D352E]">AI nghe bạn đọc:</span>{' '}
          <span className="italic">"{view.transcription}"</span>
        </p>
      )}

      {/* Selected Word Phoneme Inspector Drawer */}
      {selectedWord && selectedStyle && (
        <div className="mt-2 bg-white border-2 border-[#3D352E] rounded-2xl p-3 sm:p-3.5 shadow-[2px_2px_0px_#3D352E] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="text-base font-black text-[#2E2823]">{selectedWord.word}</span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full ${selectedStyle.badgeClass}`}
              >
                {selectedWord.wordLevel === 'good' ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                <span>{selectedStyle.label}</span>
              </span>
              {selectedWord.expectedPhones.length > 0 && (
                <span className="text-xs font-mono font-bold bg-[#EEF5EC] text-[#4D6B53] px-2 py-0.5 rounded-lg border border-[#4D6B53]/30">
                  /{selectedWord.expectedPhones.join(' ')}/
                </span>
              )}
              <button
                type="button"
                onClick={handlePlaySampleInDrawer}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#4D6B53] text-white text-xs font-bold border border-[#3D352E] hover:bg-[#3e5843] cursor-pointer min-h-[34px]"
              >
                <Volume2 className={`w-3.5 h-3.5 ${samplePlaying ? 'animate-pulse' : ''}`} />
                <span>
                  {typeof onPlaySample === 'function'
                    ? samplePlaying
                      ? 'Dừng mẫu video'
                      : 'Nghe mẫu video'
                    : 'Nghe mẫu'}
                </span>
              </button>
            </div>
            <div className="flex items-center gap-1 ml-auto">
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

          {/* Expected vs Spoken word side-by-side comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-[#FAF5EB] border border-[#E8DEC8] px-3 py-1.5 flex items-center justify-between gap-2">
              <span className="font-bold text-[#786F66]">Từ chuẩn:</span>
              <span className="font-black text-[#2E2823]">{selectedWord.word}</span>
            </div>
            <div
              className={`rounded-xl border px-3 py-1.5 flex items-center justify-between gap-2 ${
                selectedWord.wordLevel === 'good'
                  ? 'bg-[#F0F8EE] border-[#4D6B53]/40 text-[#28532F]'
                  : selectedWord.wordLevel === 'near'
                  ? 'bg-[#FFF5DC] border-[#D9822B]/50 text-[#8A4F0B]'
                  : 'bg-[#FDECE8] border-[#D96B43]/50 text-[#A8321F]'
              }`}
            >
              <span className="font-bold opacity-80">Hệ thống nghe được:</span>
              <span className="font-black">
                {selectedWord.actualWord
                  ? `"${selectedWord.actualWord}"`
                  : selectedWord.wordLevel === 'good'
                  ? `"${selectedWord.word}"`
                  : '(Bỏ sót / chưa rõ)'}
              </span>
            </div>
          </div>

          {selectedWord.phones.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {selectedWord.phones.map((p, idx) => {
                const sev = getPhonemeSeverity(p);
                const phoneStyle =
                  sev === 'good'
                    ? PHONEME_CARD_STYLE.good
                    : sev === 'near'
                    ? PHONEME_CARD_STYLE.near
                    : sev === 'bad'
                    ? PHONEME_CARD_STYLE.bad
                    : p.heard &&
                      String(p.expected).normalize('NFC').trim() ===
                        String(p.heard).normalize('NFC').trim()
                    ? PHONEME_CARD_STYLE.good
                    : PHONEME_CARD_STYLE.near;
                const label = !p.heard
                  ? 'Bỏ sót âm'
                  : phoneStyle.label;
                return (
                  <div
                    key={idx}
                    className={`rounded-xl px-2.5 py-1.5 border text-xs ${phoneStyle.card}`}
                  >
                    <div className="font-mono font-black">
                      /{p.expected}/ → {p.heard ? `/${p.heard}/` : '∅'}
                    </div>
                    <div className="text-[10px] font-bold opacity-85">
                      {label}
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
