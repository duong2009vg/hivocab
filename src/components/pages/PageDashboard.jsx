// src/components/pages/PageDashboard.jsx
// Cozy Study Room Crayon Picture Book Redesign (Google Stitch)
// 100% Faithful Desktop (2560px) + Mobile (780px) Responsive Implementation
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
    calendar,
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

  // Choose Mascot based on Hero state
  const mascotImg =
    heroState === 'countdown'
      ? '/mascot/mascot_celebrating.png'
      : stats.wordsDueCount > 0
      ? '/mascot/mascot_cozy.png'
      : '/mascot/mascot_waving.png';

  return (
    <div id="page-dashboard" className="page active min-h-screen text-[#3d352e] font-nunito selection:bg-orange-200">
      {/* ========================================================================= */}
      {/* 1. MOBILE LAYOUT (< 1024px) - 100% FAITHFUL TO STITCH MOBILE DESIGN     */}
      {/* ========================================================================= */}
      <div className="lg:hidden w-full min-h-screen crayon-paper-bg px-4 pt-3 pb-28 relative flex flex-col items-center">
        <main className="w-full max-w-[430px] flex flex-col" data-purpose="mobile-viewport">
          {/* Main Mobile Header */}
          <section className="mt-1 mb-4" data-purpose="home-header">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#382E2B] font-quicksand flex items-center gap-1.5">
                    Trang chủ <span className="text-2xl">🌿</span>
                  </h1>
                  <span className="bg-[#E5EFE2] text-[#557A46] text-xs font-bold px-2.5 py-1 rounded-full border border-[#8FB383]">
                    Đang học
                  </span>
                </div>
                <p className="text-[14px] text-[#6E5D53] mt-1 font-medium">
                  Hôm nay là một ngày tuyệt vời để học cùng hổ nhỏ! ✏️
                </p>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <span className="text-xl text-[#F4B41A] select-none">★</span>
                <span className="text-lg text-[#DE5D53] select-none">❤</span>
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center space-x-2.5 mt-3.5" data-purpose="header-action-pills">
              {/* Streak pill */}
              <div className="flex-1 bg-[#382E2B] text-[#FFF9F0] py-2 px-3 rounded-2xl flex items-center justify-center space-x-1.5 shadow-sm crayon-btn">
                <span className="text-base">🔥</span>
                <span className="text-sm font-bold tracking-wide">
                  {stats.streak > 0 ? `${stats.streak} Ngày giữ lửa` : '0 Ngày giữ lửa'}
                </span>
              </div>

              {/* Sổ tay pill */}
              <div
                onClick={() => navigateTo('vocabulary')}
                className="flex-1 bg-[#FAF5EB] text-[#4E403B] py-2 px-3 rounded-2xl crayon-border-dashed flex items-center justify-center space-x-1.5 crayon-btn cursor-pointer"
              >
                <span className="text-base">📖</span>
                <span className="text-sm font-bold">Xem sổ tay</span>
              </div>

              {/* Profile button */}
              <button
                onClick={() => typeof window !== 'undefined' && window.toggleMobileProfileDropdown?.()}
                aria-label="Tài khoản"
                className="w-10 h-10 rounded-2xl border-2 border-[#382E2B] bg-[#FFFBF2] flex items-center justify-center text-[#382E2B] shadow-sm crayon-btn shrink-0"
              >
                <span className="text-base">🐯</span>
              </button>
            </div>
          </section>

          {/* Mascot Review Hero Card (Mobile) */}
          <section className="mb-5 text-center flex flex-col items-center justify-center relative select-none">
            <div className="inline-flex items-center space-x-2 bg-[#F5EFE0] px-3 py-1 rounded-full border border-[#D9CEBA] shadow-sm mb-1">
              <span className="text-[11px] font-bold text-[#86756C] uppercase tracking-wider">
                Lặp lại ngắt quãng SRS
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#DE5D53]"></span>
              <span className="text-xs text-[#DE5D53] font-bold">
                {stats.wordsDueCount || 0} từ cần ôn
              </span>
            </div>

            <div className="my-2 relative flex justify-center items-center">
              <img
                alt="Bé hổ mascot chibi"
                className="w-52 h-52 object-contain select-none transition-transform duration-300 hover:scale-105 filter drop-shadow-sm mix-blend-multiply"
                src={mascotImg}
              />
            </div>

            <div className="max-w-xs mx-auto space-y-1">
              <h2 className="text-2xl font-black text-[#382E2B] tracking-tight font-quicksand">
                {heroState === 'countdown' ? 'Lần ôn tập kế tiếp' : 'Đến giờ ôn tập rồi bạn ơi!'}
              </h2>
              <p className="text-sm text-[#6A5A50] font-medium leading-relaxed">
                {heroState === 'countdown' ? (
                  <span>
                    Nghỉ ngơi chút nhé! Quay lại sau:{' '}
                    <strong className="text-[#F0783C] font-bold">
                      {countdown?.hours || 0}g {countdown?.minutes || 0}p
                    </strong>
                  </span>
                ) : stats.wordsDueCount > 0 ? (
                  <span>
                    Bạn có{' '}
                    <strong className="text-[#F0783C] font-bold text-base">
                      {stats.wordsDueCount} từ vựng
                    </strong>{' '}
                    đang chờ được củng cố ✨
                  </span>
                ) : (
                  <span>Tuyệt vời! Bạn đã hoàn thành tất cả từ cần ôn hôm nay.</span>
                )}
              </p>
            </div>

            <div className="mt-3.5">
              <button
                onClick={handleStartReview}
                className="inline-flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#759864] hover:bg-[#6A8B5A] text-white text-base font-bold rounded-full border-[2.5px] border-[#382E2B] shadow-[2px_3px_0px_#382E2B] crayon-btn transition-transform active:scale-95"
              >
                <span className="w-5 h-5 rounded-full bg-[#FAF5EB] text-[#759864] text-xs flex items-center justify-center font-bold">
                  ▶
                </span>
                <span>Ôn tập ngay ({stats.wordsDueCount || 0} từ) ✏️</span>
              </button>
            </div>
          </section>

          {/* Memory Status SRS (Mobile) */}
          <section className="bg-[#FFFDF7] p-4 border-[2.5px] border-[#443833] rounded-[26px] shadow-[3px_4px_0px_#443833] relative overflow-hidden mb-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#DECDBB]">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-xl bg-[#E1EDDB] border border-[#8DAA68] flex items-center justify-center text-sm shadow-sm">
                  🔄
                </span>
                <h2 className="text-xl font-bold text-[#382E2B] tracking-wide font-quicksand">
                  Tổng quan SRS
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 text-xs font-bold text-[#382E2B] bg-[#EADDC7] rounded-full border border-dashed border-[#86756C]">
                  {stats.totalWordsCount || 0} từ
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 mb-2">
              <span className="text-[11px] font-bold tracking-wider text-[#8A796F] uppercase">
                Phân bố từ vựng theo cấp độ
              </span>
              <button
                onClick={() => navigateTo('vocabulary')}
                className="text-xs text-[#DE5D53] font-bold hover:underline flex items-center gap-0.5"
              >
                Chi tiết ➔
              </button>
            </div>

            <div className="pt-3 pb-2 flex items-end justify-between px-1 text-center">
              {[0, 1, 2, 3, 4, 5].map((lvl) => {
                const count = memoryLevels[`lv${lvl}`] || 0;
                const colors = [
                  'bg-[#96A0A8]',
                  'bg-[#F0783C]',
                  'bg-[#ECA43B]',
                  'bg-[#4CA9D6]',
                  'bg-[#A682BD]',
                  'bg-[#6EB882]',
                ];
                return (
                  <div
                    key={lvl}
                    onClick={() => handleLevelClick(lvl)}
                    className="flex flex-col items-center flex-1 cursor-pointer group"
                  >
                    <span className="text-sm font-bold text-[#382E2B]">{count}</span>
                    <div className="h-24 flex items-end justify-center w-full py-1">
                      <div
                        className={`w-5 ${colors[lvl]} border-2 border-[#382E2B] rounded-full relative shadow-sm transition-all group-hover:opacity-90`}
                        style={{ height: getBarHeight(count) }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-[#7A6B62] mt-1">
                      Lvl {lvl}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 pt-2.5 border-t border-dashed border-[#DECDBB] flex items-center justify-between text-xs text-[#827165]">
              <span className="font-medium">Chu kỳ SRS v4 thông minh</span>
              <span className="bg-[#FDEAE2] text-[#DE5D53] border border-[#F6C6C2] px-2.5 py-0.5 rounded-full font-bold">
                Cần ôn: {stats.wordsDueCount || 0} từ
              </span>
            </div>
          </section>

          {/* Exam Hall Card (Mobile) */}
          <section className="bg-white border-[3px] border-[#382E2B] rounded-[26px] p-4.5 mb-4 shadow-[2px_3px_0px_#382E2B]">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E6F3FB] border-2 border-[#382E2B] flex items-center justify-center text-2xl shrink-0 shadow-sm">
                🎓
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-1.5 mb-1">
                  <span className="text-[11px] font-bold text-[#2A7BA0] bg-[#E1F1FA] px-2.5 py-0.5 rounded-full border border-[#BCE1F5]">
                    PHÒNG THI TRỰC TUYẾN
                  </span>
                  <span className="text-[11px] font-bold text-[#826E5F] bg-[#F3ECE0] px-2 py-0.5 rounded-full border border-[#DED4C3]">
                    38+ Đề chuẩn CBT
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#382E2B] leading-snug font-quicksand">
                  Phòng Luyện Đề THPT Quốc Gia & IELTS
                </h3>
              </div>
            </div>
            <p className="text-xs text-[#6B5A4E] mt-2.5 leading-relaxed">
              Luyện trắc nghiệm tiếng Anh chuẩn cấu trúc đề thi chính thức mới nhất. Bấm giờ 50 phút thực tế, điều hướng tức thì và giải thích chi tiết.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-[#4E4138] font-bold">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs bg-[#EAF5E4] text-[#557A46] border border-[#8FB383] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  ✓
                </span>
                <span>Chuẩn ma trận BGD</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs bg-[#EAF5E4] text-[#557A46] border border-[#8FB383] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  ✓
                </span>
                <span>Bấm giờ tự động</span>
              </div>
            </div>
            <div className="mt-3.5">
              <button
                onClick={() => navigateTo('thpt-room')}
                className="w-full bg-[#382E2B] hover:bg-[#2A2220] text-white py-2.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 crayon-btn transition-colors"
              >
                <span>Vào phòng thi ngay</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">38 đề ➔</span>
              </button>
            </div>
          </section>

          {/* Streak Calendar Card (Mobile) */}
          <section className="bg-white border-[3px] border-[#382E2B] rounded-[26px] p-4.5 mb-4 shadow-[2px_3px_0px_#382E2B]">
            <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-[#E3D9C6]">
              <div className="flex items-center space-x-2">
                <span className="w-8 h-8 rounded-full bg-[#FEEFEA] border border-[#F8C8B8] flex items-center justify-center text-lg">
                  🔥
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#382E2B] font-quicksand">Lịch giữ lửa</h3>
                  <p className="text-[11px] text-[#7C6C62]">Mức độ chuyên cần ôn luyện mỗi ngày</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#E65F2B] bg-[#FDEAE2] px-2.5 py-1 rounded-full border border-[#F7BFAB]">
                {stats.streak || 0} ngày liên tiếp
              </span>
            </div>

            {/* Month Navigator */}
            <div className="flex items-center justify-between mt-3 mb-2 px-2 py-1.5 bg-[#FAF5EB] rounded-2xl border-2 border-[#382E2B]">
              <button onClick={prevMonth} className="text-sm font-bold text-[#382E2B] px-2 hover:opacity-75">
                ‹
              </button>
              <span className="text-sm font-bold text-[#382E2B] font-quicksand">
                {calendar.monthYear || 'Tháng này'}
              </span>
              <button onClick={nextMonth} className="text-sm font-bold text-[#382E2B] px-2 hover:opacity-75">
                ›
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 text-center text-xs font-bold text-[#86756C] mt-2 mb-1">
              <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
            </div>

            {/* Calendar Matrix */}
            <div className="space-y-1">
              {calendar.weeks.map((week, wIdx) => (
                <div key={wIdx} className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
                  {week.map((day, dIdx) => {
                    if (!day.date) {
                      return <span key={dIdx} className="py-1.5 opacity-0">0</span>;
                    }
                    const isToday = day.isToday;
                    const count = day.count || 0;
                    return (
                      <div
                        key={dIdx}
                        onClick={() => showDayDetail(day)}
                        className={`py-1.5 rounded-xl cursor-pointer transition-transform active:scale-95 ${
                          isToday
                            ? 'bg-[#E6F3FB] border-[2px] border-[#2A7BA0] text-[#1B5672] font-black shadow-xs'
                            : count > 0
                            ? 'bg-[#FCD8BE] border border-[#F0783C] text-[#933D0D] font-bold'
                            : 'border border-[#E3D9C8] text-[#9E8E84]'
                        }`}
                      >
                        {day.day}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Activity Legend & Counter */}
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
              <span className="bg-[#FAF5EB] border border-[#D9CDB8] text-[#69574C] px-2.5 py-1 rounded-full font-bold">
                Đã học: {calendar.activeDaysCount || 0} ngày
              </span>
              <span className="bg-[#FAF5EB] border border-[#D9CDB8] text-[#69574C] px-2.5 py-1 rounded-full font-bold">
                Tổng: {calendar.totalWordsLearned || 0} từ
              </span>
            </div>
          </section>

          {/* IELTS Target Goal Card (Mobile) */}
          <section className="bg-white border-[3px] border-[#382E2B] rounded-[26px] p-4.5 mb-6 text-center shadow-[2px_3px_0px_#382E2B]">
            <div className="w-11 h-11 mx-auto rounded-2xl bg-[#FDF0EE] border-2 border-[#382E2B] flex items-center justify-center text-xl mb-2 shadow-sm">
              🚩
            </div>
            <h3 className="text-base font-bold text-[#382E2B] font-quicksand">
              {ieltsGoal?.targetOverall ? `Mục tiêu IELTS ${ieltsGoal.targetOverall}` : 'Bạn chưa đặt mục tiêu IELTS'}
            </h3>
            <p className="text-xs text-[#6B5A4E] mt-1 max-w-xs mx-auto leading-relaxed">
              {ieltsGoal?.testDate
                ? `Còn ${ieltsGoal.daysRemaining || 0} ngày đến kỳ thi. Tiến độ từ vựng đạt ${ieltsGoal.progressPercent || 0}%.`
                : 'Thiết lập band điểm 4 kỹ năng và chọn ngày thi để đồng hồ đếm ngược tạo động lực học tập mỗi ngày.'}
            </p>
            <button
              onClick={handleOpenIELTSModal}
              className="mt-3.5 bg-[#FAF5EB] hover:bg-[#F2ECE0] text-[#382E2B] py-2 px-4 rounded-2xl text-xs font-bold border-2 border-[#382E2B] crayon-btn inline-flex items-center space-x-1.5 shadow-sm"
            >
              <span>🎯 Thiết lập mục tiêu ngay</span>
            </button>
          </section>

          {/* Mascot Signature Footer */}
          <footer className="text-center py-2 mb-4">
            <div className="w-8 h-8 mx-auto mb-1 text-[#8C7B71] text-lg select-none">🐾</div>
            <p className="text-xs text-[#8C7B71] font-medium italic">
              Trang 1 / {stats.totalWordsCount || 0} từ trong tập vẽ tranh sáp màu
            </p>
          </footer>
        </main>

        {/* Mobile Floating Action Button (Red Stamp) */}
        <div className="fixed bottom-20 right-5 z-40 max-w-[430px]">
          <button
            onClick={handleOpenAddWord}
            aria-label="Thêm từ vựng mới"
            className="w-13 h-13 p-3 bg-[#DE5D53] hover:bg-[#C84F45] text-white rounded-full border-[3px] border-[#382E2B] shadow-lg flex items-center justify-center crayon-btn transition-transform"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-[#FAF5EB]/95 backdrop-blur-md border-t-[3.5px] border-[#382E2B]"
          data-purpose="bottom-navigation"
        >
          <div className="w-full max-w-[430px] flex justify-around items-center py-2 px-2">
            {/* Tab 1: Trang chủ (Active) */}
            <div className="flex flex-col items-center cursor-pointer px-2 py-0.5">
              <div className="w-11 h-8 rounded-full border-2 border-[#577B4A] bg-[#EAF3E7] flex items-center justify-center text-[#3D5A32] shadow-sm">
                <span className="material-symbols-outlined text-[20px]">home</span>
              </div>
              <span className="text-[11px] font-bold text-[#3D5A32] mt-0.5">Trang chủ</span>
            </div>

            {/* Tab 2: Chủ đề */}
            <div
              onClick={() => navigateTo('topics')}
              className="flex flex-col items-center cursor-pointer px-2 py-0.5 text-[#736359] hover:text-[#382E2B]"
            >
              <div className="w-11 h-8 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">category</span>
              </div>
              <span className="text-[11px] font-bold mt-0.5">Chủ đề</span>
            </div>

            {/* Tab 3: Thư viện */}
            <div
              onClick={() => navigateTo('library')}
              className="flex flex-col items-center cursor-pointer px-2 py-0.5 text-[#736359] hover:text-[#382E2B]"
            >
              <div className="w-11 h-8 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">explore</span>
              </div>
              <span className="text-[11px] font-bold mt-0.5">Thư viện</span>
            </div>

            {/* Tab 4: Sổ từ */}
            <div
              onClick={() => navigateTo('vocabulary')}
              className="flex flex-col items-center cursor-pointer px-2 py-0.5 text-[#736359] hover:text-[#382E2B]"
            >
              <div className="w-11 h-8 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">bookmark</span>
              </div>
              <span className="text-[11px] font-bold mt-0.5">Sổ từ</span>
            </div>

            {/* Tab 5: Tra từ */}
            <div
              onClick={() => navigateTo('dictionary')}
              className="flex flex-col items-center cursor-pointer px-2 py-0.5 text-[#736359] hover:text-[#382E2B]"
            >
              <div className="w-11 h-8 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <span className="text-[11px] font-bold mt-0.5">Tra từ</span>
            </div>
          </div>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP LAYOUT (>= 1024px) - 100% FAITHFUL TO STITCH DESKTOP DESIGN   */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex w-full min-h-screen crayon-paper-desktop">
        {/* Main Content Area (Offset by existing App Sidebar on desktop) */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          {/* Desktop TopBar */}
          <header className="px-8 py-5 border-b-2 border-[#e6dcce] bg-[#fbf8f2]/90 backdrop-blur-sm sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#3d352e] font-quicksand">
                  Chào {userName}, bạn học ơi! 🌿
                </h1>
              </div>
              <p className="text-xs text-softMuted mt-0.5">
                Hôm nay là một ngày tuyệt vời để ghi nhớ thêm những từ vựng mới cùng bé hổ.
              </p>
            </div>

            {/* Search, Streak & Quick Actions */}
            <div className="flex items-center gap-3">
              {/* Search Bar with Crayon Feel */}
              <div className="relative w-64 lg:w-72">
                <input
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
                  placeholder="Tìm nhanh từ vựng, chủ đề..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-white rounded-full crayon-border focus:ring-2 focus:ring-[#5d8063] focus:outline-none transition-all placeholder:text-softMuted/70"
                />
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-softMuted text-[16px]">
                  search
                </span>
              </div>

              {/* Streak Badge */}
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-100 text-terracotta font-black text-xs crayon-border shadow-crayonSm">
                <span className="text-base animate-bounce">🔥</span>
                <span>{stats.streak || 0} ngày liên tiếp</span>
              </div>

              {/* Quick Action: Thêm từ mới */}
              <button
                onClick={handleOpenAddWord}
                className="bg-terracotta hover:bg-[#b85135] text-white font-bold text-xs px-4 py-2 rounded-full crayon-border shadow-crayonOrange active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Thêm từ mới</span>
              </button>
            </div>
          </header>

          {/* Desktop Body */}
          <main className="p-8 flex-1 max-w-[1536px] w-full mx-auto">
            <div className="grid grid-cols-12 gap-8 items-start">
              {/* Left Column (7 cols) */}
              <div className="col-span-12 xl:col-span-8 lg:col-span-7 space-y-7">
                {/* Hero Study Widget */}
                <section className="bg-[#fffdf9] rounded-3xl p-6 lg:p-7 crayon-border shadow-crayon relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
                    {/* Left text & SRS Action */}
                    <div className="space-y-4 max-w-md">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e9efe9] text-[#5d8063] border border-[#5d8063]/30 text-xs font-bold">
                        <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                        <span>Thuật toán ngắt quãng Spaced Repetition</span>
                      </div>

                      <h2 className="text-2xl lg:text-3xl font-black text-crayonText font-quicksand leading-tight">
                        {heroState === 'countdown' ? (
                          <>
                            Đã ôn xong hôm nay!<br />
                            <span className="text-[#5d8063]">Quay lại sau {countdown?.hours || 0}g {countdown?.minutes || 0}p.</span>
                          </>
                        ) : (
                          <>
                            Đến giờ ôn tập rồi!<br />
                            <span className="text-terracotta">{stats.wordsDueCount || 0} từ vựng</span> đang chờ bạn.
                          </>
                        )}
                      </h2>

                      {/* Mascot Speech Bubble */}
                      <div className="bg-cream/80 border-2 border-[#3d352e] rounded-2xl p-3.5 relative inline-block text-xs font-semibold text-crayonText">
                        <span className="font-bold text-terracotta">Bé Hổ nhắc:</span>{' '}
                        {stats.wordsDueCount > 0
                          ? `"Cùng bé hổ hoàn thành ${stats.wordsDueCount} từ hôm nay nhé! 🐾"`
                          : `"Bạn đã học rất chăm chỉ, bé hổ khen ngợi bạn nè! ⭐"`}
                        <div className="absolute -left-2 top-4 w-3 h-3 bg-cream border-l-2 border-b-2 border-crayonText rotate-45"></div>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button
                          onClick={handleStartReview}
                          className="bg-terracotta hover:bg-[#b85135] text-white text-sm font-black px-6 py-3 rounded-2xl crayon-border shadow-crayonOrange active:translate-y-1 transition-all flex items-center gap-2.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                          <span>Ôn tập ngay ({stats.wordsDueCount || 0} từ SRS)</span>
                        </button>
                        <span className="text-xs font-semibold text-softMuted">
                          Mất tầm ~{Math.max(3, Math.round((stats.wordsDueCount || 1) * 0.4))} phút
                        </span>
                      </div>
                    </div>

                    {/* Right Mascot Image */}
                    <div className="shrink-0 w-56 h-56 lg:w-64 lg:h-64 relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-amber-100/50 rounded-full filter blur-xl transform -rotate-6"></div>
                      <img
                        alt="Bé hổ mascot chibi ấm cúng"
                        className="w-full h-full object-contain relative z-10 mix-blend-multiply drop-shadow-sm transition-transform hover:scale-105 duration-300"
                        src={mascotImg}
                      />
                    </div>
                  </div>
                </section>

                {/* SRS Level Distribution (Desktop) */}
                <section className="bg-white rounded-3xl p-6 crayon-border shadow-crayonSm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-crayonText font-quicksand flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#5d8063]">bar_chart</span>
                        Phân bố từ vựng theo cấp độ SRS
                      </h3>
                      <p className="text-xs text-softMuted">
                        Theo dõi mức độ khắc sâu vào trí nhớ dài hạn của bạn
                      </p>
                    </div>
                    <span className="text-xs font-extrabold bg-[#f5ede0] px-3 py-1 rounded-full border border-crayonText/20">
                      Tổng cộng: {stats.totalWordsCount || 0} từ
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-3 pt-3">
                    {[
                      { lvl: 0, label: 'Cấp 0', sub: 'Mới học', color: 'bg-gray-200' },
                      { lvl: 1, label: 'Cấp 1', sub: 'Đang ôn', color: 'bg-terracotta' },
                      { lvl: 2, label: 'Cấp 2', sub: 'Quen dần', color: 'bg-warmAmber' },
                      { lvl: 3, label: 'Cấp 3', sub: 'Ghi nhớ', color: 'bg-softBlue' },
                      { lvl: 4, label: 'Cấp 4', sub: 'Vững vàng', color: 'bg-softPurple' },
                      { lvl: 5, label: 'Cấp 5', sub: 'Bậc thầy ⭐', color: 'bg-sage' },
                    ].map((item) => {
                      const count = memoryLevels[`lv${item.lvl}`] || 0;
                      return (
                        <div
                          key={item.lvl}
                          onClick={() => handleLevelClick(item.lvl)}
                          className="flex flex-col items-center bg-[#faf6f0] p-3 rounded-2xl border border-dashed border-gray-300 text-center cursor-pointer hover:border-terracotta transition-colors group"
                        >
                          <span className="text-[11px] font-bold text-softMuted uppercase tracking-wider">
                            {item.label}
                          </span>
                          <div className="w-full h-24 flex items-end justify-center my-2">
                            <div
                              className={`w-8 rounded-t-lg ${item.color} transition-all group-hover:opacity-90`}
                              style={{ height: getBarHeight(count) }}
                            />
                          </div>
                          <span className="text-sm font-black text-crayonText">{count}</span>
                          <span className="text-[10px] text-softMuted">{item.sub}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Exam Preparation Room Banner (Desktop) */}
                <section className="bg-gradient-to-r from-[#eef4ee] to-[#f7eee4] rounded-3xl p-6 crayon-border relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-sage text-white text-xs font-black uppercase">
                        HOT
                      </span>
                      <span className="text-xs font-bold text-softMuted">Mới cập nhật 2026</span>
                    </div>
                    <h3 className="text-xl font-black text-crayonText font-quicksand">
                      Phòng Luyện Đề THPT Quốc Gia & Thi Thử CBT
                    </h3>
                    <p className="text-xs text-softMuted max-w-md">
                      Kho ngân hàng 38+ đề thi chuẩn cấu trúc Bộ Giáo dục, tích hợp bộ đếm giờ tự động 50 phút và giải thích từ vựng chi tiết sau mỗi câu.
                    </p>
                    <div className="flex items-center gap-4 pt-1 text-xs font-bold text-crayonText">
                      <span className="flex items-center gap-1.5">⏱️ 50 phút</span>
                      <span className="flex items-center gap-1.5">📝 50 câu hỏi</span>
                      <span className="flex items-center gap-1.5">👥 1,420 bạn đang luyện</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigateTo('thpt-room')}
                    className="shrink-0 bg-sage hover:bg-sage-dark text-white font-black text-sm px-5 py-3 rounded-2xl crayon-border shadow-crayon active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Vào phòng thi ngay</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </section>
              </div>

              {/* Right Column (5 cols) */}
              <div className="col-span-12 xl:col-span-4 lg:col-span-5 space-y-7">
                {/* Streak Calendar Card (Desktop) */}
                <section className="bg-white rounded-3xl p-6 crayon-border shadow-crayonSm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-terracotta text-lg border border-orange-200">
                        🔥
                      </div>
                      <div>
                        <h3 className="text-base font-black text-crayonText font-quicksand">Lịch giữ lửa</h3>
                        <p className="text-[11px] text-softMuted">Mức độ chuyên cần ôn luyện mỗi ngày</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-terracotta bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                      {stats.streak || 0} ngày liên tiếp
                    </span>
                  </div>

                  {/* Month Navigator */}
                  <div className="flex items-center justify-between px-3 py-2 bg-[#fbf8f3] rounded-2xl crayon-border text-sm font-bold text-crayonText">
                    <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-softMuted">
                      ‹
                    </button>
                    <span className="font-quicksand font-extrabold">{calendar.monthYear}</span>
                    <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-softMuted">
                      ›
                    </button>
                  </div>

                  {/* Days of week */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-softMuted/80">
                    <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
                  </div>

                  {/* Days Grid */}
                  <div className="space-y-1">
                    {calendar.weeks.map((week, wIdx) => (
                      <div key={wIdx} className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-crayonText">
                        {week.map((day, dIdx) => {
                          if (!day.date) {
                            return <div key={dIdx}></div>;
                          }
                          const isToday = day.isToday;
                          const count = day.count || 0;
                          return (
                            <div
                              key={dIdx}
                              onClick={() => showDayDetail(day)}
                              className={`h-9 flex items-center justify-center rounded-xl cursor-pointer transition-transform active:scale-95 ${
                                isToday
                                  ? 'border-2 border-blue-600 font-black text-blue-700 bg-blue-50/50 shadow-xs'
                                  : count > 0
                                  ? 'bg-[#fae3d5] text-[#b4482b] font-black border border-orange-300'
                                  : 'bg-gray-50 text-gray-400'
                              }`}
                            >
                              {day.day}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Streak Legend */}
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
                      <div className="px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-bold text-crayonText">
                        Đã học: <span className="text-terracotta font-black">{calendar.activeDaysCount || 0} ngày</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-bold text-crayonText">
                        Tổng: <span className="text-terracotta font-black">{calendar.totalWordsLearned || 0} từ</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Target Goal Card (Desktop) */}
                <section className="bg-white rounded-3xl p-6 crayon-border shadow-crayonSm relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-black uppercase text-terracotta tracking-wider">
                        Lộ trình rèn luyện
                      </span>
                      <h3 className="text-lg font-black text-crayonText font-quicksand mt-0.5">
                        {ieltsGoal?.targetOverall ? `Mục tiêu IELTS ${ieltsGoal.targetOverall}` : 'Mục tiêu IELTS 7.0'}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center text-lg crayon-border">
                      🚩
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-crayonText">
                      <span>Tiến độ từ vựng cốt lõi</span>
                      <span>{ieltsGoal?.progressPercent || 38}%</span>
                    </div>
                    <div className="w-full bg-[#f1ebd9] rounded-full h-3.5 p-0.5 border border-crayonText">
                      <div
                        className="bg-terracotta h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ieltsGoal?.progressPercent || 38)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-softMuted pt-1">
                      <span>Đã đạt {ieltsGoal?.progressPercent || 38}% mục tiêu</span>
                      <span className="font-bold text-terracotta">
                        {ieltsGoal?.daysRemaining ? `Còn ${ieltsGoal.daysRemaining} ngày` : 'Chưa chọn ngày thi'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenIELTSModal}
                    className="mt-4 w-full py-2.5 text-center text-xs font-black rounded-xl bg-cream hover:bg-[#eadecb] text-crayonText crayon-border transition-all cursor-pointer"
                  >
                    + Tinh chỉnh band điểm mục tiêu
                  </button>
                </section>

                {/* Daily Flashcard Peek (Desktop) */}
                <section className="bg-[#fef9ef] rounded-3xl p-6 crayon-border relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-warmAmber uppercase tracking-wider flex items-center gap-1.5">
                      💡 Từ vựng ngẫu nhiên hôm nay
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-300">
                      {dailyWord.level}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-xl font-black text-crayonText font-quicksand">{dailyWord.word}</h4>
                      <button
                        onClick={() => handlePlayAudio(dailyWord.word)}
                        className="w-8 h-8 rounded-full bg-white hover:bg-amber-100 crayon-border flex items-center justify-center text-crayonText transition-all cursor-pointer"
                        title="Nghe phát âm"
                      >
                        <span className="material-symbols-outlined text-[16px]">volume_up</span>
                      </button>
                    </div>
                    <p className="text-xs font-bold text-softMuted">
                      {dailyWord.ipa} • <span className="italic font-normal">{dailyWord.pos}</span>
                    </p>
                    <p className="text-sm font-bold text-crayonText pt-1">{dailyWord.meaning}</p>
                    <div className="p-2.5 rounded-xl bg-white/70 border border-dashed border-amber-300 text-xs italic text-softMuted mt-2">
                      {dailyWord.example}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </main>

          {/* Desktop Footer */}
          <footer className="px-8 py-4 border-t-2 border-[#e6dcce] text-center text-xs text-softMuted bg-[#faf5eb] flex flex-wrap items-center justify-between gap-3">
            <p>© 2026 HiVocab! - Ứng dụng ghi nhớ từ vựng thông minh cho học sinh Việt Nam.</p>
            <div className="flex items-center gap-4 font-bold text-crayonText">
              <a href="/terms.html" className="hover:underline">Điều khoản</a>
              <a href="/privacy.html" className="hover:underline">Chính sách bảo mật</a>
              <span className="cursor-default select-none">Học cùng bé Hổ 🐯</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default PageDashboard;
