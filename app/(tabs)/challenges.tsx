import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { captureEvent } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { COLORS } from '@/utils/colors';

type Challenge = { id: string; title: string; challenge_type: string; start_date: string; end_date: string; participant_count: number };

export default function ChallengesScreen() {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();

  const challengesQuery = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('challenges').select('id,title,challenge_type,start_date,end_date,participant_count').order('start_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Challenge[];
    }
  });

  const participantsQuery = useQuery({
    queryKey: ['challenge-participants', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from('challenge_participants').select('challenge_id,current_streak,total_checkins,status').eq('user_id', user!.id);
      if (error) throw error;
      return data ?? [];
    }
  });

  const cityLeaderboard = useQuery({
    queryKey: ['challenge-city-leaderboard', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data: me } = await supabase.from('profiles').select('location_city').eq('id', user!.id).single();
      if (!me?.location_city) return [];
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('user_id,current_streak,profiles:user_id(full_name,location_city)')
        .order('current_streak', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []).filter((item: any) => item.profiles?.location_city === me.location_city);
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase.from('challenge_participants').insert({ challenge_id: challengeId, user_id: user!.id });
      if (error) throw error;
      captureEvent('challenge_joined', { challenge_id: challengeId });
    },
    onSuccess: async () => {
      showToast('Registered for challenge', 'success');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['challenge-participants'] }),
        queryClient.invalidateQueries({ queryKey: ['challenges'] })
      ]);
    }
  });

  const checkinMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase.from('challenge_checkins').insert({ challenge_id: challengeId, user_id: user!.id, checkin_date: today });
      if (error) throw error;
    },
    onSuccess: () => showToast('Challenge check-in done', 'success'),
    onError: () => showToast('Already checked in today', 'info')
  });

  const participantsMap = useMemo(
    () => new Map((participantsQuery.data ?? []).map((p: any) => [p.challenge_id, p])),
    [participantsQuery.data]
  );

  const today = new Date().toISOString().slice(0, 10);
  const challenges = challengesQuery.data ?? [];

  const sections = {
    active: challenges.filter((c) => participantsMap.has(c.id) && participantsMap.get(c.id)?.status === 'active'),
    upcoming: challenges.filter((c) => c.start_date > today && !participantsMap.has(c.id)),
    past: challenges.filter((c) => participantsMap.has(c.id) && c.end_date < today)
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={[{ key: 'active', title: 'Active', data: sections.active }, { key: 'upcoming', title: 'Upcoming', data: sections.upcoming }, { key: 'past', title: 'Past', data: sections.past }]}
      keyExtractor={(item) => item.key}
      refreshControl={<RefreshControl refreshing={challengesQuery.isRefetching} onRefresh={challengesQuery.refetch} tintColor={COLORS.PRIMARY} />}
      renderItem={({ item: section }) => (
        <View>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.data.length ? section.data.map((challenge) => {
            const mine = participantsMap.get(challenge.id);
            return (
              <Card key={challenge.id} style={styles.card}>
                <Text style={styles.title}>{challenge.title}</Text>
                <Text style={styles.meta}>{challenge.challenge_type} · {challenge.start_date} → {challenge.end_date}</Text>
                <Text style={styles.meta}>Participants: {challenge.participant_count ?? 0}</Text>
                {mine ? <Text style={styles.meta}>My progress: {mine.total_checkins} check-ins · 🔥 {mine.current_streak}</Text> : null}
                {!mine ? <Button title="Register" onPress={() => registerMutation.mutate(challenge.id)} /> : <Button title="Daily check-in" onPress={() => checkinMutation.mutate(challenge.id)} />}
              </Card>
            );
          }) : <Text style={styles.empty}>No {section.title.toLowerCase()} challenges</Text>}
        </View>
      )}
      ListFooterComponent={
        <Card>
          <Text style={styles.sectionTitle}>City Leaderboard</Text>
          {(cityLeaderboard.data ?? []).length
            ? (cityLeaderboard.data ?? []).map((row: any, index) => <Text key={row.user_id} style={styles.meta}>{index + 1}. {row.profiles?.full_name ?? 'Seeker'} — 🔥 {row.current_streak}</Text>)
            : <Text style={styles.empty}>No city leaderboard data yet.</Text>}
        </Card>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content: { padding: 16, gap: 12, paddingBottom: 28 },
  sectionTitle: { color: COLORS.TEXT, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  card: { gap: 6, marginBottom: 8 },
  title: { color: COLORS.TEXT, fontWeight: '700', fontSize: 16 },
  meta: { color: COLORS.TEXT_MUTED, fontSize: 12 },
  empty: { color: COLORS.TEXT_MUTED, marginBottom: 6 }
});
