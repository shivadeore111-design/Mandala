import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { MandalaCheckin } from '@/types/mandala';

type MandalaGridProps = {
  targetDays: number;
  checkins: MandalaCheckin[];
  startDate: string;
};

function DayCircle({ state }: { state: 'completed' | 'today' | 'future' | 'missed' }) {
  const pulse = useSharedValue(1);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: state === 'today' ? pulse.value : 1 }]
  }));

  if (state === 'today') {
    pulse.value = withRepeat(withTiming(1.08, { duration: 700 }), -1, true);
  }

  return (
    <Animated.View
      style={[
        styles.circle,
        state === 'completed' && styles.completed,
        state === 'today' && styles.today,
        state === 'future' && styles.future,
        state === 'missed' && styles.missed,
        style
      ]}
    />
  );
}

export function MandalaGrid({ targetDays, checkins, startDate }: MandalaGridProps) {
  const start = useMemo(() => new Date(startDate), [startDate]);
  const checkinDays = useMemo(() => new Set(checkins.map((c) => c.day_number)), [checkins]);

  const today = new Date();
  const dayDiff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <View style={styles.grid}>
      {Array.from({ length: targetDays }, (_, idx) => {
        const day = idx + 1;
        let state: 'completed' | 'today' | 'future' | 'missed' = 'future';
        if (checkinDays.has(day)) {
          state = 'completed';
        } else if (day === dayDiff) {
          state = 'today';
        } else if (day < dayDiff) {
          state = 'missed';
        }

        return <DayCircle key={day} state={state} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2
  },
  completed: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50'
  },
  today: {
    backgroundColor: 'transparent',
    borderColor: '#FF6B35'
  },
  future: {
    backgroundColor: '#1A1A2E',
    borderColor: '#1A1A2E'
  },
  missed: {
    backgroundColor: 'rgba(244,67,54,0.5)',
    borderColor: 'rgba(244,67,54,0.5)'
  }
});
