import { useColorScheme } from 'react-native';
import { getTheme } from '@/constants/theme';

export const useTheme = () => getTheme(useColorScheme());
