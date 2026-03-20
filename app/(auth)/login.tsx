import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/stores/uiStore';
import { COLORS } from '@/utils/colors';

export default function LoginScreen() {
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      showToast(authError.message, 'error');
      return;
    }

    showToast('Signed in successfully', 'success');
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <Input label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input label="Password" secureTextEntry value={password} onChangeText={setPassword} error={error ?? undefined} />
        <Button title="Sign In" onPress={handleLogin} loading={loading} />
        <Link href="/(auth)/signup" style={styles.link}>
          Need an account? Sign up
        </Link>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    padding: 24
  },
  card: {
    gap: 12
  },
  title: {
    color: COLORS.TEXT,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4
  },
  link: {
    color: COLORS.PRIMARY,
    textAlign: 'center',
    marginTop: 6
  }
});
