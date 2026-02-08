"use client";

import React, { useState } from 'react';
import { tokens, Button, Input } from '@local/design-system';
import styles from './ImportToolbar.module.css';

export default function ImportToolbar() {
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [stableKeys, setStableKeys] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (stableKeys) fd.append('stableKeys', stableKeys);
      const qs = dryRun ? '?dryRun=true' : '';
      const res = await fetch(`/api/import/csv${qs}`, { method: 'POST', body: fd });
      const json = await res.json();
      setResult(json);
    } catch (e) {
      setResult({ success: false, error: String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.toolbar}>
      <Input type="file" accept=".csv,text/csv" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)} />
      <label className={styles.label}>
        <Input type="checkbox" checked={dryRun} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDryRun(e.target.checked)} />
        <span style={{ marginLeft: 6 }}>Dry-run</span>
      </label>
      <Input placeholder="stableKeys (comma)" value={stableKeys} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStableKeys(e.target.value)} />
      <Button onClick={submit} disabled={!file || loading}>{loading ? 'Uploading...' : 'Import'}</Button>
      {result && <pre className={styles.result}>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
