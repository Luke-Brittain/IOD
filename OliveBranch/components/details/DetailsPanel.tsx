"use client";

import React, { useState, useEffect } from 'react';
import { tokens, Button, Input } from '@local/design-system';
import styles from './DetailsPanel.module.css';

interface DetailsPanelProps {
  nodeId?: string | null;
  onClose?: () => void;
}

export default function DetailsPanel({ nodeId, onClose }: DetailsPanelProps) {
  const [editing, setEditing] = useState(false);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!nodeId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/nodes/${encodeURIComponent(nodeId)}`);
        if (!res.ok) throw new Error(`Failed to load ${res.status}`);
        const json = await res.json();
        if (!mounted) return;
        setFormState(json.data ?? {});
      } catch (e: any) {
        setError(e?.message ?? 'load error');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [nodeId]);

  if (!nodeId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Build payload with only fields that are non-empty (merge-preserving)
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(formState)) {
        if (v === '' || v === undefined) continue; // do not send blank fields
        payload[k] = v;
      }
      const res = await fetch(`/api/nodes/${encodeURIComponent(nodeId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      const json = await res.json();
      setFormState(json.data ?? formState);
      setEditing(false);
    } catch (e: any) {
      setError(e?.message ?? 'save error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h3>Node: {nodeId}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button variant="ghost" size="sm" onClick={() => setEditing((s) => !s)}>{editing ? 'Cancel' : 'Edit'}</Button>
      </div>

      {editing ? (
        <form onSubmit={handleSubmit}>
          <div className={styles.section}>
            <label className={styles.label}>
              Name
            </label>
            <Input className={styles.input} value={(formState.name as string) ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormState({ ...formState, name: e.target.value })} />
          </div>
          <div className={styles.section}>
            <Button type="submit" variant="primary" disabled={loading}>Save</Button>
          </div>
        </form>
      ) : (
        <div className={styles.section}>
          <p>Read-only details for node <strong>{nodeId}</strong>. Use Edit to modify.</p>
          <pre className={styles.pre}>{JSON.stringify(formState, null, 2)}</pre>
        </div>
      )}
    </aside>
  );
}
