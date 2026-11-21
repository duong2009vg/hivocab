// scripts/seed-existing-shadowing-videos.mjs
// Seed the 12 built-in Shadowing clips from functions/_data/studio/shadowing-catalog.js into public.studio_videos

import shadowingCatalog from '../functions/_data/studio/shadowing-catalog.js';

export function inferChannelName(clip) {
  const title = String(clip?.title || '');
  const genre = String(clip?.genre || '');
  if (title.includes('The Fable Cottage')) return 'The Fable Cottage';
  if (title.includes('Guess How Much I Love You')) return 'Children Stories';
  if (genre.startsWith('Phim ngắn') || title.includes('Short Film')) return 'Short Films';
  if (title.startsWith('Friends:') || genre.startsWith('Friends')) return 'Friends';
  if (title.startsWith('Suits') || genre.includes('Suits')) return 'Suits';
  if (genre.startsWith('Đọc sách')) return 'Đọc sách tiếng Anh';
  return clip?.origin || 'YouTube';
}

export function buildSeedRows() {
  const clips = Array.isArray(shadowingCatalog?.clips) ? shadowingCatalog.clips : [];
  return clips.map((clip, idx) => ({
    id: clip.id,
    youtube_video_id: clip.youtube_video_id,
    title: clip.title,
    channel_name: inferChannelName(clip),
    author: inferChannelName(clip),
    genre: clip.genre || 'YouTube',
    level: clip.level || 'B1',
    tags: Array.isArray(clip.tags) && clip.tags.length ? clip.tags : ['shadowing', 'english'],
    start_seconds: Number(clip.start_seconds || 0),
    end_seconds: Number(clip.end_seconds || 0),
    cue_count: Array.isArray(clip.cues) ? clip.cues.length : 0,
    cues: Array.isArray(clip.cues) ? clip.cues : [],
    caption_status: clip.caption_status || 'manual',
    translation_status: 'manual',
    sort_order: idx + 1,
    is_pro: false,
    is_published: true,
  }));
}

async function main() {
  const rows = buildSeedRows();
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    console.log(JSON.stringify({ total: rows.length, sample: rows.map((r) => ({ id: r.id, channel: r.channel_name, level: r.level, cues: r.cue_count })) }, null, 2));
    return;
  }

  const res = await fetch(`${url}/rest/v1/studio_videos`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`Seed failed: HTTP ${res.status} ${await res.text()}`);
  }
  console.log(`Seeded ${rows.length} studio_videos cleanly.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
