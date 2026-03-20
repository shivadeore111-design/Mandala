import { Stack } from 'expo-router';

import { COLORS } from '@/utils/colors';

export default function JournalLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.SURFACE },
        headerTintColor: COLORS.TEXT,
        contentStyle: { backgroundColor: COLORS.BACKGROUND }
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Journal' }} />
      <Stack.Screen name="new" options={{ title: 'New Entry' }} />
      <Stack.Screen name="[id]" options={{ title: 'Edit Entry' }} />
    </Stack>
  );
}
