/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
// Generated file — suppress linting and type-checking during development
/**
 * Auto-generated lightweight API client for OliveBranch OpenAPI (minimal, fetch-based)
 * - Supports the POST /api/import/csv endpoint with JSON or multipart/form-data
 * - Keep this file small and dependency-free; adapt for more endpoints as needed
 */

export type Row = Record<string, string | null>;

export type RowResult = {
  rowIndex: number;
  status: 'created' | 'updated' | 'would-create' | 'would-update' | 'skipped' | 'error';
  note?: string;
  error?: string;
};

export type ImportResponse = {
  results: RowResult[];
};

export interface ImportOptions {
  dryRun?: boolean;
  stableKeys?: string | string[]; // comma-separated or array
  signal?: AbortSignal;
}

function buildQuery(opts?: ImportOptions): string {
  if (!opts) return '';
  const params: string[] = [];
  if (opts.dryRun) params.push('dryRun=true');
  if (opts.stableKeys) {
    const v = Array.isArray(opts.stableKeys) ? opts.stableKeys.join(',') : opts.stableKeys;
    params.push('stableKeys=' + encodeURIComponent(v));
  }
  return params.length ? `?${params.join('&')}` : '';
}

export async function importCsvAsJson(rows: Row[], opts?: ImportOptions): Promise<ImportResponse> {
  const q = buildQuery(opts);
  const res = await fetch(`/api/import/csv${q}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
    signal: opts?.signal,
  });
  if (!res.ok) throw new Error(`Import failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function importCsvFile(file: File, opts?: ImportOptions): Promise<ImportResponse> {
  const q = buildQuery(opts);
  const fd = new FormData();
  fd.append('file', file);
  if (opts?.stableKeys) {
    const v = Array.isArray(opts.stableKeys) ? opts.stableKeys.join(',') : opts.stableKeys;
    fd.append('stableKeys', v);
  }
  const res = await fetch(`/api/import/csv${q}`, {
    method: 'POST',
    body: fd,
    signal: opts?.signal,
  });
  if (!res.ok) throw new Error(`Import failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export default {
  importCsvAsJson,
  importCsvFile,
};
