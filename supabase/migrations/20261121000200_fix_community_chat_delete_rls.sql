-- Allow message owners and admins to select their own community_messages rows (including soft-deleted rows)
-- so PostgreSQL RLS check on soft-delete UPDATE does not reject `new row violates row-level security policy`.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_messages'
      AND policyname = 'community_messages_select_own_or_admin'
  ) THEN
    CREATE POLICY community_messages_select_own_or_admin
      ON public.community_messages
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid() OR public.is_admin());
  END IF;
END $$;
