import React from 'react';
import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  'aria-label'?: string;
}

export default function Spinner({ size = 'md', label, className, 'aria-label': ariaLabel }: SpinnerProps) {
  const svgClass = [styles.svg, styles[size]].filter(Boolean).join(' ');
  return (
    <span role="status" aria-label={ariaLabel ?? (label ? label : 'loading')} className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <svg className={svgClass} viewBox="0 0 24 24" aria-hidden={label ? 'false' : 'true'} focusable="false">
        <title>{label ?? 'Loading'}</title>
        <circle cx="12" cy="12" r="9" strokeOpacity="0.18" strokeWidth="2.5" />
        <path d="M21 12a9 9 0 0 0-9-9" />
      </svg>
      {label ? <span className={styles.label}>{label}</span> : null}
    </span>
  );
}
