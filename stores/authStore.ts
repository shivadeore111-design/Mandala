import { create } from 'zustand';
import {
  signIn as apiSignIn,
  signUp as apiSignUp,
  signOut as apiSignOut,
  getMe,
  requestPasswordReset,
} from '@/lib/api';
import type { AppUser } from '@/lib/api';
import { saveToken, getToken, clearToken, saveUser, getUser, clearUser } from '@/lib/storage';

type AuthState = {
  session: string | null;
  user: AppUser | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    const token = await getToken();
    if (token) {
      try {
        const { user } = await getMe();
        await saveUser(user);
        set({ session: token, user, initialized: true });
      } catch {
        await clearToken();
        await clearUser();
        set({ session: null, user: null, initialized: true });
      }
    } else {
      const user = await getUser();
      set({ session: null, user, initialized: true });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const { user, token } = await apiSignIn(email, password);
      await saveToken(token);
      await saveUser(user);
      set({ session: token, user, loading: false });
      return { error: null };
    } catch (err) {
      set({ loading: false });
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  signUp: async (email, password, displayName) => {
    set({ loading: true });
    try {
      const { user, token } = await apiSignUp(email, password, displayName);
      await saveToken(token);
      await saveUser(user);
      set({ session: token, user, loading: false });
      return { error: null };
    } catch (err) {
      set({ loading: false });
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  signOut: async () => {
    try { await apiSignOut(); } catch { /* ignore network errors on logout */ }
    await clearToken();
    await clearUser();
    set({ session: null, user: null });
  },

  resetPassword: async (email) => {
    try {
      await requestPasswordReset(email);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  },
}));
