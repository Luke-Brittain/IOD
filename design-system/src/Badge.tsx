import React from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'default' | 'muted' | 'gold' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const cls = [styles.badge, variant !== 'default' ? (styles as any)[variant] : '', className]
    .filter(Boolean)
    .join(' ');

  return <span className={cls}>{children}</span>;
}
