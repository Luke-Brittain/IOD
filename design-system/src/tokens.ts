// Central design tokens for colors, spacing and typography.
// Keep these small and JS-exported so components and tests can import them.

export const colors = {
  primaryInk: '#031926',
  primaryTeal: '#007B7A',
  primaryCerulean: '#00B3C6',
  primaryGold: '#C9A84A',

  textPrimary: '#0E1B20',
  textLight: '#FFFFFF',
  bgPrimary: '#FFFFFF',
  error: '#DC3545',
  muted: '#8A9899',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  fontFamily: "Inter, Helvetica, Arial, sans-serif",
  fontSizeBase: 16,
  fontSizes: {
    sm: 14,
    md: 16,
    lg: 18,
  },
};

export default { colors, spacing, typography };
