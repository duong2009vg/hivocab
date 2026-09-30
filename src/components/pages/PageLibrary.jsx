import React, { useState, useCallback } from 'react';
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
    { id: 'feed', label: 'Khám phá' },
    { id: 'my', label: 'Bộ từ của tôi' },
    { id: 'liked', label: 'Đã thích' },
  ];

  return (
    <div className="flex w-full mb-2 bg-surface p-2 gap-2 border-b border-outline-variant/20 sticky top-0 z-10">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => lib.setCurrentTab(tab.id)}
          className={`flex-1 py-2 px-4 rounded-full transition-colors text-sm font-medium ${
            lib.currentTab === tab.id
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold'
              : 'text-on-surface-variant hover:bg-surface-variant/50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function SearchBar({ lib, onOpenSearch }) {
  return (
    <div className="flex gap-2 px-4 mb-2 items-center">
      <div 
        className="flex-1 flex items-center bg-surface-variant/30 rounded-xl px-3 py-2 cursor-pointer border border-outline-variant/30 hover:border-outline-variant/60 transition-colors"
        onClick={onOpenSearch}
      >
        <span className="material-symbols-outlined text-on-surface-variant mr-2 text-[20px]">search</span>
        <span className="text-on-surface-variant text-sm flex-1 truncate">
          {lib.searchQuery ? lib.searchQuery : 'Tìm kiếm bộ từ...'}
        </span>
        {lib.searchQuery && (
          <button 
            onClick={(e) => { e.stopPropagation(); lib.setSearchQuery(''); }}
            className="material-symbols-outlined text-on-surface-variant hover:text-on-surface text-[18px]"
          >
            close
          </button>
        )}
      </div>
      <div className="flex items-center shrink-0">
        <select
          value={lib.sortBy}
          onChange={(e) => lib.setSortBy(e.target.value)}
          className="bg-surface border border-outline-variant/30 rounded-xl px-2 py-2 text-sm text-on-surface cursor-pointer outline-none focus:border-primary"
        >
          <option value="popular">Phổ biến</option>
          <option value="clones">Tải nhiều</option>
          <option value="newest">Mới nhất</option>
        </select>
      </div>
    </div>
  );
}

function TagPills({ lib }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-4 no-scrollbar">
      {lib.AVAILABLE_TAGS.map((tag) => (
        <button
          key={tag.value}
          onClick={() => lib.setCurrentTag(tag.value)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm transition-colors border ${
            lib.currentTag === tag.value
              ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-950 dark:border-white font-medium'
              : 'bg-transparent text-on-surface-variant border-outline-variant/50 hover:bg-surface-variant/30'
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
    <div className="flex justify-center items-center py-12">
      <span className="material-symbols-outlined text-primary text-[36px] animate-spin" style={{ animation: 'spin 1s linear infinite' }}>refresh</span>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <span className="material-symbols-outlined text-[48px] text-error mb-4">error</span>
      <p className="text-on-surface mb-4">{error}</p>
      <button onClick={onRetry} className="bg-primary text-on-primary px-6 py-2 rounded-full font-medium">Thử lại</button>
    </div>
  );
}

function EmptyState({ tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4 opacity-50">inbox</span>
      <p className="text-on-surface-variant">
        {tab === 'feed' ? 'Không tìm thấy bộ từ nào phù hợp.' :
         tab === 'my' ? 'Bạn chưa có bộ từ nào. Hãy tạo mới ở phần Bộ từ.' :
         'Bạn chưa thích bộ từ nào.'}
      </p>
    </div>
  );
}

function ThreadCard({ topic, lib }) {
  return (
    <article className="flex gap-3 p-4 border-b border-outline-variant/10 hover:bg-surface-variant/10 transition-colors">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/80 to-tertiary/80 text-white font-bold text-sm relative">
          {topic.author_avatar ? (
            <img src={topic.author_avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            getInitials(topic.author_name)
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); lib.handleClone(topic.id); }}
            className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-neutral-900 rounded-full flex items-center justify-center border border-outline-variant/30 text-primary hover:scale-110 transition-transform"
            title="Lưu bộ từ"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
          </button>
        </div>
        <div className="w-[2px] bg-neutral-200 dark:bg-neutral-800 rounded-full flex-1 my-2 min-h-[24px]"></div>
      </div>
      
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1 gap-2">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className="font-semibold text-on-surface text-[15px] truncate">{topic.author_name || 'Học viên HiVocab'}</span>
            <span className="text-on-surface-variant text-[13px] shrink-0 whitespace-nowrap">{formatTimeAgo(topic.created_at)}</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); lib.handleShare(topic.id, topic.name); }}
            className="text-on-surface-variant hover:text-on-surface shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">ios_share</span>
          </button>
        </div>

        <div className="cursor-pointer" onClick={() => lib.openDetail(topic.id)}>
          <h3 className="font-medium text-on-surface text-[16px] mb-1">{topic.icon} {topic.name}</h3>
          {topic.description && <p className="text-on-surface-variant text-[14px] line-clamp-3 mb-2">{topic.description}</p>}
          
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-variant/50 text-on-surface-variant text-[12px] font-medium">
              <span className="material-symbols-outlined text-[14px] mr-1">menu_book</span>
              {topic.totalWords} từ
            </span>
            {topic.tags && topic.tags.map(tag => (
              <span key={tag} className="inline-flex text-primary text-[13px] hover:underline">#{tag}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6 mt-1">
          <button 
            onClick={(e) => { e.stopPropagation(); lib.handleLike(topic.id); }}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-rose-600 group transition-colors"
          >
            <span className={`material-symbols-outlined text-[20px] transition-transform group-hover:scale-110 ${topic.hasLiked ? 'text-rose-600 fill-1' : ''}`}>favorite</span>
            <span className={`text-[13px] ${topic.hasLiked ? 'text-rose-600' : ''}`}>{topic.like_count || 0}</span>
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); lib.openComments(topic.id, topic.name); }}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary group transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">chat_bubble</span>
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); lib.handleClone(topic.id); }}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-green-600 group transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">download</span>
            <span className="text-[13px]">{topic.clone_count || 0}</span>
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
    <div className="flex flex-col w-full px-4 gap-4 pb-8">
      {lib.topics.map(topic => (
        <div key={topic.id} className="flex flex-col p-4 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm gap-3">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h3 className="font-semibold text-on-surface text-[16px]">{topic.icon} {topic.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-on-surface-variant text-[13px]">{topic.totalWords} từ</span>
                <span className="text-on-surface-variant text-[13px]">•</span>
                <span className="text-on-surface-variant text-[13px]">{formatTimeAgo(topic.created_at)}</span>
              </div>
            </div>
            <button 
              onClick={() => window._openTopic?.(topic.id)}
              className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              Mở
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-2 pt-3 border-t border-outline-variant/10">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-on-surface">Công khai Thư Viện</span>
              <span className="text-[12px] text-on-surface-variant">Chia sẻ để nhận lượt thích và tải</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={topic.is_public || false}
                onChange={(e) => lib.handlePublicToggle(topic.id, e.target.checked)}
              />
              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          {topic.is_public && (
            <div className="flex gap-4 mt-1 bg-surface-variant/20 p-2 rounded-lg">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">favorite</span>
                <span className="text-sm">{topic.like_count || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span className="text-sm">{topic.clone_count || 0}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ThreadDetailModal({ lib }) {
  const detail = lib.activeTopicDetail;
  if (!detail) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm fade-in">
      <div className="bg-surface w-full max-w-[620px] h-full sm:h-[90vh] sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden relative">
        
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/20 sticky top-0 bg-surface/90 backdrop-blur-md z-10">
          <h2 className="font-semibold text-lg text-on-surface truncate pr-4">Thread</h2>
          <button 
            onClick={lib.closeDetail}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-variant/50 hover:bg-surface-variant text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          {detail._loading ? (
            <LoadingSpinner />
          ) : lib.detailError ? (
            <ErrorState error={lib.detailError} onRetry={() => lib.openDetail(detail.id)} />
          ) : (
            <div className="p-4 flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/80 to-tertiary/80 text-white font-bold text-sm">
                  {detail.author_avatar ? (
                    <img src={detail.author_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(detail.author_name)
                  )}
                </div>
                <div className="w-[2px] bg-neutral-200 dark:bg-neutral-800 rounded-full flex-1 mt-2 min-h-[100px]"></div>
              </div>
              
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-on-surface text-[15px] truncate">{detail.author_name || 'Học viên HiVocab'}</span>
                  <span className="text-on-surface-variant text-[13px] shrink-0 whitespace-nowrap">{formatTimeAgo(detail.created_at)}</span>
                </div>

                <h3 className="font-bold text-on-surface text-xl mb-2">{detail.icon} {detail.name}</h3>
                {detail.description && <p className="text-on-surface whitespace-pre-wrap mb-4">{detail.description}</p>}
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {detail.tags && detail.tags.map(tag => (
                    <span key={tag} className="inline-flex text-primary text-[14px] hover:underline">#{tag}</span>
                  ))}
                </div>

                {/* Words list */}
                <div className="flex flex-col gap-4">
                  {(detail.words || []).map((word, idx) => (
                    <div key={word.id || idx} className="bg-surface-variant/20 rounded-2xl p-4 border border-outline-variant/10">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-lg text-primary">{word.word}</h4>
                          <span className="text-on-surface-variant text-sm font-medium">{word.phonetic} {word.pos && `• ${word.pos}`}</span>
                        </div>
                        <button 
                          onClick={() => lib.playWordAudio(word.word)}
                          className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors shrink-0"
                        >
                          <span className="material-symbols-outlined text-[18px]">volume_up</span>
                        </button>
                      </div>
                      <p className="text-on-surface font-medium mb-1.5">{word.meaning}</p>
                      {word.example_sentence && (
                        <p className="text-on-surface-variant text-sm italic border-l-2 border-primary/30 pl-2 py-0.5">{word.example_sentence}</p>
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
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-surface/90 backdrop-blur-md border-t border-outline-variant/20 flex items-center justify-around">
            <button 
              onClick={() => lib.handleLike(detail.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[64px] ${detail.hasLiked ? 'text-rose-600' : 'text-on-surface hover:bg-surface-variant/50'}`}
            >
              <span className={`material-symbols-outlined text-[24px] ${detail.hasLiked ? 'fill-1' : ''}`}>favorite</span>
              <span className="text-[12px] font-medium">{detail.like_count || 0}</span>
            </button>
            <button 
              onClick={() => lib.openComments(detail.id, detail.name)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-on-surface hover:bg-surface-variant/50 transition-colors min-w-[64px]"
            >
              <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
              <span className="text-[12px] font-medium">Bình luận</span>
            </button>
            <button 
              onClick={() => lib.handleClone(detail.id)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-on-surface hover:bg-surface-variant/50 transition-colors min-w-[64px]"
            >
              <span className="material-symbols-outlined text-[24px]">download</span>
              <span className="text-[12px] font-medium">{detail.clone_count || 0}</span>
            </button>
            <button 
              onClick={() => lib.handleShare(detail.id, detail.name)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-on-surface hover:bg-surface-variant/50 transition-colors min-w-[64px]"
            >
              <span className="material-symbols-outlined text-[24px]">ios_share</span>
              <span className="text-[12px] font-medium">Chia sẻ</span>
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
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm fade-in">
      <div className="bg-surface w-full max-w-[500px] h-[80vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/20 sticky top-0 bg-surface/90 backdrop-blur-md z-10">
          <h3 className="font-semibold text-lg text-on-surface truncate pr-4">Bình luận</h3>
          <button 
            onClick={lib.closeComments}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-variant/50 hover:bg-surface-variant text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar">
          {lib.isCommentsLoading ? (
            <LoadingSpinner />
          ) : lib.comments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
              <span className="material-symbols-outlined text-[40px] mb-2">chat</span>
              <p>Chưa có bình luận nào.<br/>Hãy là người đầu tiên!</p>
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
                <div className="flex flex-col bg-surface-variant/30 rounded-2xl p-3 max-w-[85%]">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-medium text-sm text-on-surface">{c.author_name || 'User'}</span>
                    <span className="text-[11px] text-on-surface-variant">{formatTimeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-on-surface whitespace-pre-wrap">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-outline-variant/20 bg-surface flex gap-2 items-end">
          <textarea
            value={lib.commentInput}
            onChange={(e) => lib.setCommentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Viết bình luận... (Ctrl+Enter để gửi)"
            className="flex-1 bg-surface-variant/30 rounded-2xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant outline-none border border-outline-variant/30 focus:border-primary resize-none max-h-[120px] min-h-[44px]"
            rows={1}
            style={{ height: 'auto' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = (e.target.scrollHeight) + 'px';
            }}
          />
          <button 
            onClick={lib.submitComment}
            disabled={!lib.commentInput.trim()}
            className="w-11 h-11 shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px] ml-1">send</span>
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
      <div className="bg-surface w-full max-w-[400px] rounded-3xl flex flex-col shadow-2xl p-6 fade-in">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-4">
          <span className="material-symbols-outlined text-[24px]">public</span>
        </div>
        <h3 className="font-bold text-xl text-center text-on-surface mb-2">Công khai bộ từ</h3>
        <p className="text-center text-on-surface-variant text-sm mb-6">Thêm mô tả và hashtag để bộ từ của bạn dễ tìm kiếm hơn trên Thư Viện.</p>

        <textarea
          value={lib.publishDescription}
          onChange={(e) => lib.setPublishDescription(e.target.value)}
          placeholder="Mô tả bộ từ (không bắt buộc)..."
          className="w-full bg-surface-variant/30 rounded-xl p-3 text-sm text-on-surface placeholder:text-on-surface-variant outline-none border border-outline-variant/50 focus:border-primary resize-none h-24 mb-4"
        />

        <p className="text-sm font-medium text-on-surface mb-2">Chọn ít nhất 1 hashtag <span className="text-error">*</span></p>
        <div className="flex flex-wrap gap-2 mb-8 max-h-[150px] overflow-y-auto no-scrollbar pb-2">
          {lib.SUGGESTED_HASHTAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                lib.selectedTags.includes(tag)
                  ? 'bg-primary text-on-primary border-primary font-medium'
                  : 'bg-surface-variant/30 text-on-surface-variant border-outline-variant/30 hover:border-outline-variant'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button 
            onClick={lib.cancelPublish}
            disabled={lib.isPublishing}
            className="flex-1 py-2.5 rounded-full bg-surface-variant/50 text-on-surface font-medium hover:bg-surface-variant transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button 
            onClick={lib.confirmPublish}
            disabled={lib.isPublishing || lib.selectedTags.length === 0}
            className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50 text-on-surface transition-colors shrink-0 -ml-2"
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
            className="w-full bg-surface-variant/30 rounded-full pl-10 pr-10 py-2.5 text-sm text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          {lib.searchQuery && (
            <button 
              onClick={() => lib.setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-surface-variant/50 hover:bg-surface-variant text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-sm font-medium text-on-surface mb-3">Hashtag phổ biến</p>
        <div className="flex flex-wrap gap-2">
          {lib.SUGGESTED_HASHTAGS.map(tag => (
            <button
              key={tag}
              onClick={() => {
                lib.setSearchQuery(tag);
                onClose();
              }}
              className="px-3 py-1.5 rounded-full text-sm bg-surface-variant/30 text-on-surface-variant border border-outline-variant/30 hover:bg-surface-variant/50"
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
    <div id="page-library" className="page active bg-surface min-h-screen">
      <main className="lg:ml-64 lg:pt-6 pb-28 lg:pb-12 px-0 sm:px-4 flex flex-col items-center min-h-screen">
        <div className="max-w-[620px] w-full flex flex-col gap-0 sm:gap-4 fade-in min-h-screen sm:min-h-0 bg-surface sm:border sm:border-outline-variant/20 sm:rounded-3xl sm:shadow-sm overflow-hidden pb-16 sm:pb-0 relative">
          
          <TabBar lib={lib} />
          
          {lib.currentTab !== 'my' && <SearchBar lib={lib} onOpenSearch={() => setIsSearchOpen(true)} />}
          
          {lib.currentTab === 'feed' && <TagPills lib={lib} />}
          
          <div className="flex-1 relative">
            {lib.isLoading ? <LoadingSpinner /> : 
              lib.error ? <ErrorState error={lib.error} onRetry={() => lib.setCurrentTab(lib.currentTab)} /> :
              lib.topics.length === 0 ? <EmptyState tab={lib.currentTab} /> :
              lib.currentTab === 'my' ? <MyTopicsList lib={lib} /> :
              <FeedList lib={lib} />
            }
          </div>
        </div>
      </main>
      
      {lib.activeTopicDetail && <ThreadDetailModal lib={lib} />}
      {lib.activeCommentsTopicId && <CommentsDrawer lib={lib} />}
      {lib.publishTopicId && <HashtagPublishModal lib={lib} />}
      {isSearchOpen && <LibrarySearchModal lib={lib} onClose={() => setIsSearchOpen(false)} />}
    </div>
  );
}

export default PageLibrary;
