// Generated 1:1 Pixel-Perfect Modals
import React from 'react';

export function Modals() {
  return (
    <>
{/* ==================== MODAL: XÁC NHẬN NỘP BÀI THPT ==================== */}
<div id="modal-exam-confirm-submit" className="fixed inset-0 z-[9999] hidden items-center justify-center p-4" style={{"background":"rgba(0,0,0,0.65)","backdropFilter":"blur(4px)"}}>
  <div className="w-full max-w-md bg-surface rounded-2xl p-6 soft-shadow space-y-4 fade-in">
    <div className="flex items-center gap-3 text-amber-600">
      <span className="material-symbols-outlined text-[32px]">help</span>
      <h3 className="text-lg font-bold text-on-surface">Xác nhận nộp bài</h3>
    </div>
    <div id="exam-confirm-submit-msg" className="text-sm text-on-surface-variant leading-relaxed">
      Bạn có chắc chắn muốn nộp bài thi?
    </div>
    <div className="flex items-center justify-end gap-3 pt-2">
      <button onClick={(event) => { try { (function(event){ window.ThptExam.closeSubmitConfirmModal() }).call(this, event); } catch(e){ console.error(e); } }} className="px-4 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer">
        Tiếp tục làm bài
      </button>
      <button onClick={(event) => { try { (function(event){ window.ThptExam.submitExam(false) }).call(this, event); } catch(e){ console.error(e); } }} className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer">
        Nộp bài ngay
      </button>
    </div>
  </div>
</div>

{/* ==================== MODAL: KẾT QUẢ BÀI THI THPT ==================== */}
<div id="modal-exam-result" className="fixed inset-0 z-[9999] hidden items-center justify-center p-4" style={{"background":"rgba(0,0,0,0.7)","backdropFilter":"blur(6px)"}}>
  <div className="w-full max-w-lg bg-surface rounded-3xl p-6 md:p-8 soft-shadow space-y-6 fade-in max-h-[95vh] overflow-y-auto">
    <div className="text-center space-y-2">
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
        <span className="material-symbols-outlined text-[36px]">military_tech</span>
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-on-surface">Kết Quả Bài Thi</h2>
      <p id="res-exam-title" className="text-xs text-on-surface-variant font-medium line-clamp-1"></p>
    </div>

    {/* Điểm số chính */}
    <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 text-center space-y-1">
      <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Điểm số đạt được</div>
      <div className="text-5xl font-black text-primary tracking-tight" id="res-score">0.00</div>
      <div className="text-xs text-slate-500 font-medium">Thang điểm 10 chuẩn THPT Quốc Gia</div>
    </div>

    {/* Thống kê chi tiết */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
        <div className="text-[11px] text-emerald-700 font-bold">Số câu đúng</div>
        <div id="res-correct-count" className="text-base font-black text-emerald-800 mt-0.5">0 / 40</div>
      </div>
      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
        <div className="text-[11px] text-rose-700 font-bold">Số câu sai</div>
        <div id="res-wrong-count" className="text-base font-black text-rose-800 mt-0.5">0</div>
      </div>
      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
        <div className="text-[11px] text-blue-700 font-bold">Tỷ lệ đúng</div>
        <div id="res-pct" className="text-base font-black text-blue-800 mt-0.5">0%</div>
      </div>
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
        <div className="text-[11px] text-amber-700 font-bold">Thời gian làm</div>
        <div id="res-time-spent" className="text-base font-black text-amber-800 mt-0.5">0p 0s</div>
      </div>
    </div>

    {/* Nút hành động */}
    <div className="flex flex-col sm:flex-row gap-3 pt-2">
      <button onClick={(event) => { try { (function(event){ window.ThptExam.enterReviewMode() }).call(this, event); } catch(e){ console.error(e); } }} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer">
        <span className="material-symbols-outlined text-[18px]">visibility</span>
        <span>Xem Đáp Án &amp; Lời Giải</span>
      </button>
      <button onClick={(event) => { try { (function(event){ window.ThptExam.retakeExam() }).call(this, event); } catch(e){ console.error(e); } }} className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer">
        <span className="material-symbols-outlined text-[18px]">replay</span>
        <span>Làm Lại Đề Này</span>
      </button>
      <button onClick={(event) => { try { (function(event){ window.ThptExam.exitRoom() }).call(this, event); } catch(e){ console.error(e); } }} className="sm:w-auto px-4 py-3 rounded-xl border border-outline-variant/40 text-on-surface-variant font-bold text-xs hover:bg-surface-container-high transition-colors cursor-pointer">
        Trở Về
      </button>
    </div>
  </div>
</div>

{/* ==================== MODAL: TÙY CHỈNH THỜI GIAN THI ==================== */}
<div id="modal-custom-exam-time" className="fixed inset-0 z-[9999] hidden items-center justify-center p-4" style={{"background":"rgba(0,0,0,0.65)","backdropFilter":"blur(4px)"}}>
  <div className="w-full max-w-sm bg-surface rounded-2xl p-6 soft-shadow space-y-4 fade-in">
    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">timer</span>
        <h3 className="text-base font-bold text-on-surface">Tùy chỉnh thời gian thi</h3>
      </div>
      <button onClick={(event) => { try { (function(event){ window.ThptExam.closeCustomTimeModal() }).call(this, event); } catch(e){ console.error(e); } }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>
    <div className="space-y-2.5">
      <label className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/30 hover:bg-surface-container cursor-pointer transition-colors">
        <input type="radio" name="custom-exam-time" value="30" className="accent-primary" />
        <span className="text-xs font-bold text-on-surface">30 phút (Luyện tốc độ cao)</span>
      </label>
      <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary bg-primary/5 cursor-pointer transition-colors">
        <input type="radio" name="custom-exam-time" value="50" checked className="accent-primary" />
        <span className="text-xs font-bold text-primary">50 phút (Tiêu chuẩn Bộ GD&amp;ĐT)</span>
      </label>
      <label className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/30 hover:bg-surface-container cursor-pointer transition-colors">
        <input type="radio" name="custom-exam-time" value="60" className="accent-primary" />
        <span className="text-xs font-bold text-on-surface">60 phút (Luyện tập thư thả)</span>
      </label>
      <label className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/30 hover:bg-surface-container cursor-pointer transition-colors">
        <input type="radio" name="custom-exam-time" value="0" className="accent-primary" />
        <span className="text-xs font-bold text-on-surface">Không giới hạn thời gian</span>
      </label>
    </div>
    <div className="flex items-center justify-end gap-2 pt-2">
      <button onClick={(event) => { try { (function(event){ window.ThptExam.closeCustomTimeModal() }).call(this, event); } catch(e){ console.error(e); } }} className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer">
        Hủy
      </button>
      <button onClick={(event) => { try { (function(event){ window.ThptExam.submitCustomTime() }).call(this, event); } catch(e){ console.error(e); } }} className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-dark transition-colors cursor-pointer">
        Bắt Đầu Thi
      </button>
    </div>
  </div>
</div>

{/* ==================== MODAL: BÁO CÁO LỖI TOÀN DIỆN (BUG REPORT) ==================== */}
<div id="modal-bug-report" className="fixed inset-0 z-[10000] hidden items-center justify-center p-4" style={{"background":"rgba(0,0,0,0.65)","backdropFilter":"blur(6px)"}}>
  <div className="w-full max-w-md bg-surface rounded-3xl p-6 sm:p-7 soft-shadow space-y-4 fade-in border border-outline-variant/30 text-on-surface">
    {/* Header */}
    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
      <div className="flex items-center gap-2.5 text-red-600">
        <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
          <span className="material-symbols-outlined text-[20px]">flag</span>
        </div>
        <div>
          <h3 className="text-base font-bold text-on-surface leading-tight">Báo cáo Lỗi &amp; Góp ý</h3>
          <p className="text-[11px] text-on-surface-variant font-medium">HiVocab Support Team</p>
        </div>
      </div>
      <button type="button" onClick={(event) => { try { (function(event){ window.closeBugReportModal() }).call(this, event); } catch(e){ console.error(e); } }} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-surface-container cursor-pointer transition-colors">
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>

    {/* Context Preview Chip */}
    <div id="bug-report-context-chip" className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 text-xs">
      <span className="material-symbols-outlined text-primary text-[16px]">info</span>
      <span id="bug-report-context-label" className="font-semibold text-on-surface truncate">Đang ghi nhận từ phiên học</span>
    </div>

    {/* Form */}
    <form id="bug-report-form" onSubmit={(event) => { try { (function(event){ window.submitBugReportForm(event) }).call(this, event); } catch(e){ console.error(e); } }} className="space-y-3.5">
      <input  type="hidden" id="bug-report-feature" value="general" />
      <input  type="hidden" id="bug-report-context-json" value="{}" />

      <div>
        <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Loại vấn đề</label>
        <select id="bug-report-type" className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <option value="wrong_answer">Sai đáp án / Kết quả không chính xác</option>
          <option value="exam_question">Lỗi câu hỏi trong Đề thi THPT</option>
          <option value="typo">Lỗi chính tả / Ngữ pháp / Dịch thuật</option>
          <option value="audio">Lỗi phát âm / Âm thanh</option>
          <option value="ui_bug">Lỗi hiển thị / Giao diện / Nút bấm</option>
          <option value="other">Góp ý cải tiến / Phản hồi khác</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Mô tả chi tiết</label>
        <textarea id="bug-report-content" rows="3" required
                  placeholder="Vui lòng mô tả chi tiết lỗi bạn gặp phải hoặc đáp án bạn cho là chính xác..."
                  className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder:text-outline font-medium"></textarea>
      </div>

      {/* Auto capture note */}
      <div className="flex items-center gap-2 text-[11px] text-outline">
        <span className="material-symbols-outlined text-[14px]">devices</span>
        <span>Hệ thống tự động đính kèm thiết bị, trình duyệt và URL.</span>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={(event) => { try { (function(event){ window.closeBugReportModal() }).call(this, event); } catch(e){ console.error(e); } }} className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer">
          Hủy
        </button>
        <button type="submit" id="btn-submit-bug-report" className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-[16px]">send</span>
          <span>Gửi Báo Cáo</span>
        </button>
      </div>
    </form>
  </div>
</div>

{/* ==================== MODAL: BỘ CHỌN ĐÍCH LƯU PHÂN CẤP (FOLDER -> TOPIC -> TEST -> PASSAGE) ==================== */}
<div id="modal-topic-picker" className="fixed inset-0 z-[10000] hidden items-center justify-center p-3 sm:p-4" style={{"background":"rgba(0,0,0,0.6)","backdropFilter":"blur(6px)"}}>
  <div className="w-full max-w-md bg-surface rounded-3xl soft-shadow fade-in overflow-hidden border border-outline-variant/30 flex flex-col max-h-[85vh]">
    
    {/* Header */}
    <div className="px-5 py-4 border-b border-outline-variant/15 flex items-center justify-between shrink-0 bg-surface-container-lowest/60">
      <div className="flex items-center gap-2.5 min-w-0">
        <button type="button" id="topic-picker-back-btn" onClick={(event) => { try { (function(event){ window.topicPickerGoBack() }).call(this, event); } catch(e){ console.error(e); } }} 
                className="hidden p-1.5 -ml-1.5 rounded-xl text-outline hover:text-primary hover:bg-surface-container transition-colors items-center gap-1 cursor-pointer">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span id="topic-picker-back-label" className="text-xs font-semibold">Quay lại</span>
        </button>
        <div className="min-w-0">
          <h3 id="topic-picker-title" className="text-base font-bold text-on-surface leading-tight truncate">Chọn thư mục</h3>
          <p id="topic-picker-subtitle" className="text-[11px] text-outline truncate mt-0.5">Chọn vị trí lưu từ vựng</p>
        </div>
      </div>
      <button type="button" onClick={(event) => { try { (function(event){ window.closeTopicPicker() }).call(this, event); } catch(e){ console.error(e); } }} className="w-8 h-8 flex items-center justify-center rounded-full text-outline hover:bg-surface-container transition-colors cursor-pointer shrink-0 ml-2">
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>

    {/* Body Views */}
    <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar">
      {/* Status message (loading / error) */}
      <div id="topic-picker-status" className="hidden text-xs py-2 px-3 mb-3 rounded-xl bg-primary/10 text-primary font-medium text-center"></div>

      {/* Step 1: Folder view */}
      <div id="topic-picker-step-folder" className="space-y-2">
        <div id="topic-picker-folder-list" className="space-y-1.5">
          {/* Rendered dynamically */}
        </div>
      </div>

      {/* Step 2: Topic view */}
      <div id="topic-picker-step-topic" className="hidden space-y-2">
        <div id="topic-picker-topic-list" className="space-y-1.5">
          {/* Rendered dynamically */}
        </div>
      </div>

      {/* Step 3: Test view */}
      <div id="topic-picker-step-test" className="hidden space-y-2">
        <div id="topic-picker-test-list" className="space-y-1.5">
          {/* Rendered dynamically */}
        </div>
      </div>

      {/* Step 4: Passage view */}
      <div id="topic-picker-step-passage" className="hidden space-y-2">
        <div id="topic-picker-passage-list" className="space-y-1.5">
          {/* Rendered dynamically */}
        </div>
      </div>
    </div>

    {/* Footer note */}
    <div className="px-5 py-2.5 bg-surface-container-lowest/40 border-t border-outline-variant/10 text-[11px] text-outline text-center">
      <span>Nhấp vào thư mục / bài học để chọn</span>
    </div>

  </div>
</div>

{/* ==================== MODAL: THÊM TỪ VỰNG TRỰC TIẾP (KÈM AI AUTO-FILL) ==================== */}
<div id="modal-add-word" className="fixed inset-0 z-[9999] hidden items-center justify-center p-4" style={{"background":"rgba(0,0,0,0.55)","backdropFilter":"blur(6px)"}}>
  <div className="w-full max-w-lg bg-surface rounded-3xl soft-shadow fade-in overflow-hidden border border-outline-variant/30 flex flex-col max-h-[90vh]">
    
    {/* Modal Header */}
    <div className="px-6 py-5 border-b border-outline-variant/15 flex items-center justify-between shrink-0 bg-surface-container-lowest/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
          <span className="material-symbols-outlined text-[22px]">post_add</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-on-surface leading-tight">Thêm từ vựng mới</h2>
          <div id="add-word-topic-badge" className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="material-symbols-outlined text-[14px] text-primary">folder</span>
            <span id="add-word-topic-name" className="font-medium truncate max-w-[220px]">Chủ đề hiện tại</span>
            <button type="button" onClick={(event) => { try { (function(event){ window.openTopicPickerForSingleAdd() }).call(this, event); } catch(e){ console.error(e); } }} className="text-[10px] text-primary font-bold hover:underline cursor-pointer bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full transition-colors">
              Đổi chủ đề
            </button>
          </div>
        </div>
      </div>
      <button onClick={(event) => { try { (function(event){ window.closeAddWordModal() }).call(this, event); } catch(e){ console.error(e); } }} className="w-9 h-9 flex items-center justify-center rounded-full text-outline hover:bg-surface-container-low transition-colors cursor-pointer">
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>

    <form id="form-add-word" onSubmit={(event) => { try { (function(event){ window.submitAddWord(event) }).call(this, event); } catch(e){ console.error(e); } }} className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
      {/* Destination Card: Thư mục / Chủ đề / Test / Passage */}
      <div id="add-word-destination-section" className="hidden">
        <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
          Lưu vào Chủ đề / Bài học <span className="text-rose-500">*</span>
        </label>
        <button type="button" id="add-word-destination-card" onClick={(event) => { try { (function(event){ window.openTopicPickerForSingleAdd() }).call(this, event); } catch(e){ console.error(e); } }}
                className="w-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-primary/50 rounded-2xl p-3 text-left flex items-center justify-between transition-all group cursor-pointer">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]" id="add-word-destination-icon">folder</span>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-outline font-medium" id="add-word-destination-path">Thư mục / Chủ đề</div>
              <div className="text-sm font-bold text-on-surface truncate" id="add-word-destination-title">Bấm để chọn nơi lưu từ...</div>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[20px] shrink-0 ml-2">navigate_next</span>
        </button>
      </div>

      {/* Exam Test & Passage Selector (dành riêng cho bộ Cambridge và IELTS Actual Tests Vol) */}
      <div id="add-word-exam-section" className="hidden p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/25 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-outline uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">quiz</span>
            <span>Vị trí trong đề thi</span>
          </label>
          <span id="add-word-exam-badge-text" className="text-[11px] text-primary font-semibold truncate max-w-[200px]">Test &amp; Passage</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="add-word-test-select" className="block text-[11px] font-medium text-outline mb-1">Chọn bài Test <span className="text-rose-500">*</span></label>
            <select id="add-word-test-select" onChange={(event) => { try { (function(event){ window.onAddWordTestChange(this.value) }).call(this, event); } catch(e){ console.error(e); } }}
                    className="w-full bg-surface border border-outline-variant/30 focus:border-primary rounded-xl px-3 py-2 text-xs font-semibold text-on-surface focus:outline-none transition-colors">
              {/* Rendered dynamically */}
            </select>
          </div>
          <div>
            <label htmlFor="add-word-passage-select" className="block text-[11px] font-medium text-outline mb-1">Chọn Passage <span className="text-rose-500">*</span></label>
            <select id="add-word-passage-select" onChange={(event) => { try { (function(event){ window.onAddWordPassageChange(this.value) }).call(this, event); } catch(e){ console.error(e); } }}
                    className="w-full bg-surface border border-outline-variant/30 focus:border-primary rounded-xl px-3 py-2 text-xs font-semibold text-on-surface focus:outline-none transition-colors">
              {/* Rendered dynamically */}
            </select>
          </div>
        </div>
      </div>

      {/* English Word + AI Auto-Fill Button */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="add-word-english" className="text-xs font-bold text-outline uppercase tracking-wider">
            Từ tiếng Anh / Cụm từ <span className="text-rose-500">*</span>
          </label>
          <div className="btn-wrapper">
            <button type="button" id="btn-ai-autofill" onClick={(event) => { try { (function(event){ window.triggerAiLookup() }).call(this, event); } catch(e){ console.error(e); } }} className="btn" title="AI Điền tự động">
              <svg className="btn-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0 3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                ></path>
              </svg>

              <div className="txt-wrapper">
                <div className="txt-1">
                  <span className="btn-letter">G</span>
                  <span className="btn-letter">e</span>
                  <span className="btn-letter">n</span>
                  <span className="btn-letter">e</span>
                  <span className="btn-letter">r</span>
                  <span className="btn-letter">a</span>
                  <span className="btn-letter">t</span>
                  <span className="btn-letter">e</span>
                </div>
                <div className="txt-2">
                  <span className="btn-letter">G</span>
                  <span className="btn-letter">e</span>
                  <span className="btn-letter">n</span>
                  <span className="btn-letter">e</span>
                  <span className="btn-letter">r</span>
                  <span className="btn-letter">a</span>
                  <span className="btn-letter">t</span>
                  <span className="btn-letter">i</span>
                  <span className="btn-letter">n</span>
                  <span className="btn-letter">g</span>
                </div>
              </div>
            </button>
          </div>
        </div>
        <div className="relative">
          <input type="text" id="add-word-english" required placeholder="Ví dụ: resilient, breakthrough, persist..."
                 autoComplete="off"
                 className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:bg-surface rounded-xl px-4 py-3 text-sm text-on-surface font-semibold placeholder:text-outline/70 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                 onKeydown={(event) => { try { (function(event){ if(event.key==='Enter'&&event.ctrlKey){event.preventDefault();window.triggerAiLookup();} }).call(this, event); } catch(e){ console.error(e); } }}/>
        </div>
        <p className="text-[11px] text-on-surface-variant mt-1.5 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] text-outline">lightbulb</span>
          <span>Gõ từ rồi bấm <strong className="text-primary font-semibold">✨ AI Điền tự động</strong> (hoặc nhấn <kbd className="px-1 py-0.5 rounded bg-surface-container text-[10px] font-mono">Ctrl+Enter</kbd>) để tự động điền.</span>
        </p>
      </div>

      {/* Phonetic IPA */}
      <div>
        <label htmlFor="add-word-phonetic" className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
          Phiên âm IPA
        </label>
        <div className="relative flex items-center">
          <input type="text" id="add-word-phonetic" placeholder="/rɪˈzɪl.jənt/"
                 className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:bg-surface rounded-xl pl-4 pr-11 py-2.5 text-sm text-on-surface placeholder:text-outline/70 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"/>
          <button type="button" onClick={(event) => { try { (function(event){ window.previewAddWordAudio() }).call(this, event); } catch(e){ console.error(e); } }} className="absolute right-2.5 p-1.5 rounded-lg text-outline hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer" title="Nghe phát âm thử">
            <span className="material-symbols-outlined text-[18px]">volume_up</span>
          </button>
        </div>
      </div>

      {/* Vietnamese Meaning */}
      <div>
        <label htmlFor="add-word-meaning" className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
          Nghĩa tiếng Việt <span className="text-rose-500">*</span>
        </label>
        <textarea id="add-word-meaning" required rows="2" placeholder="Ví dụ: kiên cường, có khả năng phục hồi nhanh..."
                  className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:bg-surface rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-outline/70 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea>
      </div>

      {/* Example Sentence */}
      <div>
        <label htmlFor="add-word-example" className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
          Câu ví dụ (tiếng Anh)
        </label>
        <textarea id="add-word-example" rows="2" placeholder="Ví dụ: She showed a resilient attitude in the face of difficulties."
                  className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:bg-surface rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-outline/70 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea>
      </div>

      {/* Hidden topicId and passageId */}
      <input type="hidden" id="add-word-topic-id" value=""/>
      <input type="hidden" id="add-word-passage-id" value=""/>

      {/* Error message alert */}
      <div id="add-word-error" className="hidden text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl font-medium flex items-center gap-2">
        <span className="material-symbols-outlined text-base shrink-0">error</span>
        <span id="add-word-error-text" className="flex-1"></span>
      </div>

      {/* Modal Footer Action Buttons */}
      <div className="pt-3 border-t border-outline-variant/15 flex items-center justify-end gap-2.5 shrink-0">
        <button type="button" onClick={(event) => { try { (function(event){ window.closeAddWordModal() }).call(this, event); } catch(e){ console.error(e); } }} 
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer">
          Hủy bỏ
        </button>
        <button type="submit" id="btn-submit-add-word"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-surface-tint active:scale-95 transition-all shadow-sm shadow-primary/25 flex items-center gap-1.5 cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">check</span>
          <span>Lưu từ vựng</span>
        </button>
      </div>
    </form>

  </div>
</div>

{/* ==================== MODAL: THÊM TỪ HÀNG LOẠT (BULK IMPORT) ==================== */}
<div id="modal-bulk-add-word" className="fixed inset-0 z-[9999] hidden items-center justify-center p-3 sm:p-4" style={{"background":"rgba(0,0,0,0.65)","backdropFilter":"blur(8px)"}}>
  <div className="w-full max-w-2xl bg-surface rounded-3xl soft-shadow fade-in overflow-hidden border border-outline-variant/30 flex flex-col max-h-[92vh]">
    
    {/* Header */}
    <div className="px-5 sm:px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between shrink-0 bg-surface-container-lowest/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
          <span className="material-symbols-outlined text-[24px]">playlist_add</span>
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-on-surface leading-tight">Thêm từ vựng hàng loạt</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">Dán danh sách từ vựng & AI tự động điền toàn bộ thông tin</p>
        </div>
      </div>
      <button onClick={(event) => { try { (function(event){ window.closeBulkAddModal() }).call(this, event); } catch(e){ console.error(e); } }} className="w-9 h-9 flex items-center justify-center rounded-full text-outline hover:bg-surface-container-low transition-colors cursor-pointer">
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>

    {/* Body */}
    <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
      
      {/* Destination Card: Thư mục / Chủ đề / Test / Passage */}
      <div id="bulk-add-destination-section">
        <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
          Lưu vào Chủ đề / Bài học <span className="text-rose-500">*</span>
        </label>
        <button type="button" id="bulk-add-destination-card" onClick={(event) => { try { (function(event){ window.openTopicPickerForBulkAdd() }).call(this, event); } catch(e){ console.error(e); } }}
                className="w-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-primary/50 rounded-2xl p-3 text-left flex items-center justify-between transition-all group cursor-pointer">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]" id="bulk-add-destination-icon">folder</span>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-outline font-medium" id="bulk-add-destination-path">Thư mục / Chủ đề</div>
              <div className="text-sm font-bold text-on-surface truncate" id="bulk-add-destination-title">Bấm để chọn nơi lưu từ...</div>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[20px] shrink-0 ml-2">navigate_next</span>
        </button>
        <input type="hidden" id="bulk-add-topic-id" value=""/>
        <input type="hidden" id="bulk-add-passage-id" value=""/>
      </div>

      {/* Exam Test & Passage Selector (dành cho bộ CAM và IELTS Actual Tests Vol) */}
      <div id="bulk-add-exam-section" className="hidden p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/25 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-outline uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">quiz</span>
            <span>Vị trí trong đề thi</span>
          </label>
          <span id="bulk-add-exam-badge-text" className="text-[11px] text-primary font-semibold truncate max-w-[200px]">Test &amp; Passage</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="bulk-add-test-select" className="block text-[11px] font-medium text-outline mb-1">Chọn bài Test <span className="text-rose-500">*</span></label>
            <select id="bulk-add-test-select" onChange={(event) => { try { (function(event){ window.onBulkAddTestChange(this.value) }).call(this, event); } catch(e){ console.error(e); } }}
                    className="w-full bg-surface border border-outline-variant/30 focus:border-primary rounded-xl px-3 py-2 text-xs font-semibold text-on-surface focus:outline-none transition-colors">
              {/* Rendered dynamically */}
            </select>
          </div>
          <div>
            <label htmlFor="bulk-add-passage-select" className="block text-[11px] font-medium text-outline mb-1">Chọn Passage <span className="text-rose-500">*</span></label>
            <select id="bulk-add-passage-select" onChange={(event) => { try { (function(event){ window.onBulkAddPassageChange(this.value) }).call(this, event); } catch(e){ console.error(e); } }}
                    className="w-full bg-surface border border-outline-variant/30 focus:border-primary rounded-xl px-3 py-2 text-xs font-semibold text-on-surface focus:outline-none transition-colors">
              {/* Rendered dynamically */}
            </select>
          </div>
        </div>
      </div>

      {/* Textarea Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="bulk-add-textarea" className="text-xs font-bold text-outline uppercase tracking-wider">
            Danh sách từ vựng (Tối đa 20 từ mỗi lượt)
          </label>
          <span id="bulk-word-count-badge" className="text-[11px] font-semibold text-outline">0 từ</span>
        </div>
        <textarea id="bulk-add-textarea" rows="5" onInput={(event) => { try { (function(event){ window.updateBulkWordCount() }).call(this, event); } catch(e){ console.error(e); } }}
          placeholder="Nhập hoặc dán danh sách từ tiếng Anh (mỗi dòng 1 từ):&#10;resilient&#10;breakthrough&#10;ubiquitous&#10;&#10;Hoặc theo định dạng: từ - nghĩa (ví dụ: persistent - kiên trì)"
          className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:bg-surface rounded-xl p-3.5 text-xs sm:text-sm text-on-surface font-mono placeholder:text-outline/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all custom-scrollbar"></textarea>
      </div>

      {/* Action buttons for parsing / AI fill */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <div className="btn-wrapper flex-1 min-w-[200px]">
          <button type="button" id="btn-bulk-ai-generate" onClick={(event) => { try { (function(event){ window.generateBulkWordsAi() }).call(this, event); } catch(e){ console.error(e); } }} className="btn w-full" title="AI Điền tự động hàng loạt">
            <svg className="btn-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
              ></path>
            </svg>

            <div className="txt-wrapper">
              <div className="txt-1">
                <span className="btn-letter">G</span>
                <span className="btn-letter">e</span>
                <span className="btn-letter">n</span>
                <span className="btn-letter">e</span>
                <span className="btn-letter">r</span>
                <span className="btn-letter">a</span>
                <span className="btn-letter">t</span>
                <span className="btn-letter">e</span>
              </div>
              <div className="txt-2">
                <span className="btn-letter">G</span>
                <span className="btn-letter">e</span>
                <span className="btn-letter">n</span>
                <span className="btn-letter">e</span>
                <span className="btn-letter">r</span>
                <span className="btn-letter">a</span>
                <span className="btn-letter">t</span>
                <span className="btn-letter">i</span>
                <span className="btn-letter">n</span>
                <span className="btn-letter">g</span>
              </div>
            </div>
          </button>
        </div>
        <button type="button" onClick={(event) => { try { (function(event){ window.parseBulkWordsRaw() }).call(this, event); } catch(e){ console.error(e); } }}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors cursor-pointer">
          Trích xuất từ danh sách
        </button>
        <button type="button" onClick={(event) => { try { (function(event){ window.clearBulkWords() }).call(this, event); } catch(e){ console.error(e); } }}
          className="px-3 py-2.5 rounded-xl text-xs font-medium text-outline hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer">
          Xóa trắng
        </button>
      </div>

      {/* Preview Table Container */}
      <div id="bulk-preview-section" className="hidden flex-col gap-2 pt-2 border-t border-outline-variant/15">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-outline uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">visibility</span>
            <span>Xem trước danh sách (<span id="bulk-preview-count">0</span>)</span>
          </h4>
          <span className="text-[11px] text-outline">Bạn có thể sửa trực tiếp trên bảng</span>
        </div>

        <div className="border border-outline-variant/25 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-surface-container sticky top-0 z-10 text-on-surface-variant font-bold border-b border-outline-variant/20">
              <tr>
                <th className="p-2.5 w-8 text-center">#</th>
                <th className="p-2.5 min-w-[120px]">Từ tiếng Anh</th>
                <th className="p-2.5 min-w-[100px]">Phiên âm</th>
                <th className="p-2.5 min-w-[160px]">Nghĩa tiếng Việt</th>
                <th className="p-2.5 min-w-[160px]">Ví dụ</th>
                <th className="p-2.5 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody id="bulk-preview-tbody" className="divide-y divide-outline-variant/15 bg-surface-container-lowest/50">
              {/* Rows rendered dynamically */}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error / Alert */}
      <div id="bulk-add-error" className="hidden text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl font-medium flex items-center gap-2">
        <span className="material-symbols-outlined text-base shrink-0">error</span>
        <span id="bulk-add-error-text" className="flex-1"></span>
      </div>

    </div>

    {/* Footer */}
    <div className="px-6 py-4 border-t border-outline-variant/15 flex items-center justify-between shrink-0 bg-surface-container-lowest/50">
      <div className="text-xs text-outline font-medium">
        <span id="bulk-footer-summary">Chưa có từ nào sẵn sàng lưu</span>
      </div>
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={(event) => { try { (function(event){ window.closeBulkAddModal() }).call(this, event); } catch(e){ console.error(e); } }}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer">
          Đóng
        </button>
        <button type="button" id="btn-submit-bulk-add" onClick={(event) => { try { (function(event){ window.submitBulkAddWords() }).call(this, event); } catch(e){ console.error(e); } }} disabled
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-surface-tint active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">save</span>
          <span id="bulk-submit-text">Lưu vào Sổ từ</span>
        </button>
      </div>
    </div>

  </div>
</div>

{/* ==================== MODAL: TẠO CHỦ ĐỀ / THƯ MỤC ==================== */}
<div id="modal-create-topic" className="fixed inset-0 z-[9999] hidden items-center justify-center p-4" style={{"background":"rgba(0,0,0,0.5)","backdropFilter":"blur(4px)"}}>
  <div className="w-full max-w-md bg-surface rounded-2xl soft-shadow fade-in overflow-hidden">

    {/* ── STEP 0: Chọn loại ───────────────────────────────── */}
    <div id="ct-step-0" className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-on-surface">Bạn muốn tạo gì?</h2>
        <button onClick={(event) => { try { (function(event){ window.closeCreateTopicModal() }).call(this, event); } catch(e){ console.error(e); } }} className="p-2 rounded-full text-outline hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Card Tạo Chủ đề */}
        <button onClick={(event) => { try { (function(event){ window._goToModalStep('topic') }).call(this, event); } catch(e){ console.error(e); } }}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-outline-variant/30 hover:border-primary hover:bg-primary/5 transition-all text-center active:scale-95">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
            <span className="material-symbols-outlined text-[26px]">menu_book</span>
          </div>
          <div>
            <p className="font-bold text-sm text-on-surface">Tạo Chủ đề</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">Thêm vào thư mục có sẵn</p>
          </div>
        </button>
        {/* Card Tạo Thư mục */}
        <button onClick={(event) => { try { (function(event){ window._goToModalStep('folder') }).call(this, event); } catch(e){ console.error(e); } }}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-outline-variant/30 hover:border-secondary hover:bg-secondary/5 transition-all text-center active:scale-95">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-all">
            <span className="material-symbols-outlined text-[26px]">folder_open</span>
          </div>
          <div>
            <p className="font-bold text-sm text-on-surface">Tạo Thư mục</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">Tạo danh mục mới</p>
          </div>
        </button>
      </div>
    </div>

    {/* ── STEP 1a: Form Tạo Chủ đề ───────────────────────── */}
    <div id="ct-step-topic" className="hidden p-6 md:p-8 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={(event) => { try { (function(event){ window._goToModalStep('back') }).call(this, event); } catch(e){ console.error(e); } }} className="p-1.5 rounded-full text-outline hover:bg-surface-container-low transition-colors -ml-1">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <h2 className="text-xl font-bold text-on-surface">Tạo Chủ đề mới</h2>
        <button onClick={(event) => { try { (function(event){ window.closeCreateTopicModal() }).call(this, event); } catch(e){ console.error(e); } }} className="p-2 rounded-full text-outline hover:bg-surface-container-low transition-colors ml-auto">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Tên chủ đề</label>
          <input id="new-topic-name" type="text" maxLength="60" placeholder="Ví dụ: CAM 22 Test 1"
                 className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary px-4 py-3 rounded-t-lg outline-none text-on-surface transition-colors"
                 onKeydown={(event) => { try { (function(event){ if(event.key==='Enter') window.submitCreateTopic() }).call(this, event); } catch(e){ console.error(e); } }}/>
        </div>
        <div>
          <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-3">Biểu tượng</label>
          <div className="grid grid-cols-6 gap-2" id="icon-picker">{/* icons by JS */}</div>
          <input type="hidden" id="new-topic-icon" value="folder"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Thư mục</label>
          <select id="new-topic-category-select" onChange={(event) => { try { (function(event){ window._onTopicCategoryChange() }).call(this, event); } catch(e){ console.error(e); } }}
                  className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary px-4 py-3 rounded-xl outline-none text-on-surface transition-colors text-sm cursor-pointer">
          </select>
        </div>

        {/* Cấu hình Test → Passage (Tùy chọn cấu trúc đề thi cho chủ đề này) */}
        <div id="topic-exam-config" className="p-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-low/50">
          <label className="flex items-center justify-between cursor-pointer select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">account_tree</span>
              </div>
              <div>
                <span className="font-bold text-xs md:text-sm text-on-surface block">Cấu trúc Test → Passage</span>
                <span className="text-[11px] text-on-surface-variant block">Chia đề thi và bài đọc (Cambridge / VOL)</span>
              </div>
            </div>
            <input type="checkbox" id="topic-exam-checkbox" onChange={(event) => { try { (function(event){ window._onTopicExamCheckboxChange() }).call(this, event); } catch(e){ console.error(e); } }} className="accent-secondary w-4 h-4 rounded cursor-pointer shrink-0"/>
          </label>
          <div id="topic-exam-fields" className="hidden mt-3 pt-3 border-t border-outline-variant/20 flex gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-1.5">Số đề (Tests)</label>
              <input id="topic-num-tests" type="number" min="1" max="20" value="4"
                     className="w-full bg-surface border border-outline-variant/30 focus:border-secondary px-3 py-2 rounded-lg outline-none text-on-surface text-sm font-bold text-center transition-colors"/>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-1.5">Số Passage / đề</label>
              <input id="topic-num-passages" type="number" min="1" max="10" value="3"
                     className="w-full bg-surface border border-outline-variant/30 focus:border-secondary px-3 py-2 rounded-lg outline-none text-on-surface text-sm font-bold text-center transition-colors"/>
            </div>
          </div>
        </div>

        <div id="create-topic-error" className="text-error text-sm hidden"></div>
        <div className="flex gap-3 mt-2">
          <button onClick={(event) => { try { (function(event){ window._goToModalStep('back') }).call(this, event); } catch(e){ console.error(e); } }} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-colors">Quay lại</button>
          <button onClick={(event) => { try { (function(event){ window.submitCreateTopic() }).call(this, event); } catch(e){ console.error(e); } }} id="create-topic-submit" className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-surface-tint transition-colors">Tạo chủ đề</button>
        </div>
      </div>
    </div>

    {/* ── STEP 1b: Form Tạo Thư mục ──────────────────────── */}
    <div id="ct-step-folder" className="hidden p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={(event) => { try { (function(event){ window._goToModalStep('back') }).call(this, event); } catch(e){ console.error(e); } }} className="p-1.5 rounded-full text-outline hover:bg-surface-container-low transition-colors -ml-1">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <h2 className="text-xl font-bold text-on-surface">Tạo Thư mục mới</h2>
        <button onClick={(event) => { try { (function(event){ window.closeCreateTopicModal() }).call(this, event); } catch(e){ console.error(e); } }} className="p-2 rounded-full text-outline hover:bg-surface-container-low transition-colors ml-auto">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Tên thư mục</label>
          <input id="new-folder-name" type="text" maxLength="60" placeholder="Ví dụ: CAM 22, TOEIC 2025..."
                 className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-secondary px-4 py-3 rounded-t-lg outline-none text-on-surface transition-colors"
                 onKeydown={(event) => { try { (function(event){ if(event.key==='Enter') window.submitCreateFolder() }).call(this, event); } catch(e){ console.error(e); } }}/>
        </div>
        {/* Radio: loại thư mục */}
        <div>
          <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-3">Loại thư mục</label>
          <div className="flex flex-col gap-2">
            {/* Option A: Thường */}
            <label id="folder-type-normal-label"
                   className="flex items-start gap-3 p-3.5 rounded-xl border-2 border-primary bg-primary/5 cursor-pointer transition-all"
                   onClick={(event) => { try { (function(event){ window._selectFolderType('normal') }).call(this, event); } catch(e){ console.error(e); } }}>
              <input type="radio" name="folder-type" value="normal" checked className="mt-0.5 accent-primary shrink-0"/>
              <div>
                <p className="font-bold text-sm text-on-surface">Thư mục thông thường</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">Danh sách chủ đề phẳng — phù hợp Oxford, IELTS, Idioms…</p>
              </div>
            </label>
            {/* Option B: Kiểu đề thi */}
            <label id="folder-type-exam-label"
                   className="flex items-start gap-3 p-3.5 rounded-xl border-2 border-outline-variant/30 cursor-pointer transition-all"
                   onClick={(event) => { try { (function(event){ window._selectFolderType('exam') }).call(this, event); } catch(e){ console.error(e); } }}>
              <input type="radio" name="folder-type" value="exam" className="mt-0.5 accent-secondary shrink-0"/>
              <div>
                <p className="font-bold text-sm text-on-surface">Thư mục đề thi <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-full ml-1">Test → Passage</span></p>
                <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">Phân cấp Test → Passage — mỗi chủ đề tùy chọn số Test và Passage riêng.</p>
              </div>
            </label>
          </div>
        </div>
        <div id="create-folder-error" className="text-error text-sm hidden"></div>
        <div className="flex gap-3 mt-2">
          <button onClick={(event) => { try { (function(event){ window._goToModalStep('back') }).call(this, event); } catch(e){ console.error(e); } }} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-colors">Quay lại</button>
          <button onClick={(event) => { try { (function(event){ window.submitCreateFolder() }).call(this, event); } catch(e){ console.error(e); } }} id="create-folder-submit" className="flex-1 py-3 rounded-xl bg-secondary text-on-secondary font-bold text-sm hover:opacity-90 transition-all">Tạo thư mục</button>
        </div>
      </div>
    </div>

  </div>
</div>
{/* ==================== MODAL: ĐỔI TÊN PASSAGE ==================== */}
<div id="modal-rename-passage" className="fixed inset-0 z-[9999] hidden items-center justify-center p-4" style={{"background":"rgba(0,0,0,0.5)","backdropFilter":"blur(4px)"}}>
  <div className="w-full max-w-sm bg-surface rounded-2xl p-6 soft-shadow fade-in">
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[20px]">edit_note</span>
        </div>
        <h2 className="text-lg font-bold text-on-surface">Đổi tên Passage</h2>
      </div>
      <button onClick={(event) => { try { (function(event){ window._closeRenamePassage() }).call(this, event); } catch(e){ console.error(e); } }} className="p-2 rounded-full text-outline hover:bg-surface-container-low transition-colors">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
    <input type="hidden" id="rename-passage-id"/>
    <div className="mb-4">
      <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Tên mới</label>
      <input id="rename-passage-input" type="text" maxLength="100" placeholder="Ví dụ: URBAN FARMING"
             className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary px-4 py-3 rounded-t-lg outline-none text-on-surface transition-colors font-medium"
             onKeydown={(event) => { try { (function(event){ if(event.key==='Enter') window._submitRenamePassage() }).call(this, event); } catch(e){ console.error(e); } }}/>
    </div>
    <div id="rename-passage-error" className="text-error text-sm mb-3 hidden"></div>
    <div className="flex gap-3">
      <button onClick={(event) => { try { (function(event){ window._closeRenamePassage() }).call(this, event); } catch(e){ console.error(e); } }} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-colors">Hủy</button>
      <button onClick={(event) => { try { (function(event){ window._submitRenamePassage() }).call(this, event); } catch(e){ console.error(e); } }} id="rename-passage-submit"
              className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-surface-tint transition-colors flex items-center justify-center gap-1.5">
        <span className="material-symbols-outlined text-[16px]">check</span>Lưu tên
      </button>
    </div>
  </div>
</div>
{/* ==================== MODAL: SRS EXPLAINER ==================== */}
<div id="modal-srs-explainer" className="fixed inset-0 z-[9999] hidden items-center justify-center p-4" style={{"background":"rgba(0,0,0,0.55)","backdropFilter":"blur(6px)"}}>
  <div className="w-full max-w-lg bg-surface rounded-3xl p-6 md:p-8 soft-shadow fade-in max-h-[90vh] overflow-y-auto border border-outline-variant/20">
    {/* Modal Header */}
    <div className="flex items-center justify-between mb-5 pb-3 border-b border-outline-variant/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[24px] icon-fill">published_with_changes</span>
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-bold text-on-surface">Thuật toán ghi nhớ SRS</h2>
          <p className="text-xs text-on-surface-variant">Hệ thống 6 cấp độ lặp lại ngắt quãng khoa học</p>
        </div>
      </div>
      <button onClick={(event) => { try { (function(event){ window.closeSRSExplainerModal() }).call(this, event); } catch(e){ console.error(e); } }} className="p-2 rounded-full text-outline hover:bg-surface-container-low transition-colors cursor-pointer">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>

    {/* Modal Content */}
    <div className="flex flex-col gap-3.5 text-xs sm:text-sm text-on-surface-variant">
      <p className="leading-relaxed">
        Phương pháp <strong>Lặp lại ngắt quãng (Spaced Repetition System - SRS)</strong> tự động tối ưu hóa thời gian ôn tập cho từng từ vựng dựa trên đường cong lãng quên của não bộ, giúp ghi nhớ lâu dài với thời gian học ít nhất.
      </p>

      <div className="flex flex-col gap-2.5 mt-2">
        {/* Lvl 0 */}
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
          <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{"backgroundColor":"#94a3b8"}}></span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-on-surface">Cấp 0 (Lvl 0) · Chưa học / Mới tạo</span>
              <span className="text-[11px] font-semibold text-outline">Chưa bắt đầu</span>
            </div>
            <p className="text-[11px] text-on-surface-variant/80 mt-0.5">Từ vựng vừa lưu vào sổ từ hoặc chủ đề, chưa trải qua phiên ôn luyện nào.</p>
          </div>
        </div>

        {/* Lvl 1 */}
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
          <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{"backgroundColor":"#f97316"}}></span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-on-surface">Cấp 1 (Lvl 1) · Khởi động</span>
              <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">Ôn sau 1 ngày</span>
            </div>
            <p className="text-[11px] text-on-surface-variant/80 mt-0.5">Mới bắt đầu ghi nhớ. Cần được củng cố ngay sau 24 giờ để không quên.</p>
          </div>
        </div>

        {/* Lvl 2 */}
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
          <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{"backgroundColor":"#f59e0b"}}></span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-on-surface">Cấp 2 (Lvl 2) · Làm quen</span>
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Ôn sau 3 ngày</span>
            </div>
            <p className="text-[11px] text-on-surface-variant/80 mt-0.5">Đã nhớ được nghĩa cơ bản, não bộ bắt đầu định hình đường dẫn liên kết từ vựng.</p>
          </div>
        </div>

        {/* Lvl 3 */}
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
          <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{"backgroundColor":"#0ea5e9"}}></span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-on-surface">Cấp 3 (Lvl 3) · Củng cố</span>
              <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">Ôn sau 7 ngày</span>
            </div>
            <p className="text-[11px] text-on-surface-variant/80 mt-0.5">Ghi nhớ tương đối vững, nhận diện nhanh chóng trong ngữ cảnh câu văn.</p>
          </div>
        </div>

        {/* Lvl 4 */}
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
          <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{"backgroundColor":"#a855f7"}}></span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-on-surface">Cấp 4 (Lvl 4) · Vững vàng</span>
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">Ôn sau 14 ngày</span>
            </div>
            <p className="text-[11px] text-on-surface-variant/80 mt-0.5">Trí nhớ dài hạn đã hình thành. Phản xạ tự nhiên khi gặp trong đề thi.</p>
          </div>
        </div>

        {/* Lvl 5 */}
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
          <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{"backgroundColor":"#10b981"}}></span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-on-surface">Cấp 5 (Lvl 5) · Thành thạo</span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Ôn sau 30+ ngày</span>
            </div>
            <p className="text-[11px] text-on-surface-variant/80 mt-0.5">Cấp độ cao nhất. Bạn đã hoàn toàn làm chủ từ vựng này trong mọi kỹ năng!</p>
          </div>
        </div>
      </div>
    </div>

    {/* Modal Footer */}
    <div className="mt-6 pt-4 border-t border-outline-variant/20 flex justify-end">
      <button onClick={(event) => { try { (function(event){ window.closeSRSExplainerModal() }).call(this, event); } catch(e){ console.error(e); } }} className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold shadow-xs cursor-pointer hover:bg-surface-tint transition-colors">
        Đã hiểu
      </button>
    </div>
  </div>
</div>

{/* ==================== MODAL: IELTS TARGET & COUNTDOWN ==================== */}
<div id="modal-ielts-goal" className="fixed inset-0 z-[9999] hidden items-center justify-center p-4" style={{"background":"rgba(0,0,0,0.55)","backdropFilter":"blur(6px)"}}>
  <div className="w-full max-w-lg bg-surface rounded-2xl p-6 md:p-8 soft-shadow fade-in max-h-[90vh] overflow-y-auto">
    
    {/* Modal Header */}
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[24px] icon-fill">military_tech</span>
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-bold text-on-surface">Mục tiêu IELTS & Ngày thi</h2>
          <p className="text-xs text-on-surface-variant">Đặt band mong muốn và đếm ngược từng ngày</p>
        </div>
      </div>
      <button onClick={(event) => { try { (function(event){ closeIELTSGoalModal() }).call(this, event); } catch(e){ console.error(e); } }} className="p-2 rounded-full text-outline hover:bg-surface-container-low transition-colors">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>

    <div className="flex flex-col gap-5">
      
      {/* 1. Ngày thi dự kiến & Đếm ngược preview */}
      <div>
        <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Ngày thi dự kiến</label>
        <input id="ielts-input-exam-date" type="date"
               onChange={(event) => { try { (function(event){ ieltsUpdateCountdown() }).call(this, event); } catch(e){ console.error(e); } }}
               className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary px-4 py-3 rounded-xl outline-none text-on-surface transition-colors text-sm"/>
        <div id="ielts-modal-countdown-preview" className="text-xs text-primary font-bold mt-1.5 flex items-center gap-1">
          Vui lòng chọn ngày thi để bắt đầu đếm ngược
        </div>
      </div>

      {/* 2. Band 4 Kỹ năng */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold text-outline uppercase tracking-wider">Điểm 4 kỹ năng mong muốn</label>
          <span className="text-[11px] text-on-surface-variant">Từ 4.0 đến 9.0</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Listening */}
          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-outline uppercase">Listening</span>
            <select id="ielts-input-listening" onChange={(event) => { try { (function(event){ ieltsCalcOverall() }).call(this, event); } catch(e){ console.error(e); } }} className="bg-transparent font-bold text-sm text-on-surface outline-none cursor-pointer">
              <option value="5.0">5.0</option>
              <option value="5.5">5.5</option>
              <option value="6.0">6.0</option>
              <option value="6.5">6.5</option>
              <option value="7.0">7.0</option>
              <option value="7.5" selected>7.5</option>
              <option value="8.0">8.0</option>
              <option value="8.5">8.5</option>
              <option value="9.0">9.0</option>
            </select>
          </div>

          {/* Reading */}
          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-outline uppercase">Reading</span>
            <select id="ielts-input-reading" onChange={(event) => { try { (function(event){ ieltsCalcOverall() }).call(this, event); } catch(e){ console.error(e); } }} className="bg-transparent font-bold text-sm text-on-surface outline-none cursor-pointer">
              <option value="5.0">5.0</option>
              <option value="5.5">5.5</option>
              <option value="6.0">6.0</option>
              <option value="6.5">6.5</option>
              <option value="7.0">7.0</option>
              <option value="7.5" selected>7.5</option>
              <option value="8.0">8.0</option>
              <option value="8.5">8.5</option>
              <option value="9.0">9.0</option>
            </select>
          </div>

          {/* Writing */}
          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-outline uppercase">Writing</span>
            <select id="ielts-input-writing" onChange={(event) => { try { (function(event){ ieltsCalcOverall() }).call(this, event); } catch(e){ console.error(e); } }} className="bg-transparent font-bold text-sm text-on-surface outline-none cursor-pointer">
              <option value="5.0">5.0</option>
              <option value="5.5">5.5</option>
              <option value="6.0">6.0</option>
              <option value="6.5" selected>6.5</option>
              <option value="7.0">7.0</option>
              <option value="7.5">7.5</option>
              <option value="8.0">8.0</option>
              <option value="8.5">8.5</option>
              <option value="9.0">9.0</option>
            </select>
          </div>

          {/* Speaking */}
          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-outline uppercase">Speaking</span>
            <select id="ielts-input-speaking" onChange={(event) => { try { (function(event){ ieltsCalcOverall() }).call(this, event); } catch(e){ console.error(e); } }} className="bg-transparent font-bold text-sm text-on-surface outline-none cursor-pointer">
              <option value="5.0">5.0</option>
              <option value="5.5">5.5</option>
              <option value="6.0">6.0</option>
              <option value="6.5" selected>6.5</option>
              <option value="7.0">7.0</option>
              <option value="7.5">7.5</option>
              <option value="8.0">8.0</option>
              <option value="8.5">8.5</option>
              <option value="9.0">9.0</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Overall Band tự động tính */}
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider block">Overall Band dự kiến</span>
          <p className="text-xs text-on-surface-variant mt-0.5">Tự động làm tròn theo quy tắc chuẩn của IELTS</p>
        </div>
        <div className="flex items-center gap-2">
          <span id="ielts-calc-preview" className="text-xl md:text-2xl font-black text-primary">Band 7.0</span>
          <input type="hidden" id="ielts-input-overall" value="7.0"/>
        </div>
      </div>

      {/* 4. Lời nhắc truyền cảm hứng */}
      <div>
        <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Châm ngôn / Lời nhắc quyết tâm (tùy chọn)</label>
        <input id="ielts-input-motto" type="text" maxLength="120"
               placeholder="Ví dụ: Quyết tâm đạt 7.5 đi du học!"
               className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary px-4 py-3 rounded-xl outline-none text-on-surface transition-colors text-sm"/>
      </div>

      <div id="ielts-goal-error" className="text-error text-xs hidden"></div>

      {/* Buttons */}
      <div className="flex gap-3 mt-2">
        <button onClick={(event) => { try { (function(event){ closeIELTSGoalModal() }).call(this, event); } catch(e){ console.error(e); } }} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-colors">
          Hủy
        </button>
        <button onClick={(event) => { try { (function(event){ submitIELTSGoal() }).call(this, event); } catch(e){ console.error(e); } }} id="ielts-goal-submit" className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-surface-tint shadow-md transition-colors flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-[18px]">check</span>Lưu mục tiêu
        </button>
      </div>

    </div>
  </div>
</div>

{/* ==================== MODAL: LỖI XÁC THỰC / LINK HẾT HẠN ==================== */}
<div id="modal-auth-error" className="fixed inset-0 z-[10000] hidden items-center justify-center p-4" style={{"background":"rgba(0,0,0,0.65)","backdropFilter":"blur(8px)"}}>
  <div className="bg-surface p-6 rounded-2xl max-w-sm w-full soft-shadow border border-outline-variant/40 space-y-4">
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
        <span className="material-symbols-outlined text-2xl">link_off</span>
      </div>
      <h3 className="font-bold text-base text-on-surface">Liên kết không hợp lệ hoặc đã hết hạn</h3>
      <p id="auth-error-modal-desc" className="text-xs text-on-surface-variant mt-2 leading-relaxed">
        Liên kết xác thực hoặc đặt lại mật khẩu trong email đã hết hạn hoặc đã được sử dụng trước đó (do các hệ thống quét bảo mật của hòm thư tự động kiểm tra trước).
      </p>
    </div>
    <div className="space-y-2 pt-2">
      <button onClick={(event) => { try { (function(event){ window.openForgotPasswordModal(); window.closeAuthErrorModal(); }).call(this, event); } catch(e){ console.error(e); } }} className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark shadow-xs transition-all flex items-center justify-center gap-1.5">
        <span className="material-symbols-outlined text-base">refresh</span>
        Gửi lại liên kết khôi phục mới
      </button>
      <button onClick={(event) => { try { (function(event){ window.handleGoogleLogin(); window.closeAuthErrorModal(); }).call(this, event); } catch(e){ console.error(e); } }} className="w-full py-2.5 rounded-xl border border-outline-variant text-on-surface text-xs font-semibold hover:bg-surface-container-low transition-all flex items-center justify-center gap-1.5">
        <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
        Đăng nhập bằng Google
      </button>
      <button onClick={(event) => { try { (function(event){ window.closeAuthErrorModal() }).call(this, event); } catch(e){ console.error(e); } }} className="w-full py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors">
        Đóng
      </button>
    </div>
  </div>
</div>

{/* ==================== MODAL: QUÊN MẬT KHẨU / KHÔI PHỤC ==================== */}
<div id="modal-forgot-password" className="fixed inset-0 z-[9999] hidden items-center justify-center p-4" style={{"background":"rgba(0,0,0,0.55)","backdropFilter":"blur(6px)"}}>
  <div className="bg-surface p-6 rounded-2xl max-w-sm w-full soft-shadow border border-outline-variant/30 space-y-4">
    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
      <h3 className="font-bold text-base text-on-surface">Khôi phục mật khẩu</h3>
      <button onClick={(event) => { try { (function(event){ window.closeForgotPasswordModal() }).call(this, event); } catch(e){ console.error(e); } }} className="text-on-surface-variant hover:text-on-surface">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>

    {/* Toggle method tabs */}
    <div className="flex p-1 bg-surface-container-high rounded-xl gap-1">
      <button type="button" id="tab-forgot-link" onClick={(event) => { try { (function(event){ window.switchForgotTab('link') }).call(this, event); } catch(e){ console.error(e); } }} className="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all bg-white text-primary shadow-xs">
        Gửi link email
      </button>
      <button type="button" id="tab-forgot-otp" onClick={(event) => { try { (function(event){ window.switchForgotTab('otp') }).call(this, event); } catch(e){ console.error(e); } }} className="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-on-surface-variant hover:text-on-surface">
        Nhập mã OTP 6 số
      </button>
    </div>

    {/* Mode 1: Send link */}
    <form id="form-forgot-link" onSubmit={(event) => { try { (function(event){ window.handleForgotPassword(event) }).call(this, event); } catch(e){ console.error(e); } }} className="space-y-3">
      <p className="text-xs text-on-surface-variant leading-relaxed">
        Nhập địa chỉ email của bạn. Chúng tôi sẽ gửi một liên kết khôi phục để bạn đặt lại mật khẩu mới.
      </p>
      <div>
        <label htmlFor="forgot-email" className="block text-xs font-semibold text-on-surface mb-1">Email tài khoản</label>
        <input  type="email" id="forgot-email" aria-label="Email tài khoản" required placeholder="name@example.com" className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant text-xs bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
      <div id="forgot-msg" className="hidden text-xs p-2.5 rounded-xl font-medium"></div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={(event) => { try { (function(event){ window.closeForgotPasswordModal() }).call(this, event); } catch(e){ console.error(e); } }} className="px-3.5 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low">Hủy</button>
        <button type="submit" id="btn-forgot-submit" className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark shadow-xs">Gửi email</button>
      </div>
    </form>

    {/* Mode 2: Verify OTP code */}
    <form id="form-forgot-otp" onSubmit={(event) => { try { (function(event){ window.handleVerifyOtpReset(event) }).call(this, event); } catch(e){ console.error(e); } }} className="space-y-3 hidden">
      <p className="text-xs text-on-surface-variant leading-relaxed">
        Nếu bạn đã nhận được mã số 6 chữ số từ email khôi phục, hãy nhập mã và đặt mật khẩu mới ngay tại đây:
      </p>
      <div>
        <label htmlFor="otp-email" className="block text-xs font-semibold text-on-surface mb-1">Email tài khoản</label>
        <input  type="email" id="otp-email" aria-label="Email tài khoản" required placeholder="name@example.com" className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant text-xs bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
      <div>
        <label htmlFor="otp-code" className="block text-xs font-semibold text-on-surface mb-1">Mã xác nhận OTP (6 chữ số)</label>
        <input  type="text" id="otp-code" aria-label="Mã xác nhận OTP 6 chữ số" required maxLength="8" placeholder="123456" className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant text-xs tracking-widest font-mono text-center font-bold bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
      <div>
        <label htmlFor="otp-new-password" className="block text-xs font-semibold text-on-surface mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
        <input  type="password" id="otp-new-password" aria-label="Mật khẩu mới" required minLength="6" placeholder="••••••••" className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant text-xs bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
      <div id="otp-msg" className="hidden text-xs p-2.5 rounded-xl font-medium"></div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={(event) => { try { (function(event){ window.closeForgotPasswordModal() }).call(this, event); } catch(e){ console.error(e); } }} className="px-3.5 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low">Hủy</button>
        <button type="submit" id="btn-otp-submit" className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark shadow-xs">Xác nhận & Đổi MK</button>
      </div>
    </form>
  </div>
</div>

{/* ==================== MODAL: ĐẶT LẠI MẬT KHẨU MỚI ==================== */}
<div id="modal-reset-password" className="fixed inset-0 z-[10000] hidden items-center justify-center p-4" style={{"background":"rgba(0,0,0,0.65)","backdropFilter":"blur(8px)"}}>
  <div className="bg-surface p-6 rounded-2xl max-w-sm w-full soft-shadow border border-outline-variant/40 space-y-4">
    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-lg">lock_reset</span>
        </div>
        <h3 className="font-bold text-base text-on-surface">Đặt lại Mật khẩu Mới</h3>
      </div>
      <button onClick={(event) => { try { (function(event){ window.closeResetPasswordModal() }).call(this, event); } catch(e){ console.error(e); } }} className="text-on-surface-variant hover:text-on-surface">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
    <p className="text-xs text-on-surface-variant leading-relaxed">
      Nhập mật khẩu mới cho tài khoản của bạn (tối thiểu 6 ký tự).
    </p>
    <form onSubmit={(event) => { try { (function(event){ window.handleResetPassword(event) }).call(this, event); } catch(e){ console.error(e); } }} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Mật khẩu mới</label>
        <input  type="password" id="reset-new-password" required minLength="6" placeholder="••••••••" className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant text-xs bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-on-surface mb-1">Xác nhận mật khẩu mới</label>
        <input  type="password" id="reset-confirm-password" required minLength="6" placeholder="••••••••" className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant text-xs bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
      <div id="reset-msg" className="hidden text-xs p-2.5 rounded-xl font-medium"></div>
      <button type="submit" id="btn-reset-submit" className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark shadow-xs transition-all">
        Lưu Mật khẩu Mới
      </button>
    </form>
  </div>
</div>

{/* ==================== MODAL: THÔNG BÁO RA MẮT & TẶNG 2 THÁNG FULL TÍNH NĂNG ==================== */}
<div id="modal-welcome-announcement" className="fixed inset-0 z-[10000] hidden items-center justify-center p-3 sm:p-4" style={{"background":"rgba(15,23,42,0.68)","backdropFilter":"blur(8px)"}}>
  <div className="bg-surface rounded-3xl max-w-md w-full soft-shadow border border-outline-variant/30 overflow-hidden fade-in relative max-h-[92vh] flex flex-col my-auto">
    
    {/* Nút đóng (X) */}
    <button onClick={(event) => { try { (function(event){ window.closeWelcomeModal(true) }).call(this, event); } catch(e){ console.error(e); } }} className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-on-surface-variant hover:text-on-surface flex items-center justify-center shadow-xs backdrop-blur-xs transition-colors" title="Đóng thông báo">
      <span className="material-symbols-outlined text-[20px]">close</span>
    </button>

    {/* Header với ảnh cute mascot Tom & Jerry */}
    <div className="relative bg-gradient-to-br from-amber-50 via-sky-50 to-blue-50 p-5 sm:p-6 text-center flex flex-col items-center justify-center border-b border-outline-variant/15 shrink-0">
      <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden shadow-xl shadow-amber-500/15 ring-4 ring-white bg-white">
        <img src="/tom-and-jerry.jpg" alt="Tom and Jerry" className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"/>
      </div>
      <div className="inline-flex items-center gap-1.5 mt-3.5 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300 text-amber-900 text-[11px] font-black tracking-wide uppercase shadow-2xs">
        <span>✨ Thông Báo Ra Mắt & Quà Tặng ✨</span>
      </div>
    </div>

    {/* Nội dung thông báo cuộn được */}
    <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
      <div className="text-center space-y-1.5">
        <h3 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">Chào mừng bạn đến với HiVocab! 🎉</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
          HiVocab vừa chính thức ra mắt phiên bản trải nghiệm. Nền tảng còn rất mới nên trong quá trình sử dụng có thể sẽ còn một số lỗi phát sinh hoặc giao diện đang tiếp tục được hoàn thiện.
        </p>
      </div>

      {/* Khung Quà Tặng 2 Tháng Full Tính Năng */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl p-4 shadow-2xs space-y-2">
        <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
          <span className="text-xl">🎁</span>
          <span>TẶNG BẠN 2 THÁNG FULL TÍNH NĂNG!</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          Để tri ân những học viên đồng hành đầu tiên, HiVocab dành tặng bạn <strong>trọn vẹn 2 tháng sử dụng 100% tính năng cao cấp</strong> không giới hạn:
        </p>
        <ul className="text-[11px] text-slate-600 font-semibold space-y-1 pl-1">
          <li className="flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Kho 66.000+ từ vựng Cam 10–21 & IELTS Actual Tests Vol 1–9</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Chế độ Đọc Chủ Động & Che Bản Dịch (Curtain Reading Song Ngữ)</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>5 chế độ luyện tập: Flashcard, Trắc nghiệm, Điền từ, Nghe chép chính tả</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Ghi nhớ ngắt quãng Spaced Repetition (SRS SM-2)</span>
          </li>
        </ul>
      </div>

      {/* Khung Hỗ Trợ Zalo Admin */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Hỗ trợ kỹ thuật & Báo lỗi</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Admin trực 24/7</span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
              Zalo
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-on-surface">Zalo Admin:</p>
              <p className="text-xs font-black text-primary font-mono tracking-wider">0846 407 898</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button type="button" onClick={(event) => { try { (function(event){ window.copyAdminZalo() }).call(this, event); } catch(e){ console.error(e); } }} className="px-2.5 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-on-surface text-[11px] font-bold transition-colors">
              <span id="btn-copy-zalo-text">Sao chép</span>
            </button>
            <a href="https://zalo.me/0846407898" target="_blank" rel="noopener noreferrer" 
               className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors shadow-2xs flex items-center gap-1">
              <span>Mở Zalo</span>
              <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
            </a>
          </div>
        </div>
      </div>

      {/* Nút hành động chính */}
      <div className="pt-2 space-y-2">
        <button type="button" onClick={(event) => { try { (function(event){ window.closeWelcomeModal(true) }).call(this, event); } catch(e){ console.error(e); } }} 
                className="w-full py-3 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-container active:scale-[0.99] transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-wide">
          <span>Đã hiểu & Bắt đầu học ngay</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
        <p className="text-[10px] text-center text-on-surface-variant">
          Bạn có thể mở lại thông báo này bất cứ lúc nào trong menu bên trái.
        </p>
      </div>
    </div>

  </div>
</div>

{/* ==================== MODAL: THREAD CHAIN DETAIL VIEW ==================== */}
<div id="modal-thread-detail" onClick={(event) => { try { (function(event){ if(event.target===this) window.closeThreadDetail() }).call(this, event); } catch(e){ console.error(e); } }} className="fixed inset-0 z-[10000] hidden items-center justify-center p-2 sm:p-4" style={{"background":"rgba(0,0,0,0.65)","backdropFilter":"blur(6px)"}}>
  <div className="bg-surface rounded-3xl shadow-2xl border border-outline-variant/30 w-full max-w-[640px] max-h-[calc(100dvh-20px)] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
    {/* Header with Close button */}
    <div className="px-5 py-4 border-b border-outline-variant/15 flex items-center justify-between bg-surface/90 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <button type="button" onClick={(event) => { try { (function(event){ window.closeThreadDetail() }).call(this, event); } catch(e){ console.error(e); } }} className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer" title="Đóng">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <span className="font-bold text-sm text-on-surface">Chi tiết bộ từ vựng</span>
      </div>
      <button type="button" onClick={(event) => { try { (function(event){ window.closeThreadDetail() }).call(this, event); } catch(e){ console.error(e); } }} className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container cursor-pointer transition-colors">
        <span className="material-symbols-outlined text-xl">close</span>
      </button>
    </div>

    {/* Modal Body (Scrollable Thread Chain) */}
    <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain" id="thread-detail-content" style={{"WebkitOverflowScrolling":"touch","touchAction":"pan-y"}}>
      {/* Rendered dynamically by library.js */}
    </div>
  </div>
</div>

{/* ==================== MODAL: CHỌN HASHTAG CÔNG KHAI BỘ TỪ ==================== */}
<div id="modal-hashtag-publish" className="fixed inset-0 z-[10000] hidden items-center justify-center p-3 sm:p-4" style={{"background":"rgba(0,0,0,0.65)","backdropFilter":"blur(6px)"}}>
  <div className="bg-surface dark:bg-neutral-900 rounded-3xl shadow-2xl border border-outline-variant/30 dark:border-neutral-800 w-full max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
    {/* Header */}
    <div className="px-5 py-4 border-b border-outline-variant/15 dark:border-neutral-800 flex items-center justify-between bg-surface/90 dark:bg-neutral-900/90 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-xl">tag</span>
        <h3 className="font-bold text-sm sm:text-base text-on-surface">Chọn thẻ Hashtag cho bộ từ</h3>
      </div>
      <button type="button" onClick={(event) => { try { (function(event){ window.cancelHashtagModal() }).call(this, event); } catch(e){ console.error(e); } }} className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container cursor-pointer transition-colors" title="Đóng">
        <span className="material-symbols-outlined text-xl">close</span>
      </button>
    </div>

    {/* Body */}
    <div className="p-5 overflow-y-auto flex flex-col gap-4">
      <div>
        <h4 id="pub-topic-name-preview" className="font-bold text-base text-on-surface truncate">Tên bộ từ</h4>
        <p className="text-xs text-on-surface-variant mt-0.5">Chọn các thẻ hashtag phù hợp để người học dễ dàng tìm thấy bộ từ của bạn trên Thư viện mở.</p>
      </div>

      {/* Quick select pills */}
      <div>
        <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Thẻ gợi ý (bấm chọn):</label>
        <div className="flex flex-wrap gap-1.5" id="pub-hashtag-pills">
          {/* Populated by JS */}
        </div>
      </div>

      {/* Custom tags input */}
      <div>
        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Hashtag đã chọn:</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-primary text-[18px]">tag</span>
          <input id="pub-tags-input" type="text" placeholder="IELTS, Cam19, 7.5+, GiaoTiếp..."
                 className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 rounded-xl bg-surface-container-low dark:bg-neutral-950 border border-outline-variant/30 dark:border-neutral-800 text-on-surface focus:border-primary focus:outline-hidden placeholder:text-outline"/>
        </div>
        <p className="text-[11px] text-outline mt-1">Bấm các thẻ gợi ý phía trên hoặc tự nhập thêm thẻ phân cách bằng dấu phẩy.</p>
      </div>

      {/* Optional short note */}
      <div>
        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Mẹo học / Ghi chú (tùy chọn):</label>
        <textarea id="pub-desc-input" rows="2" placeholder="Ví dụ: Tổng hợp collocations band 7.5+, học 10 từ mỗi ngày..."
                  className="w-full text-xs sm:text-sm p-3 rounded-xl bg-surface-container-low dark:bg-neutral-950 border border-outline-variant/30 dark:border-neutral-800 text-on-surface focus:border-primary focus:outline-hidden placeholder:text-outline resize-none"></textarea>
      </div>

      {/* Info note */}
      <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-3 text-xs text-on-surface-variant flex items-start gap-2">
        <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">info</span>
        <span>Bộ từ sẽ chuyển sang trạng thái <strong>Công khai</strong> trên Thư viện. Bạn có thể gạt công tắc để chuyển lại về <strong>Riêng tư</strong> bất cứ lúc nào.</span>
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-outline-variant/15 dark:border-neutral-800">
        <button type="button" onClick={(event) => { try { (function(event){ window.cancelHashtagModal() }).call(this, event); } catch(e){ console.error(e); } }} className="px-4 py-2 rounded-full text-xs font-bold text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer">
          Hủy bỏ
        </button>
        <button id="pub-confirm-btn" type="button" onClick={(event) => { try { (function(event){ window.confirmHashtagPublish() }).call(this, event); } catch(e){ console.error(e); } }} className="px-5 py-2 rounded-full bg-primary text-on-primary font-bold text-xs sm:text-sm shadow-md hover:bg-surface-tint active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
          <span>Xác nhận công khai</span>
          <span className="material-symbols-outlined text-base">check</span>
        </button>
      </div>
    </div>
  </div>
</div>

{/* ==================== MODAL: BÌNH LUẬN & MẸO HỌC (THREADS COMMENTS) ==================== */}
<div id="modal-thread-comments" className="fixed inset-0 z-[10000] hidden items-center justify-center p-3 sm:p-4" style={{"background":"rgba(0,0,0,0.65)","backdropFilter":"blur(6px)"}}>
  <div className="bg-surface rounded-3xl shadow-2xl border border-outline-variant/30 w-full max-w-[500px] max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
    <div className="px-5 py-3.5 border-b border-outline-variant/15 flex items-center justify-between bg-surface/90 backdrop-blur-md">
      <div className="flex items-center gap-2 min-w-0">
        <span className="material-symbols-outlined text-primary text-xl">forum</span>
        <h3 id="thread-comments-title" className="font-bold text-sm text-on-surface truncate">Bình luận & Mẹo học</h3>
      </div>
      <button type="button" onClick={(event) => { try { (function(event){ window.closeThreadComments() }).call(this, event); } catch(e){ console.error(e); } }} className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container cursor-pointer transition-colors">
        <span className="material-symbols-outlined text-xl">close</span>
      </button>
    </div>

    {/* Comments list */}
    <div id="thread-comments-list" className="p-4 overflow-y-auto flex-1 flex flex-col overscroll-contain">
      {/* Rendered by JS */}
    </div>

    {/* Comment input */}
    <div className="p-3 sm:p-4 border-t border-outline-variant/15 bg-surface-container-lowest flex items-center gap-2">
      <input id="thread-comment-input" type="text" placeholder="Để lại mẹo nhớ từ hoặc lời nhắn..." onKeydown={(event) => { try { (function(event){ if(event.key==='Enter') window.submitThreadComment() }).call(this, event); } catch(e){ console.error(e); } }}
             className="flex-1 text-xs sm:text-sm px-3.5 py-2 rounded-full bg-surface border border-outline-variant/30 text-on-surface focus:border-primary focus:outline-hidden placeholder:text-outline"/>
      <button id="thread-comment-submit" type="button" onClick={(event) => { try { (function(event){ window.submitThreadComment() }).call(this, event); } catch(e){ console.error(e); } }}
              className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 active:scale-90 transition-transform cursor-pointer shadow-xs">
        <span className="material-symbols-outlined text-[18px]">send</span>
      </button>
    </div>
  </div>
</div>

{/* ==================== MODAL: TÌM KIẾM THƯ VIỆN NỔI BẬT ==================== */}
<div id="modal-library-search" className="fixed inset-0 z-[10000] hidden items-start justify-center pt-16 sm:pt-24 px-4" style={{"background":"rgba(0,0,0,0.7)","backdropFilter":"blur(10px)","WebkitBackdropFilter":"blur(10px)"}}>
  <div className="bg-surface rounded-2xl shadow-2xl border border-outline-variant/30 w-full max-w-[560px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
    <div className="p-4 flex items-center gap-3 border-b border-outline-variant/15">
      <span className="material-symbols-outlined text-primary text-2xl shrink-0">search</span>
      <input id="lib-modal-search-input" type="text" placeholder="Tìm bộ từ, tác giả, #hashtag..."
             aria-label="Tìm bộ từ, tác giả hoặc hashtag"
             onInput={(event) => { try { (function(event){ window.handleModalLibrarySearch(this.value) }).call(this, event); } catch(e){ console.error(e); } }}
             className="w-full text-sm sm:text-base bg-transparent border-0 focus:outline-hidden text-on-surface placeholder:text-outline" />
      <button type="button" onClick={(event) => { try { (function(event){ window.closeLibrarySearchModal() }).call(this, event); } catch(e){ console.error(e); } }} className="p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0">
        <span className="material-symbols-outlined text-xl">close</span>
      </button>
    </div>
    <div className="px-4 py-3 bg-surface-container-low flex items-center justify-between text-xs text-on-surface-variant flex-wrap gap-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-semibold text-outline">Gợi ý:</span>
        <button type="button" onClick={(event) => { try { (function(event){ window.handleModalQuickTag('IELTS') }).call(this, event); } catch(e){ console.error(e); } }} className="px-2 py-0.5 rounded-full bg-surface hover:bg-surface-container text-primary font-semibold transition-colors cursor-pointer">#IELTS</button>
        <button type="button" onClick={(event) => { try { (function(event){ window.handleModalQuickTag('THPT-QG') }).call(this, event); } catch(e){ console.error(e); } }} className="px-2 py-0.5 rounded-full bg-surface hover:bg-surface-container text-primary font-semibold transition-colors cursor-pointer">#THPT-QG</button>
        <button type="button" onClick={(event) => { try { (function(event){ window.handleModalQuickTag('C1-C2') }).call(this, event); } catch(e){ console.error(e); } }} className="px-2 py-0.5 rounded-full bg-surface hover:bg-surface-container text-primary font-semibold transition-colors cursor-pointer">#C1-C2</button>
        <button type="button" onClick={(event) => { try { (function(event){ window.handleModalQuickTag('Destination') }).call(this, event); } catch(e){ console.error(e); } }} className="px-2 py-0.5 rounded-full bg-surface hover:bg-surface-container text-primary font-semibold transition-colors cursor-pointer">#Destination</button>
      </div>
      <button type="button" onClick={(event) => { try { (function(event){ window.clearModalLibrarySearch() }).call(this, event); } catch(e){ console.error(e); } }} className="text-primary hover:underline font-semibold cursor-pointer shrink-0">Xóa</button>
    </div>
  </div>
</div>


    </>
  );
}

export default Modals;
