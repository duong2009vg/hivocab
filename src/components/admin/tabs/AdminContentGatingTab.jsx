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
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-dashed border-[#DECDBB]">
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-2xs">
          <button
            onClick={() => setSubTab('topics')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subTab === 'topics'
                ? 'bg-[#557A46] text-white border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E]'
                : 'text-[#6E5D53] hover:text-[#3D352E]'
            }`}
          >
            Chủ đề Từ vựng ({items && subTab === 'topics' ? items.length : '110'})
          </button>
          <button
            onClick={() => setSubTab('thpt')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subTab === 'thpt'
                ? 'bg-[#557A46] text-white border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E]'
                : 'text-[#6E5D53] hover:text-[#3D352E]'
            }`}
          >
            Đề thi THPT Quốc Gia ({items && subTab === 'thpt' ? items.length : '38'})
          </button>
          <button
            onClick={() => setSubTab('passages')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subTab === 'passages'
                ? 'bg-[#557A46] text-white border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E]'
                : 'text-[#6E5D53] hover:text-[#3D352E]'
            }`}
          >
            Bài đọc IELTS Cambridge ({items && subTab === 'passages' ? items.length : '444'})
          </button>
        </div>

        {/* Counts summary */}
        <div className="flex items-center gap-3 text-xs font-black">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEEFEA] text-[#DE5D53] border border-[#DE5D53]">
            <span>🔒</span>
            <span>{proCount} Khóa PRO</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3E7] text-[#557A46] border border-[#8FB383]">
            <span>🌐</span>
            <span>{freeCount} Miễn phí</span>
          </span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SEARCH, STATUS FILTER & QUICK SELECTION TOOLS                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-3xl bg-[#FFFDF9] border-2 border-[#3D352E] shadow-[3px_3.5px_0px_#3D352E] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-[#86756C]">
              search
            </span>
            <input
              type="text"
              placeholder={`Tìm theo tên ${subTab === 'topics' ? 'chủ đề' : subTab === 'thpt' ? 'đề thi' : 'bài đọc'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white border-2 border-[#3D352E] text-xs font-bold text-[#3D352E] placeholder:text-[#86756C]/70 focus:outline-none focus:ring-2 focus:ring-[#557A46]"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white border-2 border-[#3D352E] text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-xl font-black transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#3D352E] text-white shadow-2xs'
                  : 'text-[#6E5D53] hover:text-[#3D352E]'
              }`}
            >
              Tất cả ({items.length})
            </button>
            <button
              onClick={() => setStatusFilter('pro')}
              className={`px-3 py-1 rounded-xl font-black transition-all flex items-center gap-1 cursor-pointer ${
                statusFilter === 'pro'
                  ? 'bg-[#DE5D53] text-white shadow-2xs'
                  : 'text-[#6E5D53] hover:text-[#3D352E]'
              }`}
            >
              <span>🔒</span>
              <span>PRO ({proCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('free')}
              className={`px-3 py-1 rounded-xl font-black transition-all flex items-center gap-1 cursor-pointer ${
                statusFilter === 'free'
                  ? 'bg-[#557A46] text-white shadow-2xs'
                  : 'text-[#6E5D53] hover:text-[#3D352E]'
              }`}
            >
              <span>🌐</span>
              <span>Free ({freeCount})</span>
            </button>
          </div>
        </div>

        {/* Quick Selection Helpers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-black text-[#86756C] mr-1">Tích chọn nhanh:</span>
          <button
            onClick={handleSelectAllFree}
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#EAF3E7] text-[11px] font-black text-[#557A46] border-2 border-[#3D352E] shadow-2xs active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
            title="Chọn toàn bộ các mục đang Miễn phí để chuẩn bị khóa PRO"
          >
            <span>Tất cả Miễn phí ({freeCount})</span>
          </button>
          <button
            onClick={handleSelectAllPro}
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#FEEFEA] text-[11px] font-black text-[#DE5D53] border-2 border-[#3D352E] shadow-2xs active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
            title="Chọn toàn bộ các mục đang khóa PRO để chuẩn bị mở Miễn phí"
          >
            <span>Tất cả PRO ({proCount})</span>
          </button>
          {selectedCount > 0 && (
            <button
              onClick={handleClearSelection}
              className="px-2 py-1 rounded-xl text-[#DE5D53] hover:bg-[#FEEFEA] text-[11px] font-black transition-all cursor-pointer"
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
        <div className="sticky top-4 z-30 p-3.5 rounded-3xl bg-[#FFF9EE] text-[#3D352E] shadow-[4px_6px_0px_#3D352E] border-2 border-[#3D352E] flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#DE5D53] text-white font-black text-xs flex items-center justify-center border border-[#3D352E] shadow-2xs">
              {selectedCount}
            </span>
            <div>
              <div className="text-xs font-black text-[#3D352E]">
                Đã tích chọn <span className="text-[#DE5D53] font-black">{selectedCount}</span> / {items.length} {subTab === 'topics' ? 'chủ đề' : subTab === 'thpt' ? 'đề thi' : 'bài đọc'}
              </div>
              <div className="text-[11px] font-semibold text-[#86756C]">
                Khóa hoặc mở gói PRO cho toàn bộ mục đã chọn
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Batch Lock PRO button */}
            <button
              onClick={() => handleBatchSetPro(true)}
              disabled={isBatchUpdating}
              className="px-4 py-2 rounded-2xl bg-[#DE5D53] hover:bg-[#C84F45] text-white font-black text-xs flex items-center gap-1.5 border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>🔒</span>
              <span>Khóa PRO hàng loạt ({selectedCount})</span>
            </button>

            {/* Batch Open Free button */}
            <button
              onClick={() => handleBatchSetPro(false)}
              disabled={isBatchUpdating}
              className="px-4 py-2 rounded-2xl bg-[#557A46] hover:bg-[#476739] text-white font-black text-xs flex items-center gap-1.5 border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>🌐</span>
              <span>Mở Miễn Phí ({selectedCount})</span>
            </button>

            {/* Cancel Selection button */}
            <button
              onClick={handleClearSelection}
              disabled={isBatchUpdating}
              className="px-3 py-2 rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#3D352E] border-2 border-[#3D352E] text-xs font-black transition-all cursor-pointer"
            >
              Hủy chọn
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* CONTENT LIST TABLE WITH CHECKBOXES                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#86756C] flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[#DE5D53] text-[28px] animate-spin">
              refresh
            </span>
            <span className="text-xs font-bold">Đang tải danh sách học liệu...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EB] border-b-2 border-[#3D352E] text-[#6E5D53] font-black uppercase tracking-wider text-[11px]">
                <tr>
                  {/* Master Checkbox */}
                  <th className="py-3 px-4 w-12 text-center">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      onChange={handleToggleSelectAll}
                      title="Chọn / Bỏ chọn tất cả trong danh sách hiện tại"
                      className="w-4 h-4 rounded text-[#557A46] focus:ring-[#557A46] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">TÊN HỌC LIỆU</th>
                  <th className="py-3 px-4">QUY MÔ</th>
                  <th className="py-3 px-4">TRẠNG THÁI HIỆN TẠI</th>
                  <th className="py-3 px-4 text-right">CHUYỂN ĐỔI (KHÓA PRO)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DECDBB]">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-[#86756C] font-bold">
                      Không tìm thấy nội dung nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isPro = Boolean(item.is_pro);
                    const isSelected = selectedIds.has(item.id);
                    const title = item.name || item.title || 'Không có tên';
                    const icon = item.icon || (subTab === 'thpt' ? '🎓' : '📖');

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-[#FEF3D6]/40 hover:bg-[#FEF3D6]/60'
                            : 'hover:bg-[#FAF5EB]/50'
                        }`}
                      >
                        {/* Row Checkbox */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item.id)}
                            className="w-4 h-4 rounded text-[#557A46] focus:ring-[#557A46] cursor-pointer"
                          />
                        </td>

                        {/* Title & Icon */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg shrink-0">{icon}</span>
                            <span
                              className="font-black text-[#3D352E] max-w-[340px] truncate cursor-pointer hover:text-[#DE5D53] transition-colors"
                              title={title}
                              onClick={() => handleToggleSelect(item.id)}
                            >
                              {title}
                            </span>
                          </div>
                        </td>

                        {/* Scale / Word count / Questions */}
                        <td className="py-3.5 px-4 text-[#6E5D53] font-bold">
                          {subTab === 'topics' && `${item.word_count || 0} từ vựng`}
                          {subTab === 'thpt' &&
                            `${item.total_questions || 40} câu hỏi (${item.year || '2026'})`}
                          {subTab === 'passages' && `Đoạn ${item.passage_number || 1}`}
                        </td>

                        {/* Current Status Badge */}
                        <td className="py-3.5 px-4">
                          {isPro ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FEEFEA] text-[#DE5D53] border border-[#DE5D53]">
                              <span>🔒</span>
                              <span>DÀNH CHO PRO</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#EAF3E7] text-[#557A46] border border-[#8FB383]">
                              <span>🌐</span>
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
                            <div className="relative w-11 h-6 bg-[#E8DEC8] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[#3D352E]/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#DE5D53] border-2 border-[#3D352E]"></div>
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
