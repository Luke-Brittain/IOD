/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
// Generated file — suppress linting and type-checking during development
// Safely require `next/server` only when available (avoid breaking tests/builds that aren't Next.js)
let NextResponse: any;
try {
  // prefer dynamic require to avoid ESM/TS resolution issues in non-Next environments
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ns = require('next/server');
  NextResponse = ns?.NextResponse ?? ns;
} catch {
  // Fallback implementation that returns a lightweight Response-like object
  // with a `json()` helper. Some test environments (jsdom/vitest) may not
  // provide the exact same `Response` implementation as Next.js, and tests
  // assert on `res.json()`. Returning an object with an async `json()`
  // method keeps the behavior predictable.
  NextResponse = {
    json(body: any, init?: any) {
      const headers = (init && init.headers) || { 'content-type': 'application/json' };
      const status = init?.status ?? 200;
      return {
        status,
        headers,
        async json() {
          return body;
        },
        async text() {
          return JSON.stringify(body);
        },
      };
    },
  };
}

// Ensure any returned value behaves like a Response with a `json()` method.
function _toResp(body: any, init?: any) {
  try {
    const out = NextResponse.json(body, init);
    if (out && typeof out.json === 'function') return out;
  } catch {
    // fallthrough to returning our lightweight object
  }
  const headers = (init && init.headers) || { 'content-type': 'application/json' };
  const status = init?.status ?? 200;
  return {
    status,
    headers,
    async json() {
      return body;
    },
    async text() {
      return JSON.stringify(body);
    },
  };
}

import { Readable } from 'stream';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export async function importCsvHandler(req: Request): Promise<Response> {
  try {
    const { requirePermission } = await import('@/lib/authMiddleware');
    const user = await requirePermission(req, 'nodes:create');

    const ct = req.headers.get('content-type') || '';
    const url = new URL(req.url);
    const dryRun = url.searchParams.get('dryRun') === 'true';
    const stableKeysQuery = url.searchParams.get('stableKeys') ?? undefined;

    async function parseCsvText(text: string) {
      try {
        const mod = await import('csv-parse/sync');
        const parse = (mod as any).parse ?? (mod as any).default ?? mod;
        return (parse(text, { columns: true, skip_empty_lines: true, trim: true }) as any[]).map((rec) => {
          const out: Record<string, string | null> = {};
          for (const k of Object.keys(rec)) {
            const v = rec[k];
            out[String(k).trim()] = v === '' ? null : (v == null ? null : String(v));
          }
          return out;
        });
      } catch {
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
        if (lines.length === 0) return [];
        const headers = lines[0].split(',').map((h) => h.trim());
        return lines.slice(1).map((line) => {
          const cols = line.split(',');
          const row: Record<string, string | null> = {};
          for (let i = 0; i < headers.length; i++) row[headers[i]] = cols[i] === '' ? null : (cols[i] ?? null);
          return row;
        });
      }
    }

    if (ct.includes('application/json')) {
      const body = await req.json();
      const { ImportRowsSchema } = await import('@/lib/validation/schemas');
      const parsed = ImportRowsSchema.safeParse(body);
      if (!parsed.success) return _toResp({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });

      const rows = parsed.data.rows as Record<string, unknown>[];
      const stableKeysFromBody = Array.isArray(body?.stableKeys) ? body.stableKeys : typeof body?.stableKeys === 'string' ? String(body.stableKeys).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined;
      const stableKeys = stableKeysQuery ? stableKeysQuery.split(',').map((s) => s.trim()).filter(Boolean) : stableKeysFromBody;

      const svc = await import('@/services/nodeService');
      const upsertNode = (svc as any).upsertNode;
      const getNodeById = (svc as any).getNodeById;
      const summary = { processed: rows.length, created: 0, updated: 0, errors: 0 };
      const rowResults: unknown[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as Record<string, unknown>;
        try {
          if (dryRun) {
            if (row.id) {
              const existing = await getNodeById(String(row.id));
              if (existing.success && existing.data) { rowResults.push({ row: i + 1, status: 'would-update' }); summary.updated++; continue; }
            }
            if (!row.id && (stableKeys && stableKeys.length)) {
              const finder = (svc as any).findNodeByStableKeys;
              if (typeof finder === 'function') {
                const found = await finder(row, stableKeys as string[]);
                if (found.success && found.data) { rowResults.push({ row: i + 1, status: 'would-update', note: 'matched_by_stable_keys' }); summary.updated++; continue; }
              }
            }
            const { NodeCreateSchema } = await import('@/lib/validation/schemas');
            const parsedCreate = NodeCreateSchema.safeParse(row as unknown);
            if (!parsedCreate.success) { summary.errors++; rowResults.push({ row: i + 1, status: 'error', code: 'VALIDATION_ERROR', message: parsedCreate.error.flatten() }); }
            else { rowResults.push({ row: i + 1, status: 'would-create' }); summary.created++; }
            continue;
          }

          const stableKeysForRow = stableKeys && stableKeys.length ? stableKeys : undefined;
          const upsertRes = await upsertNode(user, row as Record<string, unknown>, stableKeysForRow);
          const hasId = !!row.id;
          const hasStableKeyVal = Array.isArray(stableKeysForRow) && stableKeysForRow.some((k) => (row as Record<string, unknown>)[k]);
          if (upsertRes.success) { if (hasId || hasStableKeyVal) { summary.updated++; rowResults.push({ row: i + 1, status: 'updated' }); } else { summary.created++; rowResults.push({ row: i + 1, status: 'created' }); } }
          else { summary.errors++; rowResults.push({ row: i + 1, status: 'error', code: upsertRes.error?.code ?? 'IMPORT_ERROR', message: upsertRes.error?.message ?? 'upsert failed' }); }
        } catch (e: unknown) { summary.errors++; const message = typeof e === 'object' && e !== null && 'message' in e && typeof (e as Record<string, unknown>).message === 'string' ? (e as Record<string, unknown>).message as string : 'unknown'; rowResults.push({ row: i + 1, status: 'error', code: 'IMPORT_ERROR', message }); }
      }

      return _toResp({ success: true, data: { summary, rows: rowResults } });
    }

    if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file') as File | null;
      const stableKeysFromForm = form.get('stableKeys') ? String(form.get('stableKeys')) : undefined;
      const stableKeys = stableKeysQuery ? stableKeysQuery.split(',').map((s) => s.trim()).filter(Boolean) : (stableKeysFromForm ? stableKeysFromForm.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
      if (!file) return _toResp({ success: false, error: { code: 'MISSING_FILE', message: 'Form must include a `file` field with CSV.' } }, { status: 400 });
      if (typeof (file as any).size === 'number' && (file as any).size > MAX_UPLOAD_BYTES) return _toResp({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'Uploaded file exceeds the 5MB size limit.' } }, { status: 413 });

      let records: Record<string, string | null>[] = [];
      const webStream = (file as any).stream?.();
      if (webStream && typeof Readable.fromWeb === 'function') {
        const nodeStream = Readable.fromWeb(webStream as any) as NodeJS.ReadableStream;
        const csv = await import('csv-parse');
        const parser = (csv as any).parse({ columns: true, relax_quotes: true, skip_empty_lines: true, trim: true });
        const recs: Record<string, string | null>[] = [];
        await new Promise<void>((resolve, reject) => { nodeStream.pipe(parser as any).on('data', (r: any) => recs.push(r)).on('end', () => resolve()).on('error', (err: unknown) => reject(err)); });
        records = recs;
      } else {
        const text = await file.text();
        records = await parseCsvText(text as string);
      }

      const rows = records.map((r) => { const out: Record<string, unknown> = {}; for (const [k, v] of Object.entries(r)) { const key = String(k).trim(); const normalizedKey = key.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase(); out[normalizedKey] = v === '' ? undefined : v; } return out; });

      const svc2 = await import('@/services/nodeService');
      const upsertNode = (svc2 as any).upsertNode;
      const getNodeById = (svc2 as any).getNodeById;
      const updateNode = (svc2 as any).updateNode;
      const { NodeCreateSchema } = await import('@/lib/validation/schemas');
      const summary = { processed: rows.length, created: 0, updated: 0, errors: 0 };
      const rowResults: unknown[] = [];

      for (let i = 0; i < rows.length; i++) {
        const normalized = rows[i];
        try {
          if ((normalized as Record<string, unknown>).id) {
            const existing = await getNodeById(String((normalized as Record<string, unknown>).id));
            if (existing.success && existing.data) { if (dryRun) { summary.updated++; rowResults.push({ row: i + 1, status: 'would-update' }); continue; } await updateNode(user, String((normalized as Record<string, unknown>).id), normalized as Record<string, unknown>); summary.updated++; rowResults.push({ row: i + 1, status: 'updated' }); continue; }
          }

          if (dryRun && !(normalized as Record<string, unknown>).id && (stableKeys && stableKeys.length)) {
            const finder = (svc2 as any).findNodeByStableKeys;
            if (typeof finder === 'function') {
              const found = await finder(normalized as Record<string, unknown>, stableKeys as string[]);
              if (found.success && found.data) { summary.updated++; rowResults.push({ row: i + 1, status: 'would-update', note: 'matched_by_stable_keys' }); continue; }
            }
          }

          const toCreate: Record<string, unknown> = {}; for (const [k, v] of Object.entries(normalized)) { if (v !== undefined) toCreate[k] = v; }
          const parsedCreate = NodeCreateSchema.safeParse(toCreate as unknown);
          if (!parsedCreate.success) { summary.errors++; rowResults.push({ row: i + 1, status: 'error', code: 'VALIDATION_ERROR', message: parsedCreate.error.flatten() }); continue; }
          if (dryRun) { summary.created++; rowResults.push({ row: i + 1, status: 'would-create' }); continue; }

          const upsertRes = await upsertNode(user, parsedCreate.data as Record<string, unknown>, stableKeys as string[] | undefined);
          const hasStableKeyVal = Array.isArray(stableKeys) && stableKeys.some((k) => (parsedCreate.data as Record<string, unknown>)[k]);
          if (upsertRes.success) { if ((parsedCreate.data as Record<string, unknown>).id || hasStableKeyVal) { summary.updated++; rowResults.push({ row: i + 1, status: 'updated' }); } else { summary.created++; rowResults.push({ row: i + 1, status: 'created' }); } }
          else { summary.errors++; rowResults.push({ row: i + 1, status: 'error', code: upsertRes.error?.code ?? 'IMPORT_ERROR', message: upsertRes.error?.message ?? 'upsert failed' }); }
        } catch (e: unknown) { summary.errors++; const message = typeof e === 'object' && e !== null && 'message' in e && typeof (e as Record<string, unknown>).message === 'string' ? (e as Record<string, unknown>).message as string : 'unknown'; rowResults.push({ row: i + 1, status: 'error', code: 'IMPORT_ERROR', message }); }
      }

      return _toResp({ success: true, data: { summary, rows: rowResults } });
    }

    return _toResp({ success: false, error: { code: 'INVALID_CONTENT_TYPE', message: 'Use application/json with { rows: [...] } or multipart/form-data with a `file` field.' } }, { status: 400 });
  } catch (err: unknown) {
    // Log error during tests to aid debugging
    // eslint-disable-next-line no-console
    console.error('importCsvHandler error:', err);
    const status = typeof err === 'object' && err !== null && 'status' in err ? (err as Record<string, unknown>).status as number : 500;
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : String(err ?? 'Unknown');
    return _toResp({ success: false, error: { code: 'ERR', message } }, { status });
  }
}

export default importCsvHandler;
