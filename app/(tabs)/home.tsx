import { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { MandalaCard } from '@/components/mandala/MandalaCard';
import { Button } from '@/components/ui/Button';
import { useActiveMandalas } from '@/hooks/useMandala';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/utils/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const mandalasQuery = useActiveMandalas();

  const name = useMemo(() => user?.user_metadata?.full_name?.split(' ')[0] ?? 'Seeker', [user]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={mandalasQuery.isRefetching} onRefresh={mandalasQuery.refetch} tintColor={COLORS.PRIMARY} />}
    >
      <Text style={styles.header}>{`Good morning, ${name} 🙏`}</Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Active Mandalas</Text>
        <Pressable onPress={() => router.push('/mandala/new')}>
          <Text style={styles.link}>New</Text>
        </Pressable>
      </View>

      {mandalasQuery.data && mandalasQuery.data.length > 0 ? (
        <FlatList
          horizontal
          data={mandalasQuery.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MandalaCard mandala={item} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No active mandalas yet.</Text>
          <Button title="Start your first Mandala" onPress={() => router.push('/mandala/new')} />
        </View>
      )}

      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.quickRow}>
        <QuickAction label="Journal" onPress={() => {}} />
        <QuickAction label="Calendar" onPress={() => router.push('/(tabs)/calendar')} />
        <QuickAction label="Find Seekers" onPress={() => router.push('/(tabs)/community')} />
        <QuickAction label="New Mandala" onPress={() => router.push('/mandala/new')} />
      </View>
    </ScrollView>
  );
}

function QuickAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <Text style={styles.quickActionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 24
  },
  header: {
    color: COLORS.TEXT,
    fontWeight: '700',
    fontSize: 28
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    color: COLORS.TEXT,
    fontWeight: '700',
    fontSize: 18
  },
  link: {
    color: COLORS.PRIMARY,
    fontWeight: '600'
  },
  listContent: {
    gap: 12
  },
  emptyState: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: '#2A2A4E',
    borderRadius: 16,
    padding: 16,
    gap: 10
  },
  emptyTitle: {
    color: COLORS.TEXT_MUTED
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  quickAction: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: '#2A2A4E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14
  },
  quickActionText: {
    color: COLORS.TEXT,
    fontWeight: '600'
  }
});
