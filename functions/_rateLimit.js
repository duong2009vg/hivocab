// Shared Cloudflare Rate Limiting API helper.
// Production must provide the configured RateLimit bindings from wrangler.toml
// or the Cloudflare Pages dashboard. The in-memory fallback is local-only.

const localCounters = new Map();

export const RATE_LIMIT_RULES = Object.freeze({
  public: { binding: 'HIVOCAB_PUBLIC_RATE_LIMITER', limit: 60, period: 60 },
  ai: { binding: 'HIVOCAB_AI_RATE_LIMITER', limit: 30, period: 60 },
  dictionary: { binding: 'HIVOCAB_DICTIONARY_RATE_LIMITER', limit: 45, period: 60 },
  translate: { binding: 'HIVOCAB_TRANSLATE_RATE_LIMITER', limit: 35, period: 60 },
  tts: { binding: 'HIVOCAB_TTS_RATE_LIMITER', limit: 30, period: 60 },
  auth: { binding: 'HIVOCAB_AUTH_RATE_LIMITER', limit: 12, period: 60 },
  payment: { binding: 'HIVOCAB_PAYMENT_RATE_LIMITER', limit: 3, period: 60 },
  paymentStatus: { binding: 'HIVOCAB_PAYMENT_STATUS_RATE_LIMITER', limit: 60, period: 60 },
  webhook: { binding: 'HIVOCAB_WEBHOOK_RATE_LIMITER', limit: 120, period: 60 },
  keepalive: { binding: 'HIVOCAB_KEEPALIVE_RATE_LIMITER', limit: 10, period: 60 },
});

function isProduction(env) {
  return Boolean(env?.CF_PAGES || env?.ENVIRONMENT === 'production' || env?.NODE_ENV === 'production');
}

function getClientIp(request) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown-ip';
}

export function getRateLimitSubject(request, subject = '') {
  const value = String(subject || getClientIp(request)).trim();
  return value.slice(0, 160) || 'unknown';
}

function localRateLimit(key, rule) {
  const now = Date.now();
  const current = localCounters.get(key);
  if (!current || now >= current.resetAt) {
    localCounters.set(key, { count: 1, resetAt: now + rule.period * 1000 });
    return { allowed: true, retryAfter: rule.period, source: 'local' };
  }

  current.count += 1;
  return {
    allowed: current.count <= rule.limit,
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    source: 'local',
  };
}

export async function checkRateLimit({ request, env, ruleName, subject }) {
  const rule = RATE_LIMIT_RULES[ruleName];
  if (!rule) throw new Error(`Unknown rate-limit rule: ${ruleName}`);

  const key = `${ruleName}:${getRateLimitSubject(request, subject)}`;

  // Preferred production path for Pages Functions: a separately deployed
  // Durable Object Worker exposed through a Service Binding.
  const service = env?.HIVOCAB_RATE_LIMIT_SERVICE;
  if (service && typeof service.fetch === 'function') {
    try {
      const response = await service.fetch('https://hivocab-rate-limiter/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Rate-Limit-Secret': String(env.HIVOCAB_RATE_LIMIT_SECRET || ''),
        },
        body: JSON.stringify({ key, limit: rule.limit, period: rule.period }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || typeof result.allowed !== 'boolean') {
        throw new Error(`rate limiter returned HTTP ${response.status}`);
      }
      return {
        allowed: result.allowed,
        retryAfter: Number(result.retryAfter) || rule.period,
        source: 'durable-object',
      };
    } catch (error) {
      console.error(`[RateLimit:${ruleName}] Durable Object service failed`, error?.message || error);
      return { allowed: false, unavailable: true, retryAfter: rule.period, source: 'durable-object' };
    }
  }

  // Optional native Worker Rate Limiting API binding for a future Worker
  // migration. This is not the primary Pages Functions path.
  const limiter = env?.[rule.binding] || env?.HIVOCAB_RATE_LIMITER;

  if (limiter && typeof limiter.limit === 'function') {
    try {
      const result = await limiter.limit({ key });
      return {
        allowed: result?.success !== false,
        retryAfter: rule.period,
        source: 'cloudflare',
      };
    } catch (error) {
      console.error(`[RateLimit:${ruleName}] Cloudflare binding failed`, error?.message || error);
      return { allowed: false, unavailable: true, retryAfter: rule.period, source: 'cloudflare' };
    }
  }

  // Never silently downgrade a real deployment to a per-isolate limiter.
  if (isProduction(env) && env?.ALLOW_LOCAL_RATE_LIMIT !== 'true') {
    console.error(`[RateLimit:${ruleName}] Missing Cloudflare binding ${rule.binding}`);
    return { allowed: false, unavailable: true, retryAfter: rule.period, source: 'missing-binding' };
  }

  return localRateLimit(key, rule);
}

export function rateLimitResponse(result, corsHeaders = {}) {
  if (result.unavailable) {
    return new Response(JSON.stringify({ ok: false, error: 'Rate limit service unavailable' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(result.retryAfter || 60) },
    });
  }

  return new Response(JSON.stringify({ ok: false, error: 'Too many requests. Please try again later.' }), {
    status: 429,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(result.retryAfter || 60) },
  });
}
