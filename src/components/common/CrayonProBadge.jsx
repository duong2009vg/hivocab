// src/components/common/CrayonProBadge.jsx
// Huy hiệu PRO phong cách Sáp màu Cozy Crayon (HiVocab Design System) - 100% Vector Lucide
import React from 'react';
import { Crown, Lock, Star, Flame } from 'lucide-react';

const BADGE_VARIANTS = {
  crown: {
    bg: 'bg-[#FFE8C2]',
    text: 'text-[#8C5311]',
    border: 'border-[#3D352E]',
    iconType: 'crown',
    defaultLabel: 'PRO',
  },
  pro: {
    bg: 'bg-[#FFE8C2]',
    text: 'text-[#8C5311]',
    border: 'border-[#3D352E]',
    iconType: 'crown',
    defaultLabel: 'HiVocab PRO',
  },
  lock: {
    bg: 'bg-[#FFE8C2]',
    text: 'text-[#8C5311]',
    border: 'border-[#3D352E]',
    iconType: 'lock',
    defaultLabel: 'Gói PRO',
  },
  lifetime: {
    bg: 'bg-[#F3E8FF]',
    text: 'text-[#6B21A8]',
    border: 'border-[#3D352E]',
    iconType: 'crown',
    defaultLabel: 'Trọn Đời',
  },
  trial: {
    bg: 'bg-[#E3EDE2]',
    text: 'text-[#4D6B53]',
    border: 'border-[#3D352E]',
    iconType: 'star',
    defaultLabel: 'Trải Nghiệm',
  },
  discount: {
    bg: 'bg-[#FBECE7]',
    text: 'text-[#C85A3F]',
    border: 'border-[#3D352E]',
    iconType: 'flame',
    defaultLabel: 'Tiết Kiệm 50%',
  },
  mini: {
    bg: 'bg-[#FFE8C2]',
    text: 'text-[#8C5311]',
    border: 'border-[#3D352E]',
    iconType: 'crown',
    defaultLabel: 'PRO',
  },
  compact: {
    bg: 'bg-[#FFE8C2]',
    text: 'text-[#8C5311]',
    border: 'border-[#3D352E]',
    iconType: 'crown',
    defaultLabel: 'PRO',
  },
};

const BADGE_SIZES = {
  xs: 'text-[9px] px-1.5 py-0.5 gap-0.5 border shadow-[1px_1px_0px_#3D352E]',
  sm: 'text-[11px] px-2.5 py-0.5 gap-1 border-2 shadow-crayonSm',
  md: 'text-xs px-3 py-1 gap-1.5 border-2 shadow-crayonSm',
  lg: 'text-sm px-4 py-1.5 gap-2 border-2 shadow-crayon',
};

function renderBadgeIcon(iconProp, iconType, size) {
  if (iconProp !== undefined) {
    if (typeof iconProp === 'string') {
      if (iconProp === '\u{1F451}') return <Crown className="w-3 h-3 shrink-0" />;
      if (iconProp === '\u{1F512}') return <Lock className="w-3 h-3 shrink-0" />;
      if (iconProp === '\u{2B50}') return <Star className="w-3 h-3 shrink-0" />;
      if (iconProp === '\u{1F525}') return <Flame className="w-3 h-3 shrink-0" />;
      return <span>{iconProp}</span>;
    }
    return iconProp;
  }
  const iconCls = size === 'xs' ? 'w-2.5 h-2.5 shrink-0' : 'w-3 h-3 shrink-0';
  switch (iconType) {
    case 'crown':
      return <Crown className={iconCls} />;
    case 'lock':
      return <Lock className={iconCls} />;
    case 'star':
      return <Star className={iconCls} />;
    case 'flame':
      return <Flame className={iconCls} />;
    default:
      return null;
  }
}

export function CrayonProBadge({
  variant = 'crown',
  size = 'sm',
  text,
  icon,
  rotate = false,
  onClick,
  className = '',
  title,
}) {
  const cfg = BADGE_VARIANTS[variant] || BADGE_VARIANTS.crown;
  const effectiveSize = variant === 'mini' ? 'xs' : size;
  const sizeClass = BADGE_SIZES[effectiveSize] || BADGE_SIZES.sm;
  const displayLabel = text !== undefined ? text : cfg.defaultLabel;
  const iconElement = renderBadgeIcon(icon, cfg.iconType, effectiveSize);

  let rotateStyle = {};
  if (typeof rotate === 'string') {
    rotateStyle = { transform: `rotate(${rotate})` };
  } else if (rotate === true) {
    rotateStyle = { transform: 'rotate(-2deg)' };
  }

  const isClickable = typeof onClick === 'function';

  return (
    <span
      onClick={onClick}
      style={rotateStyle}
      title={title || (typeof displayLabel === 'string' ? displayLabel : 'HiVocab PRO')}
      className={`profile-pro-badge inline-flex items-center justify-center font-heading font-black rounded-full select-none transition-all ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClass} ${
        isClickable
          ? 'cursor-pointer active:translate-y-0.5 active:shadow-[0.5px_0.5px_0px_#3D352E] hover:-translate-y-0.5'
          : ''
      } ${className}`}
    >
      {iconElement && <span className="leading-none shrink-0 inline-flex items-center">{iconElement}</span>}
      {displayLabel && <span className="leading-none tracking-tight">{displayLabel}</span>}
    </span>
  );
}

export default CrayonProBadge;
