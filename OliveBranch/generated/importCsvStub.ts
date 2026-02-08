import { NextResponse } from 'next/server';
import { Readable } from 'stream';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Canonical generated import CSV handler.
 * Supports JSON { rows: [...] } and multipart/form-data with `file` CSV.
 */
export default async function importCsvHandler(req: Request): Promise<Response> {
  try {
    const { requirePermission } = await import('@/lib/authMiddleware');
    await requirePermission(req, 'nodes:create');

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

    // JSON body: { rows: [...] }
    if (ct.includes('application/json')) {
      const body = await req.json();
      const { ImportRowsSchema } = await import('@/lib/validation/schemas');
      const parsed = ImportRowsSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });

      const rows = parsed.data.rows as Record<string, unknown>[];
      const stableKeysFromBody = Array.isArray(body?.stableKeys) ? body.stableKeys : typeof body?.stableKeys === 'string' ? String(body.stableKeys).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined;
      const stableKeys = stableKeysQuery ? stableKeysQuery.split(',').map((s) => s.trim()).filter(Boolean) : stableKeysFromBody;

      const svc = await import('@/services/nodeService');
      const upsertNode = (svc as any).upsertNode;
      const getNodeById = (svc as any).getNodeById;
      const findNodeByStableKeys = (svc as any).findNodeByStableKeys;

      const summary = { processed: rows.length, created: 0, updated: 0, errors: 0 };
      const rowResults: unknown[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as Record<string, unknown>;
        try {
          if (dryRun) {
            if ((row as any).id) {
              const existing = await getNodeById(String((row as any).id));
              if (existing.success && existing.data) { rowResults.push({ row: i + 1, status: 'would-update' }); summary.updated++; continue; }
            }
            if (!(row as any).id && (stableKeys && stableKeys.length) && typeof findNodeByStableKeys === 'function') {
              const found = await findNodeByStableKeys(row, stableKeys as string[]);
              if (found.success && found.data) { rowResults.push({ row: i + 1, status: 'would-update', note: 'matched_by_stable_keys' }); summary.updated++; continue; }
            }
            const { NodeCreateSchema } = await import('@/lib/validation/schemas');
            const parsedCreate = NodeCreateSchema.safeParse(row as unknown);
            if (!parsedCreate.success) { summary.errors++; rowResults.push({ row: i + 1, status: 'error', code: 'VALIDATION_ERROR', message: parsedCreate.error.flatten() }); }
            else { rowResults.push({ row: i + 1, status: 'would-create' }); summary.created++; }
            continue;
          }

          const stableKeysForRow = stableKeys && stableKeys.length ? stableKeys : undefined;
          const upsertRes = await upsertNode(undefined as any, row as Record<string, unknown>, stableKeysForRow);
          if (upsertRes.success) { rowResults.push({ row: i + 1, status: 'updated' }); summary.updated++; } else { summary.errors++; rowResults.push({ row: i + 1, status: 'error', code: upsertRes.error?.code ?? 'IMPORT_ERROR', message: upsertRes.error?.message ?? 'upsert failed' }); }
        } catch (e: unknown) { summary.errors++; const message = (e && typeof e === 'object' && 'message' in e) ? (e as any).message : String(e); rowResults.push({ row: i + 1, status: 'error', code: 'IMPORT_ERROR', message }); }
      }

      return NextResponse.json({ success: true, data: { summary, rows: rowResults } });
    }

    // multipart/form-data with `file` CSV
    if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file') as File | null;
      const stableKeysFromForm = form.get('stableKeys') ? String(form.get('stableKeys')) : undefined;
      const stableKeys = stableKeysQuery ? stableKeysQuery.split(',').map((s) => s.trim()).filter(Boolean) : (stableKeysFromForm ? stableKeysFromForm.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
      if (!file) return NextResponse.json({ success: false, error: { code: 'MISSING_FILE', message: 'Form must include a `file` field with CSV.' } }, { status: 400 });
      if (typeof (file as any).size === 'number' && (file as any).size > MAX_UPLOAD_BYTES) return NextResponse.json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'Uploaded file exceeds the 5MB size limit.' } }, { status: 413 });

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

      const svc = await import('@/services/nodeService');
      const upsertNode = (svc as any).upsertNode;
      const getNodeById = (svc as any).getNodeById;
      const findNodeByStableKeys = (svc as any).findNodeByStableKeys;
      const updateNode = (svc as any).updateNode;
      const { NodeCreateSchema } = await import('@/lib/validation/schemas');

      const summary = { processed: rows.length, created: 0, updated: 0, errors: 0 };
      const rowResults: unknown[] = [];

      for (let i = 0; i < rows.length; i++) {
        const normalized = rows[i];
        try {
          if ((normalized as Record<string, unknown>).id) {
            const existing = await getNodeById(String((normalized as Record<string, unknown>).id));
            if (existing.success && existing.data) { if (dryRun) { summary.updated++; rowResults.push({ row: i + 1, status: 'would-update' }); continue; } await updateNode(undefined as any, String((normalized as Record<string, unknown>).id), normalized as Record<string, unknown>); summary.updated++; rowResults.push({ row: i + 1, status: 'updated' }); continue; }
          }

          if (dryRun && !(normalized as Record<string, unknown>).id && (stableKeys && stableKeys.length) && typeof findNodeByStableKeys === 'function') {
            const found = await findNodeByStableKeys(normalized as Record<string, unknown>, stableKeys as string[]);
            if (found.success && found.data) { summary.updated++; rowResults.push({ row: i + 1, status: 'would-update', note: 'matched_by_stable_keys' }); continue; }
          }

          const toCreate: Record<string, unknown> = {}; for (const [k, v] of Object.entries(normalized)) { if (v !== undefined) toCreate[k] = v; }
          const parsedCreate = NodeCreateSchema.safeParse(toCreate as unknown);
          if (!parsedCreate.success) { summary.errors++; rowResults.push({ row: i + 1, status: 'error', code: 'VALIDATION_ERROR', message: parsedCreate.error.flatten() }); continue; }
          if (dryRun) { summary.created++; rowResults.push({ row: i + 1, status: 'would-create' }); continue; }

          const upsertRes = await upsertNode(undefined as any, parsedCreate.data as Record<string, unknown>, stableKeys as string[] | undefined);
          if (upsertRes.success) { summary.created++; rowResults.push({ row: i + 1, status: 'created' }); } else { summary.errors++; rowResults.push({ row: i + 1, status: 'error', code: upsertRes.error?.code ?? 'IMPORT_ERROR', message: upsertRes.error?.message ?? 'upsert failed' }); }
        } catch (e: unknown) { summary.errors++; const message = (e && typeof e === 'object' && 'message' in e) ? (e as any).message : String(e); rowResults.push({ row: i + 1, status: 'error', code: 'IMPORT_ERROR', message }); }
      }

      return NextResponse.json({ success: true, data: { summary, rows: rowResults } });
    }

    return NextResponse.json({ success: false, error: { code: 'INVALID_CONTENT_TYPE', message: 'Use application/json with { rows: [...] } or multipart/form-data with a `file` field.' } }, { status: 400 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error('importCsvHandler error (stub):', err);
    const status = (err && typeof err === 'object' && 'status' in err) ? (err as any).status as number : 500;
    const message = (err && typeof err === 'object' && 'message' in err) ? (err as any).message as string : String(err ?? 'Unknown');
    return NextResponse.json({ success: false, error: { code: 'ERR', message } }, { status });
  }
}
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Canonical generated import CSV handler.
 * Supports JSON { rows: [...] } and multipart/form-data with `file` CSV.
 */
export default async function importCsvHandler(req: Request): Promise<Response> {
  try {
    const { requirePermission } = await import('@/lib/authMiddleware');
    await requirePermission(req, 'nodes:create');

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

    // JSON body: { rows: [...] }
    if (ct.includes('application/json')) {
      const body = await req.json();
      const { ImportRowsSchema } = await import('@/lib/validation/schemas');
      const parsed = ImportRowsSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });

      const rows = parsed.data.rows as Record<string, unknown>[];
      const stableKeysFromBody = Array.isArray(body?.stableKeys) ? body.stableKeys : typeof body?.stableKeys === 'string' ? String(body.stableKeys).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined;
      const stableKeys = stableKeysQuery ? stableKeysQuery.split(',').map((s) => s.trim()).filter(Boolean) : stableKeysFromBody;

      const svc = await import('@/services/nodeService');
      const upsertNode = (svc as any).upsertNode;
      const getNodeById = (svc as any).getNodeById;
      const findNodeByStableKeys = (svc as any).findNodeByStableKeys;

      const summary = { processed: rows.length, created: 0, updated: 0, errors: 0 };
      const rowResults: unknown[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as Record<string, unknown>;
        try {
          if (dryRun) {
            if ((row as any).id) {
              const existing = await getNodeById(String((row as any).id));
              if (existing.success && existing.data) { rowResults.push({ row: i + 1, status: 'would-update' }); summary.updated++; continue; }
            }
            if (!(row as any).id && (stableKeys && stableKeys.length) && typeof findNodeByStableKeys === 'function') {
              const found = await findNodeByStableKeys(row, stableKeys as string[]);
              if (found.success && found.data) { rowResults.push({ row: i + 1, status: 'would-update', note: 'matched_by_stable_keys' }); summary.updated++; continue; }
            }
            const { NodeCreateSchema } = await import('@/lib/validation/schemas');
            const parsedCreate = NodeCreateSchema.safeParse(row as unknown);
            if (!parsedCreate.success) { summary.errors++; rowResults.push({ row: i + 1, status: 'error', code: 'VALIDATION_ERROR', message: parsedCreate.error.flatten() }); }
            else { rowResults.push({ row: i + 1, status: 'would-create' }); summary.created++; }
            continue;
          }

          const stableKeysForRow = stableKeys && stableKeys.length ? stableKeys : undefined;
          const upsertRes = await upsertNode(undefined as any, row as Record<string, unknown>, stableKeysForRow);
          if (upsertRes.success) { rowResults.push({ row: i + 1, status: 'updated' }); summary.updated++; } else { summary.errors++; rowResults.push({ row: i + 1, status: 'error', code: upsertRes.error?.code ?? 'IMPORT_ERROR', message: upsertRes.error?.message ?? 'upsert failed' }); }
        } catch (e: unknown) { summary.errors++; const message = (e && typeof e === 'object' && 'message' in e) ? (e as any).message : String(e); rowResults.push({ row: i + 1, status: 'error', code: 'IMPORT_ERROR', message }); }
      }

      return NextResponse.json({ success: true, data: { summary, rows: rowResults } });
    }

    // multipart/form-data with `file` CSV
    if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file') as File | null;
      const stableKeysFromForm = form.get('stableKeys') ? String(form.get('stableKeys')) : undefined;
      const stableKeys = stableKeysQuery ? stableKeysQuery.split(',').map((s) => s.trim()).filter(Boolean) : (stableKeysFromForm ? stableKeysFromForm.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
      if (!file) return NextResponse.json({ success: false, error: { code: 'MISSING_FILE', message: 'Form must include a `file` field with CSV.' } }, { status: 400 });
      if (typeof (file as any).size === 'number' && (file as any).size > MAX_UPLOAD_BYTES) return NextResponse.json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'Uploaded file exceeds the 5MB size limit.' } }, { status: 413 });

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

      const svc = await import('@/services/nodeService');
      const upsertNode = (svc as any).upsertNode;
      const getNodeById = (svc as any).getNodeById;
      const findNodeByStableKeys = (svc as any).findNodeByStableKeys;
      const updateNode = (svc as any).updateNode;
      const { NodeCreateSchema } = await import('@/lib/validation/schemas');

      const summary = { processed: rows.length, created: 0, updated: 0, errors: 0 };
      const rowResults: unknown[] = [];

      for (let i = 0; i < rows.length; i++) {
        const normalized = rows[i];
        try {
          if ((normalized as Record<string, unknown>).id) {
            const existing = await getNodeById(String((normalized as Record<string, unknown>).id));
            if (existing.success && existing.data) { if (dryRun) { summary.updated++; rowResults.push({ row: i + 1, status: 'would-update' }); continue; } await updateNode(undefined as any, String((normalized as Record<string, unknown>).id), normalized as Record<string, unknown>); summary.updated++; rowResults.push({ row: i + 1, status: 'updated' }); continue; }
          }

          if (dryRun && !(normalized as Record<string, unknown>).id && (stableKeys && stableKeys.length) && typeof findNodeByStableKeys === 'function') {
            const found = await findNodeByStableKeys(normalized as Record<string, unknown>, stableKeys as string[]);
            if (found.success && found.data) { summary.updated++; rowResults.push({ row: i + 1, status: 'would-update', note: 'matched_by_stable_keys' }); continue; }
          }

          const toCreate: Record<string, unknown> = {}; for (const [k, v] of Object.entries(normalized)) { if (v !== undefined) toCreate[k] = v; }
          const parsedCreate = NodeCreateSchema.safeParse(toCreate as unknown);
          if (!parsedCreate.success) { summary.errors++; rowResults.push({ row: i + 1, status: 'error', code: 'VALIDATION_ERROR', message: parsedCreate.error.flatten() }); continue; }
          if (dryRun) { summary.created++; rowResults.push({ row: i + 1, status: 'would-create' }); continue; }

          const upsertRes = await upsertNode(undefined as any, parsedCreate.data as Record<string, unknown>, stableKeys as string[] | undefined);
          if (upsertRes.success) { summary.created++; rowResults.push({ row: i + 1, status: 'created' }); } else { summary.errors++; rowResults.push({ row: i + 1, status: 'error', code: upsertRes.error?.code ?? 'IMPORT_ERROR', message: upsertRes.error?.message ?? 'upsert failed' }); }
        } catch (e: unknown) { summary.errors++; const message = (e && typeof e === 'object' && 'message' in e) ? (e as any).message : String(e); rowResults.push({ row: i + 1, status: 'error', code: 'IMPORT_ERROR', message }); }
      }

      return NextResponse.json({ success: true, data: { summary, rows: rowResults } });
    }

    return NextResponse.json({ success: false, error: { code: 'INVALID_CONTENT_TYPE', message: 'Use application/json with { rows: [...] } or multipart/form-data with a `file` field.' } }, { status: 400 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error('importCsvHandler error (stub):', err);
    const status = (err && typeof err === 'object' && 'status' in err) ? (err as any).status as number : 500;
    const message = (err && typeof err === 'object' && 'message' in err) ? (err as any).message as string : String(err ?? 'Unknown');
    return NextResponse.json({ success: false, error: { code: 'ERR', message } }, { status });
  }
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
      if (!parsed.success) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });

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

      return NextResponse.json({ success: true, data: { summary, rows: rowResults } });
    }

    if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file') as File | null;
      const stableKeysFromForm = form.get('stableKeys') ? String(form.get('stableKeys')) : undefined;
      const stableKeys = stableKeysQuery ? stableKeysQuery.split(',').map((s) => s.trim()).filter(Boolean) : (stableKeysFromForm ? stableKeysFromForm.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
      if (!file) return NextResponse.json({ success: false, error: { code: 'MISSING_FILE', message: 'Form must include a `file` field with CSV.' } }, { status: 400 });
      if (typeof (file as any).size === 'number' && (file as any).size > MAX_UPLOAD_BYTES) return NextResponse.json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'Uploaded file exceeds the 5MB size limit.' } }, { status: 413 });

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

      return NextResponse.json({ success: true, data: { summary, rows: rowResults } });
    }

    return NextResponse.json({ success: false, error: { code: 'INVALID_CONTENT_TYPE', message: 'Use application/json with { rows: [...] } or multipart/form-data with a `file` field.' } }, { status: 400 });
  } catch (err: unknown) {
    // Log error during tests to aid debugging
    // eslint-disable-next-line no-console
    console.error('importCsvHandler error (stub):', err);
    const status = typeof err === 'object' && err !== null && 'status' in err ? (err as Record<string, unknown>).status as number : 500;
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : String(err ?? 'Unknown');
    return NextResponse.json({ success: false, error: { code: 'ERR', message } }, { status });
  }
}

export default importCsvHandler;
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Clean, single-module import CSV handler used as a generated stub.
 * Keeps behavior compatible with the original route for tests.
 */
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

    // JSON rows
    if (ct.includes('application/json')) {
      const body = await req.json();
      const { ImportRowsSchema } = await import('@/lib/validation/schemas');
      const parsed = ImportRowsSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });

      const rows = parsed.data.rows as Record<string, unknown>[];
      const stableKeysFromBody = Array.isArray(body?.stableKeys) ? body.stableKeys : typeof body?.stableKeys === 'string' ? String(body.stableKeys).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined;
      const stableKeys = stableKeysQuery ? stableKeysQuery.split(',').map((s) => s.trim()).filter(Boolean) : stableKeysFromBody;

      const { findNodeByStableKeys, upsertNode, getNodeById } = await import('@/services/nodeService');
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
              const found = await findNodeByStableKeys(row, stableKeys);
              if (found.success && found.data) { rowResults.push({ row: i + 1, status: 'would-update', note: 'matched_by_stable_keys' }); summary.updated++; continue; }
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

      return NextResponse.json({ success: true, data: { summary, rows: rowResults } });
    }

    // multipart/form-data CSV
    if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file') as File | null;
      const stableKeysFromForm = form.get('stableKeys') ? String(form.get('stableKeys')) : undefined;
      const stableKeys = stableKeysQuery ? stableKeysQuery.split(',').map((s) => s.trim()).filter(Boolean) : (stableKeysFromForm ? stableKeysFromForm.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
      if (!file) return NextResponse.json({ success: false, error: { code: 'MISSING_FILE', message: 'Form must include a `file` field with CSV.' } }, { status: 400 });
      if (typeof (file as any).size === 'number' && (file as any).size > MAX_UPLOAD_BYTES) return NextResponse.json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'Uploaded file exceeds the 5MB size limit.' } }, { status: 413 });

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

      const { findNodeByStableKeys, upsertNode, getNodeById, updateNode } = await import('@/services/nodeService');
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

          if (dryRun && !(normalized as Record<string, unknown>).id && (stableKeys && stableKeys.length)) { const found = await findNodeByStableKeys(normalized as Record<string, unknown>, stableKeys as string[]); if (found.success && found.data) { summary.updated++; rowResults.push({ row: i + 1, status: 'would-update', note: 'matched_by_stable_keys' }); continue; } }

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

      return NextResponse.json({ success: true, data: { summary, rows: rowResults } });
    }

    return NextResponse.json({ success: false, error: { code: 'INVALID_CONTENT_TYPE', message: 'Use application/json with { rows: [...] } or multipart/form-data with a `file` field.' } }, { status: 400 });
  } catch (err: unknown) {
    const status = typeof err === 'object' && err !== null && 'status' in err ? (err as Record<string, unknown>).status as number : 500;
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Unknown';
    return NextResponse.json({ success: false, error: { code: 'ERR', message } }, { status });
  }
}

export default importCsvHandler;
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Server stub for POST /api/import/csv
 *
 * This copied implementation normalises JSON `rows` and multipart `file` uploads,
 * and preserves the original route behavior so tests and the real route can
 * forward to this stub.
 */
export async function importCsvHandler(req: Request): Promise<Response> {
  try {
    const user = await (await import('@/lib/authMiddleware')).requirePermission(req, 'nodes:create');
    const ct = req.headers.get('content-type') || '';
    const url = new URL(req.url);
    const dryRun = url.searchParams.get('dryRun') === 'true';
    const stableKeysQuery = url.searchParams.get('stableKeys') ?? undefined;

    // Helper to parse CSV text using csv-parse when available, otherwise fallback
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
      } catch (err) {
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
        if (lines.length === 0) return [];
        const headers = lines[0].split(',').map((h) => h.trim());
        return lines.slice(1).map((line) => {
          const cols = line.split(',');
          const row: Record<string, string | null> = {};
          for (let i = 0; i < headers.length; i++) {
            row[headers[i]] = cols[i] === '' ? null : (cols[i] ?? null);
          }
          return row;
        });
      }
    }

    // Accept JSON body with { rows: [...] }
    if (ct.includes('application/json')) {
      const body = await req.json();
      const { ImportRowsSchema } = await import('@/lib/validation/schemas');
      const parsed = ImportRowsSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });
      }

      const rows = parsed.data.rows as Record<string, unknown>[];
      const stableKeysFromBody = Array.isArray(body?.stableKeys) ? body.stableKeys : typeof body?.stableKeys === 'string' ? String(body.stableKeys).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined;
      const stableKeys = stableKeysQuery ? stableKeysQuery.split(',').map((s) => s.trim()).filter(Boolean) : stableKeysFromBody;

      const { findNodeByStableKeys, upsertNode, getNodeById, updateNode } = await import('@/services/nodeService');
      const summary = { processed: rows.length, created: 0, updated: 0, errors: 0 };
      const rowResults: unknown[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as Record<string, unknown>;
        try {
          if (dryRun) {
            if (row.id) {
              const existing = await getNodeById(String(row.id));
              if (existing.success && existing.data) {
                rowResults.push({ row: i + 1, status: 'would-update' });
                summary.updated++;
                continue;
              }
            }

            if (!row.id && (stableKeys && stableKeys.length)) {
              const found = await findNodeByStableKeys(row, stableKeys);
              if (found.success && found.data) {
                rowResults.push({ row: i + 1, status: 'would-update', note: 'matched_by_stable_keys' });
                summary.updated++;
                continue;
              }
            }

            const { NodeCreateSchema } = await import('@/lib/validation/schemas');
            const parsedCreate = NodeCreateSchema.safeParse(row as unknown);
            if (!parsedCreate.success) {
              summary.errors++;
              rowResults.push({ row: i + 1, status: 'error', code: 'VALIDATION_ERROR', message: parsedCreate.error.flatten() });
            } else {
              rowResults.push({ row: i + 1, status: 'would-create' });
              summary.created++;
            }
            continue;
          }

          // Non-dry-run: upsert
          const stableKeysForRow = stableKeys && stableKeys.length ? stableKeys : undefined;
          const upsertRes = await upsertNode(user, row as Record<string, unknown>, stableKeysForRow);
          const hasId = !!row.id;
          const hasStableKeyVal = Array.isArray(stableKeysForRow) && stableKeysForRow.some((k) => (row as Record<string, unknown>)[k]);
          if (upsertRes.success) {
            if (hasId || hasStableKeyVal) {
              summary.updated++;
              rowResults.push({ row: i + 1, status: 'updated' });
            } else {
              summary.created++;
              rowResults.push({ row: i + 1, status: 'created' });
            }
          } else {
            summary.errors++;
            rowResults.push({ row: i + 1, status: 'error', code: upsertRes.error?.code ?? 'IMPORT_ERROR', message: upsertRes.error?.message ?? 'upsert failed' });
          }
        } catch (e: unknown) {
          summary.errors++;
          const message = typeof e === 'object' && e !== null && 'message' in e && typeof (e as Record<string, unknown>).message === 'string' ? (e as Record<string, unknown>).message as string : 'unknown';
          rowResults.push({ row: i + 1, status: 'error', code: 'IMPORT_ERROR', message });
        }
      }

      return NextResponse.json({ success: true, data: { summary, rows: rowResults } });
    }

    // Multipart/form-data: expect `file` field with CSV
    if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file') as File | null;
      const stableKeysFromForm = form.get('stableKeys') ? String(form.get('stableKeys')) : undefined;
      const stableKeys = stableKeysQuery ? stableKeysQuery.split(',').map((s) => s.trim()).filter(Boolean) : (stableKeysFromForm ? stableKeysFromForm.split(',').map((s) => s.trim()).filter(Boolean) : undefined);

      if (!file) {
        return NextResponse.json({ success: false, error: { code: 'MISSING_FILE', message: 'Form must include a `file` field with CSV.' } }, { status: 400 });
      }

      if (typeof (file as any).size === 'number' && (file as any).size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'Uploaded file exceeds the 5MB size limit.' } }, { status: 413 });
      }

      let records: Record<string, string | null>[] = [];
      const webStream = (file as any).stream?.();
      if (webStream && typeof Readable.fromWeb === 'function') {
        const nodeStream = Readable.fromWeb(webStream as any) as NodeJS.ReadableStream;
        const csv = await import('csv-parse');
        const parser = (csv as any).parse({ columns: true, relax_quotes: true, skip_empty_lines: true, trim: true });
        const recs: Record<string, string | null>[] = [];
        await new Promise<void>((resolve, reject) => {
          nodeStream.pipe(parser as any)
            .on('data', (r: any) => recs.push(r))
            .on('end', () => resolve())
            .on('error', (err: unknown) => reject(err));
        });
        records = recs;
      } else {
        const text = await file.text();
        records = await parseCsvText(text);
      }

      // Normalize keys
      const rows = records.map((r) => {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(r)) {
          const key = String(k).trim();
          const normalizedKey = key.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
          out[normalizedKey] = v === '' ? undefined : v;
        }
        return out;
      });

      const { findNodeByStableKeys, upsertNode, getNodeById, updateNode } = await import('@/services/nodeService');
      const { NodeCreateSchema } = await import('@/lib/validation/schemas');
      const summary = { processed: rows.length, created: 0, updated: 0, errors: 0 };
      const rowResults: unknown[] = [];

      for (let i = 0; i < rows.length; i++) {
        const normalized = rows[i];
        try {
          if ((normalized as Record<string, unknown>).id) {
            const existing = await getNodeById(String((normalized as Record<string, unknown>).id));
            if (existing.success && existing.data) {
              if (dryRun) {
                summary.updated++;
                rowResults.push({ row: i + 1, status: 'would-update' });
                continue;
              }
              await updateNode(user, String((normalized as Record<string, unknown>).id), normalized as Record<string, unknown>);
              summary.updated++;
              rowResults.push({ row: i + 1, status: 'updated' });
              continue;
            }
          }

          if (dryRun && !(normalized as Record<string, unknown>).id && (stableKeys && stableKeys.length)) {
            const found = await findNodeByStableKeys(normalized as Record<string, unknown>, stableKeys as string[]);
            if (found.success && found.data) {
              summary.updated++;
              rowResults.push({ row: i + 1, status: 'would-update', note: 'matched_by_stable_keys' });
              continue;
            }
          }

          const toCreate: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(normalized)) {
            if (v !== undefined) toCreate[k] = v;
          }

          const parsedCreate = NodeCreateSchema.safeParse(toCreate as unknown);
          if (!parsedCreate.success) {
            summary.errors++;
            rowResults.push({ row: i + 1, status: 'error', code: 'VALIDATION_ERROR', message: parsedCreate.error.flatten() });
            continue;
          }

          if (dryRun) {
            summary.created++;
            rowResults.push({ row: i + 1, status: 'would-create' });
            continue;
          }

          const upsertRes = await upsertNode(user, parsedCreate.data as Record<string, unknown>, stableKeys as string[] | undefined);
          const hasStableKeyVal = Array.isArray(stableKeys) && stableKeys.some((k) => (parsedCreate.data as Record<string, unknown>)[k]);
          if (upsertRes.success) {
            if ((parsedCreate.data as Record<string, unknown>).id || hasStableKeyVal) {
              summary.updated++;
              rowResults.push({ row: i + 1, status: 'updated' });
            } else {
              summary.created++;
              rowResults.push({ row: i + 1, status: 'created' });
            }
          } else {
            summary.errors++;
            rowResults.push({ row: i + 1, status: 'error', code: upsertRes.error?.code ?? 'IMPORT_ERROR', message: upsertRes.error?.message ?? 'upsert failed' });
          }
        } catch (e: unknown) {
          summary.errors++;
          const message = typeof e === 'object' && e !== null && 'message' in e && typeof (e as Record<string, unknown>).message === 'string' ? (e as Record<string, unknown>).message as string : 'unknown';
          rowResults.push({ row: i + 1, status: 'error', code: 'IMPORT_ERROR', message });
        }
      }

      return NextResponse.json({ success: true, data: { summary, rows: rowResults } });
    }

    return NextResponse.json({ success: false, error: { code: 'INVALID_CONTENT_TYPE', message: 'Use application/json with { rows: [...] } or multipart/form-data with a `file` field.' } }, { status: 400 });
  } catch (err: unknown) {
    const status = typeof err === 'object' && err !== null && 'status' in err ? (err as Record<string, unknown>).status as number : 500;
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Unknown';
    return NextResponse.json({ success: false, error: { code: 'ERR', message } }, { status });
  }
}

export default importCsvHandler;
import { NextResponse } from 'next/server';
export default importCsvHandler;
              if (dryRun) {
                summary.updated++;
                rowResults.push({ row: i + 1, status: 'would-update' });
                continue;
              }
              await updateNode(user, (normalized as Record<string, unknown>).id as string, normalized as Record<string, unknown>);
              summary.updated++;
              rowResults.push({ row: i + 1, status: 'updated' });
              continue;
            }
          }

          // Dry-run: attempt stable-key lookup if configured
          if (dryRun && !(normalized as Record<string, unknown>).id && (stableKeys && stableKeys.length)) {
            const { findNodeByStableKeys } = await import('@/services/nodeService');
            const found = await findNodeByStableKeys(normalized as Record<string, unknown>, stableKeys);
            if (found.success && found.data) {
              summary.updated++;
              rowResults.push({ row: i + 1, status: 'would-update', note: 'matched_by_stable_keys' });
              continue;
            }
          }

          // Create/Upsert: remove undefined fields before insert/upsert
          const toCreate: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(normalized)) {
            if (v !== undefined) toCreate[k] = v;
          }

          // Validate create payload
          const { NodeCreateSchema } = await import('@/lib/validation/schemas');
          const parsedCreate = NodeCreateSchema.safeParse(toCreate as unknown);
          if (!parsedCreate.success) {
            summary.errors++;
            rowResults.push({ row: i + 1, status: 'error', code: 'VALIDATION_ERROR', message: parsedCreate.error.flatten() });
            continue;
          }

          if (dryRun) {
            summary.created++;
            rowResults.push({ row: i + 1, status: 'would-create' });
            continue;
          }

          // Non-dry-run: use upsert with optional stableKeys per-upload
          const { upsertNode } = await import('@/services/nodeService');
          const upsertRes = await upsertNode(user, parsedCreate.data as Record<string, unknown>, stableKeys);
          const hasStableKeyVal = Array.isArray(stableKeys) && stableKeys.some((k) => (parsedCreate.data as Record<string, unknown>)[k]);
          if (upsertRes.success) {
            if ((parsedCreate.data as Record<string, unknown>).id || hasStableKeyVal) {
              summary.updated++;
              rowResults.push({ row: i + 1, status: 'updated' });
            } else {
              summary.created++;
              rowResults.push({ row: i + 1, status: 'created' });
            }
          } else {
            summary.errors++;
            rowResults.push({ row: i + 1, status: 'error', code: upsertRes.error?.code ?? 'IMPORT_ERROR', message: upsertRes.error?.message ?? 'upsert failed' });
          }
        } catch (e: unknown) {
          summary.errors++;
          const message = typeof e === 'object' && e !== null && 'message' in e && typeof (e as Record<string, unknown>).message === 'string' ? (e as Record<string, unknown>).message as string : 'unknown';
          rowResults.push({ row: i + 1, status: 'error', code: 'IMPORT_ERROR', message });
        }
      }

      return NextResponse.json({ success: true, data: { summary, rows: rowResults } });
    }

    return NextResponse.json({ success: false, error: { code: 'INVALID_CONTENT_TYPE', message: 'Use application/json with { rows: [...] } or multipart/form-data with a `file` field.' } }, { status: 400 });
  } catch (err: unknown) {
    const status = typeof err === 'object' && err !== null && 'status' in err ? (err as Record<string, unknown>).status as number : 500;
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Unknown';
    return NextResponse.json({ success: false, error: { code: 'ERR', message } }, { status });
  }
}

export default importCsvHandler;
/**
 * Server stub for POST /api/import/csv
 *
 * This is a small example showing how to wire a Next.js App Router route handler
 * or a simple fetch-handler to process both JSON `rows` and multipart `file` uploads.
 * Replace the internals with real validation and persistence.
 */

import type { Row, RowResult, ImportResponse } from './apiClient';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export async function importCsvHandler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === 'true';
  const stableKeysParam = url.searchParams.get('stableKeys') ?? undefined;

  const contentType = request.headers.get('content-type') ?? '';
  let rows: Row[] = [];

  try {
    if (contentType.includes('application/json')) {
      const body = await request.json();
      rows = Array.isArray(body.rows) ? body.rows : [];
    } else if (contentType.includes('multipart/form-data')) {
      // Parse multipart/form-data using the Web Request env's formData API
      const form = await request.formData();
      const fileField = form.get('file') as File | null;
      if (!fileField) {
        return new Response(JSON.stringify({ error: 'no file field provided' }), { status: 400 });
      }

      // Enforce size limit when available
      // `fileField.size` is available in recent runtimes
      const size = (fileField as any).size ?? undefined;
      if (typeof size === 'number' && size > MAX_UPLOAD_BYTES) {
        return new Response(JSON.stringify({ error: 'file too large' }), { status: 413 });
      }

      const text = await fileField.text();

      // Try to use csv-parse/sync if available, otherwise fallback to a simple parser
      try {
        // dynamic import so this stub doesn't hard-fail if dependency missing
        const mod = await import('csv-parse/sync');
        const parse = (mod as any).parse ?? (mod as any).default ?? mod;
        const records = parse(text, { columns: true, skip_empty_lines: true, trim: true });
        rows = (records as any[]).map(rec => {
          const row: Row = {};
          for (const k of Object.keys(rec)) {
            const v = rec[k];
            row[String(k).trim()] = v === '' ? null : (v == null ? null : String(v));
          }
          return row;
        });
      } catch (err) {
        // Fallback naive CSV parser: splits on lines and commas
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
        if (lines.length === 0) {
          rows = [];
        } else {
          const headers = lines[0].split(',').map(h => h.trim());
          rows = lines.slice(1).map(line => {
            /**
             * Migrated original import route implementation into a generated stub so route forwarding
             * can reuse the same logic and keep tests and behavior intact.
             */

            import { NextResponse } from 'next/server';
            import { createNode, updateNode, getNodeById } from '@/services/nodeService';
            import { requirePermission } from '@/lib/authMiddleware';
            import { parse } from 'csv-parse';
            import { Readable } from 'stream';

            export async function importCsvHandler(req: Request) {
              try {
                const user = await requirePermission(req, 'nodes:create');
                const ct = req.headers.get('content-type') || '';
                const url = new URL(req.url);
                const dryRun = url.searchParams.get('dryRun') === 'true';
                // Max upload size for CSV imports (5 MB)
                const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
                // stableKeys may be provided per-upload via query param, JSON body field, or form field
                const stableKeysQuery = url.searchParams.get('stableKeys');

                // For MVP accept JSON array of rows for simplicity: { rows: [{ id, type, name, ... }, ...] }
                if (ct.includes('application/json')) {
                  const body = await req.json();
                  const stableKeysFromBody = Array.isArray(body?.stableKeys) ? body.stableKeys : typeof body?.stableKeys === 'string' ? String(body.stableKeys).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined;
                  const { ImportRowsSchema } = await import('@/lib/validation/schemas');
                  const parsed = ImportRowsSchema.safeParse(body);
                  if (!parsed.success) {
                    return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });
                  }
                  const rows = parsed.data.rows;
                  const stableKeys = stableKeysQuery ? stableKeysQuery.split(',').map((s) => s.trim()).filter(Boolean) : stableKeysFromBody;
                  const summary = { processed: rows.length, created: 0, updated: 0, errors: 0 };
                  const rowResults: unknown[] = [];

                  for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    try {
                      if (dryRun) {
                        if (row.id) {
                          const existing = await getNodeById(row.id);
                          if (existing.success && existing.data) {
                            rowResults.push({ row: i + 1, status: 'would-update' });
                            summary.updated++;
                            continue;
                          }
                        }
                        // attempt stable-key lookup in dry-run if stableKeys configured
                        if (!row.id && (stableKeys && stableKeys.length)) {
                          const { findNodeByStableKeys } = await import('@/services/nodeService');
                          const found = await findNodeByStableKeys(row as Record<string, unknown>, stableKeys);
                          if (found.success && found.data) {
                            rowResults.push({ row: i + 1, status: 'would-update', note: 'matched_by_stable_keys' });
                            summary.updated++;
                            continue;
                          }
                        }
                        const { NodeCreateSchema } = await import('@/lib/validation/schemas');
                        const parsedCreate = NodeCreateSchema.safeParse(row as unknown);
                        if (!parsedCreate.success) {
                          summary.errors++;
                          rowResults.push({ row: i + 1, status: 'error', code: 'VALIDATION_ERROR', message: parsedCreate.error.flatten() });
                        } else {
                          rowResults.push({ row: i + 1, status: 'would-create' });
                          summary.created++;
                        }
                        continue;
                      }

                      // Non-dry-run: prefer upsert when available, using per-upload stableKeys override if provided
                      const { upsertNode } = await import('@/services/nodeService');
                      const stableKeysForRow = stableKeys && stableKeys.length ? stableKeys : undefined;
                      const upsertRes = await upsertNode(user, row as Record<string, unknown>, stableKeysForRow);
                      // Heuristic for summary: if row had an explicit id or it includes any stableKey value, count as update; else create
                      const hasId = !!row.id;
                      const hasStableKeyVal = Array.isArray(stableKeysForRow) && stableKeysForRow.some((k) => (row as Record<string, unknown>)[k]);
                      if (upsertRes.success) {
                        if (hasId || hasStableKeyVal) {
                          summary.updated++;
                          rowResults.push({ row: i + 1, status: 'updated' });
                        } else {
                          summary.created++;
                          rowResults.push({ row: i + 1, status: 'created' });
                        }
                      } else {
                        summary.errors++;
                        rowResults.push({ row: i + 1, status: 'error', code: upsertRes.error?.code ?? 'IMPORT_ERROR', message: upsertRes.error?.message ?? 'upsert failed' });
                      }
                    } catch (e: unknown) {
                      summary.errors++;
                      const message = typeof e === 'object' && e !== null && 'message' in e && typeof (e as Record<string, unknown>).message === 'string' ? (e as Record<string, unknown>).message as string : 'unknown';
                      rowResults.push({ row: i + 1, status: 'error', code: 'IMPORT_ERROR', message });
                    }
                  }

                  return NextResponse.json({ success: true, data: { summary, rows: rowResults } });
                }

                // Support multipart/form-data CSV uploads: expect a `file` field with CSV content.
                if (ct.includes('multipart/form-data')) {
                  // Parse form data and extract file
                  // Use the WHATWG FormData support on the Request object
                  const form = await req.formData();
                  const file = form.get('file') as File | null;
                  const stableKeysFromForm = form.get('stableKeys') ? String(form.get('stableKeys')) : undefined;
                  const stableKeys = stableKeysQuery ? stableKeysQuery.split(',').map((s) => s.trim()).filter(Boolean) : (stableKeysFromForm ? stableKeysFromForm.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
                  if (!file) {
                    return NextResponse.json({ success: false, error: { code: 'MISSING_FILE', message: 'Form must include a `file` field with CSV.' } }, { status: 400 });
                  }

                  // Enforce max file size to avoid OOM on large uploads
                  if (typeof (file as any).size === 'number' && (file as any).size > MAX_UPLOAD_BYTES) {
                    return NextResponse.json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'Uploaded file exceeds the 5MB size limit.' } }, { status: 413 });
                  }

                  // Prefer streaming parsing when available to handle large files and embedded newlines.
                  let rows: Record<string, string>[] = [];
                  const webStream = (file as any).stream?.();
                  if (webStream && typeof Readable.fromWeb === 'function') {
                    // Convert WHATWG ReadableStream to Node Readable
                    const nodeStream = Readable.fromWeb(webStream as any) as NodeJS.ReadableStream;
                    const parser = parse({ columns: true, relax_quotes: true, skip_empty_lines: true, trim: true });
                    // Pipe and collect records
                    const records: Record<string, string>[] = [];
                    await new Promise<void>((resolve, reject) => {
                      nodeStream.pipe(parser as any)
                        .on('data', (rec: Record<string, string>) => records.push(rec))
                        .on('end', () => resolve())
                        .on('error', (err: unknown) => reject(err));
                    });
                    rows = records;
                  } else {
                    // Fallback: read text and parse with csv-parse (sync-like via callback)
                    const text = await file.text();
                    await new Promise<void>((resolve, reject) => {
                      const records: Record<string, string>[] = [];
                      parse(text, { columns: true, relax_quotes: true, skip_empty_lines: true, trim: true })
                        .on('readable', function (this: any) {
                          let record;
                          // eslint-disable-next-line no-cond-assign
                          while ((record = this.read())) records.push(record as Record<string, string>);
                        })
                        .on('error', (err: unknown) => reject(err))
                        .on('end', () => {
                          rows = records;
                          resolve();
                        });
                    });
                  }
                  // Normalize header keys to snake_case-ish lower keys to match schema expectations
                  rows = rows.map((r) => {
                    const out: Record<string, string> = {};
                    for (const [k, v] of Object.entries(r)) {
                      const key = k.trim();
                      const normalizedKey = key.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                      out[normalizedKey] = v;
                    }
                    return out;
                  });

                  // load schemas for validation
                  const summary = { processed: rows.length, created: 0, updated: 0, errors: 0 };
                  const rowResults: unknown[] = [];

                  for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    try {
                      // Basic normalization: convert empty strings to undefined so updateNode will skip them
                      const normalized: Record<string, unknown> = {};
                      for (const [k, v] of Object.entries(row)) {
                        // treat empty string as blank
                        normalized[k] = v === '' ? undefined : v;
                      }

                      if ((normalized as Record<string, unknown>).id) {
                        const existing = await getNodeById((normalized as Record<string, unknown>).id as string);
                        if (existing.success && existing.data) {
                          if (dryRun) {
                            summary.updated++;
                            rowResults.push({ row: i + 1, status: 'would-update' });
                            continue;
                          }
                          await updateNode(user, (normalized as Record<string, unknown>).id as string, normalized as Record<string, unknown>);
                          summary.updated++;
                          rowResults.push({ row: i + 1, status: 'updated' });
                          continue;
                        }
                      }

                      // Dry-run: attempt stable-key lookup if configured
                      if (dryRun && !(normalized as Record<string, unknown>).id && (stableKeys && stableKeys.length)) {
                        const { findNodeByStableKeys } = await import('@/services/nodeService');
                        const found = await findNodeByStableKeys(normalized as Record<string, unknown>, stableKeys);
                        if (found.success && found.data) {
                          summary.updated++;
                          rowResults.push({ row: i + 1, status: 'would-update', note: 'matched_by_stable_keys' });
                          continue;
                        }
                      }

                      // Create/Upsert: remove undefined fields before insert/upsert
                      const toCreate: Record<string, unknown> = {};
                      for (const [k, v] of Object.entries(normalized)) {
                        if (v !== undefined) toCreate[k] = v;
                      }

                      // Validate create payload
                      const { NodeCreateSchema } = await import('@/lib/validation/schemas');
                      const parsedCreate = NodeCreateSchema.safeParse(toCreate as unknown);
                      if (!parsedCreate.success) {
                        summary.errors++;
                        rowResults.push({ row: i + 1, status: 'error', code: 'VALIDATION_ERROR', message: parsedCreate.error.flatten() });
                        continue;
                      }

                      if (dryRun) {
                        summary.created++;
                        rowResults.push({ row: i + 1, status: 'would-create' });
                        continue;
                      }

                      // Non-dry-run: use upsert with optional stableKeys per-upload
                      const { upsertNode } = await import('@/services/nodeService');
                      const upsertRes = await upsertNode(user, parsedCreate.data as Record<string, unknown>, stableKeys);
                      const hasStableKeyVal = Array.isArray(stableKeys) && stableKeys.some((k) => (parsedCreate.data as Record<string, unknown>)[k]);
                      if (upsertRes.success) {
                        if ((parsedCreate.data as Record<string, unknown>).id || hasStableKeyVal) {
                          summary.updated++;
                          rowResults.push({ row: i + 1, status: 'updated' });
                        } else {
                          summary.created++;
                          rowResults.push({ row: i + 1, status: 'created' });
                        }
                      } else {
                        summary.errors++;
                        rowResults.push({ row: i + 1, status: 'error', code: upsertRes.error?.code ?? 'IMPORT_ERROR', message: upsertRes.error?.message ?? 'upsert failed' });
                      }
                    } catch (e: unknown) {
                      summary.errors++;
                      const message = typeof e === 'object' && e !== null && 'message' in e && typeof (e as Record<string, unknown>).message === 'string' ? (e as Record<string, unknown>).message as string : 'unknown';
                      rowResults.push({ row: i + 1, status: 'error', code: 'IMPORT_ERROR', message });
                    }
                  }

                  return NextResponse.json({ success: true, data: { summary, rows: rowResults } });
                }

                return NextResponse.json({ success: false, error: { code: 'INVALID_CONTENT_TYPE', message: 'Use application/json with { rows: [...] } or multipart/form-data with a `file` field.' } }, { status: 400 });
              } catch (err: unknown) {
                const status = typeof err === 'object' && err !== null && 'status' in err ? (err as Record<string, unknown>).status as number : 500;
                const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Unknown';
                return NextResponse.json({ success: false, error: { code: 'ERR', message } }, { status });
              }
            }

            export default importCsvHandler;
