// src/components/landing/CrayonPopReveal.jsx
// Scroll-triggered springy pop-out wrapper ("nhảy ra" như sticker sáp màu khi lướt xuống).
import { useEffect, useRef, useState } from 'react';

export function CrayonPopReveal({
  children,
  variant = 'up', // 'up' | 'left' | 'right' | 'sticker'
  delay = 0,
  className = '',
  as: Tag = 'div',
}) {
  const ref = useRef(null);
  const [popped, setPopped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return undefined;

    if (!('IntersectionObserver' in window)) {
      setPopped(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setPopped(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -36px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const variantClass =
    variant === 'left'
      ? 'cr-pop-left'
      : variant === 'right'
        ? 'cr-pop-right'
        : variant === 'sticker'
          ? 'cr-pop-sticker'
          : 'cr-pop-up';

  return (
    <Tag
      ref={ref}
      style={{ '--cr-delay': `${delay}ms` }}
      className={`cr-pop ${variantClass} ${popped ? 'is-popped' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
}

export default CrayonPopReveal;
