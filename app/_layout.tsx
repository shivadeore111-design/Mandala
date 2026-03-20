import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Toast } from '@/components/ui/Toast';
import { AuthProvider } from '@/hooks/useAuth';
import { COLORS } from '@/utils/colors';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" backgroundColor={COLORS.BACKGROUND} />
        <Slot />
        <Toast />
      </AuthProvider>
    </QueryClientProvider>
  );
}
