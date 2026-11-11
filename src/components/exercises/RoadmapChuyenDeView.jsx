// src/components/exercises/RoadmapChuyenDeView.jsx
// Quyển 2: Chinh phục 9+ THPT Quốc Gia (29 Chuyên đề học tập kèm lý thuyết & 1.004 câu hỏi)
import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  X,
  Sparkles,
  CheckCircle2,
  Award,
  ChevronRight,
  GraduationCap,
  Layers,
  FileText
} from 'lucide-react';
import { getExercises, getExerciseScores } from '../../services/exercisesService.js';
import ChapterStudyView from './ChapterStudyView.jsx';

const TOPIC_GROUPS = [
  { id: 'all', label: 'Tất cả (29 bài)' },
  { id: 'g1', label: 'Chuyên đề I: Đục lỗ 6 câu (11 bài)', match: 'Chuyên đề I' },
  { id: 'g2', label: 'Chuyên đề II: Đục lỗ 5 câu (5 bài)', match: 'Chuyên đề II' },
  { id: 'g3', label: 'Chuyên đề III: Sắp xếp (4 bài)', match: 'Chuyên đề III' },
  { id: 'g4', label: 'Chuyên đề IV: Đọc hiểu 8 kỹ năng (9 bài)', match: 'Chuyên đề IV' },
];

export function RoadmapChuyenDeView() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [scores, setScores] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const list = await getExercises();
        if (!cancelled) {
          setExercises(list);
          setScores(getExerciseScores());
        }
      } catch (err) {
        console.error('Error loading exercises:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    let list = exercises || [];
    if (activeGroup !== 'all') {
      const g = TOPIC_GROUPS.find(tg => tg.id === activeGroup);
      if (g && g.match) {
        list = list.filter(e => (e.topic_group || '').includes(g.match));
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.topic_group || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [exercises, activeGroup, searchQuery]);

  // If a chapter is selected, open the ChapterStudyView
  if (selectedExercise) {
    return (
      <ChapterStudyView
        exercise={selectedExercise}
        onBack={() => {
          setSelectedExercise(null);
          setScores(getExerciseScores());
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Introduction Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FFFDF9] via-[#FAF5EB] to-[#F5ECE0] border-[3px] border-[#3D352E] shadow-[4px_6px_0px_#3D352E] p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EAF5E4] text-[#557A46] text-xs font-black border border-[#3D352E]">
              <Sparkles className="w-3.5 h-3.5 text-[#557A46]" />
              <span>QUYỂN 2 • HỌC THEO CHUYÊN ĐỀ CỐT LÕI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-black text-[#302A24]">
              Chinh Phục 9+ THPT Quốc Gia
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#786F66] max-w-2xl leading-relaxed">
              Trọn bộ 29 chuyên đề học tập & chiến thuật làm bài thực chiến với 1.004 câu hỏi có giải thích chi tiết.
              Mỗi chuyên đề được thiết kế chuẩn sư phạm: <strong className="text-[#302A24]">Học lý thuyết & chiến thuật trước, sau đó luyện tập thực chiến</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:flex-col sm:items-end shrink-0">
            <span className="px-3.5 py-1.5 rounded-2xl bg-[#557A46] text-white font-black text-xs sm:text-sm border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
              29 Chuyên đề
            </span>
            <span className="px-3.5 py-1.5 rounded-2xl bg-[#D97706] text-white font-black text-xs sm:text-sm border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
              1.004 Câu hỏi
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 pt-3 border-t border-dashed border-[#DECDBB]">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên chuyên đề (vd: Từ loại, OSASCOMP, Mệnh đề quan hệ, Đọc hiểu...)"
              className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm bg-white rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] focus:ring-0 focus:outline-none placeholder:text-[#9C8F85] font-semibold text-[#302A24]"
            />
            <Search className="w-4 h-4 text-[#9C8F85] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#786F66] hover:text-[#302A24]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Group Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3">
          {TOPIC_GROUPS.map((group) => {
            const isActive = activeGroup === group.id;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroup(group.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-black border-2 border-[#3D352E] whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#3D352E] text-white shadow-[2px_2px_0px_#3D352E]'
                    : 'bg-white text-[#4A4036] hover:bg-[#FAF5EB]'
                }`}
              >
                {group.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chapter Cards List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#557A46] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[#786F66]">Đang tải 29 chuyên đề học tập...</p>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-12 px-6 rounded-3xl bg-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E]">
          <p className="font-heading font-black text-base text-[#302A24]">
            Không tìm thấy chuyên đề nào phù hợp
          </p>
          <p className="text-xs font-semibold text-[#786F66] mt-1">
            Bạn hãy thử tìm với từ khóa khác nhé!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExercises.map((ex, idx) => {
            const scoreData = scores[ex.id];
            // Extract short section tag like "[1.1]"
            const tagMatch = ex.title.match(/^\[([^\]]+)\]/);
            const tag = tagMatch ? tagMatch[1] : `${idx + 1}`;
            const cleanTitle = ex.title.replace(/^\[[^\]]+\]\s*/, '');

            return (
              <div
                key={ex.id}
                onClick={() => setSelectedExercise(ex)}
                className="rounded-3xl bg-[#FFFDF9] hover:bg-white border-[3px] border-[#3D352E] shadow-[3px_4px_0px_#3D352E] p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:-translate-y-1 transition-all group"
              >
                <div>
                  {/* Card Header Tag & Group */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-xl bg-[#FEF3C7] border border-[#3D352E] text-xs font-black text-[#302A24]">
                      Mục {tag}
                    </span>
                    <span className="text-[11px] font-bold text-[#786F66] truncate max-w-[200px]">
                      {ex.topic_group || 'Chuyên đề THPT'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-heading font-black text-sm sm:text-base text-[#302A24] group-hover:text-[#557A46] transition-colors leading-snug">
                    {cleanTitle}
                  </h3>

                  {/* Description preview */}
                  <p className="text-xs font-semibold text-[#786F66] mt-2 line-clamp-2 leading-relaxed">
                    {ex.description ? ex.description.replace(/\n+/g, ' • ').substring(0, 140) + '...' : 'Lý thuyết trọng tâm & bộ câu hỏi trắc nghiệm rèn luyện kỹ năng.'}
                  </p>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-dashed border-[#DECDBB] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#557A46] bg-[#EAF5E4] px-2 py-0.5 rounded-lg border border-[#3D352E]/30">
                      <BookOpen className="w-3 h-3" />
                      <span>Có Lý thuyết</span>
                    </span>

                    {scoreData && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-lg border border-[#3D352E]/30">
                        <Award className="w-3 h-3" />
                        <span>Đạt {scoreData.score}/{scoreData.total} ({scoreData.percentage}%)</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedExercise(ex);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#557A46] group-hover:bg-[#48683B] text-white font-black text-xs border border-[#3D352E] shadow-[1px_2px_0px_#3D352E] flex items-center gap-1 shrink-0"
                  >
                    <span>Vào học</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
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
