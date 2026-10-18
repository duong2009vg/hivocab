# Supabase migrations

This directory is the source of truth for database structure, RLS policies,
RPCs and indexes that must be reproducible in every environment.

The existing `data/*.sql` files are seed/import/historical hardening scripts and
are ignored by Git. Do not rely on them as a deployment mechanism. Before the
next production database change, create a baseline from the current production
schema in this directory, then add timestamped migrations only:

```text
supabase/migrations/
  00000000000000_baseline.sql
  20261018000100_security_hardening.sql
  20261018000200_payment_constraints.sql
```

Required release checks:

- RLS is enabled on every user-owned and payment-related table.
- Admin RPCs check `is_admin()` inside the function, not only in the UI.
- `anon` cannot execute administrative functions.
- Every migration is applied to staging before production.
- The deployed database schema and generated client types are reviewed together.

Do not commit service-role keys, passwords or production dumps here.
