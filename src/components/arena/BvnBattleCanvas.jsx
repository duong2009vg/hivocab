// src/components/arena/BvnBattleCanvas.jsx
// 60fps HTML5 2D Canvas BVN Combat Engine: authentic extracted sprites, afterimage dashes,
// multi-step console-style combos (attack1->attack2->attack3, signature skill + projectile), and Super Ultimate Cut-In!
import React, { useEffect, useRef } from 'react';
import { loadFighterPack, loadMapStage } from '../../services/bvnAssetLoader.js';
import { getCharacterById, getStageById } from './CharacterRoster.js';

const WORLD_W = 960;
const WORLD_H = 440;
const MIN_BATTLE_VIEW_W = 540;
const P1_REST_X = 270;
const P2_REST_X = 690;
const PREVIEW_REST_X = 480;

function makeActor(id, restX, facing) {
  return {
    id,
    pack: null,
    x: restX,
    restX,
    facing,
    clip: 'idle',
    frameIdx: 0,
    frameTimer: 0,
    knockX: 0,
    flashTimer: 0,
    auraTimer: 0,
    hurtTimer: 0,
    koMode: null, // null | 'win' | 'lose'
    queue: [], // scripted console-style step queue
    currentStep: null,
    ghostTimer: 0,
    afterimages: [], // { x, clip, frameIdx, facing, alpha }
  };
}

function resolveClip(pack, name) {
  const clips = pack?.meta?.clips;
  if (!clips) return null;
  if (clips[name]?.frames?.length) return clips[name];
  if (name === 'attack1' || name === 'attack2' || name === 'attack3') {
    if (clips.attack?.frames?.length) return clips.attack;
  }
  if (name === 'walk' && clips.dash?.frames?.length) return clips.dash;
  if (name === 'skill' && clips.super?.frames?.length) return clips.super;
  if (name === 'skill' && clips.attack?.frames?.length) return clips.attack;
  return clips.idle || null;
}

function getActorScale(pack, previewMode) {
  const baseH = Math.max(36, Math.min(84, Number(pack?.meta?.baseHeight) || 50));
  const desiredH = previewMode ? 174 : 166;
  return Math.max(2.0, Math.min(3.5, desiredH / baseH));
}

function drawGroundShadow(ctx, x, y, scaleX = 1) {
  ctx.save();
  ctx.fillStyle = 'rgba(7, 10, 16, 0.45)';
  ctx.beginPath();
  ctx.ellipse(x, y + 3, 40 * scaleX, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLoadingAura(ctx, x, y, color) {
  const pulse = 0.55 + Math.sin(performance.now() * 0.008) * 0.25;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = color || '#38BDF8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 34, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSpriteFrame(ctx, pack, clipName, frameIdx, x, groundY, facing, scale, alpha = 1, flash = false, tint = null) {
  const clipObj = resolveClip(pack, clipName);
  const frames = clipObj?.frames || [];
  if (!frames.length || !pack.sheet) return;
  const fr = frames[Math.max(0, Math.min(frames.length - 1, frameIdx))];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, groundY);
  ctx.scale(facing * scale, scale);
  if (flash) {
    ctx.filter = 'brightness(1.85) saturate(1.2)';
  } else if (tint) {
    ctx.filter = tint;
  }
  ctx.drawImage(pack.sheet, fr.x, fr.y, fr.w, fr.h, -fr.ax, -fr.ay, fr.w, fr.h);
  ctx.restore();
}

function drawActor(ctx, actor, groundY, previewMode, charColor) {
  const drawX = actor.x + actor.knockX;
  drawGroundShadow(ctx, drawX, groundY, actor.clip === 'super' ? 1.3 : 1);

  const pack = actor.pack;
  if (!pack || !pack.sheet || !pack.meta?.clips) {
    // Subtle chakra ring while R2 spritesheet loads (never an ugly stick figure!)
    drawLoadingAura(ctx, drawX, groundY, charColor);
    return;
  }

  const scale = getActorScale(pack, previewMode);

  // 1. Translucent BVN Shunpo / Speed Afterimages
  for (const gh of actor.afterimages) {
    drawSpriteFrame(
      ctx,
      pack,
      gh.clip,
      gh.frameIdx,
      gh.x,
      groundY,
      gh.facing,
      scale,
      gh.alpha * 0.45,
      false,
      'saturate(1.6) brightness(1.15)'
    );
  }

  // 2. Powerup / Ulti / Mana Aura behind fighter
  if (actor.auraTimer > 0) {
    const ratio = Math.min(1, actor.auraTimer / 0.8);
    ctx.save();
    ctx.globalAlpha = 0.6 * ratio;
    const grad = ctx.createRadialGradient(drawX, groundY - 60, 10, drawX, groundY - 60, 95);
    grad.addColorStop(0, '#FFFDF7');
    grad.addColorStop(0.45, charColor || '#F4D06F');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(drawX, groundY - 60, 95, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Real BVN Character Sprite anchored accurately on groundY
  drawSpriteFrame(
    ctx,
    pack,
    actor.clip,
    actor.frameIdx,
    drawX,
    groundY,
    actor.facing,
    scale,
    1,
    actor.flashTimer > 0
  );
}

// Authentic anime multi-ray starburst impact (like BVN hits!)
function drawAnimeStarburst(ctx, burst) {
  const p = burst.age / burst.maxAge;
  const alpha = Math.max(0, 1 - p * p);
  const rays = burst.isSuper ? 12 : 8;
  const outerR = burst.radius * (0.45 + p * 0.85);
  const innerR = outerR * 0.34;

  ctx.save();
  ctx.translate(burst.x, burst.y);
  ctx.rotate(burst.rot + p * 0.35);
  ctx.globalAlpha = alpha;

  // Outer spiky starburst
  ctx.fillStyle = burst.color;
  ctx.beginPath();
  for (let i = 0; i < rays * 2; i += 1) {
    const r = i % 2 === 0 ? outerR : innerR;
    const ang = (Math.PI * i) / rays;
    const px = Math.cos(ang) * r;
    const py = Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Bright white-gold core
  ctx.fillStyle = '#FFFDF7';
  ctx.beginPath();
  ctx.arc(0, 0, innerR * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // Expanding shockwave ring
  ctx.strokeStyle = burst.isSuper ? '#FDE047' : burst.color;
  ctx.lineWidth = (burst.isSuper ? 5 : 3) * (1 - p);
  ctx.beginPath();
  ctx.arc(0, 0, outerR * 1.15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export default function BvnBattleCanvas({
  p1Id = 'ichigo',
  p2Id = 'naruto',
  stageId = 'muyecun',
  combatEvent = null,
  previewTrigger = null,
  comboCount = 0,
  doubleStrikeActive = false,
  reduceShake = false,
  reduceFlash = false,
  previewMode = false,
  transparentBg = false,
  className = '',
}) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    p1: makeActor(p1Id, previewMode ? PREVIEW_REST_X : P1_REST_X, 1),
    p2: makeActor(p2Id, P2_REST_X, -1),
    mapStage: null,
    camX: 0,
    camTargetX: 0,
    camZoom: 1,
    camTargetZoom: 1,
    visWidth: WORLD_W,
    maxPanX: 76,
    trauma: 0,
    hitStop: 0,
    screenFlash: 0,
    darkOverlay: 0,
    starbursts: [],
    projectiles: [],
    smokes: [],
    sparks: [],
    cutIn: null,
    moveCycle: 0,
    previewMode,
    transparentBg,
    reduceShake,
    reduceFlash,
    p1Meta: getCharacterById(p1Id),
    p2Meta: getCharacterById(p2Id),
    stageMeta: getStageById(stageId),
    lastEventId: null,
    lastPreviewId: null,
  });

  stateRef.current.previewMode = previewMode;
  stateRef.current.transparentBg = transparentBg;
  stateRef.current.reduceShake = reduceShake;
  stateRef.current.reduceFlash = reduceFlash;
  stateRef.current.p1Meta = getCharacterById(p1Id);
  stateRef.current.p2Meta = getCharacterById(p2Id);
  stateRef.current.stageMeta = getStageById(stageId);

  useEffect(() => {
    let cancelled = false;
    const s = stateRef.current;
    s.p1.id = p1Id;
    s.p1.restX = previewMode ? PREVIEW_REST_X : P1_REST_X;
    if (!s.p1.currentStep && !s.p1.queue.length) s.p1.x = s.p1.restX;
    loadFighterPack(p1Id).then((pack) => {
      if (!cancelled && pack && stateRef.current.p1.id === p1Id) {
        stateRef.current.p1.pack = pack;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [p1Id, previewMode]);

  useEffect(() => {
    if (previewMode || !p2Id) return undefined;
    let cancelled = false;
    const s = stateRef.current;
    s.p2.id = p2Id;
    loadFighterPack(p2Id).then((pack) => {
      if (!cancelled && pack && stateRef.current.p2.id === p2Id) {
        stateRef.current.p2.pack = pack;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [p2Id, previewMode]);

  useEffect(() => {
    let cancelled = false;
    loadMapStage(stageId).then((stage) => {
      if (!cancelled && stage) {
        stateRef.current.mapStage = stage;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [stageId]);

  const spawnHitEffects = (x, y, color, { isSuper = false, withSmoke = false } = {}) => {
    const s = stateRef.current;
    s.starbursts.push({
      x,
      y,
      color: isSuper ? '#F97316' : color || '#F59E0B',
      radius: isSuper ? 88 : 54,
      rot: Math.random() * Math.PI,
      age: 0,
      maxAge: isSuper ? 0.34 : 0.24,
      isSuper,
    });

    if (withSmoke || isSuper) {
      const puffs = isSuper ? 7 : 4;
      for (let i = 0; i < puffs; i += 1) {
        s.smokes.push({
          x: x + (Math.random() - 0.5) * 48,
          y: y + (Math.random() - 0.5) * 34,
          vx: (Math.random() - 0.5) * 70,
          vy: -35 - Math.random() * 55,
          r: (isSuper ? 22 : 16) + Math.random() * 14,
          color: isSuper ? '#FED7AA' : '#E2E8F0',
          age: 0,
          maxAge: 0.48 + Math.random() * 0.2,
        });
      }
    }

    const sparkCount = isSuper ? 22 : 12;
    for (let i = 0; i < sparkCount; i += 1) {
      const ang = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.4;
      const spd = (isSuper ? 280 : 185) + Math.random() * 200;
      s.sparks.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        size: isSuper ? 4 + Math.random() * 4 : 3 + Math.random() * 3,
        color: i % 2 === 0 ? color || '#F59E0B' : '#FEF08A',
        age: 0,
        maxAge: 0.32 + Math.random() * 0.22,
      });
    }
  };

  const applyDefenderImpact = (defender, attackerFacing, accent, { isSuper = false, knock = 28, withSmoke = false } = {}) => {
    const s = stateRef.current;
    const groundY = WORLD_H * (s.mapStage?.groundYRatio || 0.88);
    const isNarrow = s.visWidth < 680;
    const maxPan = s.maxPanX || 76;
    const panRatio = isNarrow ? 0.22 : 0.3;
    s.hitStop = isSuper ? 0.08 : 0.04;
    s.trauma = Math.min(1, s.trauma + (isSuper ? 0.62 : 0.32));
    if (!s.reduceFlash) s.screenFlash = Math.max(s.screenFlash, isSuper ? 0.42 : 0.16);
    s.camTargetZoom = isSuper ? (isNarrow ? 1.1 : 1.14) : isNarrow ? 1.04 : 1.06;
    s.camTargetX = Math.max(-maxPan, Math.min(maxPan, (defender.x - WORLD_W / 2) * panRatio));

    defender.hurtTimer = isSuper ? 0.52 : 0.32;
    defender.clip = 'hurt';
    defender.frameIdx = 0;
    defender.frameTimer = 0;
    defender.knockX = attackerFacing * (isNarrow ? Math.min(knock, 38) : knock);
    defender.flashTimer = s.reduceFlash ? 0 : 0.2;

    spawnHitEffects(defender.x, groundY - 76, accent, { isSuper, withSmoke });
  };

  // Enqueue realistic multi-step console-style BVN combat move sequences
  const queueMoveSequence = (attacker, defender, attackerMeta, mode) => {
    const s = stateRef.current;
    const groundY = WORLD_H * (s.mapStage?.groundYRatio || 0.88);
    const accent = attackerMeta?.accent || '#F59E0B';
    const span = Math.max(180, Math.abs(defender.restX - attacker.restX));
    const meleeGap = Math.min(86, span * 0.34);
    const meleeX = defender.x - attacker.facing * meleeGap;
    const midX = attacker.restX + attacker.facing * Math.min(130, span * 0.34);
    const isNarrow = s.visWidth < 680;
    const maxPan = s.maxPanX || 76;

    attacker.queue = [];
    attacker.currentStep = null;

    if (mode === 'ultimate') {
      // FULL ULTIMATE (超必杀): Darkened aura -> Dramatic Super Cut-In -> Shunpo Dash -> 9-frame Super with 3-hit barrage!
      attacker.auraTimer = 1.2;
      if (!s.reduceFlash) {
        s.darkOverlay = 0.95;
        if (attacker.pack?.faceBig) {
          s.cutIn = {
            img: attacker.pack.faceBig,
            accent,
            name: attackerMeta?.shortName || 'ULTI',
            ultiTitle: attackerMeta?.ultiName || 'TUYỆT CHIÊU TỐI THƯỢNG!',
            age: 0,
            duration: 0.72,
          };
        }
      }
      s.camTargetZoom = isNarrow ? 1.1 : 1.15;
      s.camTargetX = Math.max(-maxPan, Math.min(maxPan, (defender.x - WORLD_W / 2) * (isNarrow ? 0.2 : 0.28)));

      attacker.queue.push(
        { type: 'move', clip: 'dash', targetX: meleeX - attacker.facing * 24, speed: 1550, ghosts: true },
        {
          type: 'anim',
          clip: 'super',
          impacts: [
            { at: 0.25, fn: () => applyDefenderImpact(defender, attacker.facing, accent, { isSuper: false, knock: 18, withSmoke: true }) },
            { at: 0.52, fn: () => applyDefenderImpact(defender, attacker.facing, '#F97316', { isSuper: true, knock: 36, withSmoke: true }) },
            { at: 0.78, fn: () => applyDefenderImpact(defender, attacker.facing, '#FDE047', { isSuper: true, knock: 64, withSmoke: true }) },
          ],
        },
        { type: 'move', clip: 'dash', targetX: attacker.restX, speed: 1180, ghosts: true, resetCam: true }
      );
      return;
    }

    if (mode === 'skill_ranged') {
      // SIGNATURE JUTSU / SKILL (招1/招2): Step forward -> Play skill clip -> Fire energy projectile -> Smoke explosion!
      attacker.auraTimer = 0.55;
      attacker.queue.push(
        { type: 'move', clip: 'walk', targetX: midX, speed: 780, ghosts: false },
        {
          type: 'anim',
          clip: 'skill',
          impacts: [
            {
              at: 0.42,
              fn: () => {
                s.projectiles.push({
                  x: attacker.x + attacker.facing * 52,
                  y: groundY - 76,
                  targetX: defender.x,
                  facing: attacker.facing,
                  speed: 1280,
                  color: accent,
                  radius: 26,
                  onHit: () =>
                    applyDefenderImpact(defender, attacker.facing, accent, {
                      isSuper: false,
                      knock: 42,
                      withSmoke: true,
                    }),
                });
              },
            },
          ],
        },
        { type: 'move', clip: 'dash', targetX: attacker.restX, speed: 1080, ghosts: true, resetCam: true }
      );
      return;
    }

    const alreadyClose = Math.abs(attacker.x - meleeX) < 88;

    if (mode === 'combo_3hit') {
      // 3-HIT CONSOLE MELEE COMBO (走/瞬步 -> 砍1 -> 砍2 -> 砍3): Full rushdown like real BVN!
      if (!alreadyClose) {
        attacker.queue.push({ type: 'move', clip: 'walk', targetX: meleeX, speed: 1120, ghosts: false });
      }
      attacker.queue.push(
        {
          type: 'anim',
          clip: 'attack1',
          impacts: [{ at: 0.45, fn: () => applyDefenderImpact(defender, attacker.facing, accent, { knock: 14 }) }],
        },
        {
          type: 'anim',
          clip: 'attack2',
          impacts: [{ at: 0.45, fn: () => applyDefenderImpact(defender, attacker.facing, '#F59E0B', { knock: 22 }) }],
        },
        {
          type: 'anim',
          clip: 'attack3',
          impacts: [
            {
              at: 0.48,
              fn: () =>
                applyDefenderImpact(defender, attacker.facing, '#F97316', {
                  isSuper: true,
                  knock: 48,
                  withSmoke: true,
                }),
            },
          ],
        },
        { type: 'move', clip: 'dash', targetX: attacker.restX, speed: 1180, ghosts: true, resetCam: true }
      );
      return;
    }

    // Default: SHUNPO BLITZ 2-HIT COMBO (瞬步 with afterimages -> 砍1 -> 砍2 -> retreat)
    if (!alreadyClose) {
      attacker.queue.push({ type: 'move', clip: 'dash', targetX: meleeX, speed: 1620, ghosts: true });
    }
    attacker.queue.push(
      {
        type: 'anim',
        clip: 'attack1',
        impacts: [{ at: 0.42, fn: () => applyDefenderImpact(defender, attacker.facing, accent, { knock: 16 }) }],
      },
      {
        type: 'anim',
        clip: 'attack2',
        impacts: [{ at: 0.46, fn: () => applyDefenderImpact(defender, attacker.facing, accent, { knock: 34, withSmoke: true }) }],
      },
      { type: 'move', clip: 'dash', targetX: attacker.restX, speed: 1220, ghosts: true, resetCam: true }
    );
  };

  // Trigger choreography from gameplay combat events
  useEffect(() => {
    const s = stateRef.current;
    if (!combatEvent || !combatEvent.id || combatEvent.id === s.lastEventId) return;
    s.lastEventId = combatEvent.id;
    const type = combatEvent.type;
    const groundY = WORLD_H * (s.mapStage?.groundYRatio || 0.88);

    if (type === 'fight_start') {
      s.p1.queue = [];
      s.p1.currentStep = null;
      s.p1.koMode = null;
      s.p1.clip = 'idle';
      s.p1.x = s.p1.restX;
      s.p2.queue = [];
      s.p2.currentStep = null;
      s.p2.koMode = null;
      s.p2.clip = 'idle';
      s.p2.x = s.p2.restX;
      s.camTargetX = 0;
      s.camTargetZoom = 1;
      return;
    }

    if (type === 'p1_ulti') {
      queueMoveSequence(s.p1, s.p2, s.p1Meta, 'ultimate');
      return;
    }

    if (type === 'p2_ulti') {
      queueMoveSequence(s.p2, s.p1, s.p2Meta, 'ultimate');
      return;
    }

    if (type === 'p1_crit' || type === 'p1_combo') {
      const pattern = s.moveCycle % 2 === 0 ? 'combo_3hit' : 'skill_ranged';
      s.moveCycle += 1;
      queueMoveSequence(s.p1, s.p2, s.p1Meta, pattern);
      return;
    }

    if (type === 'p1_hit') {
      const patterns = ['shunpo_2hit', 'skill_ranged', 'combo_3hit'];
      const chosen = doubleStrikeActive ? 'combo_3hit' : patterns[s.moveCycle % patterns.length];
      s.moveCycle += 1;
      queueMoveSequence(s.p1, s.p2, s.p1Meta, chosen);
      return;
    }

    if (type === 'p2_hit' || type === 'self_damage') {
      const chosen = s.moveCycle % 2 === 0 ? 'shunpo_2hit' : 'skill_ranged';
      s.moveCycle += 1;
      queueMoveSequence(s.p2, s.p1, s.p2Meta, chosen);
      return;
    }

    if (type === 'powerup') {
      s.p1.auraTimer = 0.9;
      s.trauma = Math.min(1, s.trauma + 0.18);
      spawnHitEffects(s.p1.x, groundY - 64, '#38BDF8', { withSmoke: true });
      return;
    }

    if (type === 'ko_win') {
      s.p1.queue = [];
      s.p1.currentStep = null;
      s.p1.koMode = 'win';
      s.p1.clip = 'win';
      s.p1.frameIdx = 0;
      s.p2.queue = [];
      s.p2.currentStep = null;
      s.p2.koMode = 'lose';
      s.p2.clip = 'hurt';
      s.p2.frameIdx = 0;
      s.p2.knockX = 48;
      s.trauma = 0.8;
      s.hitStop = 0.095;
      s.camTargetZoom = s.visWidth < 680 ? 1.1 : 1.16;
      s.camTargetX = Math.max(-(s.maxPanX || 76), Math.min(s.maxPanX || 76, -40));
      spawnHitEffects(s.p2.x, groundY - 72, s.p1Meta?.accent || '#F4D06F', { isSuper: true, withSmoke: true });
      return;
    }

    if (type === 'ko_lose') {
      s.p1.queue = [];
      s.p1.currentStep = null;
      s.p1.koMode = 'lose';
      s.p1.clip = 'hurt';
      s.p1.frameIdx = 0;
      s.p1.knockX = -48;
      s.p2.queue = [];
      s.p2.currentStep = null;
      s.p2.koMode = 'win';
      s.p2.clip = 'win';
      s.p2.frameIdx = 0;
      s.trauma = 0.75;
      s.hitStop = 0.09;
      s.camTargetZoom = s.visWidth < 680 ? 1.1 : 1.16;
      s.camTargetX = Math.max(-(s.maxPanX || 76), Math.min(s.maxPanX || 76, 40));
      spawnHitEffects(s.p1.x, groundY - 72, s.p2Meta?.accent || '#E66946', { isSuper: true, withSmoke: true });
    }
  }, [combatEvent, comboCount, doubleStrikeActive]);

  // Preview animations inside Character Select
  useEffect(() => {
    const s = stateRef.current;
    if (!previewTrigger || !previewTrigger.id || previewTrigger.id === s.lastPreviewId) return;
    s.lastPreviewId = previewTrigger.id;
    const clipName = previewTrigger.clip || 'attack1';
    const groundY = WORLD_H * (s.mapStage?.groundYRatio || 0.88);
    const accent = s.p1Meta?.accent || '#F59E0B';

    s.p1.queue = [];
    s.p1.currentStep = null;
    if (clipName === 'super') {
      s.p1.auraTimer = 1.0;
      if (!s.reduceFlash && s.p1.pack?.faceBig) {
        s.darkOverlay = 0.7;
        s.cutIn = {
          img: s.p1.pack.faceBig,
          accent,
          name: s.p1Meta?.shortName || 'ULTI',
          ultiTitle: s.p1Meta?.ultiName || 'TUYỆT CHIÊU!',
          age: 0,
          duration: 0.65,
        };
      }
      s.p1.queue.push({
        type: 'anim',
        clip: 'super',
        impacts: [
          {
            at: 0.45,
            fn: () => {
              s.trauma = Math.min(1, s.trauma + 0.5);
              spawnHitEffects(s.p1.x + 92, groundY - 74, accent, { isSuper: true, withSmoke: true });
            },
          },
        ],
      });
    } else if (clipName === 'attack' || clipName === 'attack1') {
      s.p1.queue.push(
        {
          type: 'anim',
          clip: 'attack1',
          impacts: [{ at: 0.45, fn: () => spawnHitEffects(s.p1.x + 80, groundY - 72, accent) }],
        },
        {
          type: 'anim',
          clip: 'attack2',
          impacts: [{ at: 0.45, fn: () => spawnHitEffects(s.p1.x + 86, groundY - 74, '#F59E0B', { withSmoke: true }) }],
        }
      );
    } else {
      s.p1.queue.push({ type: 'anim', clip: clipName, impacts: [] });
    }
  }, [previewTrigger]);

  // Main 60fps Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let rafId = 0;
    let lastTs = performance.now();

    const syncSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.max(1, Math.round(rect.width * dpr));
      const targetH = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    };

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncSize) : null;
    if (observer) observer.observe(canvas);
    syncSize();

    const stepActor = (actor, dt) => {
      if (actor.flashTimer > 0) actor.flashTimer = Math.max(0, actor.flashTimer - dt);
      if (actor.auraTimer > 0) actor.auraTimer = Math.max(0, actor.auraTimer - dt);
      actor.knockX += (0 - actor.knockX) * Math.min(1, dt * 8);

      // Decay afterimage ghosts
      for (let i = actor.afterimages.length - 1; i >= 0; i -= 1) {
        actor.afterimages[i].alpha -= dt * 4.5;
        if (actor.afterimages[i].alpha <= 0) actor.afterimages.splice(i, 1);
      }

      if (actor.koMode) {
        const clipObj = resolveClip(actor.pack, actor.koMode === 'win' ? 'win' : 'hurt');
        const frames = clipObj?.frames || [];
        if (frames.length > 0 && actor.koMode === 'win') {
          actor.frameTimer += dt;
          const dur = 1 / Math.max(4, clipObj.fps || 8);
          if (actor.frameTimer >= dur) {
            actor.frameTimer -= dur;
            actor.frameIdx = (actor.frameIdx + 1) % frames.length;
          }
        }
        return;
      }

      // Pop next scripted step if idle
      if (!actor.currentStep && actor.queue.length > 0) {
        actor.currentStep = actor.queue.shift();
        actor.clip = actor.currentStep.clip || 'idle';
        actor.frameIdx = 0;
        actor.frameTimer = 0;
        actor.currentStep.fired = new Set();
        actor.currentStep.elapsed = 0;
      }

      const step = actor.currentStep;
      if (step) {
        step.elapsed += dt;
        const clipObj = resolveClip(actor.pack, step.clip);
        const frames = clipObj?.frames || [];
        const fps = Number(clipObj?.fps) || 12;

        if (step.type === 'move') {
          if (step.ghosts) {
            actor.ghostTimer += dt;
            if (actor.ghostTimer >= 0.032) {
              actor.ghostTimer = 0;
              actor.afterimages.push({
                x: actor.x,
                clip: actor.clip,
                frameIdx: actor.frameIdx,
                facing: actor.facing,
                alpha: 0.9,
              });
            }
          }
          // Advance walk/dash cycle
          if (frames.length > 0) {
            actor.frameTimer += dt;
            if (actor.frameTimer >= 1 / fps) {
              actor.frameTimer = 0;
              actor.frameIdx = (actor.frameIdx + 1) % frames.length;
            }
          }
          const dx = step.targetX - actor.x;
          const dist = (step.speed || 1000) * dt;
          if (Math.abs(dx) <= dist) {
            actor.x = step.targetX;
            if (step.resetCam) {
              stateRef.current.camTargetX = 0;
              stateRef.current.camTargetZoom = 1;
            }
            actor.currentStep = null;
          } else {
            actor.x += Math.sign(dx) * dist;
          }
          return;
        }

        if (step.type === 'anim') {
          const totalFrames = Math.max(1, frames.length);
          const frameDur = 1 / Math.max(6, fps);
          actor.frameTimer += dt;
          if (frames.length > 0) {
            while (actor.frameTimer >= frameDur) {
              actor.frameTimer -= frameDur;
              const progress = (actor.frameIdx + 1) / totalFrames;
              for (let idx = 0; idx < (step.impacts || []).length; idx += 1) {
                const imp = step.impacts[idx];
                if (!step.fired.has(idx) && progress >= imp.at) {
                  step.fired.add(idx);
                  imp.fn?.();
                }
              }
              if (actor.frameIdx + 1 < frames.length) {
                actor.frameIdx += 1;
              } else {
                actor.currentStep = null;
                break;
              }
            }
          } else if (step.elapsed >= 0.28) {
            for (let idx = 0; idx < (step.impacts || []).length; idx += 1) {
              if (!step.fired.has(idx)) {
                step.fired.add(idx);
                step.impacts[idx].fn?.();
              }
            }
            actor.currentStep = null;
          }
          return;
        }
      }

      // Hurt recovery or Idle loop
      if (actor.hurtTimer > 0) {
        actor.hurtTimer = Math.max(0, actor.hurtTimer - dt);
        const hurtClip = resolveClip(actor.pack, 'hurt');
        const frames = hurtClip?.frames || [];
        if (frames.length > 0) {
          actor.frameTimer += dt;
          if (actor.frameTimer >= 1 / (hurtClip.fps || 10)) {
            actor.frameTimer = 0;
            actor.frameIdx = Math.min(frames.length - 1, actor.frameIdx + 1);
          }
        }
        if (actor.hurtTimer <= 0) {
          actor.clip = 'idle';
          actor.frameIdx = 0;
        }
        return;
      }

      actor.clip = 'idle';
      const idleClip = resolveClip(actor.pack, 'idle');
      const idleFrames = idleClip?.frames || [];
      if (idleFrames.length > 0) {
        actor.frameTimer += dt;
        const dur = 1 / Math.max(4, idleClip.fps || 8);
        if (actor.frameTimer >= dur) {
          actor.frameTimer -= dur;
          actor.frameIdx = (actor.frameIdx + 1) % idleFrames.length;
        }
      }
    };

    const tick = (now) => {
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      const s = stateRef.current;

      const cw = canvas.width;
      const ch = canvas.height;
      let worldToCanvas;
      if (s.previewMode) {
        const fitScale = Math.min(cw / WORLD_W, ch / WORLD_H);
        const coverScale = Math.max(cw / WORLD_W, ch / WORLD_H);
        worldToCanvas = fitScale * 0.35 + coverScale * 0.65;
      } else {
        // Fit WORLD_H cleanly and guarantee >= MIN_BATTLE_VIEW_W horizontally so mobile never clips fighters!
        worldToCanvas = Math.min(ch / WORLD_H, cw / MIN_BATTLE_VIEW_W);
      }

      const visWAt1 = cw / Math.max(0.05, worldToCanvas);
      const visHAt1 = ch / Math.max(0.05, worldToCanvas);
      s.visWidth = visWAt1;
      s.maxPanX = s.previewMode ? 0 : Math.min(78, visWAt1 * 0.08);

      // Keep fighters framed comfortably inside any viewport (desktop wide -> classic spacing; mobile portrait -> centered pair!)
      if (!s.previewMode) {
        const halfSep = Math.max(116, Math.min(210, visWAt1 * 0.22));
        const desiredP1RestX = WORLD_W / 2 - halfSep;
        const desiredP2RestX = WORLD_W / 2 + halfSep;
        if (Math.abs(s.p1.restX - desiredP1RestX) > 1 || Math.abs(s.p2.restX - desiredP2RestX) > 1) {
          s.p1.restX = desiredP1RestX;
          s.p2.restX = desiredP2RestX;
          if (!s.p1.currentStep && !s.p1.queue.length) s.p1.x = desiredP1RestX;
          if (!s.p2.currentStep && !s.p2.queue.length) s.p2.x = desiredP2RestX;
          for (const st of s.p1.queue) {
            if (st.resetCam) st.targetX = desiredP1RestX;
          }
          for (const st of s.p2.queue) {
            if (st.resetCam) st.targetX = desiredP2RestX;
          }
        }
      }

      if (s.hitStop > 0) {
        s.hitStop = Math.max(0, s.hitStop - rawDt);
      } else {
        stepActor(s.p1, rawDt);
        if (!s.previewMode) stepActor(s.p2, rawDt);
      }

      // Update camera, projectiles, smoke & sparks
      s.camTargetX = Math.max(-s.maxPanX, Math.min(s.maxPanX, s.camTargetX));
      s.camX += (s.camTargetX - s.camX) * Math.min(1, rawDt * 7.5);
      s.camX = Math.max(-s.maxPanX, Math.min(s.maxPanX, s.camX));
      s.camZoom += (s.camTargetZoom - s.camZoom) * Math.min(1, rawDt * 6.5);
      s.trauma = Math.max(0, s.trauma - rawDt * 2.2);
      if (s.screenFlash > 0) s.screenFlash = Math.max(0, s.screenFlash - rawDt * 2.5);
      if (s.darkOverlay > 0) s.darkOverlay = Math.max(0, s.darkOverlay - rawDt * 1.1);

      if (s.cutIn) {
        s.cutIn.age += rawDt;
        if (s.cutIn.age >= s.cutIn.duration) s.cutIn = null;
      }

      for (let i = s.projectiles.length - 1; i >= 0; i -= 1) {
        const pr = s.projectiles[i];
        pr.x += pr.facing * pr.speed * rawDt;
        if ((pr.facing > 0 && pr.x >= pr.targetX - 18) || (pr.facing < 0 && pr.x <= pr.targetX + 18)) {
          pr.onHit?.();
          s.projectiles.splice(i, 1);
        }
      }

      for (let i = s.starbursts.length - 1; i >= 0; i -= 1) {
        s.starbursts[i].age += rawDt;
        if (s.starbursts[i].age >= s.starbursts[i].maxAge) s.starbursts.splice(i, 1);
      }
      for (let i = s.smokes.length - 1; i >= 0; i -= 1) {
        const sm = s.smokes[i];
        sm.age += rawDt;
        sm.x += sm.vx * rawDt;
        sm.y += sm.vy * rawDt;
        sm.r += 16 * rawDt;
        if (sm.age >= sm.maxAge) s.smokes.splice(i, 1);
      }
      for (let i = s.sparks.length - 1; i >= 0; i -= 1) {
        const sp = s.sparks[i];
        sp.age += rawDt;
        sp.x += sp.vx * rawDt;
        sp.y += sp.vy * rawDt;
        sp.vy += 420 * rawDt;
        if (sp.age >= sp.maxAge) s.sparks.splice(i, 1);
      }

      // Render world
      ctx.clearRect(0, 0, cw, ch);

      const groundY = s.transparentBg
        ? WORLD_H * 0.86
        : WORLD_H * (s.mapStage?.groundYRatio || 0.88);

      // Anchor ground cleanly to bottom edge at zoom=1, then blend toward fighter torso on zoom-in
      const baseCenterY = s.previewMode ? WORLD_H / 2 : WORLD_H - visHAt1 / 2;
      const focusY = groundY - 72;
      const camCenterY = s.previewMode
        ? WORLD_H / 2
        : baseCenterY + (focusY - baseCenterY) * Math.min(1, Math.max(0, (s.camZoom - 1) * 2.2));

      const shakeStrength = s.reduceShake ? 2 : 11;
      const shakeMag = s.trauma * s.trauma * shakeStrength;
      const tSec = now * 0.001;
      const shakeX = shakeMag * (Math.sin(tSec * 23) * 0.7 + Math.sin(tSec * 41) * 0.3);
      const shakeY = shakeMag * (Math.sin(tSec * 29) * 0.7 + Math.sin(tSec * 17) * 0.3);

      const effScale = worldToCanvas * s.camZoom;
      const visHalfW = cw / (2 * effScale);
      const visHalfH = ch / (2 * effScale);
      const visLeft = WORLD_W / 2 + s.camX - visHalfW - shakeX / effScale;
      const visRight = WORLD_W / 2 + s.camX + visHalfW - shakeX / effScale;
      const visTop = camCenterY - visHalfH - shakeY / effScale;
      const visBottom = camCenterY + visHalfH - shakeY / effScale;

      ctx.save();
      ctx.translate(cw / 2 + shakeX, ch / 2 + shakeY);
      ctx.scale(effScale, effScale);
      ctx.translate(-WORLD_W / 2 - s.camX, -camCenterY);
      ctx.imageSmoothingEnabled = false;

      const bgImg = s.mapStage?.image;
      const padL = visLeft - 24;
      const padT = visTop - 24;
      const padW = visRight - visLeft + 48;
      const padH = visBottom - visTop + 48;

      if (!s.transparentBg) {
        if (bgImg && bgImg.naturalWidth > 0) {
          const maxShakeWorld = (s.reduceShake ? 3 : 14) / Math.max(0.25, worldToCanvas);
          const baseSpanW = Math.max(WORLD_W, visWAt1) + 2 * (s.maxPanX + maxShakeWorld) + 24;
          const baseSpanH = Math.max(WORLD_H, visHAt1) + 2 * maxShakeWorld + 24;
          const targetW = Math.max(baseSpanW, visRight - visLeft + 16);
          const targetH = Math.max(baseSpanH, visBottom - visTop + 16);

          const aspect = bgImg.naturalWidth / bgImg.naturalHeight;
          let drawW = targetW;
          let drawH = drawW / aspect;
          if (drawH < targetH) {
            drawH = targetH;
            drawW = drawH * aspect;
          }

          // Distant parallax + strict viewport clamp -> ZERO black borders on any side during pan/shake!
          const idealX = (WORLD_W - drawW) / 2 + s.camX * 0.18;
          const drawX = Math.max(visRight - drawW, Math.min(visLeft, idealX));

          const idealY = WORLD_H + maxShakeWorld - drawH;
          const drawY = Math.max(visBottom - drawH, Math.min(visTop, idealY));

          ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
        } else {
          const sky = ctx.createLinearGradient(0, padT, 0, padT + padH);
          sky.addColorStop(0, '#0F172A');
          sky.addColorStop(0.68, '#1E293B');
          sky.addColorStop(1, '#334155');
          ctx.fillStyle = sky;
          ctx.fillRect(padL, padT, padW, padH);
        }
      }

      // Dramatic dark backdrop during Ultimate (超必杀)
      if (s.darkOverlay > 0 && !s.transparentBg) {
        ctx.fillStyle = `rgba(5, 7, 14, ${Math.min(0.6, s.darkOverlay * 0.65)})`;
        ctx.fillRect(padL, padT, padW, padH);
      }

      // Top HUD readability gradient
      if (!s.transparentBg) {
        const topFade = ctx.createLinearGradient(0, visTop, 0, visTop + 110);
        topFade.addColorStop(0, 'rgba(9, 11, 16, 0.56)');
        topFade.addColorStop(1, 'rgba(9, 11, 16, 0)');
        ctx.fillStyle = topFade;
        ctx.fillRect(padL, padT, padW, 140);
      }

      // Draw fighters (active attacker draws on top!)
      const p1Active = Boolean(s.p1.currentStep);
      if (!s.previewMode) {
        if (p1Active) {
          drawActor(ctx, s.p2, groundY, false, s.p2Meta?.accent);
          drawActor(ctx, s.p1, groundY, false, s.p1Meta?.accent);
        } else {
          drawActor(ctx, s.p1, groundY, false, s.p1Meta?.accent);
          drawActor(ctx, s.p2, groundY, false, s.p2Meta?.accent);
        }
      } else {
        drawActor(ctx, s.p1, groundY, true, s.p1Meta?.accent);
      }

      // Draw signature energy projectiles (crescent wave / chakra orb)
      for (const pr of s.projectiles) {
        ctx.save();
        ctx.translate(pr.x, pr.y);
        ctx.scale(pr.facing, 1);
        const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, pr.radius * 1.4);
        grad.addColorStop(0, '#FFFDF7');
        grad.addColorStop(0.5, pr.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(-6, 0, pr.radius * 1.6, pr.radius * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFDF7';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(-8, 0, pr.radius, -1.1, 1.1);
        ctx.stroke();
        ctx.restore();
      }

      // Stylized anime smoke clouds
      for (const sm of s.smokes) {
        const alpha = (1 - sm.age / sm.maxAge) * 0.65;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = sm.color;
        ctx.beginPath();
        ctx.arc(sm.x, sm.y, sm.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // BVN starburst impact flashes
      for (const burst of s.starbursts) {
        drawAnimeStarburst(ctx, burst);
      }

      // Crisp hit sparks
      for (const sp of s.sparks) {
        const alpha = 1 - sp.age / sp.maxAge;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = sp.color;
        ctx.strokeStyle = '#0B0E14';
        ctx.lineWidth = 1;
        ctx.fillRect(sp.x - sp.size / 2, sp.y - sp.size / 2, sp.size, sp.size);
        ctx.strokeRect(sp.x - sp.size / 2, sp.y - sp.size / 2, sp.size, sp.size);
        ctx.restore();
      }

      ctx.restore();

      // Screen impact flash
      if (s.screenFlash > 0 && !s.reduceFlash) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 253, 247, ${s.screenFlash * 0.42})`;
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
      }

      // Dramatic BVN Ultimate Cut-In Strip (超必杀)
      if (s.cutIn && !s.reduceFlash) {
        const p = s.cutIn.age / s.cutIn.duration;
        const slideIn = p < 0.18 ? p / 0.18 : p > 0.8 ? (1 - p) / 0.2 : 1;
        const bandH = Math.max(58, Math.min(112, ch * 0.26));
        const bandY = ch * 0.32;
        ctx.save();
        ctx.globalAlpha = Math.min(1, slideIn * 1.15);
        ctx.fillStyle = 'rgba(11, 14, 20, 0.92)';
        ctx.beginPath();
        ctx.moveTo(0, bandY + 12);
        ctx.lineTo(cw, bandY - 12);
        ctx.lineTo(cw, bandY + bandH - 12);
        ctx.lineTo(0, bandY + bandH + 12);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = s.cutIn.accent || '#F4D06F';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Diagonal speed lines inside cut-in strip
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i += 1) {
          const ly = bandY + (bandH * (i + 0.5)) / 6;
          ctx.beginPath();
          ctx.moveTo(0, ly + 8);
          ctx.lineTo(cw, ly - 8);
          ctx.stroke();
        }

        const img = s.cutIn.img;
        if (img && img.naturalWidth > 0) {
          const ih = bandH * 1.24;
          const iw = (img.naturalWidth / img.naturalHeight) * ih;
          const offsetX = cw * 0.06 + (1 - slideIn) * -160;
          ctx.drawImage(img, offsetX, bandY + (bandH - ih) / 2, iw, ih);
        }

        ctx.fillStyle = '#F4D06F';
        ctx.font = `900 ${Math.round(bandH * 0.34)}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.cutIn.ultiTitle || `${s.cutIn.name} ULTI!`, cw - Math.max(24, cw * 0.06), bandY + bandH * 0.44);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `800 ${Math.round(bandH * 0.2)}px sans-serif`;
        ctx.fillText(`${s.cutIn.name} · TUYỆT CHIÊU TỐI THƯỢNG`, cw - Math.max(24, cw * 0.06), bandY + bandH * 0.74);
        ctx.restore();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Sàn đấu Bleach vs Naruto"
      className={`block w-full h-full select-none ${className}`}
    />
  );
}
