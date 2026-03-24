import type { ColorSchemeName, ViewStyle } from 'react-native';

export type AppTheme = {
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    surface2: string;
    border: string;
    text: string;
    text2: string;
    text3: string;
    orange: string;
    gold: string;
    goldBg: string;
    green: string;
    greenBg: string;
    terra: string;
    terraBg: string;
    shadowDark: string;
    shadowLight: string;
    lcdFace: string;
    lcdText: string;
    white: string;
    danger: string;
  };
  shadow: {
    raised: ViewStyle;
    inset: ViewStyle;
  };
};

const baseShadow = { shadowOpacity: 1, shadowRadius: 10, elevation: 6 };

export const LIGHT_THEME: AppTheme = {
  isDark: false,
  colors: {
    background: '#F2EDE4',
    surface: '#EBE6DC',
    surface2: '#E4DDD2',
    border: '#D4C9B0',
    text: '#2C2416',
    text2: '#7A6A50',
    text3: '#A08C6E',
    orange: '#C45C1A',
    gold: '#8B6914',
    goldBg: '#F0E6C8',
    green: '#3D5A2E',
    greenBg: '#E8F0E0',
    terra: '#8B3A1E',
    terraBg: '#F5E8E0',
    shadowDark: '#C8C0AC',
    shadowLight: '#FFFFFF',
    lcdFace: '#D8D9C8',
    lcdText: '#2A2A1A',
    white: '#FFFFFF',
    danger: '#A33C2D',
  },
  shadow: {
    raised: { ...baseShadow, shadowColor: '#C8C0AC', shadowOffset: { width: 4, height: 4 } },
    inset: { ...baseShadow, shadowColor: '#FFFFFF', shadowOffset: { width: -4, height: -4 } },
  },
};

export const DARK_THEME: AppTheme = {
  isDark: true,
  colors: {
    background: '#0F0F1A',
    surface: '#141420',
    surface2: '#19192A',
    border: '#25253A',
    text: '#EEE8DD',
    text2: '#D8C8AB',
    text3: '#9A8F78',
    orange: '#E06B2A',
    gold: '#C9A84C',
    goldBg: '#2B2619',
    green: '#85A369',
    greenBg: '#1D261A',
    terra: '#C37F62',
    terraBg: '#2D1F1A',
    shadowDark: '#07070F',
    shadowLight: '#1E1E30',
    lcdFace: '#1A1A2A',
    lcdText: '#C9A84C',
    white: '#ECECEC',
    danger: '#CF5A4D',
  },
  shadow: {
    raised: { ...baseShadow, shadowColor: '#07070F', shadowOffset: { width: 4, height: 4 } },
    inset: { ...baseShadow, shadowColor: '#1E1E30', shadowOffset: { width: -4, height: -4 } },
  },
};

export const getTheme = (scheme: ColorSchemeName) => (scheme === 'dark' ? DARK_THEME : LIGHT_THEME);
