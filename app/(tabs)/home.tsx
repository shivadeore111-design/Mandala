import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { MandalaCard } from '@/components/mandala/MandalaCard';
import { ShareCard } from '@/components/mandala/ShareCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useActiveMandalas } from '@/hooks/useMandala';
import { useSubscription } from '@/hooks/useSubscription';
import { captureAndShare } from '@/lib/share';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/utils/colors';

type DailyContemplation = { quote: string; reflection: string; journal_prompt: string };

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isPremium } = useSubscription();
  const mandalasQuery = useActiveMandalas();
  const [expanded, setExpanded] = useState(false);
  const shareRef = useRef(null);

  const contemplationQuery = useQuery({
    queryKey: ['daily-contemplation', new Date().toISOString().slice(0, 10)],
    staleTime: 300_000,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase.from('daily_contemplations').select('quote, reflection, journal_prompt').eq('contemplation_date', today).maybeSingle();
      if (error) throw error;
      return data as DailyContemplation | null;
    }
  });

  const name = useMemo(() => user?.user_metadata?.full_name?.split(' ')[0] ?? 'Seeker', [user]);
  const contemplation = contemplationQuery.data ?? null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={mandalasQuery.isRefetching} onRefresh={mandalasQuery.refetch} tintColor={COLORS.PRIMARY} />}
    >
      <Text style={styles.header}>{`Good morning, ${name} 🙏`}</Text>
      <View collapsable={false} ref={shareRef}><ShareCard practiceName="Mandala Journey" dayLabel="Day X of 40" streak={mandalasQuery.data?.[0]?.current_streak ?? 0} showWatermark={!isPremium} /></View>

      {contemplation ? (
        <Card>
          <Pressable onPress={() => setExpanded((prev) => !prev)}>
            <Text style={styles.sectionTitle}>Daily Contemplation</Text>
            <Text style={styles.quote} numberOfLines={expanded ? undefined : 2}>“{contemplation.quote}”</Text>
            {expanded ? <Text style={styles.reflection}>{contemplation.reflection}</Text> : null}
          </Pressable>
          <View style={styles.contemplationActions}>
            <Button title="Share" variant="secondary" onPress={() => Share.share({ message: contemplation.quote })} style={{ flex: 1 }} />
            <Button title="Write about this →" onPress={() => router.push(`/journal/new?prompt=${encodeURIComponent(contemplation.journal_prompt ?? '')}`)} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Active Mandalas</Text>
        <Pressable onPress={() => router.push('/mandala/new')}><Text style={styles.link}>New</Text></Pressable>
      </View>

      {mandalasQuery.data && mandalasQuery.data.length > 0 ? (
        <FlatList
          horizontal
          data={mandalasQuery.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onLongPress={() => captureAndShare(shareRef, `I am on Day ${item.completed_days} in ${item.practice_name}`)}>
              <MandalaCard mandala={item} />
            </Pressable>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        />
      ) : (
        <View style={styles.emptyState}><Text style={styles.emptyTitle}>No active mandalas yet.</Text><Button title="Start your first Mandala" onPress={() => router.push('/mandala/new')} /></View>
      )}

      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.quickRow}>
        <QuickAction label="Journal" onPress={() => router.push('/journal')} />
        <QuickAction label="Calendar" onPress={() => router.push('/(tabs)/calendar')} />
        <QuickAction label="Find Seekers" onPress={() => router.push('/(tabs)/community')} />
        <QuickAction label="Share Card" onPress={() => captureAndShare(shareRef, 'My mandala progress')} />
      </View>
    </ScrollView>
  );
}

function QuickAction({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable style={styles.quickAction} onPress={onPress}><Text style={styles.quickActionText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content: { padding: 16, gap: 16, paddingBottom: 24 },
  header: { color: COLORS.TEXT, fontWeight: '700', fontSize: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: COLORS.TEXT, fontWeight: '700', fontSize: 18 },
  quote: { color: COLORS.ACCENT, marginTop: 8, fontStyle: 'italic' },
  reflection: { color: COLORS.TEXT_MUTED, marginTop: 8, lineHeight: 20 },
  contemplationActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  link: { color: COLORS.PRIMARY, fontWeight: '600' },
  listContent: { paddingRight: 4 },
  emptyState: { backgroundColor: COLORS.SURFACE, borderWidth: 1, borderColor: '#2A2A4E', borderRadius: 16, padding: 16, gap: 10 },
  emptyTitle: { color: COLORS.TEXT_MUTED },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickAction: { backgroundColor: COLORS.SURFACE, borderWidth: 1, borderColor: '#2A2A4E', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  quickActionText: { color: COLORS.TEXT, fontWeight: '600' }
});
