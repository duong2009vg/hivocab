// src/hooks/useTopics.js
// Reactive Hook for Topics & Folders management in pure React
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTopics, getCachedTopics, deleteTopic as apiDeleteTopic, deleteFolderCascade, isUserPro as checkPro } from '../services/db.js';
import { useRoute } from '../router/RouteContext.jsx';

export const DEFAULT_TOPIC_CATEGORIES = [
  'CAM',
  'Destination C1-C2',
  'IELTS Actual Tests',
  'Oxford 3000',
  'SAT 3500',
  'TOEIC',
  'personal',
  'general',
];

export function getCategoryIcon(category) {
  const compact = String(category || 'general').trim().toLowerCase().replace(/[\s/_-]+/g, '');
  if (compact.includes('tuvungcuatoi') || compact.includes('cuatoi')) return 'folder_special';
  if (compact.includes('actual') || compact.includes('vol')) return 'library_books';
  if (compact.includes('dest')) return 'school';
  if (compact === 'cam' || compact.includes('cambridge')) return 'menu_book';
  if (compact.includes('sat')) return 'school';
  if (compact.includes('ielts') || compact.includes('toeic')) return 'military_tech';
  if (compact.includes('cefr')) return 'workspace_premium';
  if (compact.includes('thpt')) return 'school';
  if (compact.includes('idiom') || compact.includes('collocation')) return 'format_quote';
  if (compact.includes('general')) return 'public';
  return 'folder';
}

function getDeletedFolders() {
  if (typeof window === 'undefined') return [];
  try {
    const list = JSON.parse(localStorage.getItem('hivocab_deleted_folders') || '[]');
    return Array.isArray(list) ? list.map(s => String(s).toLowerCase()) : [];
  } catch {
    return [];
  }
}

function getSavedUserFolders() {
  if (typeof window === 'undefined') return [];
  try {
    let folders = JSON.parse(localStorage.getItem('hivocab_user_folders') || '[]');
    if (!Array.isArray(folders)) folders = [];
    if (!folders.some(f => (f?.name || '').trim().toLowerCase() === 'từ vựng của tôi')) {
      folders.unshift({ name: 'Từ vựng của tôi', isExam: false });
    }
    return folders;
  } catch {
    return [{ name: 'Từ vựng của tôi', isExam: false }];
  }
}

export function useTopics() {
  const [topics, setTopics] = useState(getCachedTopics);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(() => {
    const initial = getCachedTopics();
    return !initial || initial.length === 0;
  });
  const [error, setError] = useState(null);
  const [isUserPro, setIsUserPro] = useState(() => (typeof window !== 'undefined' ? Boolean(window._isUserPro) : false));
  const [searchQuery, setSearchQuery] = useState('');

  const { navigateTo } = useRoute();

  const applyTopics = useCallback((list, proStatus) => {
    const sorted = [...(Array.isArray(list) ? list : [])];
    sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }));
    setTopics(sorted);
    if (proStatus !== undefined) setIsUserPro(proStatus);
    if (typeof window !== 'undefined') {
      window._allTopics = sorted;
      if (proStatus !== undefined) window._isUserPro = proStatus;
    }
  }, []);

  const fetchTopics = useCallback(async (force = false) => {
    try {
      if (!getCachedTopics().length) setLoading(true);
      setError(null);
      const [data, proStatus] = await Promise.all([
        getTopics(force),
        checkPro().catch(() => false),
      ]);
      applyTopics(data, proStatus);
    } catch (err) {
      console.error('[useTopics] Error loading topics:', err);
      if (!getCachedTopics().length) {
        setError(err?.message || 'Không thể tải danh sách chủ đề.');
      }
    } finally {
      setLoading(false);
    }
  }, [applyTopics]);

  useEffect(() => {
    // Kick off initial fetch (returns cache instantly if available, fetches fresh in background)
    fetchTopics();

    // Listen for background revalidation events from db.js
    // When fetchTopicsFromSupabase() completes, it fires hi:topics-updated
    const onTopicsUpdated = (e) => {
      if (Array.isArray(e.detail) && e.detail.length > 0) {
        applyTopics(e.detail, undefined);
        setLoading(false);
      }
    };
    window.addEventListener('hi:topics-updated', onTopicsUpdated);
    return () => window.removeEventListener('hi:topics-updated', onTopicsUpdated);
  }, []);

  // Build categories list
  const categories = useMemo(() => {
    const deletedFolders = getDeletedFolders();
    const seen = new Set();
    const result = [{ id: 'all', label: 'Tất cả', icon: 'apps' }];

    topics.forEach(topic => {
      const val = String(topic.category || 'general').trim() || 'general';
      const key = val.toLowerCase();
      if (deletedFolders.includes(key)) return;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ id: val, label: val, icon: getCategoryIcon(val) });
      }
    });

    getSavedUserFolders().forEach(f => {
      if (!f?.name) return;
      const key = f.name.trim().toLowerCase();
      if (deletedFolders.includes(key)) return;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ id: f.name, label: f.name, icon: f.isExam ? 'menu_book' : 'folder' });
      }
    });

    if (typeof window !== 'undefined') {
      window._topicCategories = result;
    }
    return result;
  }, [topics]);

  // Build folders list when in 'all' view
  const folderList = useMemo(() => {
    const list = categories.filter(c => c.id !== 'all');
    const defaultOrder = DEFAULT_TOPIC_CATEGORIES.map(c => c.toLowerCase());
    list.sort((a, b) => {
      const idxA = defaultOrder.indexOf(a.id.toLowerCase());
      const idxB = defaultOrder.indexOf(b.id.toLowerCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.label.localeCompare(b.label);
    });

    return list.map(cat => {
      const catTopics = topics.filter(t => (t.category || '').toLowerCase() === cat.id.toLowerCase());
      const count = catTopics.length;
      const totalProgress = catTopics.reduce((sum, t) => sum + (t.progress || 0), 0);
      const avgProgress = count > 0 ? Math.round(totalProgress / count) : 0;
      return {
        ...cat,
        count,
        avgProgress,
        topics: catTopics,
      };
    });
  }, [categories, topics]);

  // Filtered topics when inside a specific category or searching
  const filteredTopics = useMemo(() => {
    let result = topics;
    if (activeCategory !== 'all') {
      result = result.filter(t => (t.category || '').toLowerCase() === activeCategory.toLowerCase());
    }
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(t => (t.name || '').toLowerCase().includes(query));
    }
    return result;
  }, [topics, activeCategory, searchQuery]);

  const openTopic = useCallback((topicId, topicName, category) => {
    let t = topics.find(item => item.id === topicId);
    const finalName = topicName || t?.name || '—';
    const finalCat = category || t?.category || 'general';

    if (typeof window !== 'undefined') {
      window._currentTopicId = topicId;
      window._currentTopicName = finalName;
      window._currentCategory = finalCat;
      window._currentCategoryName = finalCat;
      window._currentPassageId = null;
      window._currentPassageNumber = null;
      window._currentPassageTitle = null;
      window._currentTopicLabel = null;
      window._currentTestId = null;
      window._currentTestIndex = 0;
      window._currentLessonIndex = null;
      window._currentLessonWords = [];
      window._currentLessonWordsKey = null;
    }

    navigateTo('topic-detail');
  }, [topics, navigateTo]);

  const handleDeleteTopic = useCallback(async (topicId, topicName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chủ đề "${topicName || 'này'}" không? Hành động này không thể hoàn tác.`)) {
      return;
    }
    try {
      await apiDeleteTopic(topicId);
      setTopics(prev => {
        const next = prev.filter(t => t.id !== topicId);
        if (typeof window !== 'undefined') {
          window._allTopics = next;
        }
        return next;
      });
      if (typeof window !== 'undefined' && typeof window.showHiToast === 'function') {
        window.showHiToast('Đã xóa chủ đề thành công.', 'success');
      }
    } catch (err) {
      alert('Không thể xóa chủ đề: ' + (err?.message || err));
    }
  }, []);

  const handleDeleteFolder = useCallback(async (folderId, folderName) => {
    const name = folderName || folderId;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thư mục "${name}" không?\nTất cả các chủ đề bên trong thư mục này cũng sẽ bị xóa.`)) {
      return;
    }

    try {
      const folderKey = String(folderId || '').trim().toLowerCase();

      // 1. Remove from saved user folders in localStorage
      let savedFolders = [];
      try {
        savedFolders = JSON.parse(localStorage.getItem('hivocab_user_folders') || '[]');
      } catch (_) {}
      savedFolders = savedFolders.filter(
        f => (f?.name || '').trim().toLowerCase() !== folderKey
      );
      localStorage.setItem('hivocab_user_folders', JSON.stringify(savedFolders));

      // 2. Mark as deleted in localStorage so it does not reappear
      try {
        let deletedFolders = JSON.parse(localStorage.getItem('hivocab_deleted_folders') || '[]');
        if (!Array.isArray(deletedFolders)) deletedFolders = [];
        if (!deletedFolders.includes(folderKey)) {
          deletedFolders.push(folderKey);
          localStorage.setItem('hivocab_deleted_folders', JSON.stringify(deletedFolders));
        }
      } catch (_) {}

      // 3. Find and delete all topics belonging to this category/folder
      const topicsInFolder = topics.filter(
        t => String(t.category || '').trim().toLowerCase() === folderKey
      );

      for (const t of topicsInFolder) {
        try {
          await apiDeleteTopic(t.id);
        } catch (err) {
          console.warn(`[handleDeleteFolder] Could not delete topic ${t.id}:`, err);
        }
      }

      // Also call cascade helper on Supabase
      try {
        await deleteFolderCascade(name);
      } catch (err) {
        console.warn(`[handleDeleteFolder] deleteFolderCascade:`, err);
      }

      // 4. Update local state
      const nextTopics = topics.filter(
        t => String(t.category || '').trim().toLowerCase() !== folderKey
      );
      setTopics(nextTopics);
      if (typeof window !== 'undefined') {
        window._allTopics = nextTopics;
      }

      // 5. If currently inside this folder, go back to 'all'
      if (activeCategory.toLowerCase() === folderKey) {
        setActiveCategory('all');
      }

      // 6. Trigger update & toast
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hi:topics-updated', { detail: nextTopics }));
        if (typeof window.showHiToast === 'function') {
          window.showHiToast(`Đã xóa thư mục "${name}" thành công!`, 'success');
        }
      }
    } catch (err) {
      console.error('[useTopics] Error deleting folder:', err);
      alert('Không thể xóa thư mục: ' + (err?.message || err));
    }
  }, [topics, activeCategory]);

  return {
    topics,
    loading,
    error,
    categories,
    activeCategory,
    setActiveCategory,
    folderList,
    filteredTopics,
    isUserPro,
    searchQuery,
    setSearchQuery,
    openTopic,
    handleDeleteTopic,
    handleDeleteFolder,
    refresh: () => fetchTopics(true),
  };
}

export default useTopics;
