-- HiVocab performance optimization
-- Run once in Supabase SQL Editor.
-- These functions do not modify vocabulary or SM-2 progress.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_words_topic_created
    ON public.words (topic_id, created_at);

CREATE INDEX IF NOT EXISTS idx_words_topic_lesson_order
    ON public.words (topic_id, lesson_order, word_order);

CREATE INDEX IF NOT EXISTS idx_word_progress_user_word
    ON public.word_progress (user_id, word_id);

CREATE INDEX IF NOT EXISTS idx_word_progress_user_review
    ON public.word_progress (user_id, next_review_at);

CREATE INDEX IF NOT EXISTS idx_topics_user_created
    ON public.topics (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_words_word_trgm
    ON public.words USING gin (word gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_words_meaning_trgm
    ON public.words USING gin (meaning gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.get_topic_summaries()
RETURNS TABLE (
    id uuid,
    name text,
    icon text,
    category text,
    created_at timestamptz,
    total_words bigint,
    progress integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT
        t.id,
        t.name,
        t.icon,
        t.category,
        t.created_at,
        COUNT(w.id)::bigint AS total_words,
        COALESCE(
            ROUND(
                SUM(CASE WHEN wp.user_id = auth.uid() THEN wp.level ELSE 0 END)::numeric
                / NULLIF(COUNT(w.id) * 5, 0)
                * 100
            ),
            0
        )::integer AS progress
    FROM public.topics t
    LEFT JOIN public.words w ON w.topic_id = t.id
    LEFT JOIN public.word_progress wp
        ON wp.word_id = w.id
        AND wp.user_id = auth.uid()
    WHERE t.user_id = auth.uid() OR t.user_id IS NULL
    GROUP BY t.id, t.name, t.icon, t.category, t.created_at
    ORDER BY t.created_at ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_vocabulary_page(
    p_page integer DEFAULT 1,
    p_page_size integer DEFAULT 50,
    p_search text DEFAULT ''
)
RETURNS TABLE (
    id uuid,
    topic_id uuid,
    word text,
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
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT
        w.id,
        w.topic_id,
        w.word,
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
    WHERE (t.user_id = auth.uid() OR t.user_id IS NULL)
      AND (
          COALESCE(BTRIM(p_search), '') = ''
          OR w.word ILIKE '%' || BTRIM(p_search) || '%'
          OR w.meaning ILIKE '%' || BTRIM(p_search) || '%'
      )
    ORDER BY w.created_at ASC
    LIMIT LEAST(GREATEST(p_page_size, 1), 100)
    OFFSET (GREATEST(p_page, 1) - 1) * LEAST(GREATEST(p_page_size, 1), 100);
$$;

GRANT EXECUTE ON FUNCTION public.get_topic_summaries() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_vocabulary_page(integer, integer, text) TO anon, authenticated;
