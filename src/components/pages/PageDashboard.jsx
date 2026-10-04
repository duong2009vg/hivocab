import React, { useCallback, useEffect, useState } from 'react';
import { useDashboardStats } from '../../hooks/useDashboardStats.js';
import { useRoute } from '../../router/RouteContext.jsx';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { getWordsDueForReview } from '../../services/db.js';

export function PageDashboard() {
  const { navigateTo } = useRoute();
  const { user, profile } = useAuth();
  const {
    stats,
    loading,
    heroState,
    countdown,
    calendar = {},
    ieltsGoal,
    prevMonth,
    nextMonth,
    showDayDetail,
  } = useDashboardStats();

  const [searchQuery, setSearchQuery] = useState('');

  // Random word of the day
  const dailyWord = {
    word: 'embellish',
    ipa: '/ɪmˈbel.ɪʃ/',
    pos: 'động từ',
    level: 'C1 Academic',
    meaning: 'Trang trí, tô điểm hoặc làm đẹp thêm cho một câu chuyện / sự vật.',
    example: '"He couldn\'t resist embellishing the story of his tiger encounter."',
  };

  const handlePlayAudio = (word) => {
    if (typeof window !== 'undefined' && window.HiAudio?.playWord) {
      window.HiAudio.playWord(word, 0.9);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(word);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }
  };

  const handleStartReview = useCallback(async () => {
    try {
      const dueWords = await getWordsDueForReview(20);
      if (dueWords && dueWords.length > 0) {
        if (typeof window !== 'undefined') {
          window._currentSessionWords = dueWords;
          window._currentLessonWords = dueWords;
          window._practiceMode = null;
        }
        navigateTo('learning');
      } else {
        if (typeof window !== 'undefined' && typeof window.showHiToast === 'function') {
          window.showHiToast('Hiện không có từ vựng nào đến hạn ôn tập hôm nay.', 'info');
        }
      }
    } catch (err) {
      console.warn('[Dashboard] handleStartReview error:', err);
      navigateTo('learning');
    }
  }, [navigateTo]);

  useEffect(() => {
    window.startSession = handleStartReview;
    return () => {
      delete window.startSession;
    };
  }, [handleStartReview]);

  const { memoryLevels = { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 } } = stats;

  const maxLevelCount = Math.max(
    memoryLevels.lv0 || 0,
    memoryLevels.lv1 || 0,
    memoryLevels.lv2 || 0,
    memoryLevels.lv3 || 0,
    memoryLevels.lv4 || 0,
    memoryLevels.lv5 || 0,
    1
  );

  const getBarHeight = (count) => {
    if (!count || count === 0) return '6px';
    return `${Math.max(14, Math.round((count / maxLevelCount) * 100))}%`;
  };

  const handleLevelClick = (lvl) => {
    navigateTo('vocabulary');
    setTimeout(() => {
      if (typeof window !== 'undefined' && typeof window.filterVocabLevel === 'function') {
        window.filterVocabLevel(lvl);
      }
    }, 150);
  };

  const handleOpenIELTSModal = () => {
    if (typeof window !== 'undefined' && window.HiDashboard && typeof window.HiDashboard.openIELTSGoalModal === 'function') {
      window.HiDashboard.openIELTSGoalModal();
    } else if (typeof window !== 'undefined' && typeof window.openIELTSGoalModal === 'function') {
      window.openIELTSGoalModal();
    }
  };

  const handleOpenAddWord = () => {
    if (typeof window !== 'undefined' && typeof window.openAddWordModal === 'function') {
      window.openAddWordModal();
    }
  };

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'bạn học';
  const streak = stats.streak || 0;
  const wordsDueCount = stats.wordsDueCount || 0;
  const total = stats.totalWordsCount || 0;

  // Calendar logic
  const flatDays = calendar.days || (calendar.weeks ? calendar.weeks.flat().filter(d => d && d.date) : []);
  const startDayIndex = calendar.startDayIndex ?? (flatDays[0] ? (new Date(flatDays[0].date).getDay() + 6) % 7 : 0);
  const activeDaysCount = calendar.activeDaysCount || 0;
  const totalWords = calendar.totalWordsLearned || 0;

  // Choose Mascot based on Hero state
  const mascotImg =
    heroState === 'countdown'
      ? '/mascot/mascot_celebrating.png'
      : wordsDueCount > 0
      ? '/mascot/mascot_cozy.png'
      : '/mascot/mascot_waving.png';

  const ieltsPercent = Math.min(100, ieltsGoal?.progressPercent || 38);

  return (
    <div id="page-dashboard" className="page active min-h-screen text-[#3d352e] font-nunito antialiased bg-[#f7f3eb]" style={{ backgroundImage: 'radial-gradient(#dfd5c4 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      
      {/* MOBILE LAYOUT */}
      <div className="block lg:hidden w-full">
        <div className="w-full max-w-[430px] min-h-screen flex flex-col px-4 pt-3 pb-8 relative mx-auto bg-[#FAF5EB]">
          {/* Header Section: Tinh gọn chỉ icon chuỗi ngày giữ lửa bên trái và avatar bên phải */}
          <section className="mt-1 mb-4 flex items-center justify-between">
            <div className="inline-flex items-center space-x-1.5 bg-[#382E2B] text-[#FFF9F0] py-2 px-3.5 rounded-2xl shadow-sm">
              <span className="text-base">🔥</span>
              <span className="text-sm font-bold tracking-wide">{streak} Ngày giữ lửa</span>
            </div>
            <button
              aria-label="Tài khoản"
              onClick={() => {
                if (typeof window !== 'undefined' && window.toggleMobileProfileDropdown) {
                  window.toggleMobileProfileDropdown();
                } else {
                  navigateTo('settings');
                }
              }}
              className="w-10 h-10 rounded-2xl border-2 border-[#382E2B] bg-[#FFFBF2] flex items-center justify-center text-[#382E2B] shadow-sm hover:bg-[#FAF5EB] transition-all overflow-hidden"
            >
              {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                <img
                  src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </section>

          {/* Mascot Review Hero Card */}
          <section className="mb-5 text-center flex flex-col items-center justify-center relative select-none">
            <div className="inline-flex items-center space-x-2 bg-[#F5EFE0] px-3 py-1 rounded-full border border-[#D9CEBA] shadow-sm mb-1">
              <span className="text-[11px] font-bold text-[#86756C] uppercase tracking-wider">Lặp lại ngắt quãng SRS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#DE5D53]"></span>
              <span className="text-xs text-[#DE5D53] font-bold">{wordsDueCount} từ cần ôn</span>
            </div>
            <div className="my-2 relative flex justify-center items-center">
              <img src={mascotImg} className="w-56 h-56 object-contain select-none transition-transform duration-300 hover:scale-105 filter drop-shadow-sm" style={{ mixBlendMode: 'multiply' }} alt="Mascot"/>
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <h2 className="text-2xl font-bold text-[#382E2B] tracking-tight">{heroState === 'countdown' ? 'Lần ôn tập kế tiếp' : 'Đến giờ ôn tập rồi bạn ơi!'}</h2>
              <p className="text-sm text-[#6A5A50] font-medium leading-relaxed">
                {heroState === 'countdown' ? (
                  <>Nghỉ ngơi chút nhé! Quay lại sau: <strong className="text-[#F0783C] font-bold text-base">{countdown?.hours || 0}g {countdown?.minutes || 0}p</strong></>
                ) : (
                  <>Bạn có <strong className="text-[#F0783C] font-bold text-base">{wordsDueCount} từ vựng</strong> đang chờ được củng cố ✨</>
                )}
              </p>
            </div>
            <div className="mt-3.5">
              {heroState !== 'countdown' && (
                <button onClick={handleStartReview} className="inline-flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#759864] hover:bg-[#6A8B5A] text-white text-base font-bold rounded-full border-[2.5px] border-[#382E2B] shadow-[2px_3px_0px_#382E2B] transition-transform active:scale-95">
                  <span className="w-5 h-5 rounded-full bg-[#FAF5EB] text-[#759864] text-xs flex items-center justify-center font-bold">▶</span>
                  <span>Ôn tập ngay ({wordsDueCount} từ) ✏️</span>
                </button>
              )}
            </div>
          </section>

          {/* SRS Analytics Card */}
          <section className="bg-[#FFFDF7] p-4 border-[2.5px] border-[#443833] rounded-[26px] shadow-[3px_4px_0px_#443833] relative overflow-hidden mb-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#DECDBB]">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-xl bg-[#E1EDDB] border border-[#8DAA68] flex items-center justify-center text-sm shadow-sm">🔄</span>
                <h2 className="text-xl font-bold text-[#382E2B] tracking-wide">Tổng quan SRS</h2>
                <button className="w-5 h-5 rounded-full border border-[#86756C] text-[#86756C] text-xs flex items-center justify-center font-bold">?</button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 text-xs font-bold text-[#382E2B] bg-[#EADDC7] rounded-full border border-dashed border-[#86756C]">{total} từ</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 mb-2">
              <span className="text-[11px] font-bold tracking-wider text-[#8A796F] uppercase">Phân bố từ vựng theo cấp độ</span>
              <span onClick={() => navigateTo('vocabulary')} className="text-xs text-[#DE5D53] font-bold cursor-pointer">Chi tiết ➔</span>
            </div>
            
            <div className="pt-3 pb-2 flex items-end justify-between px-1 text-center">
              {[0, 1, 2, 3, 4, 5].map((lvl) => {
                const count = memoryLevels[`lv${lvl}`] || 0;
                let bgClass = '', borderClass = '', dims = 'w-4', hClass = 'h-2', opacity = 'opacity-70';
                if (lvl === 0) { bgClass = 'bg-[#96A0A8]'; opacity = 'opacity-80'; }
                else if (lvl === 1) { bgClass = 'bg-[#F0783C]'; borderClass = 'border-2 border-[#382E2B]'; dims = 'w-5'; opacity = ''; }
                else if (lvl === 2) { bgClass = 'bg-[#ECA43B]'; borderClass = 'border-2 border-[#382E2B]'; dims = 'w-5'; opacity = ''; }
                else if (lvl === 3) { bgClass = 'bg-[#4CA9D6]'; }
                else if (lvl === 4) { bgClass = 'bg-[#A682BD]'; }
                else if (lvl === 5) { bgClass = 'bg-[#6EB882]'; }
                
                return (
                  <div key={lvl} onClick={() => handleLevelClick(lvl)} className="flex flex-col items-center flex-1 cursor-pointer">
                    <span className="text-sm font-bold text-[#382E2B]">{count}</span>
                    <div className="h-24 flex items-end justify-center w-full py-1">
                      <div className={`${dims} ${bgClass} ${borderClass} rounded-full relative shadow-sm ${opacity} transition-all`} style={{ height: getBarHeight(count) }} />
                    </div>
                    <span className="text-[11px] font-bold text-[#7A6B62] mt-1">Lvl {lvl}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 pt-2.5 border-t border-dashed border-[#DECDBB] flex items-center justify-between text-xs text-[#827165]">
              <span className="font-medium">Chu kỳ SRS v4 thông minh</span>
              <span className="bg-[#FDEAE2] text-[#DE5D53] border border-[#F6C6C2] px-2.5 py-0.5 rounded-full font-bold">Cần ôn: {memoryLevels.lv1 || 0} từ Lvl 1</span>
            </div>
          </section>

          {/* Exam Hall Card */}
          <section className="bg-white border-[3.5px] border-[#382E2B] rounded-[28px] shadow-sm p-4 mb-4">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E6F3FB] border-2 border-[#382E2B] flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">🎓</div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-1.5 mb-1">
                  <span className="text-[11px] font-bold text-[#2A7BA0] bg-[#E1F1FA] px-2.5 py-0.5 rounded-full border border-[#BCE1F5]">PHÒNG THI TRỰC TUYẾN</span>
                  <span className="text-[11px] font-bold text-[#826E5F] bg-[#F3ECE0] px-2 py-0.5 rounded-full border border-[#DED4C3]">38+ Đề chuẩn CBT</span>
                </div>
                <h3 className="text-lg font-bold text-[#382E2B] leading-snug">Phòng Luyện Đề THPT Quốc Gia & IELTS</h3>
              </div>
            </div>
            <p className="text-xs text-[#6B5A4E] mt-2.5 leading-relaxed">Luyện trắc nghiệm tiếng Anh chuẩn cấu trúc đề thi chính thức mới nhất. Bấm giờ 50 phút thực tế, bảng điều hướng tức thì và giải thích chi tiết.</p>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-[#4E4138] font-bold">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs bg-[#EAF5E4] text-[#557A46] border border-[#8FB383] rounded-full w-4 h-4 flex items-center justify-center font-bold">✓</span>
                <span>Chuẩn ma trận BGD</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs bg-[#EAF5E4] text-[#557A46] border border-[#8FB383] rounded-full w-4 h-4 flex items-center justify-center font-bold">✓</span>
                <span>Bấm giờ tự động</span>
              </div>
            </div>
            <div className="mt-3.5">
              <button onClick={() => navigateTo('exercises')} className="w-full bg-[#382E2B] hover:bg-[#2A2220] text-white py-2.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2">
                <span>Vào phòng thi ngay</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">38 đề ➔</span>
              </button>
            </div>
          </section>

          {/* Streak Calendar Card */}
          <section className="bg-white border-[3.5px] border-[#382E2B] rounded-[28px] shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-[#E3D9C6]">
              <div className="flex items-center space-x-2">
                <span className="w-8 h-8 rounded-full bg-[#FEEFEA] border border-[#F8C8B8] flex items-center justify-center text-lg">🔥</span>
                <div>
                  <h3 className="text-base font-bold text-[#382E2B]">Lịch giữ lửa</h3>
                  <p className="text-[11px] text-[#7C6C62]">Mức độ chuyên cần ôn luyện mỗi ngày</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#E65F2B] bg-[#FDEAE2] px-2.5 py-1 rounded-full border border-[#F7BFAB]">{streak} ngày liên tiếp</span>
            </div>
            <div className="flex items-center justify-between mt-3 mb-2 px-2 py-1.5 bg-[#FAF5EB] rounded-2xl border-2 border-[#382E2B]">
              <button onClick={prevMonth} className="text-sm font-bold text-[#382E2B] px-2 hover:opacity-75">‹</button>
              <span className="text-sm font-bold text-[#382E2B]">{calendar.monthYear}</span>
              <button onClick={nextMonth} className="text-sm font-bold text-[#382E2B] px-2 hover:opacity-75">›</button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs font-bold text-[#86756C] mt-2 mb-1">
              <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold">
              {Array.from({ length: startDayIndex }).map((_, i) => (
                <span key={`empty-${i}`} className="py-1.5 opacity-0">0</span>
              ))}
              {flatDays.map((day, i) => {
                const count = day.count || 0;
                let cClass = "py-1.5 rounded-xl border border-[#E3D9C8] text-[#9E8E84]";
                if (day.isToday) {
                  cClass = "py-1.5 rounded-xl bg-[#E6F3FB] border-[2.5px] border-[#2A7BA0] text-[#1B5672] font-bold shadow-sm";
                } else if (count > 0) {
                  cClass = "py-1.5 rounded-xl bg-[#FCD8BE] border-2 border-[#F0783C] text-[#933D0D] font-bold";
                }
                return (
                  <div key={i} onClick={() => showDayDetail(day)} className={cClass}>{day.day}</div>
                );
              })}
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#F0E8D9] flex flex-wrap items-center justify-between text-[11px] text-[#78685E]">
              <div className="flex items-center space-x-2">
                <span>Mức độ:</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#E8DFC8]"></span> 0</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#FCD8BE]"></span> 1-9</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#F0783C]"></span> 10-24</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#DE5D53]"></span> 25+🔥</span>
              </div>
            </div>
            <div className="mt-2 flex space-x-2 text-xs">
              <span className="bg-[#FAF5EB] border border-[#D9CDB8] text-[#69574C] px-2.5 py-1 rounded-full font-bold">Đã học: {activeDaysCount} ngày</span>
              <span className="bg-[#FAF5EB] border border-[#D9CDB8] text-[#69574C] px-2.5 py-1 rounded-full font-bold">Tổng: {totalWords} từ</span>
            </div>
          </section>

          {/* IELTS Goal Card */}
          <section className="bg-white border-[3.5px] border-[#382E2B] rounded-[28px] shadow-sm p-4 mb-6 text-center">
            <div className="w-11 h-11 mx-auto rounded-2xl bg-[#FDF0EE] border-2 border-[#382E2B] flex items-center justify-center text-xl mb-2 shadow-sm">🚩</div>
            <h3 className="text-base font-bold text-[#382E2B]">
              {ieltsGoal?.targetOverall ? `Mục tiêu IELTS ${ieltsGoal.targetOverall}` : 'Bạn chưa đặt mục tiêu IELTS'}
            </h3>
            <p className="text-xs text-[#6B5A4E] mt-1 max-w-xs mx-auto leading-relaxed">
              Thiết lập band điểm 4 kỹ năng và chọn ngày thi để đồng hồ đếm ngược tạo động lực học tập mỗi ngày.
            </p>
            <button onClick={handleOpenIELTSModal} className="mt-3.5 bg-[#FAF5EB] hover:bg-[#F2ECE0] text-[#382E2B] py-2 px-4 rounded-2xl text-xs font-bold border-2 border-[#382E2B] inline-flex items-center space-x-1.5 shadow-sm">
              <span>🎯 Thiết lập mục tiêu ngay</span>
            </button>
          </section>

          <footer className="text-center py-2 mb-14">
            <div className="w-8 h-8 mx-auto mb-1 text-[#8C7B71] text-lg select-none">🐾</div>
            <p className="text-xs text-[#8C7B71] font-medium italic">Trang 1 / {total} từ trong tập vẽ tranh sáp màu</p>
          </footer>
        </div>

        {/* Mobile FAB */}
        <div className="fixed bottom-20 right-5 z-40">
          <button onClick={handleOpenAddWord} className="w-13 h-13 p-3 bg-[#DE5D53] hover:bg-[#C84F45] text-white rounded-full border-[3px] border-[#382E2B] shadow-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:flex flex-1 w-full max-w-[1536px] mx-auto min-h-screen lg:pl-64 xl:pl-72">
        <div className="flex-1 flex flex-col min-w-0">
          {/* TopBar */}
          <header className="px-8 py-5 border-b-2 border-[#e6dcce] bg-[#FAF5EB] sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-crayonText font-quicksand">Chào buổi sáng, {userName} ơi! 🌿</h1>
              </div>
              <p className="text-xs md:text-sm text-softMuted mt-0.5">Hôm nay là một ngày tuyệt vời để ghi nhớ thêm những từ vựng mới.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64 lg:w-72">
                <input 
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white rounded-full crayon-border focus:ring-2 focus:ring-sage focus:outline-none transition-all placeholder:text-softMuted/70" 
                  placeholder="Tìm nhanh từ vựng, chủ đề..." 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      navigateTo('dictionary');
                      setTimeout(() => {
                        if (typeof window !== 'undefined' && window.HiDict?.lookupWord) {
                          window.HiDict.lookupWord(searchQuery.trim());
                        }
                      }, 200);
                    }
                  }}
                />
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-softMuted text-sm"></i>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-orange-100 text-terracotta font-extrabold text-sm crayon-border shadow-crayonSm">
                <span className="text-base animate-bounce">🔥</span>
                <span>{streak} ngày liên tiếp</span>
              </div>
              <button onClick={handleOpenAddWord} className="bg-terracotta hover:bg-terracotta-dark text-white font-bold text-sm px-4 py-2 rounded-full crayon-border shadow-crayonOrange active:translate-y-0.5 transition-all flex items-center gap-2">
                <i className="fa-solid fa-plus text-xs"></i>
                <span>Thêm từ mới</span>
              </button>
              <button className="w-10 h-10 rounded-full bg-white crayon-border flex items-center justify-center text-crayonText hover:bg-cream transition-all relative">
                <i className="fa-regular fa-bell text-sm"></i>
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-terracotta border-2 border-white"></span>
              </button>
            </div>
          </header>

          <main className="p-6 lg:p-8 flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left column */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-7">
                <section className="bg-[#fffdf9] rounded-3xl p-6 lg:p-7 crayon-border shadow-crayon relative overflow-hidden border-2">
                  <div className="relative z-1 flex flex-col md:flex-row items-center gap-6 justify-between">
                    <div className="space-y-4 max-w-md">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage-light text-sage border border-sage/30 text-xs font-bold">
                        <i className="fa-solid fa-sparkles"></i>
                        <span>Thuật toán ngắt quãng Spaced Repetition</span>
                      </div>
                      <h2 className="text-2xl lg:text-3xl font-black text-crayonText font-quicksand leading-tight">
                        {heroState === 'countdown' ? (
                          <>Đã ôn xong hôm nay!<br/><span className="text-sage">Quay lại sau {countdown?.hours || 0}g {countdown?.minutes || 0}p.</span></>
                        ) : (
                          <>Đến giờ ôn tập rồi!<br/><span className="text-terracotta">{wordsDueCount} từ vựng</span> đang chờ bạn.</>
                        )}
                      </h2>
                      <div className="bg-cream/80 border-2 border-[#3d352e] rounded-2xl p-3.5 relative inline-block text-sm font-semibold text-crayonText">
                        <span className="font-bold text-terracotta">Bé Hổ nhắc:</span> {wordsDueCount > 0 ? `"Cùng bé hổ hoàn thành ${wordsDueCount} từ hôm nay nhé! 🐾"` : '"Tuyệt vời! Bạn đã hoàn thành nhiệm vụ hôm nay. ⭐"'}
                        <div className="absolute -left-2 top-4 w-3 h-3 bg-cream border-l-2 border-b-2 border-crayonText rotate-45"></div>
                      </div>
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        {heroState !== 'countdown' && (
                          <button onClick={handleStartReview} className="bg-terracotta hover:bg-terracotta-dark text-white text-base font-black px-6 py-3 rounded-2xl crayon-border shadow-crayonOrange active:translate-y-1 transition-all flex items-center gap-3">
                            <i className="fa-solid fa-play text-sm"></i>
                            <span>Ôn tập ngay ({wordsDueCount} từ SRS)</span>
                          </button>
                        )}
                        <span className="text-xs font-semibold text-softMuted">Mất tầm ~{Math.max(3, Math.round(wordsDueCount * 0.4))} phút</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 w-56 h-56 lg:w-64 lg:h-64 relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-amber-100/50 rounded-full filter blur-xl transform -rotate-6"></div>
                      <img src={mascotImg} className="w-full h-full object-contain relative z-1 mix-blend-multiply drop-shadow-sm transition-transform hover:scale-105 duration-300" alt="Mascot"/>
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-3xl p-6 crayon-border shadow-crayonSm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-crayonText font-quicksand flex items-center gap-2">
                        <i className="fa-solid fa-chart-simple text-sage"></i>
                        Phân bố từ vựng theo cấp độ SRS
                      </h3>
                      <p className="text-xs text-softMuted">Theo dõi mức độ khắc sâu vào trí nhớ dài hạn của bạn</p>
                    </div>
                    <span className="text-xs font-extrabold bg-[#f5ede0] px-3 py-1 rounded-full border border-crayonText/20">
                      Tổng cộng: {total} từ
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-2 sm:gap-3 pt-3">
                    {[0,1,2,3,4,5].map(lvl => {
                      const count = memoryLevels[`lv${lvl}`] || 0;
                      let bg = '', border = '';
                      if (lvl === 0) { bg = 'bg-gray-200'; border = 'border border-dashed border-gray-400'; }
                      else if (lvl === 1) { bg = 'bg-terracotta'; border = 'border-2 border-terracotta'; }
                      else if (lvl === 2) { bg = 'bg-warmAmber'; border = 'border border-warmAmber'; }
                      else if (lvl === 3) { bg = 'bg-softBlue'; border = 'border border-dashed border-softBlue'; }
                      else if (lvl === 4) { bg = 'bg-softPurple'; border = 'border border-dashed border-softPurple'; }
                      else if (lvl === 5) { bg = 'bg-sage'; border = 'border border-dashed border-sage'; }

                      return (
                        <div key={lvl} onClick={() => handleLevelClick(lvl)} className="flex flex-col items-center justify-end h-32 cursor-pointer group">
                          <div className={`w-full rounded-t-lg ${bg} ${border} transition-all group-hover:opacity-80`} style={{ height: getBarHeight(count) }}></div>
                          <div className="text-center mt-2">
                            <span className="block text-sm font-black text-crayonText">{count}</span>
                            <span className="block text-[10px] text-softMuted">Lv {lvl}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>

                <section className="bg-gradient-to-r from-[#eef4ee] to-[#f7eee4] rounded-3xl p-6 crayon-border relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-sage text-white text-xs font-extrabold uppercase">HOT</span>
                      <span className="text-xs font-bold text-softMuted">Mới cập nhật 2026</span>
                    </div>
                    <h3 className="text-xl font-black text-crayonText font-quicksand">Phòng Luyện Đề THPT Quốc Gia & Thi Thử CBT</h3>
                    <p className="text-xs text-softMuted max-w-md">Kho ngân hàng 38+ đề thi chuẩn cấu trúc Bộ Giáo dục, tích hợp bộ đếm giờ tự động 50 phút và giải thích từ vựng chi tiết sau mỗi câu.</p>
                    <div className="flex items-center gap-4 pt-1 text-xs font-bold text-crayonText">
                      <span className="flex items-center gap-1.5"><i className="fa-regular fa-clock text-terracotta"></i> 50 phút</span>
                      <span className="flex items-center gap-1.5"><i className="fa-solid fa-file-pen text-sage"></i> 50 câu hỏi</span>
                      <span className="flex items-center gap-1.5"><i className="fa-solid fa-user-group text-softBlue"></i> 1,420 bạn đang luyện</span>
                    </div>
                  </div>
                  <button onClick={() => navigateTo('exercises')} className="flex-shrink-0 bg-sage hover:bg-sage-dark text-white font-black text-sm px-5 py-3 rounded-2xl crayon-border shadow-crayon active:translate-y-0.5 transition-all flex items-center gap-2">
                    <span>Vào phòng thi ngay</span>
                    <i className="fa-solid fa-arrow-right text-xs"></i>
                  </button>
                </section>
              </div>

              {/* Right column */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-7">
                <section className="bg-white rounded-3xl p-5 sm:p-6 crayon-border shadow-crayonSm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-terracotta text-lg border border-orange-200">🔥</div>
                      <div>
                        <h3 className="text-base font-black text-crayonText font-quicksand">Lịch giữ lửa</h3>
                        <p className="text-[11px] text-softMuted">Mức độ chuyên cần ôn luyện mỗi ngày</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-terracotta bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">{streak} ngày liên tiếp</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-[#fbf8f3] rounded-2xl crayon-border text-sm font-bold text-crayonText">
                    <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-softMuted"><i className="fa-solid fa-chevron-left text-xs"></i></button>
                    <span className="font-quicksand font-extrabold">{calendar.monthYear}</span>
                    <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-softMuted"><i className="fa-solid fa-chevron-right text-xs"></i></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-softMuted/80">
                    <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-crayonText">
                    {Array.from({ length: startDayIndex }).map((_, i) => (
                      <div key={`empty-d-${i}`}></div>
                    ))}
                    {flatDays.map((day, i) => {
                      const count = day.count || 0;
                      let cClass = "h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400";
                      if (day.isToday) cClass = "h-9 flex items-center justify-center rounded-xl border-2 border-blue-600 font-black text-blue-700 bg-blue-50/50 shadow-sm";
                      else if (count > 0) cClass = "h-9 flex items-center justify-center rounded-xl bg-[#fae3d5] text-[#b4482b] font-black border border-orange-300";
                      return (
                        <div key={i} onClick={() => showDayDetail(day)} className={cClass + " cursor-pointer"}>{day.day}</div>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t border-gray-100 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-softMuted">
                      <span>Mức độ:</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border border-gray-300 bg-white"></span>0</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#fae3d5]"></span>1-9</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>10-24</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-terracotta"></span>25+ 🔥</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-bold text-crayonText">Đã học: <span className="text-terracotta font-black">{activeDaysCount} ngày</span></div>
                      <div className="px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-bold text-crayonText">Tổng: <span className="text-terracotta font-black">{totalWords} từ</span></div>
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-3xl p-6 crayon-border shadow-crayonSm relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-black uppercase text-terracotta tracking-wider">Lộ trình rèn luyện</span>
                      <h3 className="text-lg font-black text-crayonText font-quicksand mt-0.5">{ieltsGoal?.targetOverall ? `Mục tiêu IELTS ${ieltsGoal.targetOverall}` : 'Mục tiêu IELTS 7.0'}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center text-lg crayon-border">
                      <i className="fa-solid fa-flag"></i>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-crayonText">
                      <span>Tiến độ từ vựng cốt lõi</span>
                      <span>{ieltsPercent}%</span>
                    </div>
                    <div className="w-full bg-[#f1ebd9] rounded-full h-3.5 p-0.5 border border-crayonText">
                      <div className="bg-terracotta h-2 rounded-full" style={{width: `${ieltsPercent}%`}}></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-softMuted pt-1">
                      <span>Đã đạt {ieltsPercent}% mục tiêu</span>
                      <span className="font-bold text-terracotta">{ieltsGoal?.daysRemaining ? `Còn ${ieltsGoal.daysRemaining} ngày` : 'Chưa chọn ngày thi'}</span>
                    </div>
                  </div>
                  <button onClick={handleOpenIELTSModal} className="mt-4 w-full py-2.5 text-center text-xs font-black rounded-xl bg-cream hover:bg-[#eadecb] text-crayonText crayon-border transition-all">
                    + Tinh chỉnh band điểm mục tiêu
                  </button>
                </section>

                <section className="bg-[#fef9ef] rounded-3xl p-6 crayon-border relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-warmAmber uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fa-solid fa-lightbulb"></i> Từ vựng ngẫu nhiên hôm nay
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-300">{dailyWord.level}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-xl font-black text-crayonText font-quicksand">{dailyWord.word}</h4>
                      <button onClick={() => handlePlayAudio(dailyWord.word)} className="w-8 h-8 rounded-full bg-white hover:bg-amber-100 crayon-border flex items-center justify-center text-crayonText transition-all">
                        <i className="fa-solid fa-volume-high text-xs"></i>
                      </button>
                    </div>
                    <p className="text-xs font-bold text-softMuted">{dailyWord.ipa} • <span className="italic font-normal">{dailyWord.pos}</span></p>
                    <p className="text-sm font-bold text-crayonText pt-1">{dailyWord.meaning}</p>
                    <div className="p-2.5 rounded-xl bg-white/70 border border-dashed border-amber-300 text-xs italic text-softMuted mt-2">
                      {dailyWord.example}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </main>

          <footer className="px-8 py-4 border-t-2 border-[#e6dcce] text-center text-xs text-softMuted bg-[#faf5eb] flex flex-wrap items-center justify-between gap-3">
            <p>© 2026 HiVocab! - Ứng dụng ghi nhớ từ vựng thông minh cho học sinh Việt Nam.</p>
            <div className="flex items-center gap-4 font-bold text-crayonText">
              <a className="hover:underline cursor-pointer">Điều khoản</a>
              <a className="hover:underline cursor-pointer">Cẩm nang ôn thi</a>
              <a className="hover:underline cursor-pointer">Hỗ trợ bé Hổ 🐯</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default PageDashboard;
