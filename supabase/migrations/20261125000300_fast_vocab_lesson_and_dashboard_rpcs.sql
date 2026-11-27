-- Migration 3: High-Speed Vocabulary, Lesson, Topic Bundle, and Dashboard RPCs

CREATE OR REPLACE FUNCTION public.get_topic_summaries()
RETURNS TABLE(
  id uuid,
  name text,
  icon text,
  category text,
  is_pro boolean,
  created_at timestamp with time zone,
  total_words bigint,
  progress integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH user_prog AS (
    SELECT
      w.topic_id,
      SUM(COALESCE(wp.level, 0))::numeric AS level_sum
    FROM public.word_progress wp
    JOIN public.words w ON w.id = wp.word_id
    WHERE (SELECT auth.uid()) IS NOT NULL
      AND wp.user_id = (SELECT auth.uid())
      AND COALESCE(wp.level, 0) > 0
    GROUP BY w.topic_id
  )
  SELECT
    t.id,
    t.name,
    t.icon,
    t.category,
    COALESCE(t.is_pro, false) AS is_pro,
    t.created_at,
    COALESCE(t.word_count, 0)::bigint AS total_words,
    COALESCE(
      ROUND(
        COALESCE(up.level_sum, 0)
        / NULLIF(COALESCE(t.word_count, 0) * 5, 0)
        * 100
      ),
      0
    )::integer AS progress
  FROM public.topics t
  LEFT JOIN user_prog up ON up.topic_id = t.id
  WHERE t.user_id = (SELECT auth.uid()) OR t.user_id IS NULL
  ORDER BY t.created_at ASC;
$function$;

CREATE OR REPLACE FUNCTION public.get_cam_hierarchy(p_topic_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean := COALESCE(public.is_admin(), false);
  v_cached_words int := 0;
  v_result jsonb;
BEGIN
  SELECT COALESCE(t.word_count, 0)::int INTO v_cached_words
  FROM public.topics t
  WHERE t.id = p_topic_id
    AND (t.user_id IS NULL OR t.is_public = true OR t.user_id = v_uid OR v_is_admin);

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tests WHERE topic_id = p_topic_id) THEN
    RETURN NULL;
  END IF;

  WITH user_learned AS (
    SELECT wp.word_id
    FROM public.word_progress wp
    WHERE v_uid IS NOT NULL
      AND wp.user_id = v_uid
      AND COALESCE(wp.level, 0) > 0
  ),
  passage_word_counts AS (
    SELECT
      w.passage_id,
      COUNT(*)::int AS total_words,
      COUNT(ul.word_id)::int AS learned_words
    FROM public.words w
    LEFT JOIN user_learned ul ON ul.word_id = w.id
    WHERE w.topic_id = p_topic_id
      AND w.passage_id IS NOT NULL
    GROUP BY w.passage_id
  ),
  passage_stats AS (
    SELECT
      p.id,
      p.test_id,
      p.passage_number,
      p.title,
      p.title_vi,
      p.topic_label,
      (p.content_en IS NOT NULL OR p.content_vi IS NOT NULL) AS has_content,
      (COALESCE(p.is_pro, false) OR COALESCE(t.is_pro, false) OR COALESCE(top.is_pro, false)) AS is_pro,
      COALESCE(pwc.total_words, 0)::int AS total_words,
      COALESCE(pwc.learned_words, 0)::int AS learned_words
    FROM public.passages p
    JOIN public.tests t ON t.id = p.test_id
    JOIN public.topics top ON top.id = p.topic_id
    LEFT JOIN passage_word_counts pwc ON pwc.passage_id = p.id
    WHERE p.topic_id = p_topic_id
  ),
  test_rows AS (
    SELECT
      t.id,
      t.name,
      t.test_order,
      COALESCE(t.is_pro, false) AS is_pro,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', ps.id,
            'testId', ps.test_id,
            'passageNumber', ps.passage_number,
            'title', COALESCE(ps.title, 'Passage ' || ps.passage_number),
            'titleVi', ps.title_vi,
            'topicLabel', ps.topic_label,
            'contentEn', NULL,
            'contentVi', NULL,
            'hasContent', ps.has_content,
            'isPro', ps.is_pro,
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
      CASE
        WHEN v_cached_words > 0 THEN v_cached_words
        ELSE COALESCE((SELECT SUM(pwc.total_words)::int FROM passage_word_counts pwc), 0)
      END AS total_words,
      CASE
        WHEN v_uid IS NULL THEN 0
        ELSE (
          SELECT COUNT(*)::int
          FROM public.words w
          JOIN user_learned ul ON ul.word_id = w.id
          WHERE w.topic_id = p_topic_id
        )
      END AS learned_words
  )
  SELECT jsonb_build_object(
    'tests', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', tr.id,
          'name', tr.name,
          'testOrder', tr.test_order,
          'isPro', tr.is_pro,
          'passages', tr.passages
        ) ORDER BY tr.test_order NULLS LAST
      ) FROM test_rows tr),
      '[]'::jsonb
    ),
    'unlinkedWords', '[]'::jsonb,
    'totalWords', ts.total_words,
    'learnedWords', ts.learned_words,
    'progress', CASE
      WHEN ts.total_words > 0 THEN ROUND(ts.learned_words * 100.0 / ts.total_words)::int
      ELSE 0
    END
  ) INTO v_result
  FROM topic_stats ts;

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_lessons_in_topic(p_topic_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean := COALESCE(public.is_admin(), false);
  v_has_named boolean := false;
  v_result jsonb := '[]'::jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.topics t
    WHERE t.id = p_topic_id
      AND (t.user_id IS NULL OR t.is_public = true OR t.user_id = v_uid OR v_is_admin)
  ) THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.words w
    WHERE w.topic_id = p_topic_id
      AND w.lesson_name IS NOT NULL
      AND w.lesson_order IS NOT NULL
  ) INTO v_has_named;

  IF v_has_named THEN
    WITH user_prog AS (
      SELECT wp.word_id, COALESCE(wp.level, 0)::int AS level
      FROM public.word_progress wp
      WHERE v_uid IS NOT NULL AND wp.user_id = v_uid
    ),
    named_groups AS (
      SELECT
        w.lesson_order::int AS idx,
        MIN(w.lesson_name) AS name,
        COUNT(*)::int AS total_words,
        COUNT(*) FILTER (WHERE COALESCE(up.level, 0) > 0)::int AS learned_words,
        COUNT(*) FILTER (WHERE COALESCE(up.level, 0) >= 4)::int AS mastered_count,
        COALESCE(SUM(COALESCE(up.level, 0)), 0)::numeric AS level_sum
      FROM public.words w
      LEFT JOIN user_prog up ON up.word_id = w.id
      WHERE w.topic_id = p_topic_id
        AND w.lesson_name IS NOT NULL
        AND w.lesson_order IS NOT NULL
      GROUP BY w.lesson_order
    ),
    max_ord AS (
      SELECT COALESCE(MAX(idx), -1) + 1 AS next_idx FROM named_groups
    ),
    unassigned_group AS (
      SELECT
        (SELECT next_idx FROM max_ord) AS idx,
        'Từ vựng tự thêm / Bổ sung'::text AS name,
        COUNT(*)::int AS total_words,
        COUNT(*) FILTER (WHERE COALESCE(up.level, 0) > 0)::int AS learned_words,
        COUNT(*) FILTER (WHERE COALESCE(up.level, 0) >= 4)::int AS mastered_count,
        COALESCE(SUM(COALESCE(up.level, 0)), 0)::numeric AS level_sum
      FROM public.words w
      LEFT JOIN user_prog up ON up.word_id = w.id
      WHERE w.topic_id = p_topic_id
        AND (w.lesson_name IS NULL OR w.lesson_order IS NULL)
      HAVING COUNT(*) > 0
    ),
    combined AS (
      SELECT * FROM named_groups
      UNION ALL
      SELECT * FROM unassigned_group
    )
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', 'lesson-' || p_topic_id::text || '-' || c.idx::text,
          'topicId', p_topic_id,
          'index', c.idx,
          'name', c.name,
          'totalWords', c.total_words,
          'learnedWords', c.learned_words,
          'masteredCount', c.mastered_count,
          'progress', ROUND(c.level_sum * 100.0 / NULLIF(c.total_words * 5, 0))::int
        ) ORDER BY c.idx ASC
      ),
      '[]'::jsonb
    ) INTO v_result
    FROM combined c;
  ELSE
    WITH user_prog AS (
      SELECT wp.word_id, COALESCE(wp.level, 0)::int AS level
      FROM public.word_progress wp
      WHERE v_uid IS NOT NULL AND wp.user_id = v_uid
    ),
    numbered AS (
      SELECT
        w.id,
        ((ROW_NUMBER() OVER (
          ORDER BY w.lesson_order ASC NULLS LAST, w.word_order ASC NULLS LAST, w.created_at ASC
        ) - 1) / 50)::int AS idx,
        COALESCE(up.level, 0) AS level
      FROM public.words w
      LEFT JOIN user_prog up ON up.word_id = w.id
      WHERE w.topic_id = p_topic_id
    ),
    grouped AS (
      SELECT
        idx,
        COUNT(*)::int AS total_words,
        COUNT(*) FILTER (WHERE level > 0)::int AS learned_words,
        COUNT(*) FILTER (WHERE level >= 4)::int AS mastered_count,
        COALESCE(SUM(level), 0)::numeric AS level_sum
      FROM numbered
      GROUP BY idx
    )
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', 'lesson-' || p_topic_id::text || '-' || g.idx::text,
          'topicId', p_topic_id,
          'index', g.idx,
          'name', 'Lesson ' || (g.idx + 1)::text,
          'totalWords', g.total_words,
          'learnedWords', g.learned_words,
          'masteredCount', g.mastered_count,
          'progress', ROUND(g.level_sum * 100.0 / NULLIF(g.total_words * 5, 0))::int
        ) ORDER BY g.idx ASC
      ),
      '[]'::jsonb
    ) INTO v_result
    FROM grouped g;
  END IF;

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_topic_detail_bundle(p_topic_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean := COALESCE(public.is_admin(), false);
  v_is_pro boolean := COALESCE(public.is_pro(), false);
  v_topic RECORD;
  v_is_cam boolean := false;
  v_cam jsonb := NULL;
  v_lessons jsonb := '[]'::jsonb;
BEGIN
  SELECT t.id, t.name, t.category, COALESCE(t.is_pro, false) AS is_pro, COALESCE(t.word_count, 0)::int AS word_count
    INTO v_topic
  FROM public.topics t
  WHERE t.id = p_topic_id
    AND (t.user_id IS NULL OR t.is_public = true OR t.user_id = v_uid OR v_is_admin);

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.tests WHERE topic_id = p_topic_id) INTO v_is_cam;

  IF v_is_cam THEN
    v_cam := public.get_cam_hierarchy(p_topic_id);
  ELSE
    v_lessons := public.get_lessons_in_topic(p_topic_id);
  END IF;

  RETURN jsonb_build_object(
    'topic', jsonb_build_object(
      'id', v_topic.id,
      'name', v_topic.name,
      'category', COALESCE(v_topic.category, 'general'),
      'is_pro', v_topic.is_pro,
      'word_count', v_topic.word_count
    ),
    'isProUser', (v_is_pro OR v_is_admin),
    'isCambridge', v_is_cam,
    'camHierarchy', v_cam,
    'lessons', COALESCE(v_lessons, '[]'::jsonb)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_words_in_lesson(p_topic_id uuid, p_lesson_index integer DEFAULT 0)
RETURNS TABLE(
  id uuid,
  word text,
  pos text,
  phonetic text,
  meaning text,
  english_meaning text,
  example_sentence text,
  image_url text,
  lesson_order integer,
  word_order integer,
  passage_id uuid,
  created_at timestamp with time zone,
  level integer,
  next_review_at timestamp with time zone,
  last_reviewed_at timestamp with time zone,
  review_count integer,
  stability double precision,
  difficulty double precision,
  fsrs_state smallint,
  lapses integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean := COALESCE(public.is_admin(), false);
  v_is_pro boolean := COALESCE(public.is_pro(), false);
  v_idx integer := GREATEST(COALESCE(p_lesson_index, 0), 0);
  v_has_named boolean := false;
  v_has_exact_lesson boolean := false;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.topics t
    WHERE t.id = p_topic_id
      AND (v_is_admin OR t.user_id = v_uid OR ((t.user_id IS NULL OR t.is_public = true) AND (NOT COALESCE(t.is_pro, false) OR v_is_pro)))
  ) THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.words w
    WHERE w.topic_id = p_topic_id AND w.lesson_name IS NOT NULL AND w.lesson_order IS NOT NULL
  ) INTO v_has_named;

  IF v_has_named THEN
    SELECT EXISTS (
      SELECT 1 FROM public.words w
      WHERE w.topic_id = p_topic_id AND w.lesson_order = v_idx AND w.lesson_name IS NOT NULL
    ) INTO v_has_exact_lesson;

    IF v_has_exact_lesson THEN
      RETURN QUERY
      SELECT
        w.id, w.word, w.pos, w.phonetic, w.meaning, w.english_meaning,
        w.example_sentence, w.image_url, w.lesson_order, w.word_order, w.passage_id, w.created_at,
        COALESCE(wp.level, 0)::integer AS level,
        wp.next_review_at,
        wp.last_reviewed_at,
        COALESCE(wp.review_count, 0)::integer AS review_count,
        wp.stability,
        wp.difficulty,
        COALESCE(wp.fsrs_state, 0)::smallint AS fsrs_state,
        COALESCE(wp.lapses, 0)::integer AS lapses
      FROM public.words w
      LEFT JOIN public.word_progress wp ON wp.word_id = w.id AND v_uid IS NOT NULL AND wp.user_id = v_uid
      WHERE w.topic_id = p_topic_id
        AND w.lesson_order = v_idx
        AND w.lesson_name IS NOT NULL
      ORDER BY w.word_order ASC NULLS LAST, w.created_at ASC;
    ELSE
      RETURN QUERY
      SELECT
        w.id, w.word, w.pos, w.phonetic, w.meaning, w.english_meaning,
        w.example_sentence, w.image_url, w.lesson_order, w.word_order, w.passage_id, w.created_at,
        COALESCE(wp.level, 0)::integer AS level,
        wp.next_review_at,
        wp.last_reviewed_at,
        COALESCE(wp.review_count, 0)::integer AS review_count,
        wp.stability,
        wp.difficulty,
        COALESCE(wp.fsrs_state, 0)::smallint AS fsrs_state,
        COALESCE(wp.lapses, 0)::integer AS lapses
      FROM public.words w
      LEFT JOIN public.word_progress wp ON wp.word_id = w.id AND v_uid IS NOT NULL AND wp.user_id = v_uid
      WHERE w.topic_id = p_topic_id
        AND (w.lesson_name IS NULL OR w.lesson_order IS NULL)
      ORDER BY w.created_at ASC;
    END IF;
  ELSE
    RETURN QUERY
    SELECT
      w.id, w.word, w.pos, w.phonetic, w.meaning, w.english_meaning,
      w.example_sentence, w.image_url, w.lesson_order, w.word_order, w.passage_id, w.created_at,
      COALESCE(wp.level, 0)::integer AS level,
      wp.next_review_at,
      wp.last_reviewed_at,
      COALESCE(wp.review_count, 0)::integer AS review_count,
      wp.stability,
      wp.difficulty,
      COALESCE(wp.fsrs_state, 0)::smallint AS fsrs_state,
      COALESCE(wp.lapses, 0)::integer AS lapses
    FROM public.words w
    LEFT JOIN public.word_progress wp ON wp.word_id = w.id AND v_uid IS NOT NULL AND wp.user_id = v_uid
    WHERE w.topic_id = p_topic_id
    ORDER BY w.lesson_order ASC NULLS LAST, w.word_order ASC NULLS LAST, w.created_at ASC
    OFFSET (v_idx * 50)
    LIMIT 50;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_words_in_passage(p_passage_id uuid)
RETURNS TABLE(
  id uuid,
  word text,
  pos text,
  phonetic text,
  meaning text,
  english_meaning text,
  example_sentence text,
  image_url text,
  passage_id uuid,
  word_order integer,
  created_at timestamp with time zone,
  level integer,
  next_review_at timestamp with time zone,
  last_reviewed_at timestamp with time zone,
  review_count integer,
  stability double precision,
  difficulty double precision,
  fsrs_state smallint,
  lapses integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean := COALESCE(public.is_admin(), false);
  v_is_pro boolean := COALESCE(public.is_pro(), false);
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.passages p
    JOIN public.topics t ON t.id = p.topic_id
    LEFT JOIN public.tests te ON te.id = p.test_id
    WHERE p.id = p_passage_id
      AND (
        v_is_admin
        OR t.user_id = v_uid
        OR (
          (t.user_id IS NULL OR t.is_public = true)
          AND ((NOT COALESCE(t.is_pro, false) AND NOT COALESCE(p.is_pro, false) AND NOT COALESCE(te.is_pro, false)) OR v_is_pro)
        )
      )
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    w.id, w.word, w.pos, w.phonetic, w.meaning, w.english_meaning,
    w.example_sentence, w.image_url, w.passage_id, w.word_order, w.created_at,
    COALESCE(wp.level, 0)::integer AS level,
    wp.next_review_at,
    wp.last_reviewed_at,
    COALESCE(wp.review_count, 0)::integer AS review_count,
    wp.stability,
    wp.difficulty,
    COALESCE(wp.fsrs_state, 0)::smallint AS fsrs_state,
    COALESCE(wp.lapses, 0)::integer AS lapses
  FROM public.words w
  LEFT JOIN public.word_progress wp ON wp.word_id = w.id AND v_uid IS NOT NULL AND wp.user_id = v_uid
  WHERE w.passage_id = p_passage_id
  ORDER BY w.word_order ASC NULLS LAST, w.created_at ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_vocabulary_page_v3(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 50,
  p_search text DEFAULT ''::text,
  p_level_filter integer DEFAULT NULL::integer,
  p_topic_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  id uuid,
  topic_id uuid,
  word text,
  pos text,
  phonetic text,
  meaning text,
  english_meaning text,
  example_sentence text,
  topic_name text,
  level integer,
  next_review_at timestamp with time zone,
  last_reviewed_at timestamp with time zone,
  review_count integer,
  total_count bigint,
  stability double precision,
  difficulty double precision,
  fsrs_state smallint,
  lapses integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH uid_ctx AS (
    SELECT auth.uid() AS uid
  ),
  candidate_ids AS (
    SELECT wp.word_id AS id
    FROM public.word_progress wp, uid_ctx u
    WHERE u.uid IS NOT NULL AND wp.user_id = u.uid
    UNION
    SELECT w.id
    FROM public.topics t
    JOIN public.words w ON w.topic_id = t.id
    JOIN uid_ctx u ON TRUE
    WHERE u.uid IS NOT NULL
      AND t.user_id = u.uid
      AND t.name ILIKE '%Sổ tay từ vựng%'
  )
  SELECT
    w.id,
    w.topic_id,
    w.word,
    w.pos,
    w.phonetic,
    w.meaning,
    w.english_meaning,
    w.example_sentence,
    t.name AS topic_name,
    COALESCE(wp.level, 0)::integer AS level,
    wp.next_review_at,
    wp.last_reviewed_at,
    COALESCE(wp.review_count, 0)::integer AS review_count,
    COUNT(*) OVER()::bigint AS total_count,
    wp.stability,
    wp.difficulty,
    COALESCE(wp.fsrs_state, 0)::smallint AS fsrs_state,
    COALESCE(wp.lapses, 0)::integer AS lapses
  FROM candidate_ids c
  JOIN public.words w ON w.id = c.id
  JOIN public.topics t ON t.id = w.topic_id
  LEFT JOIN public.word_progress wp
    ON wp.word_id = w.id
   AND wp.user_id = (SELECT uid FROM uid_ctx)
  WHERE (
      COALESCE(BTRIM(p_search), '') = ''
      OR w.word ILIKE '%' || BTRIM(p_search) || '%'
      OR w.meaning ILIKE '%' || BTRIM(p_search) || '%'
      OR w.english_meaning ILIKE '%' || BTRIM(p_search) || '%'
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
$function$;

CREATE OR REPLACE FUNCTION public.get_vocabulary_page_v2(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 50,
  p_search text DEFAULT ''::text,
  p_level_filter integer DEFAULT NULL::integer,
  p_topic_id uuid DEFAULT NULL::uuid
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
  next_review_at timestamp with time zone,
  last_reviewed_at timestamp with time zone,
  review_count integer,
  total_count bigint,
  stability double precision,
  difficulty double precision,
  fsrs_state smallint,
  lapses integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    id, topic_id, word, pos, phonetic, meaning, example_sentence, topic_name,
    level, next_review_at, last_reviewed_at, review_count, total_count,
    stability, difficulty, fsrs_state, lapses
  FROM public.get_vocabulary_page_v3(p_page, p_page_size, p_search, p_level_filter, p_topic_id);
$function$;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH uid_ctx AS (SELECT auth.uid() AS uid),
  prog AS (
    SELECT
      COUNT(*) FILTER (WHERE wp.next_review_at <= NOW())::int AS due_count,
      COUNT(*) FILTER (WHERE COALESCE(wp.level, 0) = 0)::int AS lv0,
      COUNT(*) FILTER (WHERE wp.level = 1)::int AS lv1,
      COUNT(*) FILTER (WHERE wp.level = 2)::int AS lv2,
      COUNT(*) FILTER (WHERE wp.level = 3)::int AS lv3,
      COUNT(*) FILTER (WHERE wp.level = 4)::int AS lv4,
      COUNT(*) FILTER (WHERE wp.level >= 5)::int AS lv5,
      MIN(wp.next_review_at) FILTER (WHERE wp.next_review_at > NOW()) AS next_review_at
    FROM public.word_progress wp, uid_ctx u
    WHERE u.uid IS NOT NULL AND wp.user_id = u.uid
  ),
  sess AS (
    SELECT COALESCE(
      jsonb_agg(s.session_date ORDER BY s.session_date DESC),
      '[]'::jsonb
    ) AS dates
    FROM (
      SELECT ss.session_date
      FROM public.study_sessions ss, uid_ctx u
      WHERE u.uid IS NOT NULL AND ss.user_id = u.uid
      ORDER BY ss.session_date DESC
      LIMIT 365
    ) s
  )
  SELECT jsonb_build_object(
    'wordsDueCount', COALESCE(p.due_count, 0),
    'memoryLevels', jsonb_build_object(
      'lv0', COALESCE(p.lv0, 0),
      'lv1', COALESCE(p.lv1, 0),
      'lv2', COALESCE(p.lv2, 0),
      'lv3', COALESCE(p.lv3, 0),
      'lv4', COALESCE(p.lv4, 0),
      'lv5', COALESCE(p.lv5, 0)
    ),
    'nextReviewAt', p.next_review_at,
    'sessionDates', s.dates
  )
  FROM prog p, sess s;
$function$;

GRANT EXECUTE ON FUNCTION public.get_topic_summaries() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_cam_hierarchy(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_lessons_in_topic(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_topic_detail_bundle(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_words_in_lesson(uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_words_in_passage(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_thpt_exam_summaries() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
