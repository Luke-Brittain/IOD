"use client";

import React, { useState } from 'react';

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
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} /> Dry-run
      </label>
      <input placeholder="stableKeys (comma)" value={stableKeys} onChange={(e) => setStableKeys(e.target.value)} />
      <button onClick={submit} disabled={!file || loading}>{loading ? 'Uploading...' : 'Import'}</button>
      {result && <pre style={{ maxWidth: 400, whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
