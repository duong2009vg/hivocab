// src/services/studioService.js
// Client bridge between HiVocab React UI and PeakFour AI Engine on Modal.com
// Handles Kokoro TTS (with smart HiAudio fallback), OpenPronounce scoring,
// YouTube guest caption preview, and local browser progress/clip storage.

import { HiAudio } from './audioService.js';
import { convertBlobTo16kMonoWav } from '../utils/audioWavEncoder.js';

const DEFAULT_STUDIO_API_URL = 'https://duong2009vg--hivocab-peakfour-studio-fastapi-app.modal.run';
const STUDIO_URL_STORAGE_KEY = 'hivocab_studio_api_url';
const STUDIO_VOICE_STORAGE_KEY = 'hivocab_studio_voice';
const STUDIO_CREDIT_SAVER_KEY = 'hivocab_studio_credit_saver';
const STUDIO_PROGRESS_KEY = 'hivocab_studio_progress_v1';
const STUDIO_GUEST_CLIPS_KEY = 'hivocab_studio_guest_clips_v1';
const TTS_CACHE_NAME = 'hivocab-kokoro-tts-v1';
const MAX_GUEST_CLIPS = 12;
const MAX_TTS_CACHE = 40;
const MAX_SCORE_CACHE = 30;

const ttsBlobUrlCache = new Map();
const pronunciationScoreCache = new Map();
let activeStudioAudio = null;
let activeSampleEndTimer = null;
let lastPrewarmAt = 0;

const PREWARM_COOLDOWN_MS = 45000;

/**
 * Quietly wake the Modal container (throttled) when the learner starts recording so
 * the container is already warm by the time they click "Chấm sâu AI".
 */
export function prewarmStudioBackend() {
  if (typeof window === 'undefined') return;
  const baseUrl = getStudioApiUrl();
  if (!baseUrl) return;
  const now = Date.now();
  if (now - lastPrewarmAt < PREWARM_COOLDOWN_MS) return;
  lastPrewarmAt = now;
  try {
    fetch(`${baseUrl}/health`, { method: 'GET', cache: 'no-store', keepalive: true }).catch(() => {});
  } catch (_) {}
}

function normalizeBaseUrl(raw) {
  return String(raw || '')
    .trim()
    .replace(/\/+$/, '');
}

export function getStudioApiUrl() {
  if (typeof window !== 'undefined') {
    try {
      const saved = normalizeBaseUrl(window.localStorage.getItem(STUDIO_URL_STORAGE_KEY));
      if (saved) return saved;
    } catch (_) {}
  }
  const envUrl =
    typeof import.meta !== 'undefined' && import.meta.env
      ? normalizeBaseUrl(import.meta.env.VITE_STUDIO_API_URL)
      : '';
  return envUrl || DEFAULT_STUDIO_API_URL;
}

export function setStudioApiUrl(url) {
  const clean = normalizeBaseUrl(url);
  if (typeof window !== 'undefined') {
    try {
      if (clean) {
        window.localStorage.setItem(STUDIO_URL_STORAGE_KEY, clean);
      } else {
        window.localStorage.removeItem(STUDIO_URL_STORAGE_KEY);
      }
    } catch (_) {}
  }
  return clean;
}

export function getPreferredStudioVoice() {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(STUDIO_VOICE_STORAGE_KEY);
      if (saved) return saved;
    } catch (_) {}
  }
  return 'af_heart';
}

export function setPreferredStudioVoice(voiceId) {
  if (typeof window !== 'undefined' && voiceId) {
    try {
      window.localStorage.setItem(STUDIO_VOICE_STORAGE_KEY, String(voiceId));
    } catch (_) {}
  }
}

export function getStudioCreditSaver() {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(STUDIO_CREDIT_SAVER_KEY);
    if (raw === null) return true; // Default ON to protect Modal.com credits
    return raw !== '0' && raw !== 'false';
  } catch (_) {
    return true;
  }
}

export function setStudioCreditSaver(enabled) {
  const next = Boolean(enabled);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STUDIO_CREDIT_SAVER_KEY, next ? '1' : '0');
    } catch (_) {}
  }
  return next;
}

export function stopStudioAudio() {
  if (activeSampleEndTimer) {
    clearTimeout(activeSampleEndTimer);
    activeSampleEndTimer = null;
  }
  if (activeStudioAudio) {
    try {
      activeStudioAudio.onended = null;
      activeStudioAudio.onerror = null;
      activeStudioAudio.pause();
      activeStudioAudio.currentTime = 0;
    } catch (_) {}
    activeStudioAudio = null;
  }
  HiAudio.stop();
}

function sanitizeStudioSentenceForTts(text) {
  return String(text || '')
    .replace(/\.{2,}/g, ' ')
    .replace(/[/_—–-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function speakStudioWithWebSpeech(text, speed, lang, onFinish) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onFinish();
    return false;
  }
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = Math.max(0.5, Math.min(1.5, Number(speed) || 1.0));
    utter.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices() || [];
    const targetPrefix = lang.slice(0, 5).toLowerCase();
    const preferred =
      voices.find(
        (v) =>
          v.lang?.toLowerCase() === targetPrefix &&
          (v.name.includes('Google') || v.name.includes('Natural') || !v.localService)
      ) ||
      voices.find((v) => v.lang?.toLowerCase() === targetPrefix) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith('en'));
    if (preferred) utter.voice = preferred;

    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      if (activeSampleEndTimer) {
        clearTimeout(activeSampleEndTimer);
        activeSampleEndTimer = null;
      }
      onFinish();
    };
    utter.onend = done;
    utter.onerror = done;
    window.speechSynthesis.speak(utter);

    // Safety fallback timer in case mobile Safari/WebView drops speech.onend
    const estMs = Math.max(2500, Math.min(25000, Math.round((text.length / 11) * 1000 / utter.rate) + 2500));
    activeSampleEndTimer = setTimeout(done, estMs);
    return true;
  } catch (err) {
    console.warn('[StudioTTS] Web Speech error:', err);
    onFinish();
    return false;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function checkStudioBackendStatus(overrideUrl) {
  const baseUrl = normalizeBaseUrl(overrideUrl ?? getStudioApiUrl());
  if (!baseUrl) {
    return { configured: false, online: false, kokoroReady: false, voices: [], error: 'Chưa cấu hình URL Modal.com' };
  }
  try {
    const res = await fetchWithTimeout(`${baseUrl}/voices`, { method: 'GET', cache: 'no-store' }, 35000);
    if (!res.ok) {
      return {
        configured: true,
        online: false,
        kokoroReady: false,
        voices: [],
        error: `HTTP ${res.status}`,
      };
    }
    const data = await res.json();
    const voices = Array.isArray(data?.voices) ? data.voices : [];
    const kokoroReady = Boolean(data?.status?.ready || voices.length > 0);
    return {
      configured: true,
      online: true,
      kokoroReady,
      defaultVoice: data?.default || 'af_heart',
      voices,
      status: data?.status || null,
      error: null,
    };
  } catch (err) {
    return {
      configured: true,
      online: false,
      kokoroReady: false,
      voices: [],
      error: err?.name === 'AbortError' ? 'Kết nối quá hạn (server có thể đang cold start)' : err?.message || 'Không kết nối được server AI',
    };
  }
}

function cacheTtsUrl(cacheKey, blob) {
  if (ttsBlobUrlCache.size >= MAX_TTS_CACHE) {
    const oldestKey = ttsBlobUrlCache.keys().next().value;
    const oldestUrl = ttsBlobUrlCache.get(oldestKey);
    if (oldestUrl) {
      try {
        URL.revokeObjectURL(oldestUrl);
      } catch (_) {}
    }
    ttsBlobUrlCache.delete(oldestKey);
  }
  const objectUrl = URL.createObjectURL(blob);
  ttsBlobUrlCache.set(cacheKey, objectUrl);
  return objectUrl;
}

async function readPersistentTtsCache(cacheKey) {
  if (typeof window === 'undefined' || !window.caches) return null;
  try {
    const cache = await window.caches.open(TTS_CACHE_NAME);
    const hit = await cache.match(`https://hivocab-tts.local/${encodeURIComponent(cacheKey)}`);
    return hit ? await hit.blob() : null;
  } catch (_) {
    return null;
  }
}

async function writePersistentTtsCache(cacheKey, blob) {
  if (typeof window === 'undefined' || !window.caches) return;
  try {
    const cache = await window.caches.open(TTS_CACHE_NAME);
    await cache.put(
      `https://hivocab-tts.local/${encodeURIComponent(cacheKey)}`,
      new Response(blob.slice(0), { headers: { 'Content-Type': blob.type || 'audio/wav' } })
    );
  } catch (_) {}
}

/**
 * Play English text using free local HiAudio when Credit Saver is active ($0 Modal credits),
 * or Kokoro AI on Modal.com with persistent browser Cache Storage when requested.
 */
export async function playStudioTts({ text, voice = 'af_heart', speed = 1.0, forceKokoro = false, onEnded } = {}) {
  const cleanText = String(text || '').trim();
  if (!cleanText) {
    if (typeof onEnded === 'function') onEnded();
    return { engine: 'none', error: 'Thiếu nội dung để đọc' };
  }

  stopStudioAudio();
  const safeSpeed = Math.max(0.5, Math.min(1.5, Number(speed) || 1.0));
  const finishOnce = (() => {
    let called = false;
    return () => {
      if (called) return;
      called = true;
      if (typeof onEnded === 'function') onEnded();
    };
  })();

  const baseUrl = getStudioApiUrl();
  const useKokoro = Boolean(baseUrl) && (forceKokoro || !getStudioCreditSaver());

  if (useKokoro) {
    const cacheKey = `${baseUrl}::${voice}::${cleanText}`;
    try {
      let audioUrl = ttsBlobUrlCache.get(cacheKey);
      if (!audioUrl) {
        let blob = await readPersistentTtsCache(cacheKey);
        if (!blob || blob.size < 100) {
          const body = new FormData();
          body.append('text', cleanText.slice(0, 950));
          body.append('lang', 'en');
          body.append('voice', voice || 'af_heart');
          const res = await fetchWithTimeout(`${baseUrl}/tts`, { method: 'POST', body }, 45000);
          if (!res.ok) {
            throw new Error(`Kokoro HTTP ${res.status}`);
          }
          blob = await res.blob();
          if (!blob || blob.size < 100) throw new Error('Empty audio response');
          await writePersistentTtsCache(cacheKey, blob);
        }
        audioUrl = cacheTtsUrl(cacheKey, blob);
      }

      const audio = new Audio(audioUrl);
      audio.playbackRate = safeSpeed;
      activeStudioAudio = audio;
      audio.onended = finishOnce;
      audio.onerror = finishOnce;
      await audio.play();
      return { engine: 'kokoro', voice };
    } catch (err) {
      console.warn('[StudioTTS] Falling back to local TTS:', err?.message || err);
    }
  }

  const fallbackLang = String(voice || '').startsWith('b') ? 'en-GB' : 'en-US';
  const speechText = sanitizeStudioSentenceForTts(cleanText);
  if (!speechText) {
    finishOnce();
    return { engine: 'none', voice };
  }

  // Google Translate TTS (/api/tts) rejects queries longer than ~200 chars;
  // use Web Speech directly for long sentences and /api/tts -> Web Speech fallback for shorter ones.
  if (speechText.length <= 185 && typeof Audio !== 'undefined') {
    const proxyLang = fallbackLang === 'en-GB' ? 'en-GB' : 'en';
    const ttsUrl = `/api/tts?text=${encodeURIComponent(speechText)}&tl=${encodeURIComponent(proxyLang)}`;
    try {
      const audio = new Audio(ttsUrl);
      audio.playbackRate = safeSpeed;
      activeStudioAudio = audio;
      let fellBack = false;
      const fallbackToSpeech = () => {
        if (fellBack || activeStudioAudio !== audio) return;
        fellBack = true;
        activeStudioAudio = null;
        speakStudioWithWebSpeech(speechText, safeSpeed, fallbackLang, finishOnce);
      };
      audio.onended = () => {
        if (activeStudioAudio === audio) activeStudioAudio = null;
        finishOnce();
      };
      audio.onerror = fallbackToSpeech;
      await audio.play();
      return { engine: 'api-tts', voice };
    } catch (err) {
      if (err?.name === 'AbortError') {
        finishOnce();
        return { engine: 'aborted', voice };
      }
      activeStudioAudio = null;
    }
  }

  const ok = speakStudioWithWebSpeech(speechText, safeSpeed, fallbackLang, finishOnce);
  if (!ok) {
    HiAudio.playWord(speechText, safeSpeed, fallbackLang);
  }
  return { engine: 'speech', voice };
}

/**
 * Send recorded microphone audio to OpenPronounce on Modal.com for phoneme scoring.
 * Caches identical audio blobs in memory to avoid billing Modal twice on repeat clicks.
 */
export async function scorePronunciation({ blob, filename = 'recording.webm', expectedText, lang = 'en' } = {}) {
  const baseUrl = getStudioApiUrl();
  if (!baseUrl) {
    throw new Error('Chưa cấu hình URL Modal.com để chấm phát âm AI OpenPronounce.');
  }
  if (!(blob instanceof Blob) || blob.size <= 0) {
    throw new Error('Không có bản ghi âm hợp lệ.');
  }
  if (typeof expectedText !== 'string' || !expectedText.trim()) {
    throw new Error('Thiếu câu mục tiêu để chấm phát âm.');
  }

  const trimmedTarget = expectedText.trim();
  const scoreKey = `${baseUrl}::${blob.size}::${blob.type || 'audio'}::${lang}::${trimmedTarget}`;
  if (pronunciationScoreCache.has(scoreKey)) {
    return pronunciationScoreCache.get(scoreKey);
  }

  const uploadBlob = await convertBlobTo16kMonoWav(blob);
  const uploadName = uploadBlob !== blob && uploadBlob.type === 'audio/wav' ? 'recording.wav' : filename;

  const body = new FormData();
  body.append('file', uploadBlob, uploadName);
  body.append('expected_text', trimmedTarget);
  body.append('lang', lang);

  const res = await fetchWithTimeout(`${baseUrl}/pronunciation`, { method: 'POST', body }, 60000);
  if (!res.ok) {
    let detail = '';
    try {
      const errData = await res.json();
      detail = typeof errData?.detail === 'string' ? errData.detail : '';
    } catch (_) {}
    throw new Error(detail || `Lỗi OpenPronounce (HTTP ${res.status})`);
  }

  const data = await res.json();
  if (!data || typeof data.score !== 'number' || !Number.isFinite(data.score) || !data.differences) {
    throw new Error('Dữ liệu chấm phát âm trả về không hợp lệ.');
  }
  const tagged = { ...data, engine: data.engine || 'modal-ai' };
  if (pronunciationScoreCache.size >= MAX_SCORE_CACHE) {
    const oldestKey = pronunciationScoreCache.keys().next().value;
    pronunciationScoreCache.delete(oldestKey);
  }
  pronunciationScoreCache.set(scoreKey, tagged);
  return tagged;
}

/**
 * Fetch timed captions for a YouTube URL via PeakFour's guest preview endpoint on Modal.
 */
export async function fetchYoutubeCaptionsPreview({ youtubeUrl, title = '', author = 'YouTube' } = {}) {
  const baseUrl = getStudioApiUrl();
  if (!baseUrl) {
    throw new Error('Cần kết nối Modal.com AI Server để tự động tách phụ đề từ link YouTube mới.');
  }
  const res = await fetchWithTimeout(
    `${baseUrl}/api/v1/shadowing/guest/preview`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        youtube_url: youtubeUrl,
        title: title.trim(),
        author: author.trim(),
        include_vi: true,
      }),
    },
    30000
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : `HTTP ${res.status}`);
  }
  return data;
}

// --- Local Progress & Custom Clips Persistence ---

export function loadStudioProgress() {
  if (typeof window === 'undefined') {
    return { dictation: {}, pronunciation: {}, shadowingChecked: {} };
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STUDIO_PROGRESS_KEY) || '{}');
    return {
      dictation: parsed?.dictation && typeof parsed.dictation === 'object' ? parsed.dictation : {},
      pronunciation: parsed?.pronunciation && typeof parsed.pronunciation === 'object' ? parsed.pronunciation : {},
      shadowingChecked:
        parsed?.shadowingChecked && typeof parsed.shadowingChecked === 'object' ? parsed.shadowingChecked : {},
    };
  } catch (_) {
    return { dictation: {}, pronunciation: {}, shadowingChecked: {} };
  }
}

function persistStudioProgress(next) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STUDIO_PROGRESS_KEY, JSON.stringify(next));
  } catch (_) {}
}

export function saveDictationScore(lessonId, lineKey, score) {
  const current = loadStudioProgress();
  if (!current.dictation[lessonId]) current.dictation[lessonId] = {};
  const prev = current.dictation[lessonId][lineKey];
  if (typeof prev !== 'number' || score > prev) {
    current.dictation[lessonId][lineKey] = score;
    persistStudioProgress(current);
  }
  return current;
}

export function savePronunciationScore(itemKey, score) {
  const current = loadStudioProgress();
  const prev = current.pronunciation[itemKey];
  if (typeof prev !== 'number' || score > prev) {
    current.pronunciation[itemKey] = score;
    persistStudioProgress(current);
  }
  return current;
}

export function saveShadowingCueScore(clipId, cueIndex, score) {
  const current = loadStudioProgress();
  if (!current.shadowingChecked[clipId]) current.shadowingChecked[clipId] = {};
  const prev = current.shadowingChecked[clipId][String(cueIndex)];
  if (typeof prev !== 'number' || score > prev) {
    current.shadowingChecked[clipId][String(cueIndex)] = score;
    persistStudioProgress(current);
  }
  return current;
}

export function getCustomGuestClips() {
  if (typeof window === 'undefined') return [];
  try {
    const rows = JSON.parse(window.localStorage.getItem(STUDIO_GUEST_CLIPS_KEY) || '[]');
    return Array.isArray(rows) ? rows.slice(0, MAX_GUEST_CLIPS) : [];
  } catch (_) {
    return [];
  }
}

export function saveCustomGuestClip(clipEntry) {
  const existing = getCustomGuestClips().filter((x) => x.id !== clipEntry.id && x.youtube_video_id !== clipEntry.youtube_video_id);
  const next = [clipEntry, ...existing].slice(0, MAX_GUEST_CLIPS);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STUDIO_GUEST_CLIPS_KEY, JSON.stringify(next));
  }
  return next;
}

export function removeCustomGuestClip(clipId) {
  const next = getCustomGuestClips().filter((x) => x.id !== clipId);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STUDIO_GUEST_CLIPS_KEY, JSON.stringify(next));
  }
  return next;
}
