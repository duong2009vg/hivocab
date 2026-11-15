// src/components/studio/DictationTab.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Volume2,
  CheckCircle2,
  RotateCcw,
  Eye,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  expandDictationLesson,
  compareDictation,
  maskExpectedWord,
  getSentenceProgressKey,
} from '../../utils/studioCore.js';
import {
  playStudioTts,
  loadStudioProgress,
  saveDictationScore,
  savePronunciationScore,
} from '../../services/studioService.js';
import StudioVoiceRecorder from './StudioVoiceRecorder.jsx';

export function DictationTab({ catalog, voice, onOpenSetup }) {
  const rawLessons = useMemo(() => (Array.isArray(catalog?.lessons) ? catalog.lessons : []), [catalog]);
  const levels = useMemo(() => (Array.isArray(catalog?.levels) ? catalog.levels : []), [catalog]);

  const [levelFilter, setLevelFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [typedText, setTypedText] = useState('');
  const [report, setReport] = useState(null);
  const [hintShown, setHintShown] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [assisted, setAssisted] = useState(false);
  const [ttsEngineLabel, setTtsEngineLabel] = useState('');
  const [progress, setProgress] = useState(() => loadStudioProgress());
  const [mobileLessonsOpen, setMobileLessonsOpen] = useState(false);

  const expandedLessons = useMemo(
    () => rawLessons.map((lesson) => expandDictationLesson(lesson)),
    [rawLessons]
  );

  const filteredLessons = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return expandedLessons.filter((l) => {
      if (levelFilter !== 'all' && l.level !== levelFilter) return false;
      if (
        q &&
        !String(l.title || '').toLowerCase().includes(q) &&
        !String(l.topic || '').toLowerCase().includes(q) &&
        !String(l.description || '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [expandedLessons, levelFilter, searchTerm]);

  useEffect(() => {
    if (!selectedLessonId && expandedLessons.length > 0) {
      setSelectedLessonId(expandedLessons[0].id);
    }
  }, [expandedLessons, selectedLessonId]);

  const activeLesson = useMemo(
    () =>
      expandedLessons.find((l) => l.id === selectedLessonId) ||
      filteredLessons[0] ||
      expandedLessons[0] ||
      null,
    [expandedLessons, filteredLessons, selectedLessonId]
  );

  const lines = useMemo(() => (Array.isArray(activeLesson?.lines) ? activeLesson.lines : []), [activeLesson]);
  const currentLine = lines[sentenceIndex] || null;

  const resetSentenceState = () => {
    setTypedText('');
    setReport(null);
    setHintShown(false);
    setRevealed(false);
    setAssisted(false);
  };

  const selectLesson = (lessonId) => {
    setSelectedLessonId(lessonId);
    setSentenceIndex(0);
    resetSentenceState();
    setMobileLessonsOpen(false);
  };

  const goToSentence = (nextIdx) => {
    if (nextIdx < 0 || nextIdx >= lines.length) return;
    setSentenceIndex(nextIdx);
    resetSentenceState();
  };

  const handlePlaySentence = async (customSpeed = speed) => {
    if (!currentLine?.text) return;
    const res = await playStudioTts({
      text: currentLine.text,
      voice,
      speed: customSpeed,
    });
    setTtsEngineLabel(res?.engine === 'kokoro' ? 'Kokoro AI' : 'HiVocab TTS');
  };

  const handleCheck = () => {
    if (!currentLine?.text || !typedText.trim()) return;
    const res = compareDictation(currentLine.text, typedText);
    setReport(res);
    if (!assisted && !revealed) {
      const key = getSentenceProgressKey(activeLesson, sentenceIndex);
      const updated = saveDictationScore(activeLesson.id, key, res.score);
      setProgress(updated);
    }
  };

  const lessonCompletedCount = (lesson) => {
    const scores = progress.dictation?.[lesson.id] || {};
    return Object.values(scores).filter((v) => Number(v) >= 80).length;
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Mobile Compact Current-Lesson Bar */}
      {activeLesson && (
        <div className="lg:hidden bg-[#fffcf7] border-2 border-[#3D352E] rounded-2xl p-3 shadow-[2px_2px_0px_#3D352E] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-[#4D6B53]">
              <span className="px-2 py-0.5 rounded-full bg-[#F4E3B4] text-[#3D352E] border border-[#3D352E]">
                {activeLesson.level}
              </span>
              <span className="truncate">{activeLesson.topic}</span>
            </div>
            <div className="text-sm font-black text-[#2E2823] truncate mt-0.5">{activeLesson.title}</div>
          </div>
          <button
            type="button"
            onClick={() => setMobileLessonsOpen((v) => !v)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#4D6B53] text-white text-xs font-black border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] shrink-0 cursor-pointer"
          >
            <span>{mobileLessonsOpen ? 'Đóng' : `Đổi bài học (${expandedLessons.length} bài)`}</span>
            {mobileLessonsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
        {/* Left Sidebar: 139 Lessons Catalog (Collapsible on mobile) */}
        <div
          className={`lg:col-span-4 bg-[#fffcf7] border-2 border-[#3D352E] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-[2.5px_2.5px_0px_#3D352E] space-y-3 ${
            mobileLessonsOpen ? 'block' : 'hidden lg:block'
          }`}
        >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-black text-[#2E2823]">
            Kho bài Dictation ({filteredLessons.length}/{expandedLessons.length})
          </h3>
        </div>

        {/* Search & Level Filter */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#786F66] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm chủ đề, bài hội thoại..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border-2 border-[#3D352E] text-xs font-bold focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {levels
            .filter((lvl) => lvl.id !== 'C2')
            .map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setLevelFilter(lvl.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border-2 cursor-pointer ${
                  levelFilter === lvl.id
                    ? 'bg-[#4D6B53] text-white border-[#3D352E]'
                    : 'bg-white text-[#554D42] border-[#E8DEC8] hover:border-[#3D352E]'
                }`}
              >
                {lvl.id === 'all' ? 'Tất cả' : lvl.id}
              </button>
            ))}
        </div>

        {/* Lesson List */}
        <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1">
          {filteredLessons.map((lesson) => {
            const isSelected = activeLesson?.id === lesson.id;
            const done = lessonCompletedCount(lesson);
            const total = lesson.lines.length;
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => selectLesson(lesson.id)}
                className={`w-full text-left rounded-2xl p-3 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#EEF5EC] border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                    : 'bg-white border-[#E8DEC8] hover:border-[#3D352E]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#F4E3B4] text-[#3D352E] border border-[#3D352E]">
                    {lesson.level}
                  </span>
                  <span className="text-[11px] font-extrabold text-[#4D6B53]">
                    {done}/{total} câu
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-black text-[#2E2823]">{lesson.title}</div>
                <div className="text-[11px] font-semibold text-[#786F66] truncate">
                  {lesson.topic} · {lesson.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Main Area: Active Dictation Exercise + Speaking */}
      <div className="lg:col-span-8 space-y-4">
        {activeLesson && currentLine && (
          <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-3xl p-5 shadow-[3px_3px_0px_#3D352E] space-y-4">
            {/* Header & Sentence Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8DEC8]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#F4E3B4] border border-[#3D352E]">
                    {activeLesson.level}
                  </span>
                  <span className="text-xs font-extrabold text-[#786F66]">
                    Câu {sentenceIndex + 1} / {lines.length}
                  </span>
                  {ttsEngineLabel && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#EEF5EC] text-[#4D6B53] border border-[#4D6B53]/30">
                      {ttsEngineLabel}
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[#2E2823] mt-1">
                  {activeLesson.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={sentenceIndex <= 0}
                  onClick={() => goToSentence(sentenceIndex - 1)}
                  className="p-2 rounded-xl bg-white border-2 border-[#3D352E] disabled:opacity-40 cursor-pointer"
                  aria-label="Câu trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={sentenceIndex >= lines.length - 1}
                  onClick={() => goToSentence(sentenceIndex + 1)}
                  className="p-2 rounded-xl bg-white border-2 border-[#3D352E] disabled:opacity-40 cursor-pointer"
                  aria-label="Câu sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handlePlaySentence(speed)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#4D6B53] hover:bg-[#3f5844] text-white text-xs sm:text-sm font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Nghe câu ({currentLine.speaker})</span>
              </button>

              <button
                type="button"
                onClick={() => handlePlaySentence(0.75)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#F4E3B4] hover:bg-[#edd79d] text-[#3D352E] text-xs font-black border-2 border-[#3D352E] cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Nghe chậm 0.75x</span>
              </button>

              <div className="flex items-center gap-1 ml-auto bg-[#FAF5EB] p-1 rounded-xl border border-[#3D352E]/30">
                {[0.75, 1.0, 1.15].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer ${
                      speed === s ? 'bg-[#2E2823] text-white' : 'text-[#554D42]'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Dictation Input */}
            <div className="space-y-2">
              <textarea
                rows={3}
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCheck();
                  }
                }}
                placeholder="Nghe câu mẫu rồi gõ chính tả tiếng Anh tại đây (Nhấn Enter để kiểm tra)..."
                className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-[#3D352E] text-sm sm:text-base font-bold text-[#2E2823] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#4D6B53]/40"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={!typedText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D96B43] hover:bg-[#C85A3F] text-white text-xs sm:text-sm font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kiểm tra</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHintShown(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[#3D352E] text-xs font-bold border-2 border-[#3D352E] cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Gợi ý</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRevealed((r) => !r);
                    setAssisted(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[#3D352E] text-xs font-bold border-2 border-[#3D352E] cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>{revealed ? 'Ẩn đáp án' : 'Mở đáp án'}</span>
                </button>

                <button
                  type="button"
                  onClick={resetSentenceState}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[#786F66] text-xs font-bold border-2 border-[#3D352E] cursor-pointer ml-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Viết lại</span>
                </button>
              </div>
            </div>

            {hintShown && (
              <div className="text-xs font-bold text-[#8C5311] bg-[#FFF3D1] border border-[#D9822B]/30 rounded-xl px-3.5 py-2">
                Gợi ý từ đầu: <span className="font-black">{currentLine.text.split(/\s+/)[0]}…</span>{' '}
                (Tổng {currentLine.text.split(/\s+/).length} từ)
              </div>
            )}

            {/* Revealed Transcript */}
            {revealed && (
              <div className="bg-[#EEF5EC] border-2 border-[#4D6B53] rounded-2xl p-3.5 space-y-1">
                <div className="text-xs font-black text-[#4D6B53] uppercase">Đáp án chuẩn</div>
                <p className="text-sm sm:text-base font-black text-[#2E2823]">{currentLine.text}</p>
                {currentLine.vi && (
                  <p className="text-xs font-semibold text-[#554D42]">{currentLine.vi}</p>
                )}
              </div>
            )}

            {/* Dictation Word Diff Feedback */}
            {report && (
              <div className="bg-[#FAF5EB] border-2 border-[#3D352E] rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-black text-[#2E2823]">
                    {report.correct
                      ? 'Tuyệt vời! Bạn viết đúng 100%!'
                      : `Điểm chính tả: ${report.score}/100`}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-extrabold">
                    <span className="px-2 py-0.5 rounded-full bg-[#E8F4E5] text-[#355A3B]">
                      Đúng: {report.counts.correct}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FDECE8] text-[#B53D2A]">
                      Sai: {report.counts.wrong}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FFF3D1] text-[#8C5311]">
                      Thiếu: {report.counts.missing}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                      Thừa: {report.counts.extra}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {report.alignment.map((seg, i) => {
                    if (seg.kind === 'correct') {
                      return (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-[#E8F4E5] text-[#355A3B] text-xs font-bold border border-[#4D6B53]/30"
                        >
                          {seg.expected}
                        </span>
                      );
                    }
                    if (seg.kind === 'extra') {
                      return (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-stone-200 text-stone-600 text-xs font-bold line-through"
                        >
                          {seg.actual}
                        </span>
                      );
                    }
                    const shownText =
                      revealed || report.correct ? seg.expected : maskExpectedWord(seg.expected);
                    return (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
                          seg.kind === 'wrong'
                            ? 'bg-[#FDECE8] text-[#B53D2A] border-[#D96B43]/40'
                            : 'bg-[#FFF3D1] text-[#8C5311] border-[#D9822B]/40'
                        }`}
                      >
                        {shownText}
                      </span>
                    );
                  })}
                </div>

                {report.correct && currentLine.vi && !revealed && (
                  <p className="text-xs font-semibold text-[#4D6B53]">Nghĩa: {currentLine.vi}</p>
                )}
              </div>
            )}

            {/* Integrated Speaking Practice Step */}
            <div className="pt-2 border-t border-[#E8DEC8] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#2E2823] uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-[#D96B43]" />
                <span>Bước 2 · Luyện đọc & Chấm phát âm câu này</span>
              </div>
              <StudioVoiceRecorder
                expectedText={currentLine.text}
                voice={voice}
                onOpenSetup={onOpenSetup}
                onScored={(data) => {
                  const key = `${activeLesson.id}:${getSentenceProgressKey(activeLesson, sentenceIndex)}`;
                  savePronunciationScore(key, Math.round(data.score));
                }}
              />
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default DictationTab;
