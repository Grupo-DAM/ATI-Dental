/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// 1. Constantes compartidas (estáticas para ambos temas)
const BRAND_COLORS = {
  header: '#52287D',
  main: '#5B2D8B',
  overMain: '#ffffff',
  error: '#BA1A1A',
  alert: '#DC2626',
  warning: '#D97706',
  errorBackground: '#FFDAD6',
  placeholderColor: '#9E8BAC',
  positive: '#10B981',
  onlineStatus: '#22C55E',
} as const;

const OFFLINE_BANNER = {
  offlineBannerBackground: '#FEF3C7',
  offlineBannerBorder: '#FDE68A',
  offlineBannerText: '#B45309',
} as const;

const TOOLTIP_COLORS = {
  tooltipBackground: '#1A202C',
  tooltipLegend: '#E2E8F0',
  tooltipValue: '#FFFFFF',
} as const;

const CONTACT_BUTTONS = {
  emailContactColor: '#5B2D8B',
  phoneContactColor: '#8F6BB3',
  whatsAppContactColor: '#34C759',
  facebookMainColor: '#1877F2',
  facebookTextColor: '#ffffff',
  instagramGradient: ['#833AB4', '#E1306C', '#F56040'],
  instagramTextColor: '#ffffff',
} as const;

// 2. Definición estructurada de temas usando composición
export const Colors = {
  light: {
    ...BRAND_COLORS,
    ...OFFLINE_BANNER,
    ...TOOLTIP_COLORS,
    ...CONTACT_BUTTONS,

    text: '#141018',
    textNames: '#4A4A4A',
    pageTitle: '#1F2937',
    pageSubtitle: '#6B7280',
    breadcrumbSeparator: '#9CA3AF',
    fieldLabel: '#374151',
    background: '#F7F6F8',
    backgroundElement: '#ffffff',
    backgroundSelected: '#E0E1E6',
    backgroundSecondary: '#F9FAFB',
    textSecondary: '#60646C',
    boldAccent: '#3E1F5C',
    accentText: '#725C8A',
    border: '#DBD4E2',
    pageSeparator: '#EDF2F7',
    cardSeparator: '#D1D5DB',
    logo: '#5B2D8B',
    chartLegendText: '#A0AEC0',
    lineChartBottomLine: '#CBD5E0',
    accentBackground: '#F3E8FF',
    reportValueText: '#111827',
    shadowColor: '#000',
    pfpBorderColor: '#F3F4F6',

    // Treatment badges
    completeBg: '#E8F5E9', completeText: '#2E7D32',
    inProgressBg: '#FFF3E0', inProgressText: '#E65100',
    pendingBg: '#FFF8E1', pendingText: '#F57F17',
    canceledBg: '#FFEBEE', canceledText: '#C62828',
    preventitiveBg: '#E8EAF6', preventitiveText: '#283593',
    categoryBg: '#F3E8FF', categoryText: '#6B21A8',
    defaultBg: '#F3F4F6', defaultText: '#374151',
  },
  dark: {
    ...BRAND_COLORS,
    ...OFFLINE_BANNER,
    ...TOOLTIP_COLORS,
    ...CONTACT_BUTTONS,

    text: '#ffffff',
    textNames: '#E0E7FF',
    pageTitle: '#D1D5DB',
    pageSubtitle: '#9CA3AF',
    breadcrumbSeparator: '#6B7280',
    fieldLabel: '#D1D5DB',
    background: '#000000',
    backgroundElement: '#121315',
    backgroundSelected: '#2E3135',
    backgroundSecondary: '#1F1F1F',
    textSecondary: '#B0B4BA',
    boldAccent: '#7f53ab',
    accentText: '#725C8A',
    border: '#3d4858',
    pageSeparator: '#262C36',
    cardSeparator: '#374151',
    logo: '#ffffff',
    chartLegendText: '#6B7280',
    lineChartBottomLine: '#9CA3AF',
    accentBackground: '#4D2875',
    reportValueText: '#F8FAFC',
    shadowColor: '#fff',
    pfpBorderColor: '#09090c',

    // Treatment badges
    completeBg: '#2E7D32', completeText: '#E8F5E9',
    inProgressBg: '#E65100', inProgressText: '#FFF3E0',
    pendingBg: '#F57F17', pendingText: '#FFF8E1',
    canceledBg: '#C62828', canceledText: '#FFEBEE',
    preventitiveBg: '#283593', preventitiveText: '#E8EAF6',
    categoryBg: '#6B21A8', categoryText: '#F3E8FF',
    defaultBg: '#374151', defaultText: '#F3F4F6',
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
  threeHalf: 20,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const FontSize = {
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 16,
  h5: 14,
  h6: 14,
  p: 12,
  small: 11,
} as const

export const LineHeight = {
  loginTitle: 40,
  pageTitle: 32,
  loginSubtitle: 24,
  pageSubtitle: 20,
  note: 16,
} as const

export const LetterSpacing = {
  half: 0.5
}

export const Border = {
  width: {
    regular: 1,
    bold: 2,
  },
  radius: {
    regular: 8,
    wide: 12,
  }
} as const

export const Icon = {
  size: {
    small: 18,
    regular: 20,
    big: 24,
    headerLogo: 28,
  }
}

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
