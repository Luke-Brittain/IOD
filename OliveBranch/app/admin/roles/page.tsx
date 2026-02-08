"use client";

import { useEffect, useState } from 'react';

export default function RolesAdmin() {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/roles').then(async (r) => {
      if (r.status === 403) {
        // not authorized, redirect to home
        window.location.href = '/';
        return;
      }
      const j = await r.json().catch(() => ({}));
      setText(JSON.stringify(j.data ?? j, null, 2));
    }).catch(() => setText('{}'));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const parsed = JSON.parse(text);
      const res = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) throw new Error('Save failed');
      alert('Saved');
    } catch (e) {
      alert('Invalid JSON or save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Role Permissions (Admin)</h1>
      <p>Edit the JSON mapping and click Save. Requires an admin session.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} style={{ width: '100%', height: 420, fontFamily: 'monospace' }} />
      <div style={{ marginTop: 12 }}>
        <button onClick={save} disabled={saving} style={{ padding: '8px 16px' }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </main>
  );
}
