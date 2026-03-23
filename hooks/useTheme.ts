import { useColorScheme } from 'react-native';
import { getTheme, Theme } from '@/constants/theme';

export const useTheme = (): Theme => {
  const scheme = useColorScheme();
  return getTheme(scheme);
};
