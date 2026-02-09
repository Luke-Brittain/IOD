import React from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'default' | 'muted' | 'gold' | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export default function Badge({ children, variant = 'default', className, ...rest }: BadgeProps) {
  const cls = [styles.badge, variant !== 'default' ? (styles as any)[variant] : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span {...rest} className={cls}>
      {children}
    </span>
  );
}
