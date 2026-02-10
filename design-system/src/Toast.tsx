import React from 'react';
import styles from './Toast.module.css';

interface Props {
  pendingCount: number;
  failedIds: string[];
  onRetryAll: () => void;
  onDismissFailed: () => void;
}

export default function Toast({ pendingCount, failedIds, onRetryAll, onDismissFailed }: Props) {
  if (pendingCount === 0 && failedIds.length === 0) return null;

  return (
    <div className={styles.container} role="status" aria-live="polite">
      {pendingCount > 0 && (
        <div className={styles.pendingRow}>
          <div className={styles.dot} />
          <div>Saving {pendingCount} change{pendingCount > 1 ? 's' : ''}…</div>
        </div>
      )}

      {pendingCount === 0 && failedIds.length > 0 && (
        <div className={styles.rowSpace}>
          <div>Failed to save {failedIds.length} change{failedIds.length > 1 ? 's' : ''}.</div>
          <div className={styles.actions}>
            <button onClick={onRetryAll} className={styles.btnPrimary}>Retry</button>
            <button onClick={onDismissFailed} className={styles.btnSecondary}>Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
}
