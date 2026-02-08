"use client";

import { useEffect, useState } from 'react';
import { tokens, Button } from '@local/design-system';
import styles from './roles.module.css';

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
    <main className={styles.page}>
      <h1>Role Permissions (Admin)</h1>
      <p>Edit the JSON mapping and click Save. Requires an admin session.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} className={styles.textarea} />
      <div className={styles.actions}>
        <Button onClick={save} disabled={saving} className={styles.saveButton}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </main>
  );
}
