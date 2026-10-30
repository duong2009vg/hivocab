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
  20261021000100_data_access_and_rls.sql
  20261018000200_payment_constraints.sql
```

Required release checks:

- RLS is enabled on every user-owned and payment-related table.
- Admin RPCs check `is_admin()` inside the function, not only in the UI.
- `anon` cannot execute administrative functions.
- Every migration is applied to staging before production.
- The deployed database schema and generated client types are reviewed together.
- After applying `20261021000100_data_access_and_rls.sql`, verify the RPCs
  `get_cam_hierarchy`, `get_vocabulary_page`, `get_learned_vocab_stats`,
  `clone_public_topic`, `delete_topic_cascade`, `review_word`, and
  `review_word_to_level` with an authenticated staging user before deploying
  the frontend bundle.
- A quick RLS check in Supabase SQL Editor is:

```sql
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('topics', 'words', 'word_progress', 'study_sessions',
                    'topic_likes', 'topic_comments', 'tests', 'passages', 'profiles');
```

Do not commit service-role keys, passwords or production dumps here.
