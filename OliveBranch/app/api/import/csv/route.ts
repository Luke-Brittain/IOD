import { NextResponse } from 'next/server';
import { createNode, updateNode, getNodeById } from '@/services/nodeService';
import { requirePermission } from '@/lib/authMiddleware';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

export async function POST(req: Request) {
  try {
    const user = await requirePermission(req, 'nodes:create');
    const ct = req.headers.get('content-type') || '';
    const url = new URL(req.url);
    const dryRun = url.searchParams.get('dryRun') === 'true';
    // Max upload size for CSV imports (5 MB)
    const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

    // For MVP accept JSON array of rows for simplicity: { rows: [{ id, type, name, ... }, ...] }
    if (ct.includes('application/json')) {
      const body = await req.json();
      const { ImportRowsSchema } = await import('@/lib/validation/schemas');
      const parsed = ImportRowsSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });
      }
      const rows = parsed.data.rows;
      const summary = { processed: rows.length, created: 0, updated: 0, errors: 0 };
      const rowResults: unknown[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (row.id) {
            const existing = await getNodeById(row.id);
            if (existing.success && existing.data) {
              if (dryRun) {
                rowResults.push({ row: i + 1, status: 'would-update' });
                summary.updated++;
                continue;
              }
              await updateNode(user, row.id, row);
              summary.updated++;
              rowResults.push({ row: i + 1, status: 'updated' });
              continue;
            }
          }

          if (dryRun) {
            const { NodeCreateSchema } = await import('@/lib/validation/schemas');
            const parsedCreate = NodeCreateSchema.safeParse(row as unknown);
            if (!parsedCreate.success) {
              summary.errors++;
              rowResults.push({ row: i + 1, status: 'error', code: 'VALIDATION_ERROR', message: parsedCreate.error.flatten() });
            } else {
              summary.created++;
              rowResults.push({ row: i + 1, status: 'would-create' });
            }
            continue;
          }

          await createNode(user, row);
          summary.created++;
          rowResults.push({ row: i + 1, status: 'created' });
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

          // Create: remove undefined fields before insert
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

          await createNode(user, parsedCreate.data as Record<string, unknown>);
          summary.created++;
          rowResults.push({ row: i + 1, status: 'created' });
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
