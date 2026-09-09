-- ============================================================
-- HIVOCAB ADMIN PORTAL V2 DATABASE SETUP & RPC FUNCTIONS
-- Run on Supabase PostgreSQL (Project: swehdtrqjyklmsefkjdf)
-- ============================================================

-- 1. CẤP QUYỀN ĐỌC DỮ LIỆU WORD_PROGRESS & STUDY_SESSIONS CHO ADMIN
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'word_progress' AND policyname = 'word_progress_admin_read'
  ) THEN
    CREATE POLICY "word_progress_admin_read" ON public.word_progress
      FOR SELECT TO authenticated
      USING (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'study_sessions' AND policyname = 'study_sessions_admin_read'
  ) THEN
    CREATE POLICY "study_sessions_admin_read" ON public.study_sessions
      FOR SELECT TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- 2. HÀM LẤY DANH SÁCH TOÀN BỘ NGƯỜI DÙNG KÈM THỐNG KÊ TIẾN ĐỘ HỌC
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
SET search_path = public, auth
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

GRANT EXECUTE ON FUNCTION public.get_admin_users_stats() TO authenticated;

-- 3. HÀM LẤY CHI TIẾT TỪ VỰNG ĐANG HỌC CỦA 1 NGƯỜI DÙNG CỤ THỂ
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
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.get_admin_user_learning_details(uuid) TO authenticated;

-- 4. HÀM LẤY TOÀN BỘ SỐ LIỆU TỔNG QUAN & PHÂN TÍCH HỆ THỐNG
CREATE OR REPLACE FUNCTION public.get_admin_system_analytics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

    -- Đếm tổng user
    SELECT COUNT(*) INTO v_total_users FROM public.profiles;

    -- Active users 24h qua (có reviewed từ hoặc có session)
    SELECT COUNT(DISTINCT user_id) INTO v_active_users_24h 
    FROM public.word_progress 
    WHERE last_reviewed_at >= NOW() - INTERVAL '24 hours';

    -- Active users 7 ngày qua
    SELECT COUNT(DISTINCT user_id) INTO v_active_users_7d 
    FROM public.word_progress 
    WHERE last_reviewed_at >= NOW() - INTERVAL '7 days';

    -- Đếm các thực thể nội dung
    SELECT COUNT(*) INTO v_total_words FROM public.words;
    SELECT COUNT(*) INTO v_total_topics FROM public.topics;
    SELECT COUNT(*) INTO v_total_tests FROM public.tests;
    SELECT COUNT(*) INTO v_total_passages FROM public.passages;

    -- Tổng số lượt ôn tập toàn sàn
    SELECT COALESCE(SUM(review_count), 0) INTO v_total_reviews FROM public.word_progress;

    -- Phân bố cấp độ trí nhớ SRS Level 1 -> 5
    SELECT json_agg(t) INTO v_level_distribution
    FROM (
        SELECT level, COUNT(*) AS count
        FROM public.word_progress
        GROUP BY level
        ORDER BY level
    ) t;

    -- Top 10 từ học sinh hay ôn hoặc gặp khó khăn nhất
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

    -- Hoạt động học gần đây nhất (Recent Activity)
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

GRANT EXECUTE ON FUNCTION public.get_admin_system_analytics() TO authenticated;

-- 5. HÀM RESET TIẾN ĐỘ HỌC CỦA MỘT HỌC VIÊN (DÀNH CHO ADMIN)
CREATE OR REPLACE FUNCTION public.admin_reset_user_progress(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.admin_reset_user_progress(uuid) TO authenticated;

-- 6. HÀM THAY ĐỔI VAI TRÒ NGƯỜI DÙNG (USER <-> ADMIN)
CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated;
