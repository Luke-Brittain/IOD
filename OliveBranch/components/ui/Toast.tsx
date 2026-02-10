// Re-export design-system Toast to keep imports stable while the design-system
// package is the canonical source. This avoids duplication while we consider
// moving design-system to a workspace package.

export { default } from '@local/design-system';

