/**
 * TackleBox Design Tokens
 *
 * Single source of truth for all visual styling.
 * No raw hex values anywhere else in the codebase.
 * Clean, modern, professional palette for a creative design consultancy.
 */

export const colours = {
  // Primary — Deep teal, confident and creative
  primary: {
    50: '#e6f5f5',
    100: '#b3e0e0',
    200: '#80cccc',
    300: '#4db8b8',
    400: '#26a8a8',
    500: '#0F7173', // Main brand colour
    600: '#0d6163',
    700: '#0a4f51',
    800: '#073d3f',
    900: '#042b2d',
  },

  // Secondary — Warm coral, energetic accent
  secondary: {
    50: '#fff0ec',
    100: '#ffd4c9',
    200: '#ffb8a6',
    300: '#ff9c83',
    400: '#ff8569',
    500: '#E85D46', // Main accent
    600: '#d04a35',
    700: '#b03828',
    800: '#8e2b1e',
    900: '#6c1f14',
  },

  // Neutral — Slate greys with slight warmth
  neutral: {
    50: '#f8f9fc',
    100: '#f1f3f8',
    200: '#e2e6ef',
    300: '#cbd1de',
    400: '#9ba5b9',
    500: '#6b7894',
    600: '#515e78',
    700: '#3d475c',
    800: '#2a3142',
    900: '#1a1a2e', // Main text
  },

  // Success
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // Warning
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Error
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Info
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Surfaces
  white: '#ffffff',
  black: '#000000',
  background: '#f8f9fc',
  surface: '#ffffff',
  surfaceRaised: '#ffffff',
  overlay: 'rgba(26, 26, 46, 0.5)',
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
  sm: '0 1px 2px rgba(26, 26, 46, 0.05)',
  md: '0 4px 6px -1px rgba(26, 26, 46, 0.07), 0 2px 4px -2px rgba(26, 26, 46, 0.05)',
  lg: '0 10px 15px -3px rgba(26, 26, 46, 0.08), 0 4px 6px -4px rgba(26, 26, 46, 0.04)',
  xl: '0 20px 25px -5px rgba(26, 26, 46, 0.1), 0 8px 10px -6px rgba(26, 26, 46, 0.05)',
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
