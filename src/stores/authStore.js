// src/stores/authStore.js
// Zustand Store quản lý trạng thái xác thực và thông tin người dùng

import { create } from 'zustand';
import {
    supabase,
    getCurrentUser,
    getUserProfile,
    isUserPro,
    signInWithGoogle as apiSignInWithGoogle,
    signInWithPassword as apiSignInWithPassword,
    signUpWithPassword as apiSignUpWithPassword,
    signOut as apiSignOut
} from '../services/supabase.js';

export const useAuthStore = create((set, get) => ({
    user: null,
    profile: null,
    isPro: false,
    loading: true,

    initialize: async () => {
        try {
            const user = await getCurrentUser();
            if (user) {
                const profile = await getUserProfile();
                const isPro = await isUserPro();
                set({ user, profile, isPro, loading: false });
            } else {
                set({ user: null, profile: null, isPro: false, loading: false });
            }
        } catch (e) {
            console.warn('[authStore] initialize error:', e);
            set({ user: null, profile: null, isPro: false, loading: false });
        }

        // Lắng nghe thay đổi auth từ Supabase
        supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user || null;
            if (currentUser) {
                const profile = await getUserProfile(true);
                const isPro = await isUserPro();
                set({ user: currentUser, profile, isPro, loading: false });
            } else {
                set({ user: null, profile: null, isPro: false, loading: false });
            }
        });
    },

    signInWithPassword: async (email, password) => {
        set({ loading: true });
        try {
            const res = await apiSignInWithPassword(email, password);
            const profile = await getUserProfile(true);
            const isPro = await isUserPro();
            set({ user: res.user, profile, isPro, loading: false });
            return res;
        } catch (err) {
            set({ loading: false });
            throw err;
        }
    },

    signUpWithPassword: async (email, password) => {
        return await apiSignUpWithPassword(email, password);
    },

    signInWithGoogle: async () => {
        return await apiSignInWithGoogle();
    },

    signOut: async () => {
        set({ loading: true });
        await apiSignOut();
        set({ user: null, profile: null, isPro: false, loading: false });
    },

    refreshProfile: async () => {
        const profile = await getUserProfile(true);
        const isPro = await isUserPro();
        set({ profile, isPro });
    }
}));
