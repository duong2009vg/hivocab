// src/components/exercises/ChapterStudyView.jsx
// Giao diện Học Lý thuyết & Luyện tập Thực chiến cho từng Chuyên đề THPT
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Check,
  Flame,
  LayoutGrid
} from 'lucide-react';
import { getExerciseTheory, getExerciseQuestions, saveExerciseScore } from '../../services/exercisesService.js';

export function ChapterStudyView({ exercise, onBack }) {
  const [activeTab, setActiveTab] = useState('theory'); // 'theory' | 'practice'
  const [theoryText, setTheoryText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Practice state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionId]: { selected, isCorrect } }
  const [showPalette, setShowPalette] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Load theory and questions
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [th, qs] = await Promise.all([
          getExerciseTheory(exercise.id),
          getExerciseQuestions(exercise.id),
        ]);
        if (!cancelled) {
          setTheoryText(th || exercise.description || '');
          setQuestions(qs || []);
        }
      } catch (err) {
        console.error('Error loading chapter:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [exercise]);

  // Current question
  const currentQ = questions[currentIndex] || null;

  // Options parsing helper
  const parsedOptions = useMemo(() => {
    if (!currentQ || !Array.isArray(currentQ.options)) return [];
    return currentQ.options.map((opt, idx) => {
      const letter = ['A', 'B', 'C', 'D'][idx] || String.fromCharCode(65 + idx);
      let text = String(opt || '');
      // Strip leading 'A. ', 'A: ', etc.
      text = text.replace(/^[A-D][.:)]\s*/i, '').trim();
      return { letter, text, raw: opt };
    });
  }, [currentQ]);

  // Handle choice selection
  const handleSelectOption = useCallback((letter) => {
    if (!currentQ) return;
    const qId = currentQ.id;
    // If already answered, do not allow changing
    if (userAnswers[qId]) return;

    const correctLetter = (currentQ.answer || '').trim().toUpperCase();
    const isCorrect = letter === correctLetter;

    const nextAnswers = {
      ...userAnswers,
      [qId]: { selected: letter, isCorrect },
    };
    setUserAnswers(nextAnswers);

    // Check if all answered
    const answeredCount = Object.keys(nextAnswers).length;
    if (answeredCount === questions.length && questions.length > 0) {
      const correctCount = Object.values(nextAnswers).filter(a => a.isCorrect).length;
      saveExerciseScore(exercise.id, correctCount, questions.length);
    }
  }, [currentQ, userAnswers, questions, exercise.id]);

  // Score metrics
  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = Object.values(userAnswers).filter(a => a.isCorrect).length;
  const scorePercent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  // Render formatted theory text cleanly
  const renderTheoryContent = (text) => {
    if (!text) {
      return (
        <div className="py-12 text-center text-[#786F66]">
          Chưa có nội dung lý thuyết cho bài học này.
        </div>
      );
    }

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-3" />;

      // Header 1 / Title
      if (trimmed.startsWith('Dạng câu hỏi') || trimmed.startsWith('CHUYÊN ĐỀ') || trimmed.startsWith('CHIẾN THUẬT')) {
        return (
          <h2 key={idx} className="text-lg sm:text-xl font-heading font-black text-[#302A24] mt-5 mb-2 pb-1 border-b-2 border-[#3D352E]">
            {trimmed}
          </h2>
        );
      }

      // Subheader / Section
      if (/^\d+\.\d+/.test(trimmed)) {
        return (
          <h3 key={idx} className="text-base sm:text-lg font-heading font-extrabold text-[#557A46] mt-4 mb-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#557A46] shrink-0" />
            {trimmed}
          </h3>
        );
      }

      // Examples / Highlights
      if (trimmed.startsWith('🔶') || trimmed.startsWith('Ví dụ') || trimmed.startsWith('Example')) {
        return (
          <div key={idx} className="mt-3 p-3 rounded-2xl bg-[#FEF3C7] border-2 border-[#3D352E] font-bold text-xs sm:text-sm text-[#302A24]">
            {trimmed}
          </div>
        );
      }

      // Notes / Rules Callout
      if (trimmed.startsWith('🔵') || trimmed.startsWith('Notes:')) {
        return (
          <div key={idx} className="mt-2.5 p-3 rounded-2xl bg-[#EAF5E4] border-2 border-[#3D352E] font-medium text-xs sm:text-sm text-[#302A24]">
            {trimmed}
          </div>
        );
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs sm:text-sm text-[#4A4036] font-medium leading-relaxed my-0.5">
            {trimmed.replace(/^[-•]\s*/, '')}
          </li>
        );
      }

      // Numbered rule: e.g. "1. Sau to be..."
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <div key={idx} className="py-1 px-2.5 my-1 rounded-xl bg-white border border-[#3D352E]/30 text-xs sm:text-sm font-semibold text-[#302A24]">
            {trimmed}
          </div>
        );
      }

      // Normal text
      return (
        <p key={idx} className="text-xs sm:text-sm text-[#4A4036] font-medium leading-relaxed my-1">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-24 px-3 sm:px-6 pt-3">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b-2 border-[#3D352E]">
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-2 rounded-2xl bg-[#FFFDF9] hover:bg-[#FAF5EB] text-[#302A24] font-black text-xs border-2 border-[#3D352E] shadow-[2px_3px_0px_#3D352E] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Danh sách chuyên đề</span>
        </button>

        <span className="px-3 py-1 rounded-full bg-[#EAF5E4] text-[#557A46] font-black text-xs border border-[#3D352E] truncate max-w-xs">
          {exercise.topic_group || 'Chuyên đề 9+ THPT'}
        </span>
      </div>

      {/* Chapter Title Banner */}
      <div className="rounded-3xl bg-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] p-4 sm:p-6 mb-5">
        <h1 className="text-lg sm:text-2xl font-heading font-black text-[#302A24] leading-snug">
          {exercise.title}
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-[#786F66] mt-1 flex items-center gap-2">
          <span>{questions.length} câu hỏi luyện tập</span>
          <span>•</span>
          <span className="text-[#557A46] font-black">Học lý thuyết trước khi làm bài</span>
        </p>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-dashed border-[#DECDBB]">
          <button
            type="button"
            onClick={() => setActiveTab('theory')}
            className={`px-4 py-2 rounded-2xl font-black text-xs sm:text-sm border-2 border-[#3D352E] cursor-pointer flex items-center gap-2 transition-all ${
              activeTab === 'theory'
                ? 'bg-[#557A46] text-white shadow-[2px_3px_0px_#3D352E]'
                : 'bg-white text-[#786F66] hover:bg-[#FAF5EB]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Phần 1: Lý thuyết & Chiến thuật</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`px-4 py-2 rounded-2xl font-black text-xs sm:text-sm border-2 border-[#3D352E] cursor-pointer flex items-center gap-2 transition-all ${
              activeTab === 'practice'
                ? 'bg-[#D97706] text-white shadow-[2px_3px_0px_#3D352E]'
                : 'bg-white text-[#786F66] hover:bg-[#FAF5EB]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Phần 2: Luyện tập thực chiến ({questions.length} câu)</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#557A46] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[#786F66]">Đang tải nội dung chuyên đề...</p>
        </div>
      ) : activeTab === 'theory' ? (
        /* ======================== TAB 1: LÝ THUYẾT ======================== */
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] p-5 sm:p-8">
            <div className="prose max-w-none text-[#302A24]">
              {renderTheoryContent(theoryText)}
            </div>

            {/* Bottom Callout to switch to practice */}
            <div className="mt-8 pt-6 border-t-2 border-dashed border-[#DECDBB] text-center">
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#EAF5E4] border-2 border-[#3D352E] mb-4">
                <p className="font-heading font-black text-sm text-[#302A24]">
                  Bạn đã nắm vững toàn bộ kiến thức lý thuyết & ví dụ của chuyên đề này chưa?
                </p>
                <p className="text-xs text-[#557A46] font-bold mt-1">
                  Hãy bắt tay vào luyện tập ngay {questions.length} câu hỏi thực chiến để kiểm tra mức độ hiểu bài!
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('practice');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="py-3 px-8 rounded-2xl bg-[#D97706] hover:bg-[#B45309] text-white font-heading font-black text-sm sm:text-base border-[3px] border-[#3D352E] shadow-[3px_4px_0px_#3D352E] cursor-pointer active:scale-95 transition-all inline-flex items-center gap-2"
              >
                <span>Bắt đầu làm bài tập ngay ({questions.length} câu)</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ======================== TAB 2: LUYỆN TẬP THỰC CHIẾN ======================== */
        <div className="space-y-4">
          {/* Top Progress & Score Bar */}
          <div className="rounded-2xl bg-[#FFFDF9] border-2 border-[#3D352E] shadow-[2px_3px_0px_#3D352E] p-3 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-black text-[#302A24]">
                Câu {currentIndex + 1} / {questions.length}
              </span>
              <div className="hidden sm:block w-32 h-2.5 rounded-full bg-[#EFE8D6] border border-[#3D352E] overflow-hidden">
                <div
                  className="h-full bg-[#557A46] transition-all"
                  style={{ width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-xl bg-[#EAF5E4] text-[#557A46] font-black text-xs border border-[#3D352E]">
                Đúng: {correctCount}/{answeredCount}
              </div>
              <button
                type="button"
                onClick={() => setShowPalette(!showPalette)}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#FAF5EB] text-[#302A24] font-black text-xs border border-[#3D352E] cursor-pointer flex items-center gap-1"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Bảng câu ({questions.length})</span>
              </button>
            </div>
          </div>

          {/* Question Palette Drawer */}
          {showPalette && (
            <div className="rounded-2xl bg-[#FFFDF9] border-2 border-[#3D352E] shadow-[2px_3px_0px_#3D352E] p-3 sm:p-4 animate-in fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-[#302A24]">Bảng câu hỏi nhanh:</span>
                <span className="text-[11px] text-[#786F66] font-bold">Xanh: Đúng | Đỏ: Sai | Xám: Chưa làm</span>
              </div>
              <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-15 gap-1.5 max-h-48 overflow-y-auto p-1">
                {questions.map((q, idx) => {
                  const ans = userAnswers[q.id];
                  const isCurrent = idx === currentIndex;
                  let bg = 'bg-white text-[#302A24] border-[#3D352E]';
                  if (ans) {
                    bg = ans.isCorrect
                      ? 'bg-[#557A46] text-white border-[#3D352E]'
                      : 'bg-rose-500 text-white border-[#3D352E]';
                  }
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowPalette(false);
                      }}
                      className={`h-8 rounded-lg font-black text-xs border cursor-pointer flex items-center justify-center transition-all ${bg} ${
                        isCurrent ? 'ring-2 ring-[#D97706] scale-105' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Question Card */}
          {currentQ && (
            <div className="rounded-3xl bg-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] p-5 sm:p-8 space-y-5">
              {/* Prompt */}
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#302A24] text-[11px] font-black border border-[#3D352E] mb-2">
                  Câu hỏi {currentIndex + 1}
                </span>
                <p className="text-base sm:text-lg font-heading font-extrabold text-[#302A24] leading-relaxed">
                  {currentQ.prompt}
                </p>
              </div>

              {/* 4 Options */}
              <div className="space-y-2.5">
                {parsedOptions.map(({ letter, text, raw }) => {
                  const ans = userAnswers[currentQ.id];
                  const isSelected = ans?.selected === letter;
                  const isCorrect = (currentQ.answer || '').trim().toUpperCase() === letter;

                  let btnStyle = 'bg-white hover:bg-[#FAF5EB] text-[#302A24] border-[#3D352E]';
                  if (ans) {
                    if (isCorrect) {
                      btnStyle = 'bg-[#EAF5E4] border-[#557A46] text-[#2F5224] ring-2 ring-[#557A46] font-black';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500 font-black';
                    } else {
                      btnStyle = 'bg-[#F5F2EB] text-[#9C8F85] border-[#D1C7BA] opacity-60';
                    }
                  }

                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={Boolean(ans)}
                      onClick={() => handleSelectOption(letter)}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl border-2 text-left cursor-pointer transition-all flex items-start gap-3 ${btnStyle} ${
                        !ans ? 'active:scale-[0.99] shadow-[2px_2px_0px_#3D352E]' : ''
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border border-[#3D352E] ${
                        ans && isCorrect ? 'bg-[#557A46] text-white' : ans && isSelected ? 'bg-rose-500 text-white' : 'bg-[#FEF3C7] text-[#302A24]'
                      }`}>
                        {letter}
                      </span>
                      <span className="text-sm sm:text-base font-semibold leading-snug pt-0.5">
                        {text || raw}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation Card (shows immediately after answering) */}
              {userAnswers[currentQ.id] && (
                <div className={`p-4 sm:p-5 rounded-2xl border-2 animate-in fade-in space-y-2 ${
                  userAnswers[currentQ.id].isCorrect
                    ? 'bg-[#EAF5E4] border-[#557A46]'
                    : 'bg-amber-50 border-amber-500'
                }`}>
                  <div className="flex items-center gap-2">
                    {userAnswers[currentQ.id].isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-[#557A46] shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                    <span className="font-heading font-black text-sm text-[#302A24]">
                      {userAnswers[currentQ.id].isCorrect
                        ? 'Chính xác! Lời giải chi tiết:'
                        : `Chưa chính xác! Đáp án đúng là: ${currentQ.answer}`}
                    </span>
                  </div>

                  {currentQ.hint && (
                    <p className="text-xs sm:text-sm font-medium text-[#4A4036] leading-relaxed pt-1 border-t border-[#3D352E]/10">
                      {currentQ.hint}
                    </p>
                  )}
                </div>
              )}

              {/* Prev / Next controls */}
              <div className="flex items-center justify-between pt-3 border-t border-dashed border-[#DECDBB]">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-[#FAF5EB] text-[#302A24] font-black text-xs border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>

                <div className="text-xs font-bold text-[#786F66]">
                  {answeredCount} / {questions.length} đã trả lời
                </div>

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="px-4 py-2 rounded-xl bg-[#557A46] hover:bg-[#48683B] text-white font-black text-xs border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <span>Câu tiếp theo</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsFinished(true)}
                    className="px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-black text-xs border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <span>Hoàn thành bài tập</span>
                    <Award className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Finished Summary Modal / Card */}
          {isFinished && (
            <div className="rounded-3xl bg-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[4px_6px_0px_#3D352E] p-6 sm:p-8 text-center space-y-4">
              <Award className="w-14 h-14 text-[#D97706] mx-auto" />
              <h3 className="font-heading font-black text-xl text-[#302A24]">
                Chúc mừng bạn đã hoàn thành bài tập!
              </h3>
              <p className="text-sm font-semibold text-[#786F66]">
                Bạn đã hoàn thành toàn bộ {questions.length} câu hỏi của chuyên đề này.
              </p>

              <div className="inline-flex items-center gap-6 p-4 rounded-2xl bg-[#EAF5E4] border-2 border-[#3D352E]">
                <div>
                  <div className="text-2xl font-black text-[#557A46]">{correctCount} / {questions.length}</div>
                  <div className="text-xs font-bold text-[#786F66]">Số câu đúng</div>
                </div>
                <div className="h-8 w-px bg-[#3D352E]/20" />
                <div>
                  <div className="text-2xl font-black text-[#D97706]">{scorePercent}%</div>
                  <div className="text-xs font-bold text-[#786F66]">Độ chính xác</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setUserAnswers({});
                    setCurrentIndex(0);
                    setIsFinished(false);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#302A24] font-black text-xs border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Làm lại từ đầu</span>
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="px-5 py-2.5 rounded-2xl bg-[#557A46] hover:bg-[#48683B] text-white font-black text-xs border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer"
                >
                  Trở về danh sách chuyên đề
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default ChapterStudyView;
