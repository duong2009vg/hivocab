// HiVocab shared rate limiter Worker.
// Deploy separately from the Pages project and bind it as
// HIVOCAB_RATE_LIMIT_SERVICE. Each key gets a strongly consistent Durable
// Object, so concurrent requests cannot race a shared in-memory counter.

const MAX_KEY_LENGTH = 240;
const MAX_LIMIT = 10000;
const ALLOWED_PERIODS = new Set([10, 60]);

export class RateLimiter {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    if (request.method !== 'POST') {
      return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }

    const input = await request.json().catch(() => null);
    const key = String(input?.key || '').trim();
    const limit = Number(input?.limit);
    const period = Number(input?.period);

    if (!key || key.length > MAX_KEY_LENGTH || !Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT || !ALLOWED_PERIODS.has(period)) {
      return Response.json({ ok: false, error: 'Invalid rate-limit request' }, { status: 400 });
    }

    const now = Date.now();
    const stored = await this.state.storage.get('window');
    const current = stored && stored.period === period && stored.limit === limit && now < stored.resetAt
      ? stored
      : { count: 0, resetAt: now + period * 1000, limit, period };

    if (current.count >= limit) {
      return Response.json({
        allowed: false,
        retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
      });
    }

    current.count += 1;
    await this.state.storage.put('window', current);
    return Response.json({ allowed: true, retryAfter: period });
  }
}

export default {
  async fetch(request, env) {
    const secret = String(env.RATE_LIMITER_INTERNAL_SECRET || '');
    if (!secret || request.headers.get('X-Rate-Limit-Secret') !== secret) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (new URL(request.url).pathname !== '/check') {
      return Response.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    const input = await request.json().catch(() => null);
    const key = String(input?.key || '').trim();
    if (!key || key.length > MAX_KEY_LENGTH) {
      return Response.json({ ok: false, error: 'Invalid key' }, { status: 400 });
    }

    const id = env.RATE_LIMITER.idFromName(key);
    return env.RATE_LIMITER.get(id).fetch('https://durable-object/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  },
};
