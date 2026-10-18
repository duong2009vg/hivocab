// src/lib/supabaseClient.js
// Singleton Supabase JS client — owned entirely by React bundle.
// Does NOT depend on window.HiDB or CDN supabase script.
// Uses the same credentials as dataLayer.js so they share the same
// Supabase project (auth sessions are interoperable via cookies/localStorage).

import { createClient } from '@supabase/supabase-js';
import { assertClientConfiguration, SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/runtime.js';

assertClientConfiguration();

// Single instance shared across entire React app
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Share the same localStorage key as CDN supabase so sessions are in sync
    storageKey: 'sb-swehdtrqjyklmsefkjdf-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
