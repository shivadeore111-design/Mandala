import { Stack } from 'expo-router';

import { COLORS } from '@/utils/colors';

export default function CommunityLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.SURFACE },
        headerTintColor: COLORS.TEXT,
        contentStyle: { backgroundColor: COLORS.BACKGROUND }
      }}
    />
  );
}
