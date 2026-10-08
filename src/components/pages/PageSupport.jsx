// src/components/pages/PageSupport.jsx
// Trang hỗ trợ & CSKH HiVocab hỗ trợ song ngữ Tiếng Anh (Mặc định) và Tiếng Việt theo phong cách Cozy Crayon Handcrafted
import React, { useState } from 'react';
import { useRoute } from '../../router/RouteContext.jsx';
import { useLandingLang } from '../../context/LandingLangContext.jsx';
import LanguageSwitcher from '../common/LanguageSwitcher.jsx';

export function PageSupport() {
  const { navigateTo } = useRoute();
  const { isEn } = useLandingLang();

  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    message: '',
  });

  const handleCopyZalo = () => {
    const phone = '0846407898';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(phone).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {
        prompt(isEn ? 'Admin Zalo / Phone:' : 'Số điện thoại Zalo Admin:', phone);
      });
    } else {
      prompt(isEn ? 'Admin Zalo / Phone:' : 'Số điện thoại Zalo Admin:', phone);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = formData.name.trim() || (isEn ? 'Friend' : 'Bạn');
    if (isEn) {
      alert(`Thank you ${name}! HiVocab has received your message. For urgent assistance, please contact Admin directly via Zalo / WhatsApp at +84 846 407 898!`);
    } else {
      alert(`Cảm ơn ${name}! HiVocab đã tiếp nhận thông tin của bạn. Nếu cần xử lý gấp, bạn có thể nhắn tin trực tiếp qua Zalo Admin: 0846 407 898 nhé!`);
    }
    setFormData({ name: '', contact: '', message: '' });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div
      id="page-support"
      className="page active min-h-screen font-nunito text-[#3D352E] bg-[#FAF5EB] relative flex flex-col justify-between selection:bg-[#EBDDC8] selection:text-[#3D352E]"
      style={{
        backgroundImage: 'radial-gradient(#E2D6C3 1.2px, transparent 1.2px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* ── TOP CRAYON HEADER & NAVIGATION BAR ── */}
      <header className="sticky top-0 z-40 w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-3 sm:py-3.5 bg-[#FAF5EB]/95 backdrop-blur-md border-b-2 border-[#3D352E]/10 transition-all">
        <div className="w-full flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Logo app */}
          <div
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group shrink-0"
            title={isEn ? "Back to Home" : "Về trang chủ"}
          >
            <div className="relative w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center transition-transform group-hover:scale-105">
              <img
                src="/logo-hi-transparent.png"
                alt="HiVocab Logo"
                className="w-full h-full object-contain filter drop-shadow-xs"
                onError={(e) => {
                  e.currentTarget.src = '/mascot/mascot_cozy.png';
                }}
              />
            </div>
            <span className="font-quicksand font-bold text-sm sm:text-base md:text-lg tracking-tight text-[#3D352E] leading-none">
              HiVocab
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Điều hướng trang"
            className="hidden md:flex items-center gap-2 bg-white border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] rounded-full px-4 py-1.5"
          >
            <button
              type="button"
              onClick={() => navigateTo('landing')}
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
            >
              {isEn ? '🏠 Home' : '🏠 Trang chủ'}
            </button>
            <span className="text-[#DECDBB] select-none">•</span>
            <button
              type="button"
              onClick={() => navigateTo('features')}
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
            >
              {isEn ? '🎨 Features' : '🎨 Tính năng'}
            </button>
            <span className="text-[#DECDBB] select-none">•</span>
            <button
              type="button"
              onClick={() => navigateTo('reviews')}
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
            >
              {isEn ? '💬 Reviews' : '💬 Đánh giá'}
            </button>
            <span className="text-[#DECDBB] select-none">•</span>
            <button
              type="button"
              onClick={() => navigateTo('faq')}
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
            >
              {isEn ? '💡 FAQ' : '💡 FAQ'}
            </button>
            <span className="text-[#DECDBB] select-none">•</span>
            <button
              type="button"
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#DE5D53] bg-[#FDEAE2] rounded-full transition-all cursor-pointer"
            >
              {isEn ? '💌 Support' : '💌 Hỗ trợ'}
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSwitcher />

            <button
              type="button"
              onClick={() => navigateTo('dashboard')}
              className="px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-black rounded-xl sm:rounded-2xl bg-[#DE5D53] hover:bg-[#C84F45] text-white border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{isEn ? 'Learn Now' : 'Vào học ngay'}</span>
              <span className="text-xs sm:text-sm">🚀</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        
        {/* Header Intro */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF3E7] text-[#557A46] text-xs font-black uppercase tracking-wider border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
            <span>🎧</span>
            <span>{isEn ? 'Support Center & Helpdesk' : 'Trung tâm hỗ trợ & CSKH'}</span>
          </div>

          <h1 className="font-quicksand font-black text-3xl sm:text-5xl text-[#3D352E] tracking-tight">
            {isEn ? 'How Can We Help You? 💌' : 'Chúng tôi có thể giúp gì cho bạn? 💌'}
          </h1>

          <p className="text-sm sm:text-base text-[#6E5D53] font-medium max-w-lg mx-auto leading-relaxed">
            {isEn
              ? 'HiVocab is here to support your learning journey. Our team is available 24/7 for technical assistance, questions, and feedback.'
              : 'Website HiVocab mới ra mắt, Admin sẵn sàng hỗ trợ kỹ thuật và lắng nghe góp ý 24/7.'}
          </p>
        </div>

        {/* ── ZALO ADMIN CARD ── */}
        <div className="bg-white border-[3px] border-[#3D352E] rounded-3xl p-6 sm:p-8 mb-6 shadow-[5px_6px_0px_#3D352E] relative overflow-hidden">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-[#0068FF] text-white flex items-center justify-center font-black text-2xl shadow-xs shrink-0">
                Z
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF3E7] text-[#557A46] text-[11px] font-black border border-[#557A46]/30">
                  <span className="w-2 h-2 rounded-full bg-[#557A46] animate-pulse"></span>
                  <span>{isEn ? 'Online 24/7 • Response in 5 mins' : 'Trực tuyến 24/7 • Phản hồi trong 5 phút'}</span>
                </div>
                <h2 className="font-quicksand font-black text-lg sm:text-xl text-[#3D352E] mt-1">
                  {isEn ? 'Official Zalo Support Channel' : 'Kênh Zalo Hỗ Trợ Chính Thức'}
                </h2>
              </div>
            </div>
          </div>

          <div className="bg-[#FAF5EB] rounded-2xl p-4 mb-5 border-2 border-[#3D352E] flex items-center justify-between gap-3">
            <div>
              <span className="text-xs text-[#78685E] font-bold block">
                {isEn ? 'Admin Phone / Zalo ID:' : 'Số điện thoại / Zalo Admin:'}
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#DE5D53] tracking-wider font-mono">
                0846 407 898
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyZalo}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F2ECE0] text-[#3D352E] text-xs font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer shrink-0"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? (isEn ? 'Copied!' : 'Đã chép số!') : (isEn ? 'Copy' : 'Sao chép')}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://zalo.me/0846407898"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-[#0068FF] hover:bg-[#0054cc] text-white font-black text-xs sm:text-sm rounded-2xl border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer"
            >
              <span>💬</span>
              <span>{isEn ? 'Open Zalo Chat Now' : 'Nhắn tin Zalo ngay'}</span>
            </a>
            <a
              href="tel:0846407898"
              className="flex items-center justify-center gap-2 py-3 px-5 bg-white hover:bg-[#FAF5EB] text-[#3D352E] font-black text-xs sm:text-sm rounded-2xl border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer"
            >
              <span>📞</span>
              <span>{isEn ? 'Call Directly' : 'Gọi trực tiếp'}</span>
            </a>
          </div>
        </div>

        {/* ── WELCOME & 2-MONTH GIFT NOTICE ── */}
        <div className="bg-[#FFFDF9] border-[2.5px] border-[#3D352E] rounded-2xl p-5 mb-6 shadow-[3px_4px_0px_#3D352E] flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEF9EE] border-2 border-[#3D352E] flex items-center justify-center text-2xl shrink-0 shadow-2xs">
            🎁
          </div>
          <div className="text-xs sm:text-sm leading-relaxed text-[#5C4F46]">
            <h3 className="font-quicksand font-black text-base text-[#3D352E] mb-1">
              {isEn ? 'Official Launch: Complimentary 2 Months Full Access!' : 'Website mới ra mắt & Tặng 2 tháng Full tính năng'}
            </h3>
            <p>
              {isEn
                ? 'HiVocab has officially launched with over 66,000 words and Active Bilingual Reading. If you encounter any bugs or sync issues, please screenshot and send to Zalo 0846 407 898 so our team can resolve it immediately!'
                : 'HiVocab vừa chính thức ra mắt với hơn 66.000 từ vựng và Chế độ Đọc Chủ Động. Trong quá trình học, nếu bạn gặp bất kỳ lỗi hiển thị hay đồng bộ nào, xin vui lòng chụp ảnh màn hình gửi qua Zalo 0846 407 898 để Admin khắc phục ngay lập tức nhé!'}
            </p>
          </div>
        </div>

        {/* ── QUICK TOPICS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <a
            href="https://zalo.me/0846407898"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border-2 border-[#3D352E] rounded-2xl p-4 flex items-center gap-3.5 shadow-[2.5px_3px_0px_#3D352E] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-[#FEEFEA] border-2 border-[#3D352E] flex items-center justify-center text-xl shrink-0">
              🐞
            </div>
            <div>
              <h4 className="font-quicksand font-black text-sm text-[#3D352E]">
                {isEn ? 'Bug & Issue Report' : 'Báo lỗi kỹ thuật'}
              </h4>
              <p className="text-[11px] font-semibold text-[#86756C]">
                {isEn ? 'Display, audio, or sync concerns' : 'Sự cố hiển thị, âm thanh, đồng bộ'}
              </p>
            </div>
          </a>

          <a
            href="https://zalo.me/0846407898"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border-2 border-[#3D352E] rounded-2xl p-4 flex items-center gap-3.5 shadow-[2.5px_3px_0px_#3D352E] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-[#EAF3E7] border-2 border-[#3D352E] flex items-center justify-center text-xl shrink-0">
              🎓
            </div>
            <div>
              <h4 className="font-quicksand font-black text-sm text-[#3D352E]">
                {isEn ? 'Study Roadmap Consultation' : 'Tư vấn lộ trình học'}
              </h4>
              <p className="text-[11px] font-semibold text-[#86756C]">
                {isEn ? 'How to conquer Cam 10–21 & Vol 1–9' : 'Hướng dẫn cày Cam 10–21 & Vol 1–9'}
              </p>
            </div>
          </a>
        </div>

        {/* ── CONTACT FORM ── */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border-[2.5px] border-[#3D352E] rounded-3xl p-6 sm:p-8 flex flex-col gap-4 shadow-[4px_5px_0px_#3D352E]"
        >
          <div>
            <h2 className="font-quicksand font-black text-lg text-[#3D352E]">
              {isEn ? 'Send a Message or Feedback' : 'Gửi tin nhắn hoặc góp ý'}
            </h2>
            <p className="text-xs text-[#78685E] mt-0.5">
              {isEn
                ? 'We value every suggestion to make HiVocab better each day.'
                : 'Chúng tôi trân trọng từng ý kiến đóng góp của bạn để hoàn thiện HiVocab mỗi ngày.'}
            </p>
          </div>

          {submitted && (
            <div className="p-3.5 bg-[#EAF3E7] text-[#557A46] border-2 border-[#557A46] rounded-xl text-xs font-black">
              {isEn
                ? '✓ Message submitted successfully! Admin will get back to you shortly.'
                : '✓ Đã gửi thông tin thành công! Admin sẽ phản hồi bạn trong thời gian sớm nhất.'}
            </div>
          )}

          <div>
            <label htmlFor="support-name" className="block text-xs font-black text-[#3D352E] uppercase tracking-wider mb-1.5">
              {isEn ? 'Your Name' : 'Họ và tên'}
            </label>
            <input
              type="text"
              id="support-name"
              required
              placeholder={isEn ? "Alex Smith" : "Nguyễn Văn A"}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-[#FAF5EB] border-2 border-[#3D352E] focus:bg-white px-4 py-2.5 rounded-xl outline-none text-[#3D352E] text-xs sm:text-sm font-bold transition-colors"
            />
          </div>

          <div>
            <label htmlFor="support-contact" className="block text-xs font-black text-[#3D352E] uppercase tracking-wider mb-1.5">
              {isEn ? 'Email or Phone / Zalo' : 'Email hoặc Số điện thoại (Zalo)'}
            </label>
            <input
              type="text"
              id="support-contact"
              required
              placeholder={isEn ? "example@email.com" : "Ví dụ: nam@gmail.com hoặc 0912..."}
              value={formData.contact}
              onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
              className="w-full bg-[#FAF5EB] border-2 border-[#3D352E] focus:bg-white px-4 py-2.5 rounded-xl outline-none text-[#3D352E] text-xs sm:text-sm font-bold transition-colors"
            />
          </div>

          <div>
            <label htmlFor="support-message" className="block text-xs font-black text-[#3D352E] uppercase tracking-wider mb-1.5">
              {isEn ? 'Message / Bug Description' : 'Nội dung câu hỏi / Báo lỗi'}
            </label>
            <textarea
              id="support-message"
              required
              placeholder={isEn ? "Describe your question or the issue you found..." : "Mô tả chi tiết câu hỏi hoặc lỗi bạn gặp phải..."}
              rows="4"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="w-full bg-[#FAF5EB] border-2 border-[#3D352E] focus:bg-white px-4 py-2.5 rounded-xl outline-none resize-none text-[#3D352E] text-xs sm:text-sm font-bold transition-colors"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-[#557A46] hover:bg-[#476739] text-white font-black py-3.5 rounded-2xl border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer text-sm"
          >
            <span>✉️</span>
            <span>{isEn ? 'Send to Admin' : 'Gửi thông tin cho Admin'}</span>
          </button>
        </form>
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-16 border-t-2 border-dashed border-[#DECDBB] bg-[#FFFDF9]/80 text-[#6E5D53] text-xs py-8 px-4 sm:px-8 text-center">
        <p>© 2026 HiVocab (hivocab.site). {isEn ? 'All rights reserved.' : 'Bản quyền tập vẽ sáp màu được bảo lưu.'}</p>
      </footer>
    </div>
  );
}

export default PageSupport;
