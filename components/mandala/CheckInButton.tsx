import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { CheckInModal } from '@/components/mandala/CheckInModal';
import { MandalaCheckin } from '@/types/mandala';
import { COLORS } from '@/utils/colors';

type CheckInButtonProps = {
  mandalaId: string;
  checkins: MandalaCheckin[];
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function CheckInButton({ mandalaId, checkins }: CheckInButtonProps) {
  const [open, setOpen] = useState(false);
  const doneToday = useMemo(() => checkins.some((item) => item.checkin_date === todayStr()), [checkins]);
  const pulse = useSharedValue(1);

  if (!doneToday) {
    pulse.value = withRepeat(withTiming(1.05, { duration: 800 }), -1, true);
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: doneToday ? 1 : pulse.value }]
  }));

  return (
    <>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={() => !doneToday && setOpen(true)}
          style={[styles.button, doneToday ? styles.done : styles.pending]}
        >
          <Text style={styles.text}>{doneToday ? '✅ Done for today' : 'Check In Today'}</Text>
        </Pressable>
      </Animated.View>
      <CheckInModal visible={open} mandalaId={mandalaId} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center'
  },
  done: {
    backgroundColor: COLORS.SUCCESS
  },
  pending: {
    backgroundColor: '#FF6B35'
  },
  text: {
    color: COLORS.TEXT,
    fontSize: 16,
    fontWeight: '700'
  }
});
