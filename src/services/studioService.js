// src/services/studioService.js
// Client bridge between HiVocab React UI and PeakFour AI Engine on Modal.com
// Handles Kokoro TTS (with smart HiAudio fallback), OpenPronounce scoring,
// YouTube guest caption preview, and local browser progress/clip storage.

import { HiAudio } from './audioService.js';
import { convertBlobTo16kMonoWav } from '../utils/audioWavEncoder.js';
import { supabase } from '../lib/supabaseClient.js';

const DEFAULT_STUDIO_API_URL = 'https://duong2009vg--hivocab-peakfour-studio-fastapi-app.modal.run';
const STUDIO_URL_STORAGE_KEY = 'hivocab_studio_api_url';
const STUDIO_VOICE_STORAGE_KEY = 'hivocab_studio_voice';
const STUDIO_CREDIT_SAVER_KEY = 'hivocab_studio_credit_saver';
const STUDIO_PROGRESS_KEY = 'hivocab_studio_progress_v1';
const STUDIO_GUEST_CLIPS_KEY = 'hivocab_studio_guest_clips_v1';
const TTS_CACHE_NAME = 'hivocab-kokoro-tts-v1';
export const MAX_USER_YOUTUBE_VIDEOS = 5;
const MAX_GUEST_CLIPS = MAX_USER_YOUTUBE_VIDEOS;
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

function isAllowedStudioUrl(raw) {
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    if (parsed.protocol === 'https:' && host.endsWith('.modal.run')) return true;
    if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && (host === 'localhost' || host === '127.0.0.1')) return true;
    return false;
  } catch {
    return false;
  }
}

export function getStudioApiUrl() {
  if (typeof window !== 'undefined') {
    try {
      const saved = normalizeBaseUrl(window.localStorage.getItem(STUDIO_URL_STORAGE_KEY));
      if (saved && isAllowedStudioUrl(saved)) return saved;
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
  if (clean && !isAllowedStudioUrl(clean)) {
    throw new Error('URL Studio Backend phải dùng HTTPS (*.modal.run) hoặc localhost.');
  }
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
  const uploadType = String(uploadBlob?.type || '').toLowerCase();
  const uploadName = uploadType.includes('wav')
    ? 'recording.wav'
    : uploadType.includes('mp4') || uploadType.includes('aac') || uploadType.includes('m4a')
    ? 'recording.mp4'
    : uploadType.includes('ogg')
    ? 'recording.ogg'
    : filename;

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
 * Fetch timed captions (and Vietnamese translation track) for a YouTube URL
 * via Cloudflare Pages Function (/api/youtube-captions).
 */
export async function fetchYoutubeCaptionsPreview({ youtubeUrl, title = '', author = 'YouTube' } = {}) {
  let authHeaders = {};
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      authHeaders = { Authorization: `Bearer ${data.session.access_token}` };
    }
  } catch (_) {}

  const res = await fetchWithTimeout(
    '/api/youtube-captions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
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
    const msg =
      typeof data?.detail === 'string'
        ? data.detail
        : typeof data?.error === 'string'
          ? data.error
          : `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.code = data?.code || '';
    throw err;
  }
  return data;
}

/**
 * Background batch-translate missing Vietnamese cues for long clips via /api/translate (requires login).
 */
export async function translateShadowingTexts(texts = []) {
  const clean = (Array.isArray(texts) ? texts : []).map((t) => String(t || '').trim()).slice(0, 24);
  if (!clean.length) return [];
  let token = '';
  try {
    const { data } = await supabase.auth.getSession();
    token = data?.session?.access_token || '';
  } catch (_) {}
  if (!token) return [];

  const res = await fetchWithTimeout(
    '/api/translate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ texts: clean, from: 'en', to: 'vi' }),
    },
    10000
  );
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json().catch(() => ({}));
  return Array.isArray(data?.translations) ? data.translations : [];
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

function normalizeGuestClip(clip) {
  if (!clip || typeof clip !== 'object') return clip;
  const cues = Array.isArray(clip.cues) ? clip.cues : [];
  const startSec = Number(clip.start_seconds || 0);
  // Fix legacy guest clips where start_seconds mirrored cues[0].start while cues remained video-absolute.
  if (clip.guest && startSec > 0 && cues.length > 0 && Number(cues[0]?.start || 0) >= startSec) {
    return {
      ...clip,
      start_seconds: 0,
      end_seconds: Math.max(Number(clip.end_seconds || 0), Math.ceil(Number(cues[cues.length - 1]?.end || 0) + 1)),
    };
  }
  return clip;
}

export function getCustomGuestClips() {
  if (typeof window === 'undefined') return [];
  try {
    const rows = JSON.parse(window.localStorage.getItem(STUDIO_GUEST_CLIPS_KEY) || '[]');
    return Array.isArray(rows) ? rows.slice(0, MAX_GUEST_CLIPS).map(normalizeGuestClip) : [];
  } catch (_) {
    return [];
  }
}

export function saveCustomGuestClip(clipEntry) {
  const normalized = normalizeGuestClip(clipEntry);
  const existing = getCustomGuestClips().filter(
    (x) => x.id !== normalized.id && x.youtube_video_id !== normalized.youtube_video_id
  );
  const next = [normalized, ...existing].slice(0, MAX_GUEST_CLIPS);
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

function mapSavedYoutubeRowToClip(row) {
  const base = row?.clip_data && typeof row.clip_data === 'object' ? row.clip_data : {};
  return normalizeGuestClip({
    ...base,
    id: base.id || row.clip_id,
    db_id: row.id,
    title: base.title || row.title,
    author: base.author || row.author || 'YouTube',
    youtube_video_id: base.youtube_video_id || row.youtube_video_id,
    level: 'Custom',
    genre: base.genre || 'Video cá nhân',
    personal: true,
    guest: true,
  });
}

const YOUTUBE_LIMIT_SETTING_KEY = 'user_youtube_video_limit';

export function clampYoutubeVideoLimit(raw, fallback = MAX_USER_YOUTUBE_VIDEOS) {
  const n = Number.parseInt(String(raw ?? '').trim(), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(100, n);
}

export async function fetchUserYoutubeVideoLimit() {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', YOUTUBE_LIMIT_SETTING_KEY)
      .maybeSingle();
    if (!error && data?.value != null) {
      return clampYoutubeVideoLimit(data.value, MAX_USER_YOUTUBE_VIDEOS);
    }
  } catch (_) {}
  return MAX_USER_YOUTUBE_VIDEOS;
}

export async function saveAdminYoutubeVideoLimit(nextLimit) {
  const validLimit = clampYoutubeVideoLimit(nextLimit, -1);
  if (validLimit < 1 || validLimit > 100) {
    throw new Error('Giới hạn số video phải từ 1 đến 100.');
  }
  const { error } = await supabase.from('system_settings').upsert({
    key: YOUTUBE_LIMIT_SETTING_KEY,
    value: String(validLimit),
    description: 'Giới hạn số video YouTube cá nhân tối đa mỗi tài khoản trong Shadowing & Dictation Studio',
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return validLimit;
}

export async function loadUserYoutubeVideos() {
  const limit = await fetchUserYoutubeVideoLimit();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return { authenticated: false, userId: null, clips: [], limit };
    }
    const { data, error } = await supabase
      .from('user_youtube_videos')
      .select('id, clip_id, youtube_video_id, title, author, clip_data, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return {
      authenticated: true,
      userId: user.id,
      clips: (data || []).map(mapSavedYoutubeRowToClip),
      limit,
    };
  } catch (err) {
    return {
      authenticated: false,
      userId: null,
      clips: [],
      limit,
      error: err?.message || 'Không thể tải danh sách video YouTube cá nhân.',
    };
  }
}

export async function deleteUserYoutubeVideo(clip) {
  if (!clip) return loadUserYoutubeVideos();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error('Vui lòng đăng nhập để xóa video cá nhân.');
  }
  let query = supabase.from('user_youtube_videos').delete().eq('user_id', user.id);
  if (clip.db_id) {
    query = query.eq('id', clip.db_id);
  } else if (clip.youtube_video_id) {
    query = query.eq('youtube_video_id', clip.youtube_video_id);
  } else if (clip.id) {
    query = query.eq('clip_id', clip.id);
  }
  const { error } = await query;
  if (error) throw error;
  if (clip.id) removeCustomGuestClip(clip.id);
  return loadUserYoutubeVideos();
}

const videoCuesCache = new Map();

/**
 * Lazy-load cues array for a system Shadowing video via /api/corpus?name=studio-shadowing-cues.
 */
export async function fetchStudioVideoCues(videoId) {
  const id = String(videoId || '').trim();
  if (!id) return [];
  if (videoCuesCache.has(id)) {
    return videoCuesCache.get(id);
  }

  let authHeaders = {};
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      authHeaders = { Authorization: `Bearer ${data.session.access_token}` };
    }
  } catch (_) {}

  const res = await fetchWithTimeout(
    `/api/corpus?name=studio-shadowing-cues&video_id=${encodeURIComponent(id)}`,
    { headers: authHeaders },
    15000
  );
  if (!res.ok) {
    throw new Error(`Không tải được phụ đề video (HTTP ${res.status}).`);
  }
  const data = await res.json().catch(() => ({}));
  const cues = Array.isArray(data?.cues) ? data.cues : [];
  videoCuesCache.set(id, cues);
  return cues;
}

async function getAdminAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) {
    throw new Error('Phiên đăng nhập Admin đã hết hạn. Vui lòng tải lại trang.');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function adminResolveYoutubeChannel({ channelUrl, limit = 20, cursor = null } = {}) {
  const headers = await getAdminAuthHeaders();
  const res = await fetchWithTimeout(
    '/api/admin/studio-import',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'resolve_channel',
        channel_url: channelUrl,
        limit,
        ...(cursor ? { cursor } : {}),
      }),
    },
    25000
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    const err = new Error(data?.error || data?.detail || `HTTP ${res.status}`);
    err.code = data?.code || '';
    throw err;
  }
  return data;
}

export async function adminImportStudioYoutubeVideo({
  youtubeUrl,
  title = '',
  channelName = '',
  level = 'B1',
  genre = '',
  isPublished = true,
} = {}) {
  const headers = await getAdminAuthHeaders();
  const res = await fetchWithTimeout(
    '/api/admin/studio-import',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'import_single',
        youtube_url: youtubeUrl,
        title,
        channel_name: channelName,
        level,
        genre,
        is_published: isPublished,
      }),
    },
    30000
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    const err = new Error(data?.error || data?.detail || `HTTP ${res.status}`);
    err.code = data?.code || '';
    throw err;
  }
  if (data?.video?.id) {
    videoCuesCache.delete(data.video.id);
  }
  return data.video;
}

export async function adminListStudioVideos() {
  const { data, error } = await supabase
    .from('studio_videos')
    .select('id, youtube_video_id, title, channel_name, author, genre, level, cue_count, is_pro, is_published, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function adminUpdateStudioVideo(id, patch) {
  const { error } = await supabase
    .from('studio_videos')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  videoCuesCache.delete(id);
}

export async function adminDeleteStudioVideo(id) {
  const { error } = await supabase
    .from('studio_videos')
    .delete()
    .eq('id', id);
  if (error) throw error;
  videoCuesCache.delete(id);
}

export async function updateUserYoutubeVideoCues(clip) {
  if (!clip?.youtube_video_id) return;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return;
    await supabase
      .from('user_youtube_videos')
      .update({
        clip_data: clip,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('youtube_video_id', clip.youtube_video_id);
  } catch (_) {}
}
