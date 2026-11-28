-- ============================================================================
-- HiVocab Migration: 3-Tier Plans (Free / Pro / Premium) & Server-Backed Quotas
-- Migration: 20261128000100_three_tier_plans_and_quotas.sql
-- ============================================================================
-- 1. Allow 'premium' tier on profiles & add get_effective_tier() / is_premium()
-- 2. Update is_pro() so Premium & Lifetime inherit all Pro RLS entitlements
-- 3. Upgrade activate_pro_order() for 8 SKUs (pro_1m/3m/6m/1y & premium_1m/3m/6m/1y)
-- 4. Update enforce_user_youtube_video_limit() so Premium / Admin are unlimited
-- 5. Add 1,000 personal word cap trigger for Free tier (Pro & Premium unlimited)
-- 6. Add user_daily_usage table + consume_ai_shadowing_quota() & get_my_plan_usage()
--    (Free: 50/day, Pro: 500/day, Premium/Admin: unlimited — Vietnam timezone)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Ensure profiles.tier supports 'free', 'pro', 'premium', 'lifetime'
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%tier%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_tier_check
    CHECK (tier IS NULL OR tier IN ('free', 'pro', 'premium', 'lifetime'));
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Effective tier helpers: get_effective_tier(), is_pro(), is_premium()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_effective_tier(p_user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $hivocab$
DECLARE
  v_prof RECORD;
  v_plan text;
  v_tier text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 'free';
  END IF;

  SELECT role, tier, subscription_plan, subscription_expires_at
    INTO v_prof
  FROM public.profiles
  WHERE id = p_user_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 'free';
  END IF;

  IF v_prof.role = 'admin' THEN
    RETURN 'premium';
  END IF;

  v_tier := lower(COALESCE(v_prof.tier, 'free'));
  v_plan := lower(COALESCE(v_prof.subscription_plan, ''));

  IF v_tier = 'lifetime' OR v_plan IN ('lifetime', 'pro_lifetime') THEN
    RETURN 'lifetime';
  END IF;

  IF v_prof.subscription_expires_at IS NOT NULL AND v_prof.subscription_expires_at <= NOW() THEN
    RETURN 'free';
  END IF;

  IF v_tier = 'premium' OR v_plan LIKE 'premium%' THEN
    RETURN 'premium';
  END IF;

  IF v_tier = 'pro' OR v_plan LIKE 'pro%' THEN
    RETURN 'pro';
  END IF;

  RETURN 'free';
END;
$hivocab$;

REVOKE ALL ON FUNCTION public.get_effective_tier(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_effective_tier(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_pro()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $hivocab$
  SELECT public.get_effective_tier((SELECT auth.uid())) IN ('pro', 'premium', 'lifetime');
$hivocab$;

REVOKE ALL ON FUNCTION public.is_pro() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_pro() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_premium()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $hivocab$
  SELECT public.get_effective_tier((SELECT auth.uid())) IN ('premium', 'lifetime');
$hivocab$;

REVOKE ALL ON FUNCTION public.is_premium() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_premium() TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. Upgrade activate_pro_order() for Pro & Premium multi-cycle SKUs
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
AS $hivocab$
DECLARE
  v_order RECORD;
  v_days integer := 30;
  v_target_tier text := 'pro';
  v_curr_expires timestamptz;
  v_curr_plan text;
  v_curr_tier text;
  v_effective_curr_tier text;
  v_base_date timestamptz;
  v_new_expires timestamptz;
  v_new_plan text;
  v_new_tier text;
  v_remaining_days integer := 0;
  v_bonus_days integer := 0;
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

  -- Resolve SKU duration and target tier
  IF v_order.plan_id = 'pro_1m' THEN
    v_days := 30; v_target_tier := 'pro';
  ELSIF v_order.plan_id = 'pro_3m' THEN
    v_days := 90; v_target_tier := 'pro';
  ELSIF v_order.plan_id = 'pro_6m' THEN
    v_days := 180; v_target_tier := 'pro';
  ELSIF v_order.plan_id = 'pro_1y' THEN
    v_days := 365; v_target_tier := 'pro';
  ELSIF v_order.plan_id = 'premium_1m' THEN
    v_days := 30; v_target_tier := 'premium';
  ELSIF v_order.plan_id = 'premium_3m' THEN
    v_days := 90; v_target_tier := 'premium';
  ELSIF v_order.plan_id = 'premium_6m' THEN
    v_days := 180; v_target_tier := 'premium';
  ELSIF v_order.plan_id = 'premium_1y' THEN
    v_days := 365; v_target_tier := 'premium';
  ELSIF v_order.plan_id IN ('pro_lifetime', 'lifetime') THEN
    v_days := 36500; v_target_tier := 'lifetime';
  ELSE
    v_days := 30;
    v_target_tier := CASE WHEN lower(COALESCE(v_order.plan_id, '')) LIKE 'premium%' THEN 'premium' ELSE 'pro' END;
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

  v_effective_curr_tier := public.get_effective_tier(v_order.user_id);

  IF v_target_tier = 'lifetime' OR v_effective_curr_tier = 'lifetime' THEN
    v_new_tier := 'lifetime';
    v_new_plan := 'lifetime';
    v_new_expires := NOW() + INTERVAL '100 years';
  ELSE
    v_new_plan := v_order.plan_id;
    v_new_tier := v_target_tier;

    IF v_curr_expires IS NOT NULL AND v_curr_expires > NOW() THEN
      IF v_effective_curr_tier = v_target_tier THEN
        -- Same tier renewal: stack directly onto current expiry
        v_base_date := v_curr_expires;
        v_new_expires := v_base_date + (v_days || ' days')::interval;
      ELSIF v_effective_curr_tier = 'pro' AND v_target_tier = 'premium' THEN
        -- Mid-cycle Pro -> Premium upgrade: convert remaining Pro days fairly (25k / 69k ratio)
        v_remaining_days := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_curr_expires - NOW())) / 86400.0)::integer);
        v_bonus_days := CEIL(v_remaining_days * (25.0 / 69.0))::integer;
        v_new_expires := NOW() + ((v_days + v_bonus_days) || ' days')::interval;
      ELSIF v_effective_curr_tier = 'premium' AND v_target_tier = 'pro' THEN
        -- Never silently downgrade an active Premium user; preserve Premium & convert added days
        v_new_tier := 'premium';
        v_new_plan := COALESCE(NULLIF(v_curr_plan, ''), 'premium_1m');
        v_bonus_days := GREATEST(1, CEIL(v_days * (25.0 / 69.0))::integer);
        v_new_expires := v_curr_expires + (v_bonus_days || ' days')::interval;
      ELSE
        v_new_expires := NOW() + (v_days || ' days')::interval;
      END IF;
    ELSE
      v_new_expires := NOW() + (v_days || ' days')::interval;
    END IF;
  END IF;

  UPDATE public.profiles
  SET tier = v_new_tier,
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
    'tier', v_new_tier,
    'plan_id', v_new_plan,
    'expires_at', v_new_expires
  );
END;
$hivocab$;

REVOKE ALL ON FUNCTION public.activate_pro_order(bigint, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_pro_order(bigint, text, jsonb) TO service_role;

-- ----------------------------------------------------------------------------
-- 4. Update YouTube video limit trigger: Free & Pro = 5, Premium & Admin = ∞
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_user_youtube_video_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $hivocab$
DECLARE
  v_uid uuid := auth.uid();
  v_count integer;
  v_limit integer;
  v_tier text;
BEGIN
  IF v_uid IS NULL OR NEW.user_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Vui lòng đăng nhập để thêm video YouTube cá nhân.' USING ERRCODE = 'P0001';
  END IF;

  v_tier := public.get_effective_tier(v_uid);

  -- Premium, Lifetime & Admin users have unlimited YouTube video uploads
  IF v_tier IN ('premium', 'lifetime') OR public.is_admin() THEN
    NEW.created_at := COALESCE(NEW.created_at, now());
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  v_limit := public.get_user_youtube_video_limit();

  PERFORM pg_advisory_xact_lock(hashtext('user_youtube_videos:' || v_uid::text));

  SELECT count(*)::int INTO v_count
  FROM public.user_youtube_videos
  WHERE user_id = v_uid;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'VIDEO_QUOTA_EXCEEDED: Gói % chỉ được lưu tối đa % video YouTube cá nhân. Nâng cấp HiVocab Premium để tải lên không giới hạn!',
      CASE WHEN v_tier = 'pro' THEN 'Pro' ELSE 'Miễn phí' END,
      v_limit
      USING ERRCODE = 'P0001';
  END IF;

  NEW.created_at := COALESCE(NEW.created_at, now());
  NEW.updated_at := now();
  RETURN NEW;
END;
$hivocab$;

REVOKE ALL ON FUNCTION public.enforce_user_youtube_video_limit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enforce_user_youtube_video_limit() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5. Enforce 1,000 personal vocabulary word limit for Free tier (Pro/Premium ∞)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_free_word_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $hivocab$
DECLARE
  v_jwt_role text := COALESCE(current_setting('request.jwt.claim.role', true), '');
  v_uid uuid := auth.uid();
  v_topic_owner uuid;
  v_tier text;
  v_word_count integer;
BEGIN
  IF v_jwt_role = 'service_role' OR current_user IN ('service_role', 'postgres', 'supabase_admin') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF v_uid IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_topic_owner
  FROM public.topics
  WHERE id = NEW.topic_id
  LIMIT 1;

  -- Only enforce cap on personal user-owned decks
  IF v_topic_owner IS DISTINCT FROM v_uid THEN
    RETURN NEW;
  END IF;

  v_tier := public.get_effective_tier(v_uid);
  IF v_tier IN ('pro', 'premium', 'lifetime') THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('user_words_limit:' || v_uid::text));

  SELECT count(*)::int INTO v_word_count
  FROM public.words w
  INNER JOIN public.topics t ON t.id = w.topic_id
  WHERE t.user_id = v_uid;

  IF v_word_count >= 1000 THEN
    RAISE EXCEPTION 'FREE_WORD_LIMIT_REACHED: Tài khoản Miễn phí giới hạn tối đa 1.000 từ vựng cá nhân (hiện có %/1.000). Nâng cấp HiVocab Pro để lưu từ không giới hạn!', v_word_count
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$hivocab$;

DROP TRIGGER IF EXISTS trg_enforce_free_word_limit ON public.words;
CREATE TRIGGER trg_enforce_free_word_limit
  BEFORE INSERT ON public.words
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_free_word_limit();

REVOKE ALL ON FUNCTION public.enforce_free_word_limit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enforce_free_word_limit() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 6. Daily AI Shadowing Quota Tracking (Free: 50/day, Pro: 500/day, Premium: ∞)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_daily_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL,
  ai_shadowing_count integer NOT NULL DEFAULT 0 CHECK (ai_shadowing_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_usage_date
  ON public.user_daily_usage (usage_date DESC);

ALTER TABLE public.user_daily_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_daily_usage_select_own ON public.user_daily_usage;
CREATE POLICY user_daily_usage_select_own
  ON public.user_daily_usage
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- Users may NOT insert/update/delete user_daily_usage directly; only via RPC below.

CREATE OR REPLACE FUNCTION public.get_my_plan_usage()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $hivocab$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_tier text := 'free';
  v_saved_words integer := 0;
  v_max_words integer := 1000;
  v_yt_count integer := 0;
  v_max_yt integer := 5;
  v_ai_used integer := 0;
  v_ai_limit integer := 50;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object(
      'authenticated', false,
      'tier', 'free',
      'saved_words_count', 0,
      'max_saved_words', 1000,
      'youtube_videos_count', 0,
      'max_youtube_videos', 5,
      'ai_shadowing_used_today', 0,
      'ai_shadowing_daily_limit', 50,
      'ai_shadowing_remaining_today', 50,
      'usage_date', v_today
    );
  END IF;

  v_tier := public.get_effective_tier(v_uid);

  SELECT count(*)::int INTO v_saved_words
  FROM public.words w
  INNER JOIN public.topics t ON t.id = w.topic_id
  WHERE t.user_id = v_uid;

  SELECT count(*)::int INTO v_yt_count
  FROM public.user_youtube_videos
  WHERE user_id = v_uid;

  SELECT COALESCE(ai_shadowing_count, 0) INTO v_ai_used
  FROM public.user_daily_usage
  WHERE user_id = v_uid AND usage_date = v_today;

  v_ai_used := COALESCE(v_ai_used, 0);

  IF v_tier IN ('premium', 'lifetime') THEN
    v_max_words := NULL;
    v_max_yt := NULL;
    v_ai_limit := NULL;
  ELSIF v_tier = 'pro' THEN
    v_max_words := NULL;
    v_max_yt := public.get_user_youtube_video_limit();
    v_ai_limit := 500;
  ELSE
    v_max_words := 1000;
    v_max_yt := public.get_user_youtube_video_limit();
    v_ai_limit := 50;
  END IF;

  RETURN jsonb_build_object(
    'authenticated', true,
    'tier', v_tier,
    'saved_words_count', v_saved_words,
    'max_saved_words', v_max_words,
    'youtube_videos_count', v_yt_count,
    'max_youtube_videos', v_max_yt,
    'ai_shadowing_used_today', v_ai_used,
    'ai_shadowing_daily_limit', v_ai_limit,
    'ai_shadowing_remaining_today', CASE WHEN v_ai_limit IS NULL THEN NULL ELSE GREATEST(0, v_ai_limit - v_ai_used) END,
    'usage_date', v_today
  );
END;
$hivocab$;

REVOKE ALL ON FUNCTION public.get_my_plan_usage() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_plan_usage() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.consume_ai_shadowing_quota()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $hivocab$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_tier text := 'free';
  v_limit integer := 50;
  v_used integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'code', 'LOGIN_REQUIRED',
      'tier', 'free',
      'used', 0,
      'limit', 50,
      'remaining', 0,
      'usage_date', v_today,
      'message', 'Vui lòng đăng nhập để sử dụng AI phân tích chấm phát âm chuyên sâu.'
    );
  END IF;

  v_tier := public.get_effective_tier(v_uid);

  IF v_tier IN ('premium', 'lifetime') THEN
    v_limit := NULL;
  ELSIF v_tier = 'pro' THEN
    v_limit := 500;
  ELSE
    v_limit := 50;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('ai_shadowing_quota:' || v_uid::text || ':' || v_today::text));

  INSERT INTO public.user_daily_usage (user_id, usage_date, ai_shadowing_count, updated_at)
  VALUES (v_uid, v_today, 0, NOW())
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  SELECT ai_shadowing_count INTO v_used
  FROM public.user_daily_usage
  WHERE user_id = v_uid AND usage_date = v_today
  FOR UPDATE;

  IF v_limit IS NOT NULL AND v_used >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'code', 'AI_SHADOWING_QUOTA_EXCEEDED',
      'tier', v_tier,
      'used', v_used,
      'limit', v_limit,
      'remaining', 0,
      'usage_date', v_today,
      'message', CASE
        WHEN v_tier = 'pro' THEN
          'Bạn đã dùng hết 500 lượt chấm AI Shadowing hôm nay (gói Pro). Nâng cấp HiVocab Premium để chấm không giới hạn!'
        ELSE
          'Bạn đã dùng hết 50 lượt chấm AI Shadowing hôm nay (gói Miễn phí). Nâng cấp HiVocab Pro để mở khóa 500 lượt/ngày!'
      END
    );
  END IF;

  UPDATE public.user_daily_usage
  SET ai_shadowing_count = ai_shadowing_count + 1,
      updated_at = NOW()
  WHERE user_id = v_uid AND usage_date = v_today
  RETURNING ai_shadowing_count INTO v_used;

  RETURN jsonb_build_object(
    'allowed', true,
    'tier', v_tier,
    'used', v_used,
    'limit', v_limit,
    'remaining', CASE WHEN v_limit IS NULL THEN NULL ELSE GREATEST(0, v_limit - v_used) END,
    'usage_date', v_today
  );
END;
$hivocab$;

REVOKE ALL ON FUNCTION public.consume_ai_shadowing_quota() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_shadowing_quota() TO authenticated, service_role;
