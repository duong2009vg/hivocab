import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export const AVAILABLE_TAGS = [
  { label: 'Tất cả',         value: 'all' },
  { label: '🔥 IELTS',       value: 'IELTS' },
  { label: '🎓 THPT-QG',     value: 'THPT-QG' },
  { label: '🚀 C1-C2',       value: 'C1-C2' },
  { label: '💬 Giao tiếp',   value: 'GiaoTiếp' },
  { label: '✨ Collocations', value: 'Collocations' },
  { label: '📖 Destination',  value: 'Destination' },
  { label: '🎯 Cam 18-19',   value: 'Cam19' }
];

export const SUGGESTED_HASHTAGS = [
  'IELTS', 'TOEIC', 'Giao tiếp', 'Cam19', 'SAT', 'Collocations',
  'Idioms', 'Từ vựng C1-C2', 'THPT Quốc Gia', 'Oxford 3000', 'B1-B2'
];

export function useLibrary() {
  // Tab state
  const [currentTab, setCurrentTab] = useState('feed'); // 'feed' | 'my' | 'liked'

  // Filter/sort state
  const [currentTag, setCurrentTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Data state
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Thread detail state
  const [activeTopicDetail, setActiveTopicDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Comments state
  const [activeCommentsTopicId, setActiveCommentsTopicId] = useState(null);
  const [activeCommentsTitle, setActiveCommentsTitle] = useState('');
  const [comments, setComments] = useState([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  // Hashtag publish modal state
  const [publishTopicId, setPublishTopicId] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [publishDescription, setPublishDescription] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchPublicFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;

      let query = supabase
        .from('topics')
        .select(`
          id, name, icon, description, created_at, like_count, clone_count,
          tags, is_public, author_name, author_avatar, is_pro
        `)
        .eq('is_public', true)
        .order(sortBy === 'popular' ? 'like_count' : sortBy === 'clones' ? 'clone_count' : 'created_at', { ascending: false })
        .limit(50);

      if (currentTag && currentTag !== 'all') {
        query = query.contains('tags', [currentTag]);
      }
      if (debouncedSearch && debouncedSearch.trim()) {
        query = query.ilike('name', `%${debouncedSearch.trim()}%`);
      }

      const [topicsRes, likedRes] = await Promise.all([
        query,
        uid
          ? supabase.from('topic_likes').select('topic_id').eq('user_id', uid)
          : Promise.resolve({ data: [] }),
      ]);

      if (topicsRes.error) throw topicsRes.error;

      const likedSet = new Set((likedRes.data || []).map((l) => l.topic_id));
      const enriched = (topicsRes.data || []).map((t) => ({
        ...t,
        hasLiked: likedSet.has(t.id),
        totalWords: 0,
      }));
      setTopics(enriched);
    } catch (err) {
      console.error('[useLibrary] fetchPublicFeed error:', err);
      setError(err.message || 'Không thể tải dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  }, [currentTag, debouncedSearch, sortBy]);

  const fetchMyTopics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setTopics([]); return; }
      const { data, error: err } = await supabase
        .from('topics')
        .select('id, name, icon, description, created_at, like_count, clone_count, tags, is_public, author_name, author_avatar')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setTopics((data || []).map(t => ({ ...t, totalWords: 0 })));
    } catch (err) {
      setError(err.message || 'Không thể tải bộ từ của bạn.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLikedTopics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setTopics([]); return; }
      const { data: likedRows, error: err } = await supabase
        .from('topic_likes')
        .select('topic_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (err) throw err;
      const topicIds = (likedRows || []).map(row => row.topic_id).filter(Boolean);
      if (topicIds.length === 0) {
        setTopics([]);
        return;
      }
      const { data: topicsData, error: topicsErr } = await supabase
        .from('topics')
        .select('id, name, icon, description, created_at, like_count, clone_count, tags, is_public, author_name, author_avatar')
        .in('id', topicIds);
      if (topicsErr) throw topicsErr;
      setTopics((topicsData || []).map(t => ({ ...t, hasLiked: true, totalWords: 0 })));
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách yêu thích.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTabChange = useCallback((tab) => {
    setCurrentTab(tab);
    setTopics([]);
    setError(null);
  }, []);

  useEffect(() => {
    if (currentTab === 'feed') fetchPublicFeed();
    else if (currentTab === 'my') fetchMyTopics();
    else if (currentTab === 'liked') fetchLikedTopics();
  }, [currentTab, fetchPublicFeed, fetchMyTopics, fetchLikedTopics]);

  const handleLike = useCallback(async (topicId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (typeof window !== 'undefined' && window.openRequireLoginModal) {
        window.openRequireLoginModal(
          'Đăng nhập để thả tim và lưu bộ từ vào danh sách yêu thích nhé!',
          'Đăng nhập để thích bộ từ 💖',
          'thích bộ từ'
        );
      } else {
        window.showHiToast?.('Vui lòng đăng nhập để thích bộ từ!', 'error');
      }
      return;
    }
    
    // Optimistic update
    setTopics(prev => prev.map(t => t.id === topicId ? {
      ...t,
      hasLiked: !t.hasLiked,
      like_count: t.hasLiked ? Math.max(0, (t.like_count || 0) - 1) : (t.like_count || 0) + 1
    } : t));
    
    if (activeTopicDetail?.id === topicId) {
      setActiveTopicDetail(prev => prev ? {
        ...prev,
        hasLiked: !prev.hasLiked,
        like_count: prev.hasLiked ? Math.max(0, (prev.like_count || 0) - 1) : (prev.like_count || 0) + 1
      } : prev);
    }
    
    try {
      const { data: existing } = await supabase
        .from('topic_likes')
        .select('id')
        .eq('topic_id', topicId)
        .eq('user_id', user.id)
        .single();
        
      if (existing) {
        await supabase.from('topic_likes').delete().eq('topic_id', topicId).eq('user_id', user.id);
      } else {
        await supabase.from('topic_likes').insert({ topic_id: topicId, user_id: user.id });
        window.showHiToast?.('Đã thêm vào bộ sưu tập Yêu thích 💖', 'success');
      }
    } catch (err) {
      console.error('[useLibrary] handleLike error:', err);
      // Revert optimistic update
      setTopics(prev => prev.map(t => t.id === topicId ? {
        ...t,
        hasLiked: !t.hasLiked,
        like_count: t.hasLiked ? Math.max(0, (t.like_count || 0) - 1) : (t.like_count || 0) + 1
      } : t));
    }
  }, [activeTopicDetail]);

  const handleClone = useCallback(async (topicId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (typeof window !== 'undefined' && window.openRequireLoginModal) {
        window.openRequireLoginModal(
          'Đăng nhập để sao chép bộ từ vựng cộng đồng này về kho cá nhân của bạn!',
          'Đăng nhập để lưu bộ từ 📚',
          'sao chép bộ từ'
        );
      } else {
        window.showHiToast?.('Vui lòng đăng nhập để lưu bộ từ!', 'error');
      }
      return;
    }
    try {
      if (typeof window !== 'undefined' && window.HiDB?.clonePublicTopic) {
        const newId = await window.HiDB.clonePublicTopic(topicId);
        setTopics(prev => prev.map(t => t.id === topicId ? { ...t, clone_count: (t.clone_count || 0) + 1 } : t));
        window.showHiToast?.('Đã lưu bộ từ vào kho cá nhân thành công! 🎉', 'success');
        setTimeout(() => {
          if (window.confirm('Bộ từ đã được lưu. Bạn có muốn bắt đầu ôn tập ngay không?')) {
            closeDetail();
            window._openTopic?.(newId);
          }
        }, 600);
        return;
      }
      window.showHiToast?.('Không thể lưu lúc này.', 'error');
    } catch (err) {
      window.showHiToast?.(err.message || 'Lỗi khi lưu bộ từ vựng.', 'error');
    }
  }, []);

  const openDetail = useCallback(async (topicId) => {
    setActiveTopicDetail({ id: topicId, _loading: true });
    setIsDetailLoading(true);
    setDetailError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      
      const [topicRes, wordsRes, likeRes] = await Promise.all([
        supabase.from('topics').select('id, name, icon, description, created_at, like_count, clone_count, tags, is_public, author_name, author_avatar').eq('id', topicId).maybeSingle(),
        supabase.from('words').select('id, word, pos, phonetic, meaning, example_sentence, notes, image_url, word_order').eq('topic_id', topicId).order('word_order', { ascending: true, nullsFirst: false }).limit(100),
        uid ? supabase.from('topic_likes').select('id').eq('topic_id', topicId).eq('user_id', uid).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      if (topicRes.error) throw topicRes.error;
      if (!topicRes.data) throw new Error('Không tìm thấy dữ liệu bộ từ vựng.');
      setActiveTopicDetail({
        ...topicRes.data,
        words: wordsRes.data || [],
        hasLiked: !!likeRes.data,
        totalWords: (wordsRes.data || []).length,
      });
    } catch (err) {
      setDetailError(err.message || 'Không thể tải chi tiết bộ từ.');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setActiveTopicDetail(null);
    setDetailError(null);
  }, []);

  const openComments = useCallback(async (topicId, title) => {
    setActiveCommentsTopicId(topicId);
    setActiveCommentsTitle(title || '');
    setIsCommentsLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('topic_comments')
        .select('id, content, created_at, author_name, author_avatar')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true });
      if (err) throw err;
      setComments(data || []);
    } catch (err) {
      setComments([]);
    } finally {
      setIsCommentsLoading(false);
    }
  }, []);

  const closeComments = useCallback(() => {
    setActiveCommentsTopicId(null);
    setComments([]);
    setCommentInput('');
  }, []);

  const submitComment = useCallback(async () => {
    if (!commentInput.trim() || !activeCommentsTopicId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (typeof window !== 'undefined' && window.openRequireLoginModal) {
          window.openRequireLoginModal(
            'Đăng nhập để gửi bình luận và trao đổi cùng cộng đồng nhé!',
            'Đăng nhập để bình luận 💬',
            'bình luận'
          );
        } else {
          window.showHiToast?.('Vui lòng đăng nhập để bình luận!', 'error');
        }
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
      await supabase.from('topic_comments').insert({
        topic_id: activeCommentsTopicId,
        user_id: user.id,
        content: commentInput.trim(),
        author_name: profile?.full_name || user.email?.split('@')[0] || 'Học viên HiVocab',
        author_avatar: profile?.avatar_url || null,
      });
      setCommentInput('');
      await openComments(activeCommentsTopicId, activeCommentsTitle);
      window.showHiToast?.('Bình luận đã được gửi!', 'success');
    } catch (err) {
      window.showHiToast?.(err.message || 'Không thể gửi bình luận.', 'error');
    }
  }, [commentInput, activeCommentsTopicId, activeCommentsTitle, openComments]);

  const handlePublicToggle = useCallback(async (topicId, isPublic) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (typeof window !== 'undefined' && window.openRequireLoginModal) {
        window.openRequireLoginModal(
          'Đăng nhập để quản lý quyền công khai bộ từ vựng nhé!',
          'Đăng nhập tài khoản 🔒',
          'công khai bộ từ'
        );
      }
      return;
    }
    if (isPublic) {
      setPublishTopicId(topicId);
      setSelectedTags([]);
      setPublishDescription('');
    } else {
      try {
        await supabase.from('topics').update({ is_public: false, tags: [], description: null }).eq('id', topicId);
        setTopics(prev => prev.map(t => t.id === topicId ? { ...t, is_public: false } : t));
        window.showHiToast?.('Bộ từ đã được chuyển về riêng tư.', 'success');
      } catch (err) {
        window.showHiToast?.(err.message || 'Lỗi khi ẩn bộ từ.', 'error');
      }
    }
  }, []);

  const confirmPublish = useCallback(async () => {
    if (!publishTopicId || selectedTags.length === 0) {
      window.showHiToast?.('Vui lòng chọn ít nhất 1 hashtag!', 'error');
      return;
    }
    setIsPublishing(true);
    try {
      await supabase.from('topics').update({
        is_public: true,
        tags: selectedTags,
        description: publishDescription.trim() || null,
      }).eq('id', publishTopicId);
      setTopics(prev => prev.map(t => t.id === publishTopicId ? { ...t, is_public: true, tags: selectedTags } : t));
      setPublishTopicId(null);
      window.showHiToast?.('Bộ từ đã được công khai lên Thư Viện! 🎉', 'success');
    } catch (err) {
      window.showHiToast?.(err.message || 'Lỗi khi công khai bộ từ.', 'error');
    } finally {
      setIsPublishing(false);
    }
  }, [publishTopicId, selectedTags, publishDescription]);

  const cancelPublish = useCallback(() => {
    if (publishTopicId) {
      setTopics(prev => prev.map(t => t.id === publishTopicId ? { ...t, is_public: false } : t));
    }
    setPublishTopicId(null);
  }, [publishTopicId]);

  const handleShare = useCallback(async (topicId, title) => {
    const url = `${window.location.origin}/#d=${encodeURIComponent(topicId)}`;
    try {
      await navigator.clipboard.writeText(url);
      window.showHiToast?.('Đã sao chép link chia sẻ!', 'success');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      window.showHiToast?.('Đã sao chép link!', 'success');
    }
  }, []);

  const playWordAudio = useCallback((word) => {
    if (!word) return;
    if (window.HiAudio?.playWord) { window.HiAudio.playWord(word, 0.9); return; }
    if (!window.speechSynthesis) return;
    try {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      const utter = new SpeechSynthesisUtterance(word);
      utter.lang = 'en-US';
      utter.rate = 0.88;
      window.speechSynthesis.speak(utter);
    } catch (err) { console.warn('[playWordAudio]', err); }
  }, []);

  return {
    currentTab, setCurrentTab: handleTabChange,
    currentTag, setCurrentTag,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    topics, isLoading, error,
    activeTopicDetail, isDetailLoading, detailError,
    activeCommentsTopicId, activeCommentsTitle, comments, isCommentsLoading, commentInput, setCommentInput,
    publishTopicId, selectedTags, setSelectedTags, publishDescription, setPublishDescription, isPublishing,
    AVAILABLE_TAGS, SUGGESTED_HASHTAGS,
    handleLike, handleClone, handleShare,
    openDetail, closeDetail,
    openComments, closeComments, submitComment,
    handlePublicToggle, confirmPublish, cancelPublish,
    playWordAudio,
  };
}
