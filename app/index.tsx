import { Redirect } from 'expo-router';

import { useAuthStore } from '@/stores/authStore';

export default function IndexScreen() {
  const { session, isLoading } = useAuthStore();

  if (isLoading) {
    return null;
  }

  return <Redirect href={session ? '/(tabs)/home' : '/(auth)/welcome'} />;
}
