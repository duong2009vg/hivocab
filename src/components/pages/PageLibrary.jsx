import React, { useState } from 'react';
import { useLibrary } from '../../hooks/useLibrary';
import { useModal } from '../../context/ModalContext';

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} ngày trước`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} tháng trước`;
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} năm trước`;
}

function getInitials(name) {
  if (!name) return 'HV';
  return name.substring(0, 2).toUpperCase();
}

function isMaterialIcon(val) {
  if (!val || typeof val !== 'string') return false;
  return /^[a-z0-9_-]+$/i.test(val.trim());
}

function renderTopicIcon(icon, className = '') {
  if (!icon) return <span className={className}>📚</span>;
  const trimmed = icon.trim();
  if (isMaterialIcon(trimmed)) {
    return <span className={`material-symbols-outlined select-none align-middle ${className}`}>{trimmed}</span>;
  }
  return <span className={`select-none ${className}`}>{trimmed}</span>;
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center p-12 gap-3">
      <div className="w-10 h-10 border-4 border-[#2D2824]/20 border-t-[#E66946] rounded-full animate-spin" />
      <span className="text-xs sm:text-sm font-bold text-[#68594D]">Đang nạp dữ liệu cộng đồng sáp màu... 🎨</span>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-white rounded-3xl border-2 border-[#2D2824] shadow-[3px_3px_0px_#2D2824]">
      <span className="text-4xl mb-2">🌧️</span>
      <h3 className="text-base font-black text-[#2D2824] mb-1">Không thể tải dữ liệu thư viện</h3>
      <p className="text-xs sm:text-sm text-[#68594D] max-w-sm mb-4 font-semibold">{error}</p>
      <button 
        type="button"
        onClick={onRetry}
        className="px-5 py-2.5 rounded-2xl bg-[#E66946] text-white text-xs sm:text-sm font-extrabold shadow-[2px_2px_0px_#2D2824] hover:bg-[#db5d39] transition-all active:translate-x-0.5 active:translate-y-0.5"
      >
        Thử lại ngay 🔄
      </button>
    </div>
  );
}

function EmptyState({ tab, onOpenCreate }) {
  const isMy = tab === 'my';
  const isLiked = tab === 'liked';

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border-2 border-[#2D2824] shadow-[3px_3px_0px_#2D2824]">
      <span className="text-5xl mb-3">
        {isMy ? '🗂️' : isLiked ? '💖' : '🔍'}
      </span>
      <h3 className="text-lg font-black text-[#2D2824] mb-1">
        {isMy ? 'Bạn chưa tạo bộ từ nào' : isLiked ? 'Chưa có bộ từ yêu thích' : 'Không tìm thấy bộ từ phù hợp'}
      </h3>
      <p className="text-xs sm:text-sm text-[#68594D] max-w-sm mb-5 font-semibold">
        {isMy 
          ? 'Tạo các bộ từ cá nhân của bạn để học tập bằng phương pháp tranh vẽ và chia sẻ cùng cộng đồng.'
          : isLiked 
          ? 'Khám phá các bộ từ nổi bật và bấm biểu tượng trái tim để lưu lại vào bộ sưu tập cá nhân.'
          : 'Hãy thử tìm kiếm với từ khóa khác hoặc bấm chọn hashtag phổ biến khác nhé!'}
      </p>
      {isMy && (
        <button 
          type="button"
          onClick={onOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-[#E66946] text-white text-xs sm:text-sm font-black shadow-[3px_3px_0px_#2D2824] hover:bg-[#db5d39] transition-all active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2"
        >
          <span>✏️</span>
          <span>Tạo bộ từ mới ngay</span>
        </button>
      )}
    </div>
  );
}

function CommentsDrawer({ lib }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      lib.submitComment();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-[#FAF5ED] w-full max-w-xl h-[80vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl border-2 border-[#2D2824] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b-2 border-dashed border-[#2D2824]/20 sticky top-0 bg-[#FAF5ED]/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <h3 className="font-black text-base sm:text-lg text-[#2D2824] truncate pr-4">
              Bình luận: {lib.activeCommentsTitle || 'Bộ từ vựng'}
            </h3>
          </div>
          <button 
            type="button"
            onClick={lib.closeComments}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-[#2D2824] hover:bg-[#FAF5ED] text-[#2D2824] transition-colors shadow-[1.5px_1.5px_0px_#2D2824]"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {lib.isCommentsLoading ? (
            <LoadingSpinner />
          ) : lib.comments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70 p-8">
              <span className="text-4xl mb-2">🐾</span>
              <p className="text-sm font-bold text-[#68594D]">Chưa có bình luận nào.<br/>Hãy là người đầu tiên để lại lời nhắn cùng bé Hổ!</p>
            </div>
          ) : (
            lib.comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#E8EFE5] border border-[#2D2824] text-[#5A7E56] font-black text-xs shrink-0 mt-0.5 shadow-sm">
                  {c.author_avatar ? (
                    <img src={c.author_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(c.author_name)
                  )}
                </div>
                <div className="flex flex-col bg-white rounded-2xl p-3 max-w-[85%] border-2 border-[#2D2824]/20 shadow-xs">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-extrabold text-xs sm:text-sm text-[#2D2824]">{c.author_name || 'Học viên'}</span>
                    <span className="text-[10px] text-[#68594D]">{formatTimeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#2D2824] whitespace-pre-wrap leading-relaxed font-medium">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3.5 border-t-2 border-[#2D2824]/20 bg-[#FAF5ED] flex gap-2 items-end">
          <textarea
            value={lib.commentInput}
            onChange={(e) => lib.setCommentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Viết bình luận... (Ctrl+Enter để gửi nhanh)"
            className="flex-1 bg-white rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[#2D2824] placeholder:text-stone-400 outline-none border-2 border-[#2D2824] focus:ring-2 focus:ring-[#5A7E56] resize-none max-h-[120px] min-h-[44px] font-semibold"
            rows={1}
          />
          <button
            type="button"
            onClick={lib.submitComment}
            disabled={!lib.commentInput.trim()}
            className="w-11 h-11 rounded-2xl bg-[#E66946] text-white flex items-center justify-center hover:bg-[#db5d39] disabled:opacity-40 transition-all shrink-0 active:scale-95 shadow-[2px_2px_0px_#2D2824] border-2 border-[#2D2824]"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

function HashtagPublishModal({ lib }) {
  const toggleTag = (tag) => {
    lib.setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-[#FAF5ED] w-full max-w-[440px] rounded-3xl flex flex-col shadow-2xl p-6 border-[2.5px] border-[#2D2824]">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FDEEE9] text-[#E66946] border-2 border-[#2D2824] shadow-[2px_2px_0px_#2D2824] mx-auto mb-3 text-2xl">
          🎒
        </div>
        <h3 className="font-black text-xl text-center text-[#2D2824] mb-1">Công khai bộ từ vựng</h3>
        <p className="text-center text-[#68594D] text-xs font-semibold mb-4 leading-relaxed">
          Thêm mô tả và hashtag để bộ từ của bạn tiếp cận hàng ngàn học viên trên Thư Viện Sáp Màu.
        </p>

        <textarea
          value={lib.publishDescription}
          onChange={(e) => lib.setPublishDescription(e.target.value)}
          placeholder="Mô tả ngắn gọn về bộ từ vựng này..."
          className="w-full bg-white rounded-2xl p-3.5 text-xs sm:text-sm text-[#2D2824] placeholder:text-stone-400 outline-none border-2 border-[#2D2824] focus:ring-2 focus:ring-[#5A7E56] resize-none h-24 mb-4 font-medium"
        />

        <p className="text-xs font-black text-[#2D2824] mb-2">Chọn ít nhất 1 hashtag <span className="text-[#E66946]">*</span></p>
        <div className="flex flex-wrap gap-2 mb-6 max-h-[140px] overflow-y-auto pb-2">
          {lib.SUGGESTED_HASHTAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 border-[#2D2824] shadow-[1.5px_1.5px_0px_#2D2824] ${
                lib.selectedTags.includes(tag)
                  ? 'bg-[#2D2824] text-white'
                  : 'bg-white text-[#2D2824] hover:bg-[#FEF8EA]'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button 
            type="button"
            onClick={lib.cancelPublish}
            disabled={lib.isPublishing}
            className="flex-1 py-2.5 rounded-2xl bg-white border-2 border-[#2D2824] text-[#2D2824] font-black text-xs sm:text-sm hover:bg-[#F5EDE0] transition-colors shadow-[2px_2px_0px_#2D2824]"
          >
            Hủy
          </button>
          <button 
            type="button"
            onClick={lib.confirmPublish}
            disabled={lib.isPublishing || lib.selectedTags.length === 0}
            className="flex-1 py-2.5 rounded-2xl bg-[#5A7E56] border-2 border-[#2D2824] text-white font-black text-xs sm:text-sm hover:bg-[#4B6B46] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[2px_2px_0px_#2D2824] active:translate-x-0.5 active:translate-y-0.5"
          >
            {lib.isPublishing ? 'Đang đăng tải...' : 'Đăng tải ngay 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LibrarySearchModal({ lib, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] bg-[#FAF5ED] flex flex-col p-4 sm:hidden">
      <div className="flex items-center gap-3 pb-3 border-b-2 border-dashed border-[#2D2824]/20">
        <button 
          type="button"
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border-2 border-[#2D2824] shadow-[2px_2px_0px_#2D2824] text-[#2D2824] font-bold shrink-0"
        >
          ‹
        </button>
        <div className="flex-1 relative">
          <input
            autoFocus
            type="text"
            value={lib.searchQuery}
            onChange={(e) => lib.setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bộ từ..."
            className="w-full bg-white rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#2D2824] outline-none border-2 border-[#2D2824] shadow-[2px_2px_0px_#2D2824] font-bold"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-stone-400">🔍</span>
          {lib.searchQuery && (
            <button 
              type="button"
              onClick={() => lib.setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-stone-200 text-[#2D2824] text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="pt-4">
        <p className="text-xs font-black text-[#68594D] uppercase tracking-wider mb-3">Hashtag phổ biến</p>
        <div className="flex flex-wrap gap-2">
          {lib.SUGGESTED_HASHTAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                lib.setSearchQuery(tag);
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-[#2D2824] border-2 border-[#2D2824] shadow-[2px_2px_0px_#2D2824] active:scale-95"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThreadDetailModal({ lib }) {
  const detail = lib.activeTopicDetail;
  if (!detail) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-[#FAF5ED] w-full max-w-3xl h-full sm:h-[88vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden relative border-[2.5px] border-[#2D2824]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-dashed border-[#2D2824]/20 sticky top-0 bg-[#FAF5ED]/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📖</span>
            <div>
              <h2 className="font-black text-base sm:text-lg text-[#2D2824] truncate">
                {detail.name || 'Chi tiết bộ từ vựng'}
              </h2>
              <span className="text-[11px] font-bold text-[#68594D]">HiVocab Crayon Picture Book</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={lib.closeDetail}
            className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white border-2 border-[#2D2824] shadow-[2px_2px_0px_#2D2824] hover:bg-[#FAF5ED] text-[#2D2824] font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto pb-28 p-4 sm:p-6 space-y-6">
          {detail._loading ? (
            <LoadingSpinner />
          ) : lib.detailError ? (
            <ErrorState error={lib.detailError} onRetry={() => lib.openDetail(detail.id)} />
          ) : (
            <>
              {/* Author & Header info */}
              <div className="flex gap-4 items-start bg-white border-2 border-[#2D2824] rounded-3xl p-5 shadow-[3px_3px_0px_#2D2824]">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#E8EFE5] border-2 border-[#2D2824] text-[#5A7E56] font-black text-lg shrink-0 shadow-[2px_2px_0px_#2D2824]">
                  {detail.author_avatar ? (
                    <img src={detail.author_avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    getInitials(detail.author_name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-[#2D2824] text-base truncate">{detail.author_name || 'Học viên HiVocab'}</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-[#68594D] text-xs font-semibold">{formatTimeAgo(detail.created_at)}</span>
                  </div>
                  <h3 className="font-black text-[#2D2824] text-xl sm:text-2xl mb-2 flex items-center gap-2">
                    {renderTopicIcon(detail.icon, 'text-2xl')}
                    <span>{detail.name}</span>
                  </h3>
                  {detail.description && (
                    <p className="text-[#68594D] text-xs sm:text-sm whitespace-pre-wrap leading-relaxed mb-3 font-medium">
                      {detail.description}
                    </p>
                  )}
                  {detail.tags && detail.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {detail.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center text-[#5A7E56] text-xs font-bold px-2.5 py-1 rounded-xl bg-[#E8EFE5] border border-[#5A7E56]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Words list */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-dashed border-[#2D2824]/20">
                  <h4 className="font-black text-base text-[#2D2824] flex items-center gap-2">
                    <span>📝</span>
                    Danh sách từ ({detail.words?.length || 0} từ)
                  </h4>
                  <span className="text-xs font-bold text-[#68594D] bg-[#FEF8EA] border border-[#2D2824] px-2.5 py-0.5 rounded-full">
                    Kèm phát âm & ví dụ
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(detail.words || []).map((word, idx) => (
                    <div key={word.id || idx} className="bg-white rounded-2xl p-4 border-2 border-[#2D2824] shadow-[2px_2px_0px_#2D2824] flex flex-col justify-between hover:-translate-y-0.5 transition-all">
                      <div>
                        <div className="flex justify-between items-start mb-1.5 gap-2">
                          <div>
                            <h5 className="font-black text-base text-[#2D2824]">{word.word}</h5>
                            <span className="text-[#68594D] text-xs font-mono font-bold">
                              {word.phonetic ? `/${word.phonetic}/` : ''} {word.pos && `• ${word.pos}`}
                            </span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => lib.playWordAudio(word.word)}
                            className="w-8 h-8 rounded-xl bg-[#FEF8EA] border border-[#2D2824] text-[#2D2824] flex items-center justify-center hover:bg-amber-100 transition-colors shrink-0 shadow-sm"
                            title="Nghe phát âm"
                          >
                            🔊
                          </button>
                        </div>
                        <p className="text-[#2D2824] text-xs sm:text-sm font-bold mb-2">{word.meaning}</p>
                      </div>
                      {word.example_sentence && (
                        <p className="text-[#68594D] text-xs italic border-l-2 border-[#E66946] pl-2.5 py-0.5 mt-auto bg-[#FAF5ED] rounded-r-lg font-medium">
                          "{word.example_sentence}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action bar bottom */}
        {!detail._loading && !lib.detailError && (
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-white border-t-2 border-[#2D2824] flex items-center justify-around z-20">
            <button 
              type="button"
              onClick={() => lib.handleLike(detail.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-[#2D2824] shadow-[2px_2px_0px_#2D2824] transition-all font-black text-xs sm:text-sm active:translate-y-0.5 ${
                detail.hasLiked ? 'bg-[#FDEEE9] text-[#E66946]' : 'bg-white text-[#2D2824] hover:bg-[#FAF5ED]'
              }`}
            >
              <span>{detail.hasLiked ? '❤️' : '🤍'}</span>
              <span>{detail.like_count || 0}</span>
            </button>
            <button 
              type="button"
              onClick={() => lib.openComments(detail.id, detail.name)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-2 border-[#2D2824] shadow-[2px_2px_0px_#2D2824] text-[#2D2824] hover:bg-[#FAF5ED] transition-all font-black text-xs sm:text-sm active:translate-y-0.5"
            >
              <span>💬</span>
              <span>Bình luận</span>
            </button>
            <button 
              type="button"
              onClick={() => lib.handleClone(detail.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#5A7E56] border-2 border-[#2D2824] text-white hover:bg-[#4B6B46] transition-all font-black text-xs sm:text-sm shadow-[3px_3px_0px_#2D2824] active:translate-x-0.5 active:translate-y-0.5"
            >
              <span>📥</span>
              <span>Lưu bộ từ ({detail.clone_count || 0})</span>
            </button>
            <button 
              type="button"
              onClick={() => lib.handleShare(detail.id, detail.name)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-2 border-[#2D2824] shadow-[2px_2px_0px_#2D2824] text-[#2D2824] hover:bg-[#FAF5ED] transition-all font-black text-xs sm:text-sm active:translate-y-0.5"
            >
              <span>🔗</span>
              <span>Chia sẻ</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PageLibrary() {
  const lib = useLibrary();
  const { openModal } = useModal ? useModal() : { openModal: () => {} };
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleOpenCreate = () => {
    if (openModal) {
      openModal('createTopic');
    } else {
      window.openCreateTopicModal?.();
    }
  };

  return (
    <div id="page-library" className="page active min-h-screen bg-[#FAF5ED] selection:bg-[#F4BA42] selection:text-[#2D2824]">
      
      {/* ─────────────────────────────────────────────────────────────────
          DESKTOP VIEW (lg:flex, offset lg:pl-64 xl:pl-72 for sidebar)
          ───────────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col min-h-screen lg:pl-64 xl:pl-72 w-full">
        
        {/* Sticky Top Header */}
        <header className="border-b-2 border-[#2D2824] bg-white/90 backdrop-blur-sm px-8 py-5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FDEEE9] border-2 border-[#2D2824] flex items-center justify-center text-2xl shadow-[2px_2px_0px_#2D2824]">
              🎒
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#2D2824] font-quicksand">Thư viện cộng đồng</h1>
                <span className="text-[#E66946] text-lg animate-pulse">✨</span>
                <span className="bg-[#E8EFE5] text-[#5A7E56] text-xs font-black px-2.5 py-0.5 rounded-full border border-[#5A7E56]">
                  {lib.topics.length > 0 ? `${lib.topics.length} Bộ từ vựng` : '2,500+ Bộ từ vựng'}
                </span>
              </div>
              <p className="text-xs font-bold text-[#68594D] mt-0.5">
                Khám phá, chia sẻ và lưu trữ hàng ngàn bộ từ vựng phong phú từ cộng đồng học viên HiVocab.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => lib.setCurrentTab('liked')}
              className={`px-3.5 py-2 border-2 border-[#2D2824] rounded-2xl text-xs font-black transition-all shadow-[2px_2px_0px_#2D2824] active:translate-y-0.5 flex items-center gap-1.5 ${
                lib.currentTab === 'liked' ? 'bg-[#2D2824] text-white' : 'bg-white text-[#2D2824] hover:bg-[#FAF5ED]'
              }`}
            >
              <span>🔖</span>
              <span>Bộ từ đã lưu</span>
            </button>
            <button 
              type="button"
              onClick={handleOpenCreate}
              className="bg-[#E66946] text-white border-2 border-[#2D2824] font-black px-5 py-2.5 rounded-2xl shadow-[3px_3px_0px_#2D2824] hover:bg-[#db5d39] transition-all active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2 text-sm"
            >
              <span className="text-base font-black">+</span>
              <span>Tạo &amp; Đóng góp bộ từ</span>
            </button>
          </div>
        </header>

        {/* Search & Filter Toolbar */}
        <section className="px-8 pt-6 pb-2 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            
            {/* Search Box */}
            <div className="relative flex-1 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#68594D]">🔍</span>
              <input 
                type="text"
                value={lib.searchQuery}
                onChange={(e) => lib.setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm bộ từ vựng, tác giả, nội dung hoặc chủ đề..."
                className="w-full pl-11 pr-12 py-3 bg-white border-2 border-[#2D2824] rounded-2xl text-sm font-bold placeholder:text-stone-400 focus:outline-none shadow-[2px_2px_0px_#2D2824]"
              />
              {lib.searchQuery && (
                <button 
                  type="button"
                  onClick={() => lib.setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-xl text-[#68594D] hover:bg-stone-100 transition-all font-bold text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Segmented Tab Bar */}
            <div className="flex items-center gap-1.5 bg-[#FAF5ED] p-1 rounded-2xl border-2 border-[#2D2824] shadow-[2px_2px_0px_#2D2824] shrink-0">
              <button 
                type="button"
                onClick={() => lib.setCurrentTab('feed')}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  lib.currentTab === 'feed'
                    ? 'bg-[#2D2824] text-white shadow-xs'
                    : 'text-[#68594D] hover:text-[#2D2824] hover:bg-white/80'
                }`}
              >
                <span>🧭</span>
                <span>Khám phá</span>
              </button>
              <button 
                type="button"
                onClick={() => lib.setCurrentTab('my')}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  lib.currentTab === 'my'
                    ? 'bg-[#2D2824] text-white shadow-xs'
                    : 'text-[#68594D] hover:text-[#2D2824] hover:bg-white/80'
                }`}
              >
                <span>🗂️</span>
                <span>Bộ từ của tôi</span>
              </button>
              <button 
                type="button"
                onClick={() => lib.setCurrentTab('liked')}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  lib.currentTab === 'liked'
                    ? 'bg-[#2D2824] text-white shadow-xs'
                    : 'text-[#68594D] hover:text-[#2D2824] hover:bg-white/80'
                }`}
              >
                <span>❤️</span>
                <span>Đã thích</span>
              </button>
            </div>
          </div>

          {/* Filter Tags & Sort Options */}
          {lib.currentTab !== 'my' && (
            <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                
                {/* Sort selector */}
                <select
                  value={lib.sortBy}
                  onChange={(e) => lib.setSortBy(e.target.value)}
                  className="bg-[#FDEEE9] text-[#E66946] border-2 border-[#2D2824] px-3.5 py-1.5 rounded-full font-black text-xs shadow-[2px_2px_0px_#2D2824] cursor-pointer outline-none hover:bg-orange-100 transition-all"
                >
                  <option value="popular">🔥 Phổ biến nhất</option>
                  <option value="clones">📥 Tải nhiều nhất</option>
                  <option value="newest">✨ Mới nhất</option>
                </select>

                <span className="text-stone-300">|</span>

                {/* Filter tags pills */}
                {lib.AVAILABLE_TAGS.map(tag => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => lib.setCurrentTag(tag.value)}
                    className={`border-2 border-[#2D2824] px-3.5 py-1.5 rounded-full shadow-[2px_2px_0px_#2D2824] transition-all whitespace-nowrap active:translate-y-0.5 ${
                      lib.currentTag === tag.value
                        ? 'bg-[#2D2824] text-white font-black'
                        : 'bg-white hover:bg-[#FAF5ED] text-[#2D2824] font-bold'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              {/* Total counter */}
              <div className="text-xs font-extrabold text-[#68594D] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5A7E56] animate-pulse inline-block"></span>
                Hiển thị {lib.topics.length} bộ từ vựng tuyển chọn
              </div>
            </div>
          )}
        </section>

        {/* Main Grid: Left Column Decks + Right Column Sidebar */}
        <section className="px-8 py-4 grid grid-cols-12 gap-8 items-start pb-20">
          
          {/* Left Column (8 cols) */}
          <div className="col-span-12 xl:col-span-8 space-y-6">
            {lib.isLoading ? (
              <LoadingSpinner />
            ) : lib.error ? (
              <ErrorState error={lib.error} onRetry={() => lib.setCurrentTab(lib.currentTab)} />
            ) : lib.topics.length === 0 ? (
              <EmptyState tab={lib.currentTab} onOpenCreate={handleOpenCreate} />
            ) : lib.currentTab === 'my' ? (
              /* My Topics List with Public/Private Switch */
              <div className="space-y-4">
                {lib.topics.map(topic => (
                  <article key={topic.id} className="bg-white border-[2.5px] border-[#2D2824] rounded-3xl p-6 shadow-[3px_3px_0px_#2D2824] hover:-translate-y-0.5 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          {renderTopicIcon(topic.icon, 'text-2xl')}
                          <h3 className="text-lg font-black text-[#2D2824] truncate">{topic.name}</h3>
                        </div>
                        {topic.description && (
                          <p className="text-xs text-[#68594D] font-medium line-clamp-2 mb-2.5">
                            {topic.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-[#68594D] font-bold">
                          <span>📖 {topic.totalWords || 0} từ</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">❤️ {topic.like_count || 0}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">📥 {topic.clone_count || 0}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(topic.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <button 
                          type="button"
                          onClick={() => lib.handlePublicToggle(topic.id, !topic.is_public)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-black border-2 border-[#2D2824] shadow-[1.5px_1.5px_0px_#2D2824] transition-all flex items-center gap-1.5 ${
                            topic.is_public 
                              ? 'bg-[#E8EFE5] text-[#5A7E56]' 
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          <span>{topic.is_public ? '🌐' : '🔒'}</span>
                          <span>{topic.is_public ? 'Công khai' : 'Riêng tư'}</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => window._openTopic?.(topic.id)}
                          className="px-4 py-2 rounded-2xl bg-[#5A7E56] text-white text-xs font-black border-2 border-[#2D2824] shadow-[2px_2px_0px_#2D2824] hover:bg-[#4B6B46] active:translate-y-0.5 transition-all flex items-center gap-1.5"
                        >
                          <span>Mở học</span>
                          <span>➔</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              /* Feed & Liked Cards Grid */
              <div className="space-y-6">
                {lib.topics.map(topic => (
                  <article 
                    key={topic.id}
                    className="bg-white border-[2.5px] border-[#2D2824] rounded-3xl p-6 shadow-[3px_3px_0px_#2D2824] hover:-translate-y-1 transition-all duration-200"
                  >
                    {/* Author Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-[#E8EFE5] border-2 border-[#2D2824] flex items-center justify-center font-black text-sm text-[#5A7E56] shadow-[2px_2px_0px_#2D2824]">
                            {topic.author_avatar ? (
                              <img src={topic.author_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              getInitials(topic.author_name)
                            )}
                          </div>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); lib.handleClone(topic.id); }}
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#F4BA42] border border-[#2D2824] flex items-center justify-center text-[11px] font-black hover:scale-110 active:scale-95 transition-transform"
                            title="Lưu bộ từ về kho cá nhân"
                          >
                            +
                          </button>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 
                              onClick={() => lib.openDetail(topic.id)}
                              className="font-black text-base text-[#2D2824] hover:underline cursor-pointer"
                            >
                              {topic.author_name || 'Học viên HiVocab'}
                            </h3>
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 rounded border border-amber-300">
                              {topic.is_pro ? 'Học viên PRO' : 'Thành viên'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[#68594D]">
                            {formatTimeAgo(topic.created_at)} • Đã kiểm duyệt nội dung
                          </p>
                        </div>
                      </div>

                      {/* Share and quick action */}
                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          onClick={() => lib.handleShare(topic.id, topic.name)}
                          className="w-9 h-9 rounded-2xl border-2 border-[#2D2824] bg-white flex items-center justify-center text-[#68594D] hover:bg-[#FAF5ED] shadow-[1.5px_1.5px_0px_#2D2824] active:translate-y-0.5 transition-all"
                          title="Sao chép liên kết chia sẻ"
                        >
                          🔗
                        </button>
                        <button 
                          type="button"
                          onClick={() => lib.handleLike(topic.id)}
                          className={`w-9 h-9 rounded-2xl border-2 border-[#2D2824] flex items-center justify-center shadow-[1.5px_1.5px_0px_#2D2824] active:translate-y-0.5 transition-all ${
                            topic.hasLiked ? 'bg-[#FDEEE9] text-[#E66946]' : 'bg-white text-[#68594D] hover:bg-[#FAF5ED]'
                          }`}
                          title={topic.hasLiked ? 'Bỏ thích' : 'Thích bộ từ'}
                        >
                          {topic.hasLiked ? '❤️' : '⭐'}
                        </button>
                      </div>
                    </div>

                    {/* Deck Content Title & Description */}
                    <div 
                      onClick={() => lib.openDetail(topic.id)}
                      className="space-y-2 border-l-4 border-[#E66946] pl-3.5 my-2 cursor-pointer group"
                    >
                      <h4 className="text-lg font-black text-[#2D2824] group-hover:text-[#E66946] transition-colors leading-tight flex items-center gap-2">
                        {renderTopicIcon(topic.icon, 'text-xl')}
                        <span className="truncate">{topic.name}</span>
                      </h4>
                      {topic.description && (
                        <p className="text-xs font-medium text-[#68594D] leading-relaxed line-clamp-3">
                          {topic.description}
                        </p>
                      )}
                    </div>

                    {/* Tags Section */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 pb-4">
                      <span className="bg-[#FAF5ED] border border-[#2D2824] px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5">
                        <span>📖</span> {topic.totalWords || 0} từ vựng
                      </span>
                      {topic.tags && topic.tags.map(tag => (
                        <span key={tag} className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-xl text-xs font-bold border border-stone-200">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Card Bottom Bar: Metrics & CTA */}
                    <div className="flex items-center justify-between pt-3 border-t-2 border-dashed border-stone-200">
                      <div className="flex items-center gap-6 text-xs font-black text-[#68594D]">
                        <button 
                          type="button"
                          onClick={() => lib.handleLike(topic.id)}
                          className="flex items-center gap-1.5 hover:text-[#E66946] transition-colors"
                        >
                          <span className="text-base text-[#E66946]">{topic.hasLiked ? '❤️' : '🤍'}</span>
                          <span>{topic.like_count || 0}</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => lib.openComments(topic.id, topic.name)}
                          className="flex items-center gap-1.5 hover:text-[#2D2824] transition-colors"
                        >
                          <span>💬</span>
                          <span>Bình luận</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <span>📥</span>
                          <span>{topic.clone_count || 0} lượt lưu</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          onClick={() => lib.openDetail(topic.id)}
                          className="px-4 py-2 bg-[#5A7E56] text-white font-extrabold text-xs rounded-xl border-2 border-[#2D2824] shadow-[2px_2px_0px_#2D2824] hover:bg-[#4B6B46] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
                        >
                          <span>✏️</span>
                          <span>Mở học ngay</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Right Column (4 cols) - Community & Mascot Sidebar Widget */}
          <aside className="col-span-12 xl:col-span-4 space-y-6">
            
            {/* Mascot Spotlight Box: Cùng Churbito chia sẻ bộ từ */}
            <div className="bg-gradient-to-b from-[#E7EFE3] to-[#F1F7EE] border-[2.5px] border-[#2D2824] rounded-3xl p-6 shadow-[3px_3px_0px_#2D2824] relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 bg-[#5A7E56] text-white text-[11px] font-black px-3 py-1 rounded-full border border-[#2D2824] shadow-xs">
                  <span>🐻</span> Gợi ý từ Bé Hổ
                </span>
                <span className="text-xs font-black text-[#5A7E56] font-hand">+50 Hạt mầm</span>
              </div>
              
              {/* Illustration & Text */}
              <div className="text-center my-3">
                <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden bg-white/70 border-2 border-[#2D2824] p-2 shadow-[2px_2px_0px_#2D2824] flex items-center justify-center">
                  <img 
                    alt="Bé Hổ mascot Churbito ngồi đệm ấm áp" 
                    className="w-full h-full object-contain mix-blend-multiply" 
                    src="/mascot/mascot_cozy.png"
                  />
                </div>
                <h4 className="text-xl font-black font-quicksand text-[#2D2824] mt-3">Đăng tải bộ thẻ từ của bạn!</h4>
                <p className="text-xs font-semibold text-[#68594D] mt-1.5 px-2 leading-relaxed">
                  Cùng hơn <strong className="text-[#2D2824] font-black">25,000+ bạn học</strong> mở rộng kho từ vựng mỗi ngày. Chia sẻ kiến thức để cùng nhau tiến bộ nhé!
                </p>
              </div>

              {/* Upload Deck Button */}
              <button 
                type="button"
                onClick={handleOpenCreate}
                className="w-full bg-white hover:bg-[#FAF5ED] text-[#2D2824] font-black py-3 px-4 rounded-2xl border-2 border-[#2D2824] shadow-[3px_3px_0px_#2D2824] transition-all active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 text-sm mt-4"
              >
                <span className="text-base">📝</span>
                <span>Tạo &amp; Tải lên bộ từ ngay</span>
              </button>
            </div>

            {/* Weekly Top Contributors Widget */}
            <div className="bg-white border-[2.5px] border-[#2D2824] rounded-3xl p-6 shadow-[3px_3px_0px_#2D2824] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2D2824]/20">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <h4 className="font-black text-base text-[#2D2824] font-quicksand">Tác giả nổi bật tuần</h4>
                </div>
                <span className="text-xs font-bold text-[#E66946]">Tuyển chọn</span>
              </div>

              {/* Author 1 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#FDEEE9] border-2 border-[#2D2824] flex items-center justify-center font-bold text-xs shadow-xs">
                    🥇
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-[#2D2824]">Cô Mai Phương</h5>
                    <p className="text-[11px] font-medium text-[#68594D]">12 bộ từ • 1.2k lượt học</p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold px-3 py-1 bg-[#FAF5ED] border border-[#2D2824] rounded-xl text-[#2D2824]">
                  Giáo viên
                </span>
              </div>

              {/* Author 2 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#FEF8EA] border-2 border-[#2D2824] flex items-center justify-center font-bold text-xs shadow-xs">
                    🥈
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-[#2D2824]">Master Vocab Lab</h5>
                    <p className="text-[11px] font-medium text-[#68594D]">8 bộ từ • 940 lượt học</p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold px-3 py-1 bg-[#FAF5ED] border border-[#2D2824] rounded-xl text-[#2D2824]">
                  C1-C2 Team
                </span>
              </div>

              {/* Author 3 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-stone-100 border-2 border-[#2D2824] flex items-center justify-center font-bold text-xs shadow-xs">
                    🥉
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-[#2D2824]">Ngọc Linh Vocab</h5>
                    <p className="text-[11px] font-medium text-[#68594D]">6 bộ từ • 720 lượt học</p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold px-3 py-1 bg-[#FAF5ED] border border-[#2D2824] rounded-xl text-[#2D2824]">
                  Học viên
                </span>
              </div>
            </div>

            {/* Community Guidelines Note */}
            <div className="bg-[#FEF8EA] border-2 border-[#2D2824] rounded-2xl p-4 shadow-[2px_2px_0px_#2D2824]">
              <div className="flex items-start gap-2.5">
                <span className="text-xl">💡</span>
                <div className="text-xs leading-relaxed text-[#68594D] font-semibold">
                  <strong className="text-[#2D2824] font-black block mb-0.5">Tiêu chuẩn cộng đồng sáp màu:</strong>
                  Mọi bộ từ vựng được tải lên đều được tự động hỗ trợ phiên âm IPA và đồng bộ giải thuật ngắt quãng thông minh (SRS) giúp cả nhà cùng nhau ghi nhớ lâu dài!
                </div>
              </div>
            </div>
          </aside>
        </section>

        {/* Floating Quick Action Pill */}
        <div className="fixed bottom-6 right-8 z-40">
          <button 
            type="button"
            onClick={() => window.openBugReportModal?.()}
            className="w-13 h-13 p-3.5 bg-white hover:bg-[#FAF5ED] border-[2.5px] border-[#2D2824] rounded-full shadow-[3px_3px_0px_#2D2824] text-[#E66946] text-xl flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title="Góp ý cho thư viện"
          >
            🚩
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          MOBILE VIEW (block lg:hidden, max-w-[430px] mx-auto)
          ───────────────────────────────────────────────────────────────── */}
      <div className="block lg:hidden w-full max-w-[430px] mx-auto min-h-screen px-4 pt-3 pb-24 relative pwa-safe-top">
        {/* Storybook Tabs */}
        <div className="my-2">
          <div className="bg-white rounded-[26px_22px_24px_28px] p-1.5 flex items-center justify-between border-[3px] border-[#2D2824] shadow-[2.5px_3px_0px_rgba(51,48,44,0.9)] gap-1">
            <button 
              type="button"
              onClick={() => lib.setCurrentTab('feed')}
              className={`flex-1 py-2 px-1 rounded-full flex items-center justify-center gap-1 transition-transform active:scale-95 text-xs font-black ${
                lib.currentTab === 'feed'
                  ? 'bg-[#2D2824] text-white border-2 border-[#2D2824] shadow-xs'
                  : 'text-[#68594D]'
              }`}
            >
              <span>🧭</span>
              <span>Khám phá</span>
            </button>
            <button 
              type="button"
              onClick={() => lib.setCurrentTab('my')}
              className={`flex-1 py-2 px-1 rounded-full flex items-center justify-center gap-1 transition-transform active:scale-95 text-xs font-black ${
                lib.currentTab === 'my'
                  ? 'bg-[#2D2824] text-white border-2 border-[#2D2824] shadow-xs'
                  : 'text-[#68594D]'
              }`}
            >
              <span>🗂️</span>
              <span>Của tôi</span>
            </button>
            <button 
              type="button"
              onClick={() => lib.setCurrentTab('liked')}
              className={`flex-1 py-2 px-1 rounded-full flex items-center justify-center gap-1 transition-transform active:scale-95 text-xs font-black ${
                lib.currentTab === 'liked'
                  ? 'bg-[#2D2824] text-white border-2 border-[#2D2824] shadow-xs'
                  : 'text-[#68594D]'
              }`}
            >
              <span>❤️</span>
              <span>Đã thích</span>
            </button>
          </div>
        </div>

        {/* Search Bar on Mobile */}
        <div className="mt-3">
          <div className="relative flex items-center bg-white rounded-[22px_26px_28px_24px] border-[3px] border-[#2D2824] shadow-[2.5px_3px_0px_rgba(51,48,44,0.9)] px-3.5 py-2.5">
            <span className="text-stone-400 text-base mr-2.5">🔍</span>
            <input 
              type="text"
              value={lib.searchQuery}
              onChange={(e) => lib.setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bộ từ vựng, tác giả..."
              className="w-full bg-transparent border-0 p-0 text-[#2D2824] placeholder:text-stone-400 focus:ring-0 text-xs font-bold"
            />
            {lib.searchQuery && (
              <button 
                type="button"
                onClick={() => lib.setSearchQuery('')}
                className="text-stone-400 hover:text-[#2D2824] p-1 font-bold text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter chips (Horizontal Scroll) */}
        {lib.currentTab !== 'my' && (
          <div className="mt-3.5 overflow-x-auto no-scrollbar flex items-center gap-2 pb-1">
            <button 
              type="button"
              onClick={() => lib.setSortBy(lib.sortBy === 'popular' ? 'clones' : lib.sortBy === 'clones' ? 'newest' : 'popular')}
              className="inline-flex items-center gap-1.5 bg-[#FFDBC9] text-[#70370F] text-xs font-black py-1.5 px-3.5 rounded-full border-2 border-[#2D2824] shadow-[1.5px_2px_0px_rgba(51,48,44,0.85)] whitespace-nowrap active:scale-95 transition-transform"
            >
              <span>🔥</span>
              <span>{lib.sortBy === 'popular' ? 'Phổ biến nhất' : lib.sortBy === 'clones' ? 'Tải nhiều nhất' : 'Mới nhất'}</span>
              <span className="text-[10px]">▼</span>
            </button>

            {lib.AVAILABLE_TAGS.map(tag => (
              <button
                key={tag.value}
                type="button"
                onClick={() => lib.setCurrentTag(tag.value)}
                className={`inline-flex items-center text-xs font-black py-1.5 px-3.5 rounded-full border-2 border-[#2D2824] shadow-[1.5px_2px_0px_rgba(51,48,44,0.85)] whitespace-nowrap active:scale-95 transition-transform ${
                  lib.currentTag === tag.value
                    ? 'bg-[#2D2824] text-white'
                    : 'bg-white text-[#2D2824]'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        )}

        {/* Vocabulary Sets List */}
        <div className="mt-4 flex flex-col gap-4">
          {lib.isLoading ? (
            <LoadingSpinner />
          ) : lib.error ? (
            <ErrorState error={lib.error} onRetry={() => lib.setCurrentTab(lib.currentTab)} />
          ) : lib.topics.length === 0 ? (
            <EmptyState tab={lib.currentTab} onOpenCreate={handleOpenCreate} />
          ) : lib.currentTab === 'my' ? (
            /* My Topics List on Mobile */
            lib.topics.map(topic => (
              <article key={topic.id} className="bg-white rounded-[26px_22px_24px_28px] p-4 border-[3px] border-[#2D2824] shadow-[2.5px_3px_0px_rgba(51,48,44,0.9)] relative">
                <div className="flex items-center gap-2 mb-2">
                  {renderTopicIcon(topic.icon, 'text-xl')}
                  <h2 className="text-base font-black text-[#2D2824] truncate flex-1">{topic.name}</h2>
                </div>
                {topic.description && (
                  <p className="text-xs text-[#68594D] font-medium line-clamp-2 mb-3">
                    {topic.description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                  <div className="text-xs font-bold text-[#68594D]">
                    {topic.totalWords || 0} từ • ❤️ {topic.like_count || 0}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => lib.handlePublicToggle(topic.id, !topic.is_public)}
                      className="px-2.5 py-1 text-xs font-black rounded-xl border border-[#2D2824] bg-stone-100"
                    >
                      {topic.is_public ? '🌐 Công khai' : '🔒 Riêng tư'}
                    </button>
                    <button
                      type="button"
                      onClick={() => window._openTopic?.(topic.id)}
                      className="px-3 py-1 bg-[#5A7E56] text-white text-xs font-black rounded-xl border border-[#2D2824]"
                    >
                      Mở ➔
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            /* Feed List on Mobile */
            lib.topics.map((topic, idx) => (
              <article 
                key={topic.id}
                className={`bg-white p-4 border-[3px] border-[#2D2824] shadow-[2.5px_3px_0px_rgba(51,48,44,0.9)] relative transition-transform hover:-translate-y-0.5 ${
                  idx % 2 === 0 ? 'rounded-[26px_22px_24px_28px]' : 'rounded-[22px_26px_28px_24px]'
                }`}
              >
                {/* Card Header: Avatar, Name, Time, Share */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full bg-[#CCE8FF] text-[#001E2C] flex items-center justify-center font-black text-sm border-2 border-[#2D2824] shadow-[1.5px_2px_0px_rgba(51,48,44,0.85)]">
                        {topic.author_avatar ? (
                          <img src={topic.author_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(topic.author_name)
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); lib.handleClone(topic.id); }}
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#F4BA42] text-[#2D2824] flex items-center justify-center border border-[#2D2824] text-[10px] font-black"
                      >
                        +
                      </button>
                    </div>
                    <div>
                      <h2 
                        onClick={() => lib.openDetail(topic.id)}
                        className="font-black text-sm text-[#2D2824] tracking-tight cursor-pointer hover:underline"
                      >
                        {topic.author_name || 'Học viên HiVocab'}
                      </h2>
                      <p className="text-[11px] font-bold text-[#68594D] flex items-center gap-1">
                        <span>{formatTimeAgo(topic.created_at)}</span>
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => lib.handleShare(topic.id, topic.name)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#68594D] hover:text-[#2D2824] transition-colors"
                  >
                    🔗
                  </button>
                </div>

                {/* Card Content Body */}
                <div 
                  onClick={() => lib.openDetail(topic.id)}
                  className="mt-3 pl-3 border-l-2 border-[#D3CDC4] cursor-pointer"
                >
                  <h3 className="font-black text-sm text-[#2D2824] flex items-center gap-1.5 leading-snug">
                    {renderTopicIcon(topic.icon, 'text-base')}
                    <span className="truncate">{topic.name}</span>
                  </h3>
                  {topic.description && (
                    <p className="text-xs text-[#68594D] font-medium mt-1 leading-relaxed line-clamp-2">
                      {topic.description}
                    </p>
                  )}

                  {/* Badges & Tags Row */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#FAF5ED] text-xs font-black text-[#2D2824] rounded-xl border border-[#2D2824]">
                      <span>📖</span>
                      <span>{topic.totalWords || 0} từ</span>
                    </span>
                    {topic.tags && topic.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-stone-100 text-[11px] font-bold text-stone-700 rounded-lg">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-2.5 mt-3 border-t border-[#F0EAE2] text-xs font-black text-[#68594D]">
                  <button 
                    type="button"
                    onClick={() => lib.handleLike(topic.id)}
                    className="flex items-center gap-1.5 hover:text-[#E66946] transition-colors"
                  >
                    <span>{topic.hasLiked ? '❤️' : '🤍'}</span>
                    <span>{topic.like_count || 0}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => lib.openComments(topic.id, topic.name)}
                    className="flex items-center gap-1.5 hover:text-[#2D2824] transition-colors"
                  >
                    <span>💬</span>
                    <span>Bình luận</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => lib.handleClone(topic.id)}
                    className="flex items-center gap-1.5 hover:text-[#5A7E56] transition-colors"
                  >
                    <span>📥</span>
                    <span>{topic.clone_count || 0} lưu</span>
                  </button>
                </div>
              </article>
            ))
          )}

          {/* Mascot Prompt Invitation Banner on Mobile */}
          <section className="bg-[#CCE8BC] rounded-[26px_22px_24px_28px] p-4 border-[3px] border-[#2D2824] shadow-[2.5px_3px_0px_rgba(51,48,44,0.9)] relative overflow-hidden flex items-center justify-between mt-1">
            <div className="relative z-10 max-w-[72%]">
              <div className="inline-block bg-[#4B6540] text-white text-[10px] font-black px-2 py-0.5 rounded-full mb-1">
                Gợi ý từ Bé Hổ 🐻
              </div>
              <h4 className="text-sm font-black text-[#092104]">Đăng tải bộ thẻ từ của bạn!</h4>
              <p className="text-[11px] font-semibold text-[#344D2A] mt-0.5">Cùng 25,000+ bạn học mở rộng kho từ vựng mỗi ngày.</p>
            </div>
            <div className="relative z-10">
              <button 
                type="button"
                onClick={handleOpenCreate}
                className="w-11 h-11 rounded-2xl bg-white text-[#2D2824] flex items-center justify-center border-2 border-[#2D2824] shadow-xs active:scale-95 transition-transform text-lg font-black"
                title="Tạo bộ từ mới"
              >
                +
              </button>
            </div>
          </section>
        </div>

        {/* Mobile Floating Feedback Action Button */}
        <div className="fixed bottom-20 right-5 z-40">
          <button 
            type="button"
            onClick={() => window.openBugReportModal?.()}
            className="w-12 h-12 bg-white text-[#E66946] rounded-full border-[2.5px] border-[#2D2824] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[2px_2px_0px_#2D2824] text-xl"
            title="Góp ý cho thư viện"
          >
            🚩
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          MODALS & DRAWERS
          ───────────────────────────────────────────────────────────────── */}
      {lib.activeTopicDetail && <ThreadDetailModal lib={lib} />}
      {lib.activeCommentsTopicId && <CommentsDrawer lib={lib} />}
      {lib.publishTopicId && <HashtagPublishModal lib={lib} />}
      {isSearchOpen && <LibrarySearchModal lib={lib} onClose={() => setIsSearchOpen(false)} />}
    </div>
  );
}

export default PageLibrary;
