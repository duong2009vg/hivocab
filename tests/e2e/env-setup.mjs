// tests/e2e/env-setup.mjs
// Environment bootstrapping for Node.js E2E tests

process.env.VITE_SUPABASE_URL ||= 'https://unit-test.invalid.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY ||= 'unit-test-anon-key';

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class MockWebSocket {};
}
