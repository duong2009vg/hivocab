// src/services/battleService.js
// Frontend API client for HiVocab Battle Arena (Pages -> Cloudflare Durable Objects + Solo fallback).
import { supabase } from '../lib/supabaseClient.js';

async function getBearerHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

async function fetchBattleApi(path, { method = 'GET', body = null } = {}) {
  const authHeader = await getBearerHeader();
  if (!authHeader) {
    throw new Error('Vui lòng đăng nhập để tham gia Đấu trường PvP.');
  }

  const res = await fetch(`/api/battle${path}`, {
    method,
    headers: {
      ...authHeader,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `Lỗi kết nối Đấu trường (${res.status})`);
  }
  return data;
}

export function fetchArenaProfile() {
  return fetchBattleApi('/profile');
}

export function fetchArenaLeaderboard() {
  return fetchBattleApi('/leaderboard');
}

export function fetchArenaTopics() {
  return fetchBattleApi('/topics');
}

export function enterQuickMatchQueue({ mode = 'speed_blitz', topicId = null, characterId = null } = {}) {
  return fetchBattleApi('/queue', {
    method: 'POST',
    body: { mode, ...(topicId ? { topicId } : {}), ...(characterId ? { characterId } : {}) },
  });
}

export function createPrivateBattleRoom({ mode = 'speed_blitz', topicId = null, characterId = null } = {}) {
  return fetchBattleApi('/room/create', {
    method: 'POST',
    body: { mode, ...(topicId ? { topicId } : {}), ...(characterId ? { characterId } : {}) },
  });
}

export function joinPrivateBattleRoom(roomCode, characterId = null) {
  return fetchBattleApi('/room/join', {
    method: 'POST',
    body: {
      roomCode: String(roomCode || '').trim().toUpperCase(),
      ...(characterId ? { characterId } : {}),
    },
  });
}

export function recordSoloBattleXp(xpEarned = 30) {
  return fetchBattleApi('/solo-record', {
    method: 'POST',
    body: { xpEarned },
  }).catch(() => null);
}

export async function fetchSoloWords(topicId = null) {
  try {
    if (topicId) {
      const { data } = await supabase
        .from('words')
        .select('id, word, phonetic, meaning, example_sentence')
        .eq('topic_id', topicId)
        .limit(90);
      if (Array.isArray(data) && data.length >= 4) return data;
    }

    const { data } = await supabase
      .from('words')
      .select('id, word, phonetic, meaning, example_sentence')
      .not('phonetic', 'is', null)
      .not('example_sentence', 'is', null)
      .limit(80);
    if (Array.isArray(data) && data.length >= 4) return data;
  } catch (_) {}
  return [];
}

export function buildBattleWebSocketUrl(roomId, ticket) {
  if (typeof window === 'undefined') return '';
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/api/battle/ws?roomId=${encodeURIComponent(roomId)}&ticket=${encodeURIComponent(ticket)}`;
}
