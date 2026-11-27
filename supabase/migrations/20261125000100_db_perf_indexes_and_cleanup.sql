-- Migration 1: Index cleanup, missing FK indexes, composite query indexes, and word_count trigger hardening

-- 1. Harden word_count maintenance trigger on public.words
CREATE OR REPLACE FUNCTION public.update_topic_word_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.topics
    SET word_count = COALESCE(word_count, 0) + 1
    WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.topics
    SET word_count = GREATEST(0, COALESCE(word_count, 0) - 1)
    WHERE id = OLD.topic_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.topic_id IS DISTINCT FROM NEW.topic_id THEN
    IF OLD.topic_id IS NOT NULL THEN
      UPDATE public.topics
      SET word_count = GREATEST(0, COALESCE(word_count, 0) - 1)
      WHERE id = OLD.topic_id;
    END IF;
    IF NEW.topic_id IS NOT NULL THEN
      UPDATE public.topics
      SET word_count = COALESCE(word_count, 0) + 1
      WHERE id = NEW.topic_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_topic_word_count ON public.words;
CREATE TRIGGER trg_topic_word_count
  AFTER INSERT OR DELETE OR UPDATE OF topic_id ON public.words
  FOR EACH ROW
  EXECUTE FUNCTION public.update_topic_word_count();

-- 2. Backfill exact cached word_count across all topics
UPDATE public.topics t
SET word_count = COALESCE(c.cnt, 0)
FROM (
  SELECT topic_id, COUNT(*)::int AS cnt
  FROM public.words
  GROUP BY topic_id
) c
WHERE t.id = c.topic_id
  AND COALESCE(t.word_count, -1) <> c.cnt;

UPDATE public.topics t
SET word_count = 0
WHERE (word_count IS NULL OR word_count <> 0)
  AND NOT EXISTS (SELECT 1 FROM public.words w WHERE w.topic_id = t.id);

-- 3. Remove dead stub function and duplicate / bloated / unused indexes
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

-- 4. Create targeted composite & missing foreign-key indexes
CREATE INDEX IF NOT EXISTS idx_words_topic_lesson_word_created
  ON public.words (topic_id, lesson_order, word_order, created_at);

CREATE INDEX IF NOT EXISTS idx_words_passage_word_order
  ON public.words (passage_id, word_order)
  WHERE passage_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_exercise_questions_exercise_order
  ON public.exercise_questions (exercise_id, order_index);

CREATE INDEX IF NOT EXISTS idx_passages_topic_test_num
  ON public.passages (topic_id, test_id, passage_number);

CREATE INDEX IF NOT EXISTS idx_tests_topic_order
  ON public.tests (topic_id, test_order);

CREATE INDEX IF NOT EXISTS idx_exercises_category_id
  ON public.exercises (category, id);

CREATE INDEX IF NOT EXISTS idx_topics_public_likes
  ON public.topics (is_public, like_count DESC)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_community_messages_user_id
  ON public.community_messages (user_id);

CREATE INDEX IF NOT EXISTS idx_community_messages_attached_topic_id
  ON public.community_messages (attached_topic_id)
  WHERE attached_topic_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_system_settings_updated_by
  ON public.system_settings (updated_by)
  WHERE updated_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_word_review_logs_word_id
  ON public.word_review_logs (word_id);
