import React, { useState } from 'react';
import { useLibrary } from '../../hooks/useLibrary';

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

function TabBar({ lib }) {
  const tabs = [
    { id: 'feed', label: 'Khám phá', icon: 'explore' },
    { id: 'my', label: 'Bộ từ của tôi', icon: 'folder_shared' },
    { id: 'liked', label: 'Đã thích', icon: 'favorite' },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-surface-container-low border border-outline-variant/30 rounded-2xl w-full sm:w-auto shrink-0 self-start sm:self-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => lib.setCurrentTab(tab.id)}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            lib.currentTab === tab.id
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

function SearchBar({ lib, onOpenSearch }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full">
      <div 
        className="flex-1 flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-2xl px-3.5 py-2.5 shadow-2xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all cursor-pointer sm:cursor-text"
        onClick={() => {
          if (window.innerWidth < 640 && onOpenSearch) onOpenSearch();
        }}
      >
        <span className="material-symbols-outlined text-outline mr-2.5 text-[20px]">search</span>
        <input
          type="text"
          value={lib.searchQuery}
          onChange={(e) => lib.setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm bộ từ vựng, tác giả, nội dung..."
          className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-outline outline-none"
        />
        {lib.searchQuery && (
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); lib.setSearchQuery(''); }}
            className="p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>
      <div className="flex items-center shrink-0 self-end sm:self-auto">
        <select
          value={lib.sortBy}
          onChange={(e) => lib.setSortBy(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-on-surface cursor-pointer outline-none focus:border-primary shadow-2xs hover:border-outline-variant/50 transition-colors"
        >
          <option value="popular">🔥 Phổ biến nhất</option>
          <option value="clones">📥 Tải nhiều nhất</option>
          <option value="newest">✨ Mới nhất</option>
        </select>
      </div>
    </div>
  );
}

function TagPills({ lib }) {
  return (
    <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar w-full">
      {lib.AVAILABLE_TAGS.map((tag) => (
        <button
          key={tag.value}
          type="button"
          onClick={() => lib.setCurrentTag(tag.value)}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all border ${
            lib.currentTag === tag.value
              ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-950 dark:border-white shadow-xs'
              : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:border-outline-variant/60 hover:text-on-surface'
          }`}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center p-12 gap-3">
      <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      <span className="text-xs sm:text-sm font-medium text-on-surface-variant">Đang nạp dữ liệu cộng đồng...</span>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-2xs">
      <span className="material-symbols-outlined text-[48px] text-error mb-2">cloud_off</span>
      <h3 className="text-base font-bold text-on-surface mb-1">Không thể tải dữ liệu</h3>
      <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mb-4">{error}</p>
      <button 
        type="button"
        onClick={onRetry}
        className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90 transition-all active:scale-95"
      >
        Thử lại
      </button>
    </div>
  );
}

function EmptyState({ tab }) {
  const isMy = tab === 'my';
  const isLiked = tab === 'liked';

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-2xs">
      <span className="material-symbols-outlined text-[54px] text-outline mb-2">
        {isMy ? 'folder_open' : isLiked ? 'favorite_border' : 'search_off'}
      </span>
      <h3 className="text-base font-bold text-on-surface mb-1">
        {isMy ? 'Chưa có bộ từ nào' : isLiked ? 'Chưa thích bộ từ nào' : 'Không tìm thấy bộ từ phù hợp'}
      </h3>
      <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mb-4">
        {isMy 
          ? 'Tạo các bộ từ cá nhân của bạn để học tập và chia sẻ với cộng đồng.'
          : isLiked 
          ? 'Khám phá các bộ từ nổi bật và thả tim để lưu vào bộ sưu tập cá nhân.'
          : 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc hashtag hiện tại.'}
      </p>
      {isMy && (
        <button 
          type="button"
          onClick={() => window.openCreateTopicModal?.()}
          className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tạo bộ từ mới
        </button>
      )}
    </div>
  );
}

function ThreadCard({ topic, lib }) {
  return (
    <article className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all mb-4 flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/80 to-tertiary/80 text-white font-bold text-sm relative shadow-2xs">
          {topic.author_avatar ? (
            <img src={topic.author_avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
          ) : (
            getInitials(topic.author_name)
          )}
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); lib.handleClone(topic.id); }}
            className="absolute -bottom-1 -right-1 w-5 h-5 bg-surface rounded-full flex items-center justify-center border border-outline-variant/30 text-primary hover:scale-110 active:scale-95 transition-transform shadow-xs"
            title="Lưu bộ từ vào kho của bạn"
          >
            <span className="material-symbols-outlined text-[13px] font-bold">add</span>
          </button>
        </div>
        <div className="w-[2px] bg-outline-variant/20 rounded-full flex-1 my-2.5 min-h-[30px]"></div>
      </div>
      
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1.5 gap-2">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className="font-bold text-on-surface text-[15px] truncate">{topic.author_name || 'Học viên HiVocab'}</span>
            <span className="text-outline text-xs">•</span>
            <span className="text-on-surface-variant text-xs shrink-0 whitespace-nowrap">{formatTimeAgo(topic.created_at)}</span>
          </div>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); lib.handleShare(topic.id, topic.name); }}
            className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-surface-container-high transition-colors shrink-0"
            title="Chia sẻ bộ từ"
          >
            <span className="material-symbols-outlined text-[18px]">ios_share</span>
          </button>
        </div>

        <div className="cursor-pointer group" onClick={() => lib.openDetail(topic.id)}>
          <h3 className="font-bold text-on-surface text-base sm:text-lg mb-1.5 group-hover:text-primary transition-colors flex items-center gap-2">
            <span className="text-xl shrink-0">{topic.icon || '📚'}</span>
            <span className="truncate">{topic.name}</span>
          </h3>
          {topic.description && (
            <p className="text-on-surface-variant text-sm line-clamp-3 mb-3 leading-relaxed">
              {topic.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant text-xs font-semibold">
              <span className="material-symbols-outlined text-[15px] mr-1 text-primary">menu_book</span>
              {topic.totalWords} từ vựng
            </span>
            {topic.tags && topic.tags.map(tag => (
              <span key={tag} className="inline-flex items-center text-primary text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/5 hover:bg-primary/10 transition-colors">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2 border-t border-outline-variant/10 text-on-surface-variant text-xs font-semibold">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); lib.handleLike(topic.id); }}
            className={`flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ${topic.hasLiked ? 'text-rose-600 font-bold' : 'hover:text-rose-600'}`}
          >
            <span className={`material-symbols-outlined text-[20px] transition-transform active:scale-125 ${topic.hasLiked ? 'text-rose-600 fill-1' : ''}`}>favorite</span>
            <span>{topic.like_count || 0}</span>
          </button>
          
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); lib.openComments(topic.id, topic.name); }}
            className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-surface-container hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
            <span>Bình luận</span>
          </button>
          
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); lib.handleClone(topic.id); }}
            className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 transition-colors ml-auto sm:ml-0"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span>{topic.clone_count || 0} lượt lưu</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function FeedList({ lib }) {
  return (
    <div className="flex flex-col w-full pb-8">
      {lib.topics.map(topic => (
        <ThreadCard key={topic.id} topic={topic} lib={lib} />
      ))}
    </div>
  );
}

function MyTopicsList({ lib }) {
  return (
    <div className="flex flex-col w-full gap-4 pb-8">
      {lib.topics.map(topic => (
        <div key={topic.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-2xs gap-4 hover:border-outline-variant/40 transition-all">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-on-surface text-base sm:text-lg flex items-center gap-2">
              <span className="text-xl shrink-0">{topic.icon || '📚'}</span>
              <span className="truncate">{topic.name}</span>
            </h3>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-on-surface-variant font-medium">
              <span>{topic.totalWords} từ</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">favorite</span> {topic.like_count || 0}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">download</span> {topic.clone_count || 0}
              </span>
              <span>•</span>
              <span>{formatTimeAgo(topic.created_at)}</span>
            </div>
            {topic.tags && topic.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {topic.tags.map(t => (
                  <span key={t} className="text-primary text-xs font-semibold">#{t}</span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <button 
              type="button"
              onClick={() => lib.handlePublicToggle(topic.id, !topic.is_public)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                topic.is_public 
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                  : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {topic.is_public ? 'public' : 'lock'}
              </span>
              {topic.is_public ? 'Công khai' : 'Riêng tư'}
            </button>

            <button 
              type="button"
              onClick={() => window._openTopic?.(topic.id)}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-1"
            >
              <span>Mở học</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ThreadDetailModal({ lib }) {
  const detail = lib.activeTopicDetail;
  if (!detail) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in p-2 sm:p-4">
      <div className="bg-surface w-full max-w-3xl h-full sm:h-[88vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden relative border border-outline-variant/20">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant/20 sticky top-0 bg-surface/90 backdrop-blur-md z-10">
          <h2 className="font-bold text-base sm:text-lg text-on-surface truncate pr-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">auto_stories</span>
            Chi tiết bộ từ vựng
          </h2>
          <button 
            type="button"
            onClick={lib.closeDetail}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-28 p-4 sm:p-6">
          {detail._loading ? (
            <LoadingSpinner />
          ) : lib.detailError ? (
            <ErrorState error={lib.detailError} onRetry={() => lib.openDetail(detail.id)} />
          ) : (
            <div className="flex flex-col gap-6">
              {/* Author & Header */}
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/80 to-tertiary/80 text-white font-bold text-base shrink-0 shadow-2xs">
                  {detail.author_avatar ? (
                    <img src={detail.author_avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    getInitials(detail.author_name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-on-surface text-base truncate">{detail.author_name || 'Học viên HiVocab'}</span>
                    <span className="text-outline text-xs">•</span>
                    <span className="text-on-surface-variant text-xs">{formatTimeAgo(detail.created_at)}</span>
                  </div>
                  <h3 className="font-bold text-on-surface text-xl sm:text-2xl mb-2 flex items-center gap-2">
                    <span>{detail.icon || '📚'}</span>
                    <span>{detail.name}</span>
                  </h3>
                  {detail.description && (
                    <p className="text-on-surface-variant text-sm whitespace-pre-wrap leading-relaxed mb-3">
                      {detail.description}
                    </p>
                  )}
                  {detail.tags && detail.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {detail.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center text-primary text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/5">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Words list */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/15">
                  <h4 className="font-bold text-base text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">format_list_bulleted</span>
                    Danh sách từ ({detail.words?.length || 0} từ)
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(detail.words || []).map((word, idx) => (
                    <div key={word.id || idx} className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/20 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1.5 gap-2">
                          <div>
                            <h5 className="font-bold text-base text-primary">{word.word}</h5>
                            <span className="text-on-surface-variant text-xs font-mono font-medium">
                              {word.phonetic ? `/${word.phonetic}/` : ''} {word.pos && `• ${word.pos}`}
                            </span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => lib.playWordAudio(word.word)}
                            className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors shrink-0"
                            title="Phát âm"
                          >
                            <span className="material-symbols-outlined text-[18px]">volume_up</span>
                          </button>
                        </div>
                        <p className="text-on-surface text-sm font-medium mb-2">{word.meaning}</p>
                      </div>
                      {word.example_sentence && (
                        <p className="text-on-surface-variant text-xs italic border-l-2 border-primary/30 pl-2.5 py-0.5 mt-auto">
                          {word.example_sentence}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action bar bottom */}
        {!detail._loading && !lib.detailError && (
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-surface/90 backdrop-blur-md border-t border-outline-variant/20 flex items-center justify-around z-20">
            <button 
              type="button"
              onClick={() => lib.handleLike(detail.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-bold text-xs sm:text-sm ${detail.hasLiked ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' : 'text-on-surface hover:bg-surface-container'}`}
            >
              <span className={`material-symbols-outlined text-[22px] ${detail.hasLiked ? 'fill-1' : ''}`}>favorite</span>
              <span>{detail.like_count || 0}</span>
            </button>
            <button 
              type="button"
              onClick={() => lib.openComments(detail.id, detail.name)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-on-surface hover:bg-surface-container transition-colors font-bold text-xs sm:text-sm"
            >
              <span className="material-symbols-outlined text-[22px]">chat_bubble</span>
              <span>Bình luận</span>
            </button>
            <button 
              type="button"
              onClick={() => lib.handleClone(detail.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-all font-bold text-xs sm:text-sm shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              <span>Lưu bộ từ ({detail.clone_count || 0})</span>
            </button>
            <button 
              type="button"
              onClick={() => lib.handleShare(detail.id, detail.name)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-on-surface hover:bg-surface-container transition-colors font-bold text-xs sm:text-sm"
            >
              <span className="material-symbols-outlined text-[22px]">ios_share</span>
              <span>Chia sẻ</span>
            </button>
          </div>
        )}
      </div>
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
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm fade-in p-0 sm:p-4">
      <div className="bg-surface w-full max-w-xl h-[80vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl animate-slide-up border border-outline-variant/20 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/20 sticky top-0 bg-surface/90 backdrop-blur-md z-10">
          <h3 className="font-bold text-base sm:text-lg text-on-surface truncate pr-4">Bình luận &amp; Thảo luận</h3>
          <button 
            type="button"
            onClick={lib.closeComments}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar">
          {lib.isCommentsLoading ? (
            <LoadingSpinner />
          ) : lib.comments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 p-8">
              <span className="material-symbols-outlined text-[44px] mb-2 text-outline">chat</span>
              <p className="text-sm font-medium">Chưa có bình luận nào.<br/>Hãy là người đầu tiên để lại ý kiến!</p>
            </div>
          ) : (
            lib.comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/80 to-tertiary/80 text-white font-bold text-xs shrink-0 mt-1">
                  {c.author_avatar ? (
                    <img src={c.author_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(c.author_name)
                  )}
                </div>
                <div className="flex flex-col bg-surface-container rounded-2xl p-3.5 max-w-[85%] border border-outline-variant/10">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-sm text-on-surface">{c.author_name || 'User'}</span>
                    <span className="text-[11px] text-on-surface-variant">{formatTimeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3.5 border-t border-outline-variant/20 bg-surface flex gap-2 items-end">
          <textarea
            value={lib.commentInput}
            onChange={(e) => lib.setCommentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Viết bình luận... (Ctrl+Enter để gửi)"
            className="flex-1 bg-surface-container rounded-2xl px-4 py-2.5 text-sm text-on-surface placeholder:text-outline outline-none border border-outline-variant/30 focus:border-primary resize-none max-h-[120px] min-h-[44px]"
            rows={1}
          />
          <button
            type="button"
            onClick={lib.submitComment}
            disabled={!lib.commentInput.trim()}
            className="w-11 h-11 rounded-2xl bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-all shrink-0 active:scale-95 shadow-xs"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-[440px] rounded-3xl flex flex-col shadow-2xl p-6 fade-in border border-outline-variant/20">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
          <span className="material-symbols-outlined text-[26px]">public</span>
        </div>
        <h3 className="font-bold text-xl text-center text-on-surface mb-1.5">Công khai bộ từ vựng</h3>
        <p className="text-center text-on-surface-variant text-xs sm:text-sm mb-5">Thêm mô tả và hashtag để bộ từ của bạn tiếp cận nhiều học viên hơn trên Thư Viện.</p>

        <textarea
          value={lib.publishDescription}
          onChange={(e) => lib.setPublishDescription(e.target.value)}
          placeholder="Mô tả ngắn về bộ từ vựng này..."
          className="w-full bg-surface-container rounded-2xl p-3.5 text-sm text-on-surface placeholder:text-outline outline-none border border-outline-variant/30 focus:border-primary resize-none h-24 mb-4"
        />

        <p className="text-xs sm:text-sm font-bold text-on-surface mb-2">Chọn ít nhất 1 hashtag <span className="text-error">*</span></p>
        <div className="flex flex-wrap gap-2 mb-6 max-h-[140px] overflow-y-auto no-scrollbar pb-2">
          {lib.SUGGESTED_HASHTAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                lib.selectedTags.includes(tag)
                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:border-outline-variant/60'
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
            className="flex-1 py-2.5 rounded-xl bg-surface-container text-on-surface font-bold text-xs sm:text-sm hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button 
            type="button"
            onClick={lib.confirmPublish}
            disabled={lib.isPublishing || lib.selectedTags.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
          >
            {lib.isPublishing ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> : 'Đăng tải'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LibrarySearchModal({ lib, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] bg-surface flex flex-col animate-slide-up sm:hidden">
      <div className="flex items-center gap-3 p-4 border-b border-outline-variant/20">
        <button 
          type="button"
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface transition-colors shrink-0 -ml-2"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1 relative">
          <input
            autoFocus
            type="text"
            value={lib.searchQuery}
            onChange={(e) => lib.setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bộ từ..."
            className="w-full bg-surface-container rounded-full pl-10 pr-10 py-2.5 text-sm text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
          {lib.searchQuery && (
            <button 
              type="button"
              onClick={() => lib.setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Hashtag phổ biến</p>
        <div className="flex flex-wrap gap-2">
          {lib.SUGGESTED_HASHTAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                lib.setSearchQuery(tag);
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-high"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageLibrary() {
  const lib = useLibrary();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div id="page-library" className="page active min-h-screen bg-surface">
      <main className="lg:ml-64 min-h-screen mobile-page-top lg:pt-8 pb-28 lg:pb-12 px-4 sm:px-6 lg:px-10 flex flex-col">
        <div className="max-w-4xl lg:max-w-5xl mx-auto w-full flex-1 flex flex-col gap-4 sm:gap-6 fade-in">
          
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div>
              <h1 className="text-2xl sm:text-headline-lg font-bold text-on-surface tracking-tight flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[28px]">local_library</span>
                Thư viện cộng đồng
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                Khám phá, chia sẻ và lưu trữ hàng ngàn bộ từ vựng phong phú từ cộng đồng học viên HiVocab.
              </p>
            </div>
            
            <TabBar lib={lib} />
          </div>

          {/* Search + Sort + Tag Pills */}
          {lib.currentTab !== 'my' && (
            <div className="flex flex-col gap-3">
              <SearchBar lib={lib} onOpenSearch={() => setIsSearchOpen(true)} />
              {lib.currentTab === 'feed' && <TagPills lib={lib} />}
            </div>
          )}

          {/* Main content feed */}
          <div className="flex-1 w-full mt-1">
            {lib.isLoading ? (
              <LoadingSpinner />
            ) : lib.error ? (
              <ErrorState error={lib.error} onRetry={() => lib.setCurrentTab(lib.currentTab)} />
            ) : lib.topics.length === 0 ? (
              <EmptyState tab={lib.currentTab} />
            ) : lib.currentTab === 'my' ? (
              <MyTopicsList lib={lib} />
            ) : (
              <FeedList lib={lib} />
            )}
          </div>
        </div>
      </main>
      
      {/* Thread Detail Modal */}
      {lib.activeTopicDetail && <ThreadDetailModal lib={lib} />}
      
      {/* Comments Drawer */}
      {lib.activeCommentsTopicId && <CommentsDrawer lib={lib} />}
      
      {/* Hashtag Publish Modal */}
      {lib.publishTopicId && <HashtagPublishModal lib={lib} />}
      
      {/* Search Modal on mobile */}
      {isSearchOpen && <LibrarySearchModal lib={lib} onClose={() => setIsSearchOpen(false)} />}
    </div>
  );
}

export default PageLibrary;
