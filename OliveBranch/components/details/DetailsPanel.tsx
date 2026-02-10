"use client";

import React, { useState, useEffect } from 'react';
import { Button, Input, Spinner } from '@local/design-system';
import styles from './DetailsPanel.module.css';

interface DetailsPanelProps {
  nodeId?: string | null;
  onClose?: () => void;
  onSelectNode?: (id: string) => void;
}

export default function DetailsPanel({ nodeId, onClose, onSelectNode }: DetailsPanelProps) {
  const [editing, setEditing] = useState(false);
  const [formState, setFormState] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [neighbors, setNeighbors] = useState<Array<{ edge: Record<string, unknown>; node: Record<string, unknown> | null }>>([]);
  const [depth, setDepth] = useState<number>(2);
  const [neighborsLoading, setNeighborsLoading] = useState<boolean>(false);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());

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
        // neighbors are loaded by separate effect (depends on `depth`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg ?? 'load error');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [nodeId]);

  // fetch neighbors when nodeId or depth changes
  useEffect(() => {
    let mounted = true;
    async function loadNeighbors() {
      if (!nodeId) {
        setNeighbors([]);
        return;
      }
      setNeighborsLoading(true);
      try {
        const r = await fetch(`/api/nodes/${encodeURIComponent(nodeId)}/neighbors?depth=${depth}`);
        if (r.ok) {
          const j = await r.json();
          if (mounted) {
            const items = j.data?.neighbors ?? [];
            setNeighbors(items);
            // set highlight IDs for newly loaded neighbors
            const ids = new Set(items.map((it: { node?: Record<string, unknown> | null }) => it.node?.id as string | undefined).filter(Boolean));
            setHighlightIds(ids);
            // clear highlights after 1.5s
            setTimeout(() => {
              if (mounted) setHighlightIds(new Set());
            }, 1500);
          }
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setNeighborsLoading(false);
      }
    }
    loadNeighbors();
    return () => { mounted = false; };
  }, [nodeId, depth]);

  // When neighbors update, auto-focus first neighbor if nothing else is focused
  // no auto-focus for MVP
  useEffect(() => { /* noop */ }, [neighbors]);

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg ?? 'save error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h3>Node: {nodeId}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label={`Close details for ${nodeId}`}>Close</Button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing((s) => !s)} aria-pressed={editing} aria-label={editing ? 'Cancel edit' : 'Edit node'}>{editing ? 'Cancel' : 'Edit'}</Button>
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
            <Button type="submit" variant="primary" disabled={loading} aria-label="Save node changes">Save</Button>
          </div>
        </form>
      ) : (
          <div className={styles.section}>
          <p>Read-only details for node <strong>{nodeId}</strong>. Use Edit to modify.</p>
          <div className={styles.properties}>
            <table>
              <tbody>
                {Object.entries(formState).map(([k, v]) => (
                  <tr key={k}>
                    <td className={styles.key}>{k}</td>
                    <td className={styles.value}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {neighbors.length > 0 && (
            <div className={styles.section}>
              <div className={styles.rowBetween}>
                <h4>Neighbors ({depth}-level)</h4>
                <div className={styles.row}>
                  <label className={styles.label + ' ' + styles.depthLabel}>Depth:</label>
                  <select className={styles.depthSelect} value={String(depth)} onChange={(e) => setDepth(parseInt(e.target.value, 10))}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>
              </div>
              <div className={styles.rowBetween}>
                {neighborsLoading ? <Spinner size="sm" aria-label="Loading neighbors" /> : <p className={styles.note}>Showing neighbors up to {depth} hops for context.</p>}
              </div>
              <ul className={styles.neighbors}>
                {neighbors.map(({ edge, node }) => {
                  const nid = node?.id;
                  const isHighlighted = nid ? highlightIds.has(nid) : false;
                  return (
                    <li key={edge.id} className={isHighlighted ? styles.highlight : ''}>
                      <button
                        className={styles.link}
                        type="button"
                        onClick={() => { if (node?.id) onSelectNode?.(node.id); }}
                        aria-label={node?.id ? `Select node ${String(node.id)} — ${String(edge.label)}` : `Neighbor ${String(edge.label)}`}
                      >
                        {node?.label ?? node?.id} — <em>{edge.label}</em>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {/* no keyboard-listbox for MVP */}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
