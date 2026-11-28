// src/config/plans.js
// Single source of truth for HiVocab 3-tier account plans (Free / Pro / Premium),
// billing cycles (1m / 3m / 6m / 1y), accurate savings math, and feature quotas.

export const BILLING_CYCLES = [
  { id: '1m', label: '1 Tháng', shortLabel: '1T', months: 1, days: 30, maxSavingsPercent: 0 },
  { id: '3m', label: '3 Tháng', shortLabel: '3T', months: 3, days: 90, maxSavingsPercent: 14 },
  { id: '6m', label: '6 Tháng', shortLabel: '6T', months: 6, days: 180, maxSavingsPercent: 21 },
  { id: '1y', label: '1 Năm', shortLabel: '1N', months: 12, days: 365, maxSavingsPercent: 34 },
];

export const TIER_LIMITS = Object.freeze({
  free: {
    tier: 'free',
    name: 'Free',
    displayName: 'Miễn phí',
    maxSavedWords: 1000,
    maxYoutubeUploads: 5,
    dailyAiShadowingLimit: 50,
    prewarmStudioAi: false,
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    displayName: 'HiVocab Pro',
    maxSavedWords: null, // Unlimited
    maxYoutubeUploads: 5,
    dailyAiShadowingLimit: 500,
    prewarmStudioAi: true,
  },
  premium: {
    tier: 'premium',
    name: 'Premium',
    displayName: 'HiVocab Premium',
    maxSavedWords: null, // Unlimited
    maxYoutubeUploads: null, // Unlimited
    dailyAiShadowingLimit: null, // Unlimited
    prewarmStudioAi: true,
  },
  lifetime: {
    tier: 'lifetime',
    name: 'Trọn Đời',
    displayName: 'HiVocab Trọn Đời',
    maxSavedWords: null, // Unlimited
    maxYoutubeUploads: null, // Unlimited
    dailyAiShadowingLimit: null, // Unlimited
    prewarmStudioAi: true,
  },
});

const BASE_MONTHLY_PRICE = Object.freeze({
  pro: 25000,
  premium: 69000,
});

function buildSku({ id, tier, cycleId, months, days, amount, name, periodNote }) {
  const baseMonthly = BASE_MONTHLY_PRICE[tier] || amount;
  const originalAmount = baseMonthly * months;
  const savingsAmount = Math.max(0, originalAmount - amount);
  const savingsPercent = originalAmount > 0 && savingsAmount > 0
    ? Math.round((savingsAmount / originalAmount) * 100)
    : 0;
  const monthlyEquivalent = Math.round(amount / months);

  return {
    id,
    tier,
    cycleId,
    months,
    days,
    amount,
    originalAmount,
    savingsAmount,
    savingsPercent,
    monthlyEquivalent,
    name,
    periodNote,
  };
}

export const SUBSCRIPTION_PLANS = Object.freeze({
  pro_1m: buildSku({
    id: 'pro_1m',
    tier: 'pro',
    cycleId: '1m',
    months: 1,
    days: 30,
    amount: 25000,
    name: 'HiVocab Pro 1 Tháng',
    periodNote: 'Thanh toán mỗi tháng',
  }),
  pro_3m: buildSku({
    id: 'pro_3m',
    tier: 'pro',
    cycleId: '3m',
    months: 3,
    days: 90,
    amount: 65000,
    name: 'HiVocab Pro 3 Tháng',
    periodNote: 'Thanh toán 65.000 ₫ mỗi 3 tháng',
  }),
  pro_6m: buildSku({
    id: 'pro_6m',
    tier: 'pro',
    cycleId: '6m',
    months: 6,
    days: 180,
    amount: 119000,
    name: 'HiVocab Pro 6 Tháng',
    periodNote: 'Thanh toán 119.000 ₫ mỗi 6 tháng',
  }),
  pro_1y: buildSku({
    id: 'pro_1y',
    tier: 'pro',
    cycleId: '1y',
    months: 12,
    days: 365,
    amount: 199000,
    name: 'HiVocab Pro 1 Năm',
    periodNote: 'Thanh toán 199.000 ₫ mỗi năm',
  }),
  premium_1m: buildSku({
    id: 'premium_1m',
    tier: 'premium',
    cycleId: '1m',
    months: 1,
    days: 30,
    amount: 69000,
    name: 'HiVocab Premium 1 Tháng',
    periodNote: 'Thanh toán mỗi tháng',
  }),
  premium_3m: buildSku({
    id: 'premium_3m',
    tier: 'premium',
    cycleId: '3m',
    months: 3,
    days: 90,
    amount: 179000,
    name: 'HiVocab Premium 3 Tháng',
    periodNote: 'Thanh toán 179.000 ₫ mỗi 3 tháng',
  }),
  premium_6m: buildSku({
    id: 'premium_6m',
    tier: 'premium',
    cycleId: '6m',
    months: 6,
    days: 180,
    amount: 329000,
    name: 'HiVocab Premium 6 Tháng',
    periodNote: 'Thanh toán 329.000 ₫ mỗi 6 tháng',
  }),
  premium_1y: buildSku({
    id: 'premium_1y',
    tier: 'premium',
    cycleId: '1y',
    months: 12,
    days: 365,
    amount: 549000,
    name: 'HiVocab Premium 1 Năm',
    periodNote: 'Thanh toán 549.000 ₫ mỗi năm',
  }),
});

export const LEGACY_PLAN_NAMES = Object.freeze({
  pro_lifetime: 'HiVocab Trọn Đời (Vĩnh viễn)',
  lifetime: 'HiVocab Trọn Đời (Vĩnh viễn)',
});

export function formatVndNumber(amount) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(Number(amount) || 0));
}

export function formatVnd(amount) {
  return `${formatVndNumber(amount)} ₫`;
}

export function getPlanById(planId) {
  const key = String(planId || '').trim().toLowerCase();
  return SUBSCRIPTION_PLANS[key] || null;
}

export function getPlanForTierAndCycle(tier, cycleId = '6m') {
  const cleanTier = tier === 'premium' ? 'premium' : 'pro';
  const cleanCycle = ['1m', '3m', '6m', '1y'].includes(cycleId) ? cycleId : '6m';
  return SUBSCRIPTION_PLANS[`${cleanTier}_${cleanCycle}`];
}

export function resolveEffectiveTier(profile) {
  if (!profile) return 'free';
  if (profile.role === 'admin') return 'premium';

  const rawTier = String(profile.tier || '').toLowerCase();
  const plan = String(profile.subscription_plan || '').toLowerCase();
  const isLifetime = rawTier === 'lifetime' || plan === 'lifetime' || plan === 'pro_lifetime';
  if (isLifetime) return 'lifetime';

  const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
  const isExpired = expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt <= new Date();
  if (isExpired) return 'free';

  if (rawTier === 'premium' || plan.startsWith('premium')) {
    return 'premium';
  }
  if (rawTier === 'pro' || plan.startsWith('pro') || Boolean(profile.is_pro)) {
    return 'pro';
  }
  return 'free';
}

export function isProOrHigher(profile) {
  const tier = resolveEffectiveTier(profile);
  return tier === 'pro' || tier === 'premium' || tier === 'lifetime';
}

export function isPremiumOrHigher(profile) {
  const tier = resolveEffectiveTier(profile);
  return tier === 'premium' || tier === 'lifetime';
}

export function getPlanLimits(tier) {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function getPlanDisplayName(planId, fallbackTier = 'free') {
  const key = String(planId || '').trim().toLowerCase();
  if (SUBSCRIPTION_PLANS[key]) return SUBSCRIPTION_PLANS[key].name;
  if (LEGACY_PLAN_NAMES[key]) return LEGACY_PLAN_NAMES[key];
  if (key.startsWith('premium')) return 'HiVocab Premium';
  if (key.startsWith('pro')) return 'HiVocab Pro';
  if (fallbackTier === 'premium') return 'HiVocab Premium';
  if (fallbackTier === 'pro') return 'HiVocab Pro';
  if (fallbackTier === 'lifetime') return 'HiVocab Trọn Đời';
  return 'Tài khoản Miễn phí';
}
