import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function WelcomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F1A', padding: 24, justifyContent: 'center', gap: 16 }}>
      <Text style={{ color: '#F5F5F5', fontSize: 32, fontWeight: '700' }}>Welcome to Mandala</Text>
      <Text style={{ color: '#8888AA', fontSize: 16 }}>Your spiritual practice companion.</Text>
      <Link href="/(auth)/login" style={{ color: '#FF6B35', fontSize: 18 }}>Login</Link>
      <Link href="/(auth)/signup" style={{ color: '#FF6B35', fontSize: 18 }}>Create account</Link>
    </View>
  );
}
