// functions/_lib/studioCaptionExtractor.js
// Shared YouTube timedtext caption extractor, Vietnamese batch translator, and YouTube Channel latest-videos resolver

export const SERVER_BUSY_MSG = 'Server đang quá tải, vui lòng thử lại sau.';
export const ADMIN_BOT_BLOCK_MSG =
  'YouTube chặn IP máy chủ Cloudflare (yêu cầu xác minh bot / HTTP 429 / 403). Hãy chạy lệnh "npm run import-studio" trên máy cá nhân để nạp không bị chặn.';
const MAX_TIMEDTEXT_BYTES = 2 * 1024 * 1024;
const ALLOWED_TIMEDTEXT_HOSTS = new Set(['www.youtube.com', 'youtube.com', 'm.youtube.com', 'timedtext.youtube.com']);
const WATCH_URL = 'https://www.youtube.com/watch';
const EMBED_URL = 'https://www.youtube.com/embed';
const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/player';
const INNERTUBE_CLIENTS = [
  {
    name: 'ANDROID',
    userAgent: 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)',
    buildContext: () => ({ client: { clientName: 'ANDROID', clientVersion: '20.10.38', hl: 'en' } }),
  },
  {
    name: 'IOS',
    userAgent: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3 like Mac OS X)',
    buildContext: () => ({ client: { clientName: 'IOS', clientVersion: '20.10.4', hl: 'en' } }),
  },
  {
    name: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    buildContext: (videoId) => ({
      client: {
        clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
        clientVersion: '2.0',
        hl: 'en',
      },
      thirdParty: { embedUrl: `https://www.youtube.com/embed/${videoId}` },
    }),
  },
  {
    name: 'WEB',
    requireApiKey: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    buildContext: () => ({ client: { clientName: 'WEB', clientVersion: '2.20250219.01.00', hl: 'en' } }),
  },
];

export const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export const MAX_DURATION_SECONDS = 3600;
export const MAX_CUES = 400;
export const MAX_CUE_CHARS = 700;
export const MAX_VI_CHARS = 500;

export async function fetchWithTimeout(url, init = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export function extractYoutubeVideoId(value) {
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

export function decodeHtmlEntities(input) {
  let s = String(input || '');
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

export function cleanCaptionText(raw) {
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
    if (/sign in to confirm you.?re not a bot/i.test(reason)) {
      return { ok: false, code: 'REQUEST_BLOCKED', detail: SERVER_BUSY_MSG };
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
    if (clientSpec.requireApiKey && !apiKey) continue;
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
            context: clientSpec.buildContext(videoId),
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

async function fetchPageWithConsentRetry(pageUrl) {
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
  if (!res.ok) return { ok: false, status: res.status, html: '' };

  let html = await res.text();
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
      html = await retryRes.text();
    }
  }
  return { ok: true, status: res.status, html };
}

export async function fetchPlayerData(videoId) {
  const direct = await tryInnertubeClients(videoId, '');
  if (direct.found) return direct.found;
  if (direct.hadPlayableOkWithoutCaptions) {
    throw { status: 404, code: 'NO_CAPTIONS', detail: 'Video này đã tắt phụ đề hoặc không có track phụ đề.' };
  }

  let lastBlockError = direct.lastBlockError;
  let videoTitle = direct.videoTitle || '';
  let videoAuthor = direct.videoAuthor || '';
  let sawBotBlock = direct.lastBlockError?.code === 'REQUEST_BLOCKED';
  let sawPlayableNoCaptions = false;

  const fallbackUrls = [
    `${EMBED_URL}/${encodeURIComponent(videoId)}?hl=en`,
    `${WATCH_URL}?v=${encodeURIComponent(videoId)}&hl=en&bpctr=9999999999&has_verified=1`,
  ];

  let lastPageStatus = direct.lastHttpStatus || 502;
  let sawRecaptcha = false;

  for (const pageUrl of fallbackUrls) {
    try {
      const pageRes = await fetchPageWithConsentRetry(pageUrl);
      lastPageStatus = pageRes.status;
      if (!pageRes.ok) continue;

      const html = decodeHtmlEntities(pageRes.html);
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
        if (playability.ok) {
          sawPlayableNoCaptions = true;
        } else {
          lastBlockError = playability;
          if (playability.code === 'REQUEST_BLOCKED') sawBotBlock = true;
        }
      }

      const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/);
      if (apiKeyMatch?.[1]) {
        const keyed = await tryInnertubeClients(videoId, apiKeyMatch[1]);
        if (keyed.found) return keyed.found;
        if (keyed.hadPlayableOkWithoutCaptions) {
          sawPlayableNoCaptions = true;
        }
        if (keyed.lastBlockError) {
          lastBlockError = keyed.lastBlockError;
          if (keyed.lastBlockError.code === 'REQUEST_BLOCKED') sawBotBlock = true;
        }
      }
    } catch (err) {
      if (err?.status && err?.detail) throw err;
    }
  }

  if (sawPlayableNoCaptions) {
    throw { status: 404, code: 'NO_CAPTIONS', detail: 'Video này đã tắt phụ đề hoặc không có track phụ đề.' };
  }
  if (sawRecaptcha || sawBotBlock || lastBlockError?.code === 'REQUEST_BLOCKED' || lastPageStatus === 429 || lastPageStatus === 403) {
    throw {
      status: 503,
      code: 'YOUTUBE_BOT_BLOCKED',
      detail: SERVER_BUSY_MSG,
      adminDetail: ADMIN_BOT_BLOCK_MSG,
    };
  }
  if (lastBlockError) {
    throw {
      status: 404,
      code: lastBlockError.code || 'PLAYABILITY_ERROR',
      detail: lastBlockError.detail,
    };
  }
  throw { status: 404, code: 'NO_CAPTIONS', detail: 'Video này đã tắt phụ đề hoặc không có track phụ đề.' };
}

function isEnglishLang(code) {
  const c = String(code || '').toLowerCase();
  return c === 'en' || c.startsWith('en-');
}

function isVietnameseLang(code) {
  const c = String(code || '').toLowerCase();
  return c === 'vi' || c.startsWith('vi-');
}

export function selectCaptionTracks(renderer) {
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

    const tokens = [];
    for (const seg of ev.segs) {
      const tokText = cleanCaptionText(seg?.utf8 || '');
      if (!tokText) continue;
      const offsetMs = typeof seg?.tOffsetMs === 'number' && seg.tOffsetMs >= 0 ? seg.tOffsetMs : 0;
      tokens.push({ startMs: ev.tStartMs + offsetMs, text: tokText });
    }
    if (!tokens.length) continue;

    let evEndMs =
      typeof ev.dDurationMs === 'number' && ev.dDurationMs > 0
        ? ev.tStartMs + ev.dDurationMs
        : 0;
    if (evEndMs <= ev.tStartMs) {
      const nextEv = events[i + 1];
      if (nextEv && typeof nextEv.tStartMs === 'number' && nextEv.tStartMs > ev.tStartMs) {
        evEndMs = ev.tStartMs + Math.min(8000, nextEv.tStartMs - ev.tStartMs);
      } else {
        evEndMs = ev.tStartMs + 2000;
      }
    }

    let buf = [];
    let bufStartMs = tokens[0].startMs;
    for (let t = 0; t < tokens.length; t++) {
      const tok = tokens[t];
      if (!buf.length) bufStartMs = tok.startMs;
      buf.push(tok.text);

      const nextTok = tokens[t + 1];
      const isSentenceEnd = /[.?!]["'”’)\]]*$/.test(tok.text);
      if (isSentenceEnd && nextTok && nextTok.startMs > bufStartMs) {
        items.push({
          start: Math.max(0, bufStartMs / 1000),
          dur: Math.max(0.35, (nextTok.startMs - bufStartMs) / 1000),
          text: buf.join(' ').trim(),
        });
        buf = [];
      }
    }
    if (buf.length) {
      items.push({
        start: Math.max(0, bufStartMs / 1000),
        dur: Math.max(0.35, (evEndMs - bufStartMs) / 1000),
        text: buf.join(' ').trim(),
      });
    }
  }
  return items;
}

function parseTimedtextXml(rawText) {
  const items = [];

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

function isAllowedTimedtextUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return ALLOWED_TIMEDTEXT_HOSTS.has(host) || host.endsWith('.youtube.com');
  } catch {
    return false;
  }
}

export async function fetchTimedtextItems(baseUrl, { tlang = '' } = {}) {
  if (!isAllowedTimedtextUrl(baseUrl)) {
    throw new Error('Blocked untrusted timedtext URL');
  }
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
    if (bodyText && bodyText.length <= MAX_TIMEDTEXT_BYTES) {
      if (bodyText.trim().startsWith('{')) {
        const parsed = parseTimedtextJson3(bodyText);
        if (parsed.length > 0) return parsed;
      } else if (bodyText.includes('<')) {
        const parsed = parseTimedtextXml(bodyText);
        if (parsed.length > 0) return parsed;
      }
    }
  }

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
  if (xmlText.length > MAX_TIMEDTEXT_BYTES) {
    throw new Error('Timedtext payload exceeds size limit');
  }
  return parseTimedtextXml(xmlText);
}

export function buildSnippets(rawItems, maxSeconds = MAX_DURATION_SECONDS) {
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

export function groupSnippets(snippets) {
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
        gap > 1.8
        || joinedText.length + text.length + 1 > hard
        || curDur >= target
        || (prevEndsSentence && (joinedText.length >= 25 || prev[1] - curStart >= target * 0.65));

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
    [4.8, 120],
    [6.5, 165],
    [9, 220],
    [13, 300],
    [18, 400],
    [28, 520],
    [45, 650],
  ];
  for (const [target, hard] of thresholds) {
    const g = attempt(target, hard);
    if (g.length <= MAX_CUES) return g;
  }
  return attempt(60, 680).slice(0, MAX_CUES);
}

export function alignVietnameseCues(groupedEn, viSnippets) {
  return groupedEn.map(([start, end, text]) => {
    const parts = [];
    for (const [vs, ve, vt] of viSnippets) {
      if (ve <= start) continue;
      if (vs >= end) break;
      const overlap = Math.min(end, ve) - Math.max(start, vs);
      const minOverlap = Math.min(0.28, Math.max(0.08, (ve - vs) * 0.3));
      if (overlap > minOverlap && (!parts.length || parts[parts.length - 1] !== vt)) {
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
      const res = await fetchWithTimeout(url, {}, 5000);
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

export async function translateGroupedCuesFallback(groupedEn, env, { allowDeepL = false, translateAll = false } = {}) {
  const deeplKey = allowDeepL ? String(env?.DEEPL_API_KEY || '').trim() : '';
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

  const cappedBatches = translateAll ? batches : batches.slice(0, 10);
  for (let w = 0; w < cappedBatches.length; w += 5) {
    const wave = cappedBatches.slice(w, w + 5);
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

export async function fetchYoutubeOembedMeta(videoId) {
  try {
    const oembedRes = await fetchWithTimeout(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
      {},
      5000
    );
    if (!oembedRes.ok) return { title: '', author: '' };
    const meta = await oembedRes.json().catch(() => null);
    return {
      title: meta?.title ? cleanCaptionText(meta.title) : '',
      author: meta?.author_name ? cleanCaptionText(meta.author_name) : '',
    };
  } catch {
    return { title: '', author: '' };
  }
}

export async function extractYoutubeVideoCaptions({
  videoId,
  env,
  userTitle = '',
  userAuthor = '',
  includeVi = true,
  allowDeepL = true,
  translateAll = false,
}) {
  const playerData = await fetchPlayerData(videoId);
  const { enTrack, viTrack } = selectCaptionTracks(playerData.renderer);
  if (!enTrack || !enTrack.baseUrl) {
    throw { status: 404, detail: 'Video này không có phụ đề tiếng Anh (cc).' };
  }

  const canAutoTranslate = enTrack.isTranslatable !== false;
  const viPromise = !includeVi
    ? Promise.resolve({ items: [], status: 'unavailable' })
    : viTrack?.baseUrl
      ? fetchTimedtextItems(viTrack.baseUrl)
          .then((items) => ({ items, status: 'youtube_vi_track_unreviewed' }))
          .catch(() => ({ items: [], status: 'unavailable' }))
      : canAutoTranslate
        ? fetchTimedtextItems(enTrack.baseUrl, { tlang: 'vi' })
            .then((items) => ({ items, status: 'youtube_auto_translation_unreviewed' }))
            .catch(() => ({ items: [], status: 'unavailable' }))
        : Promise.resolve({ items: [], status: 'unavailable' });

  const [enSettled, viSettled] = await Promise.allSettled([
    fetchTimedtextItems(enTrack.baseUrl),
    viPromise,
  ]);

  if (enSettled.status !== 'fulfilled') {
    const err = enSettled.reason;
    const msg = String(err?.message || '');
    const isThrottled = /\b(429|403|503)\b/.test(msg);
    throw {
      status: isThrottled ? 503 : 502,
      code: isThrottled ? 'YOUTUBE_BOT_BLOCKED' : 'TIMEDTEXT_FETCH_FAILED',
      detail: isThrottled ? SERVER_BUSY_MSG : `Lỗi tải file phụ đề tiếng Anh từ YouTube (${msg || 'network'}).`,
      adminDetail: isThrottled ? ADMIN_BOT_BLOCK_MSG : `Lỗi tải file phụ đề từ YouTube (${msg || 'network'}).`,
    };
  }

  const rawEnItems = enSettled.value;
  const { snippets: enSnippets, truncated: durTruncated } = buildSnippets(rawEnItems);
  if (!enSnippets.length) {
    throw { status: 404, detail: 'Track phụ đề tiếng Anh của video này đang trống.' };
  }

  const groupedEn = groupSnippets(enSnippets);
  const cueTruncated = groupedEn.length >= MAX_CUES && enSnippets.length > groupedEn.length;
  const truncatedAtLimit = Boolean(durTruncated || cueTruncated);

  let viSnippets = [];
  let translationStatus = 'unavailable';

  if (includeVi && viSettled.status === 'fulfilled' && viSettled.value?.items?.length) {
    viSnippets = buildSnippets(viSettled.value.items).snippets;
    if (viSnippets.length > 0) {
      translationStatus = viSettled.value.status;
    }
  }

  if (includeVi && !viSnippets.length && viTrack?.baseUrl && canAutoTranslate) {
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

  let cues = alignVietnameseCues(groupedEn, viSnippets);
  if (includeVi && !viSnippets.length) {
    const fallbackVi = await translateGroupedCuesFallback(groupedEn, env, { allowDeepL, translateAll });
    const hasAnyFallback = fallbackVi.some(Boolean);
    if (hasAnyFallback) {
      translationStatus = 'cloud_auto_translation_unreviewed';
      cues = cues.map((cue, idx) => ({
        ...cue,
        vietnamese_translation: fallbackVi[idx] || '',
      }));
    }
  }

  let resolvedTitle = userTitle || playerData.title;
  let resolvedAuthor = userAuthor || playerData.author;
  if (!resolvedTitle || !resolvedAuthor) {
    const oembed = await fetchYoutubeOembedMeta(videoId);
    if (!resolvedTitle && oembed.title) resolvedTitle = oembed.title;
    if (!resolvedAuthor && oembed.author) resolvedAuthor = oembed.author;
  }

  const finalTitle = resolvedTitle || `YouTube ${videoId}`;
  const finalAuthor = resolvedAuthor || 'YouTube';
  const startSeconds = 0;
  const endSeconds = Math.ceil((cues[cues.length - 1]?.end || 0) + 1);
  const translatedCuesCount = cues.filter((c) => Boolean(c.vietnamese_translation)).length;

  return {
    title: finalTitle,
    author: finalAuthor,
    cues,
    cueCount: cues.length,
    translatedCuesCount,
    truncatedAtLimit,
    startSeconds,
    endSeconds,
    captionSource: enTrack.kind === 'asr' ? 'youtube_auto_caption_track' : 'youtube_caption_track',
    translationStatus,
  };
}

// =========================================================================
// YouTube Channel -> Latest N (default 20) Videos Resolver (No API key needed)
// =========================================================================

function normalizeChannelVideosUrl(rawInput) {
  const raw = String(rawInput || '').trim();
  if (!raw) return '';
  if (/^UC[A-Za-z0-9_-]{22}$/.test(raw)) {
    return `https://www.youtube.com/channel/${raw}/videos`;
  }
  if (/^@[A-Za-z0-9_.-]+$/.test(raw)) {
    return `https://www.youtube.com/${raw}/videos`;
  }
  let urlStr = raw;
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = `https://${urlStr}`;
  }
  try {
    const u = new URL(urlStr);
    const host = u.hostname.toLowerCase();
    if (!host.includes('youtube.com')) return '';
    const cleanPath = u.pathname
      .replace(/\/(videos|shorts|streams|playlists|community|about|featured)\/?$/i, '')
      .replace(/\/+$/, '');
    return `https://www.youtube.com${cleanPath}/videos`;
  } catch {
    return '';
  }
}

function readRunsText(obj) {
  if (!obj) return '';
  if (typeof obj.simpleText === 'string') return obj.simpleText.trim();
  if (Array.isArray(obj.runs)) return obj.runs.map((r) => r?.text || '').join('').trim();
  return '';
}

function extractLockupMeta(lv) {
  const metaRows = lv?.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows;
  let publishedText = '';
  let isUpcoming = false;
  if (Array.isArray(metaRows)) {
    for (const row of metaRows) {
      const parts = Array.isArray(row?.metadataParts) ? row.metadataParts : [];
      for (const part of parts) {
        const txt = String(part?.text?.content || '').trim();
        const label = String(part?.accessibilityLabel || '').trim();
        if (/upcoming|premieres|scheduled/i.test(txt) || /upcoming|premieres|scheduled/i.test(label)) {
          isUpcoming = true;
        }
        if (/(\bago\b|streamed|premiered|\b(sec|min|hour|day|week|month|year)s?\b)/i.test(txt) || /\bago\b/i.test(label)) {
          publishedText = txt;
        }
      }
    }
  }

  let durationText = '';
  const overlays = lv?.contentImage?.thumbnailViewModel?.overlays;
  if (Array.isArray(overlays)) {
    for (const ov of overlays) {
      const badges = ov?.thumbnailBottomOverlayViewModel?.badges;
      if (!Array.isArray(badges)) continue;
      for (const b of badges) {
        const bText = String(b?.thumbnailBadgeViewModel?.text || '').trim();
        if (/upcoming/i.test(bText)) isUpcoming = true;
        else if (/^\d{1,2}(:\d{2}){1,2}$/.test(bText)) {
          durationText = bText;
        }
      }
    }
  }

  return { publishedText, durationText, isUpcoming };
}

function collectChannelVideoRenderers(node, out = [], seen = new Set()) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const item of node) collectChannelVideoRenderers(item, out, seen);
    return out;
  }

  const vr = node.videoRenderer || node.gridVideoRenderer;
  if (vr && typeof vr.videoId === 'string' && /^[A-Za-z0-9_-]{11}$/.test(vr.videoId)) {
    if (!seen.has(vr.videoId)) {
      const navUrl = String(vr?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || '');
      const isUpcoming = Boolean(vr.upcomingEventData);
      const isShort = navUrl.includes('/shorts/');
      if (!isUpcoming && !isShort) {
        seen.add(vr.videoId);
        const title = cleanCaptionText(readRunsText(vr.title) || `YouTube ${vr.videoId}`);
        const publishedText = cleanCaptionText(readRunsText(vr.publishedTimeText));
        const durationText = cleanCaptionText(readRunsText(vr.lengthText));
        out.push({
          youtube_video_id: vr.videoId,
          url: `https://www.youtube.com/watch?v=${vr.videoId}`,
          title,
          published_text: publishedText,
          duration_text: durationText,
        });
      }
    }
  }

  const lv = node.lockupViewModel;
  if (
    lv &&
    typeof lv.contentId === 'string' &&
    /^[A-Za-z0-9_-]{11}$/.test(lv.contentId) &&
    (!lv.contentType || lv.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO')
  ) {
    if (!seen.has(lv.contentId)) {
      const navUrl = String(
        lv?.rendererContext?.commandContext?.onTap?.innertubeCommand?.commandMetadata?.webCommandMetadata?.url || ''
      );
      const { publishedText, durationText, isUpcoming } = extractLockupMeta(lv);
      const isShort = navUrl.includes('/shorts/');
      if (!isUpcoming && !isShort) {
        seen.add(lv.contentId);
        const rawTitle = lv?.metadata?.lockupMetadataViewModel?.title?.content;
        const title = cleanCaptionText(rawTitle || `YouTube ${lv.contentId}`);
        out.push({
          youtube_video_id: lv.contentId,
          url: `https://www.youtube.com/watch?v=${lv.contentId}`,
          title,
          published_text: cleanCaptionText(publishedText),
          duration_text: cleanCaptionText(durationText),
        });
      }
    }
  }

  for (const val of Object.values(node)) {
    if (val && typeof val === 'object') {
      collectChannelVideoRenderers(val, out, seen);
    }
  }
  return out;
}

function parseChannelRssFeed(xmlText, limit = 20) {
  const titleMatch = xmlText.match(/<title>([\s\S]*?)<\/title>/i);
  const feedAuthor = titleMatch ? cleanCaptionText(titleMatch[1]) : '';
  const entries = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m = entryRe.exec(xmlText)) !== null && entries.length < limit) {
    const block = m[1];
    const vidMatch = block.match(/<yt:videoId>([A-Za-z0-9_-]{11})<\/yt:videoId>/i);
    if (!vidMatch) continue;
    const videoId = vidMatch[1];
    const tMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
    const pubMatch = block.match(/<published>([\s\S]*?)<\/published>/i);
    const linkMatch = block.match(/<link[^>]+href="([^"]+)"/i);
    if (linkMatch?.[1]?.includes('/shorts/')) continue;
    entries.push({
      youtube_video_id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: tMatch ? cleanCaptionText(tMatch[1]) : `YouTube ${videoId}`,
      published_text: pubMatch ? pubMatch[1].slice(0, 10) : '',
      duration_text: '',
    });
  }
  return { feedAuthor, entries };
}

function extractContinuationToken(node) {
  if (!node || typeof node !== 'object') return '';
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = extractContinuationToken(item);
      if (found) return found;
    }
    return '';
  }

  const contTok =
    node?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token
    || node?.continuationEndpoint?.continuationCommand?.token;
  if (typeof contTok === 'string' && contTok.trim()) {
    return contTok.trim();
  }

  for (const val of Object.values(node)) {
    if (val && typeof val === 'object') {
      const found = extractContinuationToken(val);
      if (found) return found;
    }
  }
  return '';
}

async function fetchChannelBrowseContinuation({ continuation, apiKey, clientVersion, visitorData }) {
  if (!continuation || !apiKey || !/^[a-zA-Z0-9_-]+$/.test(apiKey)) {
    return { videos: [], nextToken: '' };
  }
  const res = await fetchWithTimeout(
    `https://www.youtube.com/youtubei/v1/browse?key=${encodeURIComponent(apiKey)}&prettyPrint=false`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': BROWSER_USER_AGENT,
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: clientVersion || '2.20250219.01.00',
            hl: 'en',
            ...(visitorData ? { visitorData } : {}),
          },
        },
        continuation,
      }),
    },
    10000
  );
  if (!res.ok) {
    throw { status: res.status === 429 || res.status === 403 ? 503 : 502, detail: 'Không tải thêm được video từ YouTube.' };
  }
  const data = await res.json().catch(() => null);
  if (!data) return { videos: [], nextToken: '' };
  return {
    videos: collectChannelVideoRenderers(data),
    nextToken: extractContinuationToken(data),
  };
}

function appendUniqueVideos(pool, incoming, seenSet) {
  for (const v of incoming || []) {
    if (v?.youtube_video_id && !seenSet.has(v.youtube_video_id)) {
      seenSet.add(v.youtube_video_id);
      pool.push(v);
    }
  }
}

export async function resolveYoutubeChannelVideos(channelUrlInput, rawLimit = 20, options = {}) {
  const targetLimit = Math.min(30, Math.max(1, Number.parseInt(String(rawLimit || 20), 10) || 20));
  const cursor = options?.cursor && typeof options.cursor === 'object' ? options.cursor : null;

  if (cursor) {
    const pool = [];
    const seen = new Set();
    if (Array.isArray(cursor.buffered_videos)) {
      appendUniqueVideos(pool, cursor.buffered_videos, seen);
    }
    let continuation = String(cursor.continuation || '').trim();
    const apiKey = String(cursor.api_key || '').trim();
    const clientVersion = String(cursor.client_version || '2.20250219.01.00').trim();
    const visitorData = String(cursor.visitor_data || '').trim();

    while (pool.length < targetLimit && continuation && apiKey) {
      const page = await fetchChannelBrowseContinuation({ continuation, apiKey, clientVersion, visitorData });
      const prevCount = pool.length;
      appendUniqueVideos(pool, page.videos, seen);
      continuation = page.nextToken && page.nextToken !== continuation ? page.nextToken : '';
      if (pool.length === prevCount && !continuation) break;
    }

    const videos = pool.slice(0, targetLimit);
    const leftover = pool.slice(targetLimit);
    const nextCursor =
      leftover.length > 0 || (continuation && apiKey)
        ? {
            buffered_videos: leftover,
            continuation,
            api_key: apiKey,
            client_version: clientVersion,
            visitor_data: visitorData,
            channel_id: String(cursor.channel_id || ''),
            channel_name: String(cursor.channel_name || ''),
          }
        : null;

    return {
      channel_id: String(cursor.channel_id || ''),
      channel_name: String(cursor.channel_name || 'YouTube Channel'),
      count: videos.length,
      videos,
      has_more: Boolean(nextCursor),
      next_cursor: nextCursor,
    };
  }

  const videosPageUrl = normalizeChannelVideosUrl(channelUrlInput);
  if (!videosPageUrl) {
    throw {
      status: 400,
      detail: 'Link kênh YouTube không hợp lệ (ví dụ: https://www.youtube.com/@TEDEd hoặc https://www.youtube.com/channel/UC...).',
    };
  }

  const directChannelMatch = videosPageUrl.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/);
  let channelId = directChannelMatch ? directChannelMatch[1] : '';
  let channelTitle = '';
  let allVideos = [];
  let apiKey = '';
  let clientVersion = '2.20250219.01.00';
  let visitorData = '';
  let continuation = '';

  try {
    const pageRes = await fetchPageWithConsentRetry(`${videosPageUrl}?hl=en`);
    if (pageRes.ok && pageRes.html) {
      const html = pageRes.html;
      if (!channelId) {
        const extMatch =
          html.match(/"externalId":\s*"(UC[A-Za-z0-9_-]{22})"/)
          || html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/i)
          || html.match(/"channelId":\s*"(UC[A-Za-z0-9_-]{22})"/);
        if (extMatch?.[1]) channelId = extMatch[1];
      }

      apiKey = html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/)?.[1] || '';
      clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION":\s*"([^"]+)"/)?.[1] || clientVersion;
      visitorData = html.match(/"visitorData":\s*"([^"]+)"/)?.[1] || '';

      const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
      if (ogTitle?.[1]) {
        channelTitle = cleanCaptionText(ogTitle[1]);
      }

      const ytData =
        extractBalancedJsonObject(html, 'var ytInitialData =')
        || extractBalancedJsonObject(html, 'ytInitialData =');

      if (ytData) {
        if (!channelTitle) {
          channelTitle = cleanCaptionText(ytData?.metadata?.channelMetadataRenderer?.title || '');
        }
        const tabs = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs;
        const selectedTab = Array.isArray(tabs) ? tabs.find((t) => t?.tabRenderer?.selected) : null;
        const primaryVideos = selectedTab ? collectChannelVideoRenderers(selectedTab) : [];
        allVideos = primaryVideos.length > 0 ? primaryVideos : collectChannelVideoRenderers(ytData);
        continuation = extractContinuationToken(selectedTab || ytData);
      }
    }
  } catch {
    // Fallback to RSS feed below if channelId was extracted or provided
  }

  // Fallback or supplement via official YouTube RSS feed (up to 15 items cleanly)
  if ((!allVideos.length || !channelTitle) && channelId) {
    try {
      const rssRes = await fetchWithTimeout(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
        { headers: { 'User-Agent': BROWSER_USER_AGENT } },
        8000
      );
      if (rssRes.ok) {
        const xml = await rssRes.text();
        const { feedAuthor, entries } = parseChannelRssFeed(xml, targetLimit);
        if (!channelTitle && feedAuthor) channelTitle = feedAuthor;
        if (!allVideos.length && entries.length) {
          allVideos = entries;
          continuation = '';
        }
      }
    } catch {
      // Ignore RSS fallback error
    }
  }

  if (!allVideos.length) {
    throw {
      status: 404,
      detail: 'Không lấy được danh sách video từ kênh YouTube này. Hãy kiểm tra lại link kênh hoặc dán danh sách link video trực tiếp.',
    };
  }

  const videos = allVideos.slice(0, targetLimit);
  const leftover = allVideos.slice(targetLimit);
  const resolvedName = channelTitle || 'YouTube Channel';
  const nextCursor =
    leftover.length > 0 || (continuation && apiKey)
      ? {
          buffered_videos: leftover,
          continuation,
          api_key: apiKey,
          client_version: clientVersion,
          visitor_data: visitorData,
          channel_id: channelId,
          channel_name: resolvedName,
        }
      : null;

  return {
    channel_id: channelId,
    channel_name: resolvedName,
    count: videos.length,
    videos,
    has_more: Boolean(nextCursor),
    next_cursor: nextCursor,
  };
}
