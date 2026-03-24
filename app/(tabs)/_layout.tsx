import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

const tabs = [
  { name: 'home', label: 'Home', icon: '⌂' },
  { name: 'sadhana', label: 'Sadhana', icon: '◎' },
  { name: 'mandala', label: 'Mandala', icon: '📿' },
  { name: 'journal', label: 'Journal', icon: '✍' },
  { name: 'gallery', label: 'Gallery', icon: '◇' },
] as const;

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, height: 74 },
        tabBarActiveTintColor: theme.colors.orange,
        tabBarInactiveTintColor: theme.colors.text3,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color, focused }) => (
              <View style={{ alignItems: 'center', gap: 2 }}>
                <Text style={{ color, fontSize: 16 }}>{tab.icon}</Text>
                {focused ? <View style={{ width: 6, height: 6, borderRadius: 99, backgroundColor: theme.colors.orange }} /> : null}
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
