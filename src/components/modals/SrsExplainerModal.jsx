// src/components/modals/SrsExplainerModal.jsx
// Pure React SRS Explainer Modal
import React from 'react';
import { useModal } from '../../context/ModalContext.jsx';

export function SrsExplainerModal() {
  const { modals, closeModal } = useModal();
  const isOpen = modals.srsExplainer?.open;

  if (!isOpen) return null;

  return (
    <div
      id="modal-srs-explainer"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal('srsExplainer'); }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg bg-surface rounded-3xl p-6 md:p-8 shadow-2xl fade-in max-h-[90vh] overflow-y-auto border border-outline-variant/20">
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
          <button
            type="button"
            onClick={() => closeModal('srsExplainer')}
            className="p-2 rounded-full text-outline hover:bg-surface-container-low transition-colors cursor-pointer"
          >
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
              <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: '#94a3b8' }}></span>
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
              <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: '#f97316' }}></span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface">Cấp 1 (Lvl 1) · Vừa tiếp xúc</span>
                  <span className="text-[11px] font-bold text-amber-600">Ôn lại sau 1 giờ</span>
                </div>
                <p className="text-[11px] text-on-surface-variant/80 mt-0.5">Vừa ghi nhớ sơ khởi. Não bộ cần củng cố lại nhanh chóng để tạo liên kết bền vững.</p>
              </div>
            </div>

            {/* Lvl 2 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
              <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: '#f59e0b' }}></span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface">Cấp 2 (Lvl 2) · Bắt đầu quen</span>
                  <span className="text-[11px] font-bold text-amber-500">Ôn lại sau 8 giờ</span>
                </div>
                <p className="text-[11px] text-on-surface-variant/80 mt-0.5">Đã nhớ được nghĩa cơ bản. Ôn lần thứ hai trong cùng ngày học.</p>
              </div>
            </div>

            {/* Lvl 3 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
              <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: '#0ea5e9' }}></span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface">Cấp 3 (Lvl 3) · Đang củng cố</span>
                  <span className="text-[11px] font-bold text-blue-500">Ôn lại sau 1 ngày (24h)</span>
                </div>
                <p className="text-[11px] text-on-surface-variant/80 mt-0.5">Vượt qua giấc ngủ củng cố trí nhớ đầu tiên. Đã có thể nhận diện từ trong bài đọc.</p>
              </div>
            </div>

            {/* Lvl 4 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
              <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: '#a855f7' }}></span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface">Cấp 4 (Lvl 4) · Ghi nhớ tốt</span>
                  <span className="text-[11px] font-bold text-purple-500">Ôn lại sau 7 ngày</span>
                </div>
                <p className="text-[11px] text-on-surface-variant/80 mt-0.5">Từ vựng đã bước vào bộ nhớ trung hạn, sẵn sàng phản xạ tự nhiên.</p>
              </div>
            </div>

            {/* Lvl 5 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
              <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: '#10b981' }}></span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface">Cấp 5 (Lvl 5) · Trí nhớ vĩnh viễn (Mastered)</span>
                  <span className="text-[11px] font-bold text-emerald-600">Ôn lại sau 30 ngày</span>
                </div>
                <p className="text-[11px] text-on-surface-variant/80 mt-0.5">Đã khắc sâu vào bộ nhớ dài hạn. Bạn hiếm khi quên từ này nữa!</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-on-surface-variant leading-relaxed">
            <span className="font-bold text-primary block mb-1">💡 Quy tắc thăng / hạ cấp độ:</span>
            Mỗi khi trả lời <strong>Đúng (Nhớ / Rất dễ)</strong>, từ sẽ thăng 1 cấp. Nếu chọn <strong>Chưa nhớ / Quên</strong>, từ sẽ lập tức trở về <strong>Cấp 1</strong> để bạn ôn luyện lại ngay lập tức!
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => closeModal('srsExplainer')}
            className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs sm:text-sm shadow-xs hover:bg-surface-tint active:scale-95 transition-all cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}

export default SrsExplainerModal;
