import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { clonePublicTopic, clearTopicCache } from '../services/db.js';

export const AVAILABLE_TAGS = [
  { label: 'Tất cả',         value: 'all' },
  { label: '🔥 IELTS',       value: 'IELTS' },
  { label: '🎓 THPT-QG',     value: 'THPT-QG' },
  { label: '💼 TOEIC',       value: 'TOEIC' },
  { label: '🚀 C1-C2',       value: 'C1-C2' },
  { label: '💬 Giao tiếp',   value: 'Giao tiếp' },
  { label: '✨ Collocations', value: 'Collocations' },
  { label: '📖 Destination',  value: 'Destination' },
  { label: '🎯 Cam 18-19',   value: 'Cam19' },
];

export const SUGGESTED_HASHTAGS = [
  'IELTS',
  'THPT-QG',
  'TOEIC',
  'C1-C2',
  'Giao tiếp',
  'Collocations',
  'Destination',
  'Cam19',
  'SAT',
  'Idioms',
  'Oxford 3000',
  'B1-B2',
];

const TOPIC_SELECT_FIELDS =
  'id, user_id, name, icon, category, description, created_at, like_count, clone_count, comment_count, word_count, tags, is_public, author_name, author_avatar, is_pro';

function sanitizePostgrestSearch(raw) {
  return String(raw || '')
    .replace(/[%_,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function useLibrary({ onOpenTopic } = {}) {
  // Tab state
  const [currentTab, setCurrentTab] = useState('feed'); // 'feed' | 'my' | 'liked'
  const [currentUserId, setCurrentUserId] = useState(null);

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

  // Clone tracking state (sourceTopicId -> newlyClonedTopicId)
  const [isCloningId, setIsCloningId] = useState(null);
  const [clonedMap, setClonedMap] = useState({});

  // Comments state
  const [activeCommentsTopicId, setActiveCommentsTopicId] = useState(null);
  const [activeCommentsTitle, setActiveCommentsTitle] = useState('');
  const [comments, setComments] = useState([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Hashtag publish modal state
  const [publishTopicId, setPublishTopicId] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [publishDescription, setPublishDescription] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const enrichTopicRow = useCallback((t, likedSet, forceLiked = false) => ({
    ...t,
    like_count: t.like_count ?? 0,
    clone_count: t.clone_count ?? 0,
    comment_count: t.comment_count ?? 0,
    totalWords: t.word_count ?? 0,
    tags: Array.isArray(t.tags) ? t.tags : [],
    hasLiked: forceLiked || Boolean(likedSet?.has(t.id)),
  }), []);

  const fetchPublicFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      setCurrentUserId(uid);

      let query = supabase
        .from('topics')
        .select(TOPIC_SELECT_FIELDS)
        .eq('is_public', true)
        .order(sortBy === 'popular' ? 'like_count' : sortBy === 'clones' ? 'clone_count' : 'created_at', { ascending: false })
        .limit(50);

      if (currentTag && currentTag !== 'all') {
        query = query.contains('tags', [currentTag]);
      }

      const cleanedSearch = sanitizePostgrestSearch(debouncedSearch);
      if (cleanedSearch) {
        query = query.or(
          `name.ilike.%${cleanedSearch}%,description.ilike.%${cleanedSearch}%,author_name.ilike.%${cleanedSearch}%`
        );
      }

      const [topicsRes, likedRes] = await Promise.all([
        query,
        uid
          ? supabase.from('topic_likes').select('topic_id').eq('user_id', uid)
          : Promise.resolve({ data: [] }),
      ]);

      if (topicsRes.error) throw topicsRes.error;

      const likedSet = new Set((likedRes.data || []).map((l) => l.topic_id));
      const enriched = (topicsRes.data || []).map((t) => enrichTopicRow(t, likedSet));
      setTopics(enriched);
    } catch (err) {
      console.error('[useLibrary] fetchPublicFeed error:', err);
      setError(err.message || 'Không thể tải dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  }, [currentTag, debouncedSearch, sortBy, enrichTopicRow]);

  const fetchMyTopics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentUserId(null);
        setTopics([]);
        return;
      }
      setCurrentUserId(user.id);
      let query = supabase
        .from('topics')
        .select(TOPIC_SELECT_FIELDS)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const cleanedSearch = sanitizePostgrestSearch(debouncedSearch);
      if (cleanedSearch) {
        query = query.or(`name.ilike.%${cleanedSearch}%,description.ilike.%${cleanedSearch}%`);
      }

      const [{ data, error: err }, { data: likedRows }] = await Promise.all([
        query,
        supabase.from('topic_likes').select('topic_id').eq('user_id', user.id),
      ]);
      if (err) throw err;

      const likedSet = new Set((likedRows || []).map((l) => l.topic_id));
      setTopics((data || []).map((t) => enrichTopicRow(t, likedSet)));
    } catch (err) {
      setError(err.message || 'Không thể tải bộ từ của bạn.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, enrichTopicRow]);

  const fetchLikedTopics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentUserId(null);
        setTopics([]);
        return;
      }
      setCurrentUserId(user.id);
      const { data: likedRows, error: err } = await supabase
        .from('topic_likes')
        .select('topic_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (err) throw err;
      const topicIds = (likedRows || []).map((row) => row.topic_id).filter(Boolean);
      if (topicIds.length === 0) {
        setTopics([]);
        return;
      }
      let query = supabase
        .from('topics')
        .select(TOPIC_SELECT_FIELDS)
        .in('id', topicIds);

      if (currentTag && currentTag !== 'all') {
        query = query.contains('tags', [currentTag]);
      }
      const cleanedSearch = sanitizePostgrestSearch(debouncedSearch);
      if (cleanedSearch) {
        query = query.or(
          `name.ilike.%${cleanedSearch}%,description.ilike.%${cleanedSearch}%,author_name.ilike.%${cleanedSearch}%`
        );
      }

      const { data: topicsData, error: topicsErr } = await query;
      if (topicsErr) throw topicsErr;

      // Filter out unpublished topics by other users if RLS still exposes anything or preserve order
      const visible = (topicsData || []).filter((t) => t.is_public || t.user_id === user.id);
      setTopics(visible.map((t) => enrichTopicRow(t, null, true)));
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách yêu thích.');
    } finally {
      setIsLoading(false);
    }
  }, [currentTag, debouncedSearch, enrichTopicRow]);

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

  // Auto-refresh list when topics or words change elsewhere (e.g. CreateTopicModal)
  useEffect(() => {
    const refreshActive = () => {
      if (currentTab === 'feed') fetchPublicFeed();
      else if (currentTab === 'my') fetchMyTopics();
      else if (currentTab === 'liked') fetchLikedTopics();
    };
    window.addEventListener('hi:topics-updated', refreshActive);
    window.addEventListener('hivocab:word-added', refreshActive);
    window.addEventListener('hivocab:words-bulk-added', refreshActive);
    return () => {
      window.removeEventListener('hi:topics-updated', refreshActive);
      window.removeEventListener('hivocab:word-added', refreshActive);
      window.removeEventListener('hivocab:words-bulk-added', refreshActive);
    };
  }, [currentTab, fetchPublicFeed, fetchMyTopics, fetchLikedTopics]);

  const openDetail = useCallback(async (topicId) => {
    setActiveTopicDetail({ id: topicId, _loading: true });
    setIsDetailLoading(true);
    setDetailError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;

      const [topicRes, wordsRes, likeRes] = await Promise.all([
        supabase.from('topics').select(TOPIC_SELECT_FIELDS).eq('id', topicId).maybeSingle(),
        supabase
          .from('words')
          .select('id, word, pos, phonetic, meaning, example_sentence, image_url, word_order')
          .eq('topic_id', topicId)
          .order('word_order', { ascending: true, nullsFirst: false })
          .limit(100),
        uid
          ? supabase.from('topic_likes').select('topic_id').eq('topic_id', topicId).eq('user_id', uid).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (topicRes.error) throw topicRes.error;
      if (wordsRes.error) throw wordsRes.error;
      if (likeRes.error) throw likeRes.error;
      if (!topicRes.data) throw new Error('Không tìm thấy dữ liệu bộ từ vựng (hoặc bộ từ đã chuyển về riêng tư).');
      const previewWords = wordsRes.data || [];
      setActiveTopicDetail({
        ...topicRes.data,
        like_count: topicRes.data.like_count ?? 0,
        clone_count: topicRes.data.clone_count ?? 0,
        comment_count: topicRes.data.comment_count ?? 0,
        words: previewWords,
        hasLiked: Boolean(likeRes.data),
        totalWords: Math.max(topicRes.data.word_count || 0, previewWords.length),
      });
    } catch (err) {
      setDetailError(err.message || 'Không thể tải chi tiết bộ từ.');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  // Support shared URL deep links (#d=<id>, #deck=<id>, #library?topic=<id>)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rawHash = window.location.hash || '';
    const m = rawHash.match(/(?:^#|&|\?)(?:d|deck|topic)=([0-9a-f-]{36})/i);
    if (m?.[1]) {
      openDetail(m[1]);
    }
  }, [openDetail]);

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
    const toggleRow = (item) => ({
      ...item,
      hasLiked: !item.hasLiked,
      like_count: item.hasLiked ? Math.max(0, (item.like_count || 0) - 1) : (item.like_count || 0) + 1,
    });

    setTopics((prev) => prev.map((t) => (t.id === topicId ? toggleRow(t) : t)));
    if (activeTopicDetail?.id === topicId) {
      setActiveTopicDetail((prev) => (prev ? toggleRow(prev) : prev));
    }

    try {
      // Call SECURITY DEFINER RPC so topics.like_count updates atomically in DB
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('toggle_topic_like', {
        target_topic_id: topicId,
      });
      if (rpcErr) throw rpcErr;

      if (rpcRes && typeof rpcRes.like_count === 'number') {
        const applyExact = (item) => ({
          ...item,
          hasLiked: Boolean(rpcRes.liked),
          like_count: rpcRes.like_count,
        });
        setTopics((prev) => prev.map((t) => (t.id === topicId ? applyExact(t) : t)));
        if (activeTopicDetail?.id === topicId) {
          setActiveTopicDetail((prev) => (prev ? applyExact(prev) : prev));
        }
        if (rpcRes.liked) {
          window.showHiToast?.('Đã thêm vào bộ sưu tập Yêu thích 💖', 'success');
        }
      }
    } catch (err) {
      console.error('[useLibrary] handleLike error:', err);
      // Revert optimistic update
      setTopics((prev) => prev.map((t) => (t.id === topicId ? toggleRow(t) : t)));
      if (activeTopicDetail?.id === topicId) {
        setActiveTopicDetail((prev) => (prev ? toggleRow(prev) : prev));
      }
      window.showHiToast?.(err.message || 'Không thể cập nhật lượt thích lúc này.', 'error');
    }
  }, [activeTopicDetail]);

  const closeDetail = useCallback(() => {
    setActiveTopicDetail(null);
    setDetailError(null);
  }, []);

  const openTopicStudy = useCallback(
    (topic) => {
      if (!topic?.id) return;
      closeDetail();
      if (typeof onOpenTopic === 'function') {
        onOpenTopic(topic);
      }
    },
    [closeDetail, onOpenTopic]
  );

  const handleClone = useCallback(
    async (topicOrId) => {
      const topicId = typeof topicOrId === 'string' ? topicOrId : topicOrId?.id;
      if (!topicId || isCloningId === topicId) return;

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

      const sourceTopic =
        (typeof topicOrId === 'object' ? topicOrId : null) ||
        (activeTopicDetail?.id === topicId ? activeTopicDetail : topics.find((t) => t.id === topicId));

      // If this deck already belongs to the user, open it directly instead of cloning
      if (sourceTopic?.user_id && sourceTopic.user_id === user.id) {
        openTopicStudy(sourceTopic);
        return;
      }

      // If already cloned in this session, navigate straight to the cloned copy
      if (clonedMap[topicId]) {
        openTopicStudy({
          id: clonedMap[topicId],
          name: `${sourceTopic?.name || 'Bộ từ'} (Bản sao)`,
          category: 'personal',
        });
        return;
      }

      setIsCloningId(topicId);
      try {
        const cloneFn =
          typeof clonePublicTopic === 'function'
            ? clonePublicTopic
            : typeof window !== 'undefined'
              ? window.HiDB?.clonePublicTopic
              : null;
        if (!cloneFn) {
          window.showHiToast?.('Không thể lưu lúc này.', 'error');
          return;
        }

        const newId = await cloneFn(topicId);
        setClonedMap((prev) => ({ ...prev, [topicId]: newId }));
        setTopics((prev) =>
          prev.map((t) => (t.id === topicId ? { ...t, clone_count: (t.clone_count || 0) + 1 } : t))
        );
        if (activeTopicDetail?.id === topicId) {
          setActiveTopicDetail((prev) =>
            prev ? { ...prev, clone_count: (prev.clone_count || 0) + 1 } : prev
          );
        }
        window.showHiToast?.('Đã lưu bộ từ về mục "Từ Vựng Đã Lưu (Cá Nhân)"! 🎉', 'success');
      } catch (err) {
        window.showHiToast?.(err.message || 'Lỗi khi lưu bộ từ vựng.', 'error');
      } finally {
        setIsCloningId(null);
      }
    },
    [isCloningId, clonedMap, topics, activeTopicDetail, openTopicStudy]
  );

  const openComments = useCallback(async (topicId, title) => {
    setActiveCommentsTopicId(topicId);
    setActiveCommentsTitle(title || '');
    setIsCommentsLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('topic_comments')
        .select('id, content, created_at, author_name:user_name, author_avatar:user_avatar')
        .eq('topic_id', topicId)
        .not('user_id', 'is', null)
        .order('created_at', { ascending: true });
      if (err) throw err;
      setComments(data || []);
    } catch (_) {
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
    if (!commentInput.trim() || !activeCommentsTopicId || isSubmittingComment) return;
    setIsSubmittingComment(true);
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
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      if (profileError) throw profileError;

      const resolvedName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Học viên HiVocab';
      const resolvedAvatar =
        user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      const { error: insertError } = await supabase.from('topic_comments').insert({
        topic_id: activeCommentsTopicId,
        user_id: user.id,
        content: commentInput.trim(),
        user_name: resolvedName,
        user_avatar: resolvedAvatar,
      });
      if (insertError) throw insertError;

      setCommentInput('');
      setTopics((prev) =>
        prev.map((t) =>
          t.id === activeCommentsTopicId ? { ...t, comment_count: (t.comment_count || 0) + 1 } : t
        )
      );
      if (activeTopicDetail?.id === activeCommentsTopicId) {
        setActiveTopicDetail((prev) =>
          prev ? { ...prev, comment_count: (prev.comment_count || 0) + 1 } : prev
        );
      }
      await openComments(activeCommentsTopicId, activeCommentsTitle);
      window.showHiToast?.('Bình luận đã được gửi!', 'success');
    } catch (err) {
      window.showHiToast?.(err.message || 'Không thể gửi bình luận.', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  }, [commentInput, activeCommentsTopicId, activeCommentsTitle, activeTopicDetail, openComments, isSubmittingComment]);

  const handlePublicToggle = useCallback(
    async (topicId, isPublic) => {
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
        const target = topics.find((t) => t.id === topicId);
        let wordCount = target?.totalWords || target?.word_count || 0;
        if (wordCount <= 0) {
          const { count } = await supabase
            .from('words')
            .select('*', { count: 'exact', head: true })
            .eq('topic_id', topicId);
          wordCount = count || 0;
        }
        if (wordCount <= 0) {
          window.showHiToast?.(
            'Bộ từ này chưa có từ vựng nào. Hãy thêm ít nhất 1 từ trước khi công khai nhé!',
            'error'
          );
          return;
        }

        setPublishTopicId(topicId);
        setSelectedTags(Array.isArray(target?.tags) ? target.tags : []);
        setPublishDescription(target?.description || '');
      } else {
        try {
          const { error } = await supabase
            .from('topics')
            .update({ is_public: false })
            .eq('id', topicId)
            .eq('user_id', user.id);
          if (error) throw error;
          clearTopicCache(user.id);
          setTopics((prev) => prev.map((t) => (t.id === topicId ? { ...t, is_public: false } : t)));
          if (activeTopicDetail?.id === topicId) {
            setActiveTopicDetail((prev) => (prev ? { ...prev, is_public: false } : prev));
          }
          window.showHiToast?.('Bộ từ đã được chuyển về riêng tư.', 'success');
        } catch (err) {
          window.showHiToast?.(err.message || 'Lỗi khi ẩn bộ từ.', 'error');
        }
      }
    },
    [topics, activeTopicDetail]
  );

  const confirmPublish = useCallback(async () => {
    const cleanTags = Array.from(
      new Set(
        selectedTags
          .map((t) => String(t || '').replace(/^#/, '').trim())
          .filter(Boolean)
      )
    );
    if (!publishTopicId || cleanTags.length === 0) {
      window.showHiToast?.('Vui lòng chọn ít nhất 1 hashtag!', 'error');
      return;
    }

    setIsPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Vui lòng đăng nhập để công khai bộ từ.');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      const authorName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Học viên HiVocab';
      const authorAvatar =
        user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
      const nextDesc = publishDescription.trim() || null;

      const { error } = await supabase
        .from('topics')
        .update({
          is_public: true,
          tags: cleanTags,
          description: nextDesc,
          author_name: authorName,
          author_avatar: authorAvatar,
        })
        .eq('id', publishTopicId)
        .eq('user_id', user.id);
      if (error) throw error;

      clearTopicCache(user.id);
      setTopics((prev) =>
        prev.map((t) =>
          t.id === publishTopicId
            ? {
                ...t,
                is_public: true,
                tags: cleanTags,
                description: nextDesc,
                author_name: authorName,
                author_avatar: authorAvatar,
              }
            : t
        )
      );
      setPublishTopicId(null);
      window.showHiToast?.('Bộ từ đã được công khai lên Thư viện cộng đồng! 🎉', 'success');
    } catch (err) {
      window.showHiToast?.(err.message || 'Lỗi khi công khai bộ từ.', 'error');
    } finally {
      setIsPublishing(false);
    }
  }, [publishTopicId, selectedTags, publishDescription]);

  const cancelPublish = useCallback(() => {
    setPublishTopicId(null);
  }, []);

  const handleShare = useCallback(async (topicId) => {
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
    currentUserId,
    currentTag, setCurrentTag,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    topics, isLoading, error,
    activeTopicDetail, isDetailLoading, detailError,
    isCloningId, clonedMap,
    activeCommentsTopicId, activeCommentsTitle, comments, isCommentsLoading, commentInput, setCommentInput, isSubmittingComment,
    publishTopicId, selectedTags, setSelectedTags, publishDescription, setPublishDescription, isPublishing,
    AVAILABLE_TAGS, SUGGESTED_HASHTAGS,
    handleLike, handleClone, handleShare,
    openDetail, closeDetail, openTopicStudy,
    openComments, closeComments, submitComment,
    handlePublicToggle, confirmPublish, cancelPublish,
    playWordAudio,
  };
}
