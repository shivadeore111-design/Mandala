import { ActivityIndicator, Pressable, PressableProps, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { COLORS } from '@/utils/colors';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, variant = 'primary', loading, disabled, style, ...props }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        style
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? COLORS.TEXT : COLORS.BACKGROUND} />
      ) : (
        <Text style={[styles.text, variant === 'ghost' && styles.ghostText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  primary: {
    backgroundColor: COLORS.PRIMARY
  },
  secondary: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.ACCENT
  },
  ghost: {
    backgroundColor: 'transparent'
  },
  text: {
    color: COLORS.BACKGROUND,
    fontWeight: '700',
    fontSize: 16
  },
  ghostText: {
    color: COLORS.TEXT
  },
  disabled: {
    opacity: 0.6
  }
});
