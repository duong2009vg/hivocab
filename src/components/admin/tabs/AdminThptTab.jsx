// src/components/admin/tabs/AdminThptTab.jsx
// Management for THPT National Exams, Question Content & Answer Key Studio Editor
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

      // Ensure questions is an array of 40 questions
      let questions = Array.isArray(data.questions) ? [...data.questions] : [];
      if (questions.length === 0) {
        // Generate default 40 questions template if empty
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

      // Update in local exams list
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
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-1 w-full sm:w-auto items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên đề, năm thi, mã đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container/60 border border-outline-variant/20 text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* PRO filter pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container/50 border border-outline-variant/20 text-xs">
            <button
              onClick={() => setProFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                proFilter === 'all'
                  ? 'bg-surface text-primary shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Tất cả ({exams.length})
            </button>
            <button
              onClick={() => setProFilter('pro')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                proFilter === 'pro'
                  ? 'bg-surface text-amber-600 shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>PRO</span>
            </button>
            <button
              onClick={() => setProFilter('free')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                proFilter === 'free'
                  ? 'bg-surface text-emerald-600 shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">public</span>
              <span>Free</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Thêm Đề Thi Mới</span>
        </button>
      </div>

      {/* Create Exam Inline Modal */}
      {isCreateOpen && (
        <div className="p-5 rounded-2xl bg-surface border border-primary/30 shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">school</span>
              <span>Tạo Đề Thi THPT Quốc Gia Mới</span>
            </h3>
            <button
              onClick={() => setIsCreateOpen(false)}
              className="text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <form onSubmit={handleCreateExam} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-on-surface mb-1">Tên đề thi</label>
              <input
                type="text"
                placeholder="VD: THPT Chuyên Hà Nội - Amsterdam (Lần 1)"
                value={newExamTitle}
                onChange={(e) => setNewExamTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container/50 border border-outline-variant/20 text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Năm thi</label>
              <input
                type="number"
                value={newExamYear}
                onChange={(e) => setNewExamYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container/50 border border-outline-variant/20 text-xs font-mono text-on-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Thời gian (phút)</label>
              <input
                type="number"
                value={newExamDuration}
                onChange={(e) => setNewExamDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container/50 border border-outline-variant/20 text-xs font-mono text-on-surface"
              />
            </div>

            <div className="sm:col-span-4 flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={newExamPro}
                  onChange={(e) => setNewExamPro(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <span>Khóa PRO (Chỉ dành cho tài khoản PRO)</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-outline-variant/20 text-xs font-semibold text-on-surface hover:bg-surface-container"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo Đề Thi'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Exams Grid */}
      {loading && exams.length === 0 ? (
        <div className="py-16 text-center text-on-surface-variant flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[28px] animate-spin">refresh</span>
          <span className="text-xs">Đang tải danh sách đề thi THPT...</span>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="p-12 text-center text-on-surface-variant bg-surface rounded-2xl border border-outline-variant/20">
          Không tìm thấy đề thi nào phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="p-4 rounded-2xl bg-surface border border-outline-variant/20 hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    Năm {exam.year || '2026'}
                  </span>
                  <button
                    onClick={() => handleTogglePro(exam)}
                    className="cursor-pointer"
                    title="Bấm để bật/tắt quyền PRO"
                  >
                    {exam.is_pro ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                        <span className="material-symbols-outlined text-[12px]">lock</span>
                        <span>PRO</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                        <span className="material-symbols-outlined text-[12px]">public</span>
                        <span>Free</span>
                      </span>
                    )}
                  </button>
                </div>

                <h4 className="font-bold text-sm text-on-surface line-clamp-2 mb-1.5" title={exam.title}>
                  {exam.title}
                </h4>

                <p className="text-xs text-on-surface-variant flex items-center gap-2 font-mono">
                  <span>{exam.total_questions || 40} câu hỏi</span>
                  <span>•</span>
                  <span>{exam.duration_minutes || 50} phút</span>
                </p>
              </div>

              {/* Action Buttons: Sửa đề bài & Sửa đáp án */}
              <div className="pt-3 mt-3 border-t border-outline-variant/15 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(exam.id, 'prompt')}
                    className="px-2.5 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Chỉnh sửa nội dung đề bài và bài đọc"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit_note</span>
                    <span>Sửa đề bài</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(exam.id, 'answer')}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Chỉnh sửa 4 lựa chọn, đáp án đúng và lời giải chi tiết"
                  >
                    <span className="material-symbols-outlined text-[15px]">task_alt</span>
                    <span>Sửa đáp án</span>
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteExam(exam.id, exam.title)}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-surface border border-outline-variant/30 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-outline-variant/15 flex items-center justify-between gap-3 bg-surface-container/30">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary">
                    THPT Studio Editor
                  </span>
                  <span className="text-xs text-on-surface-variant font-mono">
                    ID: {editingExam.id}
                  </span>
                </div>
                <h3 className="font-bold text-base sm:text-lg text-on-surface truncate">
                  {editingExam.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSaveExamEdits}
                  disabled={isSavingExam}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 active:scale-95 shadow-xs disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isSavingExam ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
                <button
                  onClick={() => setEditingExam(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container text-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Modal Subtabs & Question Navigator */}
            <div className="px-4 sm:px-5 pt-3 border-b border-outline-variant/15 bg-surface-container/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* 2 Main Functions: Sửa đề bài / Sửa đáp án */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditActiveTab('prompt')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    editActiveTab === 'prompt'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface border border-outline-variant/20 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  <span>1. Chỉnh sửa Đề bài & Bài đọc</span>
                </button>
                <button
                  onClick={() => setEditActiveTab('answer')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    editActiveTab === 'answer'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-surface border border-outline-variant/20 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">task_alt</span>
                  <span>2. Chỉnh sửa Đáp án & Lời giải</span>
                </button>
              </div>

              {/* Prev / Next Question controls */}
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  onClick={() => setActiveQIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeQIndex === 0}
                  className="px-2.5 py-1 rounded-lg border border-outline-variant/20 disabled:opacity-30 hover:bg-surface-container"
                >
                  ◀ Câu trước
                </button>
                <span className="px-2 font-mono text-primary font-bold">
                  Câu {activeQIndex + 1} / {editingExam.questions.length}
                </span>
                <button
                  onClick={() =>
                    setActiveQIndex((prev) =>
                      Math.min(editingExam.questions.length - 1, prev + 1)
                    )
                  }
                  disabled={activeQIndex === editingExam.questions.length - 1}
                  className="px-2.5 py-1 rounded-lg border border-outline-variant/20 disabled:opacity-30 hover:bg-surface-container"
                >
                  Câu sau ▶
                </button>
              </div>
            </div>

            {/* Question Quick Jump Pills (1 -> 40) */}
            <div className="px-4 py-2 bg-surface-container/20 border-b border-outline-variant/15 flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {editingExam.questions.map((q, idx) => {
                const isActive = idx === activeQIndex;
                const correct = q.correct_answer || '?';
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveQIndex(idx)}
                    className={`shrink-0 w-8 h-8 rounded-lg text-xs font-bold flex flex-col items-center justify-center transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-xs scale-105 ring-2 ring-primary/40'
                        : 'bg-surface border border-outline-variant/20 text-on-surface hover:bg-surface-container'
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
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {currentQ ? (
                editActiveTab === 'prompt' ? (
                  /* ─── TAB 1: CHỈNH SỬA ĐỀ BÀI & BÀI ĐỌC ─── */
                  <div className="space-y-4 animate-fade-in">
                    {/* Exam metadata quick inputs */}
                    <div className="p-3.5 rounded-2xl bg-surface-container/30 border border-outline-variant/15 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface mb-1">
                          Tiêu đề đề thi
                        </label>
                        <input
                          type="text"
                          value={editingExam.title}
                          onChange={(e) =>
                            setEditingExam({ ...editingExam, title: e.target.value })
                          }
                          className="w-full px-3 py-1.5 rounded-xl bg-surface border border-outline-variant/20 text-xs font-semibold text-on-surface"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface mb-1">
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
                          className="w-full px-3 py-1.5 rounded-xl bg-surface border border-outline-variant/20 text-xs font-mono text-on-surface"
                        />
                      </div>
                      <div className="flex items-center pt-4">
                        <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(editingExam.is_pro)}
                            onChange={(e) =>
                              setEditingExam({
                                ...editingExam,
                                is_pro: e.target.checked,
                              })
                            }
                            className="rounded text-amber-500 focus:ring-amber-500"
                          />
                          <span>Khóa gói PRO 🔒</span>
                        </label>
                      </div>
                    </div>

                    {/* Question Prompt Editor */}
                    <div className="p-4 rounded-2xl bg-surface border border-outline-variant/20 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-outline-variant/10">
                        <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">help_outline</span>
                          <span>Đề bài / Câu hỏi {activeQIndex + 1}</span>
                        </span>
                        <input
                          type="text"
                          placeholder="Tên nhóm / Phần thi..."
                          value={currentQ.group || ''}
                          onChange={(e) => updateCurrentQuestion('group', e.target.value)}
                          className="px-2.5 py-1 rounded-lg bg-surface-container/50 border border-outline-variant/20 text-[11px] text-on-surface font-semibold max-w-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Lời dẫn câu hỏi (Prompt)
                        </label>
                        <textarea
                          rows={2}
                          value={currentQ.prompt || ''}
                          onChange={(e) => updateCurrentQuestion('prompt', e.target.value)}
                          placeholder="VD: Chọn đáp án đúng nhất điền vào chỗ trống (1):"
                          className="w-full px-3 py-2 rounded-xl bg-surface-container/40 border border-outline-variant/20 text-xs text-on-surface font-medium focus:ring-1 focus:ring-primary leading-relaxed"
                        />
                      </div>

                      {/* Passage / Reading context if any */}
                      <div className="pt-2 border-t border-outline-variant/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">article</span>
                            <span>Đoạn văn / Bài đọc liên kết (Passage)</span>
                          </label>
                          <span className="text-[11px] text-on-surface-variant font-mono">
                            {currentQ.passage ? `${currentQ.passage.length} ký tự` : 'Không có bài đọc'}
                          </span>
                        </div>

                        <input
                          type="text"
                          placeholder="Tiêu đề bài đọc (nếu có, VD: Say No To Body Shaming)"
                          value={currentQ.passage_title || ''}
                          onChange={(e) => updateCurrentQuestion('passage_title', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-surface-container/40 border border-outline-variant/20 text-xs text-on-surface"
                        />

                        <textarea
                          rows={6}
                          value={currentQ.passage || ''}
                          onChange={(e) => updateCurrentQuestion('passage', e.target.value)}
                          placeholder="Dán toàn bộ nội dung đoạn văn bài đọc tại đây..."
                          className="w-full px-3 py-2 rounded-xl bg-surface-container/40 border border-outline-variant/20 text-xs text-on-surface font-mono leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ─── TAB 2: CHỈNH SỬA ĐÁP ÁN & LỜI GIẢI ─── */
                  <div className="space-y-4 animate-fade-in">
                    <div className="p-4 rounded-2xl bg-surface border border-outline-variant/20 space-y-4">
                      {/* Header with Correct Answer Key Picker */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
                        <div>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Thiết lập Đáp án chuẩn cho Câu {activeQIndex + 1}</span>
                          </span>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">
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
                                className={`w-10 h-10 rounded-xl text-sm font-black flex items-center justify-center transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white shadow-md scale-110 ring-2 ring-emerald-400'
                                    : 'bg-surface-container/60 border border-outline-variant/20 text-on-surface hover:bg-surface-container'
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
                              className={`p-3 rounded-xl border transition-all ${
                                isCorrect
                                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400'
                                  : 'bg-surface-container/30 border-outline-variant/15'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span
                                  className={`w-5 h-5 rounded-md text-xs font-black flex items-center justify-center ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-surface-container text-on-surface'
                                  }`}
                                >
                                  {letter}
                                </span>
                                {isCorrect && (
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
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
                                className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-outline-variant/20 text-xs font-semibold text-on-surface focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Detailed Explanation Textarea */}
                      <div className="pt-2 border-t border-outline-variant/10 space-y-1.5">
                        <label className="block text-xs font-bold text-on-surface flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-amber-500">lightbulb</span>
                          <span>Lời giải chi tiết & Tạm dịch (Explanation)</span>
                        </label>
                        <p className="text-[11px] text-on-surface-variant">
                          Hiển thị cho học sinh khi kết thúc bài thi hoặc xem lại lời giải.
                        </p>
                        <textarea
                          rows={5}
                          value={currentQ.explanation || ''}
                          onChange={(e) => updateCurrentQuestion('explanation', e.target.value)}
                          placeholder="Nhập giải thích ngữ pháp, từ vựng và tạm dịch câu..."
                          className="w-full px-3 py-2 rounded-xl bg-surface-container/40 border border-outline-variant/20 text-xs text-on-surface font-sans leading-relaxed focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-xs text-on-surface-variant">
                  Không tìm thấy câu hỏi này.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-outline-variant/15 flex items-center justify-between bg-surface-container/20">
              <span className="text-xs text-on-surface-variant">
                Lưu ý: Mọi thay đổi sẽ được cập nhật trực tiếp vào hệ thống phòng thi.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingExam(null)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/20 text-xs font-bold text-on-surface hover:bg-surface-container"
                >
                  Đóng
                </button>
                <button
                  onClick={handleSaveExamEdits}
                  disabled={isSavingExam}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 shadow-xs disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isSavingExam ? 'Đang lưu...' : 'Lưu Tất Cả Thay Đổi'}</span>
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
