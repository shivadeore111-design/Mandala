import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useRef } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ShareCard } from '@/components/mandala/ShareCard';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSubscription } from '@/hooks/useSubscription';
import { captureAndShare } from '@/lib/share';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/utils/colors';
import { BADGES } from '@/utils/badgeChecker';

type Profile = {
  avatar_url: string | null;
  full_name: string | null;
  username: string | null;
  created_at: string;
  total_mandalas_completed: number;
  current_streak: number;
  total_practice_days: number;
  total_journal_entries: number;
  badges: string[] | null;
};

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { isPremium } = useSubscription();
  const shareRef = useRef(null);

  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, full_name, username, created_at, total_mandalas_completed, current_streak, total_practice_days, total_journal_entries, badges')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data as Profile;
    }
  });

  const profile = profileQuery.data;
  const earned = new Set(profile?.badges ?? []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={profileQuery.isRefetching} onRefresh={profileQuery.refetch} tintColor={COLORS.PRIMARY} />}>
      <Card style={styles.mainCard}>
        <View style={styles.header}>
          <Avatar uri={profile?.avatar_url} name={profile?.full_name ?? user?.email ?? 'Seeker'} size={72} />
          <View>
            <Text style={styles.name}>{profile?.full_name ?? 'Seeker'}</Text>
            <Text style={styles.handle}>@{profile?.username ?? 'username'}</Text>
            <Text style={styles.meta}>Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <Stat label="Mandalas" value={profile?.total_mandalas_completed ?? 0} />
          <Stat label="Current Streak" value={profile?.current_streak ?? 0} />
          <Stat label="Practice Days" value={profile?.total_practice_days ?? 0} />
          <Stat label="Journal Entries" value={profile?.total_journal_entries ?? 0} />
        </View>

        <View collapsable={false} ref={shareRef}><ShareCard practiceName="My Mandala" dayLabel={(profile?.current_streak ?? 0) >= 40 ? 'COMPLETE 🔱' : `Day ${profile?.current_streak ?? 0} of 40`} streak={profile?.current_streak ?? 0} showWatermark={!isPremium} /></View>
        <Button title="Share my card" onPress={() => captureAndShare(shareRef, 'My mandala journey')} />
        <Link href="/settings" asChild><Button title="Settings" variant="secondary" /></Link>
        <Button title="Sign Out" variant="secondary" onPress={signOut} />
      </Card>

      <Card>
        <Text style={styles.badgeTitle}>Badges</Text>
        <View style={styles.badgeGrid}>
          {BADGES.map((badge) => (
            <View key={badge.id} style={[styles.badgeItem, !earned.has(badge.id) && styles.badgeMuted]}>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeMeta}>{badge.rarity}</Text>
              {!earned.has(badge.id) ? <Text style={styles.badgeMeta}>Locked</Text> : null}
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <View style={styles.statCard}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content: { padding: 16, gap: 12, paddingBottom: 30 },
  mainCard: { gap: 18 },
  header: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  name: { color: COLORS.TEXT, fontSize: 20, fontWeight: '700' },
  handle: { color: COLORS.TEXT_MUTED, fontSize: 14, marginTop: 2 },
  meta: { color: COLORS.ACCENT, fontSize: 13, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', backgroundColor: '#22223C', borderRadius: 12, padding: 12 },
  statValue: { color: COLORS.TEXT, fontSize: 22, fontWeight: '700' },
  statLabel: { color: COLORS.TEXT_MUTED, fontSize: 12, marginTop: 4 },
  badgeTitle: { color: COLORS.TEXT, fontSize: 18, fontWeight: '700' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  badgeItem: { width: '48%', borderRadius: 10, borderWidth: 1, borderColor: '#524284', padding: 10 },
  badgeMuted: { borderColor: '#2F2F42', opacity: 0.5 },
  badgeName: { color: COLORS.TEXT, fontWeight: '600' },
  badgeMeta: { color: COLORS.TEXT_MUTED, fontSize: 12 }
});
