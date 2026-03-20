import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { COLORS } from '@/utils/colors';

export default function MandalaCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ practice_name?: string }>();
  const practiceName = params.practice_name ?? 'your practice';

  return (
    <View style={styles.container}>
      <Animated.View entering={ZoomIn.duration(800)} style={styles.badge}>
        <Text style={styles.badgeText}>🏅</Text>
      </Animated.View>

      <Animated.Text entering={FadeIn.duration(900)} style={styles.title}>
        🔱 MANDALA COMPLETE 🔱
      </Animated.Text>
      <Text style={styles.subtitle}>{`40 days of ${practiceName} without a single break.`}</Text>
      <Text style={styles.quote}>This is no longer discipline. This is who you are now.</Text>

      <View style={styles.stats}>
        <Text style={styles.statText}>Total time: 800 min</Text>
        <Text style={styles.statText}>Best day: Day 27</Text>
        <Text style={styles.statText}>Most common mood after: calm</Text>
      </View>

      <Text style={styles.earned}>Badge earned: Mandala Master</Text>

      <Pressable style={styles.cta} onPress={() => router.replace('/mandala/new')}>
        <Text style={styles.ctaText}>Start Another Mandala</Text>
      </Pressable>
      <Pressable style={[styles.cta, styles.secondary]} onPress={() => router.replace('/(tabs)/home')}>
        <Text style={styles.ctaText}>Go Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#27274B',
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: {
    fontSize: 52
  },
  title: {
    color: COLORS.TEXT,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center'
  },
  subtitle: {
    color: COLORS.ACCENT,
    textAlign: 'center'
  },
  quote: {
    color: COLORS.TEXT_MUTED,
    textAlign: 'center'
  },
  stats: {
    gap: 6,
    alignItems: 'center'
  },
  statText: {
    color: COLORS.TEXT
  },
  earned: {
    color: COLORS.SUCCESS,
    fontWeight: '700'
  },
  cta: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    alignItems: 'center'
  },
  secondary: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: '#2A2A4E'
  },
  ctaText: {
    color: COLORS.TEXT,
    fontWeight: '700'
  }
});
