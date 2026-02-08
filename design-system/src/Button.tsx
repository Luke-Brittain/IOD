import React from 'react';
import styles from './Button.module.css';
import { colors, spacing } from './tokens';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md';
}

export default function Button({ variant = 'primary', size = 'md', children, style, ...rest }: Props) {
  const classList = [styles.btn, variant === 'primary' ? styles.primary : styles.ghost, size === 'md' ? styles['size-md'] : styles['size-sm']].join(' ');

  const mergedStyle: React.CSSProperties = {
    fontFamily: 'Inter, Helvetica, Arial, sans-serif',
    borderRadius: 6,
    ...style,
  } as any;

  return (
    <button className={classList} style={mergedStyle} {...rest}>
      {children}
    </button>
  );
}
