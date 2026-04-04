import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function ForgotPasswordScreen() {
  const { resetPassword, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    const { error: resetError } = await resetPassword(email.trim());
    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#0F0F1A' }}
    >
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: '#F5F5F5', marginBottom: 8 }}>
          Reset password
        </Text>
        <Text style={{ fontSize: 15, color: '#8888AA', marginBottom: 36 }}>
          We'll send a reset link to your email.
        </Text>

        {sent ? (
          <View style={{ backgroundColor: '#1A2E1A', borderRadius: 16, padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>📬</Text>
            <Text style={{ color: '#4CAF50', fontWeight: '600', fontSize: 16, textAlign: 'center' }}>
              Check your email!
            </Text>
            <Text style={{ color: '#8888AA', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
              We sent a reset link to {email}
            </Text>
          </View>
        ) : (
          <View style={{ backgroundColor: '#1A1A2E', borderRadius: 16, padding: 24, gap: 16 }}>
            {error ? (
              <Text style={{ color: '#F44336', fontSize: 14 }}>{error}</Text>
            ) : null}

            <View>
              <Text style={{ color: '#8888AA', fontSize: 13, marginBottom: 6 }}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#555577"
                autoCapitalize="none"
                keyboardType="email-address"
                style={{
                  backgroundColor: '#0F0F1A',
                  borderRadius: 10,
                  padding: 14,
                  color: '#F5F5F5',
                  fontSize: 16,
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleReset}
              disabled={loading}
              style={{
                backgroundColor: '#7F77DD',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Link href="/(auth)/login">
            <Text style={{ color: '#7F77DD', fontWeight: '600' }}>← Back to login</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
