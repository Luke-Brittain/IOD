"use client";

import React, { useState, useEffect } from 'react';

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
    <aside style={{ width: 360, padding: 16, background: '#fff', borderLeft: '1px solid #e6edf0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Node: {nodeId}</h3>
        <button onClick={onClose}>Close</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginTop: 12 }}>
        <button onClick={() => setEditing((s) => !s)}>{editing ? 'Cancel' : 'Edit'}</button>
      </div>

      {editing ? (
        <form onSubmit={handleSubmit}>
          <div style={{ marginTop: 12 }}>
            <label>
              Name
              <input value={(formState.name as string) ?? ''} onChange={(e) => setFormState({ ...formState, name: e.target.value })} />
            </label>
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={loading}>Save</button>
          </div>
        </form>
      ) : (
        <div style={{ marginTop: 12 }}>
          <p>Read-only details for node <strong>{nodeId}</strong>. Use Edit to modify.</p>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(formState, null, 2)}</pre>
        </div>
      )}
    </aside>
  );
}
