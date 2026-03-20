import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/utils/colors';

type Profile = {
  avatar_url: string | null;
  full_name: string | null;
  username: string | null;
  created_at: string;
  total_mandalas_completed: number;
  current_streak: number;
  total_practice_days: number;
  total_journal_entries: number;
};

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();

  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'avatar_url, full_name, username, created_at, total_mandalas_completed, current_streak, total_practice_days, total_journal_entries'
        )
        .eq('id', user!.id)
        .single();

      if (error) {
        throw error;
      }

      return data as Profile;
    }
  });

  const profile = profileQuery.data;

  return (
    <View style={styles.container}>
      <Card style={styles.mainCard}>
        <View style={styles.header}>
          <Avatar uri={profile?.avatar_url} name={profile?.full_name ?? user?.email ?? 'Seeker'} size={72} />
          <View>
            <Text style={styles.name}>{profile?.full_name ?? 'Seeker'}</Text>
            <Text style={styles.handle}>@{profile?.username ?? 'username'}</Text>
            <Text style={styles.meta}>
              Member since{' '}
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <Stat label="Mandalas" value={profile?.total_mandalas_completed ?? 0} />
          <Stat label="Current Streak" value={profile?.current_streak ?? 0} />
          <Stat label="Practice Days" value={profile?.total_practice_days ?? 0} />
          <Stat label="Journal Entries" value={profile?.total_journal_entries ?? 0} />
        </View>

        <Button title="Sign Out" variant="secondary" onPress={signOut} />
      </Card>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    padding: 16
  },
  mainCard: {
    gap: 18
  },
  header: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center'
  },
  name: {
    color: COLORS.TEXT,
    fontSize: 20,
    fontWeight: '700'
  },
  handle: {
    color: COLORS.TEXT_MUTED,
    fontSize: 14,
    marginTop: 2
  },
  meta: {
    color: COLORS.ACCENT,
    fontSize: 13,
    marginTop: 2
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  statCard: {
    width: '48%',
    backgroundColor: '#22223C',
    borderRadius: 12,
    padding: 12
  },
  statValue: {
    color: COLORS.TEXT,
    fontSize: 22,
    fontWeight: '700'
  },
  statLabel: {
    color: COLORS.TEXT_MUTED,
    fontSize: 12,
    marginTop: 4
  }
});
