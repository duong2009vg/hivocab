// functions/api/youtube-captions.js
// Cloudflare Pages Function — YouTube timedtext caption & Vietnamese translation extractor
import { checkRateLimit, rateLimitResponse } from '../_rateLimit.js';

const WATCH_URL = 'https://www.youtube.com/watch';
const EMBED_URL = 'https://www.youtube.com/embed';
const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/player';
const INNERTUBE_CLIENTS = [
  {
    name: 'ANDROID',
    userAgent: 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)',
    context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38', hl: 'en' } },
  },
  {
    name: 'IOS',
    userAgent: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3 like Mac OS X)',
    context: { client: { clientName: 'IOS', clientVersion: '20.10.4', hl: 'en' } },
  },
];

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const MAX_DURATION_SECONDS = 3600;
const MAX_CUES = 400;
const MAX_CUE_CHARS = 700;
const MAX_VI_CHARS = 500;

function getCorsHeaders(request) {
  const origin = request?.headers?.get('Origin') || '';
  const isAllowed =
    origin === 'https://hivocab.site'
    || origin === 'https://www.hivocab.site'
    || /^https:\/\/[a-z0-9-]+\.hivocab\.pages\.dev$/i.test(origin)
    || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://hivocab.site',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function jsonResponse(payload, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

async function fetchWithTimeout(url, init = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractYoutubeVideoId(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('youtu.be')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0] || '';
      if (/^[A-Za-z0-9_-]{11}$/.test(id)) return id;
    }
    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      const v = parsed.searchParams.get('v') || '';
      if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      const parts = parsed.pathname.split('/').filter(Boolean);
      for (const prefix of ['shorts', 'embed', 'live', 'v']) {
        const idx = parts.indexOf(prefix);
        if (idx !== -1 && parts[idx + 1] && /^[A-Za-z0-9_-]{11}$/.test(parts[idx + 1])) {
          return parts[idx + 1];
        }
      }
    }
  } catch {
    // Fallback regex below
  }

  const m = raw.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}

function decodeHtmlEntities(input) {
  let s = String(input || '');
  // Decode up to 2 passes (YouTube double-encodes &amp;#39; in some XML responses)
  for (let pass = 0; pass < 2; pass++) {
    const prev = s;
    s = s
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#(\d+);/g, (_, dec) => {
        const cp = Number(dec);
        return Number.isFinite(cp) && cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : _;
      })
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        const cp = parseInt(hex, 16);
        return Number.isFinite(cp) && cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : _;
      });
    if (s === prev) break;
  }
  return s;
}

function cleanCaptionText(raw) {
  let text = decodeHtmlEntities(raw);
  text = text.replace(/<[^>]*>/gi, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function extractBalancedJsonObject(html, marker) {
  const idx = html.indexOf(marker);
  if (idx === -1) return null;
  const start = html.indexOf('{', idx + marker.length);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function extractHtmlTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return '';
  return cleanCaptionText(match[1]).replace(/\s*-\s*YouTube$/i, '').trim();
}

function checkPlayability(playerJson) {
  const status = playerJson?.playabilityStatus?.status;
  if (!status || status === 'OK') return { ok: true };
  const reason = String(playerJson?.playabilityStatus?.reason || '').trim();
  if (status === 'LOGIN_REQUIRED') {
    if (reason.includes("Sign in to confirm you're not a bot")) {
      return { ok: false, code: 'REQUEST_BLOCKED', detail: 'YouTube tạm giới hạn truy cập từ máy chủ này. Vui lòng thử lại sau ít phút.' };
    }
    return { ok: false, code: 'VIDEO_UNAVAILABLE', detail: 'Video yêu cầu đăng nhập hoặc bị giới hạn độ tuổi.' };
  }
  if (status === 'ERROR' && reason.includes('This video is unavailable')) {
    return { ok: false, code: 'VIDEO_UNAVAILABLE', detail: 'Video YouTube không tồn tại hoặc ở chế độ riêng tư.' };
  }
  return { ok: false, code: 'PLAYABILITY_ERROR', detail: reason || 'Không thể truy cập video YouTube này.' };
}

function extractCaptionRenderer(playerJson) {
  return playerJson?.captions?.playerCaptionsTracklistRenderer || null;
}

async function tryInnertubeClients(videoId, apiKey = '') {
  let lastBlockError = null;
  let videoTitle = '';
  let videoAuthor = '';
  let hadPlayableOkWithoutCaptions = false;
  let lastHttpStatus = 0;

  const endpoint = apiKey
    ? `${INNERTUBE_API_URL}?key=${encodeURIComponent(apiKey)}&prettyPrint=false`
    : `${INNERTUBE_API_URL}?prettyPrint=false`;

  for (const clientSpec of INNERTUBE_CLIENTS) {
    try {
      const playerRes = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': clientSpec.userAgent || BROWSER_USER_AGENT,
          },
          body: JSON.stringify({
            context: clientSpec.context,
            videoId,
            racyCheckOk: true,
            contentCheckOk: true,
          }),
        },
        10000
      );
      lastHttpStatus = playerRes.status;
      if (!playerRes.ok) continue;
      const playerJson = await playerRes.json().catch(() => null);
      if (!playerJson) continue;

      if (!videoTitle && playerJson?.videoDetails?.title) {
        videoTitle = String(playerJson.videoDetails.title);
      }
      if (!videoAuthor && playerJson?.videoDetails?.author) {
        videoAuthor = String(playerJson.videoDetails.author);
      }

      const renderer = extractCaptionRenderer(playerJson);
      if (renderer && Array.isArray(renderer.captionTracks) && renderer.captionTracks.length > 0) {
        return {
          found: {
            renderer,
            title: cleanCaptionText(videoTitle),
            author: cleanCaptionText(videoAuthor),
          },
        };
      }

      const playability = checkPlayability(playerJson);
      if (playability.ok) {
        hadPlayableOkWithoutCaptions = true;
      } else {
        lastBlockError = playability;
      }
    } catch {
      // Try next InnerTube client
    }
  }

  return {
    found: null,
    lastBlockError,
    videoTitle,
    videoAuthor,
    hadPlayableOkWithoutCaptions,
    lastHttpStatus,
  };
}

async function fetchPlayerData(videoId) {
  // Primary path: direct InnerTube /youtubei/v1/player (avoids /watch HTML 429 rate limits on Workers)
  const direct = await tryInnertubeClients(videoId, '');
  if (direct.found) return direct.found;
  if (direct.hadPlayableOkWithoutCaptions) {
    throw { status: 404, detail: 'Video này đã tắt phụ đề hoặc không có track phụ đề.' };
  }

  let lastBlockError = direct.lastBlockError;
  let videoTitle = direct.videoTitle || '';
  let videoAuthor = direct.videoAuthor || '';

  // Secondary fallback: try embed page, then watch page for INNERTUBE_API_KEY / ytInitialPlayerResponse
  const fallbackUrls = [
    `${EMBED_URL}/${encodeURIComponent(videoId)}?hl=en`,
    `${WATCH_URL}?v=${encodeURIComponent(videoId)}&hl=en&bpctr=9999999999&has_verified=1`,
  ];

  let lastPageStatus = direct.lastHttpStatus || 502;
  let sawRecaptcha = false;

  for (const pageUrl of fallbackUrls) {
    try {
      const res = await fetchWithTimeout(
        pageUrl,
        {
          headers: {
            'User-Agent': BROWSER_USER_AGENT,
            'Accept-Language': 'en-US,en;q=0.9',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        },
        10000
      );
      lastPageStatus = res.status;
      if (!res.ok) continue;

      let html = decodeHtmlEntities(await res.text());
      if (html.includes('action="https://consent.youtube.com/s"')) {
        const vMatch = html.match(/name="v"\s+value="(.*?)"/);
        const consentCookie = vMatch ? `CONSENT=YES+${vMatch[1]}` : 'CONSENT=YES+cb.20210328-17-p0.en+FX+999';
        const retryRes = await fetchWithTimeout(
          pageUrl,
          {
            headers: {
              'User-Agent': BROWSER_USER_AGENT,
              'Accept-Language': 'en-US,en;q=0.9',
              Cookie: consentCookie,
            },
          },
          10000
        );
        if (retryRes.ok) {
          html = decodeHtmlEntities(await retryRes.text());
        }
      }

      if (html.includes('class="g-recaptcha"')) {
        sawRecaptcha = true;
      }

      if (!videoTitle) {
        videoTitle = extractHtmlTitle(html);
      }

      const embeddedPlayer =
        extractBalancedJsonObject(html, 'var ytInitialPlayerResponse =')
        || extractBalancedJsonObject(html, 'ytInitialPlayerResponse =');

      if (embeddedPlayer) {
        const renderer = extractCaptionRenderer(embeddedPlayer);
        if (renderer && Array.isArray(renderer.captionTracks) && renderer.captionTracks.length > 0) {
          return {
            renderer,
            title: cleanCaptionText(embeddedPlayer?.videoDetails?.title || videoTitle),
            author: cleanCaptionText(embeddedPlayer?.videoDetails?.author || videoAuthor),
          };
        }
        const playability = checkPlayability(embeddedPlayer);
        if (!playability.ok) lastBlockError = playability;
      }

      const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/);
      if (apiKeyMatch?.[1]) {
        const keyed = await tryInnertubeClients(videoId, apiKeyMatch[1]);
        if (keyed.found) return keyed.found;
        if (keyed.hadPlayableOkWithoutCaptions) {
          throw { status: 404, detail: 'Video này đã tắt phụ đề hoặc không có track phụ đề.' };
        }
        if (keyed.lastBlockError) lastBlockError = keyed.lastBlockError;
      }
    } catch (err) {
      if (err?.status && err?.detail) throw err;
    }
  }

  if (sawRecaptcha) {
    throw { status: 429, detail: 'YouTube yêu cầu xác minh (reCAPTCHA). Vui lòng thử lại sau ít phút.' };
  }
  if (lastBlockError) {
    throw {
      status: lastBlockError.code === 'REQUEST_BLOCKED' ? 503 : 404,
      detail: lastBlockError.detail,
    };
  }
  if (lastPageStatus === 429) {
    throw { status: 503, detail: 'YouTube đang tạm giới hạn IP truy cập (HTTP 429). Vui lòng thử lại sau ít phút.' };
  }
  throw { status: 404, detail: 'Video này đã tắt phụ đề hoặc không có track phụ đề.' };
}

function isEnglishLang(code) {
  const c = String(code || '').toLowerCase();
  return c === 'en' || c.startsWith('en-');
}

function isVietnameseLang(code) {
  const c = String(code || '').toLowerCase();
  return c === 'vi' || c.startsWith('vi-');
}

function selectCaptionTracks(renderer) {
  const tracks = Array.isArray(renderer?.captionTracks) ? renderer.captionTracks : [];
  if (!tracks.length) return { enTrack: null, viTrack: null, translationLanguages: [] };

  const enManual = tracks.find((t) => isEnglishLang(t?.languageCode) && t?.kind !== 'asr');
  const enAsr = tracks.find((t) => isEnglishLang(t?.languageCode) && t?.kind === 'asr');
  const enTrack = enManual || enAsr || null;

  const viManual = tracks.find((t) => isVietnameseLang(t?.languageCode) && t?.kind !== 'asr');
  const viAsr = tracks.find((t) => isVietnameseLang(t?.languageCode) && t?.kind === 'asr');
  const viTrack = viManual || viAsr || null;

  const translationLanguages = Array.isArray(renderer?.translationLanguages)
    ? renderer.translationLanguages.map((l) => String(l?.languageCode || '').toLowerCase()).filter(Boolean)
    : [];

  return { enTrack, viTrack, translationLanguages };
}

function parseTimedtextJson3(rawText) {
  const data = JSON.parse(rawText);
  const events = Array.isArray(data?.events) ? data.events : [];
  const items = [];

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (!Array.isArray(ev?.segs) || typeof ev?.tStartMs !== 'number') continue;
    const raw = ev.segs.map((s) => String(s?.utf8 || '')).join('');
    const text = cleanCaptionText(raw);
    if (!text) continue;

    const start = Math.max(0, ev.tStartMs / 1000);
    let dur = typeof ev.dDurationMs === 'number' && ev.dDurationMs > 0 ? ev.dDurationMs / 1000 : 0;
    if (dur <= 0) {
      const nextEv = events[i + 1];
      if (nextEv && typeof nextEv.tStartMs === 'number' && nextEv.tStartMs > ev.tStartMs) {
        dur = Math.min(8, (nextEv.tStartMs - ev.tStartMs) / 1000);
      } else {
        dur = 2;
      }
    }
    items.push({ start, dur, text });
  }
  return items;
}

function parseTimedtextXml(rawText) {
  const items = [];

  // Format 1: standard timedtext <text start="..." dur="...">...</text>
  const textTagRe = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let m;
  while ((m = textTagRe.exec(rawText)) !== null) {
    const attrs = m[1] || '';
    const startMatch = attrs.match(/\bstart="([^"]+)"/i);
    if (!startMatch) continue;
    const durMatch = attrs.match(/\bdur="([^"]+)"/i);
    const start = Math.max(0, parseFloat(startMatch[1]) || 0);
    const dur = Math.max(0.2, parseFloat(durMatch ? durMatch[1] : '2') || 2);
    const text = cleanCaptionText(m[2] || '');
    if (text) items.push({ start, dur, text });
  }
  if (items.length > 0) return items;

  // Format 2: srv3 <p t="ms" d="ms">...</p>
  const pTagRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
  while ((m = pTagRe.exec(rawText)) !== null) {
    const attrs = m[1] || '';
    const tMatch = attrs.match(/\bt="([^"]+)"/i);
    if (!tMatch) continue;
    const dMatch = attrs.match(/\bd="([^"]+)"/i);
    const start = Math.max(0, (parseFloat(tMatch[1]) || 0) / 1000);
    const dur = Math.max(0.2, (parseFloat(dMatch ? dMatch[1] : '2000') || 2000) / 1000);
    const text = cleanCaptionText(m[2] || '');
    if (text) items.push({ start, dur, text });
  }
  return items;
}

async function fetchTimedtextItems(baseUrl, { tlang = '' } = {}) {
  const url = new URL(baseUrl);
  url.searchParams.set('fmt', 'json3');
  if (tlang) url.searchParams.set('tlang', tlang);

  const jsonRes = await fetchWithTimeout(
    url.toString(),
    { headers: { 'User-Agent': BROWSER_USER_AGENT, 'Accept-Language': 'en-US,en;q=0.9' } },
    10000
  );
  if (jsonRes.ok) {
    const bodyText = await jsonRes.text();
    if (bodyText && bodyText.trim().startsWith('{')) {
      const parsed = parseTimedtextJson3(bodyText);
      if (parsed.length > 0) return parsed;
    } else if (bodyText && bodyText.includes('<')) {
      const parsed = parseTimedtextXml(bodyText);
      if (parsed.length > 0) return parsed;
    }
  }

  // Fallback: request default XML format without fmt=json3
  const xmlUrl = new URL(baseUrl);
  xmlUrl.searchParams.delete('fmt');
  if (tlang) xmlUrl.searchParams.set('tlang', tlang);
  const xmlRes = await fetchWithTimeout(
    xmlUrl.toString(),
    { headers: { 'User-Agent': BROWSER_USER_AGENT, 'Accept-Language': 'en-US,en;q=0.9' } },
    10000
  );
  if (!xmlRes.ok) {
    throw new Error(`Timedtext HTTP ${xmlRes.status}`);
  }
  const xmlText = await xmlRes.text();
  return parseTimedtextXml(xmlText);
}

function buildSnippets(rawItems, maxSeconds = MAX_DURATION_SECONDS) {
  const out = [];
  let truncated = false;
  for (const row of rawItems) {
    const start = Math.max(0, Number(row.start) || 0);
    if (start > maxSeconds) {
      truncated = true;
      break;
    }
    const dur = Math.max(0.25, Number(row.dur) || 2);
    const end = Math.min(maxSeconds, Math.max(start + 0.4, start + dur));
    const text = cleanCaptionText(row.text);
    if (!text) continue;
    out.push([Number(start.toFixed(2)), Number(end.toFixed(2)), text]);
  }
  for (let i = 0; i + 1 < out.length; i++) {
    if (out[i][1] > out[i + 1][0]) {
      out[i][1] = Number(Math.max(out[i][0] + 0.35, out[i + 1][0]).toFixed(2));
    }
  }
  return { snippets: out, truncated };
}

function groupSnippets(snippets) {
  if (!snippets.length) return [];

  const attempt = (target, hard) => {
    const grouped = [];
    let cur = [];
    for (const [start, end, text] of snippets) {
      if (!cur.length) {
        cur.push([start, end, text]);
        continue;
      }
      const prev = cur[cur.length - 1];
      const gap = start - prev[1];
      const curStart = cur[0][0];
      const curDur = end - curStart;
      const joinedText = cur.map((x) => x[2]).join(' ').trim();
      const prevEndsSentence = /[.?!]$/.test(prev[2]);

      const shouldFlush =
        gap > 2.2
        || joinedText.length + text.length + 1 > hard
        || curDur >= target
        || (prevEndsSentence && (joinedText.length >= 45 || prev[1] - curStart >= target * 0.7));

      if (shouldFlush) {
        grouped.push([curStart, prev[1], joinedText.slice(0, MAX_CUE_CHARS)]);
        cur = [[start, end, text]];
      } else {
        cur.push([start, end, text]);
      }
    }
    if (cur.length) {
      const last = cur[cur.length - 1];
      const joinedText = cur.map((x) => x[2]).join(' ').trim();
      grouped.push([cur[0][0], last[1], joinedText.slice(0, MAX_CUE_CHARS)]);
    }
    return grouped;
  };

  const thresholds = [
    [10, 250],
    [13, 300],
    [16, 360],
    [20, 440],
    [28, 540],
    [40, 620],
    [60, 680],
  ];
  for (const [target, hard] of thresholds) {
    const g = attempt(target, hard);
    if (g.length <= MAX_CUES) return g;
  }
  return attempt(60, 680).slice(0, MAX_CUES);
}

function alignVietnameseCues(groupedEn, viSnippets) {
  return groupedEn.map(([start, end, text]) => {
    const parts = [];
    for (const [vs, ve, vt] of viSnippets) {
      if (ve <= start) continue;
      if (vs >= end) break;
      const overlap = Math.min(end, ve) - Math.max(start, vs);
      if (overlap > 0.08 && (!parts.length || parts[parts.length - 1] !== vt)) {
        parts.push(vt);
      }
    }
    return {
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2)),
      speaker: 'Chưa xác định',
      text,
      vietnamese_translation: parts.join(' ').trim().slice(0, MAX_VI_CHARS),
    };
  });
}

async function translateBatchViaDeepL(lines, apiKey) {
  const res = await fetchWithTimeout(
    'https://api-free.deepl.com/v2/translate',
    {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: lines,
        source_lang: 'EN',
        target_lang: 'VI',
      }),
    },
    10000
  );
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const translated = Array.isArray(data?.translations) ? data.translations.map((t) => String(t?.text || '').trim()) : null;
  return translated && translated.length === lines.length ? translated : null;
}

async function translateBatchViaGoogle(lines) {
  const joined = lines.map((l) => String(l || '').replace(/\r?\n/g, ' ').trim()).join('\n');
  if (!joined) return lines.map(() => '');
  const encoded = encodeURIComponent(joined);
  const endpoints = [
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encoded}`,
    `https://clients5.google.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encoded}`,
  ];
  for (const url of endpoints) {
    try {
      const res = await fetchWithTimeout(url, {}, 7000);
      if (!res.ok) continue;
      const data = await res.json().catch(() => null);
      if (!Array.isArray(data?.[0])) continue;
      const fullTranslated = data[0].map((seg) => String(seg?.[0] || '')).join('');
      const splitLines = fullTranslated.split('\n').map((s) => s.trim());
      if (splitLines.length === lines.length) return splitLines;
    } catch {
      // Try next host
    }
  }
  return null;
}

async function translateGroupedCuesFallback(groupedEn, env) {
  const deeplKey = String(env?.DEEPL_API_KEY || '').trim();
  const translations = new Array(groupedEn.length).fill('');

  if (deeplKey) {
    const chunkSize = 40;
    const chunks = [];
    for (let i = 0; i < groupedEn.length; i += chunkSize) {
      chunks.push({ offset: i, lines: groupedEn.slice(i, i + chunkSize).map((g) => g[2]) });
    }
    let deeplWorked = false;
    for (let w = 0; w < chunks.length; w += 4) {
      await Promise.all(
        chunks.slice(w, w + 4).map(async (chunk) => {
          const out = await translateBatchViaDeepL(chunk.lines, deeplKey).catch(() => null);
          if (out) {
            deeplWorked = true;
            for (let k = 0; k < out.length; k++) {
              translations[chunk.offset + k] = String(out[k] || '').slice(0, MAX_VI_CHARS);
            }
          }
        })
      );
    }
    if (deeplWorked) return translations;
  }

  const batches = [];
  let curBatch = [];
  let curChars = 0;

  for (let i = 0; i < groupedEn.length; i++) {
    const text = groupedEn[i][2];
    const nextLen = text.length + 1;
    if (curBatch.length > 0 && (curBatch.length >= 16 || curChars + nextLen > 1450)) {
      batches.push(curBatch);
      curBatch = [];
      curChars = 0;
    }
    curBatch.push({ idx: i, text });
    curChars += nextLen;
  }
  if (curBatch.length) batches.push(curBatch);

  // Run in waves of 3 concurrent batches (gentle against gtx 429, within Workers subrequest budget)
  const cappedBatches = batches.slice(0, 22);
  for (let w = 0; w < cappedBatches.length; w += 3) {
    const wave = cappedBatches.slice(w, w + 3);
    await Promise.all(
      wave.map(async (batch) => {
        try {
          const out = await translateBatchViaGoogle(batch.map((b) => b.text));
          if (out) {
            for (let k = 0; k < batch.length; k++) {
              translations[batch[k].idx] = String(out[k] || '').slice(0, MAX_VI_CHARS);
            }
          }
        } catch {
          // Leave failed batch empty without failing whole request
        }
      })
    );
  }
  return translations;
}

async function computeGuestClipId(videoId) {
  const bytes = new TextEncoder().encode(`guest:${videoId}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `guest-${hex.slice(0, 18)}`;
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: getCorsHeaders(context.request) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(request);

  const rateLimit = await checkRateLimit({ request, env, ruleName: 'public' });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit, corsHeaders);

  let body = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ detail: 'JSON gửi lên không hợp lệ.' }, 400, corsHeaders);
  }

  const videoId = extractYoutubeVideoId(body?.youtube_url || body?.url || body?.video_id);
  if (!videoId) {
    return jsonResponse(
      { detail: 'Link hoặc ID YouTube không hợp lệ (ví dụ: https://www.youtube.com/watch?v=...).' },
      400,
      corsHeaders
    );
  }

  const includeVi = body?.include_vi !== false;
  const userTitle = String(body?.title || '').trim().slice(0, 160);
  const userAuthor = String(body?.author || '').trim().slice(0, 80);

  let playerData;
  try {
    playerData = await fetchPlayerData(videoId);
  } catch (err) {
    const status = Number(err?.status) || 502;
    const detail = typeof err?.detail === 'string' ? err.detail : 'Không thể lấy dữ liệu phụ đề từ YouTube.';
    return jsonResponse({ detail }, status, corsHeaders);
  }

  const { enTrack, viTrack } = selectCaptionTracks(playerData.renderer);
  if (!enTrack || !enTrack.baseUrl) {
    return jsonResponse({ detail: 'Video này không có phụ đề tiếng Anh (cc).' }, 404, corsHeaders);
  }

  let rawEnItems = [];
  try {
    rawEnItems = await fetchTimedtextItems(enTrack.baseUrl);
  } catch (err) {
    return jsonResponse(
      { detail: `Lỗi tải file phụ đề tiếng Anh từ YouTube (${err?.message || 'network'}).` },
      502,
      corsHeaders
    );
  }

  const { snippets: enSnippets, truncated: durTruncated } = buildSnippets(rawEnItems);
  if (!enSnippets.length) {
    return jsonResponse({ detail: 'Track phụ đề tiếng Anh của video này đang trống.' }, 404, corsHeaders);
  }

  const groupedEn = groupSnippets(enSnippets);
  const cueTruncated = groupedEn.length >= MAX_CUES && enSnippets.length > groupedEn.length;
  const truncatedAtLimit = Boolean(durTruncated || cueTruncated);

  let viSnippets = [];
  let translationStatus = 'unavailable';

  if (includeVi) {
    if (viTrack?.baseUrl) {
      try {
        const rawVi = await fetchTimedtextItems(viTrack.baseUrl);
        viSnippets = buildSnippets(rawVi).snippets;
        if (viSnippets.length > 0) {
          translationStatus = 'youtube_vi_track_unreviewed';
        }
      } catch {
        viSnippets = [];
      }
    }

    const canAutoTranslate = enTrack.isTranslatable !== false;

    if (!viSnippets.length && canAutoTranslate) {
      try {
        const rawAutoVi = await fetchTimedtextItems(enTrack.baseUrl, { tlang: 'vi' });
        viSnippets = buildSnippets(rawAutoVi).snippets;
        if (viSnippets.length > 0) {
          translationStatus = 'youtube_auto_translation_unreviewed';
        }
      } catch {
        viSnippets = [];
      }
    }
  }

  let cues = alignVietnameseCues(groupedEn, viSnippets);
  if (includeVi && !viSnippets.length) {
    const fallbackVi = await translateGroupedCuesFallback(groupedEn, env);
    const hasAnyFallback = fallbackVi.some(Boolean);
    if (hasAnyFallback) {
      translationStatus = 'cloud_auto_translation_unreviewed';
      cues = cues.map((cue, idx) => ({
        ...cue,
        vietnamese_translation: fallbackVi[idx] || '',
      }));
    }
  }
  const translatedCuesCount = cues.filter((c) => Boolean(c.vietnamese_translation)).length;
  const clipId = await computeGuestClipId(videoId);
  const finalTitle = userTitle || playerData.title || `YouTube ${videoId}`;
  const startSeconds = cues[0]?.start || 0;
  const endSeconds = cues[cues.length - 1]?.end || 0;

  return jsonResponse(
    {
      scope: 'guest_browser_only',
      storage: 'browser_localStorage',
      clip: {
        id: clipId,
        title: finalTitle,
        origin: 'YouTube',
        author: userAuthor || playerData.author || 'YouTube',
        provider: 'youtube',
        youtube_video_id: videoId,
        content_kind: 'education',
        genre: 'Video cá nhân',
        tags: ['personal'],
        start_seconds: startSeconds,
        end_seconds: endSeconds,
        personal: true,
        guest: true,
        caption_status: 'youtube_english_unreviewed',
        caption_source: enTrack.kind === 'asr' ? 'youtube_auto_caption_track' : 'youtube_caption_track',
        translation_status: translationStatus,
        truncated_at_limit: truncatedAtLimit,
      },
      cues_doc: {
        schema: 'peakfour.shadowing.cues.v1',
        clip_id: clipId,
        language: 'en',
        timing: 'youtube_caption_timing_unreviewed',
        cues,
      },
      cue_count: cues.length,
      translated_cues: translatedCuesCount,
      truncated_at_limit: truncatedAtLimit,
    },
    200,
    corsHeaders
  );
}
