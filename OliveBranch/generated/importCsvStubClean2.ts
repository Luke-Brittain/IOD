import { NextResponse } from 'next/server';
import { Readable } from 'stream';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export default async function importCsvHandler(req: Request): Promise<Response> {
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
            if (!(row as any).id && (stableKeys && stableKeys.length)) {
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
          // debug: log row before upsert
          // eslint-disable-next-line no-console
          console.log('importCsvHandler upsert row:', i + 1, JSON.stringify(row));
          const upsertRes = await upsertNode(user, row as Record<string, unknown>, stableKeysForRow);
          // eslint-disable-next-line no-console
          console.log('importCsvHandler upsertRes:', i + 1, JSON.stringify(upsertRes));
          if (upsertRes.success) {
            const hasId = !!(row as any).id;
            const hasStableKeyVal = Array.isArray(stableKeysForRow) && stableKeysForRow.some((k) => !!(row as Record<string, unknown>)[k]);
            if (hasId || hasStableKeyVal) { rowResults.push({ row: i + 1, status: 'updated' }); summary.updated++; }
            else { rowResults.push({ row: i + 1, status: 'created' }); summary.created++; }
          } else { summary.errors++; rowResults.push({ row: i + 1, status: 'error', code: upsertRes.error?.code ?? 'IMPORT_ERROR', message: upsertRes.error?.message ?? 'upsert failed' }); }
        } catch (e: unknown) { summary.errors++; const message = (e && typeof e === 'object' && 'message' in e) ? (e as any).message : String(e); rowResults.push({ row: i + 1, status: 'error', code: 'IMPORT_ERROR', message }); }
      }

      // debug: log summary for failing tests
      // eslint-disable-next-line no-console
      console.log('importCsvHandler summary (json non-dry):', JSON.stringify(summary));
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
      const updateNode = (svc as any).updateNode;
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

      
