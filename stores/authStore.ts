import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';

interface AuthState {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (user: any) => void;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,

  setUser: (user) => set({ user, loading: false }),
  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) set({ profile: data });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
