// src/components/admin/tabs/AdminThptTab.jsx
// Management for 38+ THPT National Exams, Question Builder & Exam Metadata
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient.js';
import { useToast } from '../../../context/ToastContext.jsx';

export function AdminThptTab() {
  const { showToast } = useToast();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamYear, setNewExamYear] = useState(new Date().getFullYear());
  const [newExamPro, setNewExamPro] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('thpt_exams')
        .select('id, name, year, total_questions, time_limit_minutes, is_pro, created_at')
        .order('year', { ascending: false });

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

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!newExamName.trim()) {
      showToast('Vui lòng nhập tên đề thi!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('thpt_exams')
        .insert({
          name: newExamName.trim(),
          year: parseInt(newExamYear, 10) || new Date().getFullYear(),
          total_questions: 40,
          time_limit_minutes: 50,
          is_pro: newExamPro,
        });

      if (error) throw error;
      showToast('Đã tạo đề thi mới thành công! 🎉', 'success');
      setNewExamName('');
      setIsCreateOpen(false);
      fetchExams();
    } catch (err) {
      console.error('handleCreateExam error:', err);
      showToast(`Lỗi tạo đề: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExam = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đề thi "${name}"? Hành động này sẽ xóa cả 40 câu hỏi liên quan.`)) {
      return;
    }
    try {
      const { error } = await supabase.from('thpt_exams').delete().eq('id', id);
      if (error) throw error;
      showToast(`Đã xóa đề thi "${name}".`, 'success');
      setExams((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      console.error('handleDeleteExam error:', err);
      showToast(`Lỗi xóa đề: ${err.message}`, 'error');
    }
  };

  const filteredExams = exams.filter((x) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      String(x.name || '').toLowerCase().includes(q) ||
      String(x.year || '').includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 w-full sm:w-auto items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="Tìm theo tên đề, năm thi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container/60 border border-outline-variant/20 text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
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

          <form onSubmit={handleCreateExam} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-on-surface mb-1">Tên đề thi</label>
              <input
                type="text"
                placeholder="VD: Đề thi thử THPT Quốc Gia 2026 - Mã đề 401"
                value={newExamName}
                onChange={(e) => setNewExamName(e.target.value)}
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

            <div className="sm:col-span-3 flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={newExamPro}
                  onChange={(e) => setNewExamPro(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <span>Khóa PRO (Chỉ dành cho hội viên có gói)</span>
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
                  {isSubmitting ? 'Đang tạo...' : 'Tạo Đề'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Exams Grid */}
      {loading ? (
        <div className="py-16 text-center text-on-surface-variant flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[28px] animate-spin">refresh</span>
          <span className="text-xs">Đang tải danh sách đề thi...</span>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="p-12 text-center text-on-surface-variant bg-surface rounded-2xl border border-outline-variant/20">
          Chưa có đề thi nào trong hệ thống.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="p-4 rounded-2xl bg-surface border border-outline-variant/20 hover:border-outline-variant/40 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    Năm {exam.year || '2026'}
                  </span>
                  {exam.is_pro ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                      <span className="material-symbols-outlined text-[12px]">lock</span>
                      <span>PRO</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                      Free
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-on-surface line-clamp-2 mb-1.5" title={exam.name}>
                  {exam.name}
                </h4>

                <p className="text-xs text-on-surface-variant flex items-center gap-2 font-mono">
                  <span>{exam.total_questions || 40} câu hỏi</span>
                  <span>•</span>
                  <span>{exam.time_limit_minutes || 50} phút</span>
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-outline-variant/15 flex items-center justify-between">
                <span className="text-[11px] font-mono text-on-surface-variant truncate max-w-[120px]">
                  ID: {exam.id.slice(0, 8)}...
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDeleteExam(exam.id, exam.name)}
                    className="p-1 rounded-lg text-on-surface-variant hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Xóa đề thi"
                  >
                    <span className="material-symbols-outlined text-[17px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminThptTab;
