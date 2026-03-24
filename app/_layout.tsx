import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Slot, useSegments } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const queryClient = new QueryClient();

function AuthGate() {
  const segments = useSegments();
  const { user, setUser, fetchProfile } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) fetchProfile(sessionUser.id);
      setReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) fetchProfile(sessionUser.id);
    });

    return () => data.subscription.unsubscribe();
  }, [fetchProfile, setUser]);

  const inAuth = useMemo(() => segments[0] === '(auth)', [segments]);

  if (!ready) return null;
  if (!user && !inAuth) return <Redirect href="/(auth)/login" />;
  if (user && inAuth) return <Redirect href="/(tabs)/home" />;

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
    </QueryClientProvider>
  );
}
