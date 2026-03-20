import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/stores/uiStore';
import { COLORS } from '@/utils/colors';

export default function SignupScreen() {
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim()
        }
      }
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      showToast(authError.message, 'error');
      return;
    }

    showToast('Account created successfully', 'success');
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Create your account</Text>
        <Input label="Full Name" value={fullName} onChangeText={setFullName} />
        <Input label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input label="Password" secureTextEntry value={password} onChangeText={setPassword} error={error ?? undefined} />
        <Button title="Create Account" onPress={handleSignup} loading={loading} />
        <Link href="/(auth)/login" style={styles.link}>
          Already have an account? Log in
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
