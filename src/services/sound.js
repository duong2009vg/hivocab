// src/services/sound.js
// Audio Pronunciation, Authentic BVN MP3 SFX, Per-Character Ulti Voice/SFX, Lobby BGM & Chiptune Fallback.
import { getBvnBgmUrl, getBvnFighterUrl, getBvnSfxUrl } from '../config/bvnAssets.js';

const VOL_STORAGE_KEY = 'hi_arena_sfx_vol';
const BGM_VOL_STORAGE_KEY = 'hi_arena_bgm_vol';
const BVN_SFX_FILES = [
  'snd_menu1.mp3',
  'snd_menu2.mp3',
  'snd_ghost_dash.mp3',
  'snd_ghost_jump.mp3',
  'snd_over_hit.mp3',
  'snd_ko.mp3',
  'snd_ko_bs.mp3',
  'snd_error.mp3',
  'snd_gameover.mp3',
];

let sharedAudioCtx = null;
let masterGain = null;
let sfxBus = null;
let uiBus = null;
let noiseBuffer = null;
const bvnSampleBuffers = new Map();
const bvnSampleLoads = new Map();
const charUltiBuffers = new Map();
const charUltiLoads = new Map();

let lobbyBgmAudio = null;
let lobbyBgmWanted = false;
let lobbyUnlockBound = false;

function readSavedBgmVolume() {
  if (typeof window === 'undefined') return 0.42;
  try {
    const raw = window.localStorage?.getItem(BGM_VOL_STORAGE_KEY);
    if (raw !== null) {
      const num = Number(raw);
      if (Number.isFinite(num)) return Math.max(0, Math.min(1, num));
    }
  } catch (_) {}
  return 0.42;
}

let bgmSliderVolume = readSavedBgmVolume();

function readSavedVolume() {
  if (typeof window === 'undefined') return 0.75;
  try {
    const raw = window.localStorage?.getItem(VOL_STORAGE_KEY);
    if (raw !== null) {
      const num = Number(raw);
      if (Number.isFinite(num)) return Math.max(0, Math.min(1, num));
    }
  } catch (_) {}
  return 0.75;
}

let sliderVolume = readSavedVolume();

function toPerceptualGain(slider) {
  const s = Math.max(0, Math.min(1, Number(slider) || 0));
  return s <= 0 ? 0 : s * s * 0.9;
}

function ensureAudioGraph() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;

  if (!sharedAudioCtx) {
    try {
      sharedAudioCtx = new Ctx();
      masterGain = sharedAudioCtx.createGain();
      masterGain.gain.value = toPerceptualGain(sliderVolume);

      // Master dynamics limiter prevents clipping when combos stack rapidly
      if (typeof sharedAudioCtx.createDynamicsCompressor === 'function') {
        const compressor = sharedAudioCtx.createDynamicsCompressor();
        compressor.threshold.value = -8;
        compressor.knee.value = 12;
        compressor.ratio.value = 6;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.15;
        masterGain.connect(compressor);
        compressor.connect(sharedAudioCtx.destination);
      } else {
        masterGain.connect(sharedAudioCtx.destination);
      }

      sfxBus = sharedAudioCtx.createGain();
      sfxBus.gain.value = 1.0;
      sfxBus.connect(masterGain);

      uiBus = sharedAudioCtx.createGain();
      uiBus.gain.value = 0.65;
      uiBus.connect(masterGain);
    } catch (_) {
      sharedAudioCtx = null;
      return null;
    }
  }

  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }

  return sharedAudioCtx;
}

export function getArenaAudioVolume() {
  return sliderVolume;
}

export function setArenaAudioVolume(slider01) {
  sliderVolume = Math.max(0, Math.min(1, Number(slider01) || 0));
  try {
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(VOL_STORAGE_KEY, String(sliderVolume));
    }
  } catch (_) {}
  if (masterGain && sharedAudioCtx) {
    try {
      masterGain.gain.setTargetAtTime(toPerceptualGain(sliderVolume), sharedAudioCtx.currentTime, 0.015);
    } catch (_) {
      masterGain.gain.value = toPerceptualGain(sliderVolume);
    }
  }
}

function getNoiseBuffer(ctx) {
  if (noiseBuffer) return noiseBuffer;
  const len = Math.floor(ctx.sampleRate * 0.2);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return noiseBuffer;
}

function playNoiseBurst({ duration = 0.08, cutoff = 1200, gain = 0.14, delay = 0 } = {}) {
  const ctx = ensureAudioGraph();
  if (!ctx || !sfxBus || sliderVolume <= 0) return;
  try {
    const src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = cutoff;
    filter.Q.value = 1.4;

    const g = ctx.createGain();
    const start = ctx.currentTime + delay;
    g.gain.setValueAtTime(0.001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, start + duration);

    src.connect(filter);
    filter.connect(g);
    g.connect(sfxBus);
    src.start(start);
    src.stop(start + duration + 0.02);
  } catch (_) {}
}

function playToneSequence(notes, { bus = 'sfx', jitter = true } = {}) {
  const ctx = ensureAudioGraph();
  if (!ctx || sliderVolume <= 0) return;
  const targetBus = bus === 'ui' ? uiBus || sfxBus : sfxBus;
  if (!targetBus) return;

  // ±4% micro pitch jitter kills robotic "machine-gun" repetition
  const pitchFactor = jitter ? 0.96 + Math.random() * 0.08 : 1;
  let offset = ctx.currentTime;

  for (const { freq, slideTo, duration = 0.08, type = 'square', gain = 0.12, gap = 0.01 } of notes) {
    try {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq * pitchFactor, offset);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo * pitchFactor), offset + duration);
      }

      const gJitter = gain * (0.94 + Math.random() * 0.12);
      gainNode.gain.setValueAtTime(0.001, offset);
      gainNode.gain.exponentialRampToValueAtTime(gJitter, offset + 0.008);
      gainNode.gain.exponentialRampToValueAtTime(0.001, offset + duration);

      osc.connect(gainNode);
      gainNode.connect(targetBus);
      osc.start(offset);
      osc.stop(offset + duration + 0.02);
      offset += duration + gap;
    } catch (_) {}
  }
}

function loadBvnSample(file) {
  if (typeof window === 'undefined' || typeof fetch !== 'function' || !file) {
    return Promise.resolve(null);
  }
  if (bvnSampleBuffers.has(file)) {
    return Promise.resolve(bvnSampleBuffers.get(file));
  }
  if (bvnSampleLoads.has(file)) {
    return bvnSampleLoads.get(file);
  }
  const p = (async () => {
    try {
      const ctx = ensureAudioGraph();
      if (!ctx) return null;
      const res = await fetch(getBvnSfxUrl(file), { mode: 'cors' });
      if (!res.ok) return null;
      const arr = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arr);
      bvnSampleBuffers.set(file, decoded);
      return decoded;
    } catch (_) {
      return null;
    }
  })();
  bvnSampleLoads.set(file, p);
  return p;
}

export function preloadBvnSfx() {
  if (typeof window === 'undefined' || sliderVolume <= 0) return;
  for (const file of BVN_SFX_FILES) {
    loadBvnSample(file);
  }
}

function playBvnSample(file, { bus = 'sfx', gain = 0.65, jitter = true } = {}) {
  const ctx = ensureAudioGraph();
  if (!ctx || sliderVolume <= 0) return false;
  const buffer = bvnSampleBuffers.get(file);
  if (!buffer) {
    // Trigger lazy background decode for subsequent hits while chiptune covers this hit
    loadBvnSample(file);
    return false;
  }
  const targetBus = bus === 'ui' ? uiBus || sfxBus : sfxBus;
  if (!targetBus) return false;
  try {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = jitter ? 0.96 + Math.random() * 0.08 : 1;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(targetBus);
    src.start(ctx.currentTime);
    return true;
  } catch (_) {
    return false;
  }
}

export function getArenaBgmVolume() {
  return bgmSliderVolume;
}

export function setArenaBgmVolume(slider01) {
  bgmSliderVolume = Math.max(0, Math.min(1, Number(slider01) || 0));
  try {
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(BGM_VOL_STORAGE_KEY, String(bgmSliderVolume));
    }
  } catch (_) {}
  if (lobbyBgmAudio) {
    lobbyBgmAudio.volume = bgmSliderVolume * 0.65;
    if (bgmSliderVolume <= 0) {
      lobbyBgmAudio.pause();
    } else if (lobbyBgmWanted && lobbyBgmAudio.paused) {
      lobbyBgmAudio.play().catch(() => {});
    }
  }
}

function tryPlayLobbyBgmNow() {
  if (!lobbyBgmWanted || bgmSliderVolume <= 0 || typeof window === 'undefined') return;
  if (!lobbyBgmAudio) {
    lobbyBgmAudio = new Audio(getBvnBgmUrl('op.mp3'));
    lobbyBgmAudio.crossOrigin = 'anonymous';
    lobbyBgmAudio.loop = true;
    lobbyBgmAudio.preload = 'auto';
  }
  lobbyBgmAudio.volume = bgmSliderVolume * 0.65;
  lobbyBgmAudio.play().catch(() => {
    if (!lobbyUnlockBound) {
      lobbyUnlockBound = true;
      const unlock = () => {
        lobbyUnlockBound = false;
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
        if (lobbyBgmWanted && bgmSliderVolume > 0 && lobbyBgmAudio) {
          lobbyBgmAudio.play().catch(() => {});
        }
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  });
}

export function startLobbyBgm() {
  lobbyBgmWanted = true;
  tryPlayLobbyBgmNow();
}

export function stopLobbyBgm() {
  lobbyBgmWanted = false;
  if (lobbyBgmAudio) {
    try {
      lobbyBgmAudio.pause();
      lobbyBgmAudio.currentTime = 0;
    } catch (_) {}
  }
}

export function preloadCharacterUltiSfx(characterId) {
  const id = String(characterId || '').trim();
  if (!id || typeof window === 'undefined' || typeof fetch !== 'function') {
    return Promise.resolve(null);
  }
  if (charUltiBuffers.has(id)) return Promise.resolve(charUltiBuffers.get(id));
  if (charUltiLoads.has(id)) return charUltiLoads.get(id);

  const p = (async () => {
    try {
      const ctx = ensureAudioGraph();
      if (!ctx) return null;
      const res = await fetch(getBvnFighterUrl(id, 'ulti.mp3'), { mode: 'cors' });
      if (!res.ok) return null;
      const arr = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arr);
      charUltiBuffers.set(id, decoded);
      return decoded;
    } catch (_) {
      return null;
    }
  })();
  charUltiLoads.set(id, p);
  return p;
}

export function playCharacterUltiSfx(characterId) {
  if (typeof window === 'undefined' || sliderVolume <= 0) return;
  const ctx = ensureAudioGraph();
  if (!ctx || !sfxBus) return;
  const id = String(characterId || '').trim();
  const playBuf = (buffer) => {
    try {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const g = ctx.createGain();
      g.gain.value = 0.92;
      src.connect(g);
      g.connect(sfxBus);
      src.start(ctx.currentTime);
    } catch (_) {}
  };

  const cached = charUltiBuffers.get(id);
  if (cached) {
    playBuf(cached);
    return;
  }
  // Load on-demand; if decoded fast, play it immediately, otherwise trigger crisp energy impact
  preloadCharacterUltiSfx(id).then((decoded) => {
    if (decoded) {
      playBuf(decoded);
    } else {
      playBattleSfx('crit', { combo: 4 });
    }
  });
}

export function playWordAudio(word, rate = 0.9) {
  if (!word) return;

  // 1. Prioritize Cloudflare / TTS backend if available
  if (typeof window !== 'undefined' && window.HiAudio && typeof window.HiAudio.playWord === 'function') {
    try {
      window.HiAudio.playWord(word, rate);
      return;
    } catch (_) {}
  }

  // 2. Dictionary fallback
  if (typeof window !== 'undefined' && window.HiDict && typeof window.HiDict.playWordAudio === 'function') {
    try {
      window.HiDict.playWordAudio(word, rate);
      return;
    } catch (_) {}
  }

  // 3. Native Browser Web Speech API fallback
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  }
}

export function playSound(type) {
  if (typeof window !== 'undefined' && window.soundEngine && typeof window.soundEngine.play === 'function') {
    try {
      window.soundEngine.play(type);
      return;
    } catch (_) {}
  }
  playBattleSfx(type);
}

export function playBattleSfx(sfx, opts = {}) {
  if (typeof window === 'undefined' || sliderVolume <= 0) return;
  const comboStep = Math.min(6, Math.max(0, Number(opts.combo) || 0));
  const comboMult = 1 + comboStep * 0.055;

  switch (sfx) {
    case 'ui_hover':
      if (!playBvnSample('snd_menu1.mp3', { bus: 'ui', gain: 0.42 })) {
        playToneSequence([{ freq: 660, duration: 0.028, type: 'triangle', gain: 0.06 }], { bus: 'ui' });
      }
      break;
    case 'ui_select':
      if (!playBvnSample('snd_menu2.mp3', { bus: 'ui', gain: 0.55 })) {
        playToneSequence(
          [
            { freq: 523.25, duration: 0.04, type: 'square', gain: 0.08, gap: 0.008 },
            { freq: 783.99, duration: 0.06, type: 'square', gain: 0.09 },
          ],
          { bus: 'ui' }
        );
      }
      break;
    case 'vs_gong':
      playBvnSample('snd_ghost_jump.mp3', { bus: 'sfx', gain: 0.65, jitter: false });
      playNoiseBurst({ duration: 0.14, cutoff: 650, gain: 0.16 });
      playToneSequence(
        [
          { freq: 196, slideTo: 130.81, duration: 0.16, type: 'sawtooth', gain: 0.12, gap: 0.01 },
          { freq: 392, duration: 0.14, type: 'square', gain: 0.1 },
        ],
        { jitter: false }
      );
      break;
    case 'fight_start':
      playBvnSample('snd_ghost_dash.mp3', { bus: 'sfx', gain: 0.55, jitter: false });
      playToneSequence(
        [
          { freq: 523.25, duration: 0.06, type: 'square', gain: 0.1, gap: 0.01 },
          { freq: 659.25, duration: 0.06, type: 'square', gain: 0.1, gap: 0.01 },
          { freq: 1046.5, duration: 0.16, type: 'square', gain: 0.13 },
        ],
        { jitter: false }
      );
      break;
    case 'hit':
    case 'correct':
      playBvnSample('snd_ghost_dash.mp3', { bus: 'sfx', gain: 0.58 });
      playNoiseBurst({ duration: 0.055, cutoff: 1850, gain: 0.11 });
      playToneSequence([
        { freq: 523.25 * comboMult, duration: 0.055, type: 'square', gain: 0.1, gap: 0.008 },
        { freq: 783.99 * comboMult, duration: 0.085, type: 'triangle', gain: 0.12 },
      ]);
      break;
    case 'crit':
      if (!playBvnSample('snd_over_hit.mp3', { bus: 'sfx', gain: 0.78 })) {
        playNoiseBurst({ duration: 0.09, cutoff: 2300, gain: 0.16 });
      }
      playToneSequence([
        { freq: 587.33 * comboMult, duration: 0.05, type: 'square', gain: 0.11, gap: 0.006 },
        { freq: 880 * comboMult, duration: 0.06, type: 'square', gain: 0.12, gap: 0.006 },
        { freq: 1174.66 * comboMult, duration: 0.13, type: 'square', gain: 0.13 },
      ]);
      break;
    case 'combo':
      playBvnSample('snd_over_hit.mp3', { bus: 'sfx', gain: 0.68 });
      playNoiseBurst({ duration: 0.07, cutoff: 2000, gain: 0.12 });
      playToneSequence([
        { freq: 587.33, duration: 0.05, type: 'square', gain: 0.1, gap: 0.006 },
        { freq: 783.99, duration: 0.055, type: 'square', gain: 0.11, gap: 0.006 },
        { freq: 1046.5, duration: 0.12, type: 'square', gain: 0.13 },
      ]);
      break;
    case 'powerup':
      if (!playBvnSample('snd_ghost_jump.mp3', { bus: 'sfx', gain: 0.65 })) {
        playToneSequence([
          { freq: 440, slideTo: 880, duration: 0.09, type: 'triangle', gain: 0.11, gap: 0.008 },
          { freq: 1174.66, duration: 0.11, type: 'square', gain: 0.1 },
        ]);
      }
      break;
    case 'damage':
    case 'incorrect':
      if (!playBvnSample('snd_error.mp3', { bus: 'sfx', gain: 0.65 })) {
        playNoiseBurst({ duration: 0.09, cutoff: 520, gain: 0.15 });
      }
      playToneSequence([
        { freq: 240, slideTo: 150, duration: 0.09, type: 'sawtooth', gain: 0.11, gap: 0.01 },
        { freq: 155, slideTo: 105, duration: 0.13, type: 'sawtooth', gain: 0.1 },
      ]);
      break;
    case 'tick':
      playToneSequence([{ freq: 880, duration: 0.038, type: 'square', gain: 0.06 }], { bus: 'ui' });
      break;
    case 'ko':
      if (!playBvnSample(comboStep >= 3 ? 'snd_ko_bs.mp3' : 'snd_ko.mp3', { bus: 'sfx', gain: 0.84, jitter: false })) {
        playNoiseBurst({ duration: 0.16, cutoff: 420, gain: 0.2 });
        playToneSequence(
          [
            { freq: 311.13, slideTo: 110, duration: 0.22, type: 'sawtooth', gain: 0.13, gap: 0.02 },
            { freq: 130.81, duration: 0.18, type: 'square', gain: 0.12 },
          ],
          { jitter: false }
        );
      }
      break;
    case 'victory':
    case 'complete':
      playToneSequence(
        [
          { freq: 523.25, duration: 0.08, type: 'square', gain: 0.12, gap: 0.01 },
          { freq: 659.25, duration: 0.08, type: 'square', gain: 0.12, gap: 0.01 },
          { freq: 783.99, duration: 0.08, type: 'square', gain: 0.12, gap: 0.01 },
          { freq: 1046.5, duration: 0.24, type: 'square', gain: 0.14 },
        ],
        { jitter: false }
      );
      break;
    case 'defeat':
      if (!playBvnSample('snd_gameover.mp3', { bus: 'sfx', gain: 0.72, jitter: false })) {
        playToneSequence(
          [
            { freq: 392, duration: 0.11, type: 'triangle', gain: 0.11, gap: 0.01 },
            { freq: 349.23, duration: 0.11, type: 'triangle', gain: 0.11, gap: 0.01 },
            { freq: 261.63, slideTo: 196, duration: 0.24, type: 'sawtooth', gain: 0.1 },
          ],
          { jitter: false }
        );
      }
      break;
    case 'emote':
      playToneSequence([{ freq: 740, slideTo: 920, duration: 0.065, type: 'triangle', gain: 0.08 }], { bus: 'ui' });
      break;
    default:
      break;
  }
}

export const sound = {
  playWordAudio,
  playSound,
  playBattleSfx,
  preloadBvnSfx,
  preloadCharacterUltiSfx,
  playCharacterUltiSfx,
  startLobbyBgm,
  stopLobbyBgm,
  getArenaAudioVolume,
  setArenaAudioVolume,
  getArenaBgmVolume,
  setArenaBgmVolume,
};

export default sound;
