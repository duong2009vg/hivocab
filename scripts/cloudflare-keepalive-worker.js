// ============================================================
// CLOUDFLARE WORKER: SUPABASE KEEPALIVE CRON
// ============================================================
// Worker độc lập chạy theo lịch Cron Trigger trên Cloudflare
// để giữ Supabase Database không bị Pause/Sleep sau 7 ngày.
// ============================================================

export default {
  // Hàm này tự động chạy khi Cron Trigger kích hoạt
  async scheduled(event, env, ctx) {
    console.log(`[Keepalive Worker] Cron triggered at: ${new Date(event.scheduledTime).toISOString()}`);
    
    const supabaseUrl = env.SUPABASE_URL;
    const anonKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error('[Keepalive Worker] Missing SUPABASE_URL or SUPABASE_ANON_KEY in Environment Variables');
      return;
    }

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
      });

      const text = await response.text();
      console.log(`[Keepalive Worker] Supabase status: ${response.status}, response: ${text}`);

    } catch (error) {
      console.error('[Keepalive Worker] Failed:', error.message);
    }
  },

  // Cho phép test nhanh bằng trình duyệt (HTTP GET)
  async fetch(request, env, ctx) {
    const supabaseUrl = env.SUPABASE_URL;
    const anonKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
      });

      const text = await response.text();
      return new Response(JSON.stringify({
        ok: response.ok,
        status: response.status,
        message: 'Keepalive executed successfully',
        data: text,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
};
