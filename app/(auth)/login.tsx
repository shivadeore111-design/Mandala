import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const theme = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
    if (!email || !password) return;
    const fn = isSignUp ? supabase.auth.signUp : supabase.auth.signInWithPassword;
    const { error } = await fn({ email, password });
    if (error) Alert.alert('Auth error', error.message);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, theme.shadow.raised]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Mandala</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text2 }]}>Sacred Sadhana Tracker</Text>

        <TextInput placeholder="Email" placeholderTextColor={theme.colors.text3} style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surface2 }]} value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput placeholder="Password" placeholderTextColor={theme.colors.text3} secureTextEntry style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surface2 }]} value={password} onChangeText={setPassword} />

        <Pressable onPress={submit} style={[styles.button, { backgroundColor: theme.colors.orange }]}>
          <Text style={styles.buttonText}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
        </Pressable>

        <Pressable onPress={() => setIsSignUp((v) => !v)}>
          <Text style={{ color: theme.colors.text2, textAlign: 'center' }}>
            {isSignUp ? 'Already have an account? Sign in' : "New here? Create an account"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { borderWidth: 1, borderRadius: 24, padding: 20, gap: 12 },
  title: { fontSize: 34, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 8 },
  input: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  button: { borderRadius: 16, paddingVertical: 12, marginTop: 6 },
  buttonText: { color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 16 },
});
