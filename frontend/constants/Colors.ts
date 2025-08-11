/**
 * Uni-con App Color Scheme
 * Based on the design system from Figma wireframes
 */

// Primary brand colors
export const BrandColors = {
  primary: '#667eea',
  primaryDark: '#764ba2',
  secondary: '#F59E0B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#8B5CF6',
} as const;

// Neutral colors
export const NeutralColors = {
  gray50: '#FAFAFA',
  gray100: '#F9FAFB',
  gray200: '#F3F4F6',
  gray300: '#E5E7EB',
  gray400: '#D1D5DB',
  gray500: '#9CA3AF',
  gray600: '#6B7280',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  white: '#FFFFFF',
  black: '#000000',
} as const;

// Legacy Colors for expo-router compatibility
const tintColorLight = BrandColors.primary;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: NeutralColors.gray800,
    background: NeutralColors.white,
    tint: tintColorLight,
    icon: NeutralColors.gray500,
    tabIconDefault: NeutralColors.gray500,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Common gradients used in the app
export const Gradients = {
  primary: [BrandColors.primary, BrandColors.primaryDark],
  card: ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.95)'],
} as const;
