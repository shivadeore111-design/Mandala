import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { ShareCard } from '@/components/mandala/ShareCard';
import { useSubscription } from '@/hooks/useSubscription';
import { captureAndShare } from '@/lib/share';
import { COLORS } from '@/utils/colors';

export default function MandalaCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ practice_name?: string }>();
  const { isPremium } = useSubscription();
  const shareRef = useRef(null);
  const practiceName = params.practice_name ?? 'your practice';

  return (
    <View style={styles.container}>
      <View collapsable={false} ref={shareRef}><ShareCard practiceName={practiceName} dayLabel="COMPLETE 🔱" streak={40} showWatermark={!isPremium} /></View>
      <Animated.View entering={ZoomIn.duration(800)} style={styles.badge}><Text style={styles.badgeText}>🏅</Text></Animated.View>
      <Animated.Text entering={FadeIn.duration(900)} style={styles.title}>🔱 MANDALA COMPLETE 🔱</Animated.Text>
      <Text style={styles.subtitle}>{`40 days of ${practiceName} without a single break.`}</Text>
      <Pressable style={styles.cta} onPress={() => captureAndShare(shareRef, `${practiceName} complete 🔱`)}><Text style={styles.ctaText}>Share Achievement</Text></Pressable>
      <Pressable style={styles.cta} onPress={() => router.replace('/mandala/new')}><Text style={styles.ctaText}>Start Another Mandala</Text></Pressable>
      <Pressable style={[styles.cta, styles.secondary]} onPress={() => router.replace('/(tabs)/home')}><Text style={styles.ctaText}>Go Home</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 16 },
  badge: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#27274B', alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 52 },
  title: { color: COLORS.TEXT, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: COLORS.ACCENT, textAlign: 'center' },
  cta: { width: '100%', borderRadius: 12, backgroundColor: COLORS.PRIMARY, paddingVertical: 12, alignItems: 'center' },
  secondary: { backgroundColor: COLORS.SURFACE, borderWidth: 1, borderColor: '#2A2A4E' },
  ctaText: { color: COLORS.TEXT, fontWeight: '700' }
});
