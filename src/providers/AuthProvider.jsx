// src/providers/AuthProvider.jsx
// Centralized Authentication Provider for HiVocab React
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

  // Initialize and listen for Supabase auth state changes
  useEffect(() => {
    let unsubscribe = null;

    const setupAuthListener = () => {
      if (typeof window !== 'undefined' && window.HiDB && typeof window.HiDB.onAuthStateChange === 'function') {
        const { data } = window.HiDB.onAuthStateChange((event, newSession) => {
          const newUser = newSession?.user || null;
          setSession(newSession || null);
          setUser(newUser);
          setLoading(false);

          // Sync with DOM & legacy scripts
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
        });

        if (data && typeof data.unsubscribe === 'function') {
          unsubscribe = data.unsubscribe;
        }

        // Fetch current user initially
        if (typeof window.HiDB.getCurrentUser === 'function') {
          window.HiDB.getCurrentUser()
            .then(u => {
              if (u) {
                setUser(u);
                if (typeof document !== 'undefined') {
                  document.documentElement.classList.add('user-logged-in');
                }
              }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      } else {
        // Retry shortly if HiDB is still initializing
        const timer = setTimeout(setupAuthListener, 150);
        return () => clearTimeout(timer);
      }
    };

    const cleanup = setupAuthListener();

    return () => {
      if (typeof cleanup === 'function') cleanup();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email, password, captchaToken) => {
    setError(null);
    if (typeof window === 'undefined' || !window.HiDB) {
      throw new Error('Hệ thống cơ sở dữ liệu chưa sẵn sàng.');
    }
    const res = await window.HiDB.signInWithPassword(email, password, captchaToken);
    if (res?.user) {
      setUser(res.user);
      setSession(res.session);
    }
    return res;
  }, []);

  const signUpWithEmail = useCallback(async (email, password, captchaToken) => {
    setError(null);
    if (typeof window === 'undefined' || !window.HiDB) {
      throw new Error('Hệ thống cơ sở dữ liệu chưa sẵn sàng.');
    }
    const res = await window.HiDB.signUpWithPassword(email, password, captchaToken);
    return res;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (typeof window === 'undefined' || !window.HiDB) {
      throw new Error('Hệ thống cơ sở dữ liệu chưa sẵn sàng.');
    }
    if (typeof window.handleGoogleLogin === 'function') {
      return window.handleGoogleLogin();
    }
    return window.HiDB.signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      if (typeof window !== 'undefined' && window.HiDB && typeof window.HiDB.signOut === 'function') {
        await window.HiDB.signOut();
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
