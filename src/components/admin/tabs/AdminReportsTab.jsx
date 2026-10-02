// src/components/admin/tabs/AdminReportsTab.jsx
// Trung tâm Đọc log lỗi hệ thống, Phản ánh học viên & Báo sai đáp án
// Cơ chế: Hiển thị chi tiết + Nút "Đã giải quyết" xóa trực tiếp bản ghi khỏi Supabase để tiết kiệm dung lượng
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

      // Update local state
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
      console.error('Delete error:', err);
      showToast(`Lỗi khi xóa: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ──────────────────────────────────────────────
  // 3. Action: Batch Resolve & DELETE selected items
  // ──────────────────────────────────────────────
  const handleBatchResolveAndDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

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
        ? 'phản ánh'
        : 'báo sai đáp án';

    if (
      !window.confirm(
        `Xác nhận ĐÃ GIẢI QUYẾT ${ids.length} ${tabLabel} đã chọn? Toàn bộ sẽ bị xóa vĩnh viễn khỏi database để tiết kiệm dung lượng.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase.from(tableName).delete().in('id', ids);
      if (error) throw error;

      showToast(`Đã giải quyết và xóa thành công ${ids.length} ${tabLabel}! 🎉`, 'success');

      if (activeTab === 'system_errors') {
        setErrorLogs((prev) => prev.filter((item) => !selectedIds.has(item.id)));
      } else if (activeTab === 'user_bugs') {
        setBugReports((prev) => prev.filter((item) => !selectedIds.has(item.id)));
      } else if (activeTab === 'answer_reports') {
        setAnswerReports((prev) => prev.filter((item) => !selectedIds.has(item.id)));
      }

      setSelectedIds(new Set());
    } catch (err) {
      console.error('Batch delete error:', err);
      showToast(`Lỗi xóa hàng loạt: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ──────────────────────────────────────────────
  // 4. Action: Purge ALL error logs in database
  // ──────────────────────────────────────────────
  const handlePurgeAllLogs = async () => {
    if (
      !window.confirm(
        `CẢNH BÁO: Bạn có chắc muốn DỌN DẸP SẠCH TOÀN BỘ ${errorLogs.length} log lỗi trong database? Hành động này sẽ giải phóng dung lượng tối đa.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      // Delete all where id is not null
      const { error } = await supabase
        .from('system_error_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      showToast('Đã dọn dẹp sạch toàn bộ log lỗi hệ thống! Database đã được giải phóng dung lượng. 🧹', 'success');
      setErrorLogs([]);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Purge error:', err);
      showToast(`Lỗi dọn dẹp: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle stack trace view
  const toggleStack = (id) => {
    setExpandedStacks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy stack trace to clipboard
  const handleCopyStack = (text) => {
    navigator.clipboard?.writeText(text);
    showToast('Đã sao chép Stack trace vào clipboard!', 'info');
  };

  // Checkbox helpers
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter items based on current tab & search
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
    <div className="space-y-6 animate-fade-in relative">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* TOP SUB-TABS & STATS BAR                                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-outline-variant/15">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container/60 border border-outline-variant/20">
          <button
            onClick={() => setActiveTab('system_errors')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'system_errors'
                ? 'bg-surface text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>Log Lỗi Hệ Thống ({errorLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('user_bugs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'user_bugs'
                ? 'bg-surface text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">bug_report</span>
            <span>Phản Ánh Học Viên ({bugReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('answer_reports')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'answer_reports'
                ? 'bg-surface text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
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
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-rose-500/20"
            title="Xóa toàn bộ log lỗi trong database để giải phóng dung lượng"
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            <span>Dọn sạch toàn bộ log ({errorLogs.length})</span>
          </button>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SEARCH TOOLBAR & QUICK ACTIONS                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-surface border border-outline-variant/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm theo nội dung lỗi, URL, email học viên, component..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container/50 border border-outline-variant/20 text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3 justify-between sm:justify-end text-xs">
          <span className="text-on-surface-variant font-medium">
            Hiển thị <strong className="text-on-surface font-mono">{filteredItems.length}</strong> / {currentList.length} bản ghi
          </span>

          <button
            onClick={fetchAllData}
            disabled={loading}
            className="p-2 rounded-xl border border-outline-variant/20 text-on-surface hover:bg-surface-container transition-all flex items-center justify-center"
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
        <div className="sticky top-4 z-30 p-3.5 rounded-2xl bg-neutral-900 dark:bg-neutral-800 text-white shadow-xl border border-white/10 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
              {selectedCount}
            </span>
            <div>
              <div className="text-xs font-bold">
                Đã chọn <span className="text-emerald-400 font-black">{selectedCount}</span> bản ghi
              </div>
              <div className="text-[11px] text-neutral-400">
                Nhấn giải quyết để xóa vĩnh viễn khỏi database và giải phóng dung lượng
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchResolveAndDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Đã giải quyết & Xóa ({selectedCount})</span>
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              disabled={isDeleting}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
            >
              Hủy chọn
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DATA CONTENT VIEW                                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {loading && currentList.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant flex flex-col items-center gap-2 bg-surface rounded-2xl border border-outline-variant/20">
            <span className="material-symbols-outlined text-primary text-[28px] animate-spin">
              refresh
            </span>
            <span className="text-xs">Đang tải dữ liệu từ database...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center text-on-surface-variant bg-surface rounded-2xl border border-outline-variant/20 space-y-2">
            <span className="material-symbols-outlined text-emerald-500 text-[40px]">
              task_alt
            </span>
            <h4 className="font-bold text-sm text-on-surface">Không có bản ghi nào cần xử lý!</h4>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              {activeTab === 'system_errors'
                ? 'Hệ thống đang hoạt động ổn định, không có log lỗi runtime nào tồn đọng.'
                : activeTab === 'user_bugs'
                ? 'Tất cả phản ánh từ học viên đã được giải quyết và dọn dẹp sạch sẽ.'
                : 'Không có báo sai đáp án nào từ phòng thi THPT.'}
            </p>
          </div>
        ) : (
          <>
            {/* Header with Master Select All */}
            <div className="px-4 py-2 bg-surface-container/30 rounded-xl border border-outline-variant/15 flex items-center justify-between text-xs text-on-surface-variant font-semibold">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={
                    filteredItems.length > 0 &&
                    filteredItems.every((i) => selectedIds.has(i.id))
                  }
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded border-outline-variant/40 text-primary focus:ring-primary cursor-pointer"
                />
                <span>Chọn tất cả ({filteredItems.length} mục)</span>
              </label>

              <span className="text-[11px] text-on-surface-variant font-mono">
                Bấm "Đã giải quyết" trên từng dòng để xóa khỏi database
              </span>
            </div>

            {/* List Cards */}
            {activeTab === 'system_errors' && (
              <div className="space-y-3">
                {filteredItems.map((log) => {
                  const isSelected = selectedIds.has(log.id);
                  const isExpanded = Boolean(expandedStacks[log.id]);

                  return (
                    <div
                      key={log.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-300 dark:border-rose-900 shadow-2xs'
                          : 'bg-surface border-outline-variant/20 hover:border-outline-variant/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Row Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(log.id)}
                            className="w-4 h-4 mt-1 rounded border-outline-variant/40 text-primary focus:ring-primary cursor-pointer shrink-0"
                          />

                          {/* Error Meta */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                                {log.component || 'App Runtime'}
                              </span>

                              {log.user_email && (
                                <span className="text-xs font-semibold text-on-surface flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant">person</span>
                                  <span>{log.user_email}</span>
                                </span>
                              )}

                              <span className="text-[11px] text-on-surface-variant font-mono">
                                • {formatDate(log.created_at)}
                              </span>
                            </div>

                            {/* Error Message */}
                            <p className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 break-words leading-relaxed">
                              {log.error_message}
                            </p>

                            {/* URL if any */}
                            {log.url && (
                              <p className="text-[11px] font-mono text-on-surface-variant/80 truncate mt-0.5">
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
                              className="px-2.5 py-1.5 rounded-xl border border-outline-variant/20 hover:bg-surface-container text-xs font-semibold text-on-surface transition-all flex items-center gap-1"
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
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                            title="Xác nhận đã giải quyết và xóa log khỏi database để tiết kiệm dung lượng"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Đã giải quyết</span>
                          </button>
                        </div>
                      </div>

                      {/* Stack Trace Box */}
                      {isExpanded && log.error_stack && (
                        <div className="mt-3 p-3 rounded-xl bg-neutral-950 text-neutral-200 text-[11px] font-mono leading-relaxed overflow-x-auto relative animate-fade-in border border-neutral-800">
                          <button
                            onClick={() => handleCopyStack(log.error_stack)}
                            className="absolute top-2 right-2 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-sans font-bold flex items-center gap-1"
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
                  const isResolved = report.status === 'resolved';

                  return (
                    <div
                      key={report.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-300 dark:border-amber-900 shadow-2xs'
                          : 'bg-surface border-outline-variant/20 hover:border-outline-variant/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(report.id)}
                            className="w-4 h-4 mt-1 rounded border-outline-variant/40 text-primary focus:ring-primary cursor-pointer shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                                {report.report_type || 'Phản ánh'}
                              </span>

                              {report.feature_context && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-container text-on-surface-variant">
                                  {report.feature_context}
                                </span>
                              )}

                              <span className="text-xs font-semibold text-on-surface flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">person</span>
                                <span>{report.user_email || 'Khách vãng lai'}</span>
                              </span>

                              <span className="text-[11px] text-on-surface-variant font-mono">
                                • {formatDate(report.created_at)}
                              </span>
                            </div>

                            {/* Problem description */}
                            <p className="text-xs text-on-surface font-semibold leading-relaxed mb-2 whitespace-pre-wrap">
                              {report.description}
                            </p>

                            {/* Device & Context Info */}
                            {report.device_info && (
                              <div className="text-[11px] text-on-surface-variant font-mono flex flex-wrap gap-2">
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
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
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
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-2xs'
                          : 'bg-surface border-outline-variant/20 hover:border-outline-variant/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(r.id)}
                            className="w-4 h-4 mt-1 rounded border-outline-variant/40 text-primary focus:ring-primary cursor-pointer shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
                                Đề thi: {r.exam_id}
                              </span>

                              <span className="text-xs font-bold text-on-surface">
                                Câu {r.question_number}
                              </span>

                              <span className="text-[11px] text-on-surface-variant font-mono">
                                • {formatDate(r.created_at)}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs mb-1.5">
                              <span>
                                Đáp án hệ thống: <strong className="font-mono text-rose-600">{r.system_answer || '?'}</strong>
                              </span>
                              <span>➔</span>
                              <span>
                                Học sinh phản ánh: <strong className="font-mono text-emerald-600">{r.reported_answer}</strong>
                              </span>
                            </div>

                            {r.note && (
                              <p className="text-xs text-on-surface-variant italic">
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
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
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
