/**
 * TackleBox Design Tokens
 *
 * Single source of truth for all visual styling.
 * No raw hex values anywhere else in the codebase.
 * Clean, modern, professional palette for a creative design consultancy.
 */

export const colours = {
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
    900: '#ffffff',
  },

  // Surfaces
  white: '#111111',
  black: '#ffffff',
  background: '#0a0a0a',
  surface: '#111111',
  surfaceRaised: '#1a1a1a',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Brand
  brand: {
    primary: '#e5a44d',
    primaryMuted: 'rgba(229, 164, 77, 0.15)',
  },

  // Status
  status: {
    success: '#4ade80',
    successMuted: 'rgba(74, 222, 128, 0.12)',
    danger: '#f87171',
    dangerMuted: 'rgba(248, 113, 113, 0.12)',
    warning: '#fbbf24',
    warningMuted: 'rgba(251, 191, 36, 0.12)',
    info: '#60a5fa',
    infoMuted: 'rgba(96, 165, 250, 0.12)',
  },
}

export const glow = {
  none: 'none',
  soft: '0 0 8px rgba(255, 255, 255, 0.06)',
  medium: '0 0 16px rgba(255, 255, 255, 0.10)',
  bright: '0 0 24px rgba(255, 255, 255, 0.16)',
  intense: '0 0 32px rgba(255, 255, 255, 0.22)',
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
  glow,
  typography,
  spacing,
  radii,
  shadows,
  breakpoints,
  transitions,
  zIndex,
}

export default tokens
