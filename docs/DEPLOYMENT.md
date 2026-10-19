# Production deployment checklist

## Cloudflare Pages build variables

Set these in the Pages project before deploying:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_TURNSTILE_SITE_KEY
```

`VITE_SUPABASE_ANON_KEY` is the browser-safe anon key. Never use
`SUPABASE_SERVICE_ROLE_KEY` in a Vite variable.

## Pages Function bindings/secrets

Configure the server-only values separately:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- PayOS credentials/checksum key
- AI provider keys
- `APP_ORIGIN=https://hivocab.site`
- rate-limiter service binding and shared secret

## Release verification

1. Apply database migrations to staging.
2. Test normal user, admin and anonymous access against staging.
3. Test a signed payment webhook and a duplicate webhook.
4. Confirm failed metric queries display `—`, not a fabricated number.
5. Run `npm run ci` and `npm run test:e2e`.
6. Promote the same build and migration set to production.
