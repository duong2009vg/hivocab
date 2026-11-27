-- Migration 4: Optional One-Click Cleanup (DROP redundant indexes, DROP POLICY consolidation, REVOKE anon RPCs)
-- Run this once in Supabase Dashboard -> SQL Editor if you want to reclaim ~25 MB of redundant indexes and clear remaining linter warnings.

-- 1. Recreate word_count trigger with UPDATE OF topic_id tracking
DROP TRIGGER IF EXISTS trg_topic_word_count ON public.words;
CREATE TRIGGER trg_topic_word_count
  AFTER INSERT OR DELETE OR UPDATE OF topic_id ON public.words
  FOR EACH ROW
  EXECUTE FUNCTION public.update_topic_word_count();

-- 2. Drop dead function & redundant/unused/bloated indexes (~25 MB reclaimed)
DROP FUNCTION IF EXISTS public.test_fn();

DROP INDEX IF EXISTS public.idx_words_topic;
DROP INDEX IF EXISTS public.idx_words_meaning_trgm;
DROP INDEX IF EXISTS public.idx_words_word_trgm;
DROP INDEX IF EXISTS public.idx_words_image_url;
DROP INDEX IF EXISTS public.idx_words_topic_lesson_order;
DROP INDEX IF EXISTS public.idx_words_passage_id;
DROP INDEX IF EXISTS public.idx_ex_questions_ex_id;
DROP INDEX IF EXISTS public.idx_exercise_questions_exercise_id;
DROP INDEX IF EXISTS public.idx_orders_order_code;
DROP INDEX IF EXISTS public.idx_word_progress_user_word;
DROP INDEX IF EXISTS public.idx_thpt_exam_questions_num;
DROP INDEX IF EXISTS public.idx_thpt_exam_questions_exam_id;
DROP INDEX IF EXISTS public.idx_exercises_user_group;
DROP INDEX IF EXISTS public.idx_profiles_tier;
DROP INDEX IF EXISTS public.idx_topic_likes_user_id;
DROP INDEX IF EXISTS public.idx_topic_comments_word_id;
DROP INDEX IF EXISTS public.idx_user_bug_reports_user_id;

-- 3. Consolidate overlapping permissive RLS policies (multiple_permissive_policies -> 0)
-- topics
DROP POLICY IF EXISTS "Public can view public topics" ON public.topics;
DROP POLICY IF EXISTS topics_admin_all ON public.topics;
DROP POLICY IF EXISTS topics_select_policy ON public.topics;
DROP POLICY IF EXISTS topics_insert_policy ON public.topics;
DROP POLICY IF EXISTS topics_update_policy ON public.topics;
DROP POLICY IF EXISTS topics_delete_policy ON public.topics;

CREATE POLICY topics_select ON public.topics FOR SELECT TO anon, authenticated
  USING (user_id IS NULL OR is_public = true OR user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY topics_insert ON public.topics FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) OR (user_id IS NULL AND (SELECT public.is_admin())));
CREATE POLICY topics_update ON public.topics FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY topics_delete ON public.topics FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- words
DROP POLICY IF EXISTS words_admin_all ON public.words;
DROP POLICY IF EXISTS words_select_policy ON public.words;
DROP POLICY IF EXISTS words_modify_policy ON public.words;
DROP POLICY IF EXISTS words_update_policy ON public.words;
DROP POLICY IF EXISTS words_delete_policy ON public.words;

CREATE POLICY words_select ON public.words FOR SELECT TO anon, authenticated
  USING (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.topics t
      LEFT JOIN public.passages p ON p.id = words.passage_id
      LEFT JOIN public.tests te ON te.id = p.test_id
      WHERE t.id = words.topic_id
        AND (
          t.user_id = (SELECT auth.uid())
          OR ((t.user_id IS NULL OR t.is_public = true) AND ((NOT COALESCE(t.is_pro, false) AND NOT COALESCE(p.is_pro, false) AND NOT COALESCE(te.is_pro, false)) OR (SELECT public.is_pro())))
        )
    )
  );
CREATE POLICY words_insert ON public.words FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()) OR EXISTS (SELECT 1 FROM public.topics t WHERE t.id = words.topic_id AND t.user_id = (SELECT auth.uid())));
CREATE POLICY words_update ON public.words FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()) OR EXISTS (SELECT 1 FROM public.topics t WHERE t.id = words.topic_id AND t.user_id = (SELECT auth.uid())))
  WITH CHECK ((SELECT public.is_admin()) OR EXISTS (SELECT 1 FROM public.topics t WHERE t.id = words.topic_id AND t.user_id = (SELECT auth.uid())));
CREATE POLICY words_delete ON public.words FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()) OR EXISTS (SELECT 1 FROM public.topics t WHERE t.id = words.topic_id AND t.user_id = (SELECT auth.uid())));

-- passages & tests
DROP POLICY IF EXISTS passages_admin_write ON public.passages;
DROP POLICY IF EXISTS passages_select_visible ON public.passages;
CREATE POLICY passages_select ON public.passages FOR SELECT TO anon, authenticated
  USING (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.topics t LEFT JOIN public.tests te ON te.id = passages.test_id
      WHERE t.id = passages.topic_id
        AND (t.user_id = (SELECT auth.uid()) OR ((t.user_id IS NULL OR t.is_public = true) AND ((NOT COALESCE(passages.is_pro, false) AND NOT COALESCE(te.is_pro, false) AND NOT COALESCE(t.is_pro, false)) OR (SELECT public.is_pro()))))
    )
  );
CREATE POLICY passages_insert ON public.passages FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY passages_update ON public.passages FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY passages_delete ON public.passages FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS tests_admin_write ON public.tests;
DROP POLICY IF EXISTS tests_select_visible ON public.tests;
CREATE POLICY tests_select ON public.tests FOR SELECT TO anon, authenticated
  USING (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = tests.topic_id
        AND (t.user_id = (SELECT auth.uid()) OR ((t.user_id IS NULL OR t.is_public = true) AND ((NOT COALESCE(tests.is_pro, false) AND NOT COALESCE(t.is_pro, false)) OR (SELECT public.is_pro()))))
    )
  );
CREATE POLICY tests_insert ON public.tests FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY tests_update ON public.tests FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY tests_delete ON public.tests FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

-- thpt_exams & thpt_exam_questions
DROP POLICY IF EXISTS thpt_exams_admin_all ON public.thpt_exams;
DROP POLICY IF EXISTS thpt_exams_select_policy ON public.thpt_exams;
CREATE POLICY thpt_exams_select ON public.thpt_exams FOR SELECT TO anon, authenticated
  USING ((SELECT public.is_admin()) OR (SELECT public.is_pro()) OR NOT COALESCE(is_pro, false));
CREATE POLICY thpt_exams_insert ON public.thpt_exams FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY thpt_exams_update ON public.thpt_exams FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY thpt_exams_delete ON public.thpt_exams FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS thpt_exam_questions_admin_write ON public.thpt_exam_questions;
DROP POLICY IF EXISTS thpt_exam_questions_select_visible ON public.thpt_exam_questions;
CREATE POLICY thpt_exam_questions_select ON public.thpt_exam_questions FOR SELECT TO anon, authenticated
  USING ((SELECT public.is_admin()) OR (SELECT public.is_pro()) OR NOT EXISTS (SELECT 1 FROM public.thpt_exams e WHERE e.id = thpt_exam_questions.exam_id AND COALESCE(e.is_pro, false)));
CREATE POLICY thpt_exam_questions_insert ON public.thpt_exam_questions FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY thpt_exam_questions_update ON public.thpt_exam_questions FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY thpt_exam_questions_delete ON public.thpt_exam_questions FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

-- exercises & exercise_questions
DROP POLICY IF EXISTS exercises_public_read ON public.exercises;
DROP POLICY IF EXISTS exercises_select_policy ON public.exercises;
DROP POLICY IF EXISTS exercises_modify_policy ON public.exercises;
DROP POLICY IF EXISTS exercises_update_policy ON public.exercises;
DROP POLICY IF EXISTS exercises_delete_policy ON public.exercises;
CREATE POLICY exercises_select ON public.exercises FOR SELECT TO anon, authenticated USING (user_id IS NULL OR user_id = (SELECT auth.uid()));
CREATE POLICY exercises_insert ON public.exercises FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY exercises_update ON public.exercises FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY exercises_delete ON public.exercises FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS ex_questions_public_read ON public.exercise_questions;
DROP POLICY IF EXISTS ex_questions_select_policy ON public.exercise_questions;
DROP POLICY IF EXISTS ex_questions_modify_policy ON public.exercise_questions;
DROP POLICY IF EXISTS ex_questions_update_policy ON public.exercise_questions;
DROP POLICY IF EXISTS ex_questions_delete_policy ON public.exercise_questions;
CREATE POLICY exercise_questions_select ON public.exercise_questions FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.exercises e WHERE e.id = exercise_questions.exercise_id AND (e.user_id IS NULL OR e.user_id = (SELECT auth.uid()))));
CREATE POLICY exercise_questions_insert ON public.exercise_questions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.exercises e WHERE e.id = exercise_questions.exercise_id AND e.user_id = (SELECT auth.uid())));
CREATE POLICY exercise_questions_update ON public.exercise_questions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exercises e WHERE e.id = exercise_questions.exercise_id AND e.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.exercises e WHERE e.id = exercise_questions.exercise_id AND e.user_id = (SELECT auth.uid())));
CREATE POLICY exercise_questions_delete ON public.exercise_questions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exercises e WHERE e.id = exercise_questions.exercise_id AND e.user_id = (SELECT auth.uid())));

-- word_progress & study_sessions
DROP POLICY IF EXISTS word_progress_admin_read ON public.word_progress;
DROP POLICY IF EXISTS word_progress_owner ON public.word_progress;
CREATE POLICY word_progress_select ON public.word_progress FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY word_progress_insert ON public.word_progress FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY word_progress_update ON public.word_progress FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY word_progress_delete ON public.word_progress FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS study_sessions_admin_read ON public.study_sessions;
DROP POLICY IF EXISTS study_sessions_owner ON public.study_sessions;
CREATE POLICY study_sessions_select ON public.study_sessions FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY study_sessions_insert ON public.study_sessions FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY study_sessions_update ON public.study_sessions FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY study_sessions_delete ON public.study_sessions FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- community_messages, system_settings, logs & feedback tables
DROP POLICY IF EXISTS community_messages_select_public ON public.community_messages;
DROP POLICY IF EXISTS community_messages_select_own_or_admin ON public.community_messages;
CREATE POLICY community_messages_select ON public.community_messages FOR SELECT TO anon, authenticated
  USING (is_deleted = false OR user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Public read system settings" ON public.system_settings;
CREATE POLICY system_settings_select ON public.system_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY system_settings_insert ON public.system_settings FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY system_settings_update ON public.system_settings FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY system_settings_delete ON public.system_settings FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin manage answer reports" ON public.answer_reports;
DROP POLICY IF EXISTS "Allow insert reports" ON public.answer_reports;
CREATE POLICY answer_reports_select ON public.answer_reports FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
CREATE POLICY answer_reports_insert ON public.answer_reports FOR INSERT TO anon, authenticated
  WITH CHECK ((exam_id IS NOT NULL AND question_number IS NOT NULL) OR (SELECT public.is_admin()));
CREATE POLICY answer_reports_update ON public.answer_reports FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY answer_reports_delete ON public.answer_reports FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin read error logs" ON public.system_error_logs;
DROP POLICY IF EXISTS "Public insert error logs" ON public.system_error_logs;
CREATE POLICY system_error_logs_select ON public.system_error_logs FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
CREATE POLICY system_error_logs_insert ON public.system_error_logs FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin manage bug reports" ON public.user_bug_reports;
DROP POLICY IF EXISTS "Public insert bug reports" ON public.user_bug_reports;
CREATE POLICY user_bug_reports_select ON public.user_bug_reports FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
CREATE POLICY user_bug_reports_insert ON public.user_bug_reports FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Like access" ON public.topic_likes;
DROP POLICY IF EXISTS topic_likes_select_all ON public.topic_likes;
CREATE POLICY topic_likes_select ON public.topic_likes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY topic_likes_insert ON public.topic_likes FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY topic_likes_delete ON public.topic_likes FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Comment access" ON public.topic_comments;
DROP POLICY IF EXISTS topic_comments_select_all ON public.topic_comments;
CREATE POLICY topic_comments_select ON public.topic_comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY topic_comments_insert ON public.topic_comments FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY topic_comments_update ON public.topic_comments FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin())) WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY topic_comments_delete ON public.topic_comments FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- 4. Revoke anon EXECUTE on auth-only / admin-only SECURITY DEFINER RPCs
REVOKE EXECUTE ON FUNCTION public.bulk_update_english_meanings(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.review_word(uuid, text, date, double precision) FROM anon;
REVOKE EXECUTE ON FUNCTION public.review_word_to_level(uuid, integer, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_learned_vocab_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_vocabulary_page(integer, integer, text, integer, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_vocabulary_page_v2(integer, integer, text, integer, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_vocabulary_page_v3(integer, integer, text, integer, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_community_message_integrity() FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_user_youtube_video_limit() FROM anon;
