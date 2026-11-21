-- Curated Shadowing Video catalog stored in Supabase for lazy-loading cues and bulk Admin YouTube imports

CREATE TABLE IF NOT EXISTS public.studio_videos (
  id text PRIMARY KEY,
  youtube_video_id text NOT NULL CHECK (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 300),
  channel_name text NOT NULL DEFAULT 'YouTube',
  author text NOT NULL DEFAULT 'YouTube',
  genre text NOT NULL DEFAULT 'YouTube',
  level text NOT NULL DEFAULT 'B1',
  tags text[] NOT NULL DEFAULT ARRAY['shadowing', 'english']::text[],
  start_seconds integer NOT NULL DEFAULT 0,
  end_seconds integer NOT NULL DEFAULT 0,
  cue_count integer NOT NULL DEFAULT 0,
  cues jsonb NOT NULL DEFAULT '[]'::jsonb,
  caption_status text NOT NULL DEFAULT 'youtube_english_unreviewed',
  translation_status text NOT NULL DEFAULT 'cloud_auto_translation_unreviewed',
  sort_order integer NOT NULL DEFAULT 0,
  is_pro boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT studio_videos_youtube_id_unique UNIQUE (youtube_video_id)
);

CREATE INDEX IF NOT EXISTS idx_studio_videos_published_channel_level
  ON public.studio_videos (is_published, channel_name, level, sort_order, created_at DESC);

ALTER TABLE public.studio_videos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'studio_videos' AND policyname = 'studio_videos_select_published_or_admin'
  ) THEN
    CREATE POLICY studio_videos_select_published_or_admin
      ON public.studio_videos
      FOR SELECT
      TO public
      USING (is_published = true OR public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'studio_videos' AND policyname = 'studio_videos_insert_admin'
  ) THEN
    CREATE POLICY studio_videos_insert_admin
      ON public.studio_videos
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'studio_videos' AND policyname = 'studio_videos_update_admin'
  ) THEN
    CREATE POLICY studio_videos_update_admin
      ON public.studio_videos
      FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'studio_videos' AND policyname = 'studio_videos_delete_admin'
  ) THEN
    CREATE POLICY studio_videos_delete_admin
      ON public.studio_videos
      FOR DELETE
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;
