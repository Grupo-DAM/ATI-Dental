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
    background: '#F7F6F8',
    backgroundElement: '#ffffff',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    header: '#52287D',
    accentText: '#725C8A',
    main: '#5B2D8B',
    border: '#DBD4E2',
    pageSeparator: '#EDF2F7',
    cardSeparator: '#D1D5DB',
    error: '#BA1A1A',
    logo: '#5B2D8B',
    errorBackground: '#FFDAD6',
    placeholderColor: '#9E8BAC'
  },
  dark: {
    text: '#ffffff',
    textNames: '#E0E7FF', //tundra
    pageTitle: '#D1D5DB',
    pageSubtitle: '#9CA3AF',
    breadcrumbSeparator: '#6B7280',
    background: '#000000',
    backgroundElement: '#121315',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    header: '#52287D',
    accentText: '#725C8A',
    main: '#5B2D8B',
    border: '#DBD4E2',
    pageSeparator: '#262C36',
    cardSeparator: '#374151',
    error: '#BA1A1A',
    logo: '#ffffff',
    errorBackground: '#FFDAD6',
    placeholderColor: '#9E8BAC'
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

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
