// src/components/admin/tabs/AdminContentGatingTab.jsx
// Control Content Gating (PRO vs Free) across Topics, THPT Exams & Cambridge Passages
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient.js';
import { useToast } from '../../../context/ToastContext.jsx';

export function AdminContentGatingTab() {
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState('topics'); // 'topics' | 'thpt' | 'passages'
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      if (subTab === 'topics') {
        const { data, error } = await supabase
          .from('topics')
          .select('id, name, icon, is_pro, word_count, created_at')
          .order('name', { ascending: true });
        if (error) throw error;
        setItems(data || []);
      } else if (subTab === 'thpt') {
        const { data, error } = await supabase
          .from('thpt_exams')
          .select('id, name, year, total_questions, is_pro, created_at')
          .order('year', { ascending: false });
        if (error) throw error;
        setItems(data || []);
      } else if (subTab === 'passages') {
        const { data, error } = await supabase
          .from('passages')
          .select('id, title, test_id, passage_number, is_pro, created_at')
          .order('title', { ascending: true })
          .limit(100);
        if (error) throw error;
        setItems(data || []);
      }
    } catch (err) {
      console.error('fetchItems error:', err);
      showToast(`Lỗi tải dữ liệu: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [subTab, showToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleTogglePro = async (item) => {
    const nextVal = !Boolean(item.is_pro);
    setTogglingId(item.id);

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_pro: nextVal } : i))
    );

    try {
      const table = subTab === 'topics' ? 'topics' : subTab === 'thpt' ? 'thpt_exams' : 'passages';
      const { error } = await supabase
        .from(table)
        .update({ is_pro: nextVal })
        .eq('id', item.id);

      if (error) throw error;
      showToast(`Đã chuyển thành ${nextVal ? 'KHÓA PRO 🔒' : 'MIỄN PHÍ 🌐'}`, 'success');
    } catch (err) {
      console.error('Toggle error:', err);
      // Revert
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_pro: !nextVal } : i))
      );
      showToast(`Không thể cập nhật: ${err.message}`, 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const text = (item.name || item.title || '').toLowerCase();
    return text.includes(searchTerm.toLowerCase().trim());
  });

  const proCount = items.filter((i) => i.is_pro).length;
  const freeCount = items.length - proCount;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-outline-variant/15">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container/60 border border-outline-variant/20">
          <button
            onClick={() => setSubTab('topics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'topics' ? 'bg-surface text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Chủ đề Từ vựng
          </button>
          <button
            onClick={() => setSubTab('thpt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'thpt' ? 'bg-surface text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Đề thi THPT Quốc Gia
          </button>
          <button
            onClick={() => setSubTab('passages')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'passages' ? 'bg-surface text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Bài đọc IELTS Cambridge
          </button>
        </div>

        {/* Counts summary */}
        <div className="flex items-center gap-3 text-xs font-semibold text-on-surface-variant">
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span>{proCount} Khóa PRO</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="material-symbols-outlined text-[16px]">lock_open</span>
            <span>{freeCount} Miễn phí</span>
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Tìm tên nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface border border-outline-variant/20 text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Content List Table */}
      <div className="bg-surface rounded-2xl border border-outline-variant/20 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-16 text-center text-on-surface-variant flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px] animate-spin">refresh</span>
            <span className="text-xs">Đang tải danh sách học liệu...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container/40 border-b border-outline-variant/15 text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">TÊN HỌC LIỆU</th>
                  <th className="py-3 px-4">QUY MÔ</th>
                  <th className="py-3 px-4">TRẠNG THÁI HIỆN TẠI</th>
                  <th className="py-3 px-4 text-right">CHUYỂN ĐỔI (KHÓA PRO)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-on-surface-variant">
                      Không tìm thấy nội dung nào.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isPro = Boolean(item.is_pro);
                    const title = item.name || item.title || 'Không có tên';
                    const icon = item.icon || (subTab === 'thpt' ? 'school' : 'menu_book');

                    return (
                      <tr key={item.id} className="hover:bg-surface-container/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg shrink-0">{icon}</span>
                            <span className="font-bold text-on-surface max-w-[320px] truncate" title={title}>
                              {title}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-on-surface-variant font-mono">
                          {subTab === 'topics' && `${item.word_count || 0} từ vựng`}
                          {subTab === 'thpt' && `${item.total_questions || 40} câu hỏi (${item.year || ''})`}
                          {subTab === 'passages' && `Đoạn ${item.passage_number || 1}`}
                        </td>

                        <td className="py-3.5 px-4">
                          {isPro ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                              <span className="material-symbols-outlined text-[13px]">lock</span>
                              <span>DÀNH CHO PRO</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                              <span className="material-symbols-outlined text-[13px]">public</span>
                              <span>MIỄN PHÍ</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <label className="inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isPro}
                              disabled={togglingId === item.id}
                              onChange={() => handleTogglePro(item)}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                          </label>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminContentGatingTab;
