// scripts/import-studio-videos.mjs
// Local Admin Bulk YouTube Importer (PA 1): runs from your residential IP to avoid Cloudflare datacenter blocks,
// resolves latest channel videos or URL lists, extracts & translates 100% EN->VI captions, and saves to Supabase public.studio_videos (Free).

import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import {
  extractYoutubeVideoId,
  extractYoutubeVideoCaptions,
  resolveYoutubeChannelVideos,
} from '../functions/_lib/studioCaptionExtractor.js';

const VALID_LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

function printHelp() {
  console.log(`
HiVocab — Admin Bulk YouTube Importer (PA 1 - chay tu may ca nhan)

Cach dung:
  npm run import-studio -- --channel "https://www.youtube.com/@TEDEd" --limit 20 --level B1
  npm run import-studio -- --urls "https://youtu.be/ki_DGMh2r0c,https://youtu.be/e6MAfKu5j3M" --level B1
  npm run import-studio -- --file links.txt --channel-name "BBC Learning English" --level B2

Tuy chon:
  --channel <url|@handle|UC...>  Link kenh YouTube (tu quet N video moi nhat)
  --urls <u1,u2,...>              Danh sach link hoac ID YouTube (cach nhau boi dau phay)
  --file <duong_dan.txt>          File text chua danh sach link YouTube (moi dong 1 link)
  --limit <so>                    So video moi nhat lay tu kenh (mac dinh: 20, toi da: 30)
  --level <A2|B1|B2|C1>           Trinh do gan cho video (mac dinh: B1)
  --channel-name <ten>            Ten kenh hien thi trong bo loc Shadowing (bo trong = tu lay)
  --overwrite                     Ghi de ca cac video da co trong Supabase (mac dinh: bo qua)
  --dry-run                       Chi test boc phu de & dich, khong ghi vao Supabase
  --sql-out <file.sql>            Xuat them file SQL INSERT de chay tay neu can
  --email <email_admin>           Email tai khoan Admin (neu chua co SUPABASE_SERVICE_ROLE_KEY)
  --password <mat_khau>           Mat khau Admin (khuyen nghi nhap qua prompt an toan)
  --token <jwt>                   Access token Admin (neu dang nhap Google OAuth)
  -h, --help                      Hien thi huong dan nay

Xac thuc Supabase (chon 1 trong 3):
  1. Them SUPABASE_SERVICE_ROLE_KEY=... vao .env.local (khuyen dung - khong can hoi lai)
  2. Dang nhap nhanh bang tai khoan Admin (email + mat khau) khi script hoi
  3. Hoac dung --sql-out seed_batch.sql de xuat file SQL
`);
}

async function loadEnvFiles() {
  for (const filename of ['.env', '.env.local']) {
    try {
      const content = await fs.readFile(path.resolve(process.cwd(), filename), 'utf8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx === -1) continue;
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (key && !(key in process.env)) {
          process.env[key] = val;
        }
      }
    } catch {
      // Missing .env file is fine
    }
  }
}

export function parseCliArgs(argv) {
  const args = {
    channel: '',
    urls: '',
    file: '',
    limit: 20,
    level: 'B1',
    channelName: '',
    overwrite: false,
    dryRun: false,
    sqlOut: '',
    email: '',
    password: '',
    token: '',
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '-h' || token === '--help') {
      args.help = true;
    } else if (token === '--overwrite') {
      args.overwrite = true;
    } else if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token.startsWith('--')) {
      const eq = token.indexOf('=');
      const key = eq !== -1 ? token.slice(2, eq) : token.slice(2);
      const val = eq !== -1 ? token.slice(eq + 1) : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '';
      if (key === 'channel') args.channel = val;
      else if (key === 'urls') args.urls = val;
      else if (key === 'file') args.file = val;
      else if (key === 'limit') args.limit = Math.min(30, Math.max(1, Number.parseInt(val, 10) || 20));
      else if (key === 'level') {
        const upper = String(val || 'B1').toUpperCase();
        args.level = VALID_LEVELS.has(upper) ? upper : 'B1';
      } else if (key === 'channel-name') args.channelName = val;
      else if (key === 'sql-out') args.sqlOut = val;
      else if (key === 'email') args.email = val;
      else if (key === 'password') args.password = val;
      else if (key === 'token') args.token = val;
    } else if (!args.channel && (token.includes('youtube.com/') || token.startsWith('@') || /^UC[A-Za-z0-9_-]{22}$/.test(token))) {
      args.channel = token;
    }
  }
  return args;
}

async function resolveSupabaseAuth({ supabaseUrl, supabaseAnonKey, serviceRoleKey, args }) {
  if (serviceRoleKey) {
    return {
      apiKey: serviceRoleKey,
      authHeader: `Bearer ${serviceRoleKey}`,
      mode: 'service_role',
    };
  }
  if (args.token) {
    return {
      apiKey: supabaseAnonKey,
      authHeader: `Bearer ${args.token.trim()}`,
      mode: 'jwt',
    };
  }

  let email = args.email || process.env.SUPABASE_ADMIN_EMAIL || '';
  let password = args.password || process.env.SUPABASE_ADMIN_PASSWORD || '';

  if ((!email || !password) && process.stdin.isTTY) {
    const rl = readline.createInterface({ input, output });
    try {
      console.log('Khong tim thay SUPABASE_SERVICE_ROLE_KEY trong .env.local.');
      console.log('Dang nhap tai khoan Admin Supabase (hoac Ctrl+C va dung --sql-out):\n');
      if (!email) {
        email = (await rl.question('Email Admin: ')).trim();
      }
      if (!password) {
        password = (await rl.question('Mat khau Admin: ')).trim();
      }
    } finally {
      rl.close();
    }
  }

  if (!email || !password) {
    throw new Error(
      'Thieu thong tin xac thuc Supabase. Hay dat SUPABASE_SERVICE_ROLE_KEY trong .env.local, hoac truyen --email/--password, hoac dung --dry-run / --sql-out.'
    );
  }

  const loginRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const loginData = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok || !loginData?.access_token) {
    throw new Error(`Dang nhap Admin that bai: ${loginData?.error_description || loginData?.msg || `HTTP ${loginRes.status}`}`);
  }
  return {
    apiKey: supabaseAnonKey,
    authHeader: `Bearer ${loginData.access_token}`,
    mode: 'admin_login',
  };
}

async function fetchExistingVideoMap(supabaseUrl, auth, youtubeIds) {
  const map = new Map();
  if (!youtubeIds.length || !supabaseUrl || !auth) return map;
  const inFilter = `(${youtubeIds.join(',')})`;
  const res = await fetch(
    `${supabaseUrl}/rest/v1/studio_videos?select=id,youtube_video_id&youtube_video_id=in.${encodeURIComponent(inFilter)}`,
    {
      headers: {
        apikey: auth.apiKey,
        Authorization: auth.authHeader,
      },
    }
  );
  if (!res.ok) return map;
  const rows = await res.json().catch(() => []);
  if (Array.isArray(rows)) {
    for (const r of rows) {
      if (r?.youtube_video_id && r?.id) {
        map.set(r.youtube_video_id, r.id);
      }
    }
  }
  return map;
}

async function upsertStudioVideo(supabaseUrl, auth, payload) {
  const res = await fetch(`${supabaseUrl}/rest/v1/studio_videos`, {
    method: 'POST',
    headers: {
      apikey: auth.apiKey,
      Authorization: auth.authHeader,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }
}

function buildSqlSeedStatements(records) {
  return records
    .map((rec) => {
      const escapedJson = JSON.stringify([rec]).replace(/'/g, "''");
      return [
        'INSERT INTO public.studio_videos (id, youtube_video_id, title, channel_name, author, genre, level, tags, start_seconds, end_seconds, cue_count, cues, caption_status, translation_status, is_pro, is_published)',
        'SELECT r.id, r.youtube_video_id, r.title, r.channel_name, r.author, r.genre, r.level, r.tags, r.start_seconds, r.end_seconds, r.cue_count, r.cues, r.caption_status, r.translation_status, r.is_pro, r.is_published',
        `FROM jsonb_populate_recordset(null::public.studio_videos, '${escapedJson}'::jsonb) AS r`,
        'ON CONFLICT (id) DO UPDATE SET cues = EXCLUDED.cues, cue_count = EXCLUDED.cue_count, title = EXCLUDED.title, channel_name = EXCLUDED.channel_name, level = EXCLUDED.level, updated_at = now();',
      ].join('\n');
    })
    .join('\n\n');
}

async function collectTargets(args) {
  if (!args.channel && !args.urls && !args.file && process.stdin.isTTY) {
    const rl = readline.createInterface({ input, output });
    try {
      args.channel = (await rl.question('Nhap link kenh YouTube (vd: https://www.youtube.com/@TEDEd): ')).trim();
      const limStr = (await rl.question(`So video moi nhat [${args.limit}]: `)).trim();
      if (limStr) args.limit = Math.min(30, Math.max(1, Number.parseInt(limStr, 10) || 20));
    } finally {
      rl.close();
    }
  }

  let resolvedChannelName = args.channelName.trim();
  const targets = [];
  const seen = new Set();

  if (args.channel) {
    console.log(`\nDang quet toi da ${args.limit} video moi nhat tu kenh: ${args.channel}`);
    const ch = await resolveYoutubeChannelVideos(args.channel, args.limit);
    if (!resolvedChannelName) resolvedChannelName = ch.channel_name;
    console.log(`-> Tim thay ${ch.videos.length} video tu kenh "${ch.channel_name}".`);
    for (const v of ch.videos) {
      if (!seen.has(v.youtube_video_id)) {
        seen.add(v.youtube_video_id);
        targets.push(v);
      }
    }
  }

  let rawUrlList = args.urls || '';
  if (args.file) {
    const fileContent = await fs.readFile(path.resolve(process.cwd(), args.file), 'utf8');
    rawUrlList = `${rawUrlList}\n${fileContent}`;
  }
  for (const token of rawUrlList.split(/[\r\n,\s]+/).map((s) => s.trim()).filter(Boolean)) {
    const vid = extractYoutubeVideoId(token);
    if (vid && !seen.has(vid)) {
      seen.add(vid);
      targets.push({
        youtube_video_id: vid,
        url: `https://www.youtube.com/watch?v=${vid}`,
        title: '',
      });
    }
  }

  return { resolvedChannelName, targets };
}

async function main() {
  await loadEnvFiles();
  const args = parseCliArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const { resolvedChannelName, targets } = await collectTargets(args);
  if (!targets.length) {
    console.error('Chua co link kenh hoac link video YouTube hop le. Chay "--help" de xem huong dan.');
    process.exit(1);
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const env = {
    DEEPL_API_KEY: process.env.DEEPL_API_KEY || '',
  };

  let auth = null;
  if (!args.dryRun && !(args.sqlOut && !serviceRoleKey && !args.email && !args.token && !process.stdin.isTTY)) {
    if (!supabaseUrl || (!supabaseAnonKey && !serviceRoleKey)) {
      throw new Error('Thieu VITE_SUPABASE_URL hoac VITE_SUPABASE_ANON_KEY trong .env.local.');
    }
    auth = await resolveSupabaseAuth({ supabaseUrl, supabaseAnonKey, serviceRoleKey, args });
    console.log(`Xac thuc Supabase thanh cong (${auth.mode}).`);
  }

  const existingMap = auth
    ? await fetchExistingVideoMap(
        supabaseUrl,
        auth,
        targets.map((t) => t.youtube_video_id)
      )
    : new Map();

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const generatedRecords = [];

  console.log(`\nBat dau xu ly ${targets.length} video (is_pro=false)...\n`);

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];
    const vid = item.youtube_video_id;
    const prefix = `[${i + 1}/${targets.length}] ${vid}`;

    const existingId = existingMap.get(vid) || '';
    if (existingId && !args.overwrite) {
      skippedCount += 1;
      console.log(`${prefix} -> BO QUA (da co trong Supabase voi id="${existingId}")`);
      continue;
    }

    try {
      const extracted = await extractYoutubeVideoCaptions({
        videoId: vid,
        env,
        userTitle: item.title || '',
        userAuthor: resolvedChannelName,
        includeVi: true,
        allowDeepL: true,
        translateAll: true,
      });

      const channelName = resolvedChannelName || extracted.author || 'YouTube';
      const record = {
        id: existingId || `yt-${vid}`,
        youtube_video_id: vid,
        title: extracted.title,
        channel_name: channelName,
        author: extracted.author || channelName,
        genre: `${channelName} · Shadowing`,
        level: args.level,
        tags: ['shadowing', 'youtube', args.level.toLowerCase()],
        start_seconds: extracted.startSeconds,
        end_seconds: extracted.endSeconds,
        cue_count: extracted.cueCount,
        cues: extracted.cues,
        caption_status: extracted.captionSource === 'youtube_caption_track' ? 'youtube_manual' : 'youtube_auto',
        translation_status: extracted.translationStatus,
        is_pro: false,
        is_published: true,
        updated_at: new Date().toISOString(),
      };

      if (auth && !args.dryRun) {
        await upsertStudioVideo(supabaseUrl, auth, record);
      }
      generatedRecords.push(record);
      successCount += 1;
      console.log(
        `${prefix} -> OK: "${extracted.title}" (${extracted.cueCount} cau, ${extracted.translatedCuesCount} VI, kenh="${channelName}")`
      );
    } catch (err) {
      errorCount += 1;
      const reason = err?.detail || err?.message || 'Khong lay duoc phu de';
      console.error(`${prefix} -> LOI: ${reason}`);
    }

    if (i + 1 < targets.length) {
      await new Promise((r) => setTimeout(r, 350));
    }
  }

  if (args.sqlOut && generatedRecords.length > 0) {
    const sqlPath = path.resolve(process.cwd(), args.sqlOut);
    await fs.writeFile(sqlPath, buildSqlSeedStatements(generatedRecords), 'utf8');
    console.log(`\nDa xuat file SQL: ${sqlPath}`);
  }

  console.log(`\n=== KET QUA ===`);
  console.log(`Thanh cong: ${successCount} | Bo qua (da co): ${skippedCount} | Loi: ${errorCount}`);
  if (args.dryRun) {
    console.log('(Che do --dry-run: chua ghi vao Supabase)');
  }
}

const isEntrypoint = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]).replace(/\\/g, '/'));
if (isEntrypoint) {
  main().catch((err) => {
    console.error('\nLoi:', err?.message || err);
    process.exit(1);
  });
}
