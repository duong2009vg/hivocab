-- Optimize RLS policies on public.words, public.topics, public.passages, public.tests
-- Wrap public.is_admin(), public.is_pro(), and auth.uid() in (SELECT ...) InitPlans
-- so Postgres evaluates them once per query instead of per row across 82k+ words.

DROP POLICY IF EXISTS words_admin_all ON public.words;
CREATE POLICY words_admin_all ON public.words
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS words_select_policy ON public.words;
CREATE POLICY words_select_policy ON public.words
  AS PERMISSIVE FOR SELECT TO public
  USING (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.topics t
      LEFT JOIN public.passages p ON p.id = words.passage_id
      LEFT JOIN public.tests te ON te.id = p.test_id
      WHERE t.id = words.topic_id
        AND (
          t.user_id = (SELECT auth.uid())
          OR (
            (t.user_id IS NULL OR t.is_public = true)
            AND (
              (NOT COALESCE(t.is_pro, false) AND NOT COALESCE(p.is_pro, false) AND NOT COALESCE(te.is_pro, false))
              OR (SELECT public.is_pro())
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS topics_admin_all ON public.topics;
CREATE POLICY topics_admin_all ON public.topics
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS topics_insert_policy ON public.topics;
CREATE POLICY topics_insert_policy ON public.topics
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((user_id = (SELECT auth.uid())) OR ((user_id IS NULL) AND (SELECT public.is_admin())));

DROP POLICY IF EXISTS passages_admin_write ON public.passages;
CREATE POLICY passages_admin_write ON public.passages
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS passages_select_visible ON public.passages;
CREATE POLICY passages_select_visible ON public.passages
  AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.topics t
      LEFT JOIN public.tests te ON te.id = passages.test_id
      WHERE t.id = passages.topic_id
        AND (
          t.user_id = (SELECT auth.uid())
          OR (
            (t.user_id IS NULL OR t.is_public = true)
            AND (
              (NOT COALESCE(passages.is_pro, false) AND NOT COALESCE(te.is_pro, false) AND NOT COALESCE(t.is_pro, false))
              OR (SELECT public.is_pro())
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS tests_admin_write ON public.tests;
CREATE POLICY tests_admin_write ON public.tests
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS tests_select_visible ON public.tests;
CREATE POLICY tests_select_visible ON public.tests
  AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.topics t
      WHERE t.id = tests.topic_id
        AND (
          t.user_id = (SELECT auth.uid())
          OR (
            (t.user_id IS NULL OR t.is_public = true)
            AND (
              (NOT COALESCE(tests.is_pro, false) AND NOT COALESCE(t.is_pro, false))
              OR (SELECT public.is_pro())
            )
          )
        )
    )
  );
