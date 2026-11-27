// src/config/bvnAssets.js
// Cloudflare R2 public endpoint & URL builders for Bleach vs Naruto (BVN) Asset Pack.

export const BVN_R2_PUBLIC_ORIGIN = 'https://pub-cacd93fa272d490a875125df96a7ffdb.r2.dev';

export const BVN_ASSETS_BASE_URL = String(
  import.meta.env?.VITE_BVN_ASSETS_URL || `${BVN_R2_PUBLIC_ORIGIN}/bvn`
).replace(/\/+$/, '');

export function getBvnManifestUrl() {
  return `${BVN_ASSETS_BASE_URL}/manifest.json`;
}

export function getBvnFighterUrl(fighterId, file) {
  return `${BVN_ASSETS_BASE_URL}/fighters/${encodeURIComponent(fighterId)}/${file}`;
}

export function getBvnMapUrl(mapId, file) {
  return `${BVN_ASSETS_BASE_URL}/maps/${encodeURIComponent(mapId)}/${file}`;
}

export function getBvnSfxUrl(file) {
  return `${BVN_ASSETS_BASE_URL}/sfx/${file}`;
}

export function getBvnBgmUrl(file) {
  return `${BVN_ASSETS_BASE_URL}/bgm/${file}`;
}
