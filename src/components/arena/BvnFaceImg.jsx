// src/components/arena/BvnFaceImg.jsx
// Renders real BVN character portrait (face / face_bar / face_big / face_win) with PixelSprites fallback.
import React, { useEffect, useState } from 'react';
import { getCharacterById } from './CharacterRoster.js';
import { CharacterPortrait } from './PixelSprites.jsx';

export default function BvnFaceImg({
  characterId,
  variant = 'face', // 'face' | 'bar' | 'big' | 'win'
  size = 48,
  className = '',
  alt,
  flip = false,
}) {
  const char = getCharacterById(characterId);
  const src = char?.faces?.[variant] || char?.faces?.face;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <CharacterPortrait
        characterId={char?.fallbackId || 'tiger_blade'}
        size={size}
        className={className}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt || char.name}
      crossOrigin="anonymous"
      loading="lazy"
      onError={() => setFailed(true)}
      style={{
        width: variant === 'big' ? undefined : size,
        height: variant === 'big' ? undefined : size,
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
      className={`object-contain select-none ${className}`}
    />
  );
}
