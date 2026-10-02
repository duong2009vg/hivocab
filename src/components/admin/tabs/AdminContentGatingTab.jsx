// src/components/admin/tabs/AdminContentGatingTab.jsx
// Control Content Gating (PRO vs Free) across Topics, THPT Exams & Cambridge Passages
// Features: Individual Toggle, Bulk Checkbox Selection, Quick Status Filters & Batch PRO Operations
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient.js';
import { useToast } from '../../../context/ToastContext.jsx';

export function AdminContentGatingTab() {
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState('topics'); // 'topics' | 'thpt' | 'passages'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pro' | 'free'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);

  const selectAllRef = useRef(null);

  // Clear selection when subtab or status filter changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [subTab]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      if (subTab === 'topics') {
        const { data, error } = await supabase
          .from('topics')
          .select('id, name, icon, is_pro, created_at, category, words(count)')
          .order('name', { ascending: true });
        if (error) throw error;
        const mapped = (data || []).map((t) => ({
          ...t,
          word_count: t.words?.[0]?.count || 0,
        }));
        setItems(mapped);
      } else if (subTab === 'thpt') {
        const { data, error } = await supabase
          .from('thpt_exams')
          .select('id, title, year, total_questions, duration_minutes, is_pro, created_at')
          .order('id', { ascending: true });
        if (error) throw error;
        const mapped = (data || []).map((e) => ({
          ...e,
          name: e.title,
        }));
        setItems(mapped);
      } else if (subTab === 'passages') {
        const { data, error } = await supabase
          .from('passages')
          .select('id, title, test_id, passage_number, is_pro, created_at')
          .order('title', { ascending: true });
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

  // Filtered items based on search and status
  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return items.filter((item) => {
      const text = (item.name || item.title || '').toLowerCase();
      const matchSearch = text.includes(q) || String(item.id || '').toLowerCase().includes(q);
      if (!matchSearch) return false;

      if (statusFilter === 'pro') return Boolean(item.is_pro);
      if (statusFilter === 'free') return !Boolean(item.is_pro);
      return true;
    });
  }, [items, searchTerm, statusFilter]);

  // Handle master checkbox indeterminate state
  useEffect(() => {
    if (!selectAllRef.current) return;
    const filteredCount = filteredItems.length;
    const selectedInFiltered = filteredItems.filter((i) => selectedIds.has(i.id)).length;

    if (selectedInFiltered === 0) {
      selectAllRef.current.checked = false;
      selectAllRef.current.indeterminate = false;
    } else if (selectedInFiltered === filteredCount) {
      selectAllRef.current.checked = true;
      selectAllRef.current.indeterminate = false;
    } else {
      selectAllRef.current.checked = false;
      selectAllRef.current.indeterminate = true;
    }
  }, [filteredItems, selectedIds]);

  // Toggle selection for an individual item
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Master toggle: select/deselect all in current filtered view
  const handleToggleSelectAll = () => {
    const allSelected = filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id));
    if (allSelected) {
      // Deselect all filtered items
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredItems.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      // Select all filtered items
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredItems.forEach((i) => next.add(i.id));
        return next;
      });
    }
  };

  // Quick Select Helper: Select all Free items in current view
  const handleSelectAllFree = () => {
    const freeItems = filteredItems.filter((i) => !Boolean(i.is_pro));
    setSelectedIds(new Set(freeItems.map((i) => i.id)));
    showToast(`Đã chọn ${freeItems.length} mục Miễn phí.`, 'info');
  };

  // Quick Select Helper: Select all PRO items in current view
  const handleSelectAllPro = () => {
    const proItems = filteredItems.filter((i) => Boolean(i.is_pro));
    setSelectedIds(new Set(proItems.map((i) => i.id)));
    showToast(`Đã chọn ${proItems.length} mục Khóa PRO.`, 'info');
  };

  // Quick Select Helper: Clear selection
  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // ──────────────────────────────────────────────
  // BATCH ACTION: Set PRO or Free for all selected items
  // ──────────────────────────────────────────────
  const handleBatchSetPro = async (targetIsPro) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const actionText = targetIsPro ? 'KHÓA PRO 🔒' : 'MỞ MIỄN PHÍ 🌐';
    if (!window.confirm(`Bạn có chắc muốn chuyển ${ids.length} mục đã chọn sang trạng thái ${actionText}?`)) {
      return;
    }

    setIsBatchUpdating(true);

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) => (selectedIds.has(item.id) ? { ...item, is_pro: targetIsPro } : item))
    );

    try {
      const table = subTab === 'topics' ? 'topics' : subTab === 'thpt' ? 'thpt_exams' : 'passages';
      const updatePayload = { is_pro: targetIsPro };
      if (table === 'thpt_exams') {
        updatePayload.updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from(table)
        .update(updatePayload)
        .in('id', ids);

      if (error) throw error;

      showToast(`Đã chuyển ${ids.length} mục thành ${actionText}! 🎉`, 'success');
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Batch update error:', err);
      // Revert on error
      fetchItems();
      showToast(`Lỗi thao tác hàng loạt: ${err.message}`, 'error');
    } finally {
      setIsBatchUpdating(false);
    }
  };

  // Single Item Toggle
  const handleTogglePro = async (item) => {
    const nextVal = !Boolean(item.is_pro);
    setTogglingId(item.id);

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_pro: nextVal } : i))
    );

    try {
      const table = subTab === 'topics' ? 'topics' : subTab === 'thpt' ? 'thpt_exams' : 'passages';
      const updatePayload = { is_pro: nextVal };
      if (table === 'thpt_exams') updatePayload.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from(table)
        .update(updatePayload)
        .eq('id', item.id);

      if (error) throw error;
      showToast(`Đã chuyển thành ${nextVal ? 'KHÓA PRO 🔒' : 'MIỄN PHÍ 🌐'}`, 'success');
    } catch (err) {
      console.error('Toggle error:', err);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_pro: !nextVal } : i))
      );
      showToast(`Không thể cập nhật: ${err.message}`, 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const proCount = items.filter((i) => i.is_pro).length;
  const freeCount = items.length - proCount;
  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* SUB TABS & COUNTS SUMMARY                                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-outline-variant/15">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container/60 border border-outline-variant/20">
          <button
            onClick={() => setSubTab('topics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'topics'
                ? 'bg-surface text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Chủ đề Từ vựng ({items && subTab === 'topics' ? items.length : '110'})
          </button>
          <button
            onClick={() => setSubTab('thpt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'thpt'
                ? 'bg-surface text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Đề thi THPT Quốc Gia ({items && subTab === 'thpt' ? items.length : '38'})
          </button>
          <button
            onClick={() => setSubTab('passages')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'passages'
                ? 'bg-surface text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Bài đọc IELTS Cambridge ({items && subTab === 'passages' ? items.length : '444'})
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

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SEARCH, STATUS FILTER & QUICK SELECTION TOOLS                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-surface border border-outline-variant/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder={`Tìm theo tên ${subTab === 'topics' ? 'chủ đề' : subTab === 'thpt' ? 'đề thi' : 'bài đọc'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container/50 border border-outline-variant/20 text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container/50 border border-outline-variant/20 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-surface text-primary shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Tất cả ({items.length})
            </button>
            <button
              onClick={() => setStatusFilter('pro')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                statusFilter === 'pro'
                  ? 'bg-surface text-amber-600 shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>PRO ({proCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('free')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                statusFilter === 'free'
                  ? 'bg-surface text-emerald-600 shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">public</span>
              <span>Free ({freeCount})</span>
            </button>
          </div>
        </div>

        {/* Quick Selection Helpers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-on-surface-variant mr-1">Tích chọn nhanh:</span>
          <button
            onClick={handleSelectAllFree}
            className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-outline-variant/20 transition-all flex items-center gap-1"
            title="Chọn toàn bộ các mục đang Miễn phí để chuẩn bị khóa PRO"
          >
            <span className="material-symbols-outlined text-[14px]">checklist</span>
            <span>Tất cả Miễn phí ({freeCount})</span>
          </button>
          <button
            onClick={handleSelectAllPro}
            className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-[11px] font-bold text-amber-700 dark:text-amber-400 border border-outline-variant/20 transition-all flex items-center gap-1"
            title="Chọn toàn bộ các mục đang khóa PRO để chuẩn bị mở Miễn phí"
          >
            <span className="material-symbols-outlined text-[14px]">checklist</span>
            <span>Tất cả PRO ({proCount})</span>
          </button>
          {selectedCount > 0 && (
            <button
              onClick={handleClearSelection}
              className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-bold transition-all"
            >
              Bỏ chọn
            </button>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FLOATING BATCH ACTION BAR (HIỂN THỊ KHI CÓ MỤC ĐƯỢC CHỌN)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedCount > 0 && (
        <div className="sticky top-4 z-30 p-3.5 rounded-2xl bg-neutral-900 dark:bg-neutral-800 text-white shadow-xl border border-white/10 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-primary text-white font-black text-xs flex items-center justify-center">
              {selectedCount}
            </span>
            <div>
              <div className="text-xs font-bold">
                Đã tích chọn <span className="text-primary-cont font-black">{selectedCount}</span> / {items.length} {subTab === 'topics' ? 'chủ đề' : subTab === 'thpt' ? 'đề thi' : 'bài đọc'}
              </div>
              <div className="text-[11px] text-neutral-400">
                Thực hiện hành động khóa hoặc mở gói PRO cho toàn bộ mục đã chọn
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Batch Lock PRO button */}
            <button
              onClick={() => handleBatchSetPro(true)}
              disabled={isBatchUpdating}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span>Khóa PRO hàng loạt ({selectedCount})</span>
            </button>

            {/* Batch Open Free button */}
            <button
              onClick={() => handleBatchSetPro(false)}
              disabled={isBatchUpdating}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">lock_open</span>
              <span>Mở Miễn Phí ({selectedCount})</span>
            </button>

            {/* Cancel Selection button */}
            <button
              onClick={handleClearSelection}
              disabled={isBatchUpdating}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
            >
              Hủy chọn
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* CONTENT LIST TABLE WITH CHECKBOXES                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-outline-variant/20 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-16 text-center text-on-surface-variant flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px] animate-spin">
              refresh
            </span>
            <span className="text-xs">Đang tải danh sách học liệu...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container/40 border-b border-outline-variant/15 text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  {/* Master Checkbox */}
                  <th className="py-3 px-4 w-12 text-center">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      onChange={handleToggleSelectAll}
                      title="Chọn / Bỏ chọn tất cả trong danh sách hiện tại"
                      className="w-4 h-4 rounded border-outline-variant/40 text-primary focus:ring-primary cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">TÊN HỌC LIỆU</th>
                  <th className="py-3 px-4">QUY MÔ</th>
                  <th className="py-3 px-4">TRẠNG THÁI HIỆN TẠI</th>
                  <th className="py-3 px-4 text-right">CHUYỂN ĐỔI (KHÓA PRO)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-on-surface-variant">
                      Không tìm thấy nội dung nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isPro = Boolean(item.is_pro);
                    const isSelected = selectedIds.has(item.id);
                    const title = item.name || item.title || 'Không có tên';
                    const icon = item.icon || (subTab === 'thpt' ? 'school' : 'menu_book');

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-primary/5 hover:bg-primary/10'
                            : 'hover:bg-surface-container/30'
                        }`}
                      >
                        {/* Row Checkbox */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item.id)}
                            className="w-4 h-4 rounded border-outline-variant/40 text-primary focus:ring-primary cursor-pointer"
                          />
                        </td>

                        {/* Title & Icon */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg shrink-0">{icon}</span>
                            <span
                              className="font-bold text-on-surface max-w-[340px] truncate cursor-pointer hover:text-primary transition-colors"
                              title={title}
                              onClick={() => handleToggleSelect(item.id)}
                            >
                              {title}
                            </span>
                          </div>
                        </td>

                        {/* Scale / Word count / Questions */}
                        <td className="py-3.5 px-4 text-on-surface-variant font-mono">
                          {subTab === 'topics' && `${item.word_count || 0} từ vựng`}
                          {subTab === 'thpt' &&
                            `${item.total_questions || 40} câu hỏi (${item.year || '2026'})`}
                          {subTab === 'passages' && `Đoạn ${item.passage_number || 1}`}
                        </td>

                        {/* Current Status Badge */}
                        <td className="py-3.5 px-4">
                          {isPro ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <span className="material-symbols-outlined text-[13px]">lock</span>
                              <span>DÀNH CHO PRO</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <span className="material-symbols-outlined text-[13px]">public</span>
                              <span>MIỄN PHÍ</span>
                            </span>
                          )}
                        </td>

                        {/* Individual Toggle Switch */}
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
