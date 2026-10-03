import React, { useMemo } from 'react';
import useTopics from '../../hooks/useTopics';
import { useModal } from '../../context/ModalContext';

export default function PageTopics() {
  const {
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
    handleDeleteTopic
  } = useTopics();
  const { openModal } = useModal();

  // Helper to render Desktop folder card
  const renderDesktopFolderCard = (folder) => {
    const isStarted = folder.avgProgress > 0;
    return (
      <article key={folder.id} className="card-craft bg-white p-5 flex flex-col justify-between border-crayon relative overflow-hidden">
        {isStarted && (
          <div className="absolute -right-12 top-6 bg-[#D96B43] text-white text-[10px] font-black tracking-wider uppercase py-1 px-12 rotate-45 border-y border-[#3D352E] shadow-sm">
            Đang học
          </div>
        )}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-xl bg-[#F0EBE1] text-[#3D352E] border border-[#3D352E] text-xs font-bold flex items-center gap-1.5">
              <span>{folder.icon || '📂'}</span> {folder.categoryName || folder.id}
            </span>
            <span className="text-[11px] font-extrabold text-[#73695F] bg-[#EFE9DD] px-2 py-0.5 rounded-lg border border-[#3D352E]/30">
              {folder.topicCount} chủ đề
            </span>
          </div>
          <div className="flex items-start gap-3.5 mt-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-[#3D352E] shadow-crayon-sm flex items-center justify-center text-2xl shrink-0">
              {folder.icon || '📚'}
            </div>
            <div>
              <h3 
                className="text-lg font-black text-[#3D352E] leading-tight hover:text-[#5F7C66] transition cursor-pointer"
                onClick={() => setActiveCategory(folder.id)}
              >
                {folder.name}
              </h3>
              <p className="text-xs text-[#827A73] font-semibold mt-1 line-clamp-2">
                {folder.description || 'Thư mục từ vựng học tập'}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 pt-3 border-t border-[#E8E1D3]">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-[#73695F]">Tiến độ học</span>
            <span className={isStarted ? "text-[#D96B43] font-black" : "text-gray-500 font-extrabold"}>
              {isStarted ? `${Math.round(folder.avgProgress)}%` : 'Chưa bắt đầu'}
            </span>
          </div>
          <div className="w-full bg-[#E5DECF] h-3 rounded-full overflow-hidden border border-[#3D352E] p-0.5">
            <div className="bg-[#D96B43] h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(folder.avgProgress, 100)}%` }}></div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button 
              onClick={() => setActiveCategory(folder.id)}
              className={`flex-1 py-2.5 px-3 rounded-xl ${isStarted ? 'bg-[#D96B43] hover:bg-[#c25933]' : 'bg-[#5F7C66] hover:bg-[#4d6653]'} text-white text-xs font-extrabold border-2 border-[#3D352E] shadow-crayon-sm transition flex items-center justify-center gap-1.5`}
            >
              <span>{isStarted ? 'Tiếp tục học' : 'Bắt đầu học'}</span>
              <span className="text-sm">{isStarted ? '➔' : '✨'}</span>
            </button>
            <button 
              onClick={() => setActiveCategory(folder.id)}
              className="p-2.5 rounded-xl bg-white hover:bg-neutral-50 text-[#3D352E] border-2 border-[#3D352E] shadow-crayon-sm transition" title="Xem chi tiết"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h7" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>
          </div>
        </div>
      </article>
    );
  };

  // Helper to render Desktop topic card
  const renderDesktopTopicCard = (topic) => {
    return (
      <article key={topic.id} className="card-craft bg-white p-5 flex flex-col justify-between border-crayon">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-xl bg-[#F0EBE1] text-[#3D352E] border border-[#3D352E] text-xs font-bold flex items-center gap-1.5">
              <span>{topic.icon || '📝'}</span> Chủ đề
            </span>
            {topic.isPro && !isUserPro && (
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-[#3D352E] text-[10px] font-black border border-[#3D352E]">
                PRO
              </span>
            )}
          </div>
          <div className="flex items-start gap-3.5 mt-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-[#3D352E] shadow-crayon-sm flex items-center justify-center text-2xl shrink-0">
              {topic.icon || '📝'}
            </div>
            <div>
              <h3 
                className="text-lg font-black text-[#3D352E] leading-tight hover:text-[#5F7C66] transition cursor-pointer"
                onClick={() => openTopic(topic.id, topic.name, topic.category)}
              >
                {topic.name}
              </h3>
            </div>
          </div>
        </div>
        <div className="mt-5 pt-3 border-t border-[#E8E1D3]">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-[#73695F]">Tiến độ học</span>
            <span className="text-[#D96B43] font-black">{Math.round(topic.progress || 0)}%</span>
          </div>
          <div className="w-full bg-[#E5DECF] h-3 rounded-full overflow-hidden border border-[#3D352E] p-0.5">
            <div className="bg-[#D96B43] h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(topic.progress || 0, 100)}%` }}></div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button 
              onClick={() => openTopic(topic.id, topic.name, topic.category)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-neutral-50 text-[#3D352E] text-xs font-extrabold border-2 border-[#3D352E] shadow-crayon-sm transition flex items-center justify-center gap-1.5"
            >
              <span>Vào học</span>
              <span className="text-sm">➔</span>
            </button>
            <button 
              onClick={() => handleDeleteTopic(topic.id)}
              className="p-2.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 border-2 border-[#3D352E] shadow-crayon-sm transition" title="Xóa"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </article>
    );
  };

  // Helper to render Mobile folder card
  const renderMobileFolderCard = (folder) => {
    return (
      <div 
        key={folder.id} 
        onClick={() => setActiveCategory(folder.id)}
        className="bg-surface-container-lowest rounded-2xl p-3.5 crayon-border washi-shadow flex flex-col justify-between h-[168px] relative group hover:-translate-y-0.5 transition-transform cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface crayon-border-thin">
              <span className="text-[20px]">{folder.icon || '📂'}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-[11px] font-semibold crayon-border-thin">
              {folder.topicCount} chủ đề
            </span>
          </div>
          <h3 className="text-[18px] font-bold text-on-surface leading-tight font-['Comfortaa'] line-clamp-2">
            {folder.name}
          </h3>
        </div>
        <div>
          <div className="flex items-center justify-between text-[12px] text-on-surface-variant mb-1">
            <span>Tiến độ</span>
            <span className="font-bold text-on-surface">{Math.round(folder.avgProgress || 0)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden crayon-border-thin">
            <div className="h-full bg-primary-container rounded-full" style={{ width: `${Math.min(folder.avgProgress || 0, 100)}%` }}></div>
          </div>
        </div>
      </div>
    );
  };

  // Helper to render Mobile topic card
  const renderMobileTopicCard = (topic) => {
    return (
      <div 
        key={topic.id} 
        onClick={() => openTopic(topic.id, topic.name, topic.category)}
        className="bg-surface-container-low rounded-2xl p-3.5 crayon-border washi-shadow flex flex-col justify-between h-[168px] relative group hover:-translate-y-0.5 transition-transform cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface crayon-border-thin">
              <span className="text-[20px]">{topic.icon || '📝'}</span>
            </div>
            {topic.isPro && !isUserPro && (
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-[#3D352E] font-label-sm text-[10px] font-bold crayon-border-thin">
                PRO
              </span>
            )}
          </div>
          <h3 className="text-[18px] font-bold text-on-surface leading-snug font-['Comfortaa'] line-clamp-2">
            {topic.name}
          </h3>
        </div>
        <div>
          <div className="flex items-center justify-between text-[12px] text-on-surface-variant mb-1">
            <span>Tiến độ</span>
            <span className="font-bold text-on-surface">{Math.round(topic.progress || 0)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden crayon-border-thin flex">
            <div className="h-full bg-secondary-container rounded-full" style={{ width: `${Math.min(topic.progress || 0, 100)}%` }}></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        /* Shared Styles for Desktop */
        .card-craft {
          background-color: #FFFFFF;
          border: 2px solid #3D352E;
          border-radius: 20px;
          box-shadow: 3px 3px 0px #3D352E;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .card-craft:hover {
          transform: translateY(-2px);
          box-shadow: 4px 5px 0px #3D352E;
        }
        .pill-filter {
          transition: all 0.15s ease-in-out;
        }
        .pill-filter:hover {
          transform: translateY(-1px);
        }
        .shadow-crayon-sm {
          box-shadow: 2px 2px 0px #3D352E;
        }
        .shadow-crayon {
          box-shadow: 3px 3px 0px #3D352E;
        }
        
        /* Shared Styles for Mobile */
        .crayon-border { border: 3px solid #3d352e; }
        .crayon-border-thin { border: 1.5px solid #3d352e; }
        .washi-shadow { box-shadow: 3px 4px 0px #3d352e; }
        .washi-shadow-sm { box-shadow: 2px 2px 0px #3d352e; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden lg:flex flex-col flex-1 lg:pl-64 xl:pl-72 w-full min-h-screen bg-[#F8F5EE] text-[#3D352E]" style={{ backgroundImage: 'radial-gradient(#DDD5C7 1.5px, transparent 1.5px)', backgroundSize: '24px 24px', fontFamily: "'Quicksand', sans-serif" }}>
        <main className="flex-1 px-8 py-7 flex flex-col gap-6 overflow-x-hidden w-full max-w-[1200px] mx-auto">
          {/* Header */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#827A73] mb-1">
                <span>HiVocab Desktop</span>
                <span>•</span>
                <span className="text-[#5F7C66]">Khóa học & Thư mục</span>
              </div>
              <h2 className="text-3xl font-extrabold text-[#3D352E] flex items-center gap-2.5 tracking-tight">
                Chủ đề & Khóa học 📚
              </h2>
              <p className="text-sm text-[#73695F] font-semibold mt-1">
                Khám phá và lựa chọn thư mục từ vựng theo giáo trình, mục tiêu thi cử hoặc sở thích cá nhân.
              </p>
            </div>
            {/* Search & Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative w-72 lg:w-80">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-crayon-sm placeholder-[#9C9286] focus:outline-none focus:ring-2 focus:ring-[#5F7C66]" 
                  placeholder="Tìm kiếm khóa học, sách (CAM, IELTS, THPT)..." 
                />
                <svg className="w-4 h-4 text-[#827A73] absolute left-3 top-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <button 
                onClick={() => openModal('createTopic')}
                className="flex items-center gap-2 bg-[#D96B43] hover:bg-[#c85e37] text-white font-bold text-xs px-4 py-2.5 rounded-2xl border-2 border-[#3D352E] shadow-crayon-sm transition active:translate-x-0.5 active:translate-y-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
                </svg>
                <span>Tạo chủ đề mới</span>
              </button>
              <button className="w-10 h-10 rounded-2xl bg-white border-2 border-[#3D352E] shadow-crayon-sm flex items-center justify-center hover:bg-neutral-50 transition">
                <div className="relative">
                  <svg className="w-5 h-5 text-[#3D352E]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                  </svg>
                  <span className="w-2 h-2 bg-[#D96B43] rounded-full absolute top-0 right-0"></span>
                </div>
              </button>
            </div>
          </header>

          {/* Filter Pills */}
          <section className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <button 
                onClick={() => setActiveCategory('all')}
                className={`pill-filter px-4 py-2 rounded-2xl text-xs font-bold border-2 border-[#3D352E] shadow-crayon-sm flex items-center gap-2 ${activeCategory === 'all' ? 'bg-[#3D352E] text-white' : 'bg-white text-[#3D352E] hover:bg-[#FDF9ED]'}`}
              >
                <span>🗂️</span>
                <span>Tất cả</span>
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`pill-filter px-4 py-2 rounded-2xl text-xs font-bold border-2 border-[#3D352E] shadow-crayon-sm flex items-center gap-1.5 transition ${activeCategory === cat.id ? 'bg-[#3D352E] text-white' : 'bg-white text-[#3D352E] hover:bg-[#FDF9ED]'}`}
                >
                  <span>{cat.icon || '📚'}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Progress Strip */}
            <div className="card-craft bg-[#FFFDF8] px-5 py-3 border-crayon flex flex-wrap items-center justify-between text-xs font-semibold gap-3">
              <div className="flex items-center gap-2">
                <span className="text-base">📌</span>
                <span className="text-[#3D352E]">
                  Bạn đang xem <b className="text-[#5F7C66]">{activeCategory === 'all' ? folderList.length : filteredTopics.length} mục</b>
                </span>
              </div>
              <div className="flex items-center gap-2 font-bold text-xs text-[#5F7C66]">
                <span>Mục tiêu tuần</span>
                <div className="w-24 bg-gray-200 h-2.5 rounded-full overflow-hidden border border-[#3D352E]">
                  <div className="bg-[#5F7C66] h-full rounded-full" style={{ width: '60%' }}></div>
                </div>
                <span className="text-xs text-[#3D352E]">3/5</span>
              </div>
            </div>
          </section>

          {/* Grid */}
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="card-craft bg-white p-5 animate-pulse h-64 border-crayon"></div>
               ))}
             </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl border-2 border-red-200">
              {error}
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCategory === 'all' 
                ? folderList.map(renderDesktopFolderCard)
                : filteredTopics.map(renderDesktopTopicCard)
              }
              {activeCategory === 'all' && folderList.length === 0 && (
                <div className="col-span-full text-center py-12 text-[#827A73]">Không tìm thấy thư mục nào.</div>
              )}
              {activeCategory !== 'all' && filteredTopics.length === 0 && (
                <div className="col-span-full text-center py-12 text-[#827A73]">Không tìm thấy chủ đề nào.</div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* --- MOBILE LAYOUT --- */}
      <div className="block lg:hidden w-full min-h-screen bg-[#fff8f3] text-[#1e1b17] pb-28" style={{ backgroundImage: 'radial-gradient(#d3cbbd 0.75px, transparent 0.75px)', backgroundSize: '16px 16px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        
        {/* Header Section */}
        <div className="px-5 pt-6 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-[28px] font-bold text-[#1e1b17] flex items-center gap-1 font-['Comfortaa']">
                  Chủ đề <span className="text-xl">🎨</span>
                </h2>
                <span className="text-sm">🌿</span>
              </div>
            </div>
            <button 
              onClick={() => openModal('createTopic')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#86a378] text-[#203918] crayon-border washi-shadow-sm text-[13px] font-bold font-['Comfortaa'] active:scale-95 transition-transform"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
              </svg>
              <span>Tạo chủ đề</span>
            </button>
          </div>

          {/* Mobile Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-4 pb-1 mt-2">
            <button 
              onClick={() => setActiveCategory('all')}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[13px] font-bold font-['Comfortaa'] shrink-0 crayon-border active:scale-95 transition-transform ${activeCategory === 'all' ? 'bg-[#33302c] text-[#fff8f3] washi-shadow-sm' : 'bg-[#ffffff] text-[#1e1b17] hover:bg-[#f4ede6]'}`}
            >
              <span>apps</span>
              <span>Tất cả</span>
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[13px] font-bold font-['Comfortaa'] shrink-0 crayon-border active:scale-95 transition-transform ${activeCategory === cat.id ? 'bg-[#33302c] text-[#fff8f3] washi-shadow-sm' : 'bg-[#ffffff] text-[#1e1b17] hover:bg-[#f4ede6]'}`}
              >
                <span>{cat.icon || '📚'}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Grid */}
        <main className="px-5 flex-1">
          {loading ? (
             <div className="grid grid-cols-2 gap-3.5">
               {[...Array(4)].map((_, i) => (
                 <div key={i} className="bg-white rounded-2xl p-3.5 animate-pulse h-[168px] crayon-border washi-shadow"></div>
               ))}
             </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl border-2 border-red-200 text-sm">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {activeCategory === 'all' 
                ? folderList.map(renderMobileFolderCard)
                : filteredTopics.map(renderMobileTopicCard)
              }
            </div>
          )}
        </main>
      </div>
    </>
  );
}
