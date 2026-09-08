-- ============================================================
-- HIVOCAB ADMIN RBAC MIGRATION
-- Run on Supabase PostgreSQL (Project: swehdtrqjyklmsefkjdf)
-- ============================================================

-- 1. TẠO BẢNG PROFILES ĐỂ QUẢN LÝ PHÂN QUYỀN
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. ĐỒNG BỘ CÁC USER HIỆN TẠI VÀ THIẾT LẬP ADMIN BAN ĐẦU
INSERT INTO public.profiles (id, email, role)
SELECT id, email, CASE WHEN email = 'mitthoi60@gmail.com' THEN 'admin' ELSE 'user' END
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email,
    role = CASE WHEN EXCLUDED.email = 'mitthoi60@gmail.com' THEN 'admin' ELSE profiles.role END;

-- 3. TỰ ĐỘNG TẠO PROFILE KHI CÓ USER MỚI ĐĂNG KÝ
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (new.id, new.email, 'user')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. HÀM KIỂM TRA QUYỀN ADMIN (SECURITY DEFINER, SEARCH_PATH PUBLIC)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- 5. RLS CHO BẢNG PROFILES
DROP POLICY IF EXISTS profiles_read ON public.profiles;
CREATE POLICY profiles_read ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_admin_manage ON public.profiles;
CREATE POLICY profiles_admin_manage ON public.profiles
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. CẤP QUYỀN ALL CHO ADMIN TRÊN TESTS, PASSAGES, WORDS, TOPICS
DROP POLICY IF EXISTS tests_admin_all ON public.tests;
CREATE POLICY tests_admin_all ON public.tests
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS passages_admin_all ON public.passages;
CREATE POLICY passages_admin_all ON public.passages
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS words_admin_all ON public.words;
CREATE POLICY words_admin_all ON public.words
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS topics_admin_all ON public.topics;
CREATE POLICY topics_admin_all ON public.topics
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
