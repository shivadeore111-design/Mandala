import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, useColorScheme } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { COLORS } from '@/utils/colors';

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const systemScheme = useColorScheme();
  const [lightMode, setLightMode] = useState(systemScheme === 'light');

  const profileQuery = useQuery({
    queryKey: ['settings-profile', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url,bio,notification_daily_reminder,notification_community,notification_calendar,brahma_muhurta_alarm,brahma_muhurta_time,subscription_tier,location_visible')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const [bio, setBio] = useState('');

  const updateProfile = useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings-profile'] });
      showToast('Settings updated', 'success');
    },
    onError: () => showToast('Could not save settings', 'error')
  });

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (!uri) return;
    updateProfile.mutate({ avatar_url: uri });
  };

  const p = profileQuery.data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.section}>Profile</Text>
        <Pressable onPress={pickAvatar}><Avatar uri={p?.avatar_url} name={user?.email ?? 'Seeker'} size={60} /></Pressable>
        <TextInput
          style={styles.input}
          placeholder="Write your bio"
          placeholderTextColor={COLORS.TEXT_MUTED}
          value={bio || p?.bio || ''}
          onChangeText={setBio}
          returnKeyType="done"
        />
        <Button title="Save bio" onPress={() => updateProfile.mutate({ bio })} />
      </Card>

      <Card><Text style={styles.section}>Notifications</Text>
        <Toggle label="Daily reminder" value={Boolean(p?.notification_daily_reminder)} onChange={(v) => updateProfile.mutate({ notification_daily_reminder: v })} />
        <Toggle label="Community" value={Boolean(p?.notification_community)} onChange={(v) => updateProfile.mutate({ notification_community: v })} />
        <Toggle label="Calendar" value={Boolean(p?.notification_calendar)} onChange={(v) => updateProfile.mutate({ notification_calendar: v })} />
      </Card>

      <Card><Text style={styles.section}>Brahma Muhurta</Text>
        <Toggle label="Alarm" value={Boolean(p?.brahma_muhurta_alarm)} onChange={(v) => updateProfile.mutate({ brahma_muhurta_alarm: v })} />
        <TextInput style={styles.input} value={p?.brahma_muhurta_time ?? '05:00:00'} onChangeText={(v) => updateProfile.mutate({ brahma_muhurta_time: v })} keyboardType="numbers-and-punctuation" returnKeyType="done"/>
      </Card>

      <Card><Text style={styles.section}>Subscription</Text>
        <Text style={styles.meta}>Current tier: {p?.subscription_tier ?? 'free'}</Text>
        <Link href="/settings/subscription" asChild><Button title="Manage" /></Link>
      </Card>

      <Card><Text style={styles.section}>Privacy + Appearance</Text>
        <Toggle label="Location visible" value={Boolean(p?.location_visible)} onChange={(v) => updateProfile.mutate({ location_visible: v })} />
        <Toggle label="Light mode" value={lightMode} onChange={setLightMode} />
      </Card>

      <Card><Text style={styles.section}>Data</Text>
        <Button title="Export my data" variant="secondary" onPress={() => showToast('Export coming soon', 'info')} />
        <Button title="Delete account" variant="secondary" onPress={() => showToast('Delete flow requires backend hard-delete', 'info')} />
      </Card>

      <Card><Text style={styles.section}>About</Text>
        <Text style={styles.meta}>Version 0.1.0</Text>
        <Text style={styles.link} onPress={() => router.push('https://mandala.app/privacy' as any)}>Privacy Policy</Text>
        <Text style={styles.link} onPress={() => router.push('https://mandala.app/terms' as any)}>Terms</Text>
      </Card>

      <Button title="Sign Out" variant="secondary" onPress={signOut} />
    </ScrollView>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (next: boolean) => void }) {
  return <View style={styles.row}><Text style={styles.meta}>{label}</Text><Switch value={value} onValueChange={onChange} /></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { color: COLORS.TEXT, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#323252', borderRadius: 10, color: COLORS.TEXT, padding: 10, marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  meta: { color: COLORS.TEXT_MUTED },
  link: { color: COLORS.PRIMARY, marginTop: 6 }
});
