// src/components/admin/tabs/AdminThptTab.jsx
// Management for THPT National Exams, Question Content & Answer Key Studio Editor
// Cozy Crayon Handcrafted Design System
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient.js';
import { useToast } from '../../../context/ToastContext.jsx';

export function AdminThptTab() {
  const { showToast } = useToast();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [proFilter, setProFilter] = useState('all'); // 'all' | 'pro' | 'free'

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamYear, setNewExamYear] = useState(new Date().getFullYear());
  const [newExamDuration, setNewExamDuration] = useState(50);
  const [newExamPro, setNewExamPro] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Studio Modal state
  const [editingExam, setEditingExam] = useState(null); // Full exam object
  const [editActiveTab, setEditActiveTab] = useState('prompt'); // 'prompt' (đề bài) | 'answer' (đáp án)
  const [activeQIndex, setActiveQIndex] = useState(0); // 0-based question index (0..39)
  const [isSavingExam, setIsSavingExam] = useState(false);

  // Fetch all exams
  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('thpt_exams')
        .select('id, title, year, total_questions, duration_minutes, is_pro, created_at, updated_at')
        .order('id', { ascending: true });

      if (error) throw error;
      setExams(data || []);
    } catch (err) {
      console.error('fetchExams error:', err);
      showToast(`Lỗi tải đề thi: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // Open Edit Modal for an exam (loads full questions & sections)
  const handleOpenEdit = async (examId, initialTab = 'prompt') => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('thpt_exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Không tìm thấy dữ liệu đề thi');

      let questions = Array.isArray(data.questions) ? [...data.questions] : [];
      if (questions.length === 0) {
        questions = Array.from({ length: 40 }, (_, idx) => ({
          number: idx + 1,
          part: Math.ceil((idx + 1) / 8),
          group: `Phần ${Math.ceil((idx + 1) / 8)}`,
          prompt: `Chọn đáp án đúng nhất cho câu hỏi ${idx + 1}:`,
          options: { A: '', B: '', C: '', D: '' },
          correct_answer: 'A',
          explanation: '',
          passage: '',
          passage_title: '',
          passage_instruction: '',
        }));
      }

      setEditingExam({
        ...data,
        questions,
      });
      setEditActiveTab(initialTab);
      setActiveQIndex(0);
    } catch (err) {
      console.error('Error opening exam editor:', err);
      showToast(`Lỗi mở trình sửa đề: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Quick toggle PRO status
  const handleTogglePro = async (exam) => {
    const nextVal = !Boolean(exam.is_pro);
    setExams((prev) =>
      prev.map((e) => (e.id === exam.id ? { ...e, is_pro: nextVal } : e))
    );
    try {
      const { error } = await supabase
        .from('thpt_exams')
        .update({ is_pro: nextVal, updated_at: new Date().toISOString() })
        .eq('id', exam.id);

      if (error) throw error;
      showToast(`Đã ${nextVal ? 'khóa PRO 🔒' : 'mở Miễn phí 🌐'} cho đề thi!`, 'success');
    } catch (err) {
      setExams((prev) =>
        prev.map((e) => (e.id === exam.id ? { ...e, is_pro: !nextVal } : e))
      );
      showToast(`Lỗi cập nhật: ${err.message}`, 'error');
    }
  };

  // Create new exam
  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!newExamTitle.trim()) {
      showToast('Vui lòng nhập tên đề thi!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const id = `thpt-exam-${Date.now().toString(36)}`;
      const emptyQuestions = Array.from({ length: 40 }, (_, idx) => ({
        number: idx + 1,
        part: Math.ceil((idx + 1) / 8),
        group: `Phần ${Math.ceil((idx + 1) / 8)}`,
        prompt: `Chọn đáp án đúng nhất cho câu hỏi ${idx + 1}:`,
        options: { A: 'A', B: 'B', C: 'C', D: 'D' },
        correct_answer: 'A',
        explanation: '',
        passage: '',
        passage_title: '',
        passage_instruction: '',
      }));

      const newExam = {
        id,
        title: newExamTitle.trim(),
        year: parseInt(newExamYear, 10) || new Date().getFullYear(),
        total_questions: 40,
        duration_minutes: parseInt(newExamDuration, 10) || 50,
        is_pro: newExamPro,
        sections: [],
        questions: emptyQuestions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('thpt_exams').insert(newExam);
      if (error) throw error;

      showToast('Đã tạo đề thi mới thành công! 🎉', 'success');
      setNewExamTitle('');
      setIsCreateOpen(false);
      fetchExams();
    } catch (err) {
      console.error('handleCreateExam error:', err);
      showToast(`Lỗi tạo đề: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete exam
  const handleDeleteExam = async (id, title) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đề thi "${title}"?`)) {
      return;
    }
    try {
      const { error } = await supabase.from('thpt_exams').delete().eq('id', id);
      if (error) throw error;
      showToast(`Đã xóa đề thi "${title}".`, 'success');
      setExams((prev) => prev.filter((x) => x.id !== id));
      if (editingExam?.id === id) setEditingExam(null);
    } catch (err) {
      console.error('handleDeleteExam error:', err);
      showToast(`Lỗi xóa đề: ${err.message}`, 'error');
    }
  };

  // Save changes from Edit Studio
  const handleSaveExamEdits = async () => {
    if (!editingExam) return;
    setIsSavingExam(true);
    try {
      const { error } = await supabase
        .from('thpt_exams')
        .update({
          title: editingExam.title.trim(),
          year: parseInt(editingExam.year, 10) || 2026,
          duration_minutes: parseInt(editingExam.duration_minutes, 10) || 50,
          is_pro: Boolean(editingExam.is_pro),
          questions: editingExam.questions,
          sections: editingExam.sections || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingExam.id);

      if (error) throw error;
      showToast(`Đã lưu thay đổi cho đề thi "${editingExam.title}"! 🎉`, 'success');

      setExams((prev) =>
        prev.map((e) =>
          e.id === editingExam.id
            ? {
                ...e,
                title: editingExam.title,
                year: editingExam.year,
                duration_minutes: editingExam.duration_minutes,
                is_pro: editingExam.is_pro,
              }
            : e
        )
      );
      setEditingExam(null);
    } catch (err) {
      console.error('handleSaveExamEdits error:', err);
      showToast(`Lỗi lưu thay đổi: ${err.message}`, 'error');
    } finally {
      setIsSavingExam(false);
    }
  };

  // Update a field of the currently active question
  const updateCurrentQuestion = (field, value) => {
    if (!editingExam) return;
    setEditingExam((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[activeQIndex] = {
        ...newQuestions[activeQIndex],
        [field]: value,
      };
      return { ...prev, questions: newQuestions };
    });
  };

  // Update option A, B, C, D of currently active question
  const updateCurrentOption = (optKey, value) => {
    if (!editingExam) return;
    setEditingExam((prev) => {
      const newQuestions = [...prev.questions];
      const curQ = newQuestions[activeQIndex];
      newQuestions[activeQIndex] = {
        ...curQ,
        options: {
          ...(curQ.options || {}),
          [optKey]: value,
        },
      };
      return { ...prev, questions: newQuestions };
    });
  };

  // Filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter((x) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        String(x.title || '').toLowerCase().includes(q) ||
        String(x.year || '').includes(q) ||
        String(x.id || '').toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (proFilter === 'pro') return x.is_pro;
      if (proFilter === 'free') return !x.is_pro;
      return true;
    });
  }, [exams, searchTerm, proFilter]);

  const currentQ = editingExam?.questions?.[activeQIndex] || null;

  return (
    <div className="space-y-6 animate-fade-in font-nunito text-[#3D352E]">
      {/* Top Header & Search Bar */}
      <div className="p-5 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-[18px] text-[#6E5D53]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên đề, năm thi, mã đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-bold text-[#3D352E] focus:ring-2 focus:ring-[#557A46] focus:outline-none placeholder:text-[#8C7A6B]/60"
            />
          </div>

          {/* PRO filter pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#FAF5EB] border-2 border-[#3D352E] text-xs">
            <button
              onClick={() => setProFilter('all')}
              className={`px-3 py-1.5 rounded-full font-black font-quicksand transition-all cursor-pointer ${
                proFilter === 'all'
                  ? 'bg-[#3D352E] text-white shadow-[1.5px_2px_0px_#3D352E]'
                  : 'text-[#6E5D53] hover:text-[#3D352E]'
              }`}
            >
              Tất cả ({exams.length})
            </button>
            <button
              onClick={() => setProFilter('pro')}
              className={`px-3 py-1.5 rounded-full font-black font-quicksand transition-all flex items-center gap-1 cursor-pointer ${
                proFilter === 'pro'
                  ? 'bg-[#DE5D53] text-white shadow-[1.5px_2px_0px_#3D352E]'
                  : 'text-[#6E5D53] hover:text-[#3D352E]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>PRO</span>
            </button>
            <button
              onClick={() => setProFilter('free')}
              className={`px-3 py-1.5 rounded-full font-black font-quicksand transition-all flex items-center gap-1 cursor-pointer ${
                proFilter === 'free'
                  ? 'bg-[#557A46] text-white shadow-[1.5px_2px_0px_#3D352E]'
                  : 'text-[#6E5D53] hover:text-[#3D352E]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">public</span>
              <span>Free</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#557A46] hover:bg-[#466638] text-white font-black text-xs flex items-center justify-center gap-1.5 border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Thêm Đề Thi Mới 📝</span>
        </button>
      </div>

      {/* Create Exam Inline Form */}
      {isCreateOpen && (
        <div className="p-6 rounded-3xl bg-[#FAF5EB] border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#3D352E]">
            <h3 className="text-base font-black font-quicksand text-[#3D352E] flex items-center gap-2">
              <span>🎓</span>
              <span>Tạo Đề Thi THPT Quốc Gia Mới</span>
            </h3>
            <button
              onClick={() => setIsCreateOpen(false)}
              className="w-8 h-8 rounded-full border-2 border-[#3D352E] bg-white hover:bg-[#F2ECE0] flex items-center justify-center text-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          <form onSubmit={handleCreateExam} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-black font-quicksand uppercase tracking-wider text-[#6E5D53] mb-1.5">
                  Tên đề thi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Đề thi thử THPT Quốc Gia 2026 - Chuyên Sư Phạm (Lần 1)"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-bold text-[#3D352E] focus:ring-2 focus:ring-[#557A46] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black font-quicksand uppercase tracking-wider text-[#6E5D53] mb-1.5">
                  Năm thi
                </label>
                <input
                  type="number"
                  value={newExamYear}
                  onChange={(e) => setNewExamYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-mono font-bold text-[#3D352E] focus:ring-2 focus:ring-[#557A46] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-6">
                <div>
                  <label className="block text-xs font-black font-quicksand uppercase tracking-wider text-[#6E5D53] mb-1.5">
                    Thời gian làm bài (phút)
                  </label>
                  <input
                    type="number"
                    value={newExamDuration}
                    onChange={(e) => setNewExamDuration(e.target.value)}
                    className="w-32 px-3.5 py-2 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-mono font-bold text-[#3D352E]"
                  />
                </div>

                <div className="pt-5">
                  <label className="inline-flex items-center gap-2 text-xs font-black text-[#3D352E] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newExamPro}
                      onChange={(e) => setNewExamPro(e.target.checked)}
                      className="w-4 h-4 rounded border-2 border-[#3D352E] accent-[#DE5D53] cursor-pointer"
                    />
                    <span>Khóa gói PRO (Chỉ hội viên) 🔒</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-white hover:bg-[#F2ECE0] border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] text-xs font-bold text-[#3D352E] active:translate-y-0.5 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-[#557A46] hover:bg-[#466638] text-white border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] text-xs font-black active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo Đề Thi 🚀'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Exams Grid */}
      {loading && exams.length === 0 ? (
        <div className="py-16 text-center text-[#6E5D53] flex flex-col items-center gap-2 bg-white rounded-3xl border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E]">
          <span className="material-symbols-outlined text-[#557A46] text-[32px] animate-spin">
            refresh
          </span>
          <span className="text-xs font-bold">Đang tải danh sách đề thi THPT...</span>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="p-12 text-center text-[#6E5D53] bg-white rounded-3xl border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] font-bold">
          Không tìm thấy đề thi nào phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="p-5 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] hover:translate-y-[-2px] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FAF5EB] text-[#3D352E] border-2 border-[#3D352E]">
                    Năm {exam.year || '2026'}
                  </span>
                  <button
                    onClick={() => handleTogglePro(exam)}
                    className="cursor-pointer"
                    title="Bấm để bật/tắt quyền PRO"
                  >
                    {exam.is_pro ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFF0E6] text-[#DE5D53] border-2 border-[#DE5D53]">
                        <span className="material-symbols-outlined text-[12px]">lock</span>
                        <span>PRO</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#EAF3E7] text-[#557A46] border-2 border-[#557A46]">
                        <span className="material-symbols-outlined text-[12px]">public</span>
                        <span>Free</span>
                      </span>
                    )}
                  </button>
                </div>

                <h4 className="font-black text-sm text-[#3D352E] font-quicksand line-clamp-2 mb-2" title={exam.title}>
                  {exam.title}
                </h4>

                <p className="text-xs text-[#6E5D53] font-bold flex items-center gap-2 font-mono">
                  <span>{exam.total_questions || 40} câu hỏi</span>
                  <span>•</span>
                  <span>{exam.duration_minutes || 50} phút</span>
                </p>
              </div>

              {/* Action Buttons: Sửa đề bài & Sửa đáp án */}
              <div className="pt-4 mt-4 border-t-2 border-[#FAF5EB] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(exam.id, 'prompt')}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF5EB] hover:bg-[#F2ECE0] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-bold text-[#3D352E] flex items-center gap-1 active:translate-y-0.5 transition-all cursor-pointer"
                    title="Chỉnh sửa nội dung đề bài và bài đọc"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit_note</span>
                    <span>Sửa đề</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(exam.id, 'answer')}
                    className="px-3 py-1.5 rounded-xl bg-[#EAF3E7] hover:bg-[#DDF0D8] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-bold text-[#557A46] flex items-center gap-1 active:translate-y-0.5 transition-all cursor-pointer"
                    title="Chỉnh sửa 4 lựa chọn, đáp án đúng và lời giải chi tiết"
                  >
                    <span className="material-symbols-outlined text-[15px]">task_alt</span>
                    <span>Đáp án</span>
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteExam(exam.id, exam.title)}
                  className="p-1.5 rounded-xl text-[#DE5D53] hover:bg-[#FFF0E6] border border-transparent hover:border-[#DE5D53] transition-colors cursor-pointer"
                  title="Xóa đề thi"
                >
                  <span className="material-symbols-outlined text-[17px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* EXAM STUDIO MODAL (CHỈNH SỬA ĐỀ BÀI & ĐÁP ÁN) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {editingExam && (
        <div className="fixed inset-0 z-50 bg-[#3D352E]/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in font-nunito text-[#3D352E]">
          <div className="bg-[#FAF5EB] border-2 border-[#3D352E] rounded-3xl w-full max-w-5xl shadow-[6px_7px_0px_#3D352E] flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b-2 border-[#3D352E] flex items-center justify-between gap-3 bg-white">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#EAF3E7] text-[#557A46] border border-[#557A46]">
                    THPT Studio Editor 🛠️
                  </span>
                  <span className="text-xs text-[#6E5D53] font-mono font-bold">
                    ID: {editingExam.id}
                  </span>
                </div>
                <h3 className="font-black text-base sm:text-lg font-quicksand text-[#3D352E] truncate">
                  {editingExam.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSaveExamEdits}
                  disabled={isSavingExam}
                  className="px-5 py-2.5 rounded-2xl bg-[#557A46] hover:bg-[#466638] text-white text-xs font-black flex items-center gap-1.5 border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isSavingExam ? 'Đang lưu...' : 'Lưu Thay Đổi ✨'}</span>
                </button>
                <button
                  onClick={() => setEditingExam(null)}
                  className="w-8 h-8 rounded-full border-2 border-[#3D352E] bg-white hover:bg-[#F2ECE0] flex items-center justify-center text-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Modal Subtabs & Question Navigator */}
            <div className="px-4 sm:px-5 py-3 border-b-2 border-[#3D352E] bg-[#FAF5EB] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* 2 Main Functions: Sửa đề bài / Sửa đáp án */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditActiveTab('prompt')}
                  className={`px-4 py-2 rounded-2xl text-xs font-black font-quicksand flex items-center gap-1.5 transition-all cursor-pointer ${
                    editActiveTab === 'prompt'
                      ? 'bg-[#3D352E] text-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                      : 'bg-white border-2 border-[#3D352E] text-[#6E5D53] hover:text-[#3D352E]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  <span>1. Chỉnh sửa Đề bài & Bài đọc</span>
                </button>
                <button
                  onClick={() => setEditActiveTab('answer')}
                  className={`px-4 py-2 rounded-2xl text-xs font-black font-quicksand flex items-center gap-1.5 transition-all cursor-pointer ${
                    editActiveTab === 'answer'
                      ? 'bg-[#557A46] text-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                      : 'bg-white border-2 border-[#3D352E] text-[#6E5D53] hover:text-[#3D352E]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">task_alt</span>
                  <span>2. Chỉnh sửa Đáp án & Lời giải</span>
                </button>
              </div>

              {/* Prev / Next Question controls */}
              <div className="flex items-center gap-2 text-xs font-black">
                <button
                  onClick={() => setActiveQIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeQIndex === 0}
                  className="px-3 py-1.5 rounded-xl bg-white border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] disabled:opacity-30 hover:bg-[#FAF5EB] cursor-pointer"
                >
                  ◀ Câu trước
                </button>
                <span className="px-3 py-1 rounded-full bg-white border-2 border-[#3D352E] font-mono text-[#557A46] font-black">
                  Câu {activeQIndex + 1} / {editingExam.questions.length}
                </span>
                <button
                  onClick={() =>
                    setActiveQIndex((prev) =>
                      Math.min(editingExam.questions.length - 1, prev + 1)
                    )
                  }
                  disabled={activeQIndex === editingExam.questions.length - 1}
                  className="px-3 py-1.5 rounded-xl bg-white border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] disabled:opacity-30 hover:bg-[#FAF5EB] cursor-pointer"
                >
                  Câu sau ▶
                </button>
              </div>
            </div>

            {/* Question Quick Jump Pills (1 -> 40) */}
            <div className="px-4 py-2.5 bg-white border-b-2 border-[#3D352E] flex items-center gap-1.5 overflow-x-auto">
              {editingExam.questions.map((q, idx) => {
                const isActive = idx === activeQIndex;
                const correct = q.correct_answer || '?';
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveQIndex(idx)}
                    className={`shrink-0 w-8 h-8 rounded-xl text-xs font-black flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#557A46] text-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] scale-105'
                        : 'bg-[#FAF5EB] border border-[#3D352E]/30 text-[#3D352E] hover:border-[#3D352E]'
                    }`}
                  >
                    <span className="text-[10px] leading-none">{idx + 1}</span>
                    <span className="text-[8px] opacity-75 font-mono leading-none">
                      {correct}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body: Active Tab Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-[#FAF5EB]">
              {currentQ ? (
                editActiveTab === 'prompt' ? (
                  /* ─── TAB 1: CHỈNH SỬA ĐỀ BÀI & BÀI ĐỌC ─── */
                  <div className="space-y-4 animate-fade-in">
                    {/* Exam metadata quick inputs */}
                    <div className="p-4 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-black font-quicksand uppercase text-[#6E5D53] mb-1">
                          Tiêu đề đề thi
                        </label>
                        <input
                          type="text"
                          value={editingExam.title}
                          onChange={(e) =>
                            setEditingExam({ ...editingExam, title: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#3D352E] text-xs font-bold text-[#3D352E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black font-quicksand uppercase text-[#6E5D53] mb-1">
                          Thời gian làm bài (phút)
                        </label>
                        <input
                          type="number"
                          value={editingExam.duration_minutes}
                          onChange={(e) =>
                            setEditingExam({
                              ...editingExam,
                              duration_minutes: parseInt(e.target.value, 10) || 50,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#3D352E] text-xs font-mono font-bold text-[#3D352E]"
                        />
                      </div>
                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 text-xs font-black text-[#3D352E] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(editingExam.is_pro)}
                            onChange={(e) =>
                              setEditingExam({
                                ...editingExam,
                                is_pro: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded border-2 border-[#3D352E] accent-[#DE5D53]"
                          />
                          <span>Khóa gói PRO (Hội viên) 🔒</span>
                        </label>
                      </div>
                    </div>

                    {/* Question Prompt Editor */}
                    <div className="p-5 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b-2 border-[#FAF5EB]">
                        <span className="text-xs font-black font-quicksand text-[#557A46] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">help_outline</span>
                          <span>Đề bài / Câu hỏi {activeQIndex + 1}</span>
                        </span>
                        <input
                          type="text"
                          placeholder="Tên nhóm / Phần thi..."
                          value={currentQ.group || ''}
                          onChange={(e) => updateCurrentQuestion('group', e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-[#FAF5EB] border-2 border-[#3D352E] text-[11px] text-[#3D352E] font-bold max-w-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black font-quicksand uppercase text-[#6E5D53] mb-1">
                          Lời dẫn câu hỏi (Prompt)
                        </label>
                        <textarea
                          rows={2}
                          value={currentQ.prompt || ''}
                          onChange={(e) => updateCurrentQuestion('prompt', e.target.value)}
                          placeholder="VD: Chọn đáp án đúng nhất điền vào chỗ trống (1):"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs text-[#3D352E] font-bold focus:ring-2 focus:ring-[#557A46] leading-relaxed"
                        />
                      </div>

                      {/* Passage / Reading context if any */}
                      <div className="pt-3 border-t-2 border-[#FAF5EB] space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black font-quicksand uppercase text-[#6E5D53] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-[#557A46]">article</span>
                            <span>Đoạn văn / Bài đọc liên kết (Passage)</span>
                          </label>
                          <span className="text-[11px] text-[#6E5D53] font-mono font-bold">
                            {currentQ.passage ? `${currentQ.passage.length} ký tự` : 'Không có bài đọc'}
                          </span>
                        </div>

                        <input
                          type="text"
                          placeholder="Tiêu đề bài đọc (nếu có, VD: Say No To Body Shaming)"
                          value={currentQ.passage_title || ''}
                          onChange={(e) => updateCurrentQuestion('passage_title', e.target.value)}
                          className="w-full px-3.5 py-2 rounded-2xl bg-white border-2 border-[#3D352E] text-xs font-bold text-[#3D352E]"
                        />

                        <textarea
                          rows={6}
                          value={currentQ.passage || ''}
                          onChange={(e) => updateCurrentQuestion('passage', e.target.value)}
                          placeholder="Dán toàn bộ nội dung đoạn văn bài đọc tại đây..."
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFFDF9] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs text-[#3D352E] font-mono leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ─── TAB 2: CHỈNH SỬA ĐÁP ÁN & LỜI GIẢI ─── */
                  <div className="space-y-4 animate-fade-in">
                    <div className="p-5 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] space-y-4">
                      {/* Header with Correct Answer Key Picker */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#FAF5EB]">
                        <div>
                          <span className="text-xs font-black font-quicksand text-[#557A46] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Thiết lập Đáp án chuẩn cho Câu {activeQIndex + 1}</span>
                          </span>
                          <p className="text-[11px] text-[#6E5D53] font-bold mt-0.5">
                            Bấm vào phương án đúng A, B, C hoặc D bên dưới
                          </p>
                        </div>

                        {/* 4 Large Choice Buttons A / B / C / D */}
                        <div className="flex items-center gap-2">
                          {['A', 'B', 'C', 'D'].map((letter) => {
                            const isCorrect = currentQ.correct_answer === letter;
                            return (
                              <button
                                key={letter}
                                type="button"
                                onClick={() => updateCurrentQuestion('correct_answer', letter)}
                                className={`w-10 h-10 rounded-2xl text-sm font-black flex items-center justify-center transition-all cursor-pointer ${
                                  isCorrect
                                    ? 'bg-[#557A46] text-white border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] scale-110'
                                    : 'bg-white border-2 border-[#3D352E] text-[#3D352E] hover:bg-[#FAF5EB]'
                                }`}
                              >
                                {letter}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 4 Option Inputs A, B, C, D */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {['A', 'B', 'C', 'D'].map((letter) => {
                          const isCorrect = currentQ.correct_answer === letter;
                          return (
                            <div
                              key={letter}
                              className={`p-3.5 rounded-2xl border-2 transition-all ${
                                isCorrect
                                  ? 'bg-[#EAF3E7] border-[#557A46] shadow-[2px_2px_0px_#557A46]'
                                  : 'bg-[#FFFDF9] border-[#3D352E]/30'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center border ${
                                    isCorrect
                                      ? 'bg-[#557A46] text-white border-[#3D352E]'
                                      : 'bg-white text-[#3D352E] border-[#3D352E]'
                                  }`}
                                >
                                  {letter}
                                </span>
                                {isCorrect && (
                                  <span className="text-[10px] font-black text-[#557A46] flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[13px]">check</span>
                                    <span>Đáp án chuẩn</span>
                                  </span>
                                )}
                              </div>
                              <input
                                type="text"
                                value={currentQ.options?.[letter] || ''}
                                onChange={(e) => updateCurrentOption(letter, e.target.value)}
                                placeholder={`Nội dung lựa chọn ${letter}...`}
                                className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#3D352E] text-xs font-bold text-[#3D352E] focus:ring-1 focus:ring-[#557A46]"
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Detailed Explanation Textarea */}
                      <div className="pt-3 border-t-2 border-[#FAF5EB] space-y-2">
                        <label className="block text-xs font-black font-quicksand uppercase text-[#6E5D53] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-[#F4B41A]">lightbulb</span>
                          <span>Lời giải chi tiết & Tạm dịch (Explanation)</span>
                        </label>
                        <textarea
                          rows={5}
                          value={currentQ.explanation || ''}
                          onChange={(e) => updateCurrentQuestion('explanation', e.target.value)}
                          placeholder="Nhập giải thích ngữ pháp, từ vựng và tạm dịch câu..."
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFFDF9] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs text-[#3D352E] font-medium leading-relaxed focus:ring-2 focus:ring-[#557A46]"
                        />
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-xs text-[#6E5D53] font-bold">
                  Không tìm thấy câu hỏi này.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-2 border-[#3D352E] flex items-center justify-between bg-white">
              <span className="text-xs text-[#6E5D53] font-bold">
                Mọi thay đổi sẽ được lưu đồng bộ trực tiếp vào hệ thống phòng thi THPT.
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditingExam(null)}
                  className="px-5 py-2.5 rounded-2xl bg-[#FAF5EB] hover:bg-[#F2ECE0] border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] text-xs font-bold text-[#3D352E] cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={handleSaveExamEdits}
                  disabled={isSavingExam}
                  className="px-6 py-2.5 rounded-2xl bg-[#557A46] hover:bg-[#466638] text-white text-xs font-black border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isSavingExam ? 'Đang lưu...' : 'Lưu Tất Cả Thay Đổi ✨'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminThptTab;
