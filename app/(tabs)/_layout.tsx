import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { COLORS } from '@/utils/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.SURFACE },
        headerTintColor: COLORS.TEXT,
        sceneStyle: { backgroundColor: COLORS.BACKGROUND },
        tabBarStyle: { backgroundColor: COLORS.SURFACE, borderTopColor: '#2A2A4E' },
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.TEXT_MUTED,
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            home: 'home-outline',
            community: 'people-outline',
            challenges: 'flag-outline',
            calendar: 'calendar-outline',
            profile: 'person-outline'
          };

          return <Ionicons name={iconMap[route.name] || 'ellipse-outline'} color={color} size={size} />;
        }
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen name="challenges" options={{ title: 'Challenges' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
