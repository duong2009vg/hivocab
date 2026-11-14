// src/components/exercises/ChapterStudyView.jsx
// Giao diện Học Lý thuyết Chuyên đề 9+ THPT & Điều hướng bắt buộc sang Phòng Luyện tập THPT để làm bài
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { TheoryContentRenderer } from './TheoryContentRenderer.jsx';
import { getExerciseTheoryData, getExerciseQuestions } from '../../services/exercisesService.js';
import { useRoute } from '../../router/RouteContext.jsx';

export function ChapterStudyView({ exercise, onBack }) {
  const { navigateTo } = useRoute();
  const [theoryData, setTheoryData] = useState({ theory_and_strategy: '', examples: [] });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Điều hướng bắt buộc sang Phòng luyện đề THPT để làm bài
  const handleStartPractice = useCallback(() => {
    if (!navigateTo) return;
    sessionStorage.setItem('hv_roadmap_open_book', 'book2');
    sessionStorage.setItem('hv_chuyende_active_id', exercise.id);
    window._thptStartConfig = {
      examId: exercise.id,
      exerciseId: exercise.id,
      isExercise: true,
      exerciseTitle: exercise.title,
      topicGroup: exercise.topic_group,
      minutes: 0,
    };
    navigateTo('thpt-room', true);
  }, [exercise, navigateTo]);

  // Nạp dữ liệu lý thuyết chuẩn DOCX và danh sách câu hỏi (lấy số lượng câu)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [thData, qs] = await Promise.all([
          getExerciseTheoryData(exercise.id),
          getExerciseQuestions(exercise.id),
        ]);
        if (!cancelled) {
          setTheoryData({
            theory_and_strategy: thData?.theory_and_strategy || exercise.description || '',
            examples: Array.isArray(thData?.examples) ? thData.examples : [],
          });
          setQuestions(qs || []);
        }
      } catch (err) {
        console.error('Error loading chapter:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [exercise]);

  const totalCount = questions.length || exercise.total_questions || 0;

  return (
    <div className="w-full max-w-6xl mx-auto pb-20 px-3 sm:px-6 pt-3">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b-2 border-[#3D352E]">
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-2 rounded-2xl bg-[#FFFDF9] hover:bg-[#FAF5EB] text-[#302A24] font-black text-xs border-2 border-[#3D352E] shadow-[2px_3px_0px_#3D352E] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Lộ trình 29 chuyên đề</span>
        </button>

        <span className="px-3 py-1 rounded-full bg-[#FAF5EB] text-[#3D352E] font-bold text-xs border border-[#C9B9A6] truncate max-w-xs">
          {exercise.topic_group || 'Chuyên đề 9+ THPT'}
        </span>
      </div>

      {/* Chapter Title Banner */}
      <div className="rounded-3xl bg-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] p-4 sm:p-6 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg sm:text-2xl font-heading font-black text-[#302A24] leading-snug">
            {exercise.title}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#786F66]">
            Lý thuyết trọng tâm & ví dụ luyện tập thử ({totalCount} câu hỏi thực chiến tại trang Luyện tập THPT)
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartPractice}
          className="px-5 py-2.5 rounded-2xl bg-[#557A46] hover:bg-[#486b3c] text-white font-black text-xs sm:text-sm border-2 border-[#3D352E] shadow-[2px_3px_0px_#3D352E] cursor-pointer shrink-0 active:scale-95 transition-all inline-flex items-center justify-center gap-2"
        >
          <span>Vào trang Luyện tập THPT ({totalCount} câu)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#557A46] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[#786F66]">Đang tải nội dung lý thuyết chuyên đề...</p>
        </div>
      ) : (
        <TheoryContentRenderer
          theoryText={theoryData.theory_and_strategy}
          theoryExamples={theoryData.examples}
          chapterTitle={exercise.title}
          onOpenExamRoom={handleStartPractice}
          questionCount={totalCount}
        />
      )}
    </div>
  );
}

export default ChapterStudyView;
