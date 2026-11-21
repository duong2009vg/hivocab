// src/components/library/CommunityChatWidget.jsx
// Tái sử dụng card sáp màu Bé Hổ thành Phòng Chat Cộng Đồng Realtime (Desktop Sidebar + Modal Mở Rộng)
import React, { useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Plus,
  X,
  Maximize2,
  Trash2,
  BookOpen,
  Flag,
  RotateCcw,
} from 'lucide-react';

function renderCompactTime(iso) {
  if (!iso) return '';
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 60) return 'Vừa xong';
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `${m}p`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}g`;
  return `${Math.floor(h / 24)}n`;
}

function getInitials(name) {
  return (String(name || 'HV').trim().slice(0, 2) || 'HV').toUpperCase();
}

export function CommunityChatWidget({
  chat,
  currentUserId,
  getSafeAvatarUrl,
  onOpenTopicDetail,
  onOpenCreateTopic,
  onExpandChat,
  variant = 'card', // 'card' | 'modal'
  onCloseModal,
}) {
  const scrollContainerRef = useRef(null);
  const isModal = variant === 'modal';

  // Auto-scroll to latest message cleanly
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat.messages.length, chat.activeChannel]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chat.sendMessage();
    }
  };

  const activeChannelMeta =
    chat.channels.find((c) => c.id === chat.activeChannel) || chat.channels[0];

  return (
    <div
      className={
        isModal
          ? 'bg-gradient-to-b from-[#E7EFE3] to-[#F1F7EE] border-[2.5px] border-[#2D2824] rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl w-full max-w-2xl h-[86vh] sm:h-[640px] flex flex-col relative overflow-hidden'
          : 'bg-gradient-to-b from-[#E7EFE3] to-[#F1F7EE] border-[2.5px] border-[#2D2824] rounded-3xl p-4 xl:p-5 shadow-[3px_3px_0px_#2D2824] relative overflow-hidden flex flex-col h-[460px]'
      }
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-2.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white border-2 border-[#2D2824] p-0.5 shadow-[1.5px_1.5px_0px_#2D2824] shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src="/mascot/mascot_cozy.png"
              alt="Bé Hổ HiVocab"
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-black text-sm text-[#2D2824] truncate">Chat cộng đồng</h4>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#4B6B46] bg-white/90 px-1.5 py-0.5 rounded-full border border-[#5A7E56]/40 shrink-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    chat.isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span>{chat.onlineCount}</span>
              </span>
            </div>
            <p className="text-[10.5px] font-semibold text-[#5C6B57] truncate">
              {activeChannelMeta?.desc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isModal && typeof onOpenCreateTopic === 'function' && (
            <button
              type="button"
              onClick={onOpenCreateTopic}
              title="Tạo & chia sẻ bộ từ mới"
              className="px-2 py-1 rounded-xl bg-white hover:bg-[#FAF5ED] text-[#2D2824] text-[10.5px] font-black border-2 border-[#2D2824] shadow-[1.5px_1.5px_0px_#2D2824] active:translate-y-0.5 transition-all flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Bộ từ</span>
            </button>
          )}
          {!isModal && typeof onExpandChat === 'function' && (
            <button
              type="button"
              onClick={onExpandChat}
              title="Mở rộng khung chat"
              aria-label="Mở rộng khung chat"
              className="w-7 h-7 rounded-xl bg-white hover:bg-[#FAF5ED] text-[#2D2824] border-2 border-[#2D2824] shadow-[1.5px_1.5px_0px_#2D2824] active:translate-y-0.5 transition-all flex items-center justify-center cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
          {isModal && typeof onCloseModal === 'function' && (
            <button
              type="button"
              onClick={onCloseModal}
              aria-label="Đóng khung chat"
              className="w-9 h-9 rounded-xl bg-white hover:bg-[#FAF5ED] text-[#2D2824] border-2 border-[#2D2824] shadow-[1.5px_1.5px_0px_#2D2824] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Channel Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 shrink-0">
        {chat.channels.map((ch) => {
          const isActive = chat.activeChannel === ch.id;
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => chat.setActiveChannel(ch.id)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black border-[1.5px] border-[#2D2824] whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#2D2824] text-white shadow-[1px_1px_0px_#5A7E56]'
                  : 'bg-white/90 text-[#2D2824] hover:bg-white'
              }`}
            >
              {ch.label}
            </button>
          );
        })}
      </div>

      {/* Messages Feed Window */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto bg-white/85 rounded-2xl border-2 border-[#2D2824]/30 p-3 space-y-2.5"
      >
        {chat.isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-[#68594D]">
            <div className="w-6 h-6 border-[3px] border-[#5A7E56]/25 border-t-[#5A7E56] rounded-full animate-spin" />
            <span className="text-xs font-bold">Đang tải tin nhắn...</span>
          </div>
        ) : chat.chatError ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2 p-3">
            <p className="text-xs font-bold text-rose-600">{chat.chatError}</p>
            <button
              type="button"
              onClick={chat.retryFetch}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#2D2824] text-xs font-black text-[#2D2824] inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Thử lại</span>
            </button>
          </div>
        ) : chat.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-3 gap-2">
            <MessageSquare className="w-8 h-8 text-[#5A7E56]/40" />
            <p className="text-xs font-bold text-[#68594D] leading-relaxed">
              Chưa có tin nhắn nào ở kênh <strong className="text-[#2D2824]">{activeChannelMeta?.label}</strong>.
              <br />
              Hãy gửi lời chào hoặc hỏi đáp cùng mọi người nhé!
            </p>
          </div>
        ) : (
          chat.messages.map((msg) => {
            const isMine = Boolean(currentUserId && msg.user_id === currentUserId);
            const avatarUrl = getSafeAvatarUrl ? getSafeAvatarUrl(msg.author_avatar) : '';
            const topicCard = msg.attached_topic?.is_public ? msg.attached_topic : null;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 group ${isMine ? 'flex-row-reverse' : ''}`}
              >
                <div className="w-7 h-7 rounded-full bg-[#E8EFE5] border border-[#2D2824] flex items-center justify-center text-[10px] font-black text-[#5A7E56] shrink-0 overflow-hidden mt-0.5">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(msg.author_name)
                  )}
                </div>

                <div
                  className={`min-w-0 max-w-[82%] rounded-2xl px-3 py-2 border ${
                    isMine
                      ? 'bg-[#E7EFE3] border-[#5A7E56]/50 text-[#1F2A1E]'
                      : 'bg-[#FAF5ED] border-[#2D2824]/15 text-[#2D2824]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-[11px] font-black truncate max-w-[140px]">
                      {msg.author_name || 'Học viên'}
                    </span>
                    {msg.author_is_pro && (
                      <span className="text-[9px] font-black px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 leading-none">
                        PRO
                      </span>
                    )}
                    <span className="text-[9.5px] font-semibold text-[#786F66]">
                      {renderCompactTime(msg.created_at)}
                    </span>

                    <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {isMine ? (
                        <button
                          type="button"
                          onClick={() => chat.deleteMessage(msg.id)}
                          title="Xóa tin nhắn"
                          className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            window.openBugReportModal?.({
                              initialType: 'feedback',
                              feature: 'Chat cộng đồng',
                              title: `Báo cáo tin nhắn của ${msg.author_name || 'thành viên'}`,
                              contextData: { message_id: msg.id, channel_id: msg.channel_id },
                            })
                          }
                          title="Báo cáo tin nhắn"
                          className="text-[#786F66] hover:text-[#E66946] p-0.5 cursor-pointer"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>

                  {topicCard && (
                    <button
                      type="button"
                      onClick={() => onOpenTopicDetail?.(topicCard.id)}
                      className="mt-1.5 w-full text-left px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FEF8EA] border border-[#2D2824]/40 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#5A7E56] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-black text-[#2D2824] truncate">
                          {topicCard.name}
                        </div>
                        <div className="text-[10px] font-semibold text-[#68594D]">
                          {topicCard.word_count || 0} từ vựng · Nhấn để xem
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Composer + Optional Deck Attachment Picker */}
      <div className="pt-2.5 shrink-0 relative">
        {chat.isAttachMenuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 border-[#2D2824] rounded-2xl shadow-[3px_3px_0px_#2D2824] p-2.5 z-20 max-h-44 overflow-y-auto">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black text-[#2D2824]">
                Đính kèm bộ từ công khai của bạn
              </span>
              <button
                type="button"
                onClick={() => chat.setIsAttachMenuOpen(false)}
                className="text-[#68594D] hover:text-[#2D2824] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {chat.myPublicTopics.length === 0 ? (
              <p className="text-[11px] font-semibold text-[#68594D] py-1">
                Bạn chưa có bộ từ công khai nào. Hãy bật Công khai ở tab Bộ từ của tôi trước nhé!
              </p>
            ) : (
              <div className="space-y-1">
                {chat.myPublicTopics.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      chat.setAttachedTopic(t);
                      chat.setIsAttachMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-[#E7EFE3] text-xs font-bold text-[#2D2824] flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="text-[10px] font-semibold text-[#5A7E56] shrink-0">
                      {t.word_count || 0} từ
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {chat.attachedTopic && (
          <div className="mb-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#2D2824] flex items-center justify-between gap-2 text-[11px]">
            <span className="font-bold text-[#2D2824] truncate flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-[#5A7E56] shrink-0" />
              <span className="truncate">Đính kèm: {chat.attachedTopic.name}</span>
            </span>
            <button
              type="button"
              onClick={() => chat.setAttachedTopic(null)}
              className="text-rose-500 hover:text-rose-700 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={chat.toggleAttachMenu}
            title="Đính kèm bộ từ công khai"
            className="w-9 h-9 rounded-xl bg-white hover:bg-[#FAF5ED] border-2 border-[#2D2824] text-[#2D2824] flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_#2D2824] active:translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={chat.messageInput}
            onChange={(e) => chat.setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={600}
            placeholder="Nhắn tin cùng cộng đồng..."
            className="flex-1 min-w-0 bg-white rounded-xl px-3 py-2 text-xs font-semibold text-[#2D2824] placeholder:text-stone-400 border-2 border-[#2D2824] focus:outline-none focus:ring-2 focus:ring-[#5A7E56]"
          />

          <button
            type="button"
            onClick={chat.sendMessage}
            disabled={(!chat.messageInput.trim() && !chat.attachedTopic) || chat.isSending}
            aria-label="Gửi tin nhắn"
            className="w-9 h-9 rounded-xl bg-[#5A7E56] hover:bg-[#4B6B46] text-white border-2 border-[#2D2824] flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_#2D2824] disabled:opacity-45 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CommunityChatWidget;
