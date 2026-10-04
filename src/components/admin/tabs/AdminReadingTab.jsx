// src/components/admin/tabs/AdminReadingTab.jsx
// IELTS Cambridge Bilingual Reading Editor, Passage Inspector & Translation Manager
// Cozy Crayon Handcrafted Design System
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
      showToast('Đã lưu bài đọc thành công! 🎉', 'success');
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
    <div className="space-y-6 animate-fade-in font-nunito text-[#3D352E]">
      {/* Search Header */}
      <div className="p-5 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-[18px] text-[#6E5D53]">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, mã test IELTS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-bold text-[#3D352E] focus:ring-2 focus:ring-[#557A46] focus:outline-none placeholder:text-[#8C7A6B]/60"
          />
        </div>

        <div className="text-xs font-bold text-[#6E5D53] flex items-center gap-2">
          <span>Tổng số:</span>
          <span className="px-3 py-1 rounded-full bg-[#FAF5EB] border-2 border-[#3D352E] font-black text-[#3D352E] font-mono text-xs">
            {filteredPassages.length} bài đọc
          </span>
        </div>
      </div>

      {/* Edit Passage Modal */}
      {editingPassage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3D352E]/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FAF5EB] w-full max-w-lg rounded-3xl border-2 border-[#3D352E] shadow-[5px_6px_0px_#3D352E] overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#3D352E]">
              <h3 className="text-base font-black font-quicksand text-[#3D352E] flex items-center gap-2">
                <span>📖</span>
                <span>Chỉnh sửa Tiêu đề Bài đọc</span>
              </h3>
              <button
                onClick={() => setEditingPassage(null)}
                className="w-8 h-8 rounded-full border-2 border-[#3D352E] bg-white hover:bg-[#F2ECE0] flex items-center justify-center text-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-black font-quicksand uppercase tracking-wider text-[#6E5D53] mb-1.5">
                  Tiêu đề bài đọc
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-bold text-[#3D352E] focus:ring-2 focus:ring-[#557A46] focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-[#3D352E]/10">
                <button
                  type="button"
                  onClick={() => setEditingPassage(null)}
                  className="px-5 py-2.5 rounded-2xl bg-white hover:bg-[#F2ECE0] border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] text-xs font-bold text-[#3D352E] active:translate-y-0.5 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-2xl bg-[#557A46] hover:bg-[#466638] text-white border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] text-xs font-black active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi ✨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Passages Table */}
      <div className="bg-white rounded-3xl border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#6E5D53] flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[#557A46] text-[32px] animate-spin">
              refresh
            </span>
            <span className="text-xs font-bold">Đang tải danh sách bài đọc...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EB] border-b-2 border-[#3D352E] text-[#6E5D53] font-black font-quicksand uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">BÀI ĐỌC (PASSAGE)</th>
                  <th className="py-3 px-4">MÃ TEST</th>
                  <th className="py-3 px-4">PHẦN ĐỌC</th>
                  <th className="py-3 px-4">TRẠNG THÁI</th>
                  <th className="py-3 px-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADDC7]">
                {filteredPassages.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-[#6E5D53] font-bold">
                      Không tìm thấy bài đọc nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredPassages.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FFF9EE] transition-colors">
                      <td className="py-3.5 px-4 font-black font-quicksand text-sm text-[#3D352E] max-w-[280px] truncate" title={p.title}>
                        {p.title || 'Chưa đặt tiêu đề'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#6E5D53] text-[11px]">
                        {p.test_id ? p.test_id.slice(0, 12) : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-black text-[#3D352E]">
                        Passage {p.passage_number || 1}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.is_pro ? (
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
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#FAF5EB] hover:bg-[#F2ECE0] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-bold text-[#3D352E] active:translate-y-0.5 transition-all cursor-pointer"
                        >
                          Sửa ✏️
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
