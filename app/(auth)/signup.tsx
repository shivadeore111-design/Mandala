import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    const { error: signUpError } = await signUp(email.trim(), password, name.trim());
    if (signUpError) {
      setError(signUpError.message);
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const inputStyle = {
    backgroundColor: '#0F0F1A',
    borderRadius: 10,
    padding: 14,
    color: '#F5F5F5',
    fontSize: 16,
  } as const;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#0F0F1A' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#F5F5F5', marginBottom: 8 }}>
          Begin your journey
        </Text>
        <Text style={{ fontSize: 15, color: '#8888AA', marginBottom: 36 }}>
          Create your Mandala account
        </Text>

        <View style={{ backgroundColor: '#1A1A2E', borderRadius: 16, padding: 24, gap: 16 }}>
          {error ? (
            <Text style={{ color: '#F44336', fontSize: 14 }}>{error}</Text>
          ) : null}

          <View>
            <Text style={{ color: '#8888AA', fontSize: 13, marginBottom: 6 }}>Display name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#555577"
              style={inputStyle}
            />
          </View>

          <View>
            <Text style={{ color: '#8888AA', fontSize: 13, marginBottom: 6 }}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#555577"
              autoCapitalize="none"
              keyboardType="email-address"
              style={inputStyle}
            />
          </View>

          <View>
            <Text style={{ color: '#8888AA', fontSize: 13, marginBottom: 6 }}>
              Password <Text style={{ color: '#555577' }}>(min 8 chars)</Text>
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#555577"
              secureTextEntry
              style={inputStyle}
            />
          </View>

          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            style={{
              backgroundColor: '#7F77DD',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 32 }}>
          <Text style={{ color: '#8888AA' }}>Already have an account? </Text>
          <Link href="/(auth)/login">
            <Text style={{ color: '#7F77DD', fontWeight: '600' }}>Sign in</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
