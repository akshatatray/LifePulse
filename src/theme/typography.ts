/**
 * LifePulse Design System - Typography
 * Font: Nunito (rounded sans-serif)
 */

export const fontFamily = {
  regular: 'Nunito-Regular',
  medium: 'Nunito-SemiBold', // Using SemiBold as medium since Nunito doesn't have a medium weight
  semiBold: 'Nunito-SemiBold',
  bold: 'Nunito-Bold',
  extraBold: 'Nunito-ExtraBold',
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

// Pre-defined text styles for common use cases
export const textStyles = {
  // Display - Large headlines
  displayLarge: {
    fontFamily: fontFamily.extraBold,
    fontSize: fontSize['5xl'],
    lineHeight: fontSize['5xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  displayMedium: {
    fontFamily: fontFamily.extraBold,
    fontSize: fontSize['4xl'],
    lineHeight: fontSize['4xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  displaySmall: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    lineHeight: fontSize['3xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },

  // Headlines - Section headers
  headlineLarge: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  headlineMedium: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  headlineSmall: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Title - Component titles
  titleLarge: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  titleMedium: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  titleSmall: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },

  // Body - Paragraph text
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  bodyMedium: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },

  // Label - Buttons, tags, captions
  labelLarge: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  labelMedium: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  labelSmall: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.wider,
  },
} as const;

// Type exports
export type FontFamily = typeof fontFamily;
export type FontSize = typeof fontSize;
export type TextStyle = keyof typeof textStyles;

