// src/providers/AuthProvider.jsx
// Centralized Authentication Provider for HiVocab React
// Synchronizes Auth state, Profile, PRO Subscription & Admin Role
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { clearTopicCache } from '../services/db.js';

export function checkIsPro(profile) {
  if (!profile) return false;
  const plan = String(profile.subscription_plan || '').toLowerCase();
  const isProTier = (
    profile.tier === 'pro' ||
    profile.tier === 'lifetime' ||
    plan === 'lifetime' ||
    plan.startsWith('pro') ||
    Boolean(profile.is_pro)
  );
  if (!isProTier) return false;
  if (profile.tier === 'lifetime' || plan === 'lifetime' || plan === 'pro_lifetime') {
    return true;
  }
  if (!profile.subscription_expires_at) {
    return isProTier;
  }
  return new Date(profile.subscription_expires_at) > new Date();
}

const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  isPro: false,
  accessMode: 'pro',
  setAccessMode: () => {},
  toggleAccessMode: () => {},
  isAdmin: false,
  loading: true,
  error: null,
  refreshProfile: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, tier, subscription_plan, subscription_status, subscription_started_at, subscription_expires_at, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (err) {
        console.warn('[AuthProvider] fetchProfile error:', err.message);
        return null;
      }
      setProfile(data);
      return data;
    } catch (e) {
      console.warn('[AuthProvider] fetchProfile exception:', e);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      return fetchProfile(user.id);
    }
    return null;
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    // 1. Get current session immediately from localStorage (synchronous in practice)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s ?? null);
      const u = s?.user ?? null;
      setUser(u);

      if (u) {
        fetchProfile(u.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }

      // Sync to DOM & legacy scripts
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

      if (newUser) {
        fetchProfile(newUser.id).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }

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

      if (event === 'SIGNED_IN' && newUser) {
        if (typeof window !== 'undefined' && typeof window.navigateTo === 'function') {
          const hash = (window.location.hash || '').replace(/^#/, '');
          const path = (window.location.pathname || '').replace(/^\/+/, '');
          if (!hash || hash === 'landing' || hash === 'login' || path === 'login' || path === '') {
            window.navigateTo('dashboard');
          }
        }
      }

    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signInWithEmail = useCallback(async (email, password, captchaToken) => {
    setError(null);
    const authParams = { email, password };
    if (captchaToken) {
      authParams.options = { captchaToken };
    }
    const { data, error: e } = await supabase.auth.signInWithPassword(authParams);
    if (e) throw e;
    if (data?.user) {
      setUser(data.user);
      setSession(data.session);
      await fetchProfile(data.user.id);
    }
    return data;
  }, [fetchProfile]);

  const signUpWithEmail = useCallback(async (email, password, captchaToken) => {
    setError(null);
    const signUpOptions = { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined };
    if (captchaToken) {
      signUpOptions.captchaToken = captchaToken;
    }
    const { data, error: e } = await supabase.auth.signUp({ email, password, options: signUpOptions });
    if (e) throw e;
    return data;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    return supabase.auth.signInWithOAuth({ provider: 'google' });
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('hivocab_guest_entered');
      }
      // Clear the current user's scoped cache while the auth UID is still available.
      clearTopicCache();
      await supabase.auth.signOut();
    } finally {
      clearTopicCache();
      setUser(null);
      setSession(null);
      setProfile(null);
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

  // Access Mode: 'pro' (Chế độ bản quyền chuẩn) | 'free' (Mở khóa toàn bộ học liệu & pop-up)
  const [accessMode, setAccessModeState] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('hivocab_access_mode');
        if (saved === 'free' || saved === 'pro') return saved;
      }
    } catch (_) {}
    return 'pro';
  });

  const setAccessMode = useCallback((newMode) => {
    const validMode = newMode === 'free' ? 'free' : 'pro';
    setAccessModeState(validMode);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('hivocab_access_mode', validMode);
        window._hivocabAccessMode = validMode;
        window.dispatchEvent(new CustomEvent('hivocab:access-mode-changed', { detail: { mode: validMode } }));
      }
    } catch (_) {}
  }, []);

  const toggleAccessMode = useCallback(() => {
    setAccessMode(accessMode === 'free' ? 'pro' : 'free');
  }, [accessMode, setAccessMode]);

  const isPro = accessMode === 'free' || checkIsPro(profile);
  const isAdmin = Boolean(profile?.role === 'admin');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window._isUserPro = isPro;
      window._hivocabAccessMode = accessMode;
    }
  }, [isPro, accessMode]);

  const value = {
    user,
    session,
    profile,
    isPro,
    accessMode,
    setAccessMode,
    toggleAccessMode,
    isAdmin,
    loading,
    error,
    refreshProfile,
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
