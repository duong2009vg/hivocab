-- HiVocab security hardening.
-- Apply after the current schema baseline and verify in staging first.

-- Public IELTS content is readable but never writable by anon/authenticated
-- clients. Admin mutations must go through an admin-only RPC or policy.
DROP POLICY IF EXISTS tests_insert_service ON public.tests;
DROP POLICY IF EXISTS tests_update_service ON public.tests;
DROP POLICY IF EXISTS passages_insert_service ON public.passages;
DROP POLICY IF EXISTS passages_update_service ON public.passages;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tests' AND policyname = 'tests_read_all') THEN
    CREATE POLICY tests_read_all ON public.tests FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'passages' AND policyname = 'passages_read_all') THEN
    CREATE POLICY passages_read_all ON public.passages FOR SELECT USING (true);
  END IF;
END $$;

DROP POLICY IF EXISTS words_modify_policy ON public.words;
CREATE POLICY words_modify_policy ON public.words
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.topics
      WHERE topics.id = words.topic_id
        AND topics.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS topics_modify_policy ON public.topics;

CREATE OR REPLACE FUNCTION public.increment_session(p_user_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot update sessions for other users';
  END IF;

  INSERT INTO public.study_sessions (user_id, session_date, words_reviewed)
  VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, session_date)
  DO UPDATE SET words_reviewed = study_sessions.words_reviewed + 1;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_session(uuid, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_session(uuid, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_session(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_session(uuid, date) TO service_role;

CREATE OR REPLACE FUNCTION public.keepalive()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.keepalive_pings SET touched_at = NOW() WHERE id = 1;
  RETURN jsonb_build_object('ok', TRUE, 'touched_at', NOW());
END;
$$;

DROP POLICY IF EXISTS keepalive_pings_service ON public.keepalive_pings;
CREATE POLICY keepalive_pings_service ON public.keepalive_pings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
