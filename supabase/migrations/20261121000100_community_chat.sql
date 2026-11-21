-- Community Chat table, RLS, integrity/rate-limit trigger, and Realtime publication

CREATE TABLE IF NOT EXISTS public.community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL DEFAULT 'general' CHECK (channel_id IN ('general', 'ielts', 'thpt', 'decks')),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_avatar text,
  author_is_pro boolean NOT NULL DEFAULT false,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 600),
  attached_topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_messages_channel_created
  ON public.community_messages (channel_id, created_at DESC)
  WHERE is_deleted = false;

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_messages_select_public ON public.community_messages;
CREATE POLICY community_messages_select_public
  ON public.community_messages
  FOR SELECT
  TO public
  USING (is_deleted = false);

DROP POLICY IF EXISTS community_messages_insert_own ON public.community_messages;
CREATE POLICY community_messages_insert_own
  ON public.community_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS community_messages_update_own_or_admin ON public.community_messages;
CREATE POLICY community_messages_update_own_or_admin
  ON public.community_messages
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS community_messages_delete_own_or_admin ON public.community_messages;
CREATE POLICY community_messages_delete_own_or_admin
  ON public.community_messages
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.enforce_community_message_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_profile_name text;
  v_recent_count integer;
  v_dup_exists boolean;
BEGIN
  IF v_uid IS NULL OR NEW.user_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Authentication required to send community chat messages' USING ERRCODE = 'P0001';
  END IF;

  NEW.content := btrim(COALESCE(NEW.content, ''));
  IF char_length(NEW.content) < 1 OR char_length(NEW.content) > 600 THEN
    RAISE EXCEPTION 'Nội dung tin nhắn phải từ 1 đến 600 ký tự' USING ERRCODE = 'P0001';
  END IF;

  -- Rate limit: max 5 messages per 10 seconds per user
  SELECT count(*)::int INTO v_recent_count
  FROM public.community_messages
  WHERE user_id = v_uid
    AND created_at > (now() - interval '10 seconds');
  IF v_recent_count >= 5 THEN
    RAISE EXCEPTION 'Bạn đang gửi tin nhắn quá nhanh, vui lòng đợi vài giây!' USING ERRCODE = 'P0001';
  END IF;

  -- Duplicate check within 15 seconds
  SELECT EXISTS (
    SELECT 1 FROM public.community_messages
    WHERE user_id = v_uid
      AND is_deleted = false
      AND content = NEW.content
      AND created_at > (now() - interval '15 seconds')
  ) INTO v_dup_exists;
  IF v_dup_exists THEN
    RAISE EXCEPTION 'Bạn vừa gửi nội dung tương tự, vui lòng đợi một chút.' USING ERRCODE = 'P0001';
  END IF;

  SELECT full_name INTO v_profile_name
  FROM public.profiles
  WHERE id = v_uid;

  NEW.author_name := COALESCE(NULLIF(btrim(v_profile_name), ''), NULLIF(btrim(NEW.author_name), ''), 'Học viên HiVocab');
  NEW.author_is_pro := COALESCE(public.is_pro(), false);
  NEW.is_deleted := false;

  IF NEW.attached_topic_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = NEW.attached_topic_id AND t.is_public = true
    ) THEN
      NEW.attached_topic_id := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_enforce_community_message_integrity ON public.community_messages;
CREATE TRIGGER trg_enforce_community_message_integrity
  BEFORE INSERT ON public.community_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_community_message_integrity();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'community_messages'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
  END IF;
END $$;
