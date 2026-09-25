// Generated 1:1 Pixel-Perfect Component: PageLearning
import React from 'react';

export function PageLearning() {
  return (
    <>
<div id="page-learning" className="page">
<header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl px-4 md:px-gutter pb-3 md:py-md flex items-center justify-between shadow-sm mobile-sticky-top lg:pt-3">
<button id="learning-close-btn" onClick={(event) => { try { (function(event){ window.navigateTo('dashboard') }).call(this, event); } catch(e){ console.error(e); } }} className="text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-full cursor-pointer"><span className="material-symbols-outlined text-[20px] md:text-[24px]">close</span></button>
<div id="learning-progress-container" className="flex-1 max-w-md mx-4 md:mx-md flex items-center gap-md"><div className="w-full h-1.5 md:h-2 bg-surface-container-highest rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-500" id="learn-progress" style={{"width":"0%"}}></div></div></div>
<div className="flex items-center gap-2">
  <button onClick={(event) => { try { (function(event){ window.HiSound && window.HiSound.toggleMute() }).call(this, event); } catch(e){ console.error(e); } }} className="hi-sound-toggle-btn p-1.5 rounded-full hover:bg-surface-container text-primary transition-colors cursor-pointer" title="Tắt/Bật âm thanh học tập">
    <span className="material-symbols-outlined text-[20px] md:text-[22px]">volume_up</span>
  </button>
  <button onClick={(event) => { try { (function(event){ window.reportCurrentLearningError && window.reportCurrentLearningError() }).call(this, event); } catch(e){ console.error(e); } }} className="p-1.5 rounded-full hover:bg-red-50 text-on-surface-variant hover:text-red-600 transition-colors cursor-pointer" title="Báo lỗi bài tập/từ vựng này">
    <span className="material-symbols-outlined text-[20px] md:text-[22px]">flag</span>
  </button>
  <div id="learning-streak-container" className="flex items-center gap-1 text-[#FF5722]"><span className="font-bold text-xs md:text-sm">12</span><span className="material-symbols-outlined icon-fill text-[18px] md:text-[20px]" style={{"filter":"drop-shadow(0 2px 4px rgba(255,87,34,0.3))"}}>local_fire_department</span></div>
</div>
</header>

<main id="learning-main" className="pt-28 md:pt-[100px] pb-12 md:pb-xl px-4 sm:px-6 lg:px-12 max-w-3xl mx-auto flex flex-col gap-6 md:gap-10 items-center min-h-[100dvh]">
<div id="exercise-container" className="w-full max-w-2xl mx-auto flex flex-col items-center"></div>

{/* BÀI 1: Flashcard */}
<section id="exercise-0" className="exercise-step hidden w-full flex flex-col items-center gap-3 fade-in h-full">
<div className="text-on-surface-variant font-label-sm text-[10px] md:text-xs uppercase tracking-widest opacity-60">Bài tập: Thẻ ghi nhớ</div>
<div className="flashcard-scene w-full max-w-xl mx-auto">
<div id="flashcard" className="flashcard-3d-card" onClick={(event) => { try { (function(event){ window.flipCard() }).call(this, event); } catch(e){ console.error(e); } }}>
<div className="flashcard-sheen"></div>
<div id="card-front" className="flashcard-face flashcard-front">
<div className="flex items-center justify-between w-full">
<span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Dịch sang tiếng Anh</span>
<span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-on-surface-variant bg-surface-container-high/80 px-2.5 py-1 rounded-full"><span className="material-symbols-outlined text-[14px]">touch_app</span> Chạm để lật</span>
</div>
<div className="my-auto text-center py-4 flex flex-col items-center justify-center">
<h2 className="font-bold text-on-surface text-3xl sm:text-4xl md:text-5xl leading-tight">Trùng hợp</h2>
</div>
<div className="flex justify-center w-full">
<button className="flashcard-flip-pill bg-primary text-on-primary px-6 py-2.5 md:px-8 md:py-3 rounded-full text-xs md:text-sm font-bold tracking-wide flex items-center gap-2 shadow-sm pointer-events-none"><span className="material-symbols-outlined text-[18px]">visibility</span> Nhấn xem đáp án</button>
</div>
</div>
<div id="card-back" className="flashcard-face flashcard-back">
<div className="flex items-center justify-between w-full">
<span className="text-primary font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-primary">check_circle</span> Đáp án</span>
<span className="text-on-surface-variant text-xs">Mặt sau</span>
</div>
<div className="my-auto text-center py-2 flex flex-col items-center justify-center">
<div className="flex items-center justify-center gap-3 mb-1">
<h2 className="font-bold text-primary text-3xl sm:text-4xl text-center">Coincidence</h2>
<button onClick={(event) => { try { (function(event){ event.stopPropagation(); window.HiSpeak && window.HiSpeak('Coincidence') }).call(this, event); } catch(e){ console.error(e); } }} title="Nghe phát âm" className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"><span className="material-symbols-outlined text-[22px]">volume_up</span></button>
</div>
<p className="text-on-surface-variant mb-3 font-mono text-sm md:text-base">/koʊˈɪn.sɪ.dəns/</p>
</div>
<div className="flex w-full flex-row justify-center gap-2 md:gap-3">
<button onClick={(event) => { try { (function(event){ event.stopPropagation(); window.rateCard('hard'); window.handleExerciseComplete(); }).call(this, event); } catch(e){ console.error(e); } }} className="flex-1 px-4 py-3 md:px-8 md:py-3 rounded-xl md:rounded-full text-xs md:text-sm font-bold bg-tertiary-fixed text-on-tertiary-fixed">Khó</button>
<button onClick={(event) => { try { (function(event){ event.stopPropagation(); window.rateCard('good'); window.handleExerciseComplete(); }).call(this, event); } catch(e){ console.error(e); } }} className="flex-1 px-4 py-3 md:px-8 md:py-3 rounded-xl md:rounded-full text-xs md:text-sm font-bold bg-secondary-container text-on-secondary-container">Tốt</button>
<button onClick={(event) => { try { (function(event){ event.stopPropagation(); window.rateCard('easy'); window.handleExerciseComplete(); }).call(this, event); } catch(e){ console.error(e); } }} className="flex-1 px-4 py-3 md:px-8 md:py-3 rounded-xl md:rounded-full text-xs md:text-sm font-bold bg-primary text-on-primary">Dễ</button>
</div>
</div>
</div>
</div>
</section>

{/* BÀI 2: Trắc nghiệm */}
<section id="exercise-1" className="exercise-step hidden w-full flex flex-col items-center gap-3 fade-in h-full">
<div className="text-on-surface-variant font-label-sm text-[10px] md:text-xs uppercase tracking-widest opacity-60">Bài tập: Trắc nghiệm</div>
<div className="w-full bg-surface-container-lowest/80 backdrop-blur-[24px] border border-outline-variant/30 rounded-2xl soft-shadow p-6 md:p-8 flex flex-col">
<div className="text-center mb-6 md:mb-10"><span className="text-on-surface-variant text-xs md:text-sm block mb-2">Chọn bản dịch chính xác</span><h2 className="font-bold text-on-surface text-2xl md:text-3xl">Làm thế nào để nói "Serendipity"?</h2></div>
<div className="flex flex-col gap-3" id="mcq-options">
<button onClick={(event) => { try { (function(event){ window.selectMCQ(this) }).call(this, event); } catch(e){ console.error(e); } }} className="mcq-opt w-full text-left p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest flex items-center justify-between"><span className="text-sm md:text-base font-medium text-on-surface">Sự tình cờ</span><span className="material-symbols-outlined text-outline-variant">radio_button_unchecked</span></button>
<button onClick={(event) => { try { (function(event){ window.selectMCQ(this) }).call(this, event); } catch(e){ console.error(e); } }} className="mcq-opt w-full text-left p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest flex items-center justify-between"><span className="text-sm md:text-base font-medium text-on-surface">Cơ duyên</span><span className="material-symbols-outlined text-outline-variant">radio_button_unchecked</span></button>
<button onClick={(event) => { try { (function(event){ window.selectMCQ(this) }).call(this, event); } catch(e){ console.error(e); } }} className="mcq-opt w-full text-left p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest flex items-center justify-between"><span className="text-sm md:text-base font-medium text-on-surface">Định mệnh</span><span className="material-symbols-outlined text-outline-variant">radio_button_unchecked</span></button>
</div>
<div className="mt-6 md:mt-10 flex w-full"><button id="mcq-check" onClick={(event) => { try { (function(event){ window.handleExerciseComplete() }).call(this, event); } catch(e){ console.error(e); } }} className="w-full bg-surface-variant text-on-surface-variant px-6 py-3.5 rounded-xl md:rounded-full font-bold text-sm cursor-not-allowed opacity-50" disabled>Kiểm tra</button></div>
</div>
</section>

{/* BÀI 3: Điền từ */}
<section id="exercise-2" className="exercise-step hidden w-full flex flex-col items-center gap-3 fade-in h-full">
<div className="text-on-surface-variant font-label-sm text-[10px] md:text-xs uppercase tracking-widest opacity-60">Bài tập: Điền vào chỗ trống</div>
<div className="w-full bg-surface-container-lowest/80 backdrop-blur-[24px] border border-outline-variant/30 rounded-2xl soft-shadow p-5 md:p-8 flex flex-col items-center min-h-[300px] justify-center">
<div className="text-center mb-6 w-full">
    <p className="text-base md:text-xl text-on-surface leading-relaxed mx-auto">Finding that rare book at a small garage sale was an act of pure <span className="inline-block w-12 border-b border-outline-variant align-bottom"></span>.</p>
    <button onClick={(event) => { try { (function(event){ window.getAIHint() }).call(this, event); } catch(e){ console.error(e); } }} className="mt-4 text-primary font-bold text-xs md:text-sm flex items-center justify-center gap-1 hover:bg-primary-container/10 px-3 py-2 rounded-lg mx-auto w-max"><span className="material-symbols-outlined text-[16px]">lightbulb</span> Xin gợi ý AI</button>
    <div id="ai-hint-container" className="mt-3 text-xs md:text-sm text-on-surface-variant hidden bg-surface-container-low p-3 rounded-lg border border-outline-variant/30 w-full text-left"></div>
</div>
<div className="flex gap-y-3 gap-x-1 md:gap-x-2 justify-center flex-wrap max-w-full items-end overflow-hidden" id="fill-boxes" style={{"--fill-max-word-len":"11"}}>
<input type="text" maxLength="1" className="fill-input w-[clamp(1.45rem,calc((100vw-3.5rem)/var(--fill-max-word-len,10)),2rem)] h-10 sm:w-12 sm:h-14 bg-[#F5F5F5] rounded-t border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-center font-bold text-base sm:text-2xl text-on-surface uppercase outline-none px-0" />
<input type="text" maxLength="1" className="fill-input w-[clamp(1.45rem,calc((100vw-3.5rem)/var(--fill-max-word-len,10)),2rem)] h-10 sm:w-12 sm:h-14 bg-[#F5F5F5] rounded-t border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-center font-bold text-base sm:text-2xl text-on-surface uppercase outline-none px-0" />
<input type="text" maxLength="1" className="fill-input w-[clamp(1.45rem,calc((100vw-3.5rem)/var(--fill-max-word-len,10)),2rem)] h-10 sm:w-12 sm:h-14 bg-[#F5F5F5] rounded-t border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-center font-bold text-base sm:text-2xl text-on-surface uppercase outline-none px-0" />
<input type="text" maxLength="1" className="fill-input w-[clamp(1.45rem,calc((100vw-3.5rem)/var(--fill-max-word-len,10)),2rem)] h-10 sm:w-12 sm:h-14 bg-[#F5F5F5] rounded-t border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-center font-bold text-base sm:text-2xl text-on-surface uppercase outline-none px-0" />
<input type="text" maxLength="1" className="fill-input w-[clamp(1.45rem,calc((100vw-3.5rem)/var(--fill-max-word-len,10)),2rem)] h-10 sm:w-12 sm:h-14 bg-[#F5F5F5] rounded-t border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-center font-bold text-base sm:text-2xl text-on-surface uppercase outline-none px-0" />
<input type="text" maxLength="1" className="fill-input w-[clamp(1.45rem,calc((100vw-3.5rem)/var(--fill-max-word-len,10)),2rem)] h-10 sm:w-12 sm:h-14 bg-[#F5F5F5] rounded-t border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-center font-bold text-base sm:text-2xl text-on-surface uppercase outline-none px-0" />
<input type="text" maxLength="1" className="fill-input w-[clamp(1.45rem,calc((100vw-3.5rem)/var(--fill-max-word-len,10)),2rem)] h-10 sm:w-12 sm:h-14 bg-[#F5F5F5] rounded-t border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-center font-bold text-base sm:text-2xl text-on-surface uppercase outline-none px-0" />
<input type="text" maxLength="1" className="fill-input w-[clamp(1.45rem,calc((100vw-3.5rem)/var(--fill-max-word-len,10)),2rem)] h-10 sm:w-12 sm:h-14 bg-[#F5F5F5] rounded-t border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-center font-bold text-base sm:text-2xl text-on-surface uppercase outline-none px-0" />
<input type="text" maxLength="1" className="fill-input w-[clamp(1.45rem,calc((100vw-3.5rem)/var(--fill-max-word-len,10)),2rem)] h-10 sm:w-12 sm:h-14 bg-[#F5F5F5] rounded-t border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-center font-bold text-base sm:text-2xl text-on-surface uppercase outline-none px-0" />
<input type="text" maxLength="1" className="fill-input w-[clamp(1.45rem,calc((100vw-3.5rem)/var(--fill-max-word-len,10)),2rem)] h-10 sm:w-12 sm:h-14 bg-[#F5F5F5] rounded-t border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-center font-bold text-base sm:text-2xl text-on-surface uppercase outline-none px-0" />
<input type="text" maxLength="1" className="fill-input w-[clamp(1.45rem,calc((100vw-3.5rem)/var(--fill-max-word-len,10)),2rem)] h-10 sm:w-12 sm:h-14 bg-[#F5F5F5] rounded-t border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-center font-bold text-base sm:text-2xl text-on-surface uppercase outline-none px-0" />
</div>
<div className="mt-8 w-full"><button onClick={(event) => { try { (function(event){ window.checkFillInBlank() }).call(this, event); } catch(e){ console.error(e); } }} className="w-full bg-primary text-on-primary px-6 py-3.5 rounded-xl md:rounded-full font-bold text-sm hover:bg-surface-tint transition-colors">Kiểm tra</button></div>
</div>
</section>

{/* BÀI 4: Nghe và Viết */}
<section id="exercise-3" className="exercise-step hidden w-full flex flex-col items-center gap-3 fade-in h-full">
<div className="text-on-surface-variant font-label-sm text-[10px] md:text-xs uppercase tracking-widest opacity-60">Bài tập: Luyện nghe</div>
<div className="w-full bg-surface-container-lowest/80 backdrop-blur-[24px] border border-outline-variant/30 rounded-2xl soft-shadow p-6 md:p-8 flex flex-col items-center min-h-[360px] md:min-h-[400px] justify-center">
<span className="text-on-surface-variant text-sm md:text-base mb-6 md:mb-10 block text-center">Nhập những gì bạn nghe được</span>
<button className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_8px_24px_rgba(0,129,192,0.3)] hover:scale-105 active:scale-95 transition-all mb-6 md:mb-10 group">
    <span className="material-symbols-outlined icon-fill text-[40px] md:text-[48px] ml-1 md:ml-2 group-hover:text-primary-fixed">play_arrow</span>
</button>
<div className="w-full max-w-md relative mb-6 md:mb-10">
    <input className="w-full bg-[#F5F5F5] border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 rounded-t-lg px-4 md:px-6 py-3 md:py-4 font-body-lg text-center text-on-surface placeholder:text-outline-variant/70 transition-colors" placeholder="Nhập cụm từ bằng tiếng Anh" type="text"/>
    <div className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2">
        <button className="text-outline-variant hover:text-primary p-2 transition-colors rounded-full"><span className="material-symbols-outlined text-[18px] md:text-[20px]">speed</span></button>
    </div>
</div>
<div className="flex justify-end w-full max-w-md">
    <button onClick={(event) => { try { (function(event){ window.handleExerciseComplete() }).call(this, event); } catch(e){ console.error(e); } }} className="w-full bg-primary text-on-primary px-6 py-3.5 md:px-8 md:py-3 rounded-xl md:rounded-full font-bold text-sm hover:bg-surface-tint transition-colors">Hoàn thành bài nghe</button>
</div>
</div>
</section>

{/* HOÀN THÀNH */}
<section id="exercise-completed" className="exercise-step hidden w-full flex flex-col items-center gap-4 mt-8 fade-in text-center px-4">
<div className="w-20 h-20 md:w-24 md:h-24 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-2 shadow-lg">
    <span className="material-symbols-outlined text-[48px] md:text-[56px] icon-fill">check_circle</span>
</div>
<h2 id="complete-title" className="text-2xl md:text-4xl font-bold text-on-surface tracking-tight">Xuất sắc!</h2>
<p id="complete-message" className="text-on-surface-variant text-sm md:text-lg mb-6">Bạn đã hoàn thành phiên ôn tập hôm nay.</p>
<button id="complete-btn" onClick={(event) => { try { (function(event){ window.navigateTo('dashboard') }).call(this, event); } catch(e){ console.error(e); } }} className="w-full md:w-auto bg-primary text-on-primary px-8 py-3.5 rounded-xl md:rounded-full font-bold shadow-md hover:-translate-y-1 transition-transform">Về Trang chủ</button>
</section>

</main>
</div>
    </>
  );
}

export default PageLearning;
