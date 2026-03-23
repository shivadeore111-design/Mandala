import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const t = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    inner: { flex: 1, padding: 24, justifyContent: 'center' },
    logo: { alignItems: 'center', marginBottom: 40 },
    logoText: { fontSize: 32, fontWeight: '800', color: t.orange, letterSpacing: 1 },
    logoSub: { fontSize: 14, color: t.text3, marginTop: 4, letterSpacing: 0.5 },
    card: {
      backgroundColor: t.bg,
      borderRadius: 20,
      padding: 24,
      shadowColor: t.shadowDark,
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 8,
    },
    label: { fontSize: 11, fontWeight: '700', color: t.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
    input: {
      backgroundColor: t.surface2,
      borderRadius: 10,
      padding: 14,
      fontSize: 15,
      color: t.text,
      marginBottom: 14,
      shadowColor: t.shadowDark,
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 5,
      elevation: 2,
    },
    btn: {
      backgroundColor: t.orange,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      marginTop: 8,
      shadowColor: t.shadowDark,
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 4,
    },
    btnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
    toggle: { alignItems: 'center', marginTop: 20 },
    toggleText: { fontSize: 14, color: t.text3 },
    toggleLink: { color: t.orange, fontWeight: '700' },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 20 },
  });

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert('Please fill in all fields');
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!fullName) return Alert.alert('Please enter your full name');
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, username: email.split('@')[0] } },
        });
        if (error) throw error;
        Alert.alert('Check your email to confirm your account!');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <View style={s.logo}>
          <Text style={s.logoText}>📿 Mandala</Text>
          <Text style={s.logoSub}>Your Sacred Sadhana Companion</Text>
        </View>

        <View style={s.card}>
          <Text style={[s.label, { marginBottom: 20, fontSize: 16, fontWeight: '800', textTransform: 'none', color: t.text }]}>
            {isLogin ? 'Namaskaram 🙏' : 'Begin Your Journey'}
          </Text>

          {!isLogin && (
            <>
              <Text style={s.label}>Full Name</Text>
              <TextInput style={s.input} placeholder="Your name" placeholderTextColor={t.text3} value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            </>
          )}

          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} placeholder="you@example.com" placeholderTextColor={t.text3} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} placeholder="••••••••" placeholderTextColor={t.text3} value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity style={s.btn} onPress={handleAuth} disabled={loading}>
            <Text style={s.btnText}>{loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.toggle} onPress={() => setIsLogin(!isLogin)}>
          <Text style={s.toggleText}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Text style={s.toggleLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
