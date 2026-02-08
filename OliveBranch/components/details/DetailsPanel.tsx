"use client";

import React, { useState } from 'react';

interface DetailsPanelProps {
  nodeId?: string | null;
  onClose?: () => void;
}

export default function DetailsPanel({ nodeId, onClose }: DetailsPanelProps) {
  const [editing, setEditing] = useState(false);
  const [formState, setFormState] = useState<Record<string, unknown>>({});

  if (!nodeId) return null;

  return (
    <aside style={{ width: 360, padding: 16, background: '#fff', borderLeft: '1px solid #e6edf0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Node: {nodeId}</h3>
        <button onClick={onClose}>Close</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={() => setEditing((s) => !s)}>{editing ? 'Cancel' : 'Edit'}</button>
      </div>

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // Placeholder: call PATCH /api/nodes/:id with merge-preserving behavior
            console.log('submit', nodeId, formState);
            setEditing(false);
          }}
        >
          <div style={{ marginTop: 12 }}>
            <label>
              Name
              <input value={(formState.name as string) ?? ''} onChange={(e) => setFormState({ ...formState, name: e.target.value })} />
            </label>
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="submit">Save</button>
          </div>
        </form>
      ) : (
        <div style={{ marginTop: 12 }}>
          <p>Read-only details for node <strong>{nodeId}</strong>. Use Edit to modify.</p>
        </div>
      )}
    </aside>
  );
}
