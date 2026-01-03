/**
 * LifePulse Design System - Theme Index
 * Central export for all design tokens
 */

// Re-export everything as a single theme object for convenience
import { colors } from './colors';
import {
    borderRadius,
    cardDimensions,
    duration,
    iconSize,
    screenPadding,
    spacing,
    touchTarget,
} from './spacing';
import { fontFamily, fontSize, letterSpacing, lineHeight, textStyles } from './typography';

export { colors } from './colors';
export type { AccentColor, BackgroundColor, Colors, TextColor } from './colors';

export { fontFamily, fontSize, letterSpacing, lineHeight, textStyles } from './typography';
export type { FontFamily, FontSize, TextStyle } from './typography';

export {
    borderRadius, cardDimensions,
    duration, iconSize, screenPadding, spacing, touchTarget
} from './spacing';
export type { BorderRadius, IconSize, Spacing } from './spacing';

export const theme = {
    colors,
    fontFamily,
    fontSize,
    lineHeight,
    letterSpacing,
    textStyles,
    spacing,
    borderRadius,
    iconSize,
    touchTarget,
    screenPadding,
    cardDimensions,
    duration,
} as const;

export type Theme = typeof theme;

// Default export
export default theme;

