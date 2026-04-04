import { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { CheckInButton } from '@/components/mandala/CheckInButton';
import { MandalaGrid } from '@/components/mandala/MandalaGrid';
import { MandalaRing } from '@/components/mandala/MandalaRing';
import { useMandalaDetail } from '@/hooks/useMandala';
import { COLORS } from '@/utils/colors';

export default function MandalaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = useMandalaDetail(id);
  const sentToComplete = useRef(false);

  const mandala = query.data;

  const stats = useMemo(() => {
    return {
      bestQuality: 0,
      avgDuration: 0,
    };
  }, []);

  useEffect(() => {
    if (!mandala || sentToComplete.current) {
      return;
    }

    if (mandala.completed_days >= mandala.target_days) {
      sentToComplete.current = true;
      router.replace({
        pathname: '/mandala/complete',
        params: { id: mandala.id, practice_name: mandala.practice_name }
      });
    }
  }, [mandala, router]);

  if (!mandala) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loading}>Loading mandala...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{mandala.practice_name}</Text>
      <MandalaRing completedDays={mandala.completed_days} targetDays={mandala.target_days} />

      <MandalaGrid targetDays={mandala.target_days} checkins={[]} startDate={mandala.created_at} />

      <View style={styles.statsRow}>
        <Stat label="Current streak" value={`${mandala.current_streak}`} />
        <Stat label="Best quality day" value={stats.bestQuality ? `${stats.bestQuality}★` : '—'} />
        <Stat label="Avg duration" value={`${stats.avgDuration} min`} />
      </View>

      <CheckInButton mandalaId={mandala.id} checkins={[]} />

      <Text style={styles.warning}>Miss a day and the mandala breaks. This is authentic to the tradition.</Text>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
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
    backgroundColor: COLORS.BACKGROUND
  },
  content: {
    padding: 16,
    gap: 18
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BACKGROUND
  },
  loading: {
    color: COLORS.TEXT_MUTED
  },
  title: {
    color: COLORS.TEXT,
    fontSize: 24,
    fontWeight: '700'
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: '#2A2A4E',
    borderRadius: 12,
    padding: 10
  },
  statValue: {
    color: COLORS.TEXT,
    fontWeight: '700'
  },
  statLabel: {
    color: COLORS.TEXT_MUTED,
    fontSize: 12
  },
  warning: {
    color: COLORS.WARNING,
    fontSize: 13
  }
});
