import { useState } from 'react';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { COLORS } from '@/utils/colors';

const slides = [
  { title: 'Welcome to Mandala', subtitle: 'Build a soulful daily practice with mindful consistency.' },
  { title: 'Track your sadhana', subtitle: 'Follow your rhythm, streaks, and milestones in one place.' },
  { title: 'Never practice alone', subtitle: 'Stay connected with a community of seekers on the same path.' }
];

export default function WelcomeScreen() {
  const [index, setIndex] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Mandala</Text>

      <Card style={styles.slideCard}>
        <Text style={styles.slideTitle}>{slides[index].title}</Text>
        <Text style={styles.slideSubtitle}>{slides[index].subtitle}</Text>
      </Card>

      <View style={styles.dotsRow}>
        {slides.map((_, dotIndex) => (
          <View key={dotIndex} style={[styles.dot, dotIndex === index && styles.activeDot]} />
        ))}
      </View>

      {index < slides.length - 1 ? (
        <Button title="Next" onPress={() => setIndex((value) => value + 1)} />
      ) : (
        <View style={styles.ctaStack}>
          <Link asChild href="/(auth)/signup">
            <Button title="Get Started" />
          </Link>
          <Link asChild href="/(auth)/login">
            <Button title="I have an account" variant="secondary" />
          </Link>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    padding: 24,
    justifyContent: 'center',
    gap: 20
  },
  brand: {
    color: COLORS.ACCENT,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center'
  },
  slideCard: {
    minHeight: 220,
    justifyContent: 'center',
    gap: 12
  },
  slideTitle: {
    color: COLORS.TEXT,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800'
  },
  slideSubtitle: {
    color: COLORS.TEXT_MUTED,
    fontSize: 16,
    lineHeight: 22
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: '#3A3A5A'
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.PRIMARY
  },
  ctaStack: {
    gap: 12
  }
});
