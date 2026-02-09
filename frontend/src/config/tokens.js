/**
 * TackleBox Design Tokens
 *
 * Single source of truth for all visual styling.
 * No raw hex values anywhere else in the codebase.
 * Clean, modern, professional palette for a creative design consultancy.
 */

export const colours = {
  // Primary — White accent on dark background (Linear / Vercel style)
  primary: {
    50: '#0a0a0a',
    100: '#141414',
    200: '#1e1e1e',
    300: '#2a2a2a',
    400: '#a3a3a3',
    500: '#ffffff', // Main brand accent
    600: '#e5e5e5',
    700: '#d4d4d4',
    800: '#a3a3a3',
    900: '#737373',
  },

  // Secondary — Subtle dark tones
  secondary: {
    50: '#0a0a0a',
    100: '#141414',
    200: '#1e1e1e',
    300: '#2a2a2a',
    400: '#404040',
    500: '#333333',
    600: '#404040',
    700: '#a3a3a3',
    800: '#d4d4d4',
    900: '#e5e5e5',
  },

  // Neutral — Inverted for dark mode (50=darkest, 900=lightest)
  neutral: {
    50: '#0a0a0a',
    100: '#141414',
    200: '#1e1e1e',
    300: '#2a2a2a',
    400: '#525252',
    500: '#737373',
    600: '#a3a3a3',
    700: '#d4d4d4',
    800: '#e5e5e5',
    900: '#ffffff', // Main text
  },

  // Success — Dark-mode optimised
  success: {
    50: '#052e16',
    100: '#14532d',
    200: '#166534',
    300: '#15803d',
    400: '#16a34a',
    500: '#22c55e',
    600: '#4ade80',
    700: '#86efac',
    800: '#bbf7d0',
    900: '#f0fdf4',
  },

  // Warning — Dark-mode optimised
  warning: {
    50: '#451a03',
    100: '#78350f',
    200: '#92400e',
    300: '#b45309',
    400: '#d97706',
    500: '#f59e0b',
    600: '#fbbf24',
    700: '#fcd34d',
    800: '#fde68a',
    900: '#fffbeb',
  },

  // Error — Dark-mode optimised
  error: {
    50: '#450a0a',
    100: '#7f1d1d',
    200: '#991b1b',
    300: '#b91c1c',
    400: '#dc2626',
    500: '#ef4444',
    600: '#f87171',
    700: '#fca5a5',
    800: '#fecaca',
    900: '#fef2f2',
  },

  // Info — Blue tones for dark mode
  info: {
    50: '#0c1929',
    100: '#172554',
    200: '#1e3a5f',
    300: '#1e40af',
    400: '#2563eb',
    500: '#3b82f6',
    600: '#60a5fa',
    700: '#93bbfd',
    800: '#bfdbfe',
    900: '#eff6ff',
  },

  // Surfaces — Dark mode
  white: '#111111',
  black: '#ffffff',
  background: '#0a0a0a',
  surface: '#111111',
  surfaceRaised: '#1a1a1a',
  overlay: 'rgba(0, 0, 0, 0.7)',
}

export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
}

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
}

export const radii = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
}

export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.4)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
}

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
}

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
}

const tokens = {
  colours,
  typography,
  spacing,
  radii,
  shadows,
  breakpoints,
  transitions,
  zIndex,
}

export default tokens
