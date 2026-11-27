// src/hooks/useBattleFeel.js
// Game-Feel & Accessibility engine: trauma screen shake, monotonic hit-stop, pixel projectiles,
// spark particle bursts, and WCAG 2.3.1 photosensitivity settings.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getArenaAudioVolume, setArenaAudioVolume } from '../services/sound.js';

const STORAGE_KEY = 'hi_arena_feel_v1';

const SPARK_VECTORS = [
  { dx: -26, dy: -22 },
  { dx: 24, dy: -24 },
  { dx: -30, dy: 8 },
  { dx: 28, dy: 10 },
  { dx: -14, dy: -32 },
  { dx: 16, dy: -30 },
  { dx: -18, dy: 24 },
  { dx: 20, dy: 22 },
  { dx: 0, dy: -36 },
  { dx: -36, dy: -6 },
  { dx: 36, dy: -8 },
  { dx: 0, dy: 28 },
  { dx: -22, dy: -12 },
  { dx: 22, dy: -14 },
  { dx: -10, dy: 30 },
  { dx: 12, dy: 30 },
  { dx: -28, dy: 18 },
  { dx: 30, dy: 18 },
];

function readInitialSettings() {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        reduceShake: Boolean(parsed.reduceShake),
        reduceFlash: Boolean(parsed.reduceFlash),
        sfxVolume:
          typeof parsed.sfxVolume === 'number'
            ? Math.max(0, Math.min(1, parsed.sfxVolume))
            : getArenaAudioVolume(),
      };
    }
  } catch (_) {}
  return {
    reduceShake: Boolean(prefersReduced),
    reduceFlash: Boolean(prefersReduced),
    sfxVolume: getArenaAudioVolume(),
  };
}

export function useBattleFeel() {
  const [settings, setSettings] = useState(readInitialSettings);
  const [p1Anim, setP1Anim] = useState('idle');
  const [p2Anim, setP2Anim] = useState('idle');
  const [projectile, setProjectile] = useState(null);
  const [particles, setParticles] = useState([]);
  const [callout, setCallout] = useState(null);
  const [isHitStopped, setIsHitStopped] = useState(false);

  const stageRef = useRef(null);
  const traumaRef = useRef(0);
  const shakeRafRef = useRef(0);
  const lastFrameRef = useRef(0);
  const hitStopIdRef = useRef(0);
  const timersRef = useRef([]);
  const lastEventIdRef = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Persist feel & audio volume settings
  useEffect(() => {
    try {
      window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (_) {}
    setArenaAudioVolume(settings.sfxVolume);
  }, [settings]);

  const scheduleTimeout = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearChoreographyTimers = useCallback(() => {
    for (const id of timersRef.current) clearTimeout(id);
    timersRef.current = [];
  }, []);

  const startShakeLoop = useCallback(() => {
    if (shakeRafRef.current) return;
    lastFrameRef.current = performance.now();

    const step = (now) => {
      const dt = Math.min(0.05, Math.max(0, (now - lastFrameRef.current) / 1000));
      lastFrameRef.current = now;

      traumaRef.current = Math.max(0, traumaRef.current - dt * 2.4);
      const tr = traumaRef.current;
      const el = stageRef.current;

      if (tr <= 0.005) {
        traumaRef.current = 0;
        if (el) el.style.transform = '';
        shakeRafRef.current = 0;
        return;
      }

      if (el) {
        const strength = settingsRef.current.reduceShake ? 3 : 11;
        const mag = tr * tr * strength;
        const t = now * 0.001;
        const tx = mag * (Math.sin(t * 21.7) * 0.65 + Math.sin(t * 37.3) * 0.35);
        const ty = mag * (Math.sin(t * 25.1) * 0.65 + Math.sin(t * 15.9) * 0.35);
        const rot = settingsRef.current.reduceShake
          ? 0
          : tr * tr * 1.4 * Math.sin(t * 17.3);
        el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
      }

      shakeRafRef.current = requestAnimationFrame(step);
    };

    shakeRafRef.current = requestAnimationFrame(step);
  }, []);

  const addTrauma = useCallback(
    (amount) => {
      const mult = settingsRef.current.reduceShake ? 0.25 : 1;
      traumaRef.current = Math.min(1, traumaRef.current + amount * mult);
      startShakeLoop();
    },
    [startShakeLoop]
  );

  const triggerHitStop = useCallback((ms) => {
    if (settingsRef.current.reduceShake && settingsRef.current.reduceFlash) return;
    const nextId = ++hitStopIdRef.current;
    setIsHitStopped(true);
    scheduleTimeout(() => {
      if (hitStopIdRef.current === nextId) {
        setIsHitStopped(false);
      }
    }, ms);
  }, [scheduleTimeout]);

  const spawnBurst = useCallback(
    (side, colors, count = 10) => {
      const batchId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const next = SPARK_VECTORS.slice(0, count).map((vec, idx) => ({
        id: `${batchId}-${idx}`,
        side,
        dx: vec.dx,
        dy: vec.dy,
        color: colors[idx % colors.length],
        size: idx % 3 === 0 ? 8 : 6,
      }));
      setParticles(next);
      scheduleTimeout(() => {
        setParticles((prev) => prev.filter((p) => !p.id.startsWith(batchId)));
      }, 520);
    },
    [scheduleTimeout]
  );

  const showCallout = useCallback(
    (text, subtext = '', tone = 'gold') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setCallout({ id, text, subtext, tone });
      scheduleTimeout(() => {
        setCallout((prev) => (prev?.id === id ? null : prev));
      }, 920);
    },
    [scheduleTimeout]
  );

  const triggerCombatEvent = useCallback(
    (event) => {
      if (!event || !event.id || event.id === lastEventIdRef.current) return;
      lastEventIdRef.current = event.id;

      const { type, label, sublabel } = event;

      if (type === 'fight_start') {
        showCallout('FIGHT!', sublabel || '1V1 START', 'sage');
        return;
      }

      if (type === 'p1_ulti') {
        addTrauma(0.85);
        triggerHitStop(90);
        showCallout(label || 'ULTIMATE!', sublabel || 'TUYỆT CHIÊU!', 'gold');
        return;
      }

      if (type === 'p2_ulti') {
        addTrauma(0.8);
        triggerHitStop(85);
        showCallout(label || 'RIVAL ULTI!', sublabel || 'TUYỆT CHIÊU!', 'vermilion');
        return;
      }

      if (type === 'p1_crit' || type === 'p1_combo') {
        addTrauma(0.72);
        triggerHitStop(85);
        setP1Anim('attack');
        setProjectile({
          id: event.id,
          direction: 'p1_to_p2',
          color: '#D99B26',
          isCrit: true,
        });
        scheduleTimeout(() => {
          setP2Anim('hit');
          spawnBurst('opp', ['#F4D06F', '#5A7E56', '#2E7D9B'], 16);
        }, 140);
        showCallout(label || 'CRITICAL!', sublabel || '', 'gold');
        scheduleTimeout(() => {
          setP1Anim('idle');
          setP2Anim('idle');
          setProjectile(null);
        }, 460);
        return;
      }

      if (type === 'p1_hit') {
        addTrauma(0.36);
        triggerHitStop(45);
        setP1Anim('attack');
        setProjectile({
          id: event.id,
          direction: 'p1_to_p2',
          color: '#5A7E56',
          isCrit: false,
        });
        scheduleTimeout(() => {
          setP2Anim('hit');
          spawnBurst('opp', ['#5A7E56', '#F4D06F', '#FAF5EB'], 10);
        }, 120);
        if (label) showCallout(label, sublabel || '', 'sage');
        scheduleTimeout(() => {
          setP1Anim('idle');
          setP2Anim('idle');
          setProjectile(null);
        }, 400);
        return;
      }

      if (type === 'p2_hit' || type === 'self_damage') {
        addTrauma(0.46);
        triggerHitStop(55);
        setP2Anim('attack');
        setProjectile({
          id: event.id,
          direction: 'p2_to_p1',
          color: '#E66946',
          isCrit: false,
        });
        scheduleTimeout(() => {
          setP1Anim('hit');
          spawnBurst('self', ['#E66946', '#D99B26', '#FAF5EB'], 12);
        }, 120);
        if (label) showCallout(label, sublabel || '', 'vermilion');
        scheduleTimeout(() => {
          setP1Anim('idle');
          setP2Anim('idle');
          setProjectile(null);
        }, 420);
        return;
      }

      if (type === 'powerup') {
        addTrauma(0.2);
        spawnBurst('self', ['#7B5288', '#F4D06F', '#2E7D9B'], 10);
        showCallout(label || 'POWER UP!', sublabel || '', 'arcane');
        return;
      }

      if (type === 'ko_win') {
        addTrauma(0.84);
        triggerHitStop(95);
        setP1Anim('victory');
        setP2Anim('defeat');
        spawnBurst('opp', ['#F4D06F', '#5A7E56', '#E66946', '#2E7D9B'], 18);
        showCallout('K.O.!', 'VICTORY', 'gold');
        return;
      }

      if (type === 'ko_lose') {
        addTrauma(0.76);
        triggerHitStop(90);
        setP1Anim('defeat');
        setP2Anim('victory');
        spawnBurst('self', ['#E66946', '#3D352E', '#D99B26'], 16);
        showCallout('K.O.!', 'DEFEAT', 'vermilion');
      }
    },
    [addTrauma, scheduleTimeout, showCallout, spawnBurst, triggerHitStop]
  );

  const resetCombatVisuals = useCallback(() => {
    clearChoreographyTimers();
    traumaRef.current = 0;
    if (stageRef.current) stageRef.current.style.transform = '';
    setP1Anim('idle');
    setP2Anim('idle');
    setProjectile(null);
    setParticles([]);
    setCallout(null);
    setIsHitStopped(false);
  }, [clearChoreographyTimers]);

  const setReduceShake = useCallback((val) => {
    setSettings((prev) => ({ ...prev, reduceShake: Boolean(val) }));
  }, []);

  const setReduceFlash = useCallback((val) => {
    setSettings((prev) => ({ ...prev, reduceFlash: Boolean(val) }));
  }, []);

  const setSfxVolume = useCallback((vol) => {
    const clamped = Math.max(0, Math.min(1, Number(vol) || 0));
    setSettings((prev) => ({ ...prev, sfxVolume: clamped }));
  }, []);

  useEffect(() => {
    return () => {
      clearChoreographyTimers();
      if (shakeRafRef.current) cancelAnimationFrame(shakeRafRef.current);
    };
  }, [clearChoreographyTimers]);

  return {
    stageRef,
    p1Anim,
    p2Anim,
    projectile,
    particles,
    callout,
    isHitStopped,
    reduceShake: settings.reduceShake,
    reduceFlash: settings.reduceFlash,
    sfxVolume: settings.sfxVolume,
    setReduceShake,
    setReduceFlash,
    setSfxVolume,
    triggerCombatEvent,
    resetCombatVisuals,
  };
}

export default useBattleFeel;
