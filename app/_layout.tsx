import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Toast } from '@/components/ui/Toast';
import { AuthProvider } from '@/hooks/useAuth';
import { initAnalytics } from '@/lib/analytics';
import { requestNotificationPermissions } from '@/lib/notifications';
import { processOfflineQueue } from '@/lib/offlineQueue';
import { configureRevenueCat } from '@/lib/revenue-cat';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { COLORS } from '@/utils/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000
    }
  }
});

function RootShell() {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  useEffect(() => {
    requestNotificationPermissions();
    initAnalytics();
  }, []);

  useEffect(() => {
    configureRevenueCat(user?.id);
  }, [user?.id]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        const synced = await processOfflineQueue();
        if (synced > 0) showToast(`Synced ${synced} offline check-ins`, 'success');
      }
    });
    return () => sub.remove();
  }, [showToast]);

  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.BACKGROUND} />
      <Slot />
      <Toast />
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootShell />
      </AuthProvider>
    </QueryClientProvider>
  );
}
