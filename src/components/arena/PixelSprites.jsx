// src/components/arena/PixelSprites.jsx
// Crisp integer-grid SVG pixel/shonen fighter sprites, portraits & mode/skill emblems.
import React from 'react';
import { getCharacterById } from './CharacterRoster.js';

const INK = '#3D352E';

function resolveCharacterId(variant) {
  if (!variant || variant === 'tiger') return 'tiger_blade';
  if (variant === 'bot') return 'bot_churbito';
  if (variant === 'rival') return 'shadow_reaper';
  return variant;
}

/**
 * Animated 24x24 crisp sprite supporting all 8 selectable BVN-style HiVocab characters.
 */
export function PixelFighter({
  variant = 'tiger_blade',
  facing = 'right',
  anim = 'idle',
  size = 84,
  reduceFlash = false,
  className = '',
}) {
  const charId = resolveCharacterId(variant);
  const char = getCharacterById(charId);
  const p = char.palette;

  const animClass = (() => {
    if (anim === 'attack') {
      return facing === 'right' ? 'px-fighter-attack-right' : 'px-fighter-attack-left';
    }
    if (anim === 'hit') {
      return reduceFlash ? 'px-fighter-hit-noflash' : 'px-fighter-hit';
    }
    if (anim === 'victory') return 'px-fighter-victory';
    if (anim === 'defeat') return 'px-fighter-defeat';
    return 'px-fighter-idle';
  })();

  const flipStyle = facing === 'left' ? { transform: 'scaleX(-1)' } : undefined;
  const isBot = charId === 'bot_churbito';

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none ${animClass} ${className}`}
      style={{ width: size, height: size }}
    >
      {anim === 'victory' && (
        <div className="absolute -top-2 inset-x-0 flex justify-between px-1 pointer-events-none">
          <span className="font-bvn text-[11px] font-bold text-[#F4D06F] drop-shadow-[1px_1px_0_#000]">★</span>
          <span className="font-bvn text-[11px] font-bold text-[#38BDF8] drop-shadow-[1px_1px_0_#000]">✦</span>
        </div>
      )}

      {anim === 'defeat' && (
        <div className="absolute -top-2 inset-x-0 flex justify-center gap-2 pointer-events-none">
          <span className="font-bvn text-[11px] font-bold text-[#E66946] drop-shadow-[1px_1px_0_#000]">×</span>
          <span className="font-bvn text-[11px] font-bold text-[#F4D06F] drop-shadow-[1px_1px_0_#000]">★</span>
        </div>
      )}

      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        shapeRendering="crispEdges"
        style={{ imageRendering: 'pixelated', ...flipStyle }}
        aria-hidden="true"
      >
        {/* Ground shadow */}
        <rect x="5" y="22" width="14" height="2" fill="#000000" opacity="0.32" />

        {isBot ? (
          <>
            {/* Bot Churbito EX */}
            <rect x="11" y="1" width="2" height="2" fill={p.secondary} />
            <rect x="11" y="3" width="2" height="2" fill={INK} />
            <rect x="6" y="5" width="12" height="1" fill={INK} />
            <rect x="5" y="6" width="1" height="8" fill={INK} />
            <rect x="18" y="6" width="1" height="8" fill={INK} />
            <rect x="6" y="6" width="12" height="8" fill={p.hair} />
            <rect x="6" y="6" width="12" height="1" fill="#FFFDF7" />
            <rect x="7" y="8" width="10" height="5" fill={p.skin} />
            {anim === 'defeat' ? (
              <>
                <rect x="8" y="10" width="2" height="1" fill="#E66946" />
                <rect x="14" y="10" width="2" height="1" fill="#E66946" />
              </>
            ) : (
              <>
                <rect x="8" y="9" width="2" height="2" fill={p.eye} />
                <rect x="14" y="9" width="2" height="2" fill={p.eye} />
                <rect x="11" y="11" width="2" height="1" fill={p.secondary} />
              </>
            )}
            <rect x="6" y="14" width="12" height="1" fill={INK} />
            <rect x="7" y="15" width="10" height="5" fill={p.primary} />
            <rect x="6" y="15" width="1" height="5" fill={INK} />
            <rect x="17" y="15" width="1" height="5" fill={INK} />
            <rect x="10" y="16" width="4" height="3" fill={p.secondary} />
            <rect x="11" y="17" width="2" height="1" fill={p.trim} />
            <rect x="18" y="14" width="3" height="2" fill={p.secondary} />
            <rect x="20" y="6" width="2" height="10" fill={p.blade} />
            <rect x="21" y="4" width="1" height="2" fill="#FFFDF7" />
            <rect x="19" y="13" width="4" height="1" fill={INK} />
            <rect x="7" y="20" width="4" height="2" fill={INK} />
            <rect x="13" y="20" width="4" height="2" fill={INK} />
          </>
        ) : (
          <>
            {/* Distinctive Headgear / Spiky Shonen Hair or Tiger Ears */}
            {charId === 'tiger_blade' || charId === 'fox_shinobi' ? (
              <>
                <rect x="6" y="2" width="3" height="3" fill={p.hair} />
                <rect x="14" y="2" width="3" height="3" fill={p.hair} />
                <rect x="7" y="3" width="1" height="1" fill="#FFFDF7" />
                <rect x="15" y="3" width="1" height="1" fill="#FFFDF7" />
              </>
            ) : (
              <>
                <rect x="7" y="2" width="3" height="3" fill={p.hair} />
                <rect x="10" y="1" width="4" height="3" fill={p.hair} />
                <rect x="14" y="2" width="3" height="3" fill={p.hair} />
              </>
            )}

            {/* Flowing Cloak / Scarf Tail */}
            <rect x="2" y="13" width="4" height="5" fill={p.secondary} opacity="0.9" />
            <rect x="3" y="7" width="2" height="2" fill={p.secondary} />

            {/* Head Frame */}
            <rect x="7" y="4" width="9" height="1" fill={INK} />
            <rect x="5" y="5" width="1" height="8" fill={INK} />
            <rect x="17" y="5" width="1" height="8" fill={INK} />
            <rect x="6" y="5" width="11" height="8" fill={p.skin} />

            {/* Hairline / Headband */}
            <rect x="6" y="5" width="11" height="2" fill={p.hair} />
            <rect x="5" y="6" width="13" height="2" fill={p.secondary} />
            <rect x="10" y="6" width="3" height="1" fill={p.trim} />

            {/* Eyes */}
            {anim === 'victory' ? (
              <>
                <rect x="8" y="9" width="2" height="1" fill={p.eye} />
                <rect x="13" y="9" width="2" height="1" fill={p.eye} />
              </>
            ) : (
              <>
                <rect x="8" y="9" width="2" height="2" fill={p.eye} />
                <rect x="13" y="9" width="2" height="2" fill={p.eye} />
                <rect x="8" y="9" width="1" height="1" fill="#FFFFFF" />
                <rect x="13" y="9" width="1" height="1" fill="#FFFFFF" />
              </>
            )}

            {/* Collar / Scarf & Shonen Outfit */}
            <rect x="6" y="13" width="11" height="2" fill={p.secondary} />
            <rect x="6" y="15" width="11" height="5" fill={p.primary} />
            <rect x="5" y="15" width="1" height="5" fill={INK} />
            <rect x="17" y="15" width="1" height="5" fill={INK} />
            <rect x="9" y="15" width="5" height="4" fill={p.trim} />
            <rect x="11" y="16" width="1" height="3" fill={p.primary} />

            {/* Signature Weapon */}
            <rect x="19" y="4" width="2" height="10" fill={p.blade} />
            <rect x="20" y="3" width="1" height="9" fill={p.bladeEdge} />
            <rect x="18" y="14" width="4" height="2" fill={p.trim} />
            <rect x="19" y="16" width="2" height="2" fill={INK} />

            {/* Boots */}
            <rect x="7" y="20" width="3" height="2" fill={INK} />
            <rect x="13" y="20" width="3" height="2" fill={INK} />
          </>
        )}
      </svg>
    </div>
  );
}

/**
 * Framed BVN-style character portrait badge for HUD & Character Select Grid.
 */
export function CharacterPortrait({ characterId, size = 48, className = '' }) {
  const char = getCharacterById(resolveCharacterId(characterId));
  return (
    <div
      className={`relative rounded-lg border-2 border-[#3D352E] overflow-hidden flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${char.palette.primary}33 0%, ${char.accent}44 100%), #181C26`,
      }}
    >
      <PixelFighter variant={char.id} facing="right" anim="idle" size={Math.round(size * 0.92)} />
    </div>
  );
}

/**
 * Crisp 16x16 emblems for all PvP & Single-Player game modes.
 */
export function PixelModeIcon({ modeId, size = 32, className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated' }}
      className={className}
      aria-hidden="true"
    >
      {modeId === 'audio_sniper' ? (
        <>
          <rect x="2" y="6" width="3" height="4" fill={INK} />
          <rect x="5" y="4" width="3" height="8" fill="#2E7D9B" />
          <rect x="4" y="6" width="2" height="4" fill="#5AC8E8" />
          <rect x="10" y="5" width="1" height="6" fill="#2E7D9B" />
          <rect x="12" y="3" width="1" height="10" fill="#E66946" />
          <rect x="14" y="5" width="1" height="6" fill="#D99B26" />
        </>
      ) : modeId === 'word_duel' ? (
        <>
          <rect x="2" y="2" width="12" height="12" fill="#FCECE7" />
          <rect x="2" y="2" width="12" height="1" fill={INK} />
          <rect x="2" y="13" width="12" height="1" fill={INK} />
          <rect x="2" y="2" width="1" height="12" fill={INK} />
          <rect x="13" y="2" width="1" height="12" fill={INK} />
          <rect x="6" y="4" width="4" height="1" fill="#E66946" />
          <rect x="5" y="5" width="2" height="6" fill={INK} />
          <rect x="9" y="5" width="2" height="6" fill={INK} />
          <rect x="6" y="8" width="4" height="1" fill={INK} />
        </>
      ) : modeId === 'flash_match' ? (
        <>
          <rect x="1" y="3" width="7" height="9" fill="#FAF5EB" />
          <rect x="1" y="3" width="7" height="1" fill={INK} />
          <rect x="1" y="11" width="7" height="1" fill={INK} />
          <rect x="1" y="3" width="1" height="9" fill={INK} />
          <rect x="8" y="4" width="7" height="9" fill="#F4D06F" />
          <rect x="8" y="4" width="7" height="1" fill={INK} />
          <rect x="8" y="12" width="7" height="1" fill={INK} />
          <rect x="14" y="4" width="1" height="9" fill={INK} />
          <rect x="10" y="6" width="2" height="2" fill="#E66946" />
          <rect x="9" y="8" width="4" height="1" fill="#E66946" />
          <rect x="10" y="9" width="2" height="2" fill="#E66946" />
        </>
      ) : modeId === 'context_blade' ? (
        <>
          {/* Open scroll + violet slash */}
          <rect x="2" y="3" width="12" height="10" fill="#EDE9FE" />
          <rect x="2" y="3" width="12" height="1" fill={INK} />
          <rect x="2" y="12" width="12" height="1" fill={INK} />
          <rect x="4" y="5" width="8" height="1" fill="#7C3AED" />
          <rect x="4" y="7" width="5" height="1" fill={INK} />
          <rect x="4" y="9" width="7" height="1" fill="#7C3AED" />
          <rect x="11" y="7" width="3" height="2" fill="#E66946" />
        </>
      ) : modeId === 'survival_endless' ? (
        <>
          {/* Heart + crimson flame */}
          <rect x="3" y="4" width="4" height="3" fill="#E11D48" />
          <rect x="9" y="4" width="4" height="3" fill="#E11D48" />
          <rect x="2" y="5" width="12" height="4" fill="#E11D48" />
          <rect x="4" y="9" width="8" height="2" fill="#9F1239" />
          <rect x="6" y="11" width="4" height="2" fill="#9F1239" />
          <rect x="7" y="5" width="2" height="5" fill="#FDE047" />
          <rect x="5" y="7" width="6" height="1" fill="#FDE047" />
        </>
      ) : (
        <>
          {/* Crossed Swords (speed_blitz) */}
          <rect x="2" y="2" width="2" height="2" fill="#5A7E56" />
          <rect x="4" y="4" width="2" height="2" fill="#5A7E56" />
          <rect x="6" y="6" width="2" height="2" fill={INK} />
          <rect x="8" y="8" width="2" height="2" fill="#D99B26" />
          <rect x="10" y="10" width="3" height="2" fill={INK} />
          <rect x="12" y="2" width="2" height="2" fill="#E66946" />
          <rect x="10" y="4" width="2" height="2" fill="#E66946" />
          <rect x="8" y="6" width="2" height="2" fill={INK} />
          <rect x="6" y="8" width="2" height="2" fill="#D99B26" />
          <rect x="3" y="10" width="3" height="2" fill={INK} />
        </>
      )}
    </svg>
  );
}

export function PixelPowerupIcon({ powerupId, size = 22, className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated' }}
      className={className}
      aria-hidden="true"
    >
      {powerupId === 'fifty_fifty' ? (
        <>
          <rect x="3" y="3" width="3" height="3" fill="#E66946" />
          <rect x="3" y="10" width="3" height="3" fill="#E66946" />
          <rect x="6" y="6" width="2" height="4" fill={INK} />
          <rect x="8" y="5" width="3" height="2" fill="#5AC8E8" />
          <rect x="8" y="9" width="3" height="2" fill="#5AC8E8" />
          <rect x="11" y="3" width="3" height="2" fill={INK} />
          <rect x="11" y="11" width="3" height="2" fill={INK} />
        </>
      ) : powerupId === 'slow_audio' ? (
        <>
          <rect x="3" y="2" width="10" height="2" fill={INK} />
          <rect x="3" y="12" width="10" height="2" fill={INK} />
          <rect x="4" y="4" width="8" height="2" fill="#5AC8E8" />
          <rect x="6" y="6" width="4" height="2" fill="#F4D06F" />
          <rect x="6" y="8" width="4" height="2" fill="#2E7D9B" />
          <rect x="4" y="10" width="8" height="2" fill="#F4D06F" />
        </>
      ) : (
        <>
          <rect x="7" y="1" width="5" height="2" fill="#D99B26" />
          <rect x="5" y="3" width="5" height="3" fill="#F4D06F" />
          <rect x="4" y="6" width="8" height="2" fill="#E66946" />
          <rect x="7" y="8" width="4" height="3" fill="#F4D06F" />
          <rect x="5" y="11" width="4" height="4" fill="#D99B26" />
        </>
      )}
    </svg>
  );
}

export function PixelRankCrest({ color = '#5A7E56', bg = '#E7EFE3', size = 38, className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated' }}
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="2" width="10" height="1" fill={INK} />
      <rect x="2" y="3" width="1" height="7" fill={INK} />
      <rect x="13" y="3" width="1" height="7" fill={INK} />
      <rect x="3" y="10" width="2" height="2" fill={INK} />
      <rect x="11" y="10" width="2" height="2" fill={INK} />
      <rect x="5" y="12" width="2" height="2" fill={INK} />
      <rect x="9" y="12" width="2" height="2" fill={INK} />
      <rect x="7" y="14" width="2" height="1" fill={INK} />
      <rect x="3" y="3" width="10" height="7" fill={bg} />
      <rect x="5" y="10" width="6" height="2" fill={bg} />
      <rect x="7" y="12" width="2" height="2" fill={bg} />
      <rect x="6" y="4" width="4" height="6" fill={color} />
      <rect x="4" y="6" width="8" height="2" fill={color} />
      <rect x="7" y="6" width="2" height="2" fill="#FFFDF7" />
    </svg>
  );
}

export function PixelIcon({ name, size = 18, className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated' }}
      className={className}
      aria-hidden="true"
    >
      {name === 'trophy' && (
        <>
          <rect x="4" y="2" width="8" height="5" fill="#F4D06F" />
          <rect x="2" y="3" width="2" height="3" fill="#D99B26" />
          <rect x="12" y="3" width="2" height="3" fill="#D99B26" />
          <rect x="6" y="7" width="4" height="2" fill="#D99B26" />
          <rect x="7" y="9" width="2" height="3" fill={INK} />
          <rect x="4" y="12" width="8" height="2" fill={INK} />
        </>
      )}
      {name === 'crown' && (
        <>
          <rect x="2" y="4" width="2" height="6" fill="#F4D06F" />
          <rect x="7" y="3" width="2" height="7" fill="#F4D06F" />
          <rect x="12" y="4" width="2" height="6" fill="#F4D06F" />
          <rect x="4" y="7" width="8" height="3" fill="#D99B26" />
          <rect x="2" y="10" width="12" height="2" fill={INK} />
          <rect x="7" y="7" width="2" height="2" fill="#E66946" />
        </>
      )}
      {name === 'sword' && (
        <>
          <rect x="11" y="2" width="3" height="3" fill="#5AC8E8" />
          <rect x="9" y="4" width="3" height="3" fill="#FAF5EB" />
          <rect x="7" y="6" width="3" height="3" fill="#FAF5EB" />
          <rect x="4" y="8" width="5" height="2" fill="#D99B26" />
          <rect x="3" y="11" width="2" height="3" fill={INK} />
        </>
      )}
      {name === 'key' && (
        <>
          <rect x="2" y="5" width="5" height="5" fill="#D99B26" />
          <rect x="3" y="6" width="3" height="3" fill="#FAF5EB" />
          <rect x="7" y="7" width="7" height="2" fill={INK} />
          <rect x="10" y="9" width="1" height="2" fill={INK} />
          <rect x="13" y="9" width="1" height="2" fill={INK} />
        </>
      )}
      {name === 'pause' && (
        <>
          <rect x="4" y="3" width="3" height="10" fill={INK} />
          <rect x="9" y="3" width="3" height="10" fill={INK} />
        </>
      )}
      {name === 'speaker' && (
        <>
          <rect x="2" y="6" width="3" height="4" fill={INK} />
          <rect x="5" y="4" width="3" height="8" fill="#5A7E56" />
          <rect x="10" y="5" width="1" height="6" fill="#2E7D9B" />
          <rect x="12" y="3" width="1" height="10" fill="#2E7D9B" />
        </>
      )}
      {name === 'speaker_off' && (
        <>
          <rect x="2" y="6" width="3" height="4" fill={INK} />
          <rect x="5" y="4" width="3" height="8" fill="#A3988C" />
          <rect x="10" y="5" width="2" height="2" fill="#E66946" />
          <rect x="12" y="7" width="2" height="2" fill="#E66946" />
          <rect x="10" y="9" width="2" height="2" fill="#E66946" />
          <rect x="12" y="5" width="2" height="2" fill="#E66946" />
          <rect x="12" y="9" width="2" height="2" fill="#E66946" />
        </>
      )}
    </svg>
  );
}
