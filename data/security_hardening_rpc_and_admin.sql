-- ============================================================
-- HIVOCAB DATABASE SECURITY HARDENING MIGRATION
-- Project: swehdtrqjyklmsefkjdf
-- 1. Secures all SECURITY DEFINER functions with immutable search_path.
-- 2. Enforces is_admin() checks inside bulk_update_words & bulk_update_word_images.
-- 3. Revokes EXECUTE on administrative and data-mutation functions from public and anon.
-- ============================================================

-- 1. HARDEN is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- 2. SECURE bulk_update_words (PREVENT UNAUTHORIZED OVERWRITES)
CREATE OR REPLACE FUNCTION public.bulk_update_words(p_words jsonb)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_updated int;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.';
  END IF;

  WITH data AS (
    SELECT 
      (x->>'id')::uuid AS id,
      x->>'example_sentence' AS example_sentence,
      x->>'pos' AS pos,
      x->>'phonetic' AS phonetic
    FROM jsonb_array_elements(p_words) AS x
  ),
  up AS (
    UPDATE public.words w
    SET 
      example_sentence = d.example_sentence,
      pos = d.pos,
      phonetic = d.phonetic
    FROM data d
    WHERE w.id = d.id
    RETURNING 1
  )
  SELECT count(*) INTO v_updated FROM up;
  RETURN v_updated;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bulk_update_words(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bulk_update_words(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.bulk_update_words(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_update_words(jsonb) TO service_role;

-- 3. SECURE bulk_update_word_images (PREVENT UNAUTHORIZED IMAGE HIJACKING)
CREATE OR REPLACE FUNCTION public.bulk_update_word_images(updates jsonb)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    r record;
    cnt int := 0;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    FOR r IN SELECT * FROM jsonb_to_recordset(updates) AS (id uuid, image_url text)
    LOOP
        UPDATE public.words SET image_url = r.image_url WHERE id = r.id;
        cnt := cnt + 1;
    END LOOP;
    RETURN cnt;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bulk_update_word_images(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bulk_update_word_images(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.bulk_update_word_images(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_update_word_images(jsonb) TO service_role;

-- 4. SECURE admin_promote_by_email
CREATE OR REPLACE FUNCTION public.admin_promote_by_email(target_email text, new_role text DEFAULT 'admin')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_target_id uuid;
    v_found_email text;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    IF new_role NOT IN ('user', 'admin') THEN
        RAISE EXCEPTION 'Invalid role: must be "user" or "admin".';
    END IF;

    SELECT id, email INTO v_target_id, v_found_email
    FROM public.profiles
    WHERE LOWER(email) = LOWER(TRIM(target_email))
    LIMIT 1;

    IF v_target_id IS NULL THEN
        SELECT id, email INTO v_target_id, v_found_email
        FROM auth.users
        WHERE LOWER(email) = LOWER(TRIM(target_email))
        LIMIT 1;

        IF v_target_id IS NOT NULL THEN
            INSERT INTO public.profiles (id, email, role)
            VALUES (v_target_id, v_found_email, new_role)
            ON CONFLICT (id) DO UPDATE SET role = new_role;
        END IF;
    ELSE
        UPDATE public.profiles
        SET role = new_role
        WHERE id = v_target_id;
    END IF;

    IF v_target_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Không tìm thấy tài khoản "' || target_email || '". Vui lòng chắc chắn người dùng đã đăng ký tài khoản trên HiVocab trước.'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Đã cấp quyền ' || UPPER(new_role) || ' thành công cho tài khoản: ' || v_found_email,
        'user_id', v_target_id,
        'email', v_found_email,
        'role', new_role
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_promote_by_email(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_promote_by_email(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_promote_by_email(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_promote_by_email(text, text) TO service_role;

-- 5. SECURE admin_set_user_role
CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    IF new_role NOT IN ('user', 'admin') THEN
        RAISE EXCEPTION 'Invalid role: must be "user" or "admin".';
    END IF;

    UPDATE public.profiles
    SET role = new_role
    WHERE id = target_user_id;

    RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO service_role;

-- 6. SECURE admin_reset_user_progress
CREATE OR REPLACE FUNCTION public.admin_reset_user_progress(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    DELETE FROM public.word_progress WHERE user_id = target_user_id;
    DELETE FROM public.study_sessions WHERE user_id = target_user_id;

    RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_reset_user_progress(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_reset_user_progress(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_progress(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_progress(uuid) TO service_role;

-- 7. SECURE get_admin_system_analytics
CREATE OR REPLACE FUNCTION public.get_admin_system_analytics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total_users bigint;
    v_active_users_24h bigint;
    v_active_users_7d bigint;
    v_total_words bigint;
    v_total_topics bigint;
    v_total_tests bigint;
    v_total_passages bigint;
    v_total_reviews bigint;
    v_level_distribution json;
    v_top_challenging json;
    v_recent_activity json;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    SELECT COUNT(*) INTO v_total_users FROM public.profiles;

    SELECT COUNT(DISTINCT user_id) INTO v_active_users_24h 
    FROM public.word_progress 
    WHERE last_reviewed_at >= NOW() - INTERVAL '24 hours';

    SELECT COUNT(DISTINCT user_id) INTO v_active_users_7d 
    FROM public.word_progress 
    WHERE last_reviewed_at >= NOW() - INTERVAL '7 days';

    SELECT COUNT(*) INTO v_total_words FROM public.words;
    SELECT COUNT(*) INTO v_total_topics FROM public.topics;
    SELECT COUNT(*) INTO v_total_tests FROM public.tests;
    SELECT COUNT(*) INTO v_total_passages FROM public.passages;

    SELECT COALESCE(SUM(review_count), 0) INTO v_total_reviews FROM public.word_progress;

    SELECT json_agg(t) INTO v_level_distribution
    FROM (
        SELECT level, COUNT(*) AS count
        FROM public.word_progress
        GROUP BY level
        ORDER BY level
    ) t;

    SELECT json_agg(ch) INTO v_top_challenging
    FROM (
        SELECT 
            w.word,
            w.pos,
            w.meaning,
            t.name AS topic_name,
            COUNT(wp.id) AS user_count,
            SUM(wp.review_count) AS total_reviews,
            ROUND(AVG(wp.level), 1) AS avg_level
        FROM public.word_progress wp
        JOIN public.words w ON w.id = wp.word_id
        LEFT JOIN public.topics t ON t.id = w.topic_id
        GROUP BY w.id, w.word, w.pos, w.meaning, t.name
        ORDER BY total_reviews DESC, user_count DESC
        LIMIT 10
    ) ch;

    SELECT json_agg(act) INTO v_recent_activity
    FROM (
        SELECT 
            p.email,
            w.word,
            w.meaning,
            wp.level,
            wp.last_reviewed_at
        FROM public.word_progress wp
        JOIN public.profiles p ON p.id = wp.user_id
        JOIN public.words w ON w.id = wp.word_id
        WHERE wp.last_reviewed_at IS NOT NULL
        ORDER BY wp.last_reviewed_at DESC
        LIMIT 10
    ) act;

    RETURN json_build_object(
        'total_users', COALESCE(v_total_users, 0),
        'active_users_24h', COALESCE(v_active_users_24h, 0),
        'active_users_7d', COALESCE(v_active_users_7d, 0),
        'total_words', COALESCE(v_total_words, 0),
        'total_topics', COALESCE(v_total_topics, 0),
        'total_tests', COALESCE(v_total_tests, 0),
        'total_passages', COALESCE(v_total_passages, 0),
        'total_reviews', COALESCE(v_total_reviews, 0),
        'level_distribution', COALESCE(v_level_distribution, '[]'::json),
        'top_challenging', COALESCE(v_top_challenging, '[]'::json),
        'recent_activity', COALESCE(v_recent_activity, '[]'::json)
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_system_analytics() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_system_analytics() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_system_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_system_analytics() TO service_role;

-- 8. SECURE get_admin_users_stats
CREATE OR REPLACE FUNCTION public.get_admin_users_stats()
RETURNS TABLE (
    user_id uuid,
    email text,
    role text,
    created_at timestamptz,
    last_sign_in_at timestamptz,
    total_words_learning bigint,
    mastered_words bigint,
    total_reviews bigint,
    last_reviewed_at timestamptz,
    total_sessions bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    RETURN QUERY
    SELECT 
        p.id AS user_id,
        p.email::text,
        p.role::text,
        p.created_at,
        u.last_sign_in_at,
        COALESCE(COUNT(DISTINCT wp.id), 0)::bigint AS total_words_learning,
        COALESCE(COUNT(DISTINCT CASE WHEN wp.level >= 5 THEN wp.id END), 0)::bigint AS mastered_words,
        COALESCE(SUM(wp.review_count), 0)::bigint AS total_reviews,
        MAX(wp.last_reviewed_at) AS last_reviewed_at,
        COALESCE(COUNT(DISTINCT ss.id), 0)::bigint AS total_sessions
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    LEFT JOIN public.word_progress wp ON wp.user_id = p.id
    LEFT JOIN public.study_sessions ss ON ss.user_id = p.id
    GROUP BY p.id, p.email, p.role, p.created_at, u.last_sign_in_at
    ORDER BY p.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_users_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_users_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_users_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_stats() TO service_role;

-- 9. SECURE get_admin_user_learning_details
CREATE OR REPLACE FUNCTION public.get_admin_user_learning_details(target_user_id uuid)
RETURNS TABLE (
    word_id uuid,
    word text,
    pos text,
    phonetic text,
    meaning text,
    example_sentence text,
    topic_name text,
    level int,
    review_count int,
    next_review_at timestamptz,
    last_reviewed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    RETURN QUERY
    SELECT 
        wp.word_id,
        w.word,
        w.pos,
        w.phonetic,
        w.meaning,
        w.example_sentence,
        COALESCE(t.name, 'Chưa xác định') AS topic_name,
        wp.level,
        wp.review_count,
        wp.next_review_at,
        wp.last_reviewed_at
    FROM public.word_progress wp
    JOIN public.words w ON w.id = wp.word_id
    LEFT JOIN public.topics t ON t.id = w.topic_id
    WHERE wp.user_id = target_user_id
    ORDER BY wp.last_reviewed_at DESC NULLS LAST, wp.level ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_user_learning_details(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_user_learning_details(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_user_learning_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_learning_details(uuid) TO service_role;

-- 10. SECURE handle_new_user & keepalive
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (new.id, new.email, 'user')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.keepalive()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.keepalive_pings
    SET touched_at = NOW()
    WHERE id = 1;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'touched_at', NOW()
    );
END;
$$;
