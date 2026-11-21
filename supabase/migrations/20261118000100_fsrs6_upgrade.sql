-- ============================================================================
-- HiVocab Migration: Upgrade Core Spaced Repetition Engine from SM-2 to FSRS-6
-- Migration: 20261118000100_fsrs6_upgrade.sql
-- Reference: https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTEND public.word_progress WITH FSRS-6 DSR STATE COLUMNS
-- ----------------------------------------------------------------------------

ALTER TABLE public.word_progress
  ADD COLUMN IF NOT EXISTS stability double precision,
  ADD COLUMN IF NOT EXISTS difficulty double precision,
  ADD COLUMN IF NOT EXISTS fsrs_state smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lapses integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS elapsed_days double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scheduled_days double precision NOT NULL DEFAULT 0;

-- Backfill existing SM-2 rows into FSRS-6 initial DSR states without losing user progress
UPDATE public.word_progress
SET
  stability = CASE COALESCE(level, 1)
    WHEN 1 THEN 1.0
    WHEN 2 THEN 3.5
    WHEN 3 THEN 8.0
    WHEN 4 THEN 18.0
    WHEN 5 THEN 35.0
    ELSE 1.0
  END,
  difficulty = CASE COALESCE(level, 1)
    WHEN 1 THEN 6.4
    WHEN 2 THEN 5.8
    WHEN 3 THEN 5.2
    WHEN 4 THEN 4.7
    WHEN 5 THEN 4.2
    ELSE 6.4
  END,
  fsrs_state = CASE
    WHEN COALESCE(level, 1) <= 1 THEN 1
    ELSE 2
  END,
  scheduled_days = CASE COALESCE(level, 1)
    WHEN 1 THEN 1.0
    WHEN 2 THEN 3.5
    WHEN 3 THEN 8.0
    WHEN 4 THEN 18.0
    WHEN 5 THEN 35.0
    ELSE 1.0
  END
WHERE stability IS NULL OR difficulty IS NULL;

CREATE INDEX IF NOT EXISTS idx_word_progress_user_level
  ON public.word_progress(user_id, level);

CREATE INDEX IF NOT EXISTS idx_word_progress_user_stability
  ON public.word_progress(user_id, stability);

-- ----------------------------------------------------------------------------
-- 2. CREATE public.word_review_logs FOR FSRS REVLOG & FUTURE OPTIMIZER
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.word_review_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id uuid NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 4),
  state_before smallint NOT NULL DEFAULT 0,
  state_after smallint NOT NULL DEFAULT 2,
  stability_before double precision NOT NULL DEFAULT 0,
  difficulty_before double precision NOT NULL DEFAULT 0,
  stability_after double precision NOT NULL,
  difficulty_after double precision NOT NULL,
  retrievability double precision NOT NULL DEFAULT 1.0,
  elapsed_days double precision NOT NULL DEFAULT 0,
  scheduled_days double precision NOT NULL DEFAULT 0,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_word_review_logs_user_reviewed
  ON public.word_review_logs(user_id, reviewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_word_review_logs_user_word
  ON public.word_review_logs(user_id, word_id);

ALTER TABLE public.word_review_logs ENABLE ROW LEVEL SECURITY;

DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'word_review_logs'
      AND policyname = 'word_review_logs_owner'
  ) THEN
    CREATE POLICY word_review_logs_owner ON public.word_review_logs
      FOR ALL TO authenticated
      USING (user_id = auth.uid() OR public.is_admin())
      WITH CHECK (user_id = auth.uid() OR public.is_admin());
  END IF;
END $policy$;

-- ----------------------------------------------------------------------------
-- 3. FSRS-6 CORE RPC: public.review_word
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.review_word(
  p_word_id uuid,
  p_rating text,
  p_session_date date DEFAULT CURRENT_DATE,
  p_desired_retention double precision DEFAULT 0.9
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $hivocab$
DECLARE
  v_uid uuid := auth.uid();
  -- FSRS-6 21 default weights (w[1]..w[21] in 1-based PostgreSQL array indexing, matching w0..w20)
  w constant double precision[] := ARRAY[
    0.212,   -- w0 (w[1]): S0(Again)
    1.2931,  -- w1 (w[2]): S0(Hard)
    2.3065,  -- w2 (w[3]): S0(Good)
    8.2956,  -- w3 (w[4]): S0(Easy)
    6.4133,  -- w4 (w[5]): D0(1)
    0.8334,  -- w5 (w[6]): D0 exponent
    3.0194,  -- w6 (w[7]): Difficulty delta multiplier
    0.001,   -- w7 (w[8]): Mean reversion weight
    1.8722,  -- w8 (w[9]): Recall stability exponent
    0.1666,  -- w9 (w[10]): Recall stability saturation
    0.796,   -- w10 (w[11]): Recall retrievability sensitivity
    1.4835,  -- w11 (w[12]): Post-lapse stability base
    0.0614,  -- w12 (w[13]): Post-lapse difficulty power
    0.2629,  -- w13 (w[14]): Post-lapse stability power
    1.6483,  -- w14 (w[15]): Post-lapse retrievability sensitivity
    0.6014,  -- w15 (w[16]): Hard penalty (G=2)
    1.8729,  -- w16 (w[17]): Easy bonus (G=4)
    0.5425,  -- w17 (w[18]): Same-day exponent
    0.0912,  -- w18 (w[19]): Same-day grade offset
    0.0658,  -- w19 (w[20]): Same-day stability damping
    0.1542   -- w20 (w[21]): Forgetting curve decay
  ];
  v_grade smallint;
  v_rating_key text;
  v_retention double precision := LEAST(GREATEST(COALESCE(p_desired_retention, 0.9), 0.70), 0.97);
  v_factor double precision;

  v_current_level integer := 0;
  v_review_count integer := 0;
  v_s_before double precision := 0;
  v_d_before double precision := 0;
  v_state_before smallint := 0;
  v_lapses integer := 0;
  v_last_reviewed_at timestamptz := NULL;

  v_is_first_review boolean := true;
  v_elapsed_days double precision := 0;
  v_retrievability double precision := 1.0;
  v_s_after double precision;
  v_d_after double precision;
  v_state_after smallint;
  v_d0_easy double precision;
  v_delta_d double precision;
  v_d_prime double precision;
  v_s_inc double precision;
  v_hard_mult double precision;
  v_easy_mult double precision;

  v_scheduled_days double precision;
  v_interval_seconds double precision;
  v_next timestamptz;
  v_new_level integer;
  v_interval_label text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.words wrd
    JOIN public.topics t ON t.id = wrd.topic_id
    WHERE wrd.id = p_word_id
      AND (t.user_id IS NULL OR t.is_public = true OR t.user_id = v_uid OR public.is_admin())
  ) THEN
    RAISE EXCEPTION 'Word not found or not accessible';
  END IF;

  v_rating_key := LOWER(BTRIM(COALESCE(p_rating, '')));
  IF v_rating_key IN ('again', 'lapse', 'fail', 'forgot', '1') THEN
    v_grade := 1;
    v_rating_key := 'again';
  ELSIF v_rating_key IN ('hard', '2') THEN
    v_grade := 2;
    v_rating_key := 'hard';
  ELSIF v_rating_key IN ('good', 'normal', '3') THEN
    v_grade := 3;
    v_rating_key := 'good';
  ELSIF v_rating_key IN ('easy', '4') THEN
    v_grade := 4;
    v_rating_key := 'easy';
  ELSE
    RAISE EXCEPTION 'Invalid review rating: %', p_rating;
  END IF;

  -- Lock user/word pair to prevent race conditions on concurrent reviews
  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text || ':' || p_word_id::text, 0));

  SELECT
    COALESCE(level, 0),
    COALESCE(review_count, 0),
    COALESCE(stability, 0),
    COALESCE(difficulty, 0),
    COALESCE(fsrs_state, 0),
    COALESCE(lapses, 0),
    last_reviewed_at
  INTO
    v_current_level,
    v_review_count,
    v_s_before,
    v_d_before,
    v_state_before,
    v_lapses,
    v_last_reviewed_at
  FROM public.word_progress
  WHERE user_id = v_uid AND word_id = p_word_id
  FOR UPDATE;

  IF FOUND AND v_current_level > 0 THEN
    v_is_first_review := false;
    -- Fallback migration if stability or difficulty were not populated
    IF v_s_before <= 0 OR v_d_before <= 0 THEN
      v_s_before := CASE v_current_level
        WHEN 1 THEN 1.0
        WHEN 2 THEN 3.5
        WHEN 3 THEN 8.0
        WHEN 4 THEN 18.0
        ELSE 35.0
      END;
      v_d_before := CASE v_current_level
        WHEN 1 THEN 6.4
        WHEN 2 THEN 5.8
        WHEN 3 THEN 5.2
        WHEN 4 THEN 4.7
        ELSE 4.2
      END;
      v_state_before := CASE WHEN v_current_level <= 1 THEN 1 ELSE 2 END;
    END IF;
  END IF;

  -- Forgetting curve factor = 0.9^(-1 / w20) - 1
  v_factor := POWER(0.9, -1.0 / w[21]) - 1.0;

  IF v_is_first_review THEN
    v_elapsed_days := 0;
    v_retrievability := 1.0;
    v_s_after := GREATEST(0.01, w[v_grade]);
    v_d_after := LEAST(GREATEST(w[5] - EXP(w[6] * (v_grade - 1)) + 1.0, 1.0), 10.0);

    IF v_grade = 1 THEN
      v_state_after := 1; -- Learning
      v_lapses := v_lapses + 1;
    ELSIF v_grade = 2 THEN
      v_state_after := 1; -- Learning
    ELSE
      v_state_after := 2; -- Review
    END IF;
  ELSE
    IF v_last_reviewed_at IS NOT NULL THEN
      v_elapsed_days := GREATEST(0.0, EXTRACT(EPOCH FROM (NOW() - v_last_reviewed_at)) / 86400.0);
    ELSE
      v_elapsed_days := GREATEST(1.0, v_s_before);
    END IF;

    IF v_elapsed_days <= 0 THEN
      v_retrievability := 1.0;
    ELSE
      v_retrievability := LEAST(GREATEST(POWER(1.0 + (v_factor * v_elapsed_days) / GREATEST(v_s_before, 0.01), -w[21]), 0.0001), 1.0);
    END IF;

    -- Next Difficulty D'' with Linear Damping & Mean Reversion toward D0(4)
    v_d0_easy := LEAST(GREATEST(w[5] - EXP(w[6] * 3.0) + 1.0, 1.0), 10.0);
    v_delta_d := -w[7] * (v_grade - 3.0);
    v_d_prime := v_d_before + v_delta_d * ((10.0 - v_d_before) / 9.0);
    v_d_after := LEAST(GREATEST(w[8] * v_d0_easy + (1.0 - w[8]) * v_d_prime, 1.0), 10.0);

    IF v_grade = 1 THEN
      -- Post-lapse stability S'_f
      v_s_after := LEAST(
        v_s_before,
        GREATEST(
          0.01,
          w[12]
          * POWER(v_d_before, -w[13])
          * (POWER(v_s_before + 1.0, w[14]) - 1.0)
          * EXP(w[15] * (1.0 - v_retrievability))
        )
      );
      v_state_after := 3; -- Relearning
      v_lapses := v_lapses + 1;
    ELSIF v_elapsed_days < 1.0 THEN
      -- Same-day short-term stability S'
      v_s_inc := EXP(w[18] * (v_grade - 3.0 + w[19])) * POWER(GREATEST(v_s_before, 0.01), -w[20]);
      IF v_grade >= 3 THEN
        v_s_inc := GREATEST(1.0, v_s_inc);
      END IF;
      v_s_after := LEAST(GREATEST(v_s_before * v_s_inc, 0.01), 36500.0);
      v_state_after := 2;
    ELSE
      -- Long-term recall stability S'_r
      v_hard_mult := CASE WHEN v_grade = 2 THEN w[16] ELSE 1.0 END;
      v_easy_mult := CASE WHEN v_grade = 4 THEN w[17] ELSE 1.0 END;
      v_s_inc := 1.0 +
        EXP(w[9])
        * (11.0 - v_d_before)
        * POWER(GREATEST(v_s_before, 0.01), -w[10])
        * (EXP(w[11] * (1.0 - v_retrievability)) - 1.0)
        * v_hard_mult
        * v_easy_mult;
      v_s_after := LEAST(GREATEST(v_s_before * GREATEST(1.0, v_s_inc), 0.01), 36500.0);
      v_state_after := 2;
    END IF;
  END IF;

  -- Compute optimal interval I(r, S) in days (capped at 365 days)
  v_scheduled_days := LEAST(
    GREATEST((v_s_after / v_factor) * (POWER(v_retention, -1.0 / w[21]) - 1.0), 0.01),
    365.0
  );

  IF v_grade = 1 THEN
    v_scheduled_days := LEAST(GREATEST(v_s_after, 15.0 / 1440.0), 0.5);
  ELSIF v_is_first_review AND v_grade = 2 THEN
    v_scheduled_days := LEAST(GREATEST(v_scheduled_days, 0.25), 1.5);
  END IF;

  v_interval_seconds := GREATEST(900.0, ROUND(v_scheduled_days * 86400.0));
  v_next := NOW() + make_interval(secs => v_interval_seconds);

  -- Map FSRS Stability & State to UI Memory Level (1..5)
  IF v_state_after = 3 OR v_s_after < 2.5 THEN
    v_new_level := 1;
  ELSIF v_s_after < 6.0 THEN
    v_new_level := 2;
  ELSIF v_s_after < 15.0 THEN
    v_new_level := 3;
  ELSIF v_s_after < 30.0 THEN
    v_new_level := 4;
  ELSE
    v_new_level := 5;
  END IF;

  -- Friendly Vietnamese interval label
  IF ROUND(v_scheduled_days * 1440.0) < 60 THEN
    v_interval_label := GREATEST(1, ROUND(v_scheduled_days * 1440.0)::int)::text || ' phút';
  ELSIF ROUND(v_scheduled_days * 24.0) < 24 THEN
    v_interval_label := ROUND(v_scheduled_days * 24.0)::int::text || ' giờ';
  ELSIF ROUND(v_scheduled_days) < 30 THEN
    v_interval_label := ROUND(v_scheduled_days)::int::text || ' ngày';
  ELSE
    v_interval_label := ROUND((v_scheduled_days / 30.0)::numeric, 1)::text || ' tháng';
  END IF;

  INSERT INTO public.word_progress (
    user_id,
    word_id,
    level,
    next_review_at,
    last_reviewed_at,
    review_count,
    stability,
    difficulty,
    fsrs_state,
    lapses,
    elapsed_days,
    scheduled_days
  )
  VALUES (
    v_uid,
    p_word_id,
    v_new_level,
    v_next,
    NOW(),
    v_review_count + 1,
    ROUND(v_s_after::numeric, 4)::double precision,
    ROUND(v_d_after::numeric, 4)::double precision,
    v_state_after,
    v_lapses,
    ROUND(v_elapsed_days::numeric, 4)::double precision,
    ROUND(v_scheduled_days::numeric, 4)::double precision
  )
  ON CONFLICT (user_id, word_id) DO UPDATE SET
    level = EXCLUDED.level,
    next_review_at = EXCLUDED.next_review_at,
    last_reviewed_at = EXCLUDED.last_reviewed_at,
    review_count = EXCLUDED.review_count,
    stability = EXCLUDED.stability,
    difficulty = EXCLUDED.difficulty,
    fsrs_state = EXCLUDED.fsrs_state,
    lapses = EXCLUDED.lapses,
    elapsed_days = EXCLUDED.elapsed_days,
    scheduled_days = EXCLUDED.scheduled_days;

  INSERT INTO public.word_review_logs (
    user_id,
    word_id,
    rating,
    state_before,
    state_after,
    stability_before,
    difficulty_before,
    stability_after,
    difficulty_after,
    retrievability,
    elapsed_days,
    scheduled_days,
    reviewed_at
  )
  VALUES (
    v_uid,
    p_word_id,
    v_grade,
    v_state_before,
    v_state_after,
    ROUND(v_s_before::numeric, 4)::double precision,
    ROUND(v_d_before::numeric, 4)::double precision,
    ROUND(v_s_after::numeric, 4)::double precision,
    ROUND(v_d_after::numeric, 4)::double precision,
    ROUND(v_retrievability::numeric, 4)::double precision,
    ROUND(v_elapsed_days::numeric, 4)::double precision,
    ROUND(v_scheduled_days::numeric, 4)::double precision,
    NOW()
  );

  INSERT INTO public.study_sessions (user_id, session_date, words_reviewed)
  VALUES (v_uid, COALESCE(p_session_date, CURRENT_DATE), 1)
  ON CONFLICT (user_id, session_date)
  DO UPDATE SET words_reviewed = public.study_sessions.words_reviewed + 1;

  RETURN jsonb_build_object(
    'newLevel', v_new_level,
    'nextReviewAt', v_next,
    'reviewCount', v_review_count + 1,
    'stability', ROUND(v_s_after::numeric, 4),
    'difficulty', ROUND(v_d_after::numeric, 4),
    'retrievability', ROUND(v_retrievability::numeric, 4),
    'state', v_state_after,
    'lapses', v_lapses,
    'elapsedDays', ROUND(v_elapsed_days::numeric, 4),
    'scheduledDays', ROUND(v_scheduled_days::numeric, 4),
    'grade', v_grade,
    'rating', v_rating_key,
    'intervalLabel', v_interval_label
  );
END;
$hivocab$;

-- ----------------------------------------------------------------------------
-- 4. MANUAL LEVEL OVERRIDE RPC: public.review_word_to_level
-- ----------------------------------------------------------------------------

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
  v_stability double precision;
  v_difficulty double precision;
  v_state smallint;
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

  v_stability := CASE v_level
    WHEN 1 THEN 1.0
    WHEN 2 THEN 3.5
    WHEN 3 THEN 8.0
    WHEN 4 THEN 18.0
    ELSE 35.0
  END;

  v_difficulty := CASE v_level
    WHEN 1 THEN 6.4
    WHEN 2 THEN 5.8
    WHEN 3 THEN 5.2
    WHEN 4 THEN 4.7
    ELSE 4.2
  END;

  v_state := CASE WHEN v_level <= 1 THEN 1 ELSE 2 END;
  v_next := NOW() + make_interval(secs => ROUND(v_stability * 86400.0)::int);

  INSERT INTO public.word_progress (
    user_id, word_id, level, next_review_at, last_reviewed_at, review_count,
    stability, difficulty, fsrs_state, scheduled_days
  )
  VALUES (
    v_uid, p_word_id, v_level, v_next, NOW(), v_count + 1,
    v_stability, v_difficulty, v_state, v_stability
  )
  ON CONFLICT (user_id, word_id) DO UPDATE SET
    level = EXCLUDED.level,
    next_review_at = EXCLUDED.next_review_at,
    last_reviewed_at = EXCLUDED.last_reviewed_at,
    review_count = EXCLUDED.review_count,
    stability = EXCLUDED.stability,
    difficulty = EXCLUDED.difficulty,
    fsrs_state = EXCLUDED.fsrs_state,
    scheduled_days = EXCLUDED.scheduled_days;

  INSERT INTO public.study_sessions (user_id, session_date, words_reviewed)
  VALUES (v_uid, COALESCE(p_session_date, CURRENT_DATE), 1)
  ON CONFLICT (user_id, session_date)
  DO UPDATE SET words_reviewed = public.study_sessions.words_reviewed + 1;

  RETURN jsonb_build_object(
    'newLevel', v_level,
    'nextReviewAt', v_next,
    'reviewCount', v_count + 1,
    'stability', v_stability,
    'difficulty', v_difficulty,
    'state', v_state,
    'intervalLabel', CASE v_level WHEN 1 THEN '1 ngày' WHEN 2 THEN '3.5 ngày' WHEN 3 THEN '8 ngày' WHEN 4 THEN '18 ngày' WHEN 5 THEN '35 ngày' ELSE 'N/A' END
  );
END;
$hivocab$;

-- ----------------------------------------------------------------------------
-- 5. AGGREGATE STATS & VOCABULARY PAGE RPCs WITH FSRS METRICS
-- ----------------------------------------------------------------------------

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
    'avgStability', COALESCE(ROUND(AVG(stability)::numeric, 2), 0),
    'avgDifficulty', COALESCE(ROUND(AVG(difficulty)::numeric, 2), 0),
    'totalLapses', COALESCE(SUM(lapses), 0)::int,
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

CREATE OR REPLACE FUNCTION public.get_vocabulary_page_v2(
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
  total_count bigint,
  stability double precision,
  difficulty double precision,
  fsrs_state smallint,
  lapses integer
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
    COUNT(*) OVER()::bigint AS total_count,
    wp.stability,
    wp.difficulty,
    COALESCE(wp.fsrs_state, 0)::smallint AS fsrs_state,
    COALESCE(wp.lapses, 0)::integer AS lapses
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

REVOKE ALL ON FUNCTION public.review_word(uuid, text, date, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_word_to_level(uuid, integer, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_learned_vocab_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_vocabulary_page_v2(integer, integer, text, integer, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.review_word(uuid, text, date, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_word_to_level(uuid, integer, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_learned_vocab_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vocabulary_page_v2(integer, integer, text, integer, uuid) TO authenticated;
