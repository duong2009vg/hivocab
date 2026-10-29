-- HiVocab data access, aggregate RPCs and RLS hardening.
-- Apply this migration in staging first, then production.
-- The functions intentionally use auth.uid() instead of accepting a user id
-- from the browser, so a client cannot ask for another user's data.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $hivocab$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$hivocab$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- --------------------------------------------------------------------------
-- RLS: user-owned data and public topics
-- --------------------------------------------------------------------------

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove legacy policies on these tables before installing the canonical set
-- below. PostgreSQL combines policies with OR, so leaving an old permissive
-- policy in place would silently defeat the new ownership checks.
DO $hivocab$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'topics', 'words', 'word_progress', 'study_sessions',
        'topic_likes', 'topic_comments', 'tests', 'passages', 'profiles'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $hivocab$;

DROP POLICY IF EXISTS topics_select_visible ON public.topics;
CREATE POLICY topics_select_visible ON public.topics
  FOR SELECT TO anon, authenticated
  USING (
    user_id IS NULL
    OR is_public = true
    OR user_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS topics_insert_owner ON public.topics;
CREATE POLICY topics_insert_owner ON public.topics
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS topics_update_owner ON public.topics;
CREATE POLICY topics_update_owner ON public.topics
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS topics_delete_owner ON public.topics;
CREATE POLICY topics_delete_owner ON public.topics
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS words_select_visible ON public.words;
CREATE POLICY words_select_visible ON public.words
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = words.topic_id
        AND (
          t.user_id IS NULL
          OR t.is_public = true
          OR t.user_id = auth.uid()
          OR public.is_admin()
        )
    )
  );

DROP POLICY IF EXISTS words_insert_owner ON public.words;
CREATE POLICY words_insert_owner ON public.words
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = words.topic_id
        AND (t.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS words_update_owner ON public.words;
CREATE POLICY words_update_owner ON public.words
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = words.topic_id
        AND (t.user_id = auth.uid() OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = words.topic_id
        AND (t.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS words_delete_owner ON public.words;
CREATE POLICY words_delete_owner ON public.words
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = words.topic_id
        AND (t.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS word_progress_owner ON public.word_progress;
CREATE POLICY word_progress_owner ON public.word_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS study_sessions_owner ON public.study_sessions;
CREATE POLICY study_sessions_owner ON public.study_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS topic_likes_select_visible ON public.topic_likes;
CREATE POLICY topic_likes_select_visible ON public.topic_likes
  FOR SELECT TO anon, authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS topic_likes_insert_owner ON public.topic_likes;
CREATE POLICY topic_likes_insert_owner ON public.topic_likes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = topic_likes.topic_id
        AND (t.user_id IS NULL OR t.is_public = true OR t.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS topic_likes_delete_owner ON public.topic_likes;
CREATE POLICY topic_likes_delete_owner ON public.topic_likes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS topic_comments_select_visible ON public.topic_comments;
CREATE POLICY topic_comments_select_visible ON public.topic_comments
  FOR SELECT TO anon, authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = topic_comments.topic_id
        AND (t.user_id IS NULL OR t.is_public = true OR t.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS topic_comments_insert_owner ON public.topic_comments;
CREATE POLICY topic_comments_insert_owner ON public.topic_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = topic_comments.topic_id
        AND (t.user_id IS NULL OR t.is_public = true OR t.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS topic_comments_update_owner ON public.topic_comments;
CREATE POLICY topic_comments_update_owner ON public.topic_comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS topic_comments_delete_owner ON public.topic_comments;
CREATE POLICY topic_comments_delete_owner ON public.topic_comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- The previous hardening migration allowed every visitor to read tests and
-- passages, including content belonging to private topics. Replace it with
-- topic-aware visibility.
DROP POLICY IF EXISTS tests_read_all ON public.tests;
DROP POLICY IF EXISTS passages_read_all ON public.passages;
DROP POLICY IF EXISTS tests_select_visible ON public.tests;
DROP POLICY IF EXISTS passages_select_visible ON public.passages;

CREATE POLICY tests_select_visible ON public.tests
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = tests.topic_id
        AND (t.user_id IS NULL OR t.is_public = true OR t.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY passages_select_visible ON public.passages
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = passages.topic_id
        AND (t.user_id IS NULL OR t.is_public = true OR t.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS tests_admin_write ON public.tests;
CREATE POLICY tests_admin_write ON public.tests
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS passages_admin_write ON public.passages;
CREATE POLICY passages_admin_write ON public.passages
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS profiles_select_owner_or_admin ON public.profiles;
CREATE POLICY profiles_select_owner_or_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_update_owner_or_admin ON public.profiles;
CREATE POLICY profiles_update_owner_or_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE INDEX IF NOT EXISTS idx_topics_user_id ON public.topics(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_public_created_at ON public.topics(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topics_category ON public.topics(category);
CREATE INDEX IF NOT EXISTS idx_words_topic_id ON public.words(topic_id);
CREATE INDEX IF NOT EXISTS idx_words_passage_id ON public.words(passage_id);
CREATE INDEX IF NOT EXISTS idx_word_progress_user_review ON public.word_progress(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_word_progress_user_level ON public.word_progress(user_id, level);
CREATE INDEX IF NOT EXISTS idx_word_progress_user_word ON public.word_progress(user_id, word_id);
CREATE INDEX IF NOT EXISTS idx_topic_likes_user_topic ON public.topic_likes(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_comments_topic_created ON public.topic_comments(topic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tests_topic_order ON public.tests(topic_id, test_order);
CREATE INDEX IF NOT EXISTS idx_passages_topic_number ON public.passages(topic_id, passage_number);

-- --------------------------------------------------------------------------
-- Fast topic detail: one server-side aggregate instead of one count query per
-- passage plus separate progress queries.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_cam_hierarchy(p_topic_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $hivocab$
DECLARE
  v_uid uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.topics t
    WHERE t.id = p_topic_id
      AND (t.user_id IS NULL OR t.is_public = true OR t.user_id = v_uid OR public.is_admin())
  ) THEN
    RETURN NULL;
  END IF;

  WITH passage_stats AS (
    SELECT
      p.id,
      p.test_id,
      p.passage_number,
      p.title,
      p.topic_label,
      p.content_en,
      p.content_vi,
      p.is_pro,
      COUNT(w.id)::int AS total_words,
      COUNT(wp.word_id)::int AS learned_words
    FROM public.passages p
    LEFT JOIN public.words w ON w.passage_id = p.id
    LEFT JOIN public.word_progress wp
      ON wp.word_id = w.id
     AND wp.user_id = v_uid
     AND COALESCE(wp.level, 0) > 0
    WHERE p.topic_id = p_topic_id
    GROUP BY p.id
  ),
  test_rows AS (
    SELECT
      t.id,
      t.name,
      t.test_order,
      t.is_pro,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', ps.id,
            'testId', ps.test_id,
            'passageNumber', ps.passage_number,
            'title', COALESCE(ps.title, 'Passage ' || ps.passage_number),
            'topicLabel', ps.topic_label,
            'contentEn', ps.content_en,
            'contentVi', ps.content_vi,
            'isPro', COALESCE(ps.is_pro, false),
            'totalWords', ps.total_words,
            'learnedWords', ps.learned_words,
            'progress', CASE WHEN ps.total_words > 0 THEN ROUND(ps.learned_words * 100.0 / ps.total_words)::int ELSE 0 END
          ) ORDER BY ps.passage_number NULLS LAST
        ) FILTER (WHERE ps.id IS NOT NULL),
        '[]'::jsonb
      ) AS passages
    FROM public.tests t
    LEFT JOIN passage_stats ps ON ps.test_id = t.id
    WHERE t.topic_id = p_topic_id
    GROUP BY t.id
  ),
  topic_stats AS (
    SELECT
      COUNT(w.id)::int AS total_words,
      COUNT(wp.word_id)::int AS learned_words
    FROM public.words w
    LEFT JOIN public.word_progress wp
      ON wp.word_id = w.id
     AND wp.user_id = v_uid
     AND COALESCE(wp.level, 0) > 0
    WHERE w.topic_id = p_topic_id
  )
  SELECT CASE
    WHEN NOT EXISTS (SELECT 1 FROM public.tests WHERE topic_id = p_topic_id) THEN NULL
    ELSE jsonb_build_object(
      'tests', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', tr.id,
        'name', tr.name,
        'testOrder', tr.test_order,
        'isPro', COALESCE(tr.is_pro, false),
        'passages', tr.passages
      ) ORDER BY tr.test_order NULLS LAST FROM test_rows tr), '[]'::jsonb),
      'unlinkedWords', '[]'::jsonb,
      'totalWords', (SELECT total_words FROM topic_stats),
      'learnedWords', (SELECT learned_words FROM topic_stats),
      'progress', CASE
        WHEN (SELECT total_words FROM topic_stats) > 0
          THEN ROUND((SELECT learned_words FROM topic_stats) * 100.0 / (SELECT total_words FROM topic_stats))::int
        ELSE 0
      END
    )
  END INTO v_result;

  RETURN v_result;
END;
$hivocab$;

-- --------------------------------------------------------------------------
-- Vocabulary page and stats: aggregate/count in PostgreSQL, never download
-- the complete word_progress table to the browser.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_vocabulary_page(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 50,
  p_search text DEFAULT '',
  p_level_filter integer DEFAULT NULL,
  p_topic_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  topic_id uuid,
  word text,
  pos text,
  phonetic text,
  meaning text,
  example_sentence text,
  topic_name text,
  level integer,
  next_review_at timestamptz,
  last_reviewed_at timestamptz,
  review_count integer,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $hivocab$
  SELECT
    w.id,
    w.topic_id,
    w.word,
    w.pos,
    w.phonetic,
    w.meaning,
    w.example_sentence,
    t.name AS topic_name,
    COALESCE(wp.level, 0)::integer AS level,
    wp.next_review_at,
    wp.last_reviewed_at,
    COALESCE(wp.review_count, 0)::integer AS review_count,
    COUNT(*) OVER()::bigint AS total_count
  FROM public.words w
  JOIN public.topics t ON t.id = w.topic_id
  LEFT JOIN public.word_progress wp
    ON wp.word_id = w.id
   AND wp.user_id = auth.uid()
  WHERE auth.uid() IS NOT NULL
    AND (wp.id IS NOT NULL OR (t.user_id = auth.uid() AND t.name ILIKE '%Sổ tay từ vựng%'))
    AND (
      COALESCE(BTRIM(p_search), '') = ''
      OR w.word ILIKE '%' || BTRIM(p_search) || '%'
      OR w.meaning ILIKE '%' || BTRIM(p_search) || '%'
    )
    AND (
      p_level_filter IS NULL
      OR (p_level_filter = -1 AND wp.next_review_at <= NOW())
      OR (p_level_filter >= 0 AND COALESCE(wp.level, 0) = p_level_filter)
    )
    AND (p_topic_id IS NULL OR w.topic_id = p_topic_id)
  ORDER BY COALESCE(wp.last_reviewed_at, w.created_at) DESC
  LIMIT LEAST(GREATEST(p_page_size, 1), 100)
  OFFSET (GREATEST(p_page, 1) - 1) * LEAST(GREATEST(p_page_size, 1), 100);
$hivocab$;

CREATE OR REPLACE FUNCTION public.get_learned_vocab_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $hivocab$
  SELECT jsonb_build_object(
    'total', COUNT(*)::int,
    'due', COUNT(*) FILTER (WHERE next_review_at IS NULL OR next_review_at <= NOW())::int,
    'learning', COUNT(*) FILTER (WHERE COALESCE(level, 0) < 4)::int,
    'mastered', COUNT(*) FILTER (WHERE COALESCE(level, 0) >= 4)::int,
    'memoryLevels', jsonb_build_object(
      'lv0', COUNT(*) FILTER (WHERE COALESCE(level, 0) = 0)::int,
      'lv1', COUNT(*) FILTER (WHERE level = 1)::int,
      'lv2', COUNT(*) FILTER (WHERE level = 2)::int,
      'lv3', COUNT(*) FILTER (WHERE level = 3)::int,
      'lv4', COUNT(*) FILTER (WHERE level = 4)::int,
      'lv5', COUNT(*) FILTER (WHERE level = 5)::int
    )
  )
  FROM public.word_progress
  WHERE user_id = auth.uid();
$hivocab$;

-- --------------------------------------------------------------------------
-- Atomic writes: topic deletion, topic cloning and SRS review.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.delete_topic_cascade(p_topic_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $hivocab$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.topics
    WHERE id = p_topic_id AND (user_id = v_uid OR public.is_admin())
  ) THEN
    RAISE EXCEPTION 'Not allowed to delete this topic';
  END IF;

  DELETE FROM public.topic_comments WHERE topic_id = p_topic_id;
  DELETE FROM public.topic_likes WHERE topic_id = p_topic_id;
  DELETE FROM public.word_progress WHERE word_id IN (SELECT id FROM public.words WHERE topic_id = p_topic_id);
  DELETE FROM public.words WHERE topic_id = p_topic_id;
  DELETE FROM public.passages WHERE topic_id = p_topic_id;
  DELETE FROM public.tests WHERE topic_id = p_topic_id;
  DELETE FROM public.topics WHERE id = p_topic_id;
  RETURN true;
END;
$hivocab$;

CREATE OR REPLACE FUNCTION public.clone_public_topic(
  target_topic_id uuid,
  target_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $hivocab$
DECLARE
  v_uid uuid := auth.uid();
  v_source public.topics%ROWTYPE;
  v_new_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF target_user_id IS NOT NULL AND target_user_id <> v_uid THEN
    RAISE EXCEPTION 'Cannot clone for another user';
  END IF;

  SELECT * INTO v_source
  FROM public.topics
  WHERE id = target_topic_id
    AND (is_public = true OR user_id = v_uid OR public.is_admin());

  IF NOT FOUND THEN RAISE EXCEPTION 'Source topic not found or not public'; END IF;

  INSERT INTO public.topics (user_id, name, icon, category, description, is_public)
  VALUES (v_uid, v_source.name || ' (Bản sao)', COALESCE(v_source.icon, 'folder'), 'personal', v_source.description, false)
  RETURNING id INTO v_new_id;

  INSERT INTO public.words (topic_id, passage_id, word, pos, phonetic, meaning, example_sentence, image_url, lesson_name, lesson_order, word_order)
  SELECT v_new_id, NULL, word, pos, phonetic, meaning, example_sentence, image_url, lesson_name, lesson_order, word_order
  FROM public.words
  WHERE topic_id = target_topic_id;

  UPDATE public.topics
  SET clone_count = COALESCE(clone_count, 0) + 1
  WHERE id = target_topic_id;

  RETURN v_new_id;
END;
$hivocab$;

CREATE OR REPLACE FUNCTION public.review_word(
  p_word_id uuid,
  p_rating text,
  p_session_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $hivocab$
DECLARE
  v_uid uuid := auth.uid();
  v_current_level integer := 0;
  v_review_count integer := 0;
  v_new_level integer;
  v_days integer;
  v_next timestamptz;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.words w
    JOIN public.topics t ON t.id = w.topic_id
    WHERE w.id = p_word_id
      AND (t.user_id IS NULL OR t.is_public = true OR t.user_id = v_uid OR public.is_admin())
  ) THEN RAISE EXCEPTION 'Word not found or not accessible'; END IF;
  -- The learning hook calls the middle rating "good"; "normal" is kept for
  -- older callers that used the previous service API.
  IF p_rating NOT IN ('easy', 'hard', 'good', 'normal') THEN RAISE EXCEPTION 'Invalid review rating'; END IF;

  -- Lock the logical user/word pair too. A first review has no row for
  -- SELECT ... FOR UPDATE to lock, so this prevents two concurrent inserts
  -- from both calculating review_count from zero.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text || ':' || p_word_id::text, 0));

  SELECT COALESCE(level, 0), COALESCE(review_count, 0)
    INTO v_current_level, v_review_count
  FROM public.word_progress
  WHERE user_id = v_uid AND word_id = p_word_id
  FOR UPDATE;

  IF v_current_level = 0 THEN v_new_level := 1;
  ELSIF p_rating = 'easy' THEN v_new_level := LEAST(v_current_level + 1, 5);
  ELSIF p_rating = 'hard' THEN v_new_level := GREATEST(v_current_level - 1, 1);
  ELSE v_new_level := v_current_level;
  END IF;

  v_days := CASE v_new_level
    WHEN 1 THEN 0
    WHEN 2 THEN 0
    WHEN 3 THEN 1
    WHEN 4 THEN 5 + FLOOR(RANDOM() * 3)::int
    WHEN 5 THEN 15 + FLOOR(RANDOM() * 16)::int
    ELSE 0
  END;
  v_next := CASE v_new_level WHEN 1 THEN NOW() + INTERVAL '1 hour' WHEN 2 THEN NOW() + INTERVAL '8 hours' ELSE NOW() + make_interval(days => v_days) END;

  INSERT INTO public.word_progress (user_id, word_id, level, next_review_at, last_reviewed_at, review_count)
  VALUES (v_uid, p_word_id, v_new_level, v_next, NOW(), v_review_count + 1)
  ON CONFLICT (user_id, word_id) DO UPDATE SET
    level = EXCLUDED.level,
    next_review_at = EXCLUDED.next_review_at,
    last_reviewed_at = EXCLUDED.last_reviewed_at,
    review_count = EXCLUDED.review_count;

  INSERT INTO public.study_sessions (user_id, session_date, words_reviewed)
  VALUES (v_uid, COALESCE(p_session_date, CURRENT_DATE), 1)
  ON CONFLICT (user_id, session_date)
  DO UPDATE SET words_reviewed = public.study_sessions.words_reviewed + 1;

  RETURN jsonb_build_object(
    'newLevel', v_new_level,
    'nextReviewAt', v_next,
    'reviewCount', v_review_count + 1,
    'intervalLabel', CASE v_new_level WHEN 1 THEN '1 giờ' WHEN 2 THEN '8 giờ' WHEN 3 THEN '24 giờ' WHEN 4 THEN '5–7 ngày' WHEN 5 THEN '15–30 ngày' ELSE 'N/A' END
  );
END;
$hivocab$;

CREATE OR REPLACE FUNCTION public.review_word_to_level(
  p_word_id uuid,
  p_target_level integer,
  p_session_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $hivocab$
DECLARE
  v_uid uuid := auth.uid();
  v_level integer := LEAST(GREATEST(COALESCE(p_target_level, 1), 1), 5);
  v_count integer := 0;
  v_next timestamptz;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.words w
    JOIN public.topics t ON t.id = w.topic_id
    WHERE w.id = p_word_id
      AND (t.user_id IS NULL OR t.is_public = true OR t.user_id = v_uid OR public.is_admin())
  ) THEN RAISE EXCEPTION 'Word not found or not accessible'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text || ':' || p_word_id::text, 0));

  SELECT COALESCE(review_count, 0) INTO v_count
  FROM public.word_progress
  WHERE user_id = v_uid AND word_id = p_word_id
  FOR UPDATE;

  v_next := CASE v_level
    WHEN 1 THEN NOW() + INTERVAL '1 hour'
    WHEN 2 THEN NOW() + INTERVAL '8 hours'
    WHEN 3 THEN NOW() + INTERVAL '1 day'
    WHEN 4 THEN NOW() + make_interval(days => 5 + FLOOR(RANDOM() * 3)::int)
    ELSE NOW() + make_interval(days => 15 + FLOOR(RANDOM() * 16)::int)
  END;

  INSERT INTO public.word_progress (user_id, word_id, level, next_review_at, last_reviewed_at, review_count)
  VALUES (v_uid, p_word_id, v_level, v_next, NOW(), v_count + 1)
  ON CONFLICT (user_id, word_id) DO UPDATE SET
    level = EXCLUDED.level,
    next_review_at = EXCLUDED.next_review_at,
    last_reviewed_at = EXCLUDED.last_reviewed_at,
    review_count = EXCLUDED.review_count;

  INSERT INTO public.study_sessions (user_id, session_date, words_reviewed)
  VALUES (v_uid, COALESCE(p_session_date, CURRENT_DATE), 1)
  ON CONFLICT (user_id, session_date)
  DO UPDATE SET words_reviewed = public.study_sessions.words_reviewed + 1;

  RETURN jsonb_build_object(
    'newLevel', v_level,
    'nextReviewAt', v_next,
    'reviewCount', v_count + 1,
    'intervalLabel', CASE v_level WHEN 1 THEN '1 giờ' WHEN 2 THEN '8 giờ' WHEN 3 THEN '24 giờ' WHEN 4 THEN '5–7 ngày' WHEN 5 THEN '15–30 ngày' ELSE 'N/A' END
  );
END;
$hivocab$;

REVOKE ALL ON FUNCTION public.get_cam_hierarchy(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_vocabulary_page(integer, integer, text, integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_learned_vocab_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_topic_cascade(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clone_public_topic(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_word(uuid, text, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_word_to_level(uuid, integer, date) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_cam_hierarchy(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_vocabulary_page(integer, integer, text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_learned_vocab_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_topic_cascade(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clone_public_topic(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_word(uuid, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_word_to_level(uuid, integer, date) TO authenticated;
