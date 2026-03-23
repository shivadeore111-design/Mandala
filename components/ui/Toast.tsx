import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useUIStore } from '@/stores/uiStore';
import { COLORS } from '@/utils/colors';

const toastColors = {
  success: COLORS.SUCCESS,
  error: COLORS.ERROR,
  info: COLORS.SECONDARY
};

export function Toast() {
  const { toast, hideToast } = useUIStore();

  useEffect(() => {
    if (!toast.visible) {
      return;
    }

    const timer = setTimeout(() => {
      hideToast();
    }, 2500);

    return () => clearTimeout(timer);
  }, [hideToast, toast.visible]);

  if (!toast.visible) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: toastColors[toast.type] }]}>
      <Text style={styles.text}>{toast.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 999,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  text: {
    color: COLORS.TEXT,
    fontWeight: '600'
  }
});
