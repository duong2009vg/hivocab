-- Per-account YouTube custom video library (strictly capped at 5 videos per account)

CREATE TABLE IF NOT EXISTS public.user_youtube_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clip_id text NOT NULL,
  youtube_video_id text NOT NULL CHECK (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 240),
  author text NOT NULL DEFAULT 'YouTube',
  clip_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_youtube_videos_user_video_unique UNIQUE (user_id, youtube_video_id)
);

CREATE INDEX IF NOT EXISTS idx_user_youtube_videos_user_created
  ON public.user_youtube_videos (user_id, created_at DESC);

ALTER TABLE public.user_youtube_videos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_youtube_videos' AND policyname = 'user_youtube_videos_select_own'
  ) THEN
    CREATE POLICY user_youtube_videos_select_own
      ON public.user_youtube_videos
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_youtube_videos' AND policyname = 'user_youtube_videos_insert_own'
  ) THEN
    CREATE POLICY user_youtube_videos_insert_own
      ON public.user_youtube_videos
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_youtube_videos' AND policyname = 'user_youtube_videos_update_own'
  ) THEN
    CREATE POLICY user_youtube_videos_update_own
      ON public.user_youtube_videos
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_youtube_videos' AND policyname = 'user_youtube_videos_delete_own'
  ) THEN
    CREATE POLICY user_youtube_videos_delete_own
      ON public.user_youtube_videos
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_user_youtube_video_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_count integer;
BEGIN
  IF v_uid IS NULL OR NEW.user_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Vui lòng đăng nhập để thêm video YouTube cá nhân.' USING ERRCODE = 'P0001';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('user_youtube_videos:' || v_uid::text));

  SELECT count(*)::int INTO v_count
  FROM public.user_youtube_videos
  WHERE user_id = v_uid;

  IF v_count >= 5 THEN
    RAISE EXCEPTION 'Mỗi tài khoản chỉ được thêm tối đa 5 video YouTube cá nhân. Hãy xóa bớt video cũ để thêm video mới.'
      USING ERRCODE = 'P0001';
  END IF;

  NEW.created_at := COALESCE(NEW.created_at, now());
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.user_youtube_videos'::regclass
      AND tgname = 'trg_enforce_user_youtube_video_limit'
  ) THEN
    CREATE TRIGGER trg_enforce_user_youtube_video_limit
      BEFORE INSERT ON public.user_youtube_videos
      FOR EACH ROW
      EXECUTE FUNCTION public.enforce_user_youtube_video_limit();
  END IF;
END $$;
