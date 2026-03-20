import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { CheckInButton } from '@/components/mandala/CheckInButton';
import { MandalaRing } from '@/components/mandala/MandalaRing';
import { Card } from '@/components/ui/Card';
import { Mandala } from '@/types/mandala';
import { COLORS } from '@/utils/colors';

type MandalaCardProps = {
  mandala: Mandala;
};

export function MandalaCard({ mandala }: MandalaCardProps) {
  const router = useRouter();

  return (
    <Card style={styles.card}>
      <Pressable onPress={() => router.push(`/mandala/${mandala.id}`)}>
        <Text style={styles.title}>{mandala.practice_name}</Text>
      </Pressable>
      <MandalaRing completedDays={mandala.completed_days} targetDays={mandala.target_days} size={116} strokeWidth={8} />
      <Text style={styles.dayText}>{`Day ${mandala.completed_days} of ${mandala.target_days}`}</Text>
      <CheckInButton mandalaId={mandala.id} checkins={mandala.mandala_checkins ?? []} />
      <Text style={styles.seekers}>108 seekers doing this</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    gap: 10
  },
  title: {
    color: COLORS.TEXT,
    fontSize: 18,
    fontWeight: '700'
  },
  dayText: {
    color: COLORS.ACCENT,
    fontWeight: '600'
  },
  seekers: {
    color: COLORS.TEXT_MUTED,
    fontSize: 12
  }
});
