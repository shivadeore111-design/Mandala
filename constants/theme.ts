import { ColorSchemeName } from 'react-native';

export const LIGHT = {
  bg:          '#F2EDE4',
  surface:     '#EBE6DC',
  surface2:    '#E4DDD2',
  border:      '#D4C9B0',
  text:        '#2C2416',
  text2:       '#7A6A50',
  text3:       '#A08C6E',
  gold:        '#8B6914',
  goldBg:      '#F0E6C8',
  orange:      '#C45C1A',
  orangeBg:    '#FAE8D8',
  green:       '#3D5A2E',
  greenBg:     '#E8F0E0',
  terra:       '#8B3A1E',
  terraBg:     '#F5E8E0',
  red:         '#CC3333',
  navBg:       '#EDE8DE',
  shadowDark:  '#C8C0AC',
  shadowLight: '#FFFFFF',
  lcdBg:       '#D8D9C8',
  lcdText:     '#2A2A1A',
};

export const DARK = {
  bg:          '#0F0F1A',
  surface:     '#141420',
  surface2:    '#0D0D18',
  border:      '#2A2A3E',
  text:        '#E8E0D0',
  text2:       '#9E96B4',
  text3:       '#6B6B8A',
  gold:        '#C9A84C',
  goldBg:      '#C9A84C22',
  orange:      '#E06B2A',
  orangeBg:    '#E06B2A22',
  green:       '#4A8C5C',
  greenBg:     '#4A8C5C22',
  terra:       '#C96840',
  terraBg:     '#C9684022',
  red:         '#CC3333',
  navBg:       '#0A0A14',
  shadowDark:  '#07070F',
  shadowLight: '#1E1E30',
  lcdBg:       '#1A1A2A',
  lcdText:     '#C9A84C',
};

export type Theme = typeof LIGHT;

export const getTheme = (scheme: ColorSchemeName): Theme =>
  scheme === 'dark' ? DARK : LIGHT;
