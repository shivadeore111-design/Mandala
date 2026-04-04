import { View, Text } from 'react-native';

export default function CommunityScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F1A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
      <Text style={{ fontSize: 48, marginBottom: 20 }}>🌐</Text>
      <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 22, textAlign: 'center', marginBottom: 12 }}>
        Community
      </Text>
      <Text style={{ color: '#8888AA', fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
        Connect with fellow seekers, join circles, and share your journey.{'\n\n'}Coming soon.
      </Text>
    </View>
  );
}
