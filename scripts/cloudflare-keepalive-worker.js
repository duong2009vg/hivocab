// ============================================================
// CLOUDFLARE WORKER: SUPABASE KEEPALIVE CRON
// ============================================================
// Worker độc lập chạy theo lịch Cron Trigger trên Cloudflare
// để giữ Supabase Database không bị Pause/Sleep sau 7 ngày.
// ============================================================

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] || 0) ^ (bb[i] || 0);
  }
  return diff === 0;
}

export default {
  // Hàm này tự động chạy khi Cron Trigger kích hoạt
  async scheduled(event, env) {
    console.log(`[Keepalive Worker] Cron triggered at: ${new Date(event.scheduledTime).toISOString()}`);
    
    const supabaseUrl = env.SUPABASE_URL;
    const anonKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error('[Keepalive Worker] Missing Supabase configuration in Environment Variables');
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      // 1. Gọi RPC keepalive trên Supabase
      const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/keepalive`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
        signal: controller.signal,
      });

      const text = await response.text();
      console.log(`[Keepalive Worker] Supabase status: ${response.status}, response length: ${text.length}`);

    } catch (error) {
      console.error('[Keepalive Worker] Failed:', error.message);
    } finally {
      clearTimeout(timer);
    }
  },

  // Cho phép test nhanh khi có Bearer CRON_SECRET hợp lệ
  async fetch(request, env) {
    const cronSecret = String(env.CRON_SECRET || '').trim();
    if (!cronSecret) {
      return new Response(JSON.stringify({ ok: false, error: 'Server misconfiguration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const auth = request.headers.get('authorization') || '';
    if (!timingSafeEqual(auth, `Bearer ${cronSecret}`)) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const supabaseUrl = env.SUPABASE_URL;
    const anonKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/keepalive`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
        signal: controller.signal,
      });

      return new Response(JSON.stringify({
        ok: response.ok,
        status: response.status,
      }), {
        status: response.ok ? 200 : 502,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'Keepalive failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    } finally {
      clearTimeout(timer);
    }
  }
};
