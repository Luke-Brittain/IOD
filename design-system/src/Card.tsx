import React, { ReactNode } from 'react';
import styles from './Card.module.css';

interface Props {
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function Card({ title, children, footer, className }: Props) {
  return (
    <div className={[styles.card, className].filter(Boolean).join(' ')}>
      {title && <div className={styles.header}>{title}</div>}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
