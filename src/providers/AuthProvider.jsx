// src/providers/AuthProvider.jsx
// Centralized Authentication Provider for HiVocab React
// Uses native @supabase/supabase-js client — no dependency on window.HiDB for auth events.
// Legacy scripts (dataLayer.js) still manage their own auth state independently.
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  error: null,
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Get current session immediately from localStorage (synchronous in practice)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s ?? null);
      setUser(s?.user ?? null);
      setLoading(false);

      // Sync to DOM & legacy scripts
      const u = s?.user ?? null;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('user-logged-in', !!u);
      }
      if (typeof window !== 'undefined') window._currentUser = u;
    });

    // 2. Subscribe to future auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      const newUser = newSession?.user ?? null;
      setSession(newSession ?? null);
      setUser(newUser);
      setLoading(false);

      // Sync to DOM & legacy scripts
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('user-logged-in', !!newUser);
      }
      if (typeof window !== 'undefined') {
        window._currentUser = newUser;
      }

      if (event === 'PASSWORD_RECOVERY') {
        window._isPasswordRecoveryMode = true;
        if (typeof window.openResetPasswordModal === 'function') {
          window.openResetPasswordModal();
        }
      }

      // Also notify legacy dataLayer if it's ready (keeps HiDB auth state in sync)
      if (typeof window !== 'undefined' && window.HiDB && typeof window.HiDB._onAuthChange === 'function') {
        window.HiDB._onAuthChange(event, newSession);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email, password, captchaToken) => {
    setError(null);
    // Delegate to legacy HiDB if available (handles captcha + custom logic)
    if (typeof window !== 'undefined' && window.HiDB?.signInWithPassword) {
      const res = await window.HiDB.signInWithPassword(email, password, captchaToken);
      if (res?.user) {
        setUser(res.user);
        setSession(res.session);
      }
      return res;
    }
    // Fallback: use native Supabase client
    const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) throw e;
    return data;
  }, []);

  const signUpWithEmail = useCallback(async (email, password, captchaToken) => {
    setError(null);
    if (typeof window !== 'undefined' && window.HiDB?.signUpWithPassword) {
      return window.HiDB.signUpWithPassword(email, password, captchaToken);
    }
    const { data, error: e } = await supabase.auth.signUp({ email, password });
    if (e) throw e;
    return data;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (typeof window !== 'undefined' && typeof window.handleGoogleLogin === 'function') {
      return window.handleGoogleLogin();
    }
    if (typeof window !== 'undefined' && window.HiDB?.signInWithGoogle) {
      return window.HiDB.signInWithGoogle();
    }
    return supabase.auth.signInWithOAuth({ provider: 'google' });
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await supabase.auth.signOut();
      // Also sign out legacy layer if present
      if (typeof window !== 'undefined' && window.HiDB?.signOut) {
        await window.HiDB.signOut().catch(() => {});
      }
    } finally {
      setUser(null);
      setSession(null);
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('user-logged-in');
      }
      if (typeof window !== 'undefined') {
        window._currentUser = null;
        if (typeof window.navigateTo === 'function') {
          window.navigateTo('landing');
        }
      }
    }
  }, []);

  const value = {
    user,
    session,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
