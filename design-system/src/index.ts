// Provide a default export so importing the package directly returns the main
// component (`import Toast from '@local/design-system'`) while also allowing
// named imports if desired.
// Default export (for `import Toast from '@local/design-system'`)
export { default } from './Toast';
export { default as Toast } from './Toast';

// Additional UI components and tokens
export { default as Button } from './Button';
export * as tokens from './tokens';
export { default as Input } from './Input';
export { default as Card } from './Card';
export { default as Icon } from './Icon';
export { ThemeProvider, useTheme } from './ThemeProvider';
export { default as Badge } from './Badge';
export { default as Modal } from './Modal';
