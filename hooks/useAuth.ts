import { useEffect } from 'react';
import { PropsWithChildren } from 'react';
import { useRouter, useSegments } from 'expo-router';

import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  return useAuthStore();
}

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const segments = useSegments();
  const { session, initialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const isAuthRoute = segments[0] === '(auth)';

    if (session && isAuthRoute) {
      router.replace('/(tabs)/home');
      return;
    }

    if (!session && !isAuthRoute) {
      router.replace('/(auth)/welcome');
    }
  }, [initialized, router, segments, session]);

  return children;
}
