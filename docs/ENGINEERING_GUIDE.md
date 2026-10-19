# HiVocab Engineering Guide

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill the three `VITE_*` values. Only the Supabase anon key and Turnstile site key belong in the browser; never add a service-role key.
3. Run `npm ci`.
4. Run `npm run dev`.

## Quality gates

Before opening a pull request, run:

```text
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Lint currently reports legacy warnings but no blocking errors. New code should not add warnings, especially around hooks, empty catches and unused exports.

## Architecture rules

- Keep database access in `src/services/` and keep one domain per service.
- Components should focus on rendering; move data fetching and mutations into hooks/services.
- New pages and admin tabs must be lazy-loaded.
- Do not use `select('*')` for admin or user data; select only required columns.
- Do not display estimated or fallback business metrics as real data. Use an unavailable state when a query fails.
- User-owned data must have an explicit cache policy and expiry.
- All production database changes require a new migration under `supabase/migrations/`.

## Release flow

Use a feature branch and pull request. Do not push directly to `main`. CI must pass before merging.
