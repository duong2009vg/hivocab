// Runtime configuration for the React client.
// Public values are injected by Vite; secrets must stay in Cloudflare/Supabase
// environment bindings and must never be placed in this file.

const viteEnv = import.meta.env || {};
const nodeEnv = typeof process !== "undefined" ? process.env : {};

export const SUPABASE_URL = String(
  viteEnv.VITE_SUPABASE_URL || nodeEnv.VITE_SUPABASE_URL || "",
).trim();
export const SUPABASE_ANON_KEY = String(
  viteEnv.VITE_SUPABASE_ANON_KEY || nodeEnv.VITE_SUPABASE_ANON_KEY || "",
).trim();
export const TURNSTILE_SITE_KEY = String(
  viteEnv.VITE_TURNSTILE_SITE_KEY || nodeEnv.VITE_TURNSTILE_SITE_KEY || "",
).trim();

export function assertClientConfiguration() {
  const missing = [];
  if (!SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("VITE_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Thiếu cấu hình frontend: ${missing.join(", ")}. Hãy tạo .env.local từ .env.example.`,
    );
  }
}
