import { NextResponse } from 'next/server';
import { createNode, updateNode, getNodeById } from '@/services/nodeService';
import { requirePermission } from '@/lib/authMiddleware';

export async function POST(req: Request) {
  try {
    const user = await requirePermission(req, 'nodes:create');
    const ct = req.headers.get('content-type') || '';
    const url = new URL(req.url);
    const dryRun = url.searchParams.get('dryRun') === 'true';

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

      const text = await file.text();

      // Simple CSV parser that handles quoted fields and double-quote escaping.
      function parseLine(line: string): string[] {
        const out: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
              cur += '"';
              i++; // skip escaped quote
            } else {
              inQuotes = !inQuotes;
            }
          } else if (ch === ',' && !inQuotes) {
            out.push(cur);
            cur = '';
          } else {
            cur += ch;
          }
        }
        out.push(cur);
        return out.map((s) => s.trim());
      }

      function parseCSV(csv: string): Record<string, string>[] {
        const lines = csv.split(/\r\n|\n/);
        if (lines.length === 0) return [];
        // find first non-empty line as header
        let headerLine = '';
        while (lines.length && headerLine.trim() === '') headerLine = lines.shift() ?? '';
        if (!headerLine) return [];
        const headers = parseLine(headerLine).map((h) => h || '');
        const rows: Record<string, string>[] = [];
        for (const l of lines) {
          if (l.trim() === '') continue;
          const cols = parseLine(l);
          const row: Record<string, string> = {};
          for (let i = 0; i < headers.length; i++) {
            const key = headers[i] || `col_${i}`;
            row[key] = cols[i] ?? '';
          }
          rows.push(row);
        }
        return rows;
      }

      let rows = parseCSV(text);
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

    return NextResponse.json({ success: false, error: { code: 'INVALID_CONTENT_TYPE', message: 'Use application/json with { rows: [...] } or multipart/form-data (not implemented).' } }, { status: 400 });
  } catch (err: unknown) {
    const status = typeof err === 'object' && err !== null && 'status' in err ? (err as Record<string, unknown>).status as number : 500;
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Unknown';
    return NextResponse.json({ success: false, error: { code: 'ERR', message } }, { status });
  }
}
