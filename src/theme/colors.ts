/**
 * LifePulse Design System - Colors
 * "Compassionate Precision" - Dark mode first
 */

export const colors = {
    // Backgrounds
    background: {
        primary: '#121212', // Deep matte black
        secondary: '#1A1B1E', // Dark gunmetal
        card: '#2C2C2E', // Card background
        elevated: '#3A3A3C', // Elevated surfaces
    },

    // Accents
    accent: {
        success: '#00FF9D', // Neon green (completion)
        warning: '#FFB347', // Amber (streak/fire)
        error: '#FF6B6B', // Soft red (skip/miss)
        info: '#87CEEB', // Sky blue
        primary: '#7C4DFF', // Purple accent for CTAs
    },

    // Text
    text: {
        primary: '#FFFFFF',
        secondary: '#A0A0A0',
        muted: '#6B6B6B',
        inverse: '#121212',
    },

    // Borders
    border: {
        default: '#3A3A3C',
        focus: '#00FF9D',
        subtle: '#2C2C2E',
    },

    // Heatmap gradient (for analytics)
    heatmap: {
        empty: '#2C2C2E',
        level1: '#3D4F3D', // 1-20%
        level2: '#4A6B4A', // 21-40%
        level3: '#5A8F5A', // 41-60%
        level4: '#6AB06A', // 61-80%
        level5: '#00FF9D', // 81-100%
    },

    // Habit preset colors
    habitColors: [
        '#FF6B6B', // Coral
        '#FFB347', // Amber
        '#F7DC6F', // Yellow
        '#00FF9D', // Neon Green
        '#98D8C8', // Mint
        '#87CEEB', // Sky Blue
        '#7C4DFF', // Purple
        '#DDA0DD', // Plum
        '#FF69B4', // Pink
        '#E0E0E0', // Silver
    ],

    // Gradients (as arrays for LinearGradient)
    gradients: {
        success: ['#00FF9D', '#00CC7D'],
        warning: ['#FFB347', '#FF9500'],
        error: ['#FF6B6B', '#FF4444'],
        primary: ['#7C4DFF', '#5C3DCF'],
        card: ['#2C2C2E', '#1A1B1E'],
    },

    // Shadows (iOS & Android)
    shadow: {
        light: 'rgba(0, 0, 0, 0.2)',
        medium: 'rgba(0, 0, 0, 0.4)',
        heavy: 'rgba(0, 0, 0, 0.6)',
        glow: 'rgba(0, 255, 157, 0.3)', // Neon green glow
    },
} as const;

// Type exports for TypeScript
export type Colors = typeof colors;
export type BackgroundColor = keyof typeof colors.background;
export type AccentColor = keyof typeof colors.accent;
export type TextColor = keyof typeof colors.text;

