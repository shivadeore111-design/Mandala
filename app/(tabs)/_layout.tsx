import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F0F1A',
          borderTopColor: '#1A1A2E',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#AFA9EC',
        tabBarInactiveTintColor: '#555577',
        tabBarLabelStyle: { fontSize: 11, marginBottom: 4 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: () => <TabIcon emoji="🏠" />,
        }}
      />
      <Tabs.Screen
        name="mandalas"
        options={{
          title: 'Mandalas',
          tabBarIcon: () => <TabIcon emoji="🔱" />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: () => <TabIcon emoji="🌐" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: () => <TabIcon emoji="👤" />,
        }}
      />
    </Tabs>
  );
}
