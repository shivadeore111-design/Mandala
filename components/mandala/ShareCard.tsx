import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { COLORS } from '@/utils/colors';

type Props = {
  practiceName: string;
  dayLabel: string;
  streak: number;
  showWatermark: boolean;
  scale?: number;
};

export function ShareCard({ practiceName, dayLabel, streak, showWatermark, scale = 0.22 }: Props) {
  return (
    <View style={[styles.previewWrap, { transform: [{ scale }], width: 1080 * scale, height: 1920 * scale }]}> 
      <View style={styles.card}>
        <Svg width={1080} height={1920} style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#141429" />
              <Stop offset="1" stopColor="#251B3D" />
            </LinearGradient>
          </Defs>
          <Rect width="1080" height="1920" fill="url(#bg)" />
          <Circle cx="540" cy="700" r="330" stroke="#3E355C" strokeWidth="6" fill="transparent" />
          <Circle cx="540" cy="700" r="230" stroke="#5C4E86" strokeWidth="5" fill="transparent" />
          <Circle cx="540" cy="700" r="130" stroke="#7D66AD" strokeWidth="4" fill="transparent" />
        </Svg>

        <Text style={styles.kicker}>MANDALA APP</Text>
        <Text style={styles.practice}>{practiceName}</Text>
        <Text style={styles.day}>{dayLabel}</Text>
        <Text style={styles.streak}>🔥 {streak} day streak</Text>
        {showWatermark ? <Text style={styles.watermark}>mandala.app</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  previewWrap: { overflow: 'hidden', alignSelf: 'center' },
  card: {
    width: 1080,
    height: 1920,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center'
  },
  kicker: { color: COLORS.ACCENT, fontSize: 42, letterSpacing: 6, marginBottom: 20 },
  practice: { color: COLORS.TEXT, fontSize: 84, fontWeight: '700', paddingHorizontal: 64, textAlign: 'center' },
  day: { color: COLORS.PRIMARY, fontSize: 58, fontWeight: '700', marginTop: 18 },
  streak: { color: COLORS.TEXT, fontSize: 44, marginTop: 16 },
  watermark: { position: 'absolute', bottom: 56, color: '#8F88AA', fontSize: 34 }
});
