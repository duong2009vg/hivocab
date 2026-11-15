// src/components/studio/PronunciationResultCard.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Volume2,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Check,
  AlertTriangle,
  Activity,
  AudioLines,
  Lightbulb,
  Play,
  Square,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  buildSentencePronunciationView,
  getPhonemeCoachingTip,
  getPhonemeSeverity,
} from '../../utils/studioCore.js';
import { playStudioTts } from '../../services/studioService.js';

const WORD_CARD_STYLE = {
  good: {
    base: 'bg-[#E9F6E6] text-[#28532F] border-[#4D6B53] hover:bg-[#dff0dc]',
    selected: 'bg-[#DFF0DC] text-[#1F4425] border-[#3D352E] ring-2 ring-[#4D6B53]/40 shadow-[2px_2px_0px_#3D352E]',
    badgeClass: 'bg-[#4D6B53] text-white',
    label: 'Đọc đúng',
    symbol: '✓',
  },
  near: {
    base: 'bg-[#FFF3D6] text-[#8A4F0B] border-[#D9822B] hover:bg-[#ffe9b8]',
    selected: 'bg-[#FFEBBF] text-[#733F04] border-[#3D352E] ring-2 ring-[#D9822B]/40 shadow-[2px_2px_0px_#3D352E]',
    badgeClass: 'bg-[#D9822B] text-white',
    label: 'Gần đúng',
    symbol: '≈',
  },
  bad: {
    base: 'bg-[#FDECE8] text-[#A8321F] border-[#D96B43] hover:bg-[#fbdad2]',
    selected: 'bg-[#FADAD2] text-[#8F2413] border-[#3D352E] ring-2 ring-[#D96B43]/40 shadow-[2px_2px_0px_#3D352E]',
    badgeClass: 'bg-[#D96B43] text-white',
    label: 'Đọc sai',
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

const INLINE_PHONE_CHIP = {
  good: 'bg-white/75 text-[#28532F] border-[#4D6B53]/35',
  near: 'bg-[#FFE7B3] text-[#7A4407] border-[#D9822B]/60',
  bad: 'bg-[#FAD4CB] text-[#8F2413] border-[#D96B43]/70 font-black',
  neutral: 'bg-white/60 text-[#5C5349] border-[#D7CEC0]',
};

const PHONEME_CARD_STYLE = {
  good: {
    card: 'bg-[#F0F8EE] border-[#4D6B53]/50 text-[#28532F]',
    pill: 'bg-[#4D6B53] text-white',
    label: 'Đọc đúng',
  },
  near: {
    card: 'bg-[#FFF5DC] border-[#D9822B]/60 text-[#8A4F0B]',
    pill: 'bg-[#D9822B] text-white',
    label: 'Gần đúng',
  },
  bad: {
    card: 'bg-[#FDECE8] border-[#D96B43]/60 text-[#A8321F]',
    pill: 'bg-[#D96B43] text-white',
    label: 'Đọc sai',
  },
};

function renderCompactSparklineSvg(seriesA, seriesB = [], height = 74) {
  const cleanA = (seriesA || []).map(Number).filter(Number.isFinite);
  const cleanB = (seriesB || []).map(Number).filter(Number.isFinite);
  const combined = [...cleanA, ...cleanB];
  if (combined.length < 2) return null;

  const width = 420;
  const min = Math.min(...combined);
  const max = Math.max(...combined);
  const range = Math.max(1e-5, max - min);

  const toPoints = (arr) => {
    if (arr.length < 2) return '';
    return arr
      .map((val, idx) => {
        const x = (idx / Math.max(1, arr.length - 1)) * width;
        const y = height - 8 - ((val - min) / range) * (height - 16);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[74px] overflow-visible">
      <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#E8DEC8" strokeDasharray="4 4" strokeWidth="1" />
      {cleanA.length >= 2 && (
        <polyline
          fill="none"
          stroke="#4D6B53"
          strokeWidth="2.2"
          strokeDasharray="5 3"
          points={toPoints(cleanA)}
        />
      )}
      {cleanB.length >= 2 && (
        <polyline
          fill="none"
          stroke="#D96B43"
          strokeWidth="2.4"
          points={toPoints(cleanB)}
        />
      )}
    </svg>
  );
}

function MetricPillCard({ label, value, sub, accent = 'neutral' }) {
  const tone =
    accent === 'good'
      ? 'bg-[#EEF5EC] border-[#4D6B53]/50 text-[#28532F]'
      : accent === 'near'
      ? 'bg-[#FFF5DC] border-[#D9822B]/50 text-[#8A4F0B]'
      : accent === 'bad'
      ? 'bg-[#FDECE8] border-[#D96B43]/50 text-[#A8321F]'
      : 'bg-white border-[#E8DEC8] text-[#2E2823]';
  return (
    <div className={`rounded-xl border px-3 py-2 flex flex-col justify-between gap-0.5 ${tone}`}>
      <span className="text-[10px] font-extrabold uppercase tracking-wide opacity-75">{label}</span>
      <span className="text-base sm:text-lg font-black leading-tight">{value}</span>
      {sub && <span className="text-[11px] font-bold opacity-85 leading-snug">{sub}</span>}
    </div>
  );
}

function metricAccent(pct) {
  if (!Number.isFinite(pct)) return 'neutral';
  if (pct >= 80) return 'good';
  if (pct >= 55) return 'near';
  return 'bad';
}

export function PronunciationResultCard({
  data,
  targetText,
  voice = 'af_heart',
  threshold = 75,
  recordedUrl = '',
  onPlaySample,
  samplePlaying = false,
  onRequestDeepAi,
  scoringDeepAi = false,
}) {
  const [selectedWordIdx, setSelectedWordIdx] = useState(null);
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(false);
  const [playingUserClip, setPlayingUserClip] = useState(false);
  const userAudioRef = useRef(null);

  const view = useMemo(() => {
    if (!data || !targetText) return null;
    return buildSentencePronunciationView(data, targetText);
  }, [data, targetText]);

  // Reset modal selection when target or engine data updates
  useEffect(() => {
    setSelectedWordIdx(null);
  }, [data, targetText]);

  // Escape key closes the word inspector popup modal
  useEffect(() => {
    if (selectedWordIdx === null) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedWordIdx(null);
      } else if (e.key === 'ArrowLeft') {
        setSelectedWordIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowRight' && view) {
        setSelectedWordIdx((prev) =>
          prev !== null && prev < view.wordViews.length - 1 ? prev + 1 : prev
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedWordIdx, view]);

  useEffect(() => {
    return () => {
      if (userAudioRef.current) {
        try {
          userAudioRef.current.pause();
        } catch (_) {}
        userAudioRef.current = null;
      }
    };
  }, []);

  if (!view) return null;

  const isDeepAi = view.engine !== 'local-browser';
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
  const { phonemeSummary, topPhonemeIssues } = view;
  const hasDtwVectors = view.expectedVector.length >= 2 && view.transcribedVector.length >= 2;
  const hasProsodyF0 = Array.isArray(view.prosody?.f0) && view.prosody.f0.length >= 2;
  const hasProsodyEnergy = Array.isArray(view.prosody?.energy) && view.prosody.energy.length >= 2;
  const hasAnyDeepChart = hasDtwVectors || hasProsodyF0 || hasProsodyEnergy || view.heardConfidence.length > 0;

  const handlePlaySampleInPopup = () => {
    if (!selectedWord) return;
    if (typeof onPlaySample === 'function') {
      onPlaySample();
      return;
    }
    playStudioTts({ text: selectedWord.word, voice, speed: 0.9 });
  };

  const handleToggleUserRecording = () => {
    if (!recordedUrl) return;
    if (playingUserClip && userAudioRef.current) {
      userAudioRef.current.pause();
      userAudioRef.current.currentTime = 0;
      setPlayingUserClip(false);
      return;
    }
    if (!userAudioRef.current || userAudioRef.current.src !== recordedUrl) {
      userAudioRef.current = new Audio(recordedUrl);
    }
    const audio = userAudioRef.current;
    audio.onended = () => setPlayingUserClip(false);
    audio.onerror = () => setPlayingUserClip(false);
    audio.currentTime = 0;
    setPlayingUserClip(true);
    audio.play().catch(() => setPlayingUserClip(false));
  };

  const wordPopupModal =
    selectedWord && selectedStyle && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5 bg-[#2E2823]/60 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="studio-word-popup-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedWordIdx(null);
            }}
          >
            <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#fffcf7] border-2 border-[#3D352E] rounded-3xl p-4 sm:p-5 shadow-[4px_4px_0px_#3D352E] space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
              {/* Popup Top Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E8DEC8]">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h3
                    id="studio-word-popup-title"
                    className="text-lg sm:text-xl font-black text-[#2E2823]"
                  >
                    {selectedWord.word}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${selectedStyle.badgeClass}`}
                  >
                    {selectedWord.wordLevel === 'good' ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    <span>{selectedStyle.label}</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#786F66]">
                    Từ #{selectedWord.index + 1}/{view.wordViews.length}
                  </span>
                </div>

                <div className="flex items-center gap-1 ml-auto">
                  <button
                    type="button"
                    disabled={selectedWord.index <= 0}
                    onClick={() => setSelectedWordIdx((prev) => Math.max(0, (prev ?? 0) - 1))}
                    className="inline-flex items-center gap-0.5 px-2 py-1 rounded-xl border border-[#3D352E]/40 bg-white text-xs font-bold disabled:opacity-40 hover:bg-[#FAF5EB] cursor-pointer"
                    aria-label="Từ trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Trước</span>
                  </button>
                  <button
                    type="button"
                    disabled={selectedWord.index >= view.wordViews.length - 1}
                    onClick={() =>
                      setSelectedWordIdx((prev) =>
                        Math.min(view.wordViews.length - 1, (prev ?? 0) + 1)
                      )
                    }
                    className="inline-flex items-center gap-0.5 px-2 py-1 rounded-xl border border-[#3D352E]/40 bg-white text-xs font-bold disabled:opacity-40 hover:bg-[#FAF5EB] cursor-pointer"
                    aria-label="Từ tiếp theo"
                  >
                    <span className="hidden sm:inline">Sau</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWordIdx(null)}
                    className="p-1.5 rounded-xl border border-[#3D352E] bg-[#FDECE8] hover:bg-[#fad2c8] text-[#3D352E] cursor-pointer ml-1"
                    aria-label="Đóng pop-up"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Word IPA Ribbon + Audio Replay Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FAF5EB] border border-[#E8DEC8] rounded-2xl p-3">
                <div className="space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-[#786F66]">
                    Cách đọc chuẩn (từng âm trong từ)
                  </div>
                  {selectedWord.expectedPhones.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1 font-mono text-sm font-black">
                      <span className="text-[#786F66]">/</span>
                      {selectedWord.expectedPhones.map((ep, pIdx) => {
                        const alignedPhone = selectedWord.phones[pIdx];
                        const sev =
                          alignedPhone && alignedPhone.expected === ep
                            ? getPhonemeSeverity(alignedPhone)
                            : null;
                        const pillTone =
                          sev === 'good'
                            ? 'bg-[#E9F6E6] text-[#28532F] border-[#4D6B53]/50'
                            : sev === 'near'
                            ? 'bg-[#FFF3D6] text-[#8A4F0B] border-[#D9822B]'
                            : sev === 'bad'
                            ? 'bg-[#FDECE8] text-[#A8321F] border-[#D96B43]'
                            : 'bg-white text-[#2E2823] border-[#D7CEC0]';
                        return (
                          <span
                            key={pIdx}
                            className={`px-1.5 py-0.5 rounded-md border ${pillTone}`}
                          >
                            {ep}
                          </span>
                        );
                      })}
                      <span className="text-[#786F66]">/</span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-[#786F66]">Chưa có phiên âm</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePlaySampleInPopup}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4D6B53] text-white text-xs font-extrabold border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] hover:bg-[#3e5843] cursor-pointer min-h-[36px]"
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

                  {recordedUrl && (
                    <button
                      type="button"
                      onClick={handleToggleUserRecording}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#2E2823] text-xs font-extrabold border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] hover:bg-[#F4E3B4]/40 cursor-pointer min-h-[36px]"
                    >
                      {playingUserClip ? (
                        <Square className="w-3 h-3 fill-current text-[#D96B43]" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current text-[#D96B43]" />
                      )}
                      <span>{playingUserClip ? 'Dừng giọng bạn' : 'Nghe giọng bạn'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Expected vs Heard Word & IPA Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white border border-[#E8DEC8] px-3 py-2 space-y-0.5">
                  <div className="font-extrabold text-[#786F66] uppercase text-[10px]">
                    Từ đọc chuẩn
                  </div>
                  <div className="font-black text-sm text-[#2E2823]">{selectedWord.word}</div>
                  {selectedWord.expectedPhones.length > 0 && (
                    <div className="font-mono font-bold text-[#4D6B53]">
                      /{selectedWord.expectedPhones.join(' ')}/
                    </div>
                  )}
                </div>

                <div
                  className={`rounded-xl border px-3 py-2 space-y-0.5 ${
                    selectedWord.wordLevel === 'good'
                      ? 'bg-[#F0F8EE] border-[#4D6B53]/40 text-[#28532F]'
                      : selectedWord.wordLevel === 'near'
                      ? 'bg-[#FFF5DC] border-[#D9822B]/50 text-[#8A4F0B]'
                      : 'bg-[#FDECE8] border-[#D96B43]/50 text-[#A8321F]'
                  }`}
                >
                  <div className="font-extrabold uppercase text-[10px] opacity-80">
                    {isDeepAi ? 'AI nghe bạn đọc' : 'Máy nghe bạn đọc'}
                  </div>
                  <div className="font-black text-sm">
                    {selectedWord.actualWord
                      ? `"${selectedWord.actualWord}"`
                      : selectedWord.actualPhones.length > 0
                      ? '(Nghe theo âm ghép)'
                      : selectedWord.wordLevel === 'good'
                      ? `"${selectedWord.word}"`
                      : '(Bị nuốt / chưa rõ)'}
                  </div>
                  <div className="font-mono font-bold">
                    {selectedWord.actualPhones.length > 0
                      ? `/${selectedWord.actualPhones.join(' ')}/`
                      : selectedWord.wordLevel === 'good' && selectedWord.expectedPhones.length > 0
                      ? `/${selectedWord.expectedPhones.join(' ')}/`
                      : '/∅/'}
                  </div>
                </div>
              </div>

              {/* Detailed Phoneme-by-Phoneme Diagnosis Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wide text-[#554D42]">
                    Từng âm trong từ &amp; Mẹo sửa
                  </h4>
                  {!isDeepAi && (
                    <span className="text-[10px] font-bold text-[#786F66]">
                      Chấm Free · bấm Chấm sâu AI để nghe chuẩn từng âm hơn
                    </span>
                  )}
                </div>

                {selectedWord.phones.length > 0 ? (
                  <div className="space-y-2">
                    {selectedWord.phones.map((p, idx) => {
                      const sev = getPhonemeSeverity(p);
                      const cardStyle =
                        sev === 'good'
                          ? PHONEME_CARD_STYLE.good
                          : sev === 'near'
                          ? PHONEME_CARD_STYLE.near
                          : PHONEME_CARD_STYLE.bad;
                      const heardClean = typeof p.heard === 'string' ? p.heard.trim() : '';
                      const statusLabel = !heardClean
                        ? 'Quên đọc âm này'
                        : cardStyle.label;
                      const confPct = Number.isFinite(Number(p.confidence))
                        ? Math.round(Number(p.confidence) * 100)
                        : null;
                      const tip =
                        sev === 'good' ? '' : getPhonemeCoachingTip(p.expected, heardClean);

                      return (
                        <div
                          key={idx}
                          className={`rounded-2xl px-3 py-2.5 border space-y-1 ${cardStyle.card}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 font-mono font-black text-sm">
                              <span className="px-2 py-0.5 rounded-lg bg-white/80 border border-current/20">
                                /{p.expected}/
                              </span>
                              <span>→</span>
                              <span className="px-2 py-0.5 rounded-lg bg-white/80 border border-current/20">
                                {heardClean ? `/${heardClean}/` : '∅'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isDeepAi && sev !== 'good' && confPct !== null && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/80 border border-current/25">
                                  Mức độ lệch: {confPct}%
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${cardStyle.pill}`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                          </div>

                          {tip && (
                            <p className="text-xs font-semibold leading-relaxed flex items-start gap-1.5 pt-0.5">
                              <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>{tip}</span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-[#786F66] bg-[#FAF5EB] border border-[#E8DEC8] rounded-xl px-3 py-2.5">
                    {selectedWord.acceptedVariant
                      ? 'Cách đọc lướt tự nhiên này hoàn toàn đúng và được chấp nhận trong câu.'
                      : 'Từ này chưa có phân tích chi tiết từng âm.'}
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-2xl p-3.5 sm:p-4 shadow-[2.5px_2.5px_0px_#3D352E] space-y-3.5">
        {/* Top Score & Engine Header */}
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
                {!isDeepAi ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#EEF5EC] text-[#355A3B] border border-[#4D6B53]/30">
                    Chấm miễn phí · Tức thì
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#3D352E] text-[#F4E3B4] border border-[#3D352E]">
                    Chấm sâu AI · Soi từng âm
                  </span>
                )}
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-[#2E2823] mt-0.5">
                {!view.hasVoice
                  ? 'Chưa nghe rõ giọng nói của bạn'
                  : issueCount > 0
                  ? `${view.goodCount}/${view.wordViews.length} từ đọc đúng · ${view.nearCount} gần đúng · ${view.badCount} đọc sai`
                  : 'Tuyệt vời — bạn đọc đúng 100% các từ!'}
              </h4>
            </div>
          </div>

          {/* 3-Color Legend with live counts */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-extrabold">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E9F6E6] text-[#28532F] border border-[#4D6B53]">
              <span>✓</span>
              <span>Đọc đúng ({view.goodCount})</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF3D6] text-[#8A4F0B] border border-[#D9822B]">
              <span>≈</span>
              <span>Gần đúng ({view.nearCount})</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FDECE8] text-[#A8321F] border border-[#D96B43]">
              <span>!</span>
              <span>Đọc sai ({view.badCount})</span>
            </span>
          </div>
        </div>

        {/* Deep AI vs Free Callout / 4-Pillar Diagnostic Breakdown */}
        {isDeepAi && view.hasVoice && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <MetricPillCard
              label="Độ chuẩn từng âm"
              value={view.phonemeScore !== null ? `${view.phonemeScore}%` : '—'}
              sub={
                phonemeSummary.totalPhones > 0
                  ? `${phonemeSummary.matchedPhones}/${phonemeSummary.totalPhones} âm đọc đúng${
                      phonemeSummary.omittedPhones > 0
                        ? ` · thiếu ${phonemeSummary.omittedPhones} âm`
                        : ''
                    }`
                  : 'So từng âm một trong câu'
              }
              accent={metricAccent(view.phonemeScore)}
            />
            <MetricPillCard
              label="Giọng tự nhiên"
              value={view.acousticScore !== null ? `${view.acousticScore}%` : '—'}
              sub="Mức độ giống giọng bản xứ"
              accent={metricAccent(view.acousticScore)}
            />
            <MetricPillCard
              label="Đọc đúng đủ từ"
              value={view.wordScore !== null ? `${view.wordScore}%` : '—'}
              sub={`Sai hoặc sót ${Math.round(Number(view.wordErrorRate || 0) * 100)}% số từ`}
              accent={metricAccent(view.wordScore)}
            />
            <MetricPillCard
              label="Độ rõ tiếng nói"
              value={view.meanConfidencePct !== null ? `${view.meanConfidencePct}%` : '—'}
              sub={`AI nghe rõ ${view.heardPhones.length} âm`}
              accent={metricAccent(view.meanConfidencePct)}
            />
          </div>
        )}

        {!isDeepAi && view.hasVoice && typeof onRequestDeepAi === 'function' && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FAF5EB] border border-[#D96B43]/35 rounded-xl px-3 py-2 text-xs">
            <span className="font-semibold text-[#554D42]">
              Đây là kết quả <strong className="font-black text-[#2E2823]">Chấm Free</strong> (ước lượng nhanh). Bấm{' '}
              <strong className="font-black text-[#4D6B53]">Chấm sâu AI</strong> để AI nghe kỹ từng âm, chỉ rõ bạn sai âm nào &amp; hướng dẫn cách sửa miệng/lưỡi.
            </span>
            <button
              type="button"
              onClick={onRequestDeepAi}
              disabled={scoringDeepAi}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4D6B53] hover:bg-[#3f5844] text-white text-[11px] font-black border border-[#3D352E] cursor-pointer disabled:opacity-60 shrink-0"
            >
              <Sparkles className="w-3 h-3" />
              <span>{scoringDeepAi ? 'Đang chấm sâu AI…' : 'Chấm sâu AI'}</span>
            </button>
          </div>
        )}

        {!view.hasVoice && (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#9A5B13] bg-[#FFF4DE] border border-[#D9822B]/40 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Chế độ chấm Free chưa nghe rõ giọng bạn — hãy bấm{' '}
              <strong className="font-black">Chấm sâu AI</strong> để AI phân tích trực tiếp từ file ghi âm, hoặc nói gần micro hơn.
            </span>
          </div>
        )}

        {/* Interactive Word Tokens (Deep AI exposes per-phoneme diffs right inside every card!) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#786F66]">
            <span>
              {isDeepAi
                ? 'Kết quả từng từ & từng âm (bấm vào từ để xem cách sửa):'
                : 'Bấm vào từng từ để xem chi tiết đúng/sai:'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {view.wordViews.map((wv) => {
              const isSelected = selectedWordIdx === wv.index;
              const level = wv.wordLevel || 'neutral';
              const palette = WORD_CARD_STYLE[level] || WORD_CARD_STYLE.neutral;
              const phoneRows = Array.isArray(wv.phones) ? wv.phones : [];

              return (
                <button
                  key={`${wv.word}-${wv.index}`}
                  type="button"
                  onClick={() => setSelectedWordIdx(wv.index)}
                  className={`inline-flex flex-col items-start gap-1 px-2.5 py-1.5 rounded-xl border-2 text-left transition-all cursor-pointer active:translate-y-0.5 ${
                    isSelected ? palette.selected : palette.base
                  }`}
                  title="Bấm để mở pop-up phân tích từng âm vị & nghe mẫu"
                >
                  <span className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold leading-tight">
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
                          className={level === 'good' ? '' : SEGMENT_UNDERLINE[seg.level] || ''}
                        >
                          {seg.text}
                        </span>
                      ))}
                    </span>
                  </span>

                  {/* In Deep AI mode, show inline phoneme breakdown right on the word chip */}
                  {isDeepAi && phoneRows.length > 0 && (
                    <span className="flex flex-wrap items-center gap-1 font-mono text-[10px] leading-none">
                      {phoneRows.map((p, pIdx) => {
                        const sev = getPhonemeSeverity(p) || 'neutral';
                        const chipCls = INLINE_PHONE_CHIP[sev] || INLINE_PHONE_CHIP.neutral;
                        const heardClean = typeof p.heard === 'string' ? p.heard.trim() : '';
                        const showDiff = sev !== 'good';
                        return (
                          <span
                            key={pIdx}
                            className={`px-1 py-0.5 rounded border ${chipCls}`}
                          >
                            {showDiff
                              ? heardClean
                                ? `${p.expected}→${heardClean}`
                                : `−${p.expected}`
                              : p.expected}
                          </span>
                        );
                      })}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Deep AI: Priority Focus Sounds & Coaching Fixes */}
        {isDeepAi && view.hasVoice && topPhonemeIssues.length > 0 && (
          <div className="bg-[#FAF5EB] border border-[#D96B43]/40 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#2E2823]">
                <Lightbulb className="w-4 h-4 text-[#D96B43] shrink-0" />
                <span>Các âm bạn hay đọc lệch — cần chỉnh ngay ({topPhonemeIssues.length})</span>
              </div>
              <span className="text-[10px] font-bold text-[#786F66]">Bấm vào tên từ để mở chi tiết</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {topPhonemeIssues.slice(0, 6).map((issue, idx) => {
                const isBad = issue.severity === 'bad';
                const targetIdx = view.wordViews.findIndex((w) => w.word === issue.words[0]);
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border px-3 py-2 space-y-1 text-xs ${
                      isBad
                        ? 'bg-[#FDECE8] border-[#D96B43]/50 text-[#8F2413]'
                        : 'bg-[#FFF5DC] border-[#D9822B]/50 text-[#7A4407]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 font-mono font-black">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] text-white ${
                            isBad ? 'bg-[#D96B43]' : 'bg-[#D9822B]'
                          }`}
                        >
                          {issue.heard ? 'Đọc nhầm' : 'Bị mất âm'}
                        </span>
                        <span>/{issue.expected}/</span>
                        <span>→</span>
                        <span>{issue.heard ? `/${issue.heard}/` : '∅'}</span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {issue.words.map((wLabel, wIdx) => (
                          <button
                            key={wIdx}
                            type="button"
                            onClick={() => {
                              const idxFound = view.wordViews.findIndex((wv) => wv.word === wLabel);
                              setSelectedWordIdx(idxFound >= 0 ? idxFound : targetIdx >= 0 ? targetIdx : 0);
                            }}
                            className="px-1.5 py-0.5 rounded bg-white/80 hover:bg-white border border-current/30 text-[10px] font-black cursor-pointer"
                          >
                            {wLabel}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] font-semibold leading-snug opacity-95">{issue.tip}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ASR Transcription note */}
        {view.transcription && (
          <p className="text-xs font-semibold text-[#786F66] bg-[#FAF5EB] rounded-xl px-3 py-2 border border-[#E8DEC8]">
            <span className="font-extrabold text-[#3D352E]">
              {isDeepAi ? 'AI nghe bạn đọc là:' : 'Máy nghe bạn đọc là:'}
            </span>{' '}
            <span className="italic">"{view.transcription}"</span>
          </p>
        )}

        {/* Deep AI: Full IPA Sequence & Acoustic Contour Analysis */}
        {isDeepAi && view.hasVoice && hasAnyDeepChart && (
          <div className="border-t border-[#E8DEC8] pt-2.5 space-y-2">
            <button
              type="button"
              onClick={() => setShowAdvancedCharts((prev) => !prev)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#FAF5EB] hover:bg-[#f2ead9] border border-[#3D352E]/25 text-xs font-black text-[#2E2823] cursor-pointer transition-colors"
            >
              <span className="inline-flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#4D6B53]" />
                <span>Xem chi tiết dải âm cả câu &amp; biểu đồ giọng nói</span>
              </span>
              {showAdvancedCharts ? (
                <ChevronUp className="w-4 h-4 text-[#786F66]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#786F66]" />
              )}
            </button>

            {showAdvancedCharts && (
              <div className="space-y-2.5 pt-1">
                {/* Whole-sentence Expected vs Heard IPA comparison */}
                <div className="bg-white border border-[#E8DEC8] rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-extrabold text-[#3D352E]">
                    <AudioLines className="w-4 h-4 text-[#4D6B53]" />
                    <span>So sánh cách đọc chuẩn và âm AI nghe được cả câu</span>
                  </div>

                  <div className="space-y-1.5 font-mono">
                    <div className="flex flex-wrap items-center gap-1 bg-[#FAF5EB] rounded-lg px-2.5 py-1.5">
                      <span className="text-[10px] font-sans font-extrabold uppercase text-[#786F66] mr-1">
                        Âm chuẩn:
                      </span>
                      {view.wordViews.map((wv, idx) => (
                        <span key={idx} className="text-[#28532F] font-bold">
                          /{wv.expectedPhones.join('')}/
                        </span>
                      ))}
                    </div>

                    {view.heardPhones.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 bg-[#fffcf7] border border-[#E8DEC8] rounded-lg px-2.5 py-1.5">
                        <span className="text-[10px] font-sans font-extrabold uppercase text-[#786F66] mr-1">
                          AI nghe:
                        </span>
                        {view.heardPhones.map((hp, idx) => {
                          const conf = view.heardConfidence[idx];
                          const pct = Number.isFinite(conf) ? Math.round(conf * 100) : null;
                          const badgeTone =
                            pct === null
                              ? 'bg-[#FAF5EB] text-[#3D352E]'
                              : pct >= 80
                              ? 'bg-[#E9F6E6] text-[#28532F]'
                              : pct >= 55
                              ? 'bg-[#FFF3D6] text-[#8A4F0B]'
                              : 'bg-[#FDECE8] text-[#A8321F]';
                          return (
                            <span
                              key={idx}
                              className={`px-1 py-0.5 rounded font-bold text-[11px] ${badgeTone}`}
                              title={pct !== null ? `AI nghe rõ âm /${hp}/ khoảng ${pct}%` : undefined}
                            >
                              {hp}
                              {pct !== null && (
                                <sup className="text-[8px] opacity-70 ml-0.5">{pct}%</sup>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* DTW Phoneme Contour & Prosody Sparklines */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {hasDtwVectors && (
                    <div className="bg-white border border-[#E8DEC8] rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-[#3D352E]">
                        <span>Nhịp nối âm cả câu</span>
                        <span className="font-bold text-[10px] text-[#786F66]">
                          <span className="text-[#4D6B53]">--- Chuẩn</span> ·{' '}
                          <span className="text-[#D96B43]">— Bạn đọc</span>
                        </span>
                      </div>
                      {renderCompactSparklineSvg(view.expectedVector, view.transcribedVector)}
                    </div>
                  )}

                  {(hasProsodyF0 || hasProsodyEnergy) && (
                    <div className="bg-white border border-[#E8DEC8] rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-[#3D352E]">
                        <span>{hasProsodyF0 ? 'Biểu đồ lên xuống giọng (ngữ điệu)' : 'Độ lớn & lực hơi khi nói'}</span>
                      </div>
                      {renderCompactSparklineSvg(hasProsodyF0 ? view.prosody.f0 : view.prosody.energy)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Word Inspector Popup Modal (rendered in document.body portal, never below the card) */}
      {wordPopupModal}
    </>
  );
}

export default PronunciationResultCard;
