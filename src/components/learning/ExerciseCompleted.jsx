// src/components/learning/ExerciseCompleted.jsx
// Session completion screen — pure React.

import { useEffect } from 'react';

function ratingLabel(w) {
  if (w.skipped) return { text: 'Bỏ qua', cls: 'bg-amber-100 text-amber-800' };
  if (w.isNew)   return { text: 'Từ mới',  cls: 'bg-primary/10 text-primary' };
  if (w.rating === 'easy') return { text: 'Dễ',  cls: 'bg-primary text-on-primary' };
  if (w.rating === 'good') return { text: 'Tốt', cls: 'bg-secondary-container text-on-secondary-container' };
  return { text: 'Khó', cls: 'bg-tertiary-fixed text-on-tertiary-fixed' };
}

export default function ExerciseCompleted({ completedWords, onGoHome }) {
  useEffect(() => {
    // Play completion sound
    if (typeof window !== 'undefined') window.HiSound?.playComplete?.();
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-4 mt-8 text-center px-4">
      {/* Trophy icon */}
      <div className="w-20 h-20 md:w-24 md:h-24 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-2 shadow-lg">
        <span className="material-symbols-outlined icon-fill" style={{ fontSize: '48px' }}>check_circle</span>
      </div>

      <h2 className="text-2xl md:text-4xl font-bold text-on-surface tracking-tight">Hoàn thành xuất sắc!</h2>
      <p className="text-on-surface-variant text-sm md:text-lg mb-2">
        Bạn đã củng cố thành công{' '}
        <span className="font-bold text-primary">{completedWords.length} từ vựng</span>{' '}
        vào bộ nhớ.
      </p>

      {/* Word summary */}
      <div className="w-full max-w-sm glass-card soft-shadow rounded-xl p-5 mt-2">
        <h3 className="font-bold text-on-surface mb-4 text-left text-xs uppercase tracking-wider text-outline">
          Kết quả phiên học
        </h3>
        <div className="flex flex-col gap-2">
          {completedWords.map((w, i) => {
            const { text, cls } = ratingLabel(w);
            return (
              <div key={i} className="flex items-center justify-between py-1 border-b border-outline-variant/10 last:border-0">
                <span className="font-medium text-on-surface text-sm">{w.word?.word || '—'}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${cls}`}>{text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onGoHome}
        className="w-full md:w-auto bg-primary text-on-primary px-8 py-3.5 rounded-xl md:rounded-full font-bold shadow-md hover:-translate-y-1 transition-transform mt-4"
      >
        Về Trang chủ
      </button>
    </div>
  );
}
