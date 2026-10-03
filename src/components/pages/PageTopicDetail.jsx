import React from 'react';
import { useTopicDetail } from '../../hooks/useTopicDetail';
import { useRoute } from '../../router/RouteContext';
import { useModal } from '../../context/ModalContext';

export default function PageTopicDetail() {
  const {
    topicId,
    topicName,
    loading,
    error,
    isUserPro,
    isCambridge,
    camHierarchy,
    camStats,
    currentTestIndex,
    setCurrentTestIndex,
    currentPassages,
    lessons,
    nonCamTotalWords,
    openPassage,
    openUnlinkedWords,
    openLesson,
    startPractice,
    startReading
  } = useTopicDetail();

  const { navigateTo } = useRoute();
  const { openModal } = useModal();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crayon-green"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-error font-bold mb-4">Lỗi tải dữ liệu chủ đề!</p>
        <button onClick={() => navigateTo('topics')} className="px-4 py-2 bg-primary text-white rounded-xl">Quay lại</button>
      </div>
    );
  }

  const handleAddWord = () => {
    openModal('addWord', { topicId });
  };

  return (
    <>
      {/* MOBILE LAYOUT */}
      <div className="block lg:hidden bg-background text-on-surface paper-texture min-h-screen flex-col font-body-md antialiased pb-28">
        <header className="sticky top-0 z-40 bg-surface shadow-sm px-margin py-space-sm flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <button
              onClick={() => navigateTo('topics')}
              aria-label="Quay lại"
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface crayon-border-sm active:scale-95 transition-transform duration-150"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">{topicName || 'Chủ đề'}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Luyện tập từ vựng</span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary crayon-border-sm hover:bg-surface-container-low transition-colors active:scale-95" type="button">
              <span className="material-symbols-outlined text-[22px]">search</span>
            </button>
          </div>
        </header>

        <section className="px-margin mt-space-sm">
          <div className="bg-primary-fixed-dim/30 rounded-2xl p-space-sm flex items-center gap-space-sm crayon-border-sm">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 crayon-border-sm">
              <span className="material-symbols-outlined text-[22px]">emoji_nature</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface leading-tight">
              <span className="font-label-md text-label-md text-primary">Bé Gấu HiVocab:</span> "Hôm nay cùng học thật chăm chỉ nhé!"
            </p>
          </div>
        </section>

        <main className="px-margin mt-space-md flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest crayon-card p-space-md relative overflow-hidden">
            <div className="absolute -right-3 -top-3 w-12 h-12 bg-secondary-fixed rounded-full opacity-60 border border-inverse-surface pointer-events-none"></div>
            <div className="flex justify-between items-start gap-space-sm relative z-10">
              <div>
                <div className="inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded-full mb-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">auto_stories</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {isCambridge ? 'Bộ đề Cambridge' : 'Chủ đề từ vựng'}
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">{topicName}</h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  {isCambridge 
                    ? `${camHierarchy?.length || 0} bài Test · ${camStats?.totalPassages || 0} bài đọc · ${camStats?.totalWords || 0} từ vựng`
                    : `${lessons?.length || 0} bài học · ${nonCamTotalWords || 0} từ vựng`
                  }
                </p>
              </div>
              <button onClick={handleAddWord} className="shrink-0 flex items-center gap-1 bg-inverse-surface text-inverse-on-surface px-space-md py-space-sm rounded-full font-label-md text-label-md active:scale-95 transition-transform duration-150 shadow-md" type="button">
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Thêm từ</span>
              </button>
            </div>
            <div className="mt-space-md pt-space-xs border-t-2 border-surface-variant">
              <div className="flex justify-between items-center mb-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Tổng tiến độ ghi nhớ</span>
                <span className="font-label-sm text-label-sm text-primary">
                  {isCambridge ? Math.round((camStats?.learnedWords / (camStats?.totalWords || 1)) * 100) : 0}% hoàn thành
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden p-0.5 border border-outline-variant">
                <div 
                  className="bg-primary-container h-full rounded-full transition-all duration-300" 
                  style={{ width: `${isCambridge ? Math.round((camStats?.learnedWords / (camStats?.totalWords || 1)) * 100) : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {isCambridge && camHierarchy && camHierarchy.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-space-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-secondary-fixed flex items-center justify-center crayon-border-sm">
                    <span className="material-symbols-outlined text-[18px] text-on-secondary-fixed-variant">quiz</span>
                  </div>
                  <h2 className="font-label-lg text-label-lg text-on-surface uppercase tracking-wide">CHỌN BÀI TEST</h2>
                </div>
              </div>
              <div className="flex gap-space-sm overflow-x-auto no-scrollbar py-1">
                {camHierarchy.map((test, index) => {
                  const isActive = index === currentTestIndex;
                  return (
                    <button
                      key={test.id}
                      onClick={() => setCurrentTestIndex(index)}
                      className={`shrink-0 px-space-md py-2 rounded-full flex items-center gap-2 crayon-border-sm transition-colors active:scale-95 ${
                        isActive ? 'bg-inverse-surface text-inverse-on-surface' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                      }`}
                      type="button"
                    >
                      <span className="font-label-md text-label-md">{test.title}</span>
                      <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${
                        isActive ? 'bg-surface-container-highest/30 text-inverse-on-surface' : 'bg-surface-variant text-on-surface-variant'
                      }`}>
                        {test.wordsCount} từ
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <div className="flex flex-col gap-space-md mt-1">
            {isCambridge ? (
              currentPassages?.map((passage, idx) => {
                const completionPct = passage.wordsCount > 0 ? Math.round((passage.learnedWords / passage.wordsCount) * 100) : 0;
                return (
                  <article key={passage.id} className="bg-surface-container-lowest crayon-card p-space-md flex flex-col gap-space-sm relative">
                    <div className="flex justify-between items-center">
                      <div className="inline-flex items-center gap-1.5 bg-surface-container px-3 py-1 rounded-full crayon-border-sm">
                        <span className="material-symbols-outlined text-[16px] text-tertiary">article</span>
                        <span className="font-label-md text-label-md text-on-surface">Passage {idx + 1}</span>
                      </div>
                      <span className="font-label-md text-label-md bg-secondary-fixed text-on-secondary-fixed-variant px-2.5 py-0.5 rounded-full crayon-border-sm">
                        {completionPct}%
                      </span>
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight">{passage.title}</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{passage.topicArea || 'Reading Passage'}</p>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b-2 border-surface-container-high">
                      <span className="font-label-md text-label-md text-on-surface-variant">{passage.wordsCount} từ vựng</span>
                      <button 
                        onClick={() => openPassage(passage.id, passage.title)}
                        className="flex items-center gap-1 text-primary font-label-md text-label-md hover:underline active:scale-95 transition-transform" 
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">menu_book</span>
                        <span>Đọc bài</span>
                      </button>
                    </div>
                    <div className="pt-1">
                      <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">CHẾ ĐỘ HỌC TẬP</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => startPractice(0, passage.id)} className="bg-surface-container-low hover:bg-surface-container p-2 rounded-2xl flex flex-col items-center justify-center gap-1 crayon-border-sm active:scale-95 transition-transform" type="button">
                          <span className="material-symbols-outlined text-secondary text-[22px]">bolt</span>
                          <span className="font-label-sm text-label-sm text-on-surface text-center">Flashcard</span>
                        </button>
                        <button onClick={() => startPractice(1, passage.id)} className="bg-surface-container-low hover:bg-surface-container p-2 rounded-2xl flex flex-col items-center justify-center gap-1 crayon-border-sm active:scale-95 transition-transform" type="button">
                          <span className="material-symbols-outlined text-tertiary text-[22px]">help_center</span>
                          <span className="font-label-sm text-label-sm text-on-surface text-center">Trắc nghiệm</span>
                        </button>
                        <button onClick={() => startPractice(2, passage.id)} className="bg-surface-container-low hover:bg-surface-container p-2 rounded-2xl flex flex-col items-center justify-center gap-1 crayon-border-sm active:scale-95 transition-transform" type="button">
                          <span className="material-symbols-outlined text-primary text-[22px]">draw</span>
                          <span className="font-label-sm text-label-sm text-on-surface text-center">Điền từ</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              lessons?.map((lesson, idx) => {
                const completionPct = lesson.wordsCount > 0 ? Math.round((lesson.learnedWords / lesson.wordsCount) * 100) : 0;
                return (
                  <article key={lesson.id} className="bg-surface-container-lowest crayon-card p-space-md flex flex-col gap-space-sm relative">
                    <div className="flex justify-between items-center">
                      <div className="inline-flex items-center gap-1.5 bg-surface-container px-3 py-1 rounded-full crayon-border-sm">
                        <span className="material-symbols-outlined text-[16px] text-tertiary">menu_book</span>
                        <span className="font-label-md text-label-md text-on-surface">Lesson {idx + 1}</span>
                      </div>
                      <span className="font-label-md text-label-md bg-secondary-fixed text-on-secondary-fixed-variant px-2.5 py-0.5 rounded-full crayon-border-sm">
                        {completionPct}%
                      </span>
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight">{lesson.title}</h3>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b-2 border-surface-container-high">
                      <span className="font-label-md text-label-md text-on-surface-variant">{lesson.wordsCount} từ vựng</span>
                      <button 
                        onClick={() => openLesson(lesson.id)}
                        className="flex items-center gap-1 text-primary font-label-md text-label-md hover:underline active:scale-95 transition-transform" 
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                        <span>Vào học</span>
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </main>
      </div>


      {/* DESKTOP LAYOUT */}
      <main className="hidden lg:flex flex-1 flex-col min-w-0 overflow-y-auto px-8 py-6 lg:pl-64 xl:pl-72 w-full max-w-[1440px] mx-auto min-h-screen">
        <header className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold">
              <button onClick={() => navigateTo('topics')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-crayon-charcoal shadow-crayonSm text-crayon-dark hover:bg-crayon-sand transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                <span>Quay lại danh sách chủ đề</span>
              </button>
              <span className="text-crayon-gray">/</span>
              <span className="text-crayon-gray hover:text-crayon-dark cursor-pointer">Chủ đề &amp; Khóa học</span>
              <span className="text-crayon-gray">/</span>
              <span className="text-crayon-terracotta font-heading font-bold">{topicName}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <input className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-xl border border-crayon-charcoal shadow-crayonSm focus:outline-none focus:ring-2 focus:ring-crayon-green font-body placeholder:text-gray-400" placeholder="Tìm từ, passage..." type="text" />
                <svg className="w-4 h-4 absolute left-3 top-2 text-crayon-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <button onClick={handleAddWord} className="px-3.5 py-1.5 text-xs font-bold bg-crayon-terracotta text-white rounded-xl border border-crayon-charcoal shadow-crayonSm hover:brightness-105 transition-all flex items-center gap-1.5" type="button">
                <span className="text-sm leading-none font-bold">+</span>
                <span>Thêm từ mới</span>
              </button>
            </div>
          </div>
        </header>

        <section className="mb-6">
          <div className="p-4 rounded-2xl bg-[#EFF6EE] border-2 border-crayon-charcoal shadow-crayon flex items-center gap-4">
            <div className="relative w-12 h-12 shrink-0 bg-[#FFF7E8] rounded-2xl border-2 border-crayon-charcoal shadow-crayonSm flex items-center justify-center text-2xl">
              🐾
              <span className="absolute -top-1 -right-1 text-xs">✨</span>
            </div>
            <div className="flex-1 text-xs md:text-sm text-crayon-dark">
              <span className="font-heading font-bold text-crayon-green">Bé Hổ HiVocab nhắn nhủ:</span>
              <p className="font-medium inline ml-1">
                "Hôm nay hãy học thật chăm chỉ và hoàn thành mục tiêu nhé!"
              </p>
            </div>
            <button className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl bg-crayon-green text-white border border-crayon-charcoal shadow-crayonSm hover:bg-emerald-800 transition" type="button">
              Vào học ngay →
            </button>
          </div>
        </section>

        <section className="mb-6">
          <div className="crayon-box p-6 relative overflow-hidden bg-gradient-to-r from-white via-white to-[#FDF8F3] rounded-2xl border-2 border-crayon-charcoal shadow-crayon">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#FDE8DF] rounded-full blur-2xl opacity-60 pointer-events-none"></div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-bold text-crayon-dark bg-[#EFE7DA] rounded-full border border-crayon-charcoal flex items-center gap-1.5">
                    📖 {isCambridge ? 'Bộ đề Cambridge Official' : 'Chủ đề từ vựng'}
                  </span>
                </div>
                <div>
                  <h2 className="text-3xl font-heading font-bold text-crayon-charcoal tracking-tight flex items-center gap-3">
                    {topicName}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-crayon-gray pt-1">
                  {isCambridge ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-crayon-green"></span>
                        <span><strong>{camHierarchy?.length || 0}</strong> bài Test</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span><strong>{camStats?.totalPassages || 0}</strong> bài đọc (Passages)</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-crayon-terracotta"></span>
                        <span><strong>{camStats?.totalWords || 0}</strong> từ vựng</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-crayon-green"></span>
                        <span><strong>{lessons?.length || 0}</strong> bài học</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-crayon-terracotta"></span>
                        <span><strong>{nonCamTotalWords || 0}</strong> từ vựng</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="w-full lg:w-80 p-4 rounded-2xl bg-[#FFFDF9] border-2 border-crayon-charcoal shadow-crayonSm space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-crayon-dark">Tổng tiến độ</span>
                  <span className="text-crayon-green text-sm font-heading">
                    {isCambridge ? Math.round((camStats?.learnedWords / (camStats?.totalWords || 1)) * 100) : 0}% hoàn thành
                  </span>
                </div>
                <div className="w-full h-3.5 bg-[#EAE2D5] rounded-full border border-crayon-charcoal overflow-hidden p-0.5">
                  <div className="h-full bg-gradient-to-r from-crayon-green to-[#6AA173] rounded-full border-r border-crayon-charcoal transition-all duration-500" 
                    style={{ width: `${isCambridge ? Math.round((camStats?.learnedWords / (camStats?.totalWords || 1)) * 100) : 0}%` }}></div>
                </div>
              </div>
            </div>

            <div className="border-top-2 border-dashed border-[#E2D9CC] my-5"></div>
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs font-bold uppercase tracking-wider text-crayon-gray flex items-center gap-1.5">
                <span>🎯</span>
                <span>Chế độ ôn tập:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button onClick={() => startPractice(0)} className="px-4 py-2 text-xs font-bold text-crayon-dark bg-[#FFF1EB] hover:bg-crayon-terracotta hover:text-white rounded-xl border-2 border-crayon-charcoal shadow-crayonSm transition-all flex items-center gap-2" type="button">
                  <span className="text-sm">⚡</span>
                  <span>Flashcard</span>
                </button>
                <button onClick={() => startPractice(1)} className="px-4 py-2 text-xs font-bold text-crayon-dark bg-[#EBF4FA] hover:bg-crayon-accentBlue hover:text-white rounded-xl border-2 border-crayon-charcoal shadow-crayonSm transition-all flex items-center gap-2" type="button">
                  <span className="text-sm">❓</span>
                  <span>Trắc nghiệm</span>
                </button>
                <button onClick={() => startPractice(2)} className="px-4 py-2 text-xs font-bold text-crayon-dark bg-[#EDF6EB] hover:bg-crayon-green hover:text-white rounded-xl border-2 border-crayon-charcoal shadow-crayonSm transition-all flex items-center gap-2" type="button">
                  <span className="text-sm">✍️</span>
                  <span>Điền từ</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {isCambridge && camHierarchy && camHierarchy.length > 0 && (
          <section className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F6EBE5] border-2 border-crayon-charcoal shadow-crayonSm flex items-center justify-center text-sm font-bold">
                  📚
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-crayon-charcoal tracking-wide uppercase">Chọn Bài Test</h3>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {camHierarchy.map((test, index) => {
                const isActive = index === currentTestIndex;
                const completionPct = test.wordsCount > 0 ? Math.round((test.learnedWords / test.wordsCount) * 100) : 0;
                
                if (isActive) {
                  return (
                    <button key={test.id} className="p-3 rounded-2xl bg-crayon-dark text-white border-2 border-crayon-charcoal shadow-crayon flex items-center justify-between text-left transition-transform scale-[1.01]" type="button">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-amber-300 font-bold">Đang học</div>
                        <div className="text-sm font-heading font-bold">{test.title}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#473E36] text-white border border-[#5C5147]">{test.wordsCount} từ</span>
                        <div className="text-[10px] text-emerald-300 font-bold mt-0.5">{completionPct}% xong</div>
                      </div>
                    </button>
                  );
                } else {
                  return (
                    <button key={test.id} onClick={() => setCurrentTestIndex(index)} className="p-3 rounded-2xl bg-white hover:bg-[#FAF4EC] text-crayon-dark border-2 border-crayon-charcoal shadow-crayonSm flex items-center justify-between text-left transition-all" type="button">
                      <div>
                        <div className="text-xs text-crayon-gray font-semibold">Khác</div>
                        <div className="text-sm font-heading font-bold text-crayon-charcoal">{test.title}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-crayon-sand text-crayon-dark border border-crayon-charcoal/30">{test.wordsCount} từ</span>
                    </button>
                  );
                }
              })}
            </div>
          </section>
        )}

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-crayon-terracotta border border-crayon-charcoal inline-block"></span>
              <h4 className="font-heading font-bold text-crayon-charcoal text-base">
                {isCambridge ? `Danh Sách Bài Đọc Test ${currentTestIndex + 1}` : 'Danh Sách Bài Học'}
              </h4>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isCambridge ? (
              currentPassages?.map((passage, idx) => {
                const completionPct = passage.wordsCount > 0 ? Math.round((passage.learnedWords / passage.wordsCount) * 100) : 0;
                return (
                  <article key={passage.id} className="p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200 group bg-white border-2 border-crayon-charcoal shadow-crayon rounded-2xl">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 text-xs font-heading font-bold text-crayon-dark bg-[#FFF5E6] rounded-xl border-2 border-crayon-charcoal shadow-crayonSm flex items-center gap-1.5">
                          📑 Passage {idx + 1}
                        </span>
                        <span className="px-2.5 py-0.5 text-xs font-bold text-emerald-800 bg-[#E0F2E9] rounded-full border border-emerald-400">
                          {completionPct}%
                        </span>
                      </div>
                      <h5 className="font-serifHeading font-bold text-xl text-crayon-dark tracking-tight leading-snug group-hover:text-crayon-terracotta transition-colors">
                        {passage.title}
                      </h5>
                      <p className="text-xs font-semibold text-crayon-gray mt-1 line-clamp-1">
                        {passage.topicArea || 'Reading Passage'}
                      </p>
                      
                      <div className="mt-3 w-full h-2 bg-[#EFE8DD] rounded-full border border-crayon-charcoal overflow-hidden">
                        <div className="h-full bg-crayon-green rounded-full" style={{ width: `${completionPct}%` }}></div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between text-xs py-2 border-y border-[#EBE4D8]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">📝</span>
                          <span className="font-bold text-crayon-charcoal">{passage.wordsCount} từ vựng</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-5 space-y-2.5">
                      <button onClick={() => openPassage(passage.id, passage.title)} className="w-full py-2.5 px-4 text-xs font-heading font-bold text-white bg-crayon-green hover:bg-[#3D5642] rounded-xl border-2 border-crayon-charcoal shadow-crayonSm flex items-center justify-center gap-2 transition-all">
                        <span>📖</span>
                        <span>Đọc bài đọc &amp; Tra từ trực tiếp</span>
                      </button>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <button onClick={() => startPractice(0, passage.id)} className="py-1.5 px-1 text-[11px] font-bold text-crayon-dark bg-[#FFF1EB] hover:bg-crayon-terracotta hover:text-white rounded-lg border border-crayon-charcoal transition-colors">
                          ⚡ Flashcard
                        </button>
                        <button onClick={() => startPractice(1, passage.id)} className="py-1.5 px-1 text-[11px] font-bold text-crayon-dark bg-[#EBF4FA] hover:bg-crayon-accentBlue hover:text-white rounded-lg border border-crayon-charcoal transition-colors">
                          ❓ Trắc nghiệm
                        </button>
                        <button onClick={() => startPractice(2, passage.id)} className="py-1.5 px-1 text-[11px] font-bold text-crayon-dark bg-[#EDF6EB] hover:bg-crayon-green hover:text-white rounded-lg border border-crayon-charcoal transition-colors">
                          ✍️ Điền từ
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              lessons?.map((lesson, idx) => {
                const completionPct = lesson.wordsCount > 0 ? Math.round((lesson.learnedWords / lesson.wordsCount) * 100) : 0;
                return (
                  <article key={lesson.id} className="p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200 group bg-white border-2 border-crayon-charcoal shadow-crayon rounded-2xl">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 text-xs font-heading font-bold text-crayon-dark bg-[#EBF4FA] rounded-xl border-2 border-crayon-charcoal shadow-crayonSm flex items-center gap-1.5">
                          📑 Lesson {idx + 1}
                        </span>
                        <span className="px-2.5 py-0.5 text-xs font-bold text-emerald-800 bg-[#E0F2E9] rounded-full border border-emerald-400">
                          {completionPct}%
                        </span>
                      </div>
                      <h5 className="font-serifHeading font-bold text-xl text-crayon-dark tracking-tight leading-snug group-hover:text-crayon-terracotta transition-colors">
                        {lesson.title}
                      </h5>
                      
                      <div className="mt-3 w-full h-2 bg-[#EFE8DD] rounded-full border border-crayon-charcoal overflow-hidden">
                        <div className="h-full bg-crayon-green rounded-full" style={{ width: `${completionPct}%` }}></div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between text-xs py-2 border-y border-[#EBE4D8]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">📝</span>
                          <span className="font-bold text-crayon-charcoal">{lesson.wordsCount} từ vựng</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-5 space-y-2.5">
                      <button onClick={() => openLesson(lesson.id)} className="w-full py-2.5 px-4 text-xs font-heading font-bold text-white bg-crayon-green hover:bg-[#3D5642] rounded-xl border-2 border-crayon-charcoal shadow-crayonSm flex items-center justify-center gap-2 transition-all">
                        <span>▶️</span>
                        <span>Vào học Lesson</span>
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </main>
    </>
  );
}
