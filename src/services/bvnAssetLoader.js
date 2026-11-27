// src/services/bvnAssetLoader.js
// Loads & caches BVN fighter sprite sheets, portraits, stage backgrounds, and manifest from Cloudflare R2.
import {
  BVN_ASSETS_BASE_URL,
  getBvnFighterUrl,
  getBvnManifestUrl,
  getBvnMapUrl,
} from '../config/bvnAssets.js';

let manifestPromise = null;
const fighterPackCache = new Map();
const imageCache = new Map();

export function loadBvnManifest() {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return Promise.resolve(null);
  }
  if (!manifestPromise) {
    manifestPromise = fetch(getBvnManifestUrl(), { mode: 'cors' })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return manifestPromise;
}

export function loadImageCors(url) {
  if (!url || typeof window === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve(null);
  }
  const existing = imageCache.get(url);
  if (existing) return existing;

  const p = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
  imageCache.set(url, p);
  return p;
}

export function loadFighterPack(fighterId) {
  if (!fighterId || typeof window === 'undefined') {
    return Promise.resolve(null);
  }
  if (fighterPackCache.has(fighterId)) {
    return fighterPackCache.get(fighterId);
  }

  const p = (async () => {
    try {
      const res = await fetch(getBvnFighterUrl(fighterId, 'frames.json'), { mode: 'cors' });
      if (!res.ok) return null;
      const framesMeta = await res.json();
      const sheetName = framesMeta?.sheet || 'sheet.png';
      const [sheet, faceBig] = await Promise.all([
        loadImageCors(getBvnFighterUrl(fighterId, sheetName)),
        loadImageCors(getBvnFighterUrl(fighterId, 'face_big.png')),
      ]);
      if (!sheet || !framesMeta?.clips) return null;
      return {
        id: fighterId,
        meta: framesMeta,
        sheet,
        faceBig,
      };
    } catch (_) {
      return null;
    }
  })();

  fighterPackCache.set(fighterId, p);
  return p;
}

export async function loadMapStage(mapId) {
  if (!mapId || typeof window === 'undefined') return null;
  const manifest = await loadBvnManifest();
  const mapEntry = manifest?.maps?.[mapId];
  const bgFile = mapEntry?.bg || 'bg.png';
  const img = await loadImageCors(getBvnMapUrl(mapId, bgFile));
  if (!img) return null;
  return {
    id: mapId,
    image: img,
    groundYRatio: Number(mapEntry?.groundYRatio) || 0.84,
  };
}

export function preloadBvnFighterFaces(fighterId) {
  if (!fighterId) return;
  loadImageCors(getBvnFighterUrl(fighterId, 'face_bar.png'));
  loadImageCors(getBvnFighterUrl(fighterId, 'face_big.png'));
}

export function getBvnAssetsBaseUrl() {
  return BVN_ASSETS_BASE_URL;
}
