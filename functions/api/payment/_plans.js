// functions/api/payment/_plans.js
// Server-authoritative subscription plan catalog for PayOS checkout & verification.
// Prices and durations are strictly controlled on the server (never trusted from client).

export const SERVER_PLANS = Object.freeze({
  pro_1m: {
    id: 'pro_1m',
    tier: 'pro',
    name: 'HiVocab Pro 1 Tháng',
    amount: 25000,
    days: 30,
  },
  pro_3m: {
    id: 'pro_3m',
    tier: 'pro',
    name: 'HiVocab Pro 3 Tháng',
    amount: 65000,
    days: 90,
  },
  pro_6m: {
    id: 'pro_6m',
    tier: 'pro',
    name: 'HiVocab Pro 6 Tháng',
    amount: 119000,
    days: 180,
  },
  pro_1y: {
    id: 'pro_1y',
    tier: 'pro',
    name: 'HiVocab Pro 1 Năm',
    amount: 199000,
    days: 365,
  },
  premium_1m: {
    id: 'premium_1m',
    tier: 'premium',
    name: 'HiVocab Premium 1 Tháng',
    amount: 69000,
    days: 30,
  },
  premium_3m: {
    id: 'premium_3m',
    tier: 'premium',
    name: 'HiVocab Premium 3 Tháng',
    amount: 179000,
    days: 90,
  },
  premium_6m: {
    id: 'premium_6m',
    tier: 'premium',
    name: 'HiVocab Premium 6 Tháng',
    amount: 329000,
    days: 180,
  },
  premium_1y: {
    id: 'premium_1y',
    tier: 'premium',
    name: 'HiVocab Premium 1 Năm',
    amount: 549000,
    days: 365,
  },
});

export function getServerPlan(planId) {
  const key = String(planId || '').trim().toLowerCase();
  return SERVER_PLANS[key] || null;
}
