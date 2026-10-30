-- ============================================================================
-- HIVOCAB COMMERCIALIZATION SECURITY & CONTENT GATING HARDENING MIGRATION
-- Migration: 20261030000000_content_gating_and_security_hardening.sql
-- Milestone: M1 (Database/RPC Content Gating & RLS Hardening)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HELPER FUNCTIONS: is_admin() and is_pro()
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_pro()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR (
          (
            tier IN ('pro', 'lifetime')
            OR subscription_plan IN ('pro_1m', 'pro_6m', 'pro_1y', 'pro_lifetime', 'lifetime')
          )
          AND (
            subscription_expires_at IS NULL
            OR subscription_expires_at > NOW()
          )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_pro() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_pro() TO anon, authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 2. RLS POLICIES & PRIVILEGE ESCALATION PREVENTION ON PROFILES
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_owner_or_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_read ON public.profiles;
DROP POLICY IF EXISTS profiles_read_public ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_manage ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;

CREATE POLICY profiles_select_owner_or_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_update_owner_or_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_owner ON public.profiles;

CREATE POLICY profiles_update_owner_or_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Service role, postgres background tasks (e.g. activate_pro_order), supabase_admin, and verified admins are exempt
  IF current_user IN ('service_role', 'postgres', 'supabase_admin')
     OR auth.role() = 'service_role'
     OR public.is_admin() THEN
    -- But if executing under an authenticated non-admin session that is NOT service_role:
    IF current_user = 'authenticated' AND NOT public.is_admin() THEN
      -- do not exempt
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Disallow modifying user identity / auth link
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Permission denied: cannot modify profile id';
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Permission denied: cannot modify profile email directly';
  END IF;

  -- Disallow modifying administrative role and subscription entitlement columns
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Permission denied: cannot modify profile role';
  END IF;

  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    RAISE EXCEPTION 'Permission denied: cannot modify profile tier';
  END IF;

  IF NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan THEN
    RAISE EXCEPTION 'Permission denied: cannot modify subscription_plan';
  END IF;

  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
    RAISE EXCEPTION 'Permission denied: cannot modify subscription_status';
  END IF;

  IF NEW.subscription_started_at IS DISTINCT FROM OLD.subscription_started_at THEN
    RAISE EXCEPTION 'Permission denied: cannot modify subscription_started_at';
  END IF;

  IF NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at THEN
    RAISE EXCEPTION 'Permission denied: cannot modify subscription_expires_at';
  END IF;

  -- Guard against legacy or dynamic is_pro column if present in table
  BEGIN
    IF (to_jsonb(NEW) ->> 'is_pro') IS DISTINCT FROM (to_jsonb(OLD) ->> 'is_pro') THEN
      RAISE EXCEPTION 'Permission denied: cannot modify is_pro flag';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();


-- ----------------------------------------------------------------------------
-- 3. ORDERS TABLE PROTECTION & RLS
-- ----------------------------------------------------------------------------

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_select_policy ON public.orders;
CREATE POLICY orders_select_policy ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS orders_insert_policy ON public.orders;
CREATE POLICY orders_insert_policy ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS orders_update_policy ON public.orders;
CREATE POLICY orders_update_policy ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_orders_order_code ON public.orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);


-- ----------------------------------------------------------------------------
-- 4. CONCURRENCY-SAFE, IDEMPOTENT & AUTO-HEAL SAFE activate_pro_order RPC
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.activate_pro_order(
  p_order_code bigint,
  p_payment_time text DEFAULT NULL::text,
  p_webhook_data jsonb DEFAULT NULL::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_days integer := 30;
  v_curr_expires timestamptz;
  v_curr_plan text;
  v_curr_tier text;
  v_base_date timestamptz;
  v_new_expires timestamptz;
  v_new_plan text;
BEGIN
  -- 1. Advisory transaction lock on hashed order_code to prevent concurrent race conditions
  PERFORM pg_advisory_xact_lock(hashtextextended(p_order_code::text, 0));

  -- 2. Lock and fetch order
  SELECT * INTO v_order
  FROM public.orders
  WHERE order_code = p_order_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'Order not found');
  END IF;

  -- 3. Idempotency check: If order is PAID AND profile is already Pro/Lifetime, acknowledge without duplicate days
  IF v_order.status = 'PAID' THEN
    SELECT subscription_expires_at, subscription_plan, tier
      INTO v_curr_expires, v_curr_plan, v_curr_tier
    FROM public.profiles
    WHERE id = v_order.user_id;

    IF v_curr_tier IN ('pro', 'lifetime') THEN
      RETURN jsonb_build_object(
        'ok', true,
        'success', true,
        'already_processed', true,
        'order_code', p_order_code,
        'user_id', v_order.user_id,
        'tier', v_curr_tier,
        'expires_at', v_curr_expires
      );
    END IF;
  END IF;

  -- 4. Calculate subscription days
  IF v_order.plan_id = 'pro_1m' THEN v_days := 30;
  ELSIF v_order.plan_id = 'pro_6m' THEN v_days := 180;
  ELSIF v_order.plan_id = 'pro_1y' THEN v_days := 365;
  ELSIF v_order.plan_id IN ('pro_lifetime', 'lifetime') THEN v_days := 36500;
  ELSE v_days := 30;
  END IF;

  -- 5. Transition order status to PAID
  UPDATE public.orders
  SET status = 'PAID',
      payment_time = COALESCE(p_payment_time::timestamptz, payment_time, NOW()),
      webhook_data = COALESCE(p_webhook_data, webhook_data),
      updated_at = NOW()
  WHERE order_code = p_order_code;

  -- 6. Lock and fetch profile subscription state
  SELECT subscription_expires_at, subscription_plan, tier
    INTO v_curr_expires, v_curr_plan, v_curr_tier
  FROM public.profiles
  WHERE id = v_order.user_id
  FOR UPDATE;

  -- 7. Calculate cumulative expiration and avoid lifetime downgrade
  IF v_curr_tier = 'lifetime' OR v_curr_plan IN ('pro_lifetime', 'lifetime') THEN
    v_new_expires := COALESCE(v_curr_expires, NOW() + INTERVAL '100 years');
    v_new_plan := 'pro_lifetime';
  ELSIF v_order.plan_id IN ('pro_lifetime', 'lifetime') THEN
    v_new_expires := NOW() + INTERVAL '100 years';
    v_new_plan := 'pro_lifetime';
  ELSE
    IF v_curr_expires IS NOT NULL AND v_curr_expires > NOW() THEN
      v_base_date := v_curr_expires;
    ELSE
      v_base_date := NOW();
    END IF;
    v_new_expires := v_base_date + make_interval(days => v_days);
    v_new_plan := v_order.plan_id;
  END IF;

  -- 8. Update profile to Pro
  UPDATE public.profiles
  SET tier = 'pro',
      subscription_plan = v_new_plan,
      subscription_status = 'active',
      subscription_started_at = COALESCE(subscription_started_at, NOW()),
      subscription_expires_at = v_new_expires,
      updated_at = NOW()
  WHERE id = v_order.user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'success', true,
    'already_processed', false,
    'order_code', p_order_code,
    'user_id', v_order.user_id,
    'tier', 'pro',
    'expires_at', v_new_expires
  );
END;
$$;

-- Revoke from public/anon/authenticated and grant strictly to service_role
REVOKE ALL ON FUNCTION public.activate_pro_order(bigint, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_pro_order(bigint, text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.activate_pro_order(bigint, text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.activate_pro_order(bigint, text, jsonb) TO service_role;


-- ----------------------------------------------------------------------------
-- 5. CONTENT GATING: CAMBRIDGE IELTS PASSAGES & HIERARCHY RPC
-- ----------------------------------------------------------------------------

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tests_read_all ON public.tests;
DROP POLICY IF EXISTS tests_select_visible ON public.tests;
CREATE POLICY tests_select_visible ON public.tests
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = tests.topic_id
        AND (t.user_id IS NULL OR t.is_public = true OR t.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS tests_admin_all ON public.tests;
DROP POLICY IF EXISTS tests_admin_write ON public.tests;
CREATE POLICY tests_admin_write ON public.tests
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.passages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS passages_read_all ON public.passages;
DROP POLICY IF EXISTS passages_select_visible ON public.passages;
CREATE POLICY passages_select_visible ON public.passages
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = passages.topic_id
        AND (
          public.is_admin()
          OR t.user_id = auth.uid()
          OR (
            (t.user_id IS NULL OR t.is_public = true)
            AND (
              NOT COALESCE(passages.is_pro, false)
              OR public.is_pro()
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS passages_admin_all ON public.passages;
DROP POLICY IF EXISTS passages_admin_write ON public.passages;
CREATE POLICY passages_admin_write ON public.passages
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_passages_is_pro ON public.passages(is_pro);

CREATE OR REPLACE FUNCTION public.get_cam_hierarchy(p_topic_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_pro boolean := public.is_pro();
  v_result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.topics t
    WHERE t.id = p_topic_id
      AND (t.user_id IS NULL OR t.is_public = true OR t.user_id = v_uid OR public.is_admin())
  ) THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tests WHERE topic_id = p_topic_id) THEN
    RETURN NULL;
  END IF;

  WITH passage_stats AS (
    SELECT
      p.id,
      p.test_id,
      p.passage_number,
      p.title,
      p.topic_label,
      CASE
        WHEN (COALESCE(p.is_pro, false) OR COALESCE(t.is_pro, false) OR COALESCE(top.is_pro, false)) AND NOT v_is_pro THEN NULL
        ELSE p.content_en
      END AS content_en,
      CASE
        WHEN (COALESCE(p.is_pro, false) OR COALESCE(t.is_pro, false) OR COALESCE(top.is_pro, false)) AND NOT v_is_pro THEN NULL
        ELSE p.content_vi
      END AS content_vi,
      (COALESCE(p.is_pro, false) OR COALESCE(t.is_pro, false) OR COALESCE(top.is_pro, false)) AS is_pro,
      COUNT(w.id)::int AS total_words,
      COUNT(wp.word_id)::int AS learned_words
    FROM public.passages p
    JOIN public.tests t ON t.id = p.test_id
    JOIN public.topics top ON top.id = p.topic_id
    LEFT JOIN public.words w ON w.passage_id = p.id
    LEFT JOIN public.word_progress wp
      ON wp.word_id = w.id
     AND wp.user_id = v_uid
     AND COALESCE(wp.level, 0) > 0
    WHERE p.topic_id = p_topic_id
    GROUP BY p.id, t.is_pro, top.is_pro
  ),
  test_rows AS (
    SELECT
      t.id,
      t.name,
      t.test_order,
      COALESCE(t.is_pro, false) AS is_pro,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', ps.id,
            'testId', ps.test_id,
            'passageNumber', ps.passage_number,
            'title', COALESCE(ps.title, 'Passage ' || ps.passage_number),
            'topicLabel', ps.topic_label,
            'contentEn', ps.content_en,
            'contentVi', ps.content_vi,
            'isPro', ps.is_pro,
            'totalWords', ps.total_words,
            'learnedWords', ps.learned_words,
            'progress', CASE WHEN ps.total_words > 0 THEN ROUND(ps.learned_words * 100.0 / ps.total_words)::int ELSE 0 END
          ) ORDER BY ps.passage_number NULLS LAST
        ) FILTER (WHERE ps.id IS NOT NULL),
        '[]'::jsonb
      ) AS passages
    FROM public.tests t
    LEFT JOIN passage_stats ps ON ps.test_id = t.id
    WHERE t.topic_id = p_topic_id
    GROUP BY t.id
  ),
  topic_stats AS (
    SELECT
      COUNT(w.id)::int AS total_words,
      COUNT(wp.word_id)::int AS learned_words
    FROM public.words w
    LEFT JOIN public.word_progress wp
      ON wp.word_id = w.id
     AND wp.user_id = v_uid
     AND COALESCE(wp.level, 0) > 0
    WHERE w.topic_id = p_topic_id
  )
  SELECT jsonb_build_object(
    'tests', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', tr.id,
          'name', tr.name,
          'testOrder', tr.test_order,
          'isPro', tr.is_pro,
          'passages', tr.passages
        ) ORDER BY tr.test_order NULLS LAST
      ) FROM test_rows tr),
      '[]'::jsonb
    ),
    'unlinkedWords', '[]'::jsonb,
    'totalWords', ts.total_words,
    'learnedWords', ts.learned_words,
    'progress', CASE
      WHEN ts.total_words > 0 THEN ROUND(ts.learned_words * 100.0 / ts.total_words)::int
      ELSE 0
    END
  ) INTO v_result
  FROM topic_stats ts;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_cam_hierarchy(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cam_hierarchy(uuid) TO anon, authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 6. CONTENT GATING: THPT EXAMS & SUMMARIES RPC
-- ----------------------------------------------------------------------------

ALTER TABLE public.thpt_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read thpt_exams" ON public.thpt_exams;
DROP POLICY IF EXISTS thpt_exams_read_all ON public.thpt_exams;
DROP POLICY IF EXISTS thpt_exams_select_policy ON public.thpt_exams;

CREATE POLICY thpt_exams_select_policy ON public.thpt_exams
  FOR SELECT TO anon, authenticated
  USING (
    public.is_admin()
    OR public.is_pro()
    OR NOT COALESCE(is_pro, false)
  );

DROP POLICY IF EXISTS "Allow public all thpt_exams" ON public.thpt_exams;
DROP POLICY IF EXISTS "Allow authenticated all thpt_exams" ON public.thpt_exams;
DROP POLICY IF EXISTS thpt_exams_admin_all ON public.thpt_exams;

CREATE POLICY thpt_exams_admin_all ON public.thpt_exams
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_thpt_exams_is_pro ON public.thpt_exams(is_pro);

CREATE OR REPLACE FUNCTION public.get_thpt_exam_summaries()
RETURNS TABLE (
  id text,
  title text,
  year integer,
  total_questions integer,
  duration_minutes integer,
  is_pro boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, title, year, total_questions, duration_minutes, COALESCE(is_pro, false), created_at
  FROM public.thpt_exams
  ORDER BY year DESC NULLS LAST, id ASC;
$$;

REVOKE ALL ON FUNCTION public.get_thpt_exam_summaries() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_thpt_exam_summaries() TO anon, authenticated, service_role;
