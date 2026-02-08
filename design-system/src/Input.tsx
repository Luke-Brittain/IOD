import React from 'react';
import styles from './Input.module.css';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  full?: boolean;
}

export default function Input({ label, full, className, ...rest }: Props) {
  const cls = [styles.input, full ? styles.full : '', className].filter(Boolean).join(' ');

  if (label) {
    return (
      <label className={styles.withLabel}>
        <div style={{ marginBottom: 6, fontSize: 13 }}>{label}</div>
        <input className={cls} {...rest} />
      </label>
    );
  }

  return <input className={cls} {...rest} />;
}
