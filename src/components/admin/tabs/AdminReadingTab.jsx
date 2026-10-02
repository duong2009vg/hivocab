// src/components/admin/tabs/AdminReadingTab.jsx
// IELTS Cambridge Bilingual Reading Editor, Passage Inspector & Translation Manager
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient.js';
import { useToast } from '../../../context/ToastContext.jsx';

export function AdminReadingTab() {
  const { showToast } = useToast();
  const [passages, setPassages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPassage, setEditingPassage] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchPassages = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('passages')
        .select('id, test_id, passage_number, title, is_pro, created_at')
        .order('test_id', { ascending: true })
        .limit(100);

      if (error) throw error;
      setPassages(data || []);
    } catch (err) {
      console.error('fetchPassages error:', err);
      showToast(`Lỗi tải bài đọc: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPassages();
  }, [fetchPassages]);

  const handleOpenEdit = (p) => {
    setEditingPassage(p);
    setEditTitle(p.title || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      showToast('Tiêu đề bài đọc không được để trống!', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('passages')
        .update({ title: editTitle.trim() })
        .eq('id', editingPassage.id);

      if (error) throw error;
      showToast('Đã lưu bài đọc thành công!', 'success');
      setPassages((prev) =>
        prev.map((p) => (p.id === editingPassage.id ? { ...p, title: editTitle.trim() } : p))
      );
      setEditingPassage(null);
    } catch (err) {
      console.error('handleSaveEdit error:', err);
      showToast(`Lỗi khi lưu: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPassages = passages.filter((p) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      String(p.title || '').toLowerCase().includes(q) ||
      String(p.test_id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Header */}
      <div className="p-4 rounded-2xl bg-surface border border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, mã test IELTS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container/60 border border-outline-variant/20 text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="text-xs font-semibold text-on-surface-variant">
          Tổng số: <span className="font-bold text-on-surface">{filteredPassages.length}</span> bài đọc
        </div>
      </div>

      {/* Edit Passage Modal */}
      {editingPassage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface w-full max-w-lg rounded-2xl border border-outline-variant/20 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
              <h3 className="text-sm font-bold text-on-surface">Chỉnh sửa Tiêu đề Bài đọc</h3>
              <button onClick={() => setEditingPassage(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Tiêu đề bài đọc</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/20 text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPassage(null)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/20 text-xs font-semibold text-on-surface hover:bg-surface-container"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Passages Table */}
      <div className="bg-surface rounded-2xl border border-outline-variant/20 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-16 text-center text-on-surface-variant flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px] animate-spin">refresh</span>
            <span className="text-xs">Đang tải danh sách bài đọc...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container/40 border-b border-outline-variant/15 text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">BÀI ĐỌC (PASSAGE)</th>
                  <th className="py-3 px-4">MÃ TEST</th>
                  <th className="py-3 px-4">PHẦN ĐỌC</th>
                  <th className="py-3 px-4">TRẠNG THÁI</th>
                  <th className="py-3 px-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredPassages.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-on-surface-variant">
                      Không tìm thấy bài đọc nào.
                    </td>
                  </tr>
                ) : (
                  filteredPassages.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-on-surface max-w-[280px] truncate" title={p.title}>
                        {p.title || 'Chưa đặt tiêu đề'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-on-surface-variant text-[11px]">
                        {p.test_id ? p.test_id.slice(0, 12) : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-on-surface">
                        Passage {p.passage_number || 1}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.is_pro ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                            <span className="material-symbols-outlined text-[12px]">lock</span>
                            <span>PRO</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                            Free
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-2.5 py-1 rounded-lg border border-outline-variant/20 hover:bg-surface-container text-xs font-semibold text-on-surface transition-all"
                        >
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminReadingTab;
