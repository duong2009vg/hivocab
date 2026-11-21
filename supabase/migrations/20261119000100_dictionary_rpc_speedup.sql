-- Speed up dictionary lookup & suggestion RPCs from ~5.7s timeout to <15ms using pattern index + SECURITY DEFINER
CREATE INDEX IF NOT EXISTS idx_words_lower_pattern ON public.words (lower(word) text_pattern_ops);

CREATE OR REPLACE FUNCTION public.lookup_dictionary_word(p_word text)
RETURNS TABLE(id uuid, word text, meaning text, pos text, phonetic text, example_sentence text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean text := trim(COALESCE(p_word, ''));
  v_uid uuid := auth.uid();
  v_is_admin boolean := COALESCE(public.is_admin(), false);
  v_is_pro boolean := COALESCE(public.is_pro(), false);
BEGIN
  IF length(v_clean) < 1 OR length(v_clean) > 80 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT w.id, w.word, w.meaning, w.pos, w.phonetic, w.example_sentence
  FROM public.words w
  JOIN public.topics t ON t.id = w.topic_id
  LEFT JOIN public.passages p ON p.id = w.passage_id
  LEFT JOIN public.tests te ON te.id = p.test_id
  WHERE lower(w.word) = lower(v_clean)
    AND (v_is_admin OR t.user_id = v_uid OR t.user_id IS NULL OR t.is_public = true)
    AND (
      v_is_admin
      OR v_is_pro
      OR t.user_id = v_uid
      OR (NOT COALESCE(t.is_pro, false) AND NOT COALESCE(p.is_pro, false) AND NOT COALESCE(te.is_pro, false))
    )
  ORDER BY (w.phonetic IS NOT NULL AND w.example_sentence IS NOT NULL) DESC, w.created_at ASC
  LIMIT 6;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_dictionary_suggestions(p_prefix text)
RETURNS TABLE(word text, meaning text, pos text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean text := trim(COALESCE(p_prefix, ''));
  v_pat text;
  v_uid uuid := auth.uid();
  v_is_admin boolean := COALESCE(public.is_admin(), false);
  v_is_pro boolean := COALESCE(public.is_pro(), false);
BEGIN
  IF length(v_clean) < 2 OR length(v_clean) > 64 THEN
    RETURN;
  END IF;

  v_pat := lower(regexp_replace(v_clean, '([%_\\])', '\\\1', 'g')) || '%';

  RETURN QUERY
  SELECT w.word, w.meaning, w.pos
  FROM public.words w
  JOIN public.topics t ON t.id = w.topic_id
  LEFT JOIN public.passages p ON p.id = w.passage_id
  LEFT JOIN public.tests te ON te.id = p.test_id
  WHERE lower(w.word) LIKE v_pat ESCAPE '\'
    AND (v_is_admin OR t.user_id = v_uid OR t.user_id IS NULL OR t.is_public = true)
    AND (
      v_is_admin
      OR v_is_pro
      OR t.user_id = v_uid
      OR (NOT COALESCE(t.is_pro, false) AND NOT COALESCE(p.is_pro, false) AND NOT COALESCE(te.is_pro, false))
    )
  ORDER BY w.word ASC
  LIMIT 8;
END;
$$;
