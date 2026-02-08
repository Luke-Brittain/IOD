import React, { createContext, useContext, ReactNode } from 'react';
import tokens, { colors, spacing, typography } from './tokens';

type Theme = typeof tokens;

const ThemeContext = createContext<Theme>(tokens);

export function useTheme() {
  return useContext(ThemeContext);
}

interface Props {
  children?: ReactNode;
  theme?: Partial<Theme>;
}

export function ThemeProvider({ children, theme }: Props) {
  const merged = { ...tokens, ...theme } as Theme;

  const cssVars: React.CSSProperties = {
    // map a couple of tokens to CSS variables for convenience
    ['--color-primary' as any]: merged.colors.primaryTeal,
    ['--color-cerulean' as any]: merged.colors.primaryCerulean,
    ['--color-gold' as any]: merged.colors.primaryGold,
    ['--text-primary' as any]: merged.colors.textPrimary,
    ['--font-family' as any]: merged.typography.fontFamily,
  };

  // expose spacing and a few semantic colors as CSS variables too
  (cssVars as any)['--space-xs'] = `${merged.spacing.xs}px`;
  (cssVars as any)['--space-sm'] = `${merged.spacing.sm}px`;
  (cssVars as any)['--space-md'] = `${merged.spacing.md}px`;
  (cssVars as any)['--bg-primary'] = merged.colors.bgPrimary;
  (cssVars as any)['--color-error'] = merged.colors.error;
  (cssVars as any)['--color-muted'] = merged.colors.muted;

  return (
    <ThemeContext.Provider value={merged}>
      <div style={cssVars as React.CSSProperties}>{children}</div>
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
