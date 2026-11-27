-- Migration 2: RLS InitPlan Optimization & Helper Functions
-- Already applied via execute_sql: is_admin(), is_pro(), and in-place ALTER POLICY fixes.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_pro()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND (
        role = 'admin'
        OR (
          (
            tier IN ('pro', 'lifetime')
            OR subscription_plan IN ('pro_1m', 'pro_6m', 'pro_1y', 'pro_lifetime', 'lifetime')
          )
          AND (
            subscription_expires_at IS NULL
            OR subscription_expires_at > NOW()
          )
        )
      )
  );
$function$;

ALTER POLICY profiles_select_owner_or_admin ON public.profiles
  USING ((id = (SELECT auth.uid())) OR (SELECT public.is_admin()));

ALTER POLICY profiles_update_owner_or_admin ON public.profiles
  USING ((id = (SELECT auth.uid())) OR (SELECT public.is_admin()))
  WITH CHECK ((id = (SELECT auth.uid())) OR (SELECT public.is_admin()));

ALTER POLICY words_select_policy ON public.words
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

ALTER POLICY passages_select_visible ON public.passages
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

ALTER POLICY tests_select_visible ON public.tests
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

ALTER POLICY topics_insert_policy ON public.topics
  WITH CHECK ((user_id = (SELECT auth.uid())) OR ((user_id IS NULL) AND (SELECT public.is_admin())));

ALTER POLICY orders_select_policy ON public.orders
  USING (((SELECT auth.uid()) = user_id) OR (SELECT public.is_admin()));

ALTER POLICY user_youtube_videos_select_own ON public.user_youtube_videos
  USING (user_id = (SELECT auth.uid()));
ALTER POLICY user_youtube_videos_insert_own ON public.user_youtube_videos
  WITH CHECK (user_id = (SELECT auth.uid()));
ALTER POLICY user_youtube_videos_update_own ON public.user_youtube_videos
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
ALTER POLICY user_youtube_videos_delete_own ON public.user_youtube_videos
  USING (user_id = (SELECT auth.uid()));

ALTER POLICY user_exam_attempts_select_own ON public.user_exam_attempts
  USING (user_id = (SELECT auth.uid()));
ALTER POLICY user_exam_attempts_insert_own ON public.user_exam_attempts
  WITH CHECK (user_id = (SELECT auth.uid()));
ALTER POLICY user_exam_attempts_delete_own ON public.user_exam_attempts
  USING (user_id = (SELECT auth.uid()));

ALTER POLICY word_review_logs_owner ON public.word_review_logs
  USING ((user_id = (SELECT auth.uid())) OR (SELECT public.is_admin()))
  WITH CHECK ((user_id = (SELECT auth.uid())) OR (SELECT public.is_admin()));

ALTER POLICY community_messages_insert_own ON public.community_messages
  WITH CHECK (user_id = (SELECT auth.uid()));
ALTER POLICY community_messages_select_own_or_admin ON public.community_messages
  USING ((user_id = (SELECT auth.uid())) OR (SELECT public.is_admin()));
ALTER POLICY community_messages_update_own_or_admin ON public.community_messages
  USING ((user_id = (SELECT auth.uid())) OR (SELECT public.is_admin()))
  WITH CHECK ((user_id = (SELECT auth.uid())) OR (SELECT public.is_admin()));
ALTER POLICY community_messages_delete_own_or_admin ON public.community_messages
  USING ((user_id = (SELECT auth.uid())) OR (SELECT public.is_admin()));

ALTER POLICY "Public insert bug reports" ON public.user_bug_reports
  WITH CHECK ((user_id IS NULL) OR (user_id = (SELECT auth.uid())));

ALTER POLICY "Public insert error logs" ON public.system_error_logs
  WITH CHECK ((user_id IS NULL) OR (user_id = (SELECT auth.uid())));
