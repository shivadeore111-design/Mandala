import { PropsWithChildren, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  return useAuthStore();
}

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const segments = useSegments();
  const { session, setSession, setUser, setIsLoading } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) {
        return;
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    };

    loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setIsLoading, setSession, setUser]);

  useEffect(() => {
    const isAuthRoute = segments[0] === '(auth)';

    if (session && isAuthRoute) {
      router.replace('/(tabs)/home');
      return;
    }

    if (!session && !isAuthRoute) {
      router.replace('/(auth)/welcome');
    }
  }, [router, segments, session]);

  return children;
}
