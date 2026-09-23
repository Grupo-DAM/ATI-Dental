/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#141018',
    textNames: '#4A4A4A',
    pageTitle: '#1F2937',
    pageSubtitle: '#6B7280',
    breadcrumbSeparator: '#9CA3AF',
    fieldLabel: '#374151', //Oxford Blue
    background: '#F7F6F8',
    backgroundElement: '#ffffff',
    backgroundSelected: '#E0E1E6',
    backgroundSecondary: '#F9FAFB', // athens Gray
    textSecondary: '#60646C',
    header: '#52287D',
    accentText: '#725C8A',
    main: '#5B2D8B',
    overMain: '#ffffff',
    border: '#DBD4E2',
    pageSeparator: '#EDF2F7',
    cardSeparator: '#D1D5DB',
    error: '#BA1A1A',
    logo: '#5B2D8B',
    errorBackground: '#FFDAD6',
    placeholderColor: '#9E8BAC',
    offlineBannerBackground: '#FEF3C7',
    offlineBannerBorder: '#FDE68A',
    offlineBannerText: '#B45309',
    chartLegendText: '#A0AEC0',
    lineChartBottomLine: '#CBD5E0',
    tooltipBackground: '#1A202C',
    tooltipLegend: '#E2E8F0',
    tooltipValue: '#FFFFFF',
    accentBackground: '#F3E8FF',
    reportValueText: '#111827', //Ebony
    positive: '#10B981',
  },
  dark: {
    text: '#ffffff',
    textNames: '#E0E7FF', //tundra
    pageTitle: '#D1D5DB',
    pageSubtitle: '#9CA3AF',
    breadcrumbSeparator: '#6B7280',
    fieldLabel: '#D1D5DB',
    background: '#000000',
    backgroundElement: '#121315',
    backgroundSelected: '#2E3135',
    backgroundSecondary: '#1F1F1F',
    textSecondary: '#B0B4BA',
    header: '#52287D',
    accentText: '#725C8A',
    main: '#5B2D8B',
    overMain: '#ffffff',
    border: '#3d4858',
    pageSeparator: '#262C36',
    cardSeparator: '#374151',
    error: '#BA1A1A',
    logo: '#ffffff',
    errorBackground: '#FFDAD6',
    placeholderColor: '#9E8BAC',
    offlineBannerBackground: '#FEF3C7',
    offlineBannerBorder: '#FDE68A',
    offlineBannerText: '#B45309',
    chartLegendText: '#6B7280',
    lineChartBottomLine: '#9CA3AF',
    tooltipBackground: '#1A202C',
    tooltipLegend: '#E2E8F0',
    tooltipValue: '#FFFFFF',
    accentBackground: '#4D2875',
    reportValueText: '#F8FAFC',
    positive: '#10B981',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const FontFamily = {
  regular: 'Open Sans',
}

export const Spacing = {
  none: 0,
  quarter: 1,
  half: 2,
  one: 4,
  oneHalf: 6,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const FontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

export const FontSize = {
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 16,
  h5: 14,
  h6: 14,
  p: 12,
  small: 10,
} as const

export const LineHeight = {
  loginTitle: 40,
  pageTitle: 32,
  loginSubtitle: 24,
  pageSubtitle: 20,
  note: 16,
} as const

export const Border = {
  width: {
    regular: 1,
    bold: 2,
  },
  radius: 8,
} as const

export const Icon = {
  size: {
    regular: 20,
  }
}

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
