import React from 'react';
import useLessonDetail from '../../hooks/useLessonDetail';
import { useModal } from '../../context/ModalContext';

export default function PageLessonDetail() {
  const {
    topicId, topicName, passageId, lessonName, words, filteredWords,
    loading, error, progressPercent,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    handleDeleteWord, handlePlayWord,
    startPractice, startReading, goBack
  } = useLessonDetail();
  
  const { openModal } = useModal();

  if (loading) return <div className="p-8 text-center text-crayonCharcoal">Đang tải dữ liệu bài học...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Lỗi: {error}</div>;

  const totalCount = words?.length || 0;
  const newCount = words?.filter(w => w.status === 'new' || !w.status).length || 0;
  const learningCount = words?.filter(w => w.status === 'learning').length || 0;
  const masteredCount = words?.filter(w => w.status === 'mastered').length || 0;

  const renderHighlightedExample = (sentence, targetWord) => {
    if (!sentence || !targetWord) return sentence;
    const parts = sentence.split(new RegExp(`(${targetWord})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === targetWord.toLowerCase() 
        ? <span key={i} className="font-bold text-crayonOrange underline decoration-wavy">{part}</span> 
        : part
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;600;700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 20px;
          line-height: 1;
          display: inline-block;
          vertical-align: middle;
        }

        /* Desktop Crayon Textures */
        .bg-paper {
          background-color: #faf7f2;
          background-image: radial-gradient(#e2d9cd 1px, transparent 1px), radial-gradient(#eedecb 0.7px, transparent 0.7px);
          background-size: 24px 24px, 12px 12px;
          background-position: 0 0, 6px 6px;
        }
        .crayon-btn-press:active {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px #322e2b;
        }

        /* Mobile Textures */
        .paper-texture {
          background-color: #fff8f3;
          background-image: radial-gradient(#ece3da 0.8px, transparent 0.8px);
          background-size: 14px 14px;
        }
        .crayon-card {
          border: 3px solid #3d352e;
          box-shadow: 3px 4px 0px rgba(61, 53, 46, 0.15);
          border-radius: 24px;
        }
        .crayon-chip {
          border: 2px solid #3d352e;
          box-shadow: 1.5px 2px 0px rgba(61, 53, 46, 0.12);
        }
        .sketch-quote {
          border-left: 3px solid #feab79;
          background-color: #faf2ec;
          border-radius: 0 16px 16px 0;
        }
      `}} />

      {/* ========================================= */}
      {/* DESKTOP VIEW */}
      {/* ========================================= */}
      <div className="hidden lg:flex flex-1 flex-col min-w-0 overflow-y-auto bg-paper px-8 py-7 lg:pl-64 xl:pl-72 min-h-screen text-crayonCharcoal">
        {/* Breadcrumbs & Top Quick Actions */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-dashed border-[#b8ae9f]">
          <div className="flex items-center gap-2 text-sm font-semibold text-crayonSubtle">
            <button onClick={goBack} className="hover:text-crayonCharcoal flex items-center gap-1.5">
              <span className="">←</span> Quay lại
            </button>
            <span className="">/</span>
            <span className="hover:text-crayonCharcoal">Chủ đề & Khóa học</span>
            <span className="">/</span>
            <span className="hover:text-crayonCharcoal">{topicName || 'Topic'}</span>
            <span className="">/</span>
            <span className="text-crayonCharcoal font-bold bg-white px-2 py-0.5 rounded-full border border-crayonCharcoal text-xs">
              {lessonName || 'Lesson'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-3.5 py-1.5 text-xs font-bold bg-white rounded-full border-2 border-crayonCharcoal shadow-crayonSm hover:bg-gray-50 flex items-center gap-1.5">
              <span className="">🔖</span> Quản lý bài học
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-crayonSageLight rounded-full border border-crayonSage text-xs font-bold text-crayonSage">
              <span className="">🌱</span> Churbito Level 1
            </div>
          </div>
        </div>

        {/* Hero Header: Lesson Overview Banner */}
        <section className="bg-white rounded-crayonLg border-2 border-crayonCharcoal shadow-crayon p-6 mb-7 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="px-3 py-0.5 text-xs font-bold bg-crayonBgMuted text-crayonCharcoal border border-crayonCharcoal rounded-full">
                  Lesson
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-crayonYellowLight text-crayonCharcoal border border-crayonCharcoal rounded-full">
                  {topicName || 'Topic'}
                </span>
                <span className="text-xs text-crayonSubtle font-medium">Ước tính học: ~25 phút</span>
              </div>
              <h1 className="text-3xl font-title font-bold text-crayonCharcoal tracking-tight mb-2">
                {lessonName}
              </h1>
              <p className="text-sm text-crayonSubtle font-medium leading-relaxed">
                Tổng hợp {totalCount} từ vựng, cụm collocations và ngữ cảnh mẫu trích xuất từ bài học.
              </p>
            </div>
            <div className="flex flex-row md:flex-col lg:flex-row items-center gap-3 shrink-0">
              <button onClick={() => openModal('addWord', { topicId, passageId })} className="px-4 py-2.5 bg-crayonCharcoal hover:bg-black text-white font-title font-bold text-sm rounded-crayonMd border-2 border-crayonCharcoal shadow-crayonSm crayon-btn-press flex items-center gap-2">
                <span className="">+</span> Thêm từ vào bài
              </button>
              <button onClick={() => startPractice(0)} className="px-5 py-2.5 bg-crayonSage hover:bg-[#688a5d] text-white font-title font-bold text-sm rounded-crayonMd border-2 border-crayonCharcoal shadow-crayon crayon-btn-press flex items-center gap-2">
                <span className="">🚀</span> Bắt đầu học ngay
              </button>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-dashed border-[#dcd4c7]">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-crayonCharcoal flex items-center gap-1.5">
                <span className="">📊</span> Tiến độ ghi nhớ bài học
              </span>
              <span className="text-crayonCharcoal font-title">{progressPercent}% <span className="font-normal text-crayonSubtle">({masteredCount} / {totalCount} từ)</span></span>
            </div>
            <div className="w-full h-4 bg-crayonBgMuted rounded-full border-2 border-crayonCharcoal p-0.5 overflow-hidden">
              <div className="h-full bg-crayonSage rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} title={`${progressPercent}% Đã làm quen`}></div>
            </div>
          </div>
        </section>

        {/* Learning Modes Section */}
        <section className="mb-7">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-base font-title font-bold uppercase tracking-wider text-crayonCharcoal flex items-center gap-2">
              <span className="">✏️</span> Chế Độ Học Tập
            </h2>
            <span className="text-xs font-bold text-crayonSubtle bg-crayonBgMuted px-2.5 py-1 rounded-full border border-crayonCharcoal/30">
              4 dạng bài tập rèn luyện
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => startPractice(0)} className="group p-4 bg-white hover:bg-crayonOrangeLight rounded-crayonMd border-2 border-crayonCharcoal shadow-crayon crayon-btn-press text-left transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-crayonSm bg-crayonOrangeLight border-2 border-crayonCharcoal flex items-center justify-center text-crayonOrange text-lg group-hover:scale-105 transition-transform">⚡</div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-crayonOrange text-white rounded-full">Phổ biến</span>
              </div>
              <h3 className="font-title font-bold text-sm text-crayonCharcoal mb-1">Flashcard</h3>
              <p className="text-xs text-crayonSubtle font-medium leading-snug">Lật thẻ ghi nhớ hai mặt & phản xạ từ vựng tức thì.</p>
            </button>
            <button onClick={() => startPractice(1)} className="group p-4 bg-white hover:bg-crayonYellowLight rounded-crayonMd border-2 border-crayonCharcoal shadow-crayon crayon-btn-press text-left transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-crayonSm bg-crayonYellowLight border-2 border-crayonCharcoal flex items-center justify-center text-[#d49817] text-lg group-hover:scale-105 transition-transform">❔</div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-crayonYellow text-crayonCharcoal rounded-full border border-crayonCharcoal">SRS v2</span>
              </div>
              <h3 className="font-title font-bold text-sm text-crayonCharcoal mb-1">Trắc Nghiệm</h3>
              <p className="text-xs text-crayonSubtle font-medium leading-snug">Chọn nghĩa tiếng Việt & ngữ cảnh câu chính xác.</p>
            </button>
            <button onClick={() => startPractice(2)} className="group p-4 bg-white hover:bg-crayonSageLight rounded-crayonMd border-2 border-crayonCharcoal shadow-crayon crayon-btn-press text-left transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-crayonSm bg-crayonSageLight border-2 border-crayonCharcoal flex items-center justify-center text-crayonSage text-lg group-hover:scale-105 transition-transform">✏️</div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-crayonSage text-white rounded-full">Ghi nhớ</span>
              </div>
              <h3 className="font-title font-bold text-sm text-crayonCharcoal mb-1">Điền Từ Khuyết</h3>
              <p className="text-xs text-crayonSubtle font-medium leading-snug">Nhập chữ cái đúng chuẩn ngữ pháp & phát âm.</p>
            </button>
            <button onClick={() => startPractice(3)} className="group p-4 bg-white hover:bg-[#ede9fe] rounded-crayonMd border-2 border-crayonCharcoal shadow-crayon crayon-btn-press text-left transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-crayonSm bg-[#f3e8ff] border-2 border-crayonCharcoal flex items-center justify-center text-crayonPurple text-lg group-hover:scale-105 transition-transform">🎧</div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-crayonPurple text-white rounded-full">Nghe hiểu</span>
              </div>
              <h3 className="font-title font-bold text-sm text-crayonCharcoal mb-1">Nghe Chính Tả</h3>
              <p className="text-xs text-crayonSubtle font-medium leading-snug">Luyện tai nghe phát âm chuẩn giọng Anh - Mỹ.</p>
            </button>
          </div>
        </section>

        {/* Filter, Search and Tab Section */}
        <section className="bg-white p-4 rounded-crayonMd border-2 border-crayonCharcoal shadow-crayonSm mb-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="relative w-full lg:w-96">
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-paper rounded-crayonSm border-2 border-crayonCharcoal text-sm font-medium focus:ring-0 focus:border-crayonSage focus:bg-white placeholder-crayonSubtle" 
                placeholder="Tìm từ, phát âm, nghĩa tiếng Việt..." 
                type="text" 
              />
              <span className="absolute left-3.5 top-2.5 text-crayonSubtle text-sm">🔍</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <button onClick={() => setStatusFilter('all')} className={`px-4 py-1.5 rounded-full text-xs font-bold ${statusFilter === 'all' ? 'bg-crayonCharcoal text-white shadow-crayonSm' : 'bg-white text-crayonCharcoal hover:bg-paper transition-colors'} border-2 border-crayonCharcoal`}>
                Tất cả ({totalCount})
              </button>
              <button onClick={() => setStatusFilter('new')} className={`px-4 py-1.5 rounded-full text-xs font-bold ${statusFilter === 'new' ? 'bg-crayonCharcoal text-white shadow-crayonSm' : 'bg-white text-crayonCharcoal hover:bg-paper transition-colors'} border-2 border-crayonCharcoal`}>
                Từ mới ({newCount})
              </button>
              <button onClick={() => setStatusFilter('learning')} className={`px-4 py-1.5 rounded-full text-xs font-bold ${statusFilter === 'learning' ? 'bg-crayonCharcoal text-white shadow-crayonSm' : 'bg-white text-crayonCharcoal hover:bg-paper transition-colors'} border-2 border-crayonCharcoal`}>
                Đang ôn ({learningCount})
              </button>
              <button onClick={() => setStatusFilter('mastered')} className={`px-4 py-1.5 rounded-full text-xs font-bold ${statusFilter === 'mastered' ? 'bg-crayonCharcoal text-white shadow-crayonSm' : 'bg-white text-crayonCharcoal hover:bg-paper transition-colors'} border-2 border-crayonCharcoal`}>
                Đã thuộc ({masteredCount})
              </button>
            </div>
          </div>
        </section>

        {/* Two-Column Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left Column: Vocabulary Cards List (Span 8) */}
          <div className="lg:col-span-8 space-y-4">
            {filteredWords && filteredWords.map((word, index) => (
              <article key={word.id || index} className="bg-white rounded-crayonLg border-2 border-crayonCharcoal shadow-crayon p-5 transition-transform hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-crayonCharcoal flex items-center justify-center font-bold text-sm bg-crayonBgMuted">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-title font-bold text-crayonCharcoal">{word.word}</h3>
                        {word.phonetic && <span className="text-sm font-semibold text-crayonSubtle tracking-wide">{word.phonetic}</span>}
                        <span className={`text-[11px] font-bold px-2 py-0.5 border rounded-md ${word.status === 'mastered' ? 'bg-crayonSageLight text-crayonSage border-crayonSage' : word.status === 'learning' ? 'bg-crayonYellowLight text-[#d49817] border-[#d49817]' : 'bg-crayonOrangeLight text-crayonOrange border-crayonOrange'}`}>
                          {word.status === 'mastered' ? 'Đã thuộc' : word.status === 'learning' ? 'Đang ôn' : 'Mới'}
                        </span>
                      </div>
                      <div className="text-xs text-crayonSubtle font-semibold mt-0.5 flex items-center gap-1">
                        <span className="">✕</span> {word.pos || 'Từ vựng'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handlePlayWord(word.word)} className="w-8 h-8 rounded-crayonSm border-2 border-crayonCharcoal flex items-center justify-center hover:bg-crayonBgMuted transition-colors" title="Phát âm">
                      🔊
                    </button>
                    <button onClick={() => handleDeleteWord(word.id, word.word)} className="w-8 h-8 rounded-crayonSm border-2 border-crayonCharcoal flex items-center justify-center hover:bg-crayonBgMuted transition-colors text-red-500" title="Xóa/Báo cáo">
                      🚩
                    </button>
                  </div>
                </div>
                <div className="mb-3 pl-11">
                  <p className="text-base font-bold text-crayonCharcoal">{word.meaning}</p>
                  {word.definition && <p className="text-xs text-crayonSubtle font-medium">{word.definition}</p>}
                </div>
                {word.exampleSentence && (
                  <div className="ml-11 p-3.5 bg-crayonOrangeLight/50 rounded-crayonMd border-l-4 border-crayonOrange border-t border-r border-b border-crayonOrange/30">
                    <p className="text-sm italic font-medium text-crayonCharcoal mb-1">
                      {renderHighlightedExample(word.exampleSentence, word.word)}
                    </p>
                    {word.exampleTranslation && (
                      <p className="text-xs text-crayonSubtle">({word.exampleTranslation})</p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* Right Column: Mascot Guide & Lesson Notes (Span 4) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white rounded-crayonLg border-2 border-crayonCharcoal shadow-crayon p-5 text-center relative overflow-hidden">
              <div className="inline-block px-3 py-0.5 bg-crayonSageLight text-crayonSage font-bold text-xs rounded-full border border-crayonSage mb-3">
                🌱 BẠN ĐỒNG HÀNH ÔN TẬP
              </div>
              <div className="w-48 h-48 mx-auto my-1 flex items-center justify-center">
                <img alt="Bé Hổ Mascot" className="w-full h-full object-contain filter drop-shadow-sm hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida/AEtjO1WhLdB59cxwqOugmyuan_YP_-qByGV59-nTiw2fcRTppnlmKwFY8CyUY3A0FKztN21eVPSSgsRaLdVu6ad_QcR6Ev8llHmy6VYJY0Px6ys8ENmMB5wpcrhDcFXKQuRX5c79HZecsOmdanQxxLirnu3eZ2vuPAdsCSdyPCNgllA2TSndkn-YTmLyXgBT029ah-2pOgpwJe68c6qed5T5h4YeWIR1EOhKTzuxU_BZb13bVMKFicCPACxDy27z" />
              </div>
              <div className="mt-2 p-3 bg-paper rounded-crayonMd border-2 border-dashed border-crayonCharcoal text-left">
                <div className="flex items-center gap-1.5 font-bold text-xs text-crayonOrange mb-1">
                  <span className="">💬</span> Lời nhắn từ Bé Hổ Churbito:
                </div>
                <p className="text-xs font-semibold text-crayonCharcoal leading-relaxed">
                  "Bài học này có nhiều từ vựng về di sản kiến trúc rất hay gặp trong bài thi IELTS Reading. Cố gắng ghi nhớ các collocations ngữ cảnh nhé bạn ơi!"
                </p>
              </div>
              <button onClick={() => startPractice(0)} className="mt-4 w-full py-2.5 bg-crayonSage hover:bg-[#688a5d] text-white font-title font-bold text-sm rounded-crayonMd border-2 border-crayonCharcoal shadow-crayonSm crayon-btn-press transition-all flex items-center justify-center gap-2">
                <span className="">⚡</span> Bắt đầu ôn tập {Math.min(10, totalCount)} từ đầu tiên
              </button>
            </div>
            <div className="bg-white rounded-crayonLg border-2 border-crayonCharcoal shadow-crayonSm p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-crayonCharcoal mb-1">
                <span className="">📚</span> Nguồn Bài Đọc Gốc
              </div>
              <p className="text-xs text-crayonSubtle font-medium leading-normal">
                Trích đoạn: <strong className="text-crayonCharcoal">{lessonName}</strong>
              </p>
              {passageId && (
                <div className="mt-3 flex items-center justify-between text-[11px] font-bold">
                  <button onClick={startReading} className="text-crayonSage hover:underline flex items-center gap-1">
                    Xem toàn bộ bài đọc gốc ↗
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* ========================================= */}
      {/* MOBILE VIEW */}
      {/* ========================================= */}
      <div className="block lg:hidden w-full max-w-md mx-auto min-h-screen relative flex flex-col px-5 pt-4 pb-28 paper-texture text-[#1e1b17]" style={{ minHeight: 'max(884px, 100dvh)' }}>
        {/* Top Navigation Header */}
        <header className="flex items-center justify-between py-2 mb-2">
          <div className="flex items-center gap-2">
            <button onClick={goBack} aria-label="Quay lại" className="w-10 h-10 rounded-full bg-[#f4ede6] flex items-center justify-center text-[#1e1b17] hover:bg-[#eee7e1] transition-transform active:scale-95 border-2 border-[#3d352e]">
              <span className="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
            </button>
            <h1 className="font-['Comfortaa'] text-[22px] font-bold text-[#1e1b17] tracking-tight">{lessonName}</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-[#ccecbc] px-3 py-1 rounded-full border-2 border-[#3d352e]">
            <span className="text-xs">🌱</span>
            <span className="font-['Comfortaa'] text-[11px] text-[#092104] font-bold">Churbito</span>
          </div>
        </header>

        {/* Header Card: Lesson Overview */}
        <section className="crayon-card bg-[#ffffff] p-5 mb-6 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-[#feab79]/20 rounded-full pointer-events-none"></div>
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="inline-block bg-[#f4ede6] px-3 py-0.5 rounded-full font-['Comfortaa'] text-[11px] text-[#43483f] font-bold border border-[#c4c8bc] mb-1.5">
                Lesson
              </span>
              <h2 className="font-['Comfortaa'] text-[28px] font-bold text-[#1e1b17] leading-none">{lessonName}</h2>
              <p className="font-['Plus_Jakarta_Sans'] text-[14px] text-[#43483f] mt-1 font-medium">{totalCount} từ vựng</p>
            </div>
            <button onClick={() => openModal('addWord', { topicId, passageId })} className="flex items-center gap-1 bg-[#33302c] text-[#f7efe9] font-['Comfortaa'] text-[13px] font-bold px-4 py-2 rounded-full hover:opacity-90 transition-transform active:scale-95 shadow-sm">
              <span className="material-symbols-outlined text-sm font-bold" data-icon="add">add</span>
              <span>Thêm từ</span>
            </button>
          </div>
          <div className="mt-4 pt-3 border-t-2 border-dashed border-[#e8e1db]">
            <div className="flex justify-between items-center mb-1.5 font-['Comfortaa'] text-[13px]">
              <span className="text-[#43483f] font-bold">Tiến độ ghi nhớ</span>
              <span className="font-bold text-[#1e1b17]">{progressPercent}%</span>
            </div>
            <div className="w-full h-3.5 bg-[#f4ede6] rounded-full p-0.5 border border-[#3d352e]/30 overflow-hidden relative">
              <div className="h-full bg-[#86a378] rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </section>

        {/* Study Modes */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <h3 className="font-['Comfortaa'] text-[15px] font-bold text-[#1e1b17] tracking-wide uppercase">Chế độ học</h3>
            <span className="text-xs text-[#4b6540] font-bold">3 bài tập</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <button onClick={() => startPractice(0)} className="crayon-card bg-[#ffffff] py-3 px-2 flex flex-col items-center justify-center gap-1.5 hover:bg-[#fff8f3] transition-all active:scale-95 text-center">
              <div className="w-9 h-9 rounded-full bg-[#feab79]/40 flex items-center justify-center text-[#8d4e24] border border-[#3d352e]/20">
                <span className="material-symbols-outlined" data-icon="bolt">bolt</span>
              </div>
              <span className="font-['Comfortaa'] text-[13px] font-bold text-[#1e1b17]">Flashcard</span>
            </button>
            <button onClick={() => startPractice(1)} className="crayon-card bg-[#ffffff] py-3 px-2 flex flex-col items-center justify-center gap-1.5 hover:bg-[#fff8f3] transition-all active:scale-95 text-center">
              <div className="w-9 h-9 rounded-full bg-[#c3e8ff] flex items-center justify-center text-[#3b6379] border border-[#3d352e]/20">
                <span className="material-symbols-outlined" data-icon="help_center">help_center</span>
              </div>
              <span className="font-['Comfortaa'] text-[13px] font-bold text-[#1e1b17]">Trắc Nghiệm</span>
            </button>
            <button onClick={() => startPractice(2)} className="crayon-card bg-[#ffffff] py-3 px-2 flex flex-col items-center justify-center gap-1.5 hover:bg-[#fff8f3] transition-all active:scale-95 text-center">
              <div className="w-9 h-9 rounded-full bg-[#ccecbc] flex items-center justify-center text-[#4b6540] border border-[#3d352e]/20">
                <span className="material-symbols-outlined" data-icon="edit_note">edit_note</span>
              </div>
              <span className="font-['Comfortaa'] text-[13px] font-bold text-[#1e1b17]">Điền từ</span>
            </button>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="space-y-3 mb-6">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-[#74796f] pointer-events-none" data-icon="search">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#ffffff] crayon-chip rounded-full font-['Plus_Jakarta_Sans'] text-[14px] text-[#1e1b17] placeholder:text-[#c4c8bc] focus:outline-none focus:ring-2 focus:ring-[#4b6540]/40" 
              placeholder="Tìm từ, phát âm, nghĩa tiếng Việt..." 
              type="text"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button onClick={() => setStatusFilter('all')} className={`px-4 py-1.5 rounded-full font-['Comfortaa'] text-[13px] crayon-chip whitespace-nowrap active:scale-95 transition-transform ${statusFilter === 'all' ? 'bg-[#33302c] text-[#f7efe9] font-bold' : 'bg-[#ffffff] text-[#43483f] font-medium hover:bg-[#f4ede6]'}`}>
              Tất cả
            </button>
            <button onClick={() => setStatusFilter('new')} className={`px-4 py-1.5 rounded-full font-['Comfortaa'] text-[13px] crayon-chip whitespace-nowrap active:scale-95 transition-transform ${statusFilter === 'new' ? 'bg-[#33302c] text-[#f7efe9] font-bold' : 'bg-[#ffffff] text-[#43483f] font-medium hover:bg-[#f4ede6]'}`}>
              Từ mới
            </button>
            <button onClick={() => setStatusFilter('learning')} className={`px-4 py-1.5 rounded-full font-['Comfortaa'] text-[13px] crayon-chip whitespace-nowrap active:scale-95 transition-transform ${statusFilter === 'learning' ? 'bg-[#33302c] text-[#f7efe9] font-bold' : 'bg-[#ffffff] text-[#43483f] font-medium hover:bg-[#f4ede6]'}`}>
              Đang ôn
            </button>
            <button onClick={() => setStatusFilter('mastered')} className={`px-4 py-1.5 rounded-full font-['Comfortaa'] text-[13px] crayon-chip whitespace-nowrap active:scale-95 transition-transform ${statusFilter === 'mastered' ? 'bg-[#33302c] text-[#f7efe9] font-bold' : 'bg-[#ffffff] text-[#43483f] font-medium hover:bg-[#f4ede6]'}`}>
              Đã thuộc
            </button>
          </div>
        </section>

        {/* Vocabulary Cards List */}
        <section className="space-y-4 mb-8">
          {filteredWords && filteredWords.map((word, index) => (
            <article key={word.id || index} className="crayon-card bg-[#ffffff] p-4 relative mb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-[#f4ede6] flex items-center justify-center font-['Comfortaa'] text-[18px] font-bold text-[#1e1b17] border border-[#3d352e]/30">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-['Comfortaa'] text-[22px] text-[#1e1b17] font-bold">{word.word}</span>
                      {word.phonetic && <span className="font-['Plus_Jakarta_Sans'] text-[14px] text-[#43483f]">{word.phonetic}</span>}
                      <span className={`inline-block px-2 py-0.5 rounded-full font-['Comfortaa'] text-[11px] font-bold ${word.status === 'mastered' ? 'bg-[#ccecbc] text-[#092104]' : word.status === 'learning' ? 'bg-[#ffdbc9] text-[#70370f]' : 'bg-[#c3e8ff] text-[#3b6379]'}`}>
                        {word.status === 'mastered' ? 'Đã thuộc' : word.status === 'learning' ? 'Đang ôn' : 'Mới'}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handlePlayWord(word.word)} aria-label="Phát âm từ" className="p-1.5 text-[#43483f] hover:text-[#4b6540] active:scale-90 transition-transform">
                  <span className="material-symbols-outlined" data-icon="volume_up">volume_up</span>
                </button>
              </div>
              <div className="mt-2.5 pl-10">
                <div className="flex items-center gap-1.5 text-[#74796f] text-xs mb-1">
                  <span className="material-symbols-outlined text-sm" data-icon="close">close</span>
                  <span className="font-['Comfortaa'] text-[11px] font-bold">{word.pos || 'Từ vựng'}</span>
                </div>
                <p className="font-['Plus_Jakarta_Sans'] text-[16px] text-[#1e1b17] font-bold">{word.meaning}</p>
                {word.exampleSentence && (
                  <div className="mt-2.5 p-3 sketch-quote">
                    <p className="font-['Plus_Jakarta_Sans'] text-[14px] text-[#1e1b17] italic leading-relaxed">
                      {word.exampleSentence}
                    </p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        {/* Floating FAB for Context Action (e.g. general report flag like in design) */}
        <div className="fixed bottom-24 right-5 z-40">
          <button aria-label="Cắm cờ ôn tập" className="w-14 h-14 rounded-full bg-[#ffffff] border-[3px] border-[#3d352e] shadow-lg flex items-center justify-center text-[#ba1a1a] hover:bg-[#ffdad6] transition-transform active:scale-90">
            <span className="material-symbols-outlined text-2xl font-bold" data-icon="flag">flag</span>
          </button>
        </div>
      </div>
    </>
  );
}
