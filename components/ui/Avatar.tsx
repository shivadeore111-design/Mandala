import { Image, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/utils/colors';

type AvatarProps = {
  uri?: string | null;
  name?: string | null;
  size?: number;
};

const initialsFromName = (name?: string | null) => {
  if (!name) {
    return '?';
  }

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('');

  return initials || '?';
};

export function Avatar({ uri, name, size = 64 }: AvatarProps) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initialsFromName(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center'
  },
  initials: {
    color: COLORS.BACKGROUND,
    fontWeight: '700'
  }
});
