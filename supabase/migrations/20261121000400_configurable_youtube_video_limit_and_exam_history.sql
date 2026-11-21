-- 1. Configurable per-account YouTube video upload limit in system_settings (default 5)
-- 2. Per-user THPT / Chuyen de exam attempt history table (user_exam_attempts)

INSERT INTO public.system_settings (key, value, description)
VALUES (
  'user_youtube_video_limit',
  '5',
  'Giới hạn số video YouTube cá nhân tối đa mỗi tài khoản trong Shadowing & Dictation Studio'
)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_user_youtube_video_limit()
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_raw text;
  v_limit integer := 5;
BEGIN
  SELECT btrim(value) INTO v_raw
  FROM public.system_settings
  WHERE key = 'user_youtube_video_limit'
  LIMIT 1;

  IF v_raw IS NOT NULL AND v_raw ~ '^\d+$' THEN
    v_limit := LEAST(100, GREATEST(1, v_raw::integer));
  END IF;

  RETURN v_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_user_youtube_video_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_count integer;
  v_limit integer;
BEGIN
  IF v_uid IS NULL OR NEW.user_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Vui lòng đăng nhập để thêm video YouTube cá nhân.' USING ERRCODE = 'P0001';
  END IF;

  v_limit := public.get_user_youtube_video_limit();

  PERFORM pg_advisory_xact_lock(hashtext('user_youtube_videos:' || v_uid::text));

  SELECT count(*)::int INTO v_count
  FROM public.user_youtube_videos
  WHERE user_id = v_uid;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Mỗi tài khoản chỉ được thêm tối đa % video YouTube cá nhân. Hãy xóa bớt video cũ để thêm video mới.', v_limit
      USING ERRCODE = 'P0001';
  END IF;

  NEW.created_at := COALESCE(NEW.created_at, now());
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

CREATE TABLE IF NOT EXISTS public.user_exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id text NOT NULL,
  exam_title text NOT NULL,
  is_exercise boolean NOT NULL DEFAULT false,
  score numeric(5,2) NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  percentage integer NOT NULL DEFAULT 0,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  duration_minutes integer NOT NULL DEFAULT 50,
  details jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_user_exam_submitted
  ON public.user_exam_attempts (user_id, exam_id, submitted_at DESC);

ALTER TABLE public.user_exam_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_exam_attempts' AND policyname = 'user_exam_attempts_select_own'
  ) THEN
    CREATE POLICY user_exam_attempts_select_own
      ON public.user_exam_attempts
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_exam_attempts' AND policyname = 'user_exam_attempts_insert_own'
  ) THEN
    CREATE POLICY user_exam_attempts_insert_own
      ON public.user_exam_attempts
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_exam_attempts' AND policyname = 'user_exam_attempts_delete_own'
  ) THEN
    CREATE POLICY user_exam_attempts_delete_own
      ON public.user_exam_attempts
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;
