-- Fix NULL overwrite in PL/pgSQL SELECT ... INTO when word_progress has no existing row
-- Previously, a missing row set v_review_count, v_lapses, v_state_before, v_s_before, v_d_before to NULL,
-- causing INSERT INTO public.word_progress to fail with:
--   null value in column "review_count" of relation "word_progress" violates not-null constraint

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
  w constant double precision[] := ARRAY[
    0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666,
    0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542
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

  IF NOT FOUND THEN
    v_current_level := 0;
    v_review_count := 0;
    v_s_before := 0;
    v_d_before := 0;
    v_state_before := 0;
    v_lapses := 0;
    v_last_reviewed_at := NULL;
    v_is_first_review := true;
  ELSIF v_current_level > 0 THEN
    v_is_first_review := false;
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

  v_factor := POWER(0.9, -1.0 / w[21]) - 1.0;

  IF v_is_first_review THEN
    v_elapsed_days := 0;
    v_retrievability := 1.0;
    v_s_after := GREATEST(0.01, w[v_grade]);
    v_d_after := LEAST(GREATEST(w[5] - EXP(w[6] * (v_grade - 1)) + 1.0, 1.0), 10.0);

    IF v_grade = 1 THEN
      v_state_after := 1;
      v_lapses := COALESCE(v_lapses, 0) + 1;
    ELSIF v_grade = 2 THEN
      v_state_after := 1;
    ELSE
      v_state_after := 2;
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

    v_d0_easy := LEAST(GREATEST(w[5] - EXP(w[6] * 3.0) + 1.0, 1.0), 10.0);
    v_delta_d := -w[7] * (v_grade - 3.0);
    v_d_prime := v_d_before + v_delta_d * ((10.0 - v_d_before) / 9.0);
    v_d_after := LEAST(GREATEST(w[8] * v_d0_easy + (1.0 - w[8]) * v_d_prime, 1.0), 10.0);

    IF v_grade = 1 THEN
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
      v_state_after := 3;
      v_lapses := COALESCE(v_lapses, 0) + 1;
    ELSIF v_elapsed_days < 1.0 THEN
      v_s_inc := EXP(w[18] * (v_grade - 3.0 + w[19])) * POWER(GREATEST(v_s_before, 0.01), -w[20]);
      IF v_grade >= 3 THEN
        v_s_inc := GREATEST(1.0, v_s_inc);
      END IF;
      v_s_after := LEAST(GREATEST(v_s_before * v_s_inc, 0.01), 36500.0);
      v_state_after := 2;
    ELSE
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
    user_id, word_id, level, next_review_at, last_reviewed_at, review_count,
    stability, difficulty, fsrs_state, lapses, elapsed_days, scheduled_days
  )
  VALUES (
    v_uid,
    p_word_id,
    v_new_level,
    v_next,
    NOW(),
    COALESCE(v_review_count, 0) + 1,
    ROUND(v_s_after::numeric, 4)::double precision,
    ROUND(v_d_after::numeric, 4)::double precision,
    v_state_after,
    COALESCE(v_lapses, 0),
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
    user_id, word_id, rating, state_before, state_after,
    stability_before, difficulty_before, stability_after, difficulty_after,
    retrievability, elapsed_days, scheduled_days, reviewed_at
  )
  VALUES (
    v_uid,
    p_word_id,
    v_grade,
    COALESCE(v_state_before, 0),
    v_state_after,
    ROUND(COALESCE(v_s_before, 0)::numeric, 4)::double precision,
    ROUND(COALESCE(v_d_before, 0)::numeric, 4)::double precision,
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
    'reviewCount', COALESCE(v_review_count, 0) + 1,
    'stability', ROUND(v_s_after::numeric, 4),
    'difficulty', ROUND(v_d_after::numeric, 4),
    'retrievability', ROUND(v_retrievability::numeric, 4),
    'state', v_state_after,
    'lapses', COALESCE(v_lapses, 0),
    'elapsedDays', ROUND(v_elapsed_days::numeric, 4),
    'scheduledDays', ROUND(v_scheduled_days::numeric, 4),
    'grade', v_grade,
    'rating', v_rating_key,
    'intervalLabel', v_interval_label
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

  IF NOT FOUND OR v_count IS NULL THEN
    v_count := 0;
  END IF;

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
    v_uid, p_word_id, v_level, v_next, NOW(), COALESCE(v_count, 0) + 1,
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
    'reviewCount', COALESCE(v_count, 0) + 1,
    'stability', v_stability,
    'difficulty', v_difficulty,
    'state', v_state,
    'intervalLabel', CASE v_level WHEN 1 THEN '1 ngày' WHEN 2 THEN '3.5 ngày' WHEN 3 THEN '8 ngày' WHEN 4 THEN '18 ngày' WHEN 5 THEN '35 ngày' ELSE 'N/A' END
  );
END;
$hivocab$;

REVOKE ALL ON FUNCTION public.review_word(uuid, text, date, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_word_to_level(uuid, integer, date) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.review_word(uuid, text, date, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_word_to_level(uuid, integer, date) TO authenticated;
