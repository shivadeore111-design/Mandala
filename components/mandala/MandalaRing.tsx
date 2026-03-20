import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

import { COLORS } from '@/utils/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type MandalaRingProps = {
  completedDays: number;
  targetDays: number;
  size?: number;
  strokeWidth?: number;
};

export function MandalaRing({ completedDays, targetDays, size = 190, strokeWidth = 12 }: MandalaRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, completedDays / Math.max(1, targetDays));
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withTiming(progress, { duration: 700 });
  }, [progress, progressValue]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progressValue.value)
  }));

  return (
    <View style={styles.wrapper}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2B2B47"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.SUCCESS}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
        <Text style={styles.dayText}>{`Day ${Math.min(completedDays, targetDays)} of ${targetDays}`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  center: {
    position: 'absolute',
    alignItems: 'center'
  },
  percent: {
    color: COLORS.TEXT,
    fontWeight: '700',
    fontSize: 28
  },
  dayText: {
    color: COLORS.TEXT_MUTED,
    fontSize: 13,
    marginTop: 4
  }
});
