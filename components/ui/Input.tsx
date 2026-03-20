import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { COLORS } from '@/utils/colors';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput placeholderTextColor={COLORS.TEXT_MUTED} style={[styles.input, style, Boolean(error) && styles.inputError]} {...props} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8
  },
  label: {
    color: COLORS.TEXT,
    fontSize: 14,
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    borderColor: '#2A2A4E',
    borderRadius: 10,
    color: COLORS.TEXT,
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  inputError: {
    borderColor: COLORS.ERROR
  },
  error: {
    color: COLORS.ERROR,
    fontSize: 12
  }
});
