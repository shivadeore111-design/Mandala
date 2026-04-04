import '../global.css';
import { useEffect, useCallback } from 'react';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      retry: 2,
    },
  },
});

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { session, initialized, initialize } = useAuthStore();

  // Stable reference so the dependency array is satisfied
  const stableInit = useCallback(initialize, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    stableInit();
  }, [stableInit]);

  useEffect(() => {
    if (!initialized) return;

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      router.replace('/(tabs)/home');
    } else if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [session, initialized, router, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
