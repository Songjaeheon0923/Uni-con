/**
 * Common styles used throughout the Uni-con app
 */

import { StyleSheet, Platform } from 'react-native';
import { BrandColors, NeutralColors } from './Colors';

export const GlobalStyles = StyleSheet.create({
  // Container styles
  safeContainer: {
    flex: 1,
    backgroundColor: NeutralColors.gray50,
  },
  container: {
    flex: 1,
    backgroundColor: NeutralColors.white,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Spacing
  paddingHorizontal: {
    paddingHorizontal: 20,
  },
  marginVertical: {
    marginVertical: 16,
  },

  // Card styles
  card: {
    backgroundColor: NeutralColors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: NeutralColors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  cardSmall: {
    backgroundColor: NeutralColors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: NeutralColors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Button styles
  primaryButton: {
    backgroundColor: BrandColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  primaryButtonText: {
    color: NeutralColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BrandColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  secondaryButtonText: {
    color: BrandColors.primary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Input styles
  input: {
    borderWidth: 1,
    borderColor: NeutralColors.gray300,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: NeutralColors.gray100,
    color: NeutralColors.gray800,
  },
  
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: NeutralColors.gray700,
    marginBottom: 8,
  },

  // Text styles
  heading1: {
    fontSize: 28,
    fontWeight: '600',
    color: NeutralColors.gray800,
    lineHeight: 36,
  },
  
  heading2: {
    fontSize: 24,
    fontWeight: '600',
    color: NeutralColors.gray800,
    lineHeight: 32,
  },
  
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    color: NeutralColors.gray800,
    lineHeight: 28,
  },
  
  body: {
    fontSize: 16,
    color: NeutralColors.gray600,
    lineHeight: 24,
  },
  
  bodySmall: {
    fontSize: 14,
    color: NeutralColors.gray600,
    lineHeight: 20,
  },
  
  caption: {
    fontSize: 12,
    color: NeutralColors.gray500,
    lineHeight: 16,
  },

  // Tab bar styles
  tabBarStyle: {
    backgroundColor: NeutralColors.white,
    borderTopWidth: 1,
    borderTopColor: NeutralColors.gray200,
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
    shadowColor: NeutralColors.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },

  // Icon container styles
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  iconContainerSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Status bar safe area
  statusBarSafe: {
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
});

// Common spacing values
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Common border radius values
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
} as const;