/**
 * LifePulse Design System - Spacing
 * Consistent spacing scale based on 4px grid
 */

export const spacing = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 24px */
  xl: 24,
  /** 32px */
  '2xl': 32,
  /** 48px */
  '3xl': 48,
  /** 64px */
  '4xl': 64,
} as const;

// Border radius scale
export const borderRadius = {
  /** 4px - Subtle rounding */
  xs: 4,
  /** 8px - Small components */
  sm: 8,
  /** 12px - Cards, inputs */
  md: 12,
  /** 16px - Large cards */
  lg: 16,
  /** 24px - Pills, buttons */
  xl: 24,
  /** 32px - Large pills */
  '2xl': 32,
  /** Full circle */
  full: 9999,
} as const;

// Icon sizes
export const iconSize = {
  /** 16px - Small inline icons */
  xs: 16,
  /** 20px - Default inline icons */
  sm: 20,
  /** 24px - Standard icons */
  md: 24,
  /** 32px - Large icons */
  lg: 32,
  /** 48px - Extra large icons */
  xl: 48,
  /** 64px - Huge icons (habit icons) */
  '2xl': 64,
} as const;

// Touch target sizes (for accessibility)
export const touchTarget = {
  /** 32px - Minimum for secondary actions */
  sm: 32,
  /** 44px - Recommended minimum (Apple HIG) */
  md: 44,
  /** 48px - Comfortable tap target */
  lg: 48,
  /** 56px - Large buttons */
  xl: 56,
} as const;

// Screen edge insets
export const screenPadding = {
  horizontal: spacing.lg, // 16px
  vertical: spacing.lg, // 16px
  bottom: spacing['2xl'], // 32px - Extra space for bottom nav
} as const;

// Card dimensions
export const cardDimensions = {
  /** Standard habit card height */
  habitCard: 80,
  /** Date strip item width */
  dateItem: 48,
  /** Daily score ring diameter */
  scoreRing: 120,
  /** Badge size */
  badge: 64,
} as const;

// Animation durations (in ms)
export const duration = {
  /** 100ms - Micro interactions */
  fast: 100,
  /** 200ms - Standard transitions */
  normal: 200,
  /** 300ms - Smooth transitions */
  slow: 300,
  /** 500ms - Dramatic animations */
  slower: 500,
  /** 800ms - Celebration animations */
  celebration: 800,
} as const;

// Type exports
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type IconSize = typeof iconSize;

