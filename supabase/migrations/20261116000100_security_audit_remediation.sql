-- ============================================================================
-- HiVocab Migration: Security Audit (Run 2) Remediation
-- ============================================================================
-- Fixes:
--   1. Order replay after admin PRO revocation via orders.entitlement_granted_at
--   2. prevent_profile_privilege_escalation() swallowing its own is_pro exception
--   3. passages_select_visible & words_select_visible enforcing topic/test/passage is_pro
--   4. clone_public_topic() enforcing Pro entitlement check
--   5. topics_insert_owner admin compatibility & topics_update_owner column protection
--   6. Drop legacy 3-arg anon get_vocabulary_page & orphaned functions
--   7. Bounded SECURITY INVOKER dictionary lookup/suggestion RPCs
--   8. Conditional baseline RLS for un-migrated tables (system_settings, thpt_exam_questions,
--      user_bug_reports, answer_reports, system_error_logs, exercises, exercise_questions)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ORDERS: Add one-time entitlement fulfillment guard & replay-safe RPC
-- ----------------------------------------------------------------------------

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS entitlement_granted_at timestamptz;

UPDATE public.orders
SET entitlement_granted_at = COALESCE(payment_time, updated_at, created_at, NOW())
WHERE status = 'PAID'
  AND entitlement_granted_at IS NULL;

CREATE OR REPLACE FUNCTION public.activate_pro_order(
  p_order_code bigint,
  p_payment_time text DEFAULT NULL::text,
  p_webhook_data jsonb DEFAULT NULL::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $hivocab$
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
  PERFORM pg_advisory_xact_lock(hashtextextended(p_order_code::text, 0));

  SELECT * INTO v_order
  FROM public.orders
  WHERE order_code = p_order_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'Order not found');
  END IF;

  -- Strictly prevent order replay even if an admin later revoked or reset the user's tier.
  IF v_order.entitlement_granted_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'success', true,
      'already_processed', true,
      'order_code', p_order_code,
      'user_id', v_order.user_id,
      'entitlement_granted_at', v_order.entitlement_granted_at
    );
  END IF;

  IF v_order.plan_id = 'pro_1m' THEN v_days := 30;
  ELSIF v_order.plan_id = 'pro_6m' THEN v_days := 180;
  ELSIF v_order.plan_id = 'pro_1y' THEN v_days := 365;
  ELSIF v_order.plan_id IN ('pro_lifetime', 'lifetime') THEN v_days := 36500;
  ELSE v_days := 30;
  END IF;

  UPDATE public.orders
  SET status = 'PAID',
      payment_time = COALESCE(p_payment_time::timestamptz, payment_time, NOW()),
      webhook_data = COALESCE(p_webhook_data, webhook_data),
      entitlement_granted_at = NOW(),
      updated_at = NOW()
  WHERE order_code = p_order_code;

  SELECT subscription_expires_at, subscription_plan, tier
    INTO v_curr_expires, v_curr_plan, v_curr_tier
  FROM public.profiles
  WHERE id = v_order.user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'Profile not found');
  END IF;

  IF v_order.plan_id IN ('pro_lifetime', 'lifetime') THEN
    v_new_plan := 'lifetime';
    v_new_expires := NOW() + INTERVAL '100 years';
  ELSE
    v_new_plan := v_order.plan_id;
    IF v_curr_expires IS NOT NULL AND v_curr_expires > NOW() AND v_curr_tier = 'pro' THEN
      v_base_date := v_curr_expires;
    ELSE
      v_base_date := NOW();
    END IF;
    v_new_expires := v_base_date + (v_days || ' days')::interval;
  END IF;

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
    'order_code', p_order_code,
    'user_id', v_order.user_id,
    'plan_id', v_new_plan,
    'expires_at', v_new_expires
  );
END;
$hivocab$;

REVOKE ALL ON FUNCTION public.activate_pro_order(bigint, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_pro_order(bigint, text, jsonb) TO service_role;


-- ----------------------------------------------------------------------------
-- 2. PROFILES TRIGGER: Do not swallow RAISE EXCEPTION for is_pro
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $hivocab$
DECLARE
  v_jwt_role text := COALESCE(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF v_jwt_role = 'service_role' OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Permission denied: cannot modify profile id';
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Permission denied: cannot modify profile email directly';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Permission denied: cannot modify profile role';
  END IF;

  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    RAISE EXCEPTION 'Permission denied: cannot modify tier';
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

  IF (to_jsonb(NEW) ? 'is_pro' OR to_jsonb(OLD) ? 'is_pro')
     AND ((to_jsonb(NEW) ->> 'is_pro') IS DISTINCT FROM (to_jsonb(OLD) ->> 'is_pro')) THEN
    RAISE EXCEPTION 'Permission denied: cannot modify is_pro flag';
  END IF;

  RETURN NEW;
END;
$hivocab$;


-- ----------------------------------------------------------------------------
-- 3. PASSAGES, WORDS, TOPICS & CLONE_PUBLIC_TOPIC: Align Pro gating & ownership
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS topics_insert_owner ON public.topics;
CREATE POLICY topics_insert_owner ON public.topics
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR (user_id IS NULL AND public.is_admin())
  );

-- Prevent non-admin topic owners from tampering with gating/counter columns.
CREATE OR REPLACE FUNCTION public.prevent_topic_gating_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $hivocab$
DECLARE
  v_jwt_role text := COALESCE(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF v_jwt_role = 'service_role' OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF (to_jsonb(NEW) ? 'is_pro' OR to_jsonb(OLD) ? 'is_pro')
     AND ((to_jsonb(NEW) ->> 'is_pro') IS DISTINCT FROM (to_jsonb(OLD) ->> 'is_pro')) THEN
    RAISE EXCEPTION 'Permission denied: cannot modify topic is_pro flag';
  END IF;

  IF NEW.like_count IS DISTINCT FROM OLD.like_count THEN
    NEW.like_count := OLD.like_count;
  END IF;

  IF NEW.clone_count IS DISTINCT FROM OLD.clone_count THEN
    NEW.clone_count := OLD.clone_count;
  END IF;

  RETURN NEW;
END;
$hivocab$;

DROP TRIGGER IF EXISTS trg_prevent_topic_gating_tampering ON public.topics;
CREATE TRIGGER trg_prevent_topic_gating_tampering
  BEFORE UPDATE ON public.topics
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_topic_gating_tampering();

DROP POLICY IF EXISTS words_select_visible ON public.words;
CREATE POLICY words_select_visible ON public.words
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.topics t
      LEFT JOIN public.passages p ON p.id = words.passage_id
      LEFT JOIN public.tests te ON te.id = p.test_id
      WHERE t.id = words.topic_id
        AND (
          public.is_admin()
          OR t.user_id = auth.uid()
          OR (
            (t.user_id IS NULL OR t.is_public = true)
            AND (
              (
                NOT COALESCE(t.is_pro, false)
                AND NOT COALESCE(p.is_pro, false)
                AND NOT COALESCE(te.is_pro, false)
              )
              OR public.is_pro()
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS passages_select_visible ON public.passages;
CREATE POLICY passages_select_visible ON public.passages
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.topics t
      LEFT JOIN public.tests te ON te.id = passages.test_id
      WHERE t.id = passages.topic_id
        AND (
          public.is_admin()
          OR t.user_id = auth.uid()
          OR (
            (t.user_id IS NULL OR t.is_public = true)
            AND (
              (
                NOT COALESCE(passages.is_pro, false)
                AND NOT COALESCE(te.is_pro, false)
                AND NOT COALESCE(t.is_pro, false)
              )
              OR public.is_pro()
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS tests_select_visible ON public.tests;
CREATE POLICY tests_select_visible ON public.tests
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = tests.topic_id
        AND (
          public.is_admin()
          OR t.user_id = auth.uid()
          OR (
            (t.user_id IS NULL OR t.is_public = true)
            AND (
              (NOT COALESCE(tests.is_pro, false) AND NOT COALESCE(t.is_pro, false))
              OR public.is_pro()
            )
          )
        )
    )
  );

CREATE OR REPLACE FUNCTION public.clone_public_topic(
  target_topic_id uuid,
  target_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $hivocab$
DECLARE
  v_uid uuid := auth.uid();
  v_source public.topics%ROWTYPE;
  v_new_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF target_user_id IS NOT NULL AND target_user_id <> v_uid THEN
    RAISE EXCEPTION 'Cannot clone for another user';
  END IF;

  SELECT * INTO v_source
  FROM public.topics
  WHERE id = target_topic_id
    AND (is_public = true OR user_id = v_uid OR public.is_admin());

  IF NOT FOUND THEN RAISE EXCEPTION 'Source topic not found or not public'; END IF;

  IF COALESCE(v_source.is_pro, false)
     AND v_source.user_id IS DISTINCT FROM v_uid
     AND NOT (public.is_pro() OR public.is_admin()) THEN
    RAISE EXCEPTION 'Pro subscription required to clone this topic';
  END IF;

  INSERT INTO public.topics (user_id, name, icon, category, description, is_public)
  VALUES (v_uid, v_source.name || ' (Bản sao)', COALESCE(v_source.icon, 'folder'), 'personal', v_source.description, false)
  RETURNING id INTO v_new_id;

  INSERT INTO public.words (topic_id, passage_id, word, pos, phonetic, meaning, example_sentence, image_url, lesson_name, lesson_order, word_order)
  SELECT v_new_id, NULL, word, pos, phonetic, meaning, example_sentence, image_url, lesson_name, lesson_order, word_order
  FROM public.words w
  LEFT JOIN public.passages p ON p.id = w.passage_id
  LEFT JOIN public.tests te ON te.id = p.test_id
  WHERE w.topic_id = target_topic_id
    AND (
      public.is_admin()
      OR public.is_pro()
      OR v_source.user_id = v_uid
      OR (NOT COALESCE(p.is_pro, false) AND NOT COALESCE(te.is_pro, false))
    );

  UPDATE public.topics
  SET clone_count = COALESCE(clone_count, 0) + 1
  WHERE id = target_topic_id;

  RETURN v_new_id;
END;
$hivocab$;


-- ----------------------------------------------------------------------------
-- 4. DROP LEGACY ANON OVERLOADS & BOUNDED DICTIONARY SEARCH RPCs
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_vocabulary_page(integer, integer, text);
DROP FUNCTION IF EXISTS public.custom_upsert_words(jsonb);
DROP FUNCTION IF EXISTS public.test_fn();

CREATE OR REPLACE FUNCTION public.lookup_dictionary_word(p_word text)
RETURNS TABLE (
  id uuid,
  word text,
  meaning text,
  pos text,
  phonetic text,
  example_sentence text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $hivocab$
  SELECT w.id, w.word, w.meaning, w.pos, w.phonetic, w.example_sentence
  FROM public.words w
  JOIN public.topics t ON t.id = w.topic_id
  WHERE length(trim(COALESCE(p_word, ''))) BETWEEN 1 AND 80
    AND lower(w.word) = lower(trim(p_word))
    AND (t.user_id IS NULL OR t.is_public = true OR t.user_id = auth.uid() OR public.is_admin())
    AND (NOT COALESCE(t.is_pro, false) OR public.is_pro() OR public.is_admin() OR t.user_id = auth.uid())
  ORDER BY (w.phonetic IS NOT NULL AND w.example_sentence IS NOT NULL) DESC, w.created_at ASC
  LIMIT 6;
$hivocab$;

CREATE OR REPLACE FUNCTION public.search_dictionary_suggestions(p_prefix text)
RETURNS TABLE (
  word text,
  meaning text,
  pos text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $hivocab$
  SELECT w.word, w.meaning, w.pos
  FROM public.words w
  JOIN public.topics t ON t.id = w.topic_id
  WHERE length(trim(COALESCE(p_prefix, ''))) >= 2
    AND length(trim(p_prefix)) <= 64
    AND w.word ILIKE (regexp_replace(trim(p_prefix), '([%_\\])', '\\\1', 'g') || '%')
    AND (t.user_id IS NULL OR t.is_public = true OR t.user_id = auth.uid() OR public.is_admin())
    AND (NOT COALESCE(t.is_pro, false) OR public.is_pro() OR public.is_admin() OR t.user_id = auth.uid())
  ORDER BY w.word ASC
  LIMIT 8;
$hivocab$;

REVOKE ALL ON FUNCTION public.lookup_dictionary_word(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_dictionary_word(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.search_dictionary_suggestions(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_dictionary_suggestions(text) TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- 5. CONDITIONAL RLS FOR PREVIOUSLY UNMIGRATED CLIENT-ACCESSED TABLES
-- ----------------------------------------------------------------------------

DO $hivocab$
DECLARE
  p RECORD;
BEGIN
  -- system_settings: readable for gating status, writable strictly by admins
  IF to_regclass('public.system_settings') IS NOT NULL THEN
    ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_settings' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.system_settings', p.policyname);
    END LOOP;
    CREATE POLICY system_settings_select_all ON public.system_settings
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY system_settings_admin_write ON public.system_settings
      FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;

  -- thpt_exam_questions: inherit thpt_exams Pro gating on SELECT, writes admin-only
  IF to_regclass('public.thpt_exam_questions') IS NOT NULL THEN
    ALTER TABLE public.thpt_exam_questions ENABLE ROW LEVEL SECURITY;
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'thpt_exam_questions' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.thpt_exam_questions', p.policyname);
    END LOOP;
    CREATE POLICY thpt_exam_questions_select_visible ON public.thpt_exam_questions
      FOR SELECT TO anon, authenticated
      USING (
        public.is_admin()
        OR public.is_pro()
        OR NOT EXISTS (
          SELECT 1 FROM public.thpt_exams e
          WHERE e.id = thpt_exam_questions.exam_id
            AND COALESCE(e.is_pro, false)
        )
      );
    CREATE POLICY thpt_exam_questions_admin_write ON public.thpt_exam_questions
      FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;

  -- user_bug_reports: insertable by reporter, readable/mutable strictly by admins
  IF to_regclass('public.user_bug_reports') IS NOT NULL THEN
    ALTER TABLE public.user_bug_reports ENABLE ROW LEVEL SECURITY;
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_bug_reports' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_bug_reports', p.policyname);
    END LOOP;
    CREATE POLICY user_bug_reports_insert ON public.user_bug_reports
      FOR INSERT TO anon, authenticated
      WITH CHECK (user_id IS NULL OR user_id = auth.uid());
    CREATE POLICY user_bug_reports_admin_read_write ON public.user_bug_reports
      FOR SELECT TO authenticated USING (public.is_admin());
    CREATE POLICY user_bug_reports_admin_modify ON public.user_bug_reports
      FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
    CREATE POLICY user_bug_reports_admin_delete ON public.user_bug_reports
      FOR DELETE TO authenticated USING (public.is_admin());
  END IF;

  -- answer_reports: insertable by authenticated users, readable/mutable strictly by admins
  IF to_regclass('public.answer_reports') IS NOT NULL THEN
    ALTER TABLE public.answer_reports ENABLE ROW LEVEL SECURITY;
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'answer_reports' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.answer_reports', p.policyname);
    END LOOP;
    CREATE POLICY answer_reports_insert ON public.answer_reports
      FOR INSERT TO anon, authenticated
      WITH CHECK (exam_id IS NOT NULL AND question_number IS NOT NULL);
    CREATE POLICY answer_reports_admin_read ON public.answer_reports
      FOR SELECT TO authenticated USING (public.is_admin());
    CREATE POLICY answer_reports_admin_modify ON public.answer_reports
      FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
    CREATE POLICY answer_reports_admin_delete ON public.answer_reports
      FOR DELETE TO authenticated USING (public.is_admin());
  END IF;

  -- system_error_logs: insertable by client error boundary, readable/deletable strictly by admins
  IF to_regclass('public.system_error_logs') IS NOT NULL THEN
    ALTER TABLE public.system_error_logs ENABLE ROW LEVEL SECURITY;
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_error_logs' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.system_error_logs', p.policyname);
    END LOOP;
    CREATE POLICY system_error_logs_insert ON public.system_error_logs
      FOR INSERT TO anon, authenticated
      WITH CHECK (user_id IS NULL OR user_id = auth.uid());
    CREATE POLICY system_error_logs_admin_read ON public.system_error_logs
      FOR SELECT TO authenticated USING (public.is_admin());
    CREATE POLICY system_error_logs_admin_delete ON public.system_error_logs
      FOR DELETE TO authenticated USING (public.is_admin());
  END IF;

  -- exercises & exercise_questions: readable by learners, writable strictly by admins
  IF to_regclass('public.exercises') IS NOT NULL THEN
    ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exercises' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.exercises', p.policyname);
    END LOOP;
    CREATE POLICY exercises_select_all ON public.exercises
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY exercises_admin_write ON public.exercises
      FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;

  IF to_regclass('public.exercise_questions') IS NOT NULL THEN
    ALTER TABLE public.exercise_questions ENABLE ROW LEVEL SECURITY;
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exercise_questions' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.exercise_questions', p.policyname);
    END LOOP;
    CREATE POLICY exercise_questions_select_all ON public.exercise_questions
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY exercise_questions_admin_write ON public.exercise_questions
      FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $hivocab$;
