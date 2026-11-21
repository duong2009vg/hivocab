// src/hooks/useCommunityChat.js
// Hook quản lý Phòng Chat Cộng Đồng Realtime trên Thư viện HiVocab (Supabase Postgres + Realtime)
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export const CHAT_CHANNELS = [
  { id: 'general', label: '#Chung', title: 'Phòng Chung', desc: 'Giao lưu & hỏi đáp từ vựng mỗi ngày' },
  { id: 'ielts', label: '#IELTS', title: 'IELTS Reading', desc: 'Thảo luận bài đọc & từ học thuật' },
  { id: 'thpt', label: '#THPT', title: 'THPT-QG', desc: 'Ôn thi TN THPT & ĐGNL' },
  { id: 'decks', label: '#Bộ từ', title: 'Chia sẻ Bộ từ', desc: 'Gửi & xin bộ thẻ từ chất lượng' },
];

const TOPIC_ATTACHMENT_SELECT = 'id, name, icon, word_count, is_public';
const MESSAGE_SELECT = `
  id, channel_id, user_id, author_name, author_avatar, author_is_pro,
  content, attached_topic_id, is_deleted, created_at,
  attached_topic:topics!attached_topic_id(${TOPIC_ATTACHMENT_SELECT})
`;

export function useCommunityChat({ currentUserId = null, enabled = true } = {}) {
  const [activeChannel, setActiveChannel] = useState('general');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatError, setChatError] = useState(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);

  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedTopic, setAttachedTopic] = useState(null);
  const [myPublicTopics, setMyPublicTopics] = useState([]);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);

  const activeChannelRef = useRef(activeChannel);
  activeChannelRef.current = activeChannel;

  // Fetch initial latest 45 messages for active channel
  const fetchMessages = useCallback(async (channelId) => {
    setIsLoading(true);
    setChatError(null);
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select(MESSAGE_SELECT)
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(45);

      if (error) throw error;
      const chronological = (data || []).slice().reverse();
      if (activeChannelRef.current === channelId) {
        setMessages(chronological);
      }
    } catch (err) {
      console.warn('[useCommunityChat] fetchMessages error:', err);
      if (activeChannelRef.current === channelId) {
        setChatError(err.message || 'Không thể tải tin nhắn cộng đồng.');
      }
    } finally {
      if (activeChannelRef.current === channelId) {
        setIsLoading(false);
      }
    }
  }, []);

  // Load initial messages + subscribe to Supabase Realtime while Library page is active
  useEffect(() => {
    if (!enabled) return;

    const channelId = activeChannel;
    fetchMessages(channelId);

    const presenceKey = currentUserId || `guest-${Math.random().toString(36).slice(2, 8)}`;
    const rtChannel = supabase
      .channel(`library-chat:${channelId}`, {
        config: { presence: { key: presenceKey } },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const row = payload?.new;
          if (!row || row.is_deleted) return;

          let enrichedRow = row;
          if (row.attached_topic_id && !row.attached_topic) {
            try {
              const { data: topicRow } = await supabase
                .from('topics')
                .select(TOPIC_ATTACHMENT_SELECT)
                .eq('id', row.attached_topic_id)
                .maybeSingle();
              if (topicRow) {
                enrichedRow = { ...row, attached_topic: topicRow };
              }
            } catch (_) {}
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === enrichedRow.id)) return prev;
            return [...prev, enrichedRow].slice(-60);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'community_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const updated = payload?.new;
          if (!updated) return;
          if (updated.is_deleted) {
            setMessages((prev) => prev.filter((m) => m.id !== updated.id));
          } else {
            setMessages((prev) =>
              prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'community_messages',
        },
        (payload) => {
          const deletedId = payload?.old?.id;
          if (!deletedId) return;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .on('presence', { event: 'sync' }, () => {
        try {
          const state = rtChannel.presenceState();
          const count = Object.keys(state || {}).length;
          setOnlineCount(Math.max(1, count));
        } catch (_) {}
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
          try {
            await rtChannel.track({ online_at: new Date().toISOString() });
          } catch (_) {}
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsRealtimeConnected(false);
        }
      });

    return () => {
      setIsRealtimeConnected(false);
      supabase.removeChannel(rtChannel);
    };
  }, [enabled, activeChannel, currentUserId, fetchMessages]);

  const loadMyPublicTopics = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMyPublicTopics([]);
        return;
      }
      const { data, error } = await supabase
        .from('topics')
        .select(TOPIC_ATTACHMENT_SELECT)
        .eq('user_id', user.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      setMyPublicTopics(data || []);
    } catch (_) {
      setMyPublicTopics([]);
    }
  }, []);

  const toggleAttachMenu = useCallback(async () => {
    const next = !isAttachMenuOpen;
    setIsAttachMenuOpen(next);
    if (next) {
      await loadMyPublicTopics();
    }
  }, [isAttachMenuOpen, loadMyPublicTopics]);

  const sendMessage = useCallback(async () => {
    const trimmed = messageInput.trim();
    if ((!trimmed && !attachedTopic) || isSending) return false;

    const finalContent = trimmed || `Mình chia sẻ bộ từ "${attachedTopic?.name || 'Từ vựng'}" để mọi người cùng học nhé!`;

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (typeof window !== 'undefined' && window.openRequireLoginModal) {
          window.openRequireLoginModal(
            'Đăng nhập để trò chuyện và trao đổi từ vựng cùng cộng đồng nhé!',
            'Đăng nhập để tham gia Chat 💬',
            'gửi tin nhắn cộng đồng'
          );
        } else {
          window.showHiToast?.('Vui lòng đăng nhập để gửi tin nhắn!', 'error');
        }
        return false;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      const fallbackName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Học viên HiVocab';
      const avatarUrl =
        user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      const { data: inserted, error } = await supabase
        .from('community_messages')
        .insert({
          channel_id: activeChannel,
          user_id: user.id,
          author_name: fallbackName,
          author_avatar: avatarUrl,
          content: finalContent,
          attached_topic_id: attachedTopic?.id || null,
        })
        .select(MESSAGE_SELECT)
        .single();

      if (error) throw error;

      setMessageInput('');
      setAttachedTopic(null);
      setIsAttachMenuOpen(false);
      if (inserted) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === inserted.id)) return prev;
          return [...prev, inserted].slice(-60);
        });
      }
      return true;
    } catch (err) {
      window.showHiToast?.(err.message || 'Không thể gửi tin nhắn lúc này.', 'error');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [messageInput, attachedTopic, isSending, activeChannel]);

  const deleteMessage = useCallback(async (messageId) => {
    if (!messageId) return;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      const { error } = await supabase
        .from('community_messages')
        .delete()
        .eq('id', messageId);
      if (error) throw error;
    } catch (err) {
      window.showHiToast?.(err.message || 'Không thể xóa tin nhắn.', 'error');
      fetchMessages(activeChannelRef.current);
    }
  }, [fetchMessages]);

  return {
    channels: CHAT_CHANNELS,
    activeChannel,
    setActiveChannel,
    messages,
    isLoading,
    chatError,
    isRealtimeConnected,
    onlineCount,
    messageInput,
    setMessageInput,
    isSending,
    attachedTopic,
    setAttachedTopic,
    myPublicTopics,
    isAttachMenuOpen,
    setIsAttachMenuOpen,
    toggleAttachMenu,
    sendMessage,
    deleteMessage,
    retryFetch: () => fetchMessages(activeChannel),
  };
}
