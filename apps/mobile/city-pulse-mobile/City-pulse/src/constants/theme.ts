/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#151817',
    textBody: '#202824',
    textSecondary: '#68726d',
    textTertiary: '#737770',
    background: '#FAF6EE',
    backgroundElement: '#ffffff',
    backgroundSelected: '#e8ece9',
    backgroundHover: '#f0f2ed',
    border: '#e1e6e0',
    borderInput: '#dfe5df',
    borderSubtle: '#edf0ec',
    progressTrack: '#e3e7e3',
    accent: '#0c8177',
    accentSoft: '#c8f3eb',
    accentGlow: '#d8f4e9',
    warningBg: '#fff4d4',
    warningText: '#805600',
    successText: '#287b5f',
    successBg: '#eef7f1',
    dangerBg: '#ffe1e3',
    dangerText: '#b4232c',
    trustText: '#a36b00',
    lowSupplyBg: '#fff0c7',
    lowSupplyText: '#9a6500',
    unconfirmedBg: '#e8ece9',
    unconfirmedText: '#65706a',
    reportBg: '#fff0f0',
    overlay: 'rgba(251, 251, 248, 0.94)',
    overlayStrong: 'rgba(251, 251, 248, 0.98)',
  },
  dark: {
    text: '#ffffff',
    textBody: '#f0f2ed',
    textSecondary: '#b0b4ba',
    textTertiary: '#888e88',
    background: '#05746c52',
    backgroundElement: '#0a6b63',
    backgroundSelected: '#085a52',
    backgroundHover: '#0a635c',
    border: '#1a8a80',
    borderInput: '#15776e',
    borderSubtle: '#127068',
    progressTrack: '#1a8a80',
    accent: '#ffffff',
    accentSoft: '#1a8a80',
    accentGlow: '#15776e',
    warningBg: '#2a2410',
    warningText: '#f0c978',
    successText: '#4caf93',
    successBg: '#14302e',
    dangerBg: '#2a1418',
    dangerText: '#e0646e',
    trustText: '#e0a458',
    lowSupplyBg: '#2a2410',
    lowSupplyText: '#f0c978',
    unconfirmedBg: '#222726',
    unconfirmedText: '#888e88',
    reportBg: '#2a1418',
    overlay: 'rgba(12, 119, 119, 0.94)',
    overlayStrong: 'rgba(12, 119, 119, 0.98)',
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
