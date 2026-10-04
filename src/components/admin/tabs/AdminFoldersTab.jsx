// src/components/admin/tabs/AdminFoldersTab.jsx
// Quản lý Thư mục & Khóa học Public trong Hệ thống HiVocab (Admin Studio)
// Cho phép xem, tạo mới và XÓA vĩnh viễn các thư mục public (CAM, Destination, IELTS, THPT, v.v.)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { deleteFolderCascade, deleteTopicCascade } from '../../../services/db.js';
import { getCategoryIcon } from '../../../hooks/useTopics.js';

export function AdminFoldersTab() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [deletingFolder, setDeletingFolder] = useState(null);
  const [deletingTopicId, setDeletingTopicId] = useState(null);

  // Modal Create Folder
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    categoryName: '',
    topicName: '',
    icon: '📁',
    isPro: false,
  });
  const [isCreating, setIsCreating] = useState(false);

  // 1. Fetch Topics & Categories from Supabase
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('id, name, icon, is_pro, is_public, category, words(count)')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map((t) => ({
        ...t,
        category: (t.category || 'general').trim(),
        word_count: t.words?.[0]?.count || 0,
      }));

      setTopics(mapped);
    } catch (err) {
      console.error('[AdminFoldersTab] Load error:', err);
      showToast(`Lỗi tải dữ liệu thư mục: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Group into Folders
  const folders = useMemo(() => {
    const map = new Map();

    topics.forEach((t) => {
      const cat = t.category || 'Chung';
      if (!map.has(cat)) {
        map.set(cat, {
          name: cat,
          topics: [],
          wordCount: 0,
          proCount: 0,
        });
      }
      const f = map.get(cat);
      f.topics.push(t);
      f.wordCount += t.word_count || 0;
      if (t.is_pro) f.proCount++;
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [topics]);

  // Filtered Folders based on search
  const filteredFolders = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return folders;
    return folders.filter((f) => {
      const matchName = f.name.toLowerCase().includes(q);
      const matchTopic = f.topics.some((t) => t.name.toLowerCase().includes(q));
      return matchName || matchTopic;
    });
  }, [folders, searchTerm]);

  // Overall Stats
  const stats = useMemo(() => {
    return {
      totalFolders: folders.length,
      totalTopics: topics.length,
      totalWords: folders.reduce((sum, f) => sum + f.wordCount, 0),
    };
  }, [folders, topics]);

  // Toggle Folder expand
  const toggleExpand = (folderName) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  // 3. Delete Entire Public Folder
  const handleDeleteFolder = async (folder) => {
    const promptMsg =
      `⚠️ CẢNH BÁO QUẢN TRỊ VIÊN:\n\n` +
      `Bạn có chắc chắn muốn xóa TOÀN BỘ thư mục public "${folder.name}" không?\n` +
      `• Thư mục gồm: ${folder.topics.length} chủ đề và ${folder.wordCount.toLocaleString()} từ vựng.\n` +
      `• Tất cả các chủ đề, bài đọc và từ vựng thuộc thư mục này trong cơ sở dữ liệu Supabase sẽ bị XÓA VĨNH VIỄN!\n\n` +
      `Nhấn OK để xác nhận xóa.`;

    if (!window.confirm(promptMsg)) return;

    setDeletingFolder(folder.name);
    try {
      await deleteFolderCascade(folder.name);
      showToast(`Đã xóa vĩnh viễn thư mục public "${folder.name}" thành công! 🎉`, 'success');
      await loadData();
    } catch (err) {
      console.error('[AdminFoldersTab] Delete folder error:', err);
      showToast(`Lỗi khi xóa thư mục: ${err.message}`, 'error');
    } finally {
      setDeletingFolder(null);
    }
  };

  // 4. Delete Single Topic in Folder
  const handleDeleteTopic = async (topic, folderName) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa chủ đề "${topic.name}" (${topic.word_count || 0} từ vựng) khỏi thư mục "${folderName}" không?`
      )
    ) {
      return;
    }

    setDeletingTopicId(topic.id);
    try {
      await deleteTopicCascade(topic.id);
      showToast(`Đã xóa chủ đề "${topic.name}" thành công!`, 'success');
      await loadData();
    } catch (err) {
      console.error('[AdminFoldersTab] Delete topic error:', err);
      showToast(`Lỗi khi xóa chủ đề: ${err.message}`, 'error');
    } finally {
      setDeletingTopicId(null);
    }
  };

  // 5. Create New Folder / Category
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    const catName = createForm.categoryName.trim();
    const topName = createForm.topicName.trim() || `Bài 1 - ${catName}`;
    if (!catName) {
      showToast('Vui lòng nhập tên thư mục!', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from('topics').insert({
        name: topName,
        category: catName,
        icon: createForm.icon || '📁',
        is_pro: createForm.isPro,
        is_public: true,
      });

      if (error) throw error;

      showToast(`Đã tạo thư mục public "${catName}" thành công! 🎉`, 'success');
      setIsCreateOpen(false);
      setCreateForm({
        categoryName: '',
        topicName: '',
        icon: '📁',
        isPro: false,
      });
      await loadData();
    } catch (err) {
      console.error('[AdminFoldersTab] Create folder error:', err);
      showToast(`Lỗi khi tạo thư mục: ${err.message}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-nunito text-[#3D352E]">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* HEADER & METRIC SUMMARY STRIP                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black font-quicksand text-[#3D352E]">
                Quản lý Thư mục & Khóa học Public 📁
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#EAF3E7] text-[#557A46] border border-[#8FB383]">
                Hệ thống Public
              </span>
            </div>
            <p className="text-xs font-semibold text-[#86756C] mt-1">
              Xem toàn bộ các thư mục công khai (CAM, Destination, IELTS, THPT...) và xóa vĩnh viễn các thư mục public nếu cần.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-2xl bg-[#D96B43] hover:bg-[#C25832] text-white text-xs font-black flex items-center gap-1.5 border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer"
            >
              <span>➕</span>
              <span>Tạo thư mục mới</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-2xl bg-[#FAF5EB] hover:bg-[#F2ECE0] text-[#3D352E] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] transition active:translate-y-0.5 disabled:opacity-50 cursor-pointer"
              title="Tải lại danh sách"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin text-[#DE5D53]' : ''}`}>
                refresh
              </span>
            </button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t-2 border-[#FAF5EB]">
          <div className="p-3.5 rounded-2xl bg-[#FAF5EB] border-2 border-[#3D352E] shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8DEC8] border border-[#3D352E] flex items-center justify-center text-xl shrink-0">
              📁
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#86756C] uppercase">Tổng Thư mục Public</div>
              <div className="text-lg font-black font-quicksand text-[#3D352E]">{stats.totalFolders} thư mục</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF5EB] border-2 border-[#3D352E] shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF3E7] border border-[#8FB383] text-[#557A46] flex items-center justify-center text-xl shrink-0">
              📚
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#86756C] uppercase">Tổng Chủ đề con</div>
              <div className="text-lg font-black font-quicksand text-[#3D352E]">{stats.totalTopics} chủ đề</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF5EB] border-2 border-[#3D352E] shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEEFEA] border border-[#DE5D53] text-[#DE5D53] flex items-center justify-center text-xl shrink-0">
              🔤
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#86756C] uppercase">Tổng Từ vựng liên kết</div>
              <div className="text-lg font-black font-quicksand text-[#3D352E]">{stats.totalWords.toLocaleString()} từ</div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SEARCH BAR                                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E]">
        <div className="relative">
          <span className="material-symbols-outlined text-[18px] text-[#86756C] absolute left-3 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên thư mục hoặc tên chủ đề con..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#FAF5EB] border-2 border-[#3D352E] text-xs font-bold text-[#3D352E] placeholder:text-[#86756C]/70 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#557A46]"
          />
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FOLDERS LIST                                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center text-[#86756C] flex flex-col items-center gap-3 bg-white rounded-3xl border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E]">
          <span className="material-symbols-outlined text-[#DE5D53] text-[36px] animate-spin">
            refresh
          </span>
          <span className="text-sm font-bold">Đang tải danh sách thư mục public...</span>
        </div>
      ) : filteredFolders.length === 0 ? (
        <div className="py-16 text-center text-[#86756C] bg-white rounded-3xl border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] p-6 space-y-2">
          <div className="text-4xl">📂</div>
          <div className="text-base font-black text-[#3D352E]">Không tìm thấy thư mục nào phù hợp</div>
          <p className="text-xs">Hãy thử đổi từ khóa tìm kiếm hoặc tạo một thư mục mới.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFolders.map((folder) => {
            const isExpanded = Boolean(expandedFolders[folder.name]);
            const isDeleting = deletingFolder === folder.name;
            const icon = getCategoryIcon(folder.name);

            return (
              <div
                key={folder.name}
                className="rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] overflow-hidden transition-all"
              >
                {/* Folder Header Row */}
                <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 bg-[#FFFDF9]">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#F7F0DE] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center text-2xl shrink-0">
                      {folder.name.toUpperCase().startsWith('CAM')
                        ? '🎓'
                        : folder.name.toUpperCase().includes('THPT')
                        ? '🏛️'
                        : folder.name.toUpperCase().includes('DESTINATION')
                        ? '📖'
                        : '📁'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-quicksand font-black text-base text-[#3D352E] truncate">
                          {folder.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#EAF3E7] text-[#557A46] border border-[#8FB383]">
                          PUBLIC
                        </span>
                        {folder.proCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FEEFEA] text-[#DE5D53] border border-[#DE5D53]">
                            🔒 {folder.proCount} PRO
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs font-bold text-[#86756C] mt-1">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">auto_stories</span>
                          {folder.topics.length} chủ đề con
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">translate</span>
                          {folder.wordCount.toLocaleString()} từ vựng
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Folder Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleExpand(folder.name)}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF5EB] hover:bg-[#F2ECE0] text-[#3D352E] border-2 border-[#3D352E] text-xs font-black shadow-2xs flex items-center gap-1 transition active:translate-y-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                      <span>{isExpanded ? 'Thu gọn' : `Xem (${folder.topics.length})`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteFolder(folder)}
                      disabled={isDeleting}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-black flex items-center gap-1.5 transition active:translate-y-0.5 disabled:opacity-50 cursor-pointer"
                      title={`Xóa vĩnh viễn thư mục public "${folder.name}" và toàn bộ chủ đề/từ vựng bên trong`}
                    >
                      {isDeleting ? (
                        <>
                          <span className="material-symbols-outlined text-[15px] animate-spin">refresh</span>
                          <span>Đang xóa...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                          <span>Xóa Thư mục</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Topics Table */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-white border-t-2 border-[#DECDBB] space-y-3 animate-fade-in">
                    <div className="text-[11px] font-black uppercase text-[#86756C] tracking-wider">
                      Danh sách các chủ đề trong thư mục "{folder.name}" ({folder.topics.length}):
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {folder.topics.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 rounded-2xl bg-[#FAF5EB] border-2 border-[#3D352E] shadow-2xs flex items-center justify-between gap-2.5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">{t.icon || '📖'}</span>
                            <div className="min-w-0">
                              <div className="text-xs font-black text-[#3D352E] truncate" title={t.name}>
                                {t.name}
                              </div>
                              <div className="text-[10px] font-bold text-[#86756C] mt-0.5">
                                {t.word_count || 0} từ • {t.is_pro ? '🔒 PRO' : '🌐 Free'}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteTopic(t, folder.name)}
                            disabled={deletingTopicId === t.id}
                            className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-500 border border-[#3D352E] shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                            title={`Xóa chủ đề "${t.name}"`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {deletingTopicId === t.id ? 'refresh' : 'delete'}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL CREATE FOLDER                                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border-2 border-[#3D352E] shadow-[4px_6px_0px_#3D352E] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#FAF5EB]">
              <div className="flex items-center gap-2">
                <span className="text-xl">📁</span>
                <h3 className="font-quicksand font-black text-lg text-[#3D352E]">
                  Tạo Thư mục Public mới
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF5EB] hover:bg-[#F2ECE0] text-[#3D352E] border-2 border-[#3D352E] font-black text-sm flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-[#6E5D53] uppercase mb-1">
                  Tên Thư mục / Danh mục (Category) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: IELTS Speaking 2026, Từ vựng Nâng cao..."
                  value={createForm.categoryName}
                  onChange={(e) => setCreateForm({ ...createForm, categoryName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF5EB] border-2 border-[#3D352E] text-xs font-bold text-[#3D352E] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#557A46]"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#6E5D53] uppercase mb-1">
                  Tên Chủ đề đầu tiên (Topic Name)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bài 1: Introduction, Test 1..."
                  value={createForm.topicName}
                  onChange={(e) => setCreateForm({ ...createForm, topicName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF5EB] border-2 border-[#3D352E] text-xs font-bold text-[#3D352E] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#557A46]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#6E5D53] uppercase mb-1">
                    Icon biểu tượng
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={createForm.icon}
                    onChange={(e) => setCreateForm({ ...createForm, icon: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF5EB] border-2 border-[#3D352E] text-center text-sm font-bold text-[#3D352E] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#557A46]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#6E5D53] uppercase mb-1">
                    Khóa gói PRO
                  </label>
                  <div className="pt-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createForm.isPro}
                        onChange={(e) => setCreateForm({ ...createForm, isPro: e.target.checked })}
                        className="w-4 h-4 rounded text-[#DE5D53] focus:ring-[#DE5D53] cursor-pointer"
                      />
                      <span className="text-xs font-bold text-[#3D352E]">Yêu cầu PRO</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t-2 border-[#FAF5EB]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#FAF5EB] hover:bg-[#F2ECE0] text-[#3D352E] border-2 border-[#3D352E] text-xs font-black transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-2xl bg-[#D96B43] hover:bg-[#C25832] text-white text-xs font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition disabled:opacity-50 cursor-pointer"
                >
                  {isCreating ? 'Đang tạo...' : 'Tạo Thư mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFoldersTab;
