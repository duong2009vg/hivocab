// src/components/admin/tabs/AdminReportsTab.jsx
// Trung tâm Đọc log lỗi hệ thống, Phản ánh học viên & Báo sai đáp án
// Cơ chế: Hiển thị chi tiết + Nút "Đã giải quyết" xóa trực tiếp bản ghi khỏi Supabase để tiết kiệm dung lượng
// Cozy Crayon Handcrafted Design System
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient.js';
import { useToast } from '../../../context/ToastContext.jsx';

export function AdminReportsTab() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('system_errors'); // 'system_errors' | 'user_bugs' | 'answer_reports'
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Data lists
  const [errorLogs, setErrorLogs] = useState([]);
  const [bugReports, setBugReports] = useState([]);
  const [answerReports, setAnswerReports] = useState([]);

  // Expanded stack traces map: { [logId]: boolean }
  const [expandedStacks, setExpandedStacks] = useState({});

  // Bulk Selection State for currently active tab
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Clear selections on tab switch
  useEffect(() => {
    setSelectedIds(new Set());
    setSearchTerm('');
  }, [activeTab]);

  // ──────────────────────────────────────────────
  // 1. Fetch Data
  // ──────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'system_errors') {
        const { data, error } = await supabase
          .from('system_error_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) throw error;
        setErrorLogs(data || []);
      } else if (activeTab === 'user_bugs') {
        const { data, error } = await supabase
          .from('user_bug_reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setBugReports(data || []);
      } else if (activeTab === 'answer_reports') {
        const { data, error } = await supabase
          .from('answer_reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setAnswerReports(data || []);
      }
    } catch (err) {
      console.error('Error fetching logs/reports:', err);
      showToast(`Lỗi tải dữ liệu: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, showToast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ──────────────────────────────────────────────
  // 2. Action: Resolve & DELETE single item from Database
  // ──────────────────────────────────────────────
  const handleResolveAndDelete = async (id, tableName, itemLabel = 'bản ghi') => {
    if (!window.confirm(`Xác nhận đã giải quyết? Hệ thống sẽ xóa ${itemLabel} này khỏi database để giải phóng dung lượng.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;

      showToast(`Đã giải quyết và xóa ${itemLabel} khỏi database! 🎉`, 'success');

      if (tableName === 'system_error_logs') {
        setErrorLogs((prev) => prev.filter((item) => item.id !== id));
      } else if (tableName === 'user_bug_reports') {
        setBugReports((prev) => prev.filter((item) => item.id !== id));
      } else if (tableName === 'answer_reports') {
        setAnswerReports((prev) => prev.filter((item) => item.id !== id));
      }

      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error('Error resolving report:', err);
      showToast(`Lỗi khi xử lý: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ──────────────────────────────────────────────
  // 3. Batch Action: Resolve & DELETE selected
  // ──────────────────────────────────────────────
  const handleBatchResolveAndDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    const tableName =
      activeTab === 'system_errors'
        ? 'system_error_logs'
        : activeTab === 'user_bugs'
        ? 'user_bug_reports'
        : 'answer_reports';

    const tabLabel =
      activeTab === 'system_errors'
        ? 'log lỗi'
        : activeTab === 'user_bugs'
        ? 'phản ánh học viên'
        : 'báo sai đáp án';

    if (!window.confirm(`Xác nhận đã giải quyết và XÓA VĨNH VIỄN ${count} ${tabLabel} đã chọn khỏi database?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const idsArray = Array.from(selectedIds);
      const { error } = await supabase.from(tableName).delete().in('id', idsArray);
      if (error) throw error;

      showToast(`Đã giải quyết và dọn dẹp ${count} ${tabLabel} thành công! 🎉`, 'success');

      if (tableName === 'system_error_logs') {
        setErrorLogs((prev) => prev.filter((item) => !selectedIds.has(item.id)));
      } else if (tableName === 'user_bug_reports') {
        setBugReports((prev) => prev.filter((item) => !selectedIds.has(item.id)));
      } else if (tableName === 'answer_reports') {
        setAnswerReports((prev) => prev.filter((item) => !selectedIds.has(item.id)));
      }

      setSelectedIds(new Set());
    } catch (err) {
      console.error('Batch resolve error:', err);
      showToast(`Lỗi khi xử lý hàng loạt: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ──────────────────────────────────────────────
  // 4. Global Purge: Clear ALL system_error_logs
  // ──────────────────────────────────────────────
  const handlePurgeAllLogs = async () => {
    if (!window.confirm('CẢNH BÁO: Bạn có chắc muốn DỌN SẠCH TOÀN BỘ log lỗi hệ thống trong CSDL?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('system_error_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      if (error) throw error;

      showToast('Đã dọn sạch toàn bộ log lỗi hệ thống! 🧹', 'success');
      setErrorLogs([]);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Purge error:', err);
      showToast(`Lỗi dọn sạch log: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStack = (id) => {
    setExpandedStacks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyStack = (text) => {
    navigator.clipboard?.writeText(text);
    showToast('Đã sao chép Stack trace vào clipboard!', 'info');
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const currentList = useMemo(() => {
    if (activeTab === 'system_errors') return errorLogs;
    if (activeTab === 'user_bugs') return bugReports;
    return answerReports;
  }, [activeTab, errorLogs, bugReports, answerReports]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return currentList;
    const q = searchTerm.toLowerCase().trim();
    return currentList.filter((item) => {
      const str = JSON.stringify(item).toLowerCase();
      return str.includes(q);
    });
  }, [currentList, searchTerm]);

  const handleToggleSelectAll = () => {
    const allSelected =
      filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredItems.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredItems.forEach((i) => next.add(i.id));
        return next;
      });
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-6 animate-fade-in relative font-nunito text-[#3D352E]">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* TOP SUB-TABS & STATS BAR                                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-[#EADDC7]">
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-full bg-[#FAF5EB] border-2 border-[#3D352E]">
          <button
            onClick={() => setActiveTab('system_errors')}
            className={`px-4 py-2 rounded-full text-xs font-black font-quicksand transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'system_errors'
                ? 'bg-[#DE5D53] text-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                : 'text-[#6E5D53] hover:text-[#3D352E]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>Log Lỗi Hệ Thống ({errorLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('user_bugs')}
            className={`px-4 py-2 rounded-full text-xs font-black font-quicksand transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'user_bugs'
                ? 'bg-[#F4B41A] text-[#3D352E] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                : 'text-[#6E5D53] hover:text-[#3D352E]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">bug_report</span>
            <span>Phản Ánh Học Viên ({bugReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('answer_reports')}
            className={`px-4 py-2 rounded-full text-xs font-black font-quicksand transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'answer_reports'
                ? 'bg-[#557A46] text-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                : 'text-[#6E5D53] hover:text-[#3D352E]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">rule</span>
            <span>Báo Sai Đáp Án ({answerReports.length})</span>
          </button>
        </div>

        {/* Global Purge Button for error logs */}
        {activeTab === 'system_errors' && errorLogs.length > 0 && (
          <button
            onClick={handlePurgeAllLogs}
            disabled={isDeleting}
            className="px-4 py-2 rounded-2xl bg-[#FFF0E6] hover:bg-[#FFE3D4] text-[#DE5D53] text-xs font-black font-quicksand flex items-center gap-1.5 transition-all cursor-pointer border-2 border-[#DE5D53] shadow-[2px_2.5px_0px_#DE5D53] active:translate-y-0.5"
            title="Xóa toàn bộ log lỗi trong database để giải phóng dung lượng"
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            <span>Dọn sạch toàn bộ log ({errorLogs.length}) 🧹</span>
          </button>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SEARCH TOOLBAR & QUICK ACTIONS                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-5 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-[18px] text-[#6E5D53]">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm theo nội dung lỗi, URL, email học viên, component..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-bold text-[#3D352E] focus:ring-2 focus:ring-[#557A46] focus:outline-none placeholder:text-[#8C7A6B]/60"
          />
        </div>

        <div className="flex items-center gap-3 justify-between sm:justify-end text-xs">
          <span className="text-[#6E5D53] font-bold">
            Hiển thị <strong className="text-[#3D352E] font-black font-mono">{filteredItems.length}</strong> / {currentList.length} bản ghi
          </span>

          <button
            onClick={fetchAllData}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-[#FAF5EB] hover:bg-[#F2ECE0] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-[#3D352E] transition-all flex items-center justify-center cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* STICKY BATCH RESOLVE BAR (HIỂN THỊ KHI TÍCH CHỌN)            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedCount > 0 && (
        <div className="sticky top-4 z-30 p-4 rounded-3xl bg-[#FFF9EE] text-[#3D352E] shadow-[4px_5px_0px_#3D352E] border-2 border-[#3D352E] flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#557A46] text-white border-2 border-[#3D352E] font-black text-xs flex items-center justify-center shadow-[1.5px_2px_0px_#3D352E]">
              {selectedCount}
            </span>
            <div>
              <div className="text-xs font-black font-quicksand text-[#3D352E]">
                Đã chọn <span className="text-[#557A46] font-black">{selectedCount}</span> bản ghi
              </div>
              <div className="text-[11px] font-bold text-[#6E5D53]">
                Nhấn giải quyết để xóa vĩnh viễn khỏi database và giải phóng dung lượng
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchResolveAndDelete}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-2xl bg-[#557A46] hover:bg-[#466638] text-white font-black text-xs flex items-center gap-1.5 border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Đã giải quyết & Xóa ({selectedCount}) 🎉</span>
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#FAF5EB] border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] text-[#3D352E] text-xs font-bold transition-all cursor-pointer"
            >
              Hủy chọn
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DATA CONTENT VIEW                                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {loading && currentList.length === 0 ? (
          <div className="py-16 text-center text-[#6E5D53] flex flex-col items-center gap-2 bg-white rounded-3xl border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E]">
            <span className="material-symbols-outlined text-[#557A46] text-[32px] animate-spin">
              refresh
            </span>
            <span className="text-xs font-bold">Đang tải dữ liệu từ CSDL...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center text-[#6E5D53] bg-white rounded-3xl border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] space-y-2">
            <div className="text-4xl mb-2">🎉</div>
            <h4 className="font-black text-base font-quicksand text-[#3D352E]">
              Không có bản ghi nào cần xử lý!
            </h4>
            <p className="text-xs font-bold text-[#6E5D53] max-w-md mx-auto">
              {activeTab === 'system_errors'
                ? 'Hệ thống đang hoạt động hoàn toàn ổn định, không có log lỗi runtime nào tồn đọng.'
                : activeTab === 'user_bugs'
                ? 'Tất cả phản ánh từ học viên đã được giải quyết và dọn dẹp sạch sẽ.'
                : 'Không có báo sai đáp án nào từ phòng thi THPT.'}
            </p>
          </div>
        ) : (
          <>
            {/* Header with Master Select All */}
            <div className="px-5 py-3 bg-[#FAF5EB] rounded-2xl border-2 border-[#3D352E] flex items-center justify-between text-xs text-[#6E5D53] font-bold">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={
                    filteredItems.length > 0 &&
                    filteredItems.every((i) => selectedIds.has(i.id))
                  }
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded border-2 border-[#3D352E] accent-[#557A46] cursor-pointer"
                />
                <span className="text-[#3D352E] font-black">Chọn tất cả ({filteredItems.length} mục)</span>
              </label>

              <span className="text-[11px] text-[#6E5D53] font-mono font-bold">
                Bấm "Đã giải quyết" trên từng dòng để xóa khỏi database
              </span>
            </div>

            {/* List Cards for system_errors */}
            {activeTab === 'system_errors' && (
              <div className="space-y-3">
                {filteredItems.map((log) => {
                  const isSelected = selectedIds.has(log.id);
                  const isExpanded = Boolean(expandedStacks[log.id]);

                  return (
                    <div
                      key={log.id}
                      className={`p-5 rounded-3xl border-2 border-[#3D352E] transition-all ${
                        isSelected
                          ? 'bg-[#FFF0E6] shadow-[4px_5px_0px_#DE5D53]'
                          : 'bg-white shadow-[3px_3.5px_0px_#3D352E] hover:bg-[#FFFDF9]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(log.id)}
                            className="w-4 h-4 mt-1 rounded border-2 border-[#3D352E] accent-[#DE5D53] cursor-pointer shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFF0E6] text-[#DE5D53] border-2 border-[#DE5D53]">
                                {log.component || 'App Runtime'}
                              </span>

                              {log.user_email && (
                                <span className="text-xs font-bold text-[#3D352E] flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px] text-[#6E5D53]">person</span>
                                  <span>{log.user_email}</span>
                                </span>
                              )}

                              <span className="text-[11px] text-[#6E5D53] font-mono font-bold">
                                • {formatDate(log.created_at)}
                              </span>
                            </div>

                            {/* Error Message */}
                            <p className="font-mono text-xs font-bold text-[#DE5D53] break-words leading-relaxed">
                              {log.error_message}
                            </p>

                            {/* URL if any */}
                            {log.url && (
                              <p className="text-[11px] font-mono text-[#6E5D53] truncate mt-1">
                                URL: {log.url}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action: Resolve & DELETE */}
                        <div className="flex items-center gap-2 shrink-0">
                          {log.error_stack && (
                            <button
                              onClick={() => toggleStack(log.id)}
                              className="px-3 py-1.5 rounded-xl bg-[#FAF5EB] hover:bg-[#F2ECE0] border-2 border-[#3D352E] text-xs font-bold text-[#3D352E] transition-all flex items-center gap-1 cursor-pointer"
                              title="Xem Stack Trace chi tiết"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                {isExpanded ? 'expand_less' : 'code'}
                              </span>
                              <span className="hidden sm:inline">
                                {isExpanded ? 'Thu gọn' : 'Stack'}
                              </span>
                            </button>
                          )}

                          <button
                            onClick={() =>
                              handleResolveAndDelete(log.id, 'system_error_logs', 'log lỗi')
                            }
                            disabled={isDeleting}
                            className="px-3.5 py-1.5 rounded-xl bg-[#557A46] hover:bg-[#466638] text-white text-xs font-black flex items-center gap-1.5 border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
                            title="Xác nhận đã giải quyết và xóa log khỏi database để tiết kiệm dung lượng"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Đã giải quyết</span>
                          </button>
                        </div>
                      </div>

                      {/* Stack Trace Box */}
                      {isExpanded && log.error_stack && (
                        <div className="mt-3 p-3.5 rounded-2xl bg-[#2D2620] text-[#FAF5EB] text-[11px] font-mono leading-relaxed overflow-x-auto relative animate-fade-in border-2 border-[#3D352E]">
                          <button
                            onClick={() => handleCopyStack(log.error_stack)}
                            className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[12px]">content_copy</span>
                            <span>Copy</span>
                          </button>
                          <pre className="whitespace-pre-wrap">{log.error_stack}</pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* List for user_bugs */}
            {activeTab === 'user_bugs' && (
              <div className="space-y-3">
                {filteredItems.map((report) => {
                  const isSelected = selectedIds.has(report.id);

                  return (
                    <div
                      key={report.id}
                      className={`p-5 rounded-3xl border-2 border-[#3D352E] transition-all ${
                        isSelected
                          ? 'bg-[#FFF9EE] shadow-[4px_5px_0px_#F4B41A]'
                          : 'bg-white shadow-[3px_3.5px_0px_#3D352E] hover:bg-[#FFFDF9]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(report.id)}
                            className="w-4 h-4 mt-1 rounded border-2 border-[#3D352E] accent-[#F4B41A] cursor-pointer shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFF9EE] text-[#D9822B] border-2 border-[#D9822B]">
                                {report.report_type || 'Phản ánh'}
                              </span>

                              {report.feature_context && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FAF5EB] text-[#3D352E] border border-[#3D352E]">
                                  {report.feature_context}
                                </span>
                              )}

                              <span className="text-xs font-bold text-[#3D352E] flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px] text-[#6E5D53]">person</span>
                                <span>{report.user_email || 'Khách vãng lai'}</span>
                              </span>

                              <span className="text-[11px] text-[#6E5D53] font-mono font-bold">
                                • {formatDate(report.created_at)}
                              </span>
                            </div>

                            {/* Problem description */}
                            <p className="text-xs text-[#3D352E] font-bold leading-relaxed mb-2 whitespace-pre-wrap">
                              {report.description}
                            </p>

                            {/* Device & Context Info */}
                            {report.device_info && (
                              <div className="text-[11px] text-[#6E5D53] font-mono flex flex-wrap gap-2">
                                <span>Thiết bị: {JSON.stringify(report.device_info)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Button: Đã giải quyết & Xóa khỏi DB */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              handleResolveAndDelete(
                                report.id,
                                'user_bug_reports',
                                'phản ánh học viên'
                              )
                            }
                            disabled={isDeleting}
                            className="px-3.5 py-1.5 rounded-xl bg-[#557A46] hover:bg-[#466638] text-white text-xs font-black flex items-center gap-1.5 border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
                            title="Xác nhận đã xử lý và xóa khỏi database để tiết kiệm dung lượng"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Đã giải quyết</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List for answer_reports */}
            {activeTab === 'answer_reports' && (
              <div className="space-y-3">
                {filteredItems.map((r) => {
                  const isSelected = selectedIds.has(r.id);

                  return (
                    <div
                      key={r.id}
                      className={`p-5 rounded-3xl border-2 border-[#3D352E] transition-all ${
                        isSelected
                          ? 'bg-[#EAF3E7] shadow-[4px_5px_0px_#557A46]'
                          : 'bg-white shadow-[3px_3.5px_0px_#3D352E] hover:bg-[#FFFDF9]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(r.id)}
                            className="w-4 h-4 mt-1 rounded border-2 border-[#3D352E] accent-[#557A46] cursor-pointer shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FAF5EB] text-[#3D352E] border-2 border-[#3D352E]">
                                Đề thi: {r.exam_id}
                              </span>

                              <span className="text-xs font-black font-quicksand text-[#3D352E]">
                                Câu {r.question_number}
                              </span>

                              <span className="text-[11px] text-[#6E5D53] font-mono font-bold">
                                • {formatDate(r.created_at)}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs mb-1.5 font-bold">
                              <span>
                                Đáp án hệ thống: <strong className="font-mono text-[#DE5D53]">{r.system_answer || '?'}</strong>
                              </span>
                              <span>➔</span>
                              <span>
                                Học sinh phản ánh: <strong className="font-mono text-[#557A46]">{r.reported_answer}</strong>
                              </span>
                            </div>

                            {r.note && (
                              <p className="text-xs text-[#6E5D53] italic">
                                Ghi chú: "{r.note}"
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleResolveAndDelete(r.id, 'answer_reports', 'báo sai đáp án')
                          }
                          disabled={isDeleting}
                          className="px-3.5 py-1.5 rounded-xl bg-[#557A46] hover:bg-[#466638] text-white text-xs font-black flex items-center gap-1.5 border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                          title="Xác nhận đã xử lý đáp án và xóa báo cáo khỏi database"
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          <span>Đã giải quyết</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminReportsTab;
